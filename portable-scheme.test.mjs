import { test } from 'node:test';
import assert from 'node:assert/strict';
import { portableScheme } from './portable-scheme.mjs';
import { createSchemeModel } from './scheme-model.mjs';
const { templates, validate } = createSchemeModel();

const image = 'data:image/png;base64,AAAA';
test('portable export embeds referenced assets only, deduplicates reads and leaves draft intact', async () => {
  const source = { layers: [{ kind: 'asset', asset: 'one', image: '' }], pageHeaders: { home: { scene: { images: [{ kind: 'asset', asset: 'one', image: '' }] } } }, chrome: { icon: { mode: 'image', asset: 'two', image: '' } }, background: { source: { kind: 'asset', asset: 'two', image: '' } }, canvasWallpaperAsset: 'one' };
  const before = structuredClone(source), reads = [];
  const result = await portableScheme(source, { resolveAsset: id => id, fetchImage: async url => { reads.push(url); return { ok: true, blob: async () => url }; }, encodeImage: async () => image });
  assert.deepEqual(reads, ['one', 'two']); assert.deepEqual(source, before);
  assert.equal(result.layers[0].kind, 'custom'); assert.equal(result.layers[0].asset, '');
  assert.equal(result.pageHeaders.home.scene.images[0].image, image);
  assert.equal(result.chrome.icon.image, image); assert.equal(result.background.source.image, image);
  assert.equal(result.canvasWallpaper, image); assert.equal(result.canvasWallpaperAsset, undefined);
});
test('built-in exported scheme remains importable with images embedded', async () => {
  const result = await portableScheme(templates.spring, { fetchImage: async () => ({ ok: true, blob: async () => null }), encodeImage: async () => image });
  assert.doesNotThrow(() => validate(result));
  assert.ok(JSON.stringify(result).includes(image));
});
test('unreadable assets reject export rather than returning incomplete data', async () => {
  const source = { asset: 'missing', image: '' };
  await assert.rejects(portableScheme(source, { resolveAsset: () => '' }), /找不到素材/);
  await assert.rejects(portableScheme(source, { resolveAsset: () => 'url', fetchImage: async () => ({ ok: false }) }), /素材读取失败/);
  assert.deepEqual(source, { asset: 'missing', image: '' });
});

test('existing custom images and links are preserved without fetching unrelated assets', async () => {
  const source = { icon: { mode: 'image', asset: 'unused', image: 'https://example.com/custom.png' }, canvasWallpaper: image, canvasWallpaperAsset: 'unused' };
  const result = await portableScheme(source, { fetchImage: () => { throw new Error('must not fetch'); } });
  assert.equal(result.icon.image, source.icon.image); assert.equal(result.icon.asset, '');
  assert.equal(result.canvasWallpaper, image);
});
