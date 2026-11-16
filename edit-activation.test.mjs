import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activateEditedRegion } from './edit-activation.mjs';
const config = () => ({chromeStyle:{topbar:{enabled:false},input:{enabled:false}},pageHeaders:{home:{enabled:false}},pageStyle:{presets:{promptList:false}}});
test('an edit activates only its own region and transient previews can restore it', () => {
 for (const ui of [{region:'topbar'}, {region:'input'}, {region:'page-header',page:'home'}, {region:'page-bai',page:'presets',kind:'group'}]) {
  const c=config(), before=structuredClone(c), restore=activateEditedRegion(c,ui);
  assert.notDeepEqual(c,before);restore();assert.deepEqual(c,before);
 }
 const c=config(), before=structuredClone(c);activateEditedRegion(c,{region:'header',page:'chat'});assert.deepEqual(c,before);
 activateEditedRegion(c,{region:'page-content',page:'presets',kind:'tip'});assert.deepEqual(c,before);
});
