import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import { createCombinationLibrary } from './combination-library.mjs';
import { createCustomWorkStorage } from './custom-work-storage.mjs';
import { indexedDatabase } from './test-support/indexed-db.mjs';
const settle = async () => { for (let i = 0; i < 8; i++) await new Promise(resolve => setImmediate(resolve)); };
function setup() {
  const { document, window } = parseHTML('<html><body><div id="host"></div></body></html>');
  const shadow = document.querySelector('#host').attachShadow({ mode: 'open' });
  const db = indexedDatabase().factory, stores = new Map(), notices = [];
  const store = region => { if (!stores.has(region)) stores.set(region, createCustomWorkStorage({ indexedDB: db, databaseName: 'combos-' + region })); return stores.get(region); };
  let draft = { value: 1 }, applied, allow = true, confirmation = true, captureHook;
  window.confirm = () => confirmation;
  const hidden = new Map();
  const library = createCombinationLibrary({ visibilityStorage: { getItem: key => hidden.get(key), setItem: (key,value) => hidden.set(key,value) }, shadow, storageForRegion: store, capture: async c => captureHook ? captureHook(c) : { ...draft, region: c.region }, apply: async (combo, c) => { applied = { combo, c }; return allow; }, preview: combo => { const p = document.createElement('span'); p.textContent = String(combo.value); return p; }, builtins: c => c.region === 'home' ? [{ id: 'jinghai-home', name: '京海首页', combination: { region: 'home', value: 9 } }] : [], onMessage: value => notices.push(value) });
  const click = selector => { const node = shadow.querySelector(selector); assert.ok(node, selector); node.click(); };
  const save = async name => { shadow.querySelector('[aria-label="组合名称"]').value = name; click('[data-combo-action="save-current"]'); await settle(); };
  return { library, shadow, store, notices, click, save, get applied() { return applied; }, set draft(v) { draft = v; }, set allow(v) { allow = v; }, set confirmation(v) { confirmation = v; }, set captureHook(v) { captureHook = v; } };
}
const header = { region: 'header', label: '头像区' };
test('regional combinations save, preview, apply, rename and permanently delete independently', async () => {
  const ui = setup(); await ui.library.show(header); await ui.save('头像组合');
  const [first] = await ui.store('header').list(); assert.equal(JSON.parse(await ui.store('header').load(first.id)).value, 1);
  assert.equal(ui.shadow.querySelector('.combination-preview span').textContent, '1');
  ui.click('[data-combo-action="preview"]'); await settle(); assert.equal(ui.shadow.querySelector('.combination-view').hidden, false);
  ui.allow = false; ui.click('[data-combo-action="apply-preview"]'); await settle(); assert.equal(ui.shadow.querySelector('.combination-library').hidden, false);
  ui.allow = true; ui.click('[data-combo-action="apply-preview"]'); await settle(); assert.equal(ui.shadow.querySelector('.combination-library').hidden, true); assert.equal(ui.applied.c.region, 'header');
  await ui.library.show(header); ui.shadow.querySelector('[aria-label="重命名 头像组合"]').value = '新名字'; ui.click('[data-combo-action="rename"]'); await settle(); assert.equal((await ui.store('header').list())[0].name, '新名字');
  ui.draft = { value: 2 }; ui.confirmation = false; ui.click('[data-combo-action="overwrite"]'); await settle(); assert.equal(JSON.parse(await ui.store('header').load(first.id)).value, 1);
  ui.confirmation = true; ui.click('[data-combo-action="overwrite"]'); await settle(); assert.equal(JSON.parse(await ui.store('header').load(first.id)).value, 2);
  await ui.library.show({ region: 'footer', label: '尾部区' }); assert.equal(ui.shadow.querySelectorAll('.combination-item').length, 0);
  await ui.save('尾部组合'); await ui.library.show(header);
  ui.confirmation = false; ui.click('[data-combo-action="delete"]'); await settle(); assert.equal((await ui.store('header').list()).length, 1);
  ui.confirmation = true; ui.click('[data-combo-action="delete"]'); await settle(); assert.equal((await ui.store('header').list()).length, 0); assert.equal((await ui.store('footer').list()).length, 1);
});
test('duplicate names require explicit overwrite or renamed copy and preserve captured content', async () => {
  const ui = setup(); await ui.library.show(header); await ui.save('组合'); ui.draft = { value: 2 }; await ui.save('组合');
  assert.equal((await ui.store('header').list()).length, 1); assert.equal(ui.shadow.querySelector('.combination-conflict').hidden, false);
  ui.draft = { value: 3 }; ui.click('[data-combo-action="rename-duplicate"]'); await settle();
  const entries = await ui.store('header').list(); assert.equal(entries.length, 2); const copy = entries.find(x => x.name === '组合 副本'); assert.equal(JSON.parse(await ui.store('header').load(copy.id)).value, 2);
  await ui.save('组合'); ui.click('[data-combo-action="replace-duplicate"]'); await settle(); const original = (await ui.store('header').list()).find(x => x.name === '组合'); assert.equal(JSON.parse(await ui.store('header').load(original.id)).value, 3);
});
test('built-in stays separate and local clone can be edited without removing original', async () => {
  const ui = setup(); await ui.library.show({ region: 'home', pageId: 'home', label: '首页头部' });
  assert.equal(ui.shadow.querySelectorAll('.combination-item').length, 1); assert.equal(ui.shadow.querySelectorAll('[data-combo-action="delete"]').length, 1);
  ui.click('[data-combo-action="apply"]'); await settle(); assert.equal(ui.applied.combo.value, 9); assert.equal(ui.applied.c.pageId, 'home');
  await ui.library.show({ region: 'home', label: '首页头部' });
  assert.match(ui.shadow.querySelector('.combination-list').textContent, /内置作品可删除，请勿二传，禁止商业化。/);
  ui.click('[data-combo-action="delete"]'); await settle(); ui.library.hide();
  await ui.library.show({ region: 'home', label: '首页头部' }); assert.equal(ui.shadow.querySelectorAll('.combination-item').length, 0);
});
test('dismissed asynchronous capture does not save to a new region or reopen panel', async () => {
  const ui = setup(); let finish; ui.captureHook = () => new Promise(resolve => { finish = resolve; });
  await ui.library.show(header); ui.shadow.querySelector('[aria-label="组合名称"]').value = '延迟'; ui.click('[data-combo-action="save-current"]'); ui.click('[data-combo-action="save-current"]');
  ui.library.hide(); await ui.library.show({ region: 'footer', label: '尾部区' }); finish({ value: 5 }); await settle();
  assert.equal((await ui.store('header').list()).length, 0); assert.equal((await ui.store('footer').list()).length, 0); assert.equal(ui.shadow.querySelector('h2').textContent, '尾部区 · 我的组合');
});
