import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {navigateRegion} from './test-support/editor-navigation.mjs';
import {editorStorage,saveEditorScheme} from './test-support/editor-storage.mjs';
import {seedNativeChat,requestNativeFrame,cancelNativeFrame,settleNativeCanvas} from './test-support/native-chat.mjs';

test('inline material control commits only selected sources and keeps cancelled, native and text modes intact',async()=>{
 const {document,window}=parseHTML('<html><head><style id="custom-style"></style></head><body><div id="sheld"><div id="chat"></div></div></body></html>');
 const descriptor=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:descriptor.get,set(value){for(const o of this.options)o.toggleAttribute('selected',o.value===String(value));},configurable:true});
 const values=new Map();Object.assign(globalThis,{document,window,localStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},requestAnimationFrame:requestNativeFrame,cancelAnimationFrame:cancelNativeFrame,ResizeObserver:class{observe(){}unobserve(){}disconnect(){}}});
 seedNativeChat(document);const store=await editorStorage();await import('./index.js');const sh=document.querySelector('#orange-theme-lab').shadowRoot;
 const save=()=>saveEditorScheme(sh,store),go=r=>navigateRegion(sh,r),select=(label,value)=>{const n=sh.querySelector(`[aria-label="${label}"]`);assert.ok(n,label);n.value=value;n.dispatchEvent(new window.Event('change'));};
 sh.querySelector('.launcher').click();
 for(const region of ['topbar','input']){
  go(region);sh.querySelector(`[data-kind=${region==='topbar'?'icons':'tools'}]`).click();
  const target=sh.querySelector('.object-list [aria-pressed=true]').dataset.object;
  assert.deepEqual([...sh.querySelector('[aria-label="按钮图形"]').options].map(o=>o.textContent),['原生','自定义']);
  const picker=()=>sh.querySelector('#chrome-icon-pick');assert.equal(picker().textContent,'选择素材');assert.equal(picker().parentElement.querySelector('select').getAttribute('aria-label'),'按钮图形');
  const before=await save();sh.querySelector('.fields').scrollTop=36;sh.querySelector('.inspector').scrollTop=240;picker().click();assert.equal(sh.querySelector('.fields').scrollTop,0);assert.equal(sh.querySelector('.inspector').scrollTop,0);assert.equal(sh.querySelectorAll('[data-material-category]').length,2);sh.querySelector('#material-back').click();assert.equal(sh.querySelector('.fields').scrollTop,36);assert.equal(sh.querySelector('.inspector').scrollTop,240);assert.deepEqual(await save(),before);
  select('按钮图形','custom');assert.equal(sh.querySelector('.material-categories')!==null,true);const escape=new window.Event('keydown',{bubbles:true,cancelable:true});Object.defineProperty(escape,'key',{value:'Escape'});sh.dispatchEvent(escape);
  assert.deepEqual(await save(),before,'choosing custom and then cancelling is not an edit');assert.equal(sh.querySelector('[aria-label="按钮图形"]').value,'native');
  picker().click();sh.querySelector('[data-material-category=icons]').click();sh.querySelector('.icon-library-use').click();let chosen=await save();assert.equal(chosen.chromeStyle[region].icons[target].mode,'icon');assert.ok(chosen.chromeStyle[region].icons[target].icon);assert.equal(sh.querySelector('[aria-label="按钮图形"]').value,'custom');assert.equal(picker().textContent,'更换');
  picker().click();sh.querySelector('[data-material-category=images]').click();sh.querySelector('#material-back').click();assert.deepEqual(await save(),chosen,'category browsing and cancel preserve icon source');
  picker().click();sh.querySelector('[data-material-category=images]').click();sh.querySelector('[data-builtin-asset]').click();chosen=await save();assert.equal(chosen.chromeStyle[region].icons[target].mode,'image');assert.ok(chosen.chromeStyle[region].icons[target].asset);assert.equal(chosen.chromeStyle[region].icons[target].icon,'','replacing an icon with an image removes the stale icon');
  sh.querySelector('#undo').click();assert.equal((await save()).chromeStyle[region].icons[target].mode,'icon');select('按钮图形','native');assert.equal((await save()).chromeStyle[region].icons[target].mode,'native');assert.equal(picker().textContent,'选择素材');
 }
 go('native');
 for(const [label,id,key]of [['显示方式','native-edit-pick','edit'],['更多显示方式','native-more-pick','more']]){
  const before=await save();sh.querySelector('#'+id).click();sh.querySelector('#material-back').click();assert.deepEqual(await save(),before);
  select(label,'text');const textState=await save();sh.querySelector('#'+id).click();sh.querySelector('#material-back').click();assert.deepEqual(await save(),textState,'text mode survives material cancellation');
  sh.querySelector('#'+id).click();sh.querySelector('[data-material-category=icons]').click();sh.querySelector('.icon-library-use').click();assert.equal((await save()).nativeStyle.actions[key].mode,'icon');assert.equal(sh.querySelector('[aria-label="'+label+'"]').value,'custom');
  sh.querySelector('#'+id).click();sh.querySelector('[data-material-category=images]').click();sh.querySelector('[data-builtin-asset]').click();const image=await save();assert.equal(image.nativeStyle.actions[key].mode,'image');assert.equal(image.nativeStyle.actions[key].icon,'');assert.ok(image.nativeStyle.actions[key].source);
  select(label,'default');const native=await save();assert.equal(native.nativeStyle.actions[key].mode,'default');assert.equal(native.nativeStyle.actions[key].source,null);assert.equal(sh.querySelector('#'+id).textContent,'选择素材');
 }
 await settleNativeCanvas();sh.querySelector('#close').click();
});
