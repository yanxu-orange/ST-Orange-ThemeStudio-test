import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import { createWorkLibrary } from './work-library.mjs';
import { createBuiltinTemplateLibrary } from './builtin-template-library.mjs';
import { createCustomWorkStorage } from './custom-work-storage.mjs';
import { indexedDatabase } from './test-support/indexed-db.mjs';
const settle = async () => { for (let i = 0; i < 6; i++) await new Promise(resolve => setImmediate(resolve)); };

async function setup() {
  const { document, window } = parseHTML('<html><body><div id="host"></div></body></html>');
  const shadow = document.querySelector('#host').attachShadow({ mode: 'open' });
  let confirmed = true;
  window.confirm = () => confirmed;
  const notices = [], values = new Map();
  const builtins = createBuiltinTemplateLibrary({ document, availableIds: ['jinghai', 'spring'], getCurrent: () => 'jinghai', storage: { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) }, onMessage: message => notices.push(message) });
  const store = createCustomWorkStorage({ indexedDB: indexedDatabase().factory });
  let draft = '{"image":"first"}', opened, loads = 0;
  const storage = { ...store, async load(id) { loads++; return store.load(id); } };
  const library = createWorkLibrary({ shadow, builtins, storage, snapshot: () => draft, onOpen: json => { opened = json; return true; }, onBuiltin: id => { opened = id; return true; }, onMessage: message => notices.push(message) });
  const click = selector => { const node = shadow.querySelector(selector); assert.ok(node, selector); node.click(); };
  const saveNew = async title => { shadow.querySelector('[aria-label="新作品名称"]').value = title; click('[data-work-library="save-new"]'); await settle(); };
  return { library, shadow, builtins, store, storage, notices, click, saveNew, get opened() { return opened; }, get loads() { return loads; }, set draft(value) { draft = value; }, set confirmed(value) { confirmed = value; } };
}

test('works library combines built-ins and custom names; only opening loads image-bearing content', async () => {
  const ui = await setup(); await ui.library.show();
  assert.deepEqual([...ui.shadow.querySelectorAll('.work-library-name')].map(node => node.textContent), ['移动-春日来信 内置']);
  assert.equal(ui.shadow.querySelectorAll('img').length, 0);
  assert.equal(ui.shadow.querySelector('.work-library').textContent.includes('恢复内置作品'), false);
  assert.ok(ui.shadow.querySelector('.work-library').textContent.includes('内置作品可删除，请勿二传，禁止商业化。'));
  assert.equal(ui.shadow.querySelector('.work-library').textContent.includes('每份作品独立保存在当前浏览器'), false);
  assert.equal(ui.shadow.querySelectorAll('[data-work-tab]').length, 0);
  await ui.saveNew('第一份'); ui.draft = '{"image":"second"}'; await ui.saveNew('第二份');
  let items = await ui.store.list(); assert.equal(items.length, 2); assert.equal(ui.loads, 0);
  const first = items.find(item => item.name === '第一份');
  assert.equal(await ui.store.load(first.id), '{"image":"first"}');
  ui.click(`[data-work-id="${first.id}"] [data-work-action="open"]`); await settle();
  assert.equal(ui.opened, '{"image":"first"}'); assert.equal(ui.loads, 1);
  assert.equal(ui.shadow.querySelector('.work-library').hidden, true);
  await ui.library.show();
  ui.draft = '{"image":"replacement"}';
  ui.confirmed = false; ui.click(`[data-work-id="${first.id}"] [data-work-action="save"]`); await settle();
  assert.equal(await ui.store.load(first.id), '{"image":"first"}');
  ui.confirmed = true; ui.click(`[data-work-id="${first.id}"] [data-work-action="save"]`); await settle();
  assert.equal(await ui.store.load(first.id), '{"image":"replacement"}');
  assert.equal((await ui.store.list()).length, 2, 'overwrite does not add a new work');
  ui.click(`[data-work-id="${first.id}"] [data-work-action="delete"]`); await settle();
  assert.equal(await ui.store.load(first.id), null); assert.equal((await ui.store.list()).length, 1);
  ui.click('[data-work-id="spring"] [data-work-action="delete"]'); await settle();
  assert.deepEqual(ui.builtins.list(), []);
  assert.match(ui.notices.at(-1), /本机内置列表/);
  assert.equal((await ui.store.list()).length, 1, 'builtin removal leaves custom works alone');
});

test('invalid names and failed storage writes are visible without discarding existing works', async () => {
  const ui = await setup(); await ui.library.show();
  await ui.saveNew(' '); assert.equal((await ui.store.list()).length, 0); assert.match(ui.notices.at(-1), /填写作品名称/);
  await ui.saveNew('保留');
  ui.storage.save = async () => { throw new Error('quota'); };
  await ui.saveNew('失败');
  assert.equal((await ui.store.list()).length, 1); assert.match(ui.notices.at(-1), /quota/);
  assert.equal(ui.shadow.querySelector('[data-work-library="save-new"]').disabled, false);
});

test('closing while a named work loads does not later replace the draft', async () => {
  const ui = await setup(); await ui.library.show(); await ui.saveNew('大图');
  let resolve; ui.storage.load = () => new Promise(done => { resolve = done; });
  ui.click('.work-library-item:last-child [data-work-action="open"]'); ui.click('[data-work-library="close"]');
  resolve('{"image":"late"}'); await settle(); assert.equal(ui.opened, undefined);
});
