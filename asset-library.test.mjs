import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAssetLibrary, createAssetRecord, ASSET_LIBRARY_DB, ASSET_LIBRARY_STORE} from './asset-library.mjs';

import {indexedDatabase} from './test-support/indexed-db.mjs';

const image = 'data:image/png;base64,YQ==';
const url = 'https://example.com/image?signature=Ab%2FCd&width=20';
const tick = () => new Promise(resolve => setImmediate(resolve));

test('asset records classify sources without rewriting image contents', () => {
  assert.deepEqual(createAssetRecord({name: ' 春天 ', image}, {id: 'first', createdAt: 1}), {id: 'first', name: '春天', image, kind: 'upload', createdAt: 1});
  assert.equal(createAssetRecord({name: 'URL', image: url}).image, url);
  assert.equal(createAssetRecord({image: url}).kind, 'url');
  for (const input of [{image: 'javascript:alert(1)'}, {image, name: ''}, {image, name: 'a'.repeat(81)}]) assert.throws(() => createAssetRecord(input));
  assert.throws(() => createAssetRecord({image}, {id: '../bad', createdAt: 1}));
  assert.throws(() => createAssetRecord({image}, {id: 'good', createdAt: Infinity}));
});

test('library survives new sessions and remains independent of theme saves, imports and deletions', async () => {
  const {factory, controls} = indexedDatabase(); let serial = 0;
  const options = {indexedDB: factory, createId: () => 'asset-' + ++serial, now: () => serial};
  const first = createAssetLibrary(options);
  assert.deepEqual(await first.list(), []);
  const upload = await first.add({name: '上传图片', image});
  const linked = await first.add({name: '远程图片', image: url});
  const unused = await first.add({name: '未使用图片', image: 'data:image/gif;base64,AAAA'});
  assert.equal(controls.opens, 1, 'reuse one lazy connection');
  const theme = {layers: [{image: upload.image}, {image: linked.image}]};
  const exported = JSON.stringify(theme);
  assert.equal(exported.includes(unused.image), false, 'unused library records never enter exports');
  first.close();
  const second = createAssetLibrary(options);
  assert.deepEqual((await second.list()).map(record => record.id), [unused.id, linked.id, upload.id]);
  assert.equal((await second.get(linked.id)).image, url);
  const imported = JSON.parse(exported);
  imported.layers[0].image = '';
  assert.equal((await second.get(upload.id)).image, image, 'theme edits/imports cannot mutate the library');
  await second.remove(upload.id);
  assert.equal(await second.get(upload.id), null);
  assert.equal(theme.layers[0].image, image, 'deleting a library source leaves placed copies intact');
  assert.equal(theme.layers[1].image, url);
  assert.equal((await second.list()).length, 2);
  await assert.rejects(first.list(), error => error.code === 'CLOSED');
  second.close();
});

test('records are isolated from caller mutations and duplicate keys cannot overwrite images', async () => {
  const {factory} = indexedDatabase();
  const library = createAssetLibrary({indexedDB: factory, createId: () => 'same-id', now: () => 1});
  const saved = await library.add({name: 'Original', image}); saved.image = url;
  const records = await library.list(); records[0].name = 'Changed';
  assert.equal((await library.get('same-id')).name, 'Original');
  assert.equal((await library.get('same-id')).image, image);
  await assert.rejects(library.add({name: 'Overwrite', image: url}), error => error.code === 'STORAGE');
  assert.equal((await library.get('same-id')).image, image);
  library.close();
});

test('write success waits for commit and quota/abort errors do not persist records', async () => {
  const {factory, controls} = indexedDatabase(); let serial = 0;
  const library = createAssetLibrary({indexedDB: factory, createId: () => 'asset-' + ++serial});
  controls.holdCommit = true; let resolved = false;
  const pending = library.add({name: 'Pending', image}).then(result => { resolved = true; return result; });
  await tick(); assert.equal(resolved, false); controls.finish();
  const record = await pending; assert.equal(resolved, true); controls.holdCommit = false;
  for (const failure of ['QuotaExceededError', 'AbortError']) {
    controls.failNext = failure;
    await assert.rejects(library.add({name: 'Failed', image}), error => error.code === (failure === 'QuotaExceededError' ? 'QUOTA' : 'STORAGE'));
    assert.deepEqual((await library.list()).map(item => item.id), [record.id]);
  }
  controls.failNext = 'AbortError';
  await assert.rejects(library.remove(record.id));
  assert.equal((await library.get(record.id)).image, image, 'failed deletion rolls back');
  library.close();
});

test('unavailable, blocked and denied storage never claim an in-memory fallback is durable', async () => {
  const missing = createAssetLibrary({indexedDB: null});
  await assert.rejects(missing.list(), error => error.code === 'UNAVAILABLE');
  await assert.rejects(missing.add({image}), error => error.code === 'UNAVAILABLE');
  const {factory, controls} = indexedDatabase();
  const library = createAssetLibrary({indexedDB: factory});
  controls.blocked = true;
  await assert.rejects(library.list(), error => error.code === 'BLOCKED');
  controls.blocked = false; controls.failOpen = true;
  await assert.rejects(library.list(), error => error.code === 'STORAGE');
  controls.failOpen = false;
  assert.deepEqual(await library.list(), [], 'a failed open may be retried');
  library.close();
});

test('invalid library records fail visibly rather than silently dropping stored images', async () => {
  const {factory, databases} = indexedDatabase();
  const library = createAssetLibrary({indexedDB: factory});
  await library.list();
  databases.get(ASSET_LIBRARY_DB).get(ASSET_LIBRARY_STORE).set('bad', {image, name: 'Missing identity', kind: 'upload'});
  await assert.rejects(library.list(), error => error.code === 'INVALID_RECORD');
  library.close();
});
