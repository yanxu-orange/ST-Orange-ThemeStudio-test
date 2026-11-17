import {createSchemeModel} from './scheme-model.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {editorStorage,saveEditorScheme} from './test-support/editor-storage.mjs';
import {navigateRegion} from './test-support/editor-navigation.mjs';
import {seedNativeChat,requestNativeFrame,cancelNativeFrame,settleNativeCanvas} from './test-support/native-chat.mjs';

test('all four lines can be picked, recolored and resized without changing stored placement',async()=>{
 const {document,window}=parseHTML('<html><head><style id="custom-style"></style></head><body><div id="sheld"><div id="chat"></div></div></body></html>');
 const descriptor=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:descriptor.get,set(value){for(const option of this.options)option.toggleAttribute('selected',option.value===String(value));},configurable:true});
 const values=new Map();Object.assign(globalThis,{document,window,localStorage:{getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)},requestAnimationFrame:requestNativeFrame,cancelAnimationFrame:cancelNativeFrame,ResizeObserver:class{observe(){}unobserve(){}disconnect(){}}});
 window.innerWidth=390;window.innerHeight=844;seedNativeChat(document);const store=await editorStorage(JSON.stringify(createSchemeModel().templates.blank));await import('./index.js');const sh=document.querySelector('#orange-theme-lab').shadowRoot;
 const click=selector=>{const node=sh.querySelector(selector);assert.ok(node,selector);node.click();},button=text=>{const node=[...sh.querySelectorAll('button')].find(n=>n.textContent===text);assert.ok(node,text);node.click();},set=(selector,value)=>{const node=sh.querySelector(selector);assert.ok(node,selector);node.value=value;node.dispatchEvent(new window.Event('input',{bubbles:true}));node.dispatchEvent(new window.Event('change',{bubbles:true}));},save=()=>saveEditorScheme(sh,store),path=()=>[sh.querySelector('#workspace-page').value,sh.querySelector('#region-select').value,sh.querySelector('[data-kind][aria-pressed=true]')?.dataset.kind,sh.querySelector('[data-object][aria-pressed=true]')?.dataset.object];

 click('.launcher');navigateRegion(sh,'header');click('[data-kind=image]');
 for(const shape of ['line','dashed','dotted','wave']){
  click('#add-current-image');click('[data-material-category=shapes]');click(`[data-add-shape=${shape}]`);
  const number=label=>sh.querySelector(`[aria-label="${label}"]`);
  assert.ok(number('长度'));assert.ok(number('粗细'));
  set('[aria-label="颜色"]','#123456');set('[aria-label="粗细"]','4');set('[aria-label="长度"]','180');
  const c=await save(),l=c.layers.at(-1);assert.equal(l.color,'#123456');assert.equal(l.shape,shape);assert.equal(l.width,180);assert.equal(l.height,shape==='wave'?24:4);assert.equal(l.anchor,'header');
 }
 set('#workspace-page','settings');set('#region-select','page-header');click('[data-kind="scene-images"]');
 for(const shape of ['line','dashed','dotted','wave']){
  click('#add-header-image');click('[data-material-category=shapes]');click(`[data-add-shape=${shape}]`);
  set('[aria-label="粗细"]','3');set('[aria-label="长度"]','160');set('[aria-label="颜色"]','#abcdef');
  const l=(await save()).pageHeaders.settings.scene.images.at(-1);assert.equal(l.shape,shape);assert.equal(l.height,shape==='wave'?18:3);assert.equal(l.width,160);assert.equal(l.color,'#abcdef');
 }
 click('#close');
});
