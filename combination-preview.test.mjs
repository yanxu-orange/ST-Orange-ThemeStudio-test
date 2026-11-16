import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import { createSchemeModel } from './scheme-model.mjs';
import { createCombinationPreview } from './combination-preview.mjs';
const { validate, templates } = createSchemeModel();
test('combination previews cover all regions without modifying configuration', () => {
 const { document } = parseHTML('<html><body></body></html>');
 const c = validate(structuredClone(templates.blank)), before = structuredClone(c);
 for (const region of ['header','footer','home','page','input','topbar']) {
  const el = createCombinationPreview(document,c,{region,pageId:'settings'});
  assert.equal(el.getAttribute('role'),'img'); assert.ok(el.getAttribute('viewBox'));
 }
 assert.deepEqual(c,before);
});
test('preview text is text, not interpreted markup', () => {
 const { document } = parseHTML('<html><body></body></html>');
 const c = validate(structuredClone(templates.blank));
 c.pageHeaders.settings.title='<script>test</script>';
 const el=createCombinationPreview(document,c,{region:'page',pageId:'settings'});
 assert.equal(el.querySelector('script'),null); assert.ok(el.textContent.includes('<script>'));
});
