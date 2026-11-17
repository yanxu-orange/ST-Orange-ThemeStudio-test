import {openEditor} from './test-support/open-editor.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import {parseHTML} from 'linkedom';
import {editorStorage,saveEditorScheme} from './test-support/editor-storage.mjs';
import {seedNativeChat,requestNativeFrame,cancelNativeFrame,settleNativeCanvas} from './test-support/native-chat.mjs';
test('title decoration edits, undo, save and export preserve native title binding',async()=>{
 const {document,window}=parseHTML('<html><head><style id="custom-style"></style></head><body><div id="sheld"><div id="chat"></div></div><div id="WorldInfo"><h3><span data-i18n="Worlds/Lorebooks">Worlds</span><a href="#help">Help</a></h3></div></body></html>');const d=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:d.get,set(v){for(const o of this.options)o.toggleAttribute('selected',o.value===String(v));},configurable:true});const values=new Map();Object.assign(globalThis,{document,window,localStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},requestAnimationFrame:requestNativeFrame,cancelAnimationFrame:cancelNativeFrame,ResizeObserver:class{observe(){}unobserve(){}disconnect(){}}});seedNativeChat(document);const storage=await editorStorage(null);await import('./index.js');const sh=document.querySelector('#orange-theme-lab').shadowRoot;
 const click=s=>{const n=sh.querySelector(s);assert.ok(n,s);n.click();},set=async(label,value)=>{const n=sh.querySelector(`[aria-label="${label}"]`);assert.ok(n,label);n.value=String(value);n.dispatchEvent(new window.Event('input'));n.dispatchEvent(new window.Event('change'));await settleNativeCanvas();},change=(s,value)=>{const n=sh.querySelector(s);n.value=value;n.dispatchEvent(new window.Event('change'));},page=name=>{change('#workspace-page',name);change('#region-select','page-header');click('[data-kind="base"]');},save=()=>saveEditorScheme(sh,storage);

 openEditor(sh);await settleNativeCanvas();page('worldbook');click('[data-object="decoration"]');
 assert.equal((await save()).pageHeaders.worldbook.titleDecoration,null);
 await set('页面头部排版','standard');await set('显示标题装饰','true');
 await set('装饰形状','dot');await set('装饰大小 数值',12);await set('装饰水平位置 数值',3);await set('装饰纵向位置 数值',-2);await set('装饰颜色','#aa2233');
 const configured=await save();assert.deepEqual(configured.pageHeaders.worldbook.titleDecoration,{shape:'dot',size:12,x:3,y:-2,color:'#aa2233'});
 await set('装饰形状','line');click('#undo');assert.equal(sh.querySelector('[aria-label="装饰形状"]').value,'dot');
 await set('显示标题装饰','false');assert.equal((await save()).pageHeaders.worldbook.titleDecoration,null);click('#undo');assert.deepEqual((await save()).pageHeaders.worldbook.titleDecoration,configured.pageHeaders.worldbook.titleDecoration);
 let blob;const create=URL.createObjectURL,revoke=URL.revokeObjectURL;URL.createObjectURL=b=>{blob=b;return 'blob:decoration';};URL.revokeObjectURL=()=>{};click('#export');await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(JSON.parse(await blob.text()).pageHeaders.worldbook.titleDecoration,configured.pageHeaders.worldbook.titleDecoration);URL.createObjectURL=create;URL.revokeObjectURL=revoke;
 click('#close');openEditor(sh);await settleNativeCanvas();assert.deepEqual((await save()).pageHeaders.worldbook.titleDecoration,configured.pageHeaders.worldbook.titleDecoration);click('#close');
});
