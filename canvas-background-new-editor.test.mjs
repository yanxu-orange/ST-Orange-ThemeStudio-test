import {navigateRegion} from './test-support/editor-navigation.mjs';
import {seedNativeChat,requestNativeFrame,cancelNativeFrame,settleNativeCanvas} from './test-support/native-chat.mjs';
import {editorStorage,saveEditorScheme} from './test-support/editor-storage.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import {parseHTML} from 'linkedom';
test('fresh draft follows tavern and restores previously disabled style on preview exit',async()=>{
 const {document,window}=parseHTML('<html><head><style id="custom-style"></style></head><body><div id="bg1" class="cover" style="background-image:url(wallpaper.png)"></div><div id="sheld"><div id="chat"></div><div id="form_sheld"><textarea id="send_textarea">真实当前草稿</textarea></div></div></body></html>'),desc=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:desc.get,set(v){for(const o of this.options)o.toggleAttribute('selected',o.value===String(v));},configurable:true});const values=new Map();Object.assign(globalThis,{document,window,localStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},requestAnimationFrame:requestNativeFrame,cancelAnimationFrame:cancelNativeFrame,ResizeObserver:class{observe(){}unobserve(){}disconnect(){}}});window.innerWidth=390;window.innerHeight=844;const scheme=await editorStorage(null);seedNativeChat(document);await import('./index.js');const sh=document.querySelector('#orange-theme-lab').shadowRoot,go=r=>navigateRegion(sh,r),kind=k=>sh.querySelector(`[data-kind="${k}"]`).click(),edit=(label,value)=>{const node=sh.querySelector(`[aria-label="${label}"]`);assert.ok(node,label);node.value=String(value);node.dispatchEvent(new window.Event('input'));node.dispatchEvent(new window.Event('change'));return node;},button=text=>{const n=[...sh.querySelectorAll('button')].find(b=>b.textContent===text);assert.ok(n,text);n.click();},save=()=>saveEditorScheme(sh,scheme);



 const bg=document.querySelector('#bg1'),bgStyle=bg.getAttribute('style'),theme=document.querySelector('#custom-style');theme.disabled=true;
 sh.querySelector('.launcher').click();sh.querySelector('[data-flow=continue]').click();
 assert.equal((await save()).canvasBackground,'tavern');go('overall');assert.equal(sh.querySelector('[aria-label="整体背景"]'),null);
 assert.ok(![...sh.querySelectorAll('button')].some(b=>b.textContent==='改为跟随酒馆背景'));
 sh.querySelector('#close').click();assert.equal(theme.disabled,true);assert.equal(bg.getAttribute('style'),bgStyle);
});
