import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {createSchemeModel} from './scheme-model.mjs';
import {newLayer} from './layers.mjs';
import {syncRegionOrder} from './region-layers.mjs';
import {openEditor} from './test-support/open-editor.mjs';
import {seedNativeChat,requestNativeFrame,cancelNativeFrame} from './test-support/native-chat.mjs';
import {editorStorage,saveEditorScheme} from './test-support/editor-storage.mjs';

test('shape and picture unit controls disappear only in the fixed-pixel canvas and never alter dimensions while opening',async()=>{
 const {document,window}=parseHTML('<html><head></head><body><div id="sheld"><div id="chat"></div></div></body></html>');const desc=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:desc.get,set(v){for(const o of this.options)o.toggleAttribute('selected',o.value===String(v));},configurable:true});
 const storage=new Map();Object.assign(globalThis,{document,window,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},requestAnimationFrame:requestNativeFrame,cancelAnimationFrame:cancelNativeFrame,ResizeObserver:class{observe(){}unobserve(){}disconnect(){}}});
 const model=createSchemeModel();let initial=model.validate(model.templates.blank);initial.layers=[newLayer('shape',{id:'shape',name:'形状',anchor:'avatar',width:80,height:60}),newLayer('custom',{id:'picture',name:'图片',anchor:'avatar',width:100,image:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg=='})];initial=model.validate(syncRegionOrder(initial));
 const store=await editorStorage(JSON.stringify(initial));seedNativeChat(document);await import('./index.js');const sh=document.querySelector('#orange-theme-lab').shadowRoot;openEditor(sh);
 const save=()=>saveEditorScheme(sh,store),choose=id=>{sh.querySelector('[data-kind=image]').click();sh.querySelector(`[data-object="${id}"]`).click();};
 for(const canvas of [false,true]){
  const before=await save();
  choose('shape');let unit=sh.querySelector('[aria-label="宽度单位"]');if(canvas){assert.equal(unit,null);assert.equal(sh.querySelector('[aria-label="宽度 数值"]').closest('label').querySelector('.control-unit').textContent,'px');}else assert.deepEqual([...unit.options].map(o=>o.value),['px','percent']);
  choose('picture');for(const label of ['宽度单位','图片高度单位']){unit=sh.querySelector(`[aria-label="${label}"]`);if(canvas)assert.equal(unit,null);else assert.deepEqual([...unit.options].map(o=>o.value),['px','percent']);}
  if(canvas)for(const label of ['素材宽度','图片高度'])assert.equal(sh.querySelector(`[aria-label="${label}"]`).parentElement.querySelector('.unit').textContent,'px');
  assert.deepEqual((await save()).layers,before.layers);assert.deepEqual((await save()).photos,before.photos);
  if(!canvas){sh.querySelector('[data-kind=region]').click();sh.querySelector('#enable-header-canvas').click();}
 }
 sh.querySelector('[data-kind=avatar]').click();assert.equal(sh.querySelector('[aria-label="头像宽度单位"]'),null);assert.ok(sh.querySelector('[aria-label="头像窗口宽度 数值"]'));assert.ok(sh.querySelector('[aria-label="头像窗口高度"]'));assert.equal(sh.querySelector('[aria-label="头像宽度 数值"]'),null);sh.querySelector('#close').click();
});
