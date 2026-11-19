import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {exportFilename, requestExportName} from './export-name.mjs';

test('download names preserve Chinese, normalize extensions and disallow unsafe names', () => {
  assert.equal(exportFilename(' 荷塘来信 '), '荷塘来信.json');
  assert.equal(exportFilename('荷塘.JSON.json'), '荷塘.json');
  assert.equal(exportFilename('春/夏:夜*'), '春-夏-夜-.json');
  for (const v of ['', ' .json ', '...', 'CON', 'nul.txt', 'LPT9']) assert.throws(() => exportFilename(v));
});

function fixture() {
  const {document, window} = parseHTML('<html><body><main></main><button id="trigger"></button></body></html>');
  const root = document.querySelector('main'), trigger = document.querySelector('button'); let focused = false; trigger.focus = () => {focused = true;};
  const promise = requestExportName({document, root, trigger});
  return {document, window, root, promise, focused: () => focused};
}
test('confirmation accepts a name and removes dialog without modifying scheme state', async () => {
  const f = fixture(), input = f.root.querySelector('input'); assert.equal(input.value, '绘境方案'); input.value = '花间来信.json';
  f.root.querySelector('form').dispatchEvent(new f.window.Event('submit', {cancelable:true}));
  assert.equal(await f.promise, '花间来信.json'); assert.equal(f.root.querySelector('dialog'), null); assert.equal(f.focused(), true);
});
test('empty name keeps the dialog available, cancellation returns null', async () => {
  const f = fixture(); f.root.querySelector('input').value = ''; f.root.querySelector('form').dispatchEvent(new f.window.Event('submit', {cancelable:true}));
  assert.match(f.root.querySelector('[role=status]').textContent, /填写/); assert.ok(f.root.querySelector('dialog'));
  f.root.querySelector('button').click(); assert.equal(await f.promise, null);
});
test('Escape closes without creating a download name', async () => {
  const f = fixture(), event = new f.window.Event('keydown', {cancelable:true}); Object.defineProperty(event, 'key', {value:'Escape'});
  f.root.querySelector('dialog').dispatchEvent(event); assert.equal(await f.promise, null); assert.equal(event.defaultPrevented, true);
});
