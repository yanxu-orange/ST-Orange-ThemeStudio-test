import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import { newCaption, validateCaptions } from './captions.mjs';
import { newFooterCaption, validateFooterCaptions } from './footer.mjs';
import { newPageHeaderText, normalizePageHeaderScene, createPageHeaderScene } from './page-header-scene.mjs';
import { textItemRules } from './text-layout.mjs';
import { sceneTextRules } from './text-scene.mjs';
import { syncRegionOrder } from './region-layers.mjs';
import { createSchemeModel } from './scheme-model.mjs';
const header = value => { const caption = newCaption(value); delete caption.position; return caption; };
const scene = text => ({ images: [], texts: [text], order: ['text:' + text.id] });

test('horizontal caption scale is optional, bounded, and survives every text model serialization', () => {
  for (const [make, check] of [[header, c => validateCaptions([c], { large: true, header: true })[0]], [newFooterCaption, c => validateFooterCaptions([c], { large: true })[0]], [newPageHeaderText, c => normalizePageHeaderScene(scene(c)).texts[0]]]) {
    const original = make({ id: 'scaled', content: 'SPRING', size: 80, x: 12, y: 30 });
    assert.equal(Object.hasOwn(check(original), 'scaleX'), false);
    for (const scaleX of [.5, .646, .74, .94, 1, 2]) {
      const result = check({ ...original, scaleX });
      assert.equal(result.scaleX, scaleX);
      assert.equal(result.size, 80); assert.equal(result.x, 12); assert.equal(result.y, 30);
      assert.deepEqual(check(JSON.parse(JSON.stringify(result))), result);
    }
    for (const scaleX of [0, .499, 2.001, '1', null, undefined, NaN, Infinity]) assert.throws(() => check({ ...original, scaleX }));
  }
});

test('only caption glyphs scale horizontally with a fixed top-left anchor', () => {
  const caption = header({ id: 'scaled', scaleX: .646 });
  const items = { name: caption, time: caption, 'caption:scaled': caption, 'footer:scaled': caption };
  const selectors = Object.fromEntries(Object.keys(items).map(key => [key, '.' + key.replace(':', '-')]));
  const css = textItemRules(items, selectors, {}, {}, {}, { position: false });
  assert.match(css, /\.caption-scaled\{transform:scaleX\(0.646\)!important;transform-origin:left top!important;/);
  assert.match(css, /\.footer-scaled\{transform:scaleX\(0.646\)!important;/);
  assert.doesNotMatch(css, /\.(?:name|time)\{/);
  delete caption.scaleX;
  assert.equal(textItemRules({ 'caption:scaled': caption }, { 'caption:scaled': '.caption' }, {}, {}, {}, { position: false }), '');
  const { validate, base } = createSchemeModel();
  const config = validate(syncRegionOrder({ ...validate(base), captions: [header({ id: 'scaled', scaleX: .646 })], version: 10, footerCaptions: [] }));
  const clip = sceneTextRules(config, { 'caption:scaled': '.caption' });
  assert.match(clip, /sc-clip-right-cap-scaled.*\/ 0\.646/);
  assert.match(clip, /sc-clip-left-cap-scaled.*\/ 0\.646/);
});

test('page header text preserves its height, type size and coordinates when changing or clearing scale', () => {
  const { document } = parseHTML('<div id="canvas" style="height:100px"><div id="scene"></div></div>');
  const root = document.querySelector('#scene'), renderer = createPageHeaderScene({ document });
  const text = newPageHeaderText({ id: 'scaled', content: 'LETTER', size: 60, x: 8, y: 24, scaleX: .74 });
  renderer.render(root, 'home', scene(text));
  const node = root.firstChild;
  assert.equal(node.style.transform, 'scaleX(0.74)'); assert.equal(node.style.transformOrigin, 'left top');
  assert.equal(node.style.fontSize, '60px'); assert.equal(node.style.left, '8%'); assert.equal(node.style.top, '24px');
  assert.equal(document.querySelector('#canvas').style.height, '100px');
  delete text.scaleX; renderer.render(root, 'home', scene(text));
  assert.equal(root.firstChild, node); assert.equal(node.style.transform, 'scaleX(1)');
  renderer.remove(root);
});
