import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bodyCardSettings,chatFrameRules} from './body-card.mjs';
import {parseHTML} from 'linkedom';
import {navigateRegion} from './test-support/editor-navigation.mjs';
import {seedNativeChat,requestNativeFrame,cancelNativeFrame,settleNativeCanvas} from './test-support/native-chat.mjs';
import {editorStorage,saveEditorScheme} from './test-support/editor-storage.mjs';

test('message gap keeps old defaults, validates bounds and survives serialization',()=>{
 assert.equal(bodyCardSettings({}).messageGap,18);
 for(const n of [0,18,32,80,120])assert.equal(bodyCardSettings(JSON.parse(JSON.stringify({messageGap:n}))).messageGap,n);
 for(const n of [-1,121,null,'32',NaN,Infinity])assert.throws(()=>bodyCardSettings({messageGap:n}));
 for(const gap of [0,18,80]){
  const css=chatFrameRules('#chat','.mes[data-otl-live]',{messageGap:gap,cardWidth:720});
  assert.ok(css.includes('gap:0!important'));
  assert.ok(css.includes(`margin-bottom:${gap}px!important`));
  assert.equal(css.includes(':last-child'),false);
 }
});

test('live editor gap applies to both roles, persists, exports, undoes and restores host on close',async()=>{
 const {document,window}=parseHTML('<html><head><style id="custom-style"></style></head><body><div id="sheld"><div id="chat" style="gap:18px"></div></div></body></html>');
 const d=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:d.get,set(v){for(const o of this.options)o.toggleAttribute('selected',o.value===String(v));},configurable:true});
 const proto=Object.getPrototypeOf(document.createElement('dialog'));proto.showModal=function(){};proto.close=function(){};
 const values=new Map();Object.assign(globalThis,{document,window,localStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},requestAnimationFrame:requestNativeFrame,cancelAnimationFrame:cancelNativeFrame,ResizeObserver:class{observe(){}unobserve(){}disconnect(){}}});
 seedNativeChat(document);const storage=await editorStorage(null);await import('./index.js');
 const shadow=document.querySelector('#orange-theme-lab').shadowRoot;
 shadow.querySelector('.launcher').click();await settleNativeCanvas();navigateRegion(shadow,'overall');
 const set=async n=>{const input=shadow.querySelector('[aria-label="楼间距 数值"]');assert.ok(input);input.value=String(n);input.dispatchEvent(new window.Event('input'));input.dispatchEvent(new window.Event('change'));await settleNativeCanvas();};
 const check=n=>{const css=document.querySelector('#orange-theme-live-style').textContent;assert.ok(css.includes(`margin-bottom:${n}px!important`));assert.ok(document.querySelectorAll('[data-otl-live]').length>=2);};
 check(18);await set(32);check(32);assert.equal((await saveEditorScheme(shadow,storage)).messageGap,32);
 await set(80);check(80);shadow.querySelector('#undo').click();await settleNativeCanvas();check(32);
 let blob;const create=URL.createObjectURL,revoke=URL.revokeObjectURL;URL.createObjectURL=b=>{blob=b;return 'blob:gap';};URL.revokeObjectURL=()=>{};
 shadow.querySelector('#export').click();assert.equal(JSON.parse(await blob.text()).messageGap,32);URL.createObjectURL=create;URL.revokeObjectURL=revoke;
 await set(0);check(0);shadow.querySelector('#close').click();assert.equal(document.querySelectorAll('[data-otl-live]').length,0);assert.equal(document.querySelector('#chat').style.gap,'18px');assert.equal(document.documentElement.hasAttribute('data-orange-live'),false);
});
