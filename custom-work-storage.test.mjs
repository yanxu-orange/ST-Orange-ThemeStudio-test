import { test } from 'node:test';
import assert from 'node:assert/strict';
import { indexedDatabase } from './test-support/indexed-db.mjs';
import { createSchemeStorage } from './scheme-storage.mjs';
import { createCustomWorkStorage, CUSTOM_WORK_DB, CUSTOM_WORK_METADATA, CUSTOM_WORK_CONTENT } from './custom-work-storage.mjs';
const tick = () => new Promise(resolve => setImmediate(resolve));

function fixture() {
  const boundary = indexedDatabase();
  let id = 0, time = 100;
  return { ...boundary, storage: createCustomWorkStorage({ indexedDB: boundary.factory, makeId: () => `work-${++id}`, now: () => ++time }) };
}

test('custom works store multiple named large schemes; listing reads only lightweight metadata', async () => {
  const { storage, controls, databases } = fixture();
  assert.deepEqual(await storage.list(), []);
  const firstJson = JSON.stringify({ image: 'x'.repeat(8 * 1024 * 1024) });
  const secondJson = JSON.stringify({ image: 'y'.repeat(8 * 1024 * 1024) });
  const first = await storage.save({ name: '  第一份  ', json: firstJson });
  const second = await storage.save({ name: '第二份', json: secondJson });
  assert.equal(first.name, '第一份');
  assert.notEqual(first.id, second.id);
  controls.reads.length = 0;
  assert.deepEqual(await storage.list(), [second, first]);
  assert.deepEqual(controls.reads, [{ database: CUSTOM_WORK_DB, store: CUSTOM_WORK_METADATA, kind: 'getAll', key: undefined }]);
  const records = databases.get(CUSTOM_WORK_DB).get(CUSTOM_WORK_METADATA);
  for (const record of records.values()) assert.deepEqual(Object.keys(record).sort(), ['id', 'name', 'updatedAt']);
  controls.reads.length = 0;
  assert.equal(await storage.load(first.id), firstJson);
  assert.deepEqual(controls.reads, [{ database: CUSTOM_WORK_DB, store: CUSTOM_WORK_CONTENT, kind: 'get', key: first.id }]);
  assert.equal(await storage.load(second.id), secondJson);
  assert.equal(await storage.load('missing'), null);
});

test('same-id updates replace only their own work, survive reload, and impose no small work-count cap', async () => {
  const { storage, factory } = fixture();
  const first = await storage.save({ name: 'A', json: 'one' });
  const second = await storage.save({ name: 'B', json: 'two' });
  const changed = await storage.save({ id: first.id, name: 'A 修改', json: 'three' });
  assert.equal(changed.id, first.id);
  assert.ok(changed.updatedAt > second.updatedAt);
  assert.deepEqual(await storage.list(), [changed, second]);
  assert.equal(await storage.load(second.id), 'two');
  for (let index = 0; index < 120; index++) await storage.save({ name: `作品${index}`, json: String(index) });
  const restored = createCustomWorkStorage({ indexedDB: factory });
  assert.equal((await restored.list()).length, 122);
  assert.equal(await restored.load(first.id), 'three');
});

test('content and metadata commit atomically, and failed replacements preserve both previous records', async () => {
  const { storage, controls, databases } = fixture();
  const first = await storage.save({ name: 'Original', json: 'original-content' });
  const db = databases.get(CUSTOM_WORK_DB);
  controls.holdCommit = true;
  let done = false;
  const pending = storage.save({ id: first.id, name: 'Updated', json: 'updated-content' }).then(result => { done = true; return result; });
  await tick();
  assert.equal(done, false);
  assert.deepEqual(db.get(CUSTOM_WORK_METADATA).get(first.id), first);
  assert.equal(db.get(CUSTOM_WORK_CONTENT).get(first.id).json, 'original-content');
  controls.holdCommit = false;
  controls.finish();
  const changed = await pending;
  assert.deepEqual(db.get(CUSTOM_WORK_METADATA).get(first.id), changed);
  assert.equal(await storage.load(first.id), 'updated-content');
  for (const failure of ['QuotaExceededError', 'AbortError']) {
    controls.failNext = failure;
    await assert.rejects(storage.save({ id: first.id, name: 'Discard', json: 'discard-content' }), error => error.name === (failure === 'QuotaExceededError' ? failure : 'WorkStorageError'));
    assert.deepEqual(await storage.list(), [changed]);
    assert.equal(await storage.load(first.id), 'updated-content');
  }
});

test('deleting a work removes its metadata and large content together without affecting drafts or another work', async () => {
  const { storage, factory, controls, databases } = fixture();
  const draft = createSchemeStorage({ indexedDB: factory });
  await draft.save('saved-draft');
  const first = await storage.save({ name: 'A', json: 'one' });
  const second = await storage.save({ name: 'B', json: 'two' });
  controls.failNext = 'AbortError';
  await assert.rejects(storage.remove(first.id));
  assert.deepEqual(await storage.list(), [second, first]);
  assert.equal(await storage.load(first.id), 'one');
  await storage.remove(first.id);
  assert.deepEqual(await storage.list(), [second]);
  assert.equal(await storage.load(first.id), null);
  assert.equal(await storage.load(second.id), 'two');
  assert.equal(await draft.load(), 'saved-draft');
  const db = databases.get(CUSTOM_WORK_DB);
  assert.equal(db.get(CUSTOM_WORK_METADATA).has(first.id), false);
  assert.equal(db.get(CUSTOM_WORK_CONTENT).has(first.id), false);
  await storage.remove('missing');
  assert.deepEqual(await storage.list(), [second]);
});

test('validation and unavailable storage surface errors without writing incomplete records', async () => {
  const { storage, factory, controls } = fixture();
  await assert.rejects(storage.save({ name: '  ', json: 'x' }), /名称/);
  await assert.rejects(storage.save({ name: 'valid', json: {} }), /JSON/);
  await assert.rejects(storage.save({ id: '', name: 'valid', json: 'x' }), /标识/);
  await assert.rejects(storage.load('../bad'), /标识/);
  await assert.rejects(storage.remove(null), /标识/);
  assert.deepEqual(await storage.list(), []);
  const unavailable = createCustomWorkStorage({ indexedDB: null });
  await assert.rejects(unavailable.list(), error => error.name === 'WorkStorageError');
  const blocked = createCustomWorkStorage({ indexedDB: factory, databaseName: 'blocked' });
  controls.blocked = true;
  await assert.rejects(blocked.list(), /占用/);
  controls.blocked = false;
  controls.failOpen = true;
  await assert.rejects(blocked.list(), error => error.name === 'WorkStorageError');
  controls.failOpen = false;
  assert.deepEqual(await blocked.list(), []);
});

test('a request failure in the content store cannot leave partial metadata or overwrite another record', async () => {
  const { storage, databases } = fixture();
  await storage.list();
  const db = databases.get(CUSTOM_WORK_DB);
  db.get(CUSTOM_WORK_CONTENT).set('work-1', { id: 'work-1', json: 'existing-content' });
  await assert.rejects(storage.save({ name: 'New work', json: 'replacement' }), error => error.name === 'WorkStorageError');
  assert.equal(db.get(CUSTOM_WORK_METADATA).has('work-1'), false);
  assert.equal(db.get(CUSTOM_WORK_CONTENT).get('work-1').json, 'existing-content');
});
