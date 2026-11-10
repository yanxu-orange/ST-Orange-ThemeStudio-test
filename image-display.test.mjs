import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {createImageDisplay, displayDimensions} from './image-display.mjs';

function fixture({io = false, encode, maxEntries, inspect} = {}) {
  const {document, window} = parseHTML('<html><body></body></html>');
  window.MutationObserver = undefined;
  window.ResizeObserver = undefined;
  let observer;
  window.IntersectionObserver = io ? class { constructor(cb) { this.cb = cb; observer = this; } observe() {} unobserve() {} disconnect() {} } : undefined;
  window.devicePixelRatio = 2;
  window.getComputedStyle = () => ({objectFit: 'cover'});
  const calls = [], revoked = [];
  let next = 0;
  const manager = createImageDisplay({document, maxEntries,
    toBlob: () => new Blob(['master']),
    inspect: inspect || (async () => ({mime: 'image/png', width: 1200, height: 800, animated: false})),
    encode: async (blob, dimensions) => { assert.equal(typeof dimensions.valid, 'function'); calls.push({width: dimensions.width, height: dimensions.height}); return encode ? encode(blob, dimensions) : new Blob(['small']); },
    url: {createObjectURL: () => `blob:test-${++next}`, revokeObjectURL: u => revoked.push(u)}});
  function img(source = 'data:image/png;base64,YQ==', owned = true) {
    const node = document.createElement('img'); node.src = source;
    if (owned) node.setAttribute('data-ltai-display-image', '');
    node.rect = {width: 100, height: 100}; node.getBoundingClientRect = () => node.rect;
    document.body.append(node); return node;
  }
  return {document, manager, calls, revoked, img, visible: node => observer.cb([{target: node, isIntersecting: true}])};
}
test('geometry handles DPR, cover/contain and never upscales', () => {
  assert.deepEqual(displayDimensions(1200, 800, {width: 100, height: 100}, 2, 'cover'), {width: 300, height: 200});
  assert.deepEqual(displayDimensions(1200, 800, {width: 100, height: 100}, 2, 'contain'), {width: 200, height: 134});
  assert.deepEqual(displayDimensions(12, 8, {width: 100, height: 100}, 2), {width: 12, height: 8});
});
test('repeated floors reuse derivative, leave master src intact, upgrade geometry and clean up', async () => {
  const f = fixture(), a = f.img(), b = f.img();
  f.manager.watch(f.document); await f.manager.whenIdle();
  assert.equal(f.calls.length, 1); assert.equal(a.getAttribute('srcset'), b.getAttribute('srcset'));
  assert.equal(a.src, 'data:image/png;base64,YQ==');
  a.rect = {width: 300, height: 300}; f.manager.refresh(); await f.manager.whenIdle();
  assert.equal(f.calls.length, 2); assert.deepEqual(f.calls[1], {width: 900, height: 600});
  assert.equal(a.getAttribute('srcset'), b.getAttribute('srcset')); assert.deepEqual(f.revoked, ['blob:test-1']);
  f.manager.clear(); assert.equal(a.hasAttribute('srcset'), false); assert.equal(f.manager.stats().bytes, 0); assert.equal(f.revoked.length, 2);
});
test('visible-only queue does not decode a whole library', async () => {
  let inspected = 0;
  const f = fixture({io: true, inspect: async () => { inspected++; return {mime: 'image/png', width: 1000, height: 1000}; }});
  const images = Array.from({length: 100}, (_, i) => f.img(`data:image/png;base64,${i}`));
  f.manager.watch(); await f.manager.whenIdle(); assert.equal(inspected, 0);
  f.visible(images[0]); await f.manager.whenIdle(); assert.equal(inspected, 1); assert.equal(f.calls.length, 1);
  f.manager.clear();
});
test('external sources, native images, author srcset/sizes, pictures and animations are untouched', async () => {
  const f = fixture({inspect: async () => ({mime: 'image/png', width: 1200, height: 800, animated: true})});
  const external = f.img('https://example.com/a.png'), native = f.img(undefined, false), animated = f.img();
  const author = f.img(); author.setAttribute('srcset', 'https://example.com/b.png 2x');
  const sizes = f.img(); sizes.setAttribute('sizes', '100vw');
  const gif = f.img('data:image/gif;base64,YQ==');
  f.manager.watch(); await f.manager.whenIdle(); assert.equal(f.calls.length, 0);
  for (const img of [external, native, animated, sizes, gif]) assert.equal(img.hasAttribute('srcset'), false);
  f.manager.clear(); assert.equal(author.getAttribute('srcset'), 'https://example.com/b.png 2x');
});
test('bounded LRU eviction restores originals and revokes URL', async () => {
  const f = fixture({maxEntries: 1}), a = f.img(), b = f.img('data:image/png;base64,Yg==');
  f.manager.watch(); await f.manager.whenIdle();
  assert.equal(f.manager.stats().entries, 1); assert.equal(a.hasAttribute('srcset'), false);
  assert.equal(b.getAttribute('srcset'), 'blob:test-2 1x'); assert.deepEqual(f.revoked, ['blob:test-1']); f.manager.clear();
});
test('clear and source replacement cancel stale encode results', async () => {
  let release, started;
  const ready = new Promise(resolve => { started = resolve; });
  const f = fixture({encode: async () => { started(); await new Promise(resolve => { release = resolve; }); return new Blob(['small']); }});
  const a = f.img(); f.manager.watch(); await ready;
  f.manager.clear(); release(); await f.manager.whenIdle();
  assert.equal(a.hasAttribute('srcset'), false); assert.equal(f.manager.stats().entries, 0); assert.equal(f.revoked.length, 0);
});
test('oversized legacy master and encoding errors preserve originals', async () => {
  const f = fixture({inspect: async () => ({mime: 'image/png', width: 20000, height: 20000})});
  const a = f.img(); f.manager.watch(); await f.manager.whenIdle(); assert.equal(f.calls.length, 0); assert.equal(a.hasAttribute('srcset'), false); f.manager.clear();
  const g = fixture({encode: async () => { throw new Error('decode failure'); }}), b = g.img();
  g.manager.watch(); await g.manager.whenIdle(); assert.equal(b.hasAttribute('srcset'), false); g.manager.clear();
});
test('source changes during encoding cannot apply old pixels', async () => {
  let release, started;
  const ready = new Promise(resolve => { started = resolve; });
  const f = fixture({encode: async () => { started(); await new Promise(resolve => { release = resolve; }); return new Blob(['small']); }});
  const a = f.img(); f.manager.watch(); await ready;
  a.src = 'https://example.com/new.png'; f.manager.refresh(); release(); await f.manager.whenIdle();
  assert.equal(a.src, 'https://example.com/new.png'); assert.equal(a.hasAttribute('srcset'), false); f.manager.clear();
});
test('authored srcset replacement survives cleanup', async () => {
  const f = fixture(), a = f.img(); f.manager.watch(); await f.manager.whenIdle();
  a.setAttribute('srcset', 'https://example.com/author.png 2x'); f.manager.refresh();
  f.manager.clear(); assert.equal(a.getAttribute('srcset'), 'https://example.com/author.png 2x');
});
test('geometry change during encode queues adequate resolution before applying', async () => {
  let release, started, first = true;
  const ready = new Promise(resolve => { started = resolve; });
  const f = fixture({encode: async () => { if (first) { first = false; started(); await new Promise(resolve => { release = resolve; }); } return new Blob(['small']); }});
  const a = f.img(); f.manager.watch(); await ready;
  a.rect = {width: 300, height: 300}; release(); await f.manager.whenIdle();
  assert.equal(f.calls.length, 2); assert.deepEqual(f.calls[1], {width: 900, height: 600}); assert.equal(a.getAttribute('srcset'), 'blob:test-2 1x'); f.manager.clear();
});
test('unrelated streaming text and container styling do not rescan watched roots or images', async () => {
  const f = fixture(), a = f.img();
  const text = f.document.createElement('p'); text.textContent = 'Initial'; f.document.body.append(text);
  let rootScans = 0, measurements = 0;
  const query = f.document.querySelectorAll.bind(f.document);
  f.document.querySelectorAll = (...args) => { rootScans++; return query(...args); };
  a.getBoundingClientRect = () => { measurements++; return a.rect; };
  f.manager.watch(); await f.manager.whenIdle(); await new Promise(resolve => setTimeout(resolve, 0));
  const before = {rootScans, measurements};
  for (let i = 0; i < 20; i++) { text.append(f.document.createTextNode('token')); text.style.width = `${i}px`; text.className = `stream-${i}`; }
  await new Promise(resolve => setTimeout(resolve, 0)); await f.manager.whenIdle();
  assert.deepEqual({rootScans, measurements}, before); assert.equal(f.calls.length, 1); f.manager.clear();
});
test('mutations discover newly added owned images without touching native avatars', async () => {
  const f = fixture(); f.manager.watch();
  const native = f.img(undefined, false), owned = f.img();
  await new Promise(resolve => setTimeout(resolve, 0)); await f.manager.whenIdle();
  assert.equal(f.calls.length, 1); assert.equal(native.hasAttribute('srcset'), false); assert.equal(owned.getAttribute('srcset'), 'blob:test-1 1x');
  owned.remove(); await new Promise(resolve => setTimeout(resolve, 0)); assert.equal(f.manager.stats().watched, 0); f.manager.clear();
});
test('zero-size images are skipped before reading or decoding their source',async()=>{
 let inspected=0;const f=fixture({inspect:async()=>{inspected++;throw Error('should not inspect hidden image');}}),img=f.img();img.rect={width:0,height:0};f.manager.watch();await f.manager.whenIdle();assert.equal(inspected,0);assert.equal(f.calls.length,0);f.manager.clear();
});
