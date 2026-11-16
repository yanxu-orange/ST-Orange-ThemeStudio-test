import { createSchemeModel } from './scheme-model.mjs';
import { settleSchemeApplication } from './test-support/editor-storage.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {BODY_CARD_DEFAULTS,bodyCardSettings} from './body-card.mjs';
import {navigateRegion} from './test-support/editor-navigation.mjs';
import {editorStorage,saveEditorScheme} from './test-support/editor-storage.mjs';
import {seedNativeChat,requestNativeFrame,cancelNativeFrame,settleNativeCanvas} from './test-support/native-chat.mjs';

test('new schemes use 16px gutters and templates preserve their configured gutters',async()=>{
  for(const settings of [BODY_CARD_DEFAULTS,bodyCardSettings()]){
    assert.equal(settings.bodyPaddingLeft,10);
    assert.equal(settings.bodyPaddingRight,10);
  }
  const {document,window}=parseHTML('<html><head><style id="custom-style"></style></head><body><div id="sheld"><div id="chat"></div></div></body></html>');
  const selectValue=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');
  Object.defineProperty(window.HTMLSelectElement.prototype,'value',{
    get:selectValue.get,
    set(value){for(const option of this.options)option.toggleAttribute('selected',option.value===String(value));},
    configurable:true,
  });
  const values=new Map();
  Object.assign(globalThis,{
    document,window,
    localStorage:{getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)},
    requestAnimationFrame:requestNativeFrame,cancelAnimationFrame:cancelNativeFrame,
    ResizeObserver:class{observe(){}unobserve(){}disconnect(){}},
  });
  const native=seedNativeChat(document),scheme=await editorStorage();
  assert.equal(await scheme.load(),null,'the new scheme starts without saved settings');
  await import('./index.js');
  const shadow=document.querySelector('#orange-theme-lab').shadowRoot;
  const assertGutters=(left=10,right=10)=>{
    for(const [side,value] of [['左',left],['右',right]]){
      for(const suffix of ['',' 数值'])assert.equal(shadow.querySelector(`[aria-label="正文${side}侧留白${suffix}"]`).value,String(value));
    }
    const rule=[...document.querySelector('#orange-theme-live-style').sheet.cssRules].filter(rule=>rule.selectorText==='#chat > .mes[data-otl-live] > .mes_block > .mes_text'&&rule.style.getPropertyValue('padding-left')).at(-1);
    assert.ok(rule,'the live stylesheet contains the body gutter rule');
    assert.equal(rule.style.getPropertyValue('padding-left'),`${left}px`);
    assert.equal(rule.style.getPropertyValue('padding-right'),`${right}px`);
    for(const message of native.messages)assert.equal(message.querySelector('.mes_text').matches(rule.selectorText),true,'the rule applies to both AI and user messages');
  };
  shadow.querySelector('.launcher').click();
  navigateRegion(shadow,'body');
  await settleNativeCanvas();
  assertGutters(16,16);
  let saved=await saveEditorScheme(shadow,scheme);
  assert.equal(saved.bodyPaddingLeft,16);
  assert.equal(saved.bodyPaddingRight,16);

  shadow.querySelector('#open-work-library').click();
  await settleNativeCanvas();
  shadow.querySelector('[data-work-id="spring"] [data-work-action="open"]').click();
  await settleNativeCanvas();
  const expected=createSchemeModel().validate(createSchemeModel().templates.spring);
  assertGutters(expected.bodyPaddingLeft,expected.bodyPaddingRight);
  saved=await saveEditorScheme(shadow,scheme);
  assert.equal(saved.template,'spring');
  assert.equal(saved.bodyPaddingLeft,expected.bodyPaddingLeft);
  assert.equal(saved.bodyPaddingRight,expected.bodyPaddingRight);
  shadow.querySelector('#apply-live').click();await settleSchemeApplication();
  await settleNativeCanvas();
  assert.equal(shadow.querySelector('.panel').classList.contains('hidden'),true,'apply closes the workbench');
  assertGutters(saved.bodyPaddingLeft,saved.bodyPaddingRight);
  shadow.querySelector('.launcher').click();
  await settleNativeCanvas();
  assertGutters(saved.bodyPaddingLeft,saved.bodyPaddingRight);

  // A deliberate edit remains independent from the starting values.
  const left=shadow.querySelector('[aria-label="正文左侧留白 数值"]');
  left.value='0';left.dispatchEvent(new window.Event('input'));left.dispatchEvent(new window.Event('change'));
  await settleNativeCanvas();
  assertGutters(0,saved.bodyPaddingRight);
  shadow.querySelector('#restore').click();
  await settleNativeCanvas();
  assertGutters(saved.bodyPaddingLeft,saved.bodyPaddingRight);
  shadow.querySelector('#close').click();await settleSchemeApplication();
  assert.ok(document.querySelector('#orange-theme-live-style'), 'closing editing retains the applied theme');
  window.dispatchEvent(new window.Event('pagehide'));
  await settleSchemeApplication();
});
