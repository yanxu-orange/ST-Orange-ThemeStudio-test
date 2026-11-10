import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validImage, validEmbeddedImage, validImageUrl, normalizeImageUrl, MAX_IMAGE_URL_LENGTH, MAX_IMAGE_DATA_LENGTH} from './image-sources.mjs';

test('image sources accept raster uploads and preserve exact HTTP(S) links', () => {
  for (const format of ['png', 'jpeg', 'webp', 'gif']) {
    const image = `data:image/${format};base64,YQ==`;
    assert.equal(validEmbeddedImage(image), true);
    assert.equal(validImage(image), true);
    assert.equal(validImageUrl(image), false);
  }
  for (const url of ['https://example.com/a.png', 'http://example.com/image', 'HTTPS://Example.com/a%2Fb?signature=one%2Btwo&width=100#part', 'https://例子.测试/图片.webp', 'http://localhost:8000/a.png', 'https://example.com/a(1).png']) {
    assert.equal(validImageUrl(url), true, url);
    assert.equal(validImage(url), true, url);
    assert.equal(normalizeImageUrl(`  ${url} \n`), url, 'do not recode signed URLs or alter casing');
  }
});

test('image URL validation rejects active schemes, credentials and CSS/markup breakouts', () => {
  for (const source of [undefined, null, {}, 42, '', ' ', '//example.com/a.png', '/a.png', 'example.com/a.png', 'javascript:alert(1)', 'blob:https://example.com/id', 'file:///tmp/a.png', 'ftp://example.com/a.png', 'data:text/html;base64,YQ==', 'data:image/svg+xml;base64,YQ==', 'https://', 'http:///example.com/a.png', 'https://example.com:wrong/a.png', 'https://user:password@example.com/a.png', 'https://user@example.com/a.png', 'https://@example.com/a.png', 'https://example.com/a b.png', 'https://example.com/a\nb.png', 'https://example.com/a\u0000b.png', 'https://example.com/a\u0085b.png', 'https://example.com/a\\b.png', 'https://example.com/a"b.png', "https://example.com/a'b.png", 'https://example.com/<svg>.png', ' https://example.com/a.png']) {
    assert.equal(validImageUrl(source), false, String(source));
    assert.equal(validImage(source), false, String(source));
  }
  assert.throws(() => normalizeImageUrl('javascript:alert(1)'), /HTTP\(S\)/);
  assert.equal(validImageUrl('https://example.com/' + 'a'.repeat(MAX_IMAGE_URL_LENGTH)), false);
  assert.equal(validEmbeddedImage('data:image/png;base64,' + 'A'.repeat(MAX_IMAGE_DATA_LENGTH)), false);
  assert.equal(validEmbeddedImage('data:image/png;base64,<script>'), false);
});
