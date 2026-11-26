import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import { createSchemeModel } from './scheme-model.mjs';
import { editorStorage, saveEditorScheme } from './test-support/editor-storage.mjs';
import { navigateRegion } from './test-support/editor-navigation.mjs';
import { seedNativeChat, requestNativeFrame, cancelNativeFrame, settleNativeCanvas } from './test-support/native-chat.mjs';

test('card paper edges and the two-color footer separator are editable in their usual regions', async () => {
  const { document, window } = parseHTML('<html><head><style id="custom-style"></style></head><body><div id="sheld"><div id="chat"></div></div></body></html>');
  const selection = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value');
  Object.defineProperty(window.HTMLSelectElement.prototype, 'value', {
    get: selection.get,
    set(value) { for (const option of this.options) option.toggleAttribute('selected', option.value === String(value)); },
    configurable: true,
  });
  const values = new Map();
  Object.assign(globalThis, {
    document, window,
    localStorage: { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) },
    requestAnimationFrame: requestNativeFrame, cancelAnimationFrame: cancelNativeFrame,
    ResizeObserver: class { observe() {} unobserve() {} disconnect() {} },
  });
  window.innerWidth = 390;
  window.innerHeight = 844;
  seedNativeChat(document);
  const store = await editorStorage(JSON.stringify(createSchemeModel().templates.blank));
  await import('./index.js');
  const shadow = document.querySelector('#orange-theme-lab').shadowRoot;
  const query = selector => {
    const node = shadow.querySelector(selector);
    assert.ok(node, selector);
    return node;
  };
  const click = selector => query(selector).click();
  const set = (label, value) => {
    const node = query(`[aria-label="${label}"]`);
    node.value = value;
    node.dispatchEvent(new window.Event('input', { bubbles: true }));
    node.dispatchEvent(new window.Event('change', { bubbles: true }));
  };

  click('.launcher');
  navigateRegion(shadow, 'overall');
  set('卡片边框线型', 'paper');
  set('卡片边框颜色来源', 'custom');
  set('卡片边框颜色 HEX', '#acbee2');

  navigateRegion(shadow, 'footer');
  click('[data-kind="image"]');
  click('#add-current-image');
  click('[data-material-category="shapes"]');
  click('[data-add-shape="ornament-divider"]');
  set('线条颜色 HEX', '#ccd7eb');
  set('星饰颜色 HEX', '#657baa');
  await settleNativeCanvas();

  const saved = await saveEditorScheme(shadow, store);
  assert.equal(saved.cardBorderStyle, 'paper');
  assert.equal(saved.cardBorderColor, '#acbee2');
  const added = saved.layers.at(-1);
  assert.deepEqual([added.shape, added.anchor, added.width, added.widthUnit, added.height, added.color, added.color2],
    ['ornament-divider', 'footer', 100, 'percent', 16, '#ccd7eb', '#657baa']);
  const liveStyle = document.querySelector('#orange-theme-live-style');
  assert.match(liveStyle.textContent, /background-image:url\("data:image\/svg\+xml/);
  const painted = document.querySelector('.otl-footer-image');
  assert.match(decodeURIComponent(painted.getAttribute('src')), /stroke="#ccd7eb".*fill="#657baa"/);
});
