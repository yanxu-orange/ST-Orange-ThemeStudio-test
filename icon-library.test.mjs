import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {createIconLibrary, ICON_LIBRARY_DB, renderIconLibrary} from './icon-library.mjs';
import {createAssetLibrary, ASSET_LIBRARY_DB} from './asset-library.mjs';
import {indexedDatabase} from './test-support/indexed-db.mjs';
const image = 'data:image/png;base64,YQ==';
const tick = () => new Promise(resolve => setImmediate(resolve));
function fixture() {
  const {document, window} = parseHTML('<html><body><main></main></body></html>');
  return {container: document.querySelector('main'), window};
}
function choose(container, window, files) {
  const input = container.querySelector('input');
  Object.defineProperty(input, 'files', {value: files, configurable: true});
  input.dispatchEvent(new window.Event('change'));
}
const file = name => ({name, type: 'image/png'});

test('icon persistence is separate from image assets and deletion cannot break placed copies', async () => {
  const {factory, databases} = indexedDatabase();
  const options = {indexedDB: factory, createId: () => 'same', now: () => 1};
  const icons = createIconLibrary({...options, databaseName: ASSET_LIBRARY_DB});
  const assets = createAssetLibrary(options);
  const icon = await icons.add({name: 'Icon', image});
  await assets.add({name: 'Photo', image});
  assert.deepEqual([...databases.keys()], [ICON_LIBRARY_DB, ASSET_LIBRARY_DB]);
  icons.close();
  const reopened = createIconLibrary(options);
  assert.equal((await reopened.get(icon.id)).name, 'Icon');
  const placed = {image: icon.image};
  await reopened.remove(icon.id);
  assert.equal(placed.image, image);
  assert.equal((await assets.get(icon.id)).name, 'Photo');
  await assert.rejects(createIconLibrary({indexedDB: null}).list(), error => error.code === 'UNAVAILABLE');
  reopened.close(); assets.close();
});

test('built-in groups render local SVG previews and tinted selections', async () => {
  const {container} = fixture(); const selections = [];
  renderIconLibrary(container, {onUse: item => selections.push(item)});
  assert.match(container.textContent, /不会去除不透明背景/);
  assert.ok(container.querySelectorAll('.icon-library-group').length > 0);
  const button = container.querySelector('.icon-library-use');
  assert.match(button.querySelector('img').src, /\.svg/);
  button.click(); await tick();
  assert.equal(selections[0].tint, true); assert.ok(selections[0].icon);
  assert.equal(selections[0].image, undefined);
});

test('batch uploads report partial failure, reject SVG, and use untinted source copies', async () => {
  const {container, window} = fixture(); const records = [], used = [], errors = [];
  const library = {list: async () => [...records], add: async data => {
    if (data.name === 'quota.png') throw new Error('空间不足');
    const record = {...data, id: String(records.length)}; records.push(record); return record;
  }, remove: async id => records.splice(records.findIndex(item => item.id === id), 1)};
  renderIconLibrary(container, {library, tab: 'mine', prepareUpload: async () => ({image}), onUse: value => used.push(value), onError: error => errors.push(error), confirmRemove: () => true});
  await tick();
  choose(container, window, [file('good.png'), file('quota.png'), file('bad.svg')]); await tick();
  assert.match(container.querySelector('[role=status]').textContent, /成功 1 个，失败 2 个/);
  assert.equal(errors.length, 2); assert.equal(records.length, 1);
  container.querySelector('.icon-library-use').click(); await tick();
  assert.deepEqual(used, [{icon: '', image, name: 'good.png', tint: false}]);
  [...container.querySelectorAll('button')].find(node => node.textContent === '删除').click(); await tick();
  assert.equal(records.length, 0); assert.equal(used[0].image, image);
});

test('storage failures provide retry and recover without pretending persistence', async () => {
  const {container} = fixture(); let broken = true;
  renderIconLibrary(container, {tab: 'mine', library: {list: async () => { if (broken) throw new Error('读写失败'); return []; }}});
  await tick(); const retry = [...container.querySelectorAll('button')].find(node => node.textContent === '重新加载图标库');
  assert.equal(retry.hidden, false); assert.match(container.textContent, /读写失败/);
  broken = false; retry.click(); await tick(); assert.equal(retry.hidden, true);
  assert.match(container.textContent, /还没有上传图标/);
});

test('navigation cancels pending upload and prevents old controls applying content', async () => {
  const {container, window} = fixture(); let finish, writes = 0, uses = 0, signal;
  renderIconLibrary(container, {tab: 'mine', library: {list: async () => [{id: 'a', name: 'A', image}], add: async () => writes++},
    prepareUpload: async (file, options) => { signal = options.signal; return new Promise(resolve => {finish = resolve;}); }, onUse: () => uses++});
  await tick(); const old = container.querySelector('.icon-library-use');
  choose(container, window, [file('pending.png')]);
  container.querySelector('[role=tab]').click();
  assert.equal(signal.aborted, true); finish({image}); old.click(); await tick();
  assert.equal(writes, 0); assert.equal(uses, 0); assert.equal(container.querySelector('input'), null);
});

test('late list results and deletion confirmation cannot mutate a replacement view', async () => {
  const {container} = fixture(); let finish, confirm, removes = 0;
  renderIconLibrary(container, {tab: 'mine', library: {list: () => new Promise(resolve => { finish = resolve; })}});
  renderIconLibrary(container, {}); const before = container.textContent;
  finish([{id: 'late', name: 'Late', image}]); await tick(); assert.equal(container.textContent, before);
  const dispose = renderIconLibrary(container, {tab: 'mine', library: {list: async () => [{id: 'x', name: 'X', image}], remove: async () => removes++}, confirmRemove: () => new Promise(resolve => {confirm = resolve;})});
  await tick(); [...container.querySelectorAll('button')].find(node => node.textContent === '删除').click();
  dispose(); confirm(true); await tick(); assert.equal(removes, 0);
});
