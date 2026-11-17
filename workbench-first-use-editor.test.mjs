import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {indexedDatabase} from './test-support/indexed-db.mjs';
import {createSchemeStorage, APPLIED_SCHEME_KEY} from './scheme-storage.mjs';
import {createSchemeModel} from './scheme-model.mjs';
import {createCustomWorkStorage} from './custom-work-storage.mjs';
import {navigateRegion} from './test-support/editor-navigation.mjs';

const settle = async () => { for (let i = 0; i < 6; i++) await new Promise(resolve => setImmediate(resolve)); };
let generation = 0;
async function boot(width, factory) {
  const {document, window} = parseHTML(`<html><head><style id="custom-style"></style></head><body>
    <div id="extensions_settings"></div><div id="rightNavHolder"><button class="drawer-toggle">角色</button><div class="drawer-content"></div></div>
    <div id="sheld"><div id="chat"></div></div></body></html>`);
  const select = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value');
  Object.defineProperty(window.HTMLSelectElement.prototype, 'value', {get:select.get, set(value) {
    for (const option of this.options) option.toggleAttribute('selected', option.value === String(value));
  }, configurable:true});
  window.innerWidth = width;
  window.innerHeight = 850;
  const values = new Map();
  Object.assign(globalThis, {document, window, indexedDB:factory, localStorage:{getItem:key=>values.get(key), setItem:(key,value)=>values.set(key,value)},
    requestAnimationFrame:()=>1, cancelAnimationFrame:()=>{}, ResizeObserver:class {observe() {} unobserve() {} disconnect() {}}});
  await import(`./index.js?first-use=${++generation}`);
  const shadow = document.querySelector('#orange-theme-lab').shadowRoot;
  const get = selector => {const node = shadow.querySelector(selector); assert.ok(node, selector); return node;};
  const click = selector => get(selector).click();
  const home = () => !get('.flow-overlay').classList.contains('hidden');
  const editing = () => !get('.bar').classList.contains('hidden');
  const setSize = value => {
    navigateRegion(shadow, 'body');
    const input = get('[aria-label="正文字号 数值"]');
    input.value = String(value);
    for (const type of ['input','change']) input.dispatchEvent(new window.Event(type));
  };
  return {document, window, shadow, get, click, home, editing, setSize};
}
const loadScheme = (factory, key) => createSchemeStorage({indexedDB:factory, ...(key ? {key} : {})});
const template = name => {
  const {validate, templates} = createSchemeModel();
  return validate(templates[name]);
};

test('fresh entrance offers the same startup choices on desktop and mobile, then starts edit or preview', async () => {
  const desktop = await boot(1440, indexedDatabase().factory);
  desktop.click('.launcher');
  assert.equal(desktop.home(), true);
  assert.equal(desktop.editing(), false);
  assert.equal(desktop.get('[data-flow=continue]').hidden, true);
  desktop.click('[data-flow=blank]');
  assert.equal(desktop.editing(), true);
  assert.equal(desktop.get('#full-view').textContent, '预览');
  desktop.click('#close');
  await settle();
  assert.equal(desktop.editing(), false);
  assert.equal(desktop.shadow.querySelector('.workbench-exit'), null);

  const {factory} = indexedDatabase();
  const phone = await boot(412, factory);
  phone.document.querySelector('[data-workshop-action=open]').click();
  assert.equal(phone.home(), true);
  phone.click('[data-flow=library]');
  await settle();
  const card = phone.get('[data-work-id=spring] [data-work-action=open]');
  assert.equal(card.textContent, '使用这份作品');
  let confirms = 0;
  phone.window.confirm = () => { confirms++; return true; };
  card.click();
  await settle();
  assert.equal(confirms, 0);
  assert.equal(phone.get('#full-view').textContent, '开始编辑');
  assert.equal(phone.get('#choose-chat').hidden, false);
  let nativeClicks = 0;
  const drawer = phone.document.querySelector('#rightNavHolder .drawer-toggle');
  drawer.addEventListener('click', () => {
    nativeClicks++;
    drawer.nextElementSibling.classList.add('openDrawer');
  });
  phone.click('#choose-chat');
  assert.equal(nativeClicks, 1);
  phone.click('#full-view');
  assert.equal(phone.get('#choose-chat').hidden, true);
  assert.equal(phone.get('#full-view').textContent, '预览');
  phone.click('#full-view');
  assert.equal(phone.get('#full-view').textContent, '继续编辑');
  phone.click('#close');
  assert.equal(phone.get('.workbench-exit').hasAttribute('open'), true);
  phone.click('[data-exit-choice=discard]');
  await settle();
  assert.equal(phone.editing(), false);
  assert.equal(await loadScheme(factory).load(), null);
});

test('file import from the start screen previews before editing without writing a draft', async () => {
  const {factory} = indexedDatabase();
  const ui = await boot(1440, factory);
  ui.click('.launcher');
  ui.click('[data-flow=library]');
  await settle();
  const input = ui.get('#import-file');
  let chooser = 0;
  input.addEventListener('click', () => chooser++);
  ui.click('[data-work-library=import]');
  assert.equal(chooser, 1);
  let finishRead;
  Object.defineProperty(input, 'files', {configurable:true, value:[{text:()=>new Promise(resolve => {finishRead=resolve;})}]});
  input.dispatchEvent(new ui.window.Event('change'));
  ui.click('[data-work-library=close]');
  finishRead(JSON.stringify(template('spring')));
  await settle();
  assert.equal(ui.home(), true, 'leaving the picker cancels its pending import');
  assert.equal(ui.editing(), false);
  ui.click('[data-flow=library]');
  await settle();
  Object.defineProperty(input, 'files', {value:[{text:async()=>JSON.stringify(template('spring'))}]});
  input.dispatchEvent(new ui.window.Event('change'));
  await settle();
  assert.equal(ui.get('.work-library').hidden, true);
  assert.equal(ui.get('#full-view').textContent, '开始编辑');
  assert.equal(await loadScheme(factory).load(), null);
  ui.click('#full-view');
  ui.click('#save-work');
  ui.get('[aria-label="新作品名称"]').value = '取消';
  ui.click('[data-work-library=close]');
  assert.deepEqual(await createCustomWorkStorage({indexedDB:factory}).list(), []);
});

test('exit handles save and stop failures and preserves an independently saved draft on reload', async () => {
  const {factory, controls} = indexedDatabase();
  const draft = loadScheme(factory), applied = loadScheme(factory, APPLIED_SCHEME_KEY);
  await draft.save(JSON.stringify({...template('blank'), fontSize:20}));
  const appliedJson = JSON.stringify({...template('blank'), fontSize:25});
  await applied.save(appliedJson);
  let ui = await boot(1440, factory);
  ui.click('.launcher');
  navigateRegion(ui.shadow,'body');
  assert.equal(ui.get('[aria-label="正文字号 数值"]').value,'20');
  ui.setSize(26);
  ui.click('#close');
  ui.click('[data-exit-choice=stay]');
  assert.equal(ui.editing(), true);
  ui.click('#close');
  ui.click('[data-exit-choice=discard]');
  await settle();
  assert.equal(ui.editing(), false);
  assert.equal(await applied.load(), appliedJson);
  assert.ok(ui.document.getElementById('orange-theme-live-style'));

  ui.click('.launcher');
  ui.setSize(28);
  ui.click('#stop-and-close');
  controls.failNext = 'QuotaExceededError';
  ui.click('[data-exit-choice=save]');
  await settle();
  assert.equal(ui.editing(), true);
  assert.match(ui.get('[data-exit-error]').textContent,/存储空间不足/);
  assert.equal(JSON.parse(await draft.load()).fontSize,20);
  assert.equal(await applied.load(), appliedJson);
  controls.failNext = 'QuotaExceededError';
  ui.click('[data-exit-choice=discard]');
  await settle();
  assert.equal(ui.editing(), true);
  assert.match(ui.get('[data-exit-error]').textContent,/停用美化失败/);
  assert.equal(ui.get('[aria-label="正文字号 数值"]').value,'28');

  ui.click('[data-exit-choice=save]');
  await settle();
  assert.equal(ui.editing(), false);
  assert.equal(JSON.parse(await draft.load()).fontSize,28);
  assert.equal(await applied.load(), null);
  assert.equal(ui.document.getElementById('orange-theme-live-style'), null);
  ui = await boot(412, factory);
  assert.equal(ui.document.getElementById('orange-theme-live-style'), null);
  ui.click('.launcher');
  assert.equal(ui.editing(), true);
  navigateRegion(ui.shadow,'body');
  assert.equal(ui.get('[aria-label="正文字号 数值"]').value,'28');
});

test('edits made while application is writing stay available after returning', async () => {
  const {factory, controls} = indexedDatabase();
  const draft = loadScheme(factory), applied = loadScheme(factory, APPLIED_SCHEME_KEY);
  const ui = await boot(1440, factory);
  ui.click('.launcher');
  ui.click('[data-flow=blank]');
  ui.setSize(22);
  controls.holdCommit = true;
  ui.click('#apply-live');
  await settle();
  const finish = controls.finish;
  assert.ok(finish);
  ui.setSize(27);
  controls.holdCommit = false;
  finish();
  await settle();
  assert.equal(ui.editing(), false);
  assert.equal(JSON.parse(await applied.load()).fontSize, 22);
  assert.equal(await draft.load(), null);
  ui.click('.launcher');
  navigateRegion(ui.shadow, 'body');
  assert.equal(ui.get('[aria-label="正文字号 数值"]').value, '27');
  assert.equal(ui.get('#save-state').textContent, '草稿未保存');
});

test('a newer edit survives a pending stop from a clean applied draft', async () => {
  const {factory, controls} = indexedDatabase();
  const applied = loadScheme(factory, APPLIED_SCHEME_KEY);
  await applied.save(JSON.stringify({...template('blank'), fontSize:25}));
  const second = await boot(1440, factory);
  second.click('.launcher');
  controls.holdCommit = true;
  second.click('#stop-and-close');
  await settle();
  const finish = controls.finish;
  assert.ok(finish);
  assert.equal(second.shadow.querySelector('.workbench-exit'), null, 'initial draft was clean');
  second.setSize(27);
  controls.holdCommit = false;
  finish();
  await settle();
  assert.equal(second.editing(), false);
  assert.equal(await applied.load(), null);
  assert.equal(await loadScheme(factory).load(), null);
  assert.equal(second.document.getElementById('orange-theme-live-style'), null);
  second.click('.launcher');
  navigateRegion(second.shadow, 'body');
  assert.equal(second.get('[aria-label="正文字号 数值"]').value,'27');
});
