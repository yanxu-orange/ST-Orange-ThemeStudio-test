import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {editorStorage,saveEditorScheme} from './test-support/editor-storage.mjs';
import {seedNativeChat,requestNativeFrame,cancelNativeFrame,settleNativeCanvas} from './test-support/native-chat.mjs';
import {PAGE_HEADER_PAGES,PAGE_HEADER_DEFAULTS} from './page-headers.mjs';

test('page header editors use independent library targets, preserve navigation, undo and persistence',async()=>{
 const {document,window}=parseHTML('<html><head><style id="custom-style"></style></head><body><div id="sheld"><div id="chat"></div></div><div id="user-settings-block"><input id="native-setting" value="keep"></div><div id="WorldInfo"></div></body></html>');
 const descriptor=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:descriptor.get,set(value){for(const option of this.options)option.toggleAttribute('selected',option.value===String(value));},configurable:true});
 const values=new Map();Object.assign(globalThis,{document,window,localStorage:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)},requestAnimationFrame:requestNativeFrame,cancelAnimationFrame:cancelNativeFrame,ResizeObserver:class{observe(){}unobserve(){}disconnect(){}}});window.innerWidth=390;window.innerHeight=844;window.confirm=()=>true;
 seedNativeChat(document);const storage=await editorStorage();await import('./index.js?page-headers-editor');const sh=document.querySelector('#orange-theme-lab').shadowRoot;
 const click=selector=>{const node=sh.querySelector(selector);assert.ok(node,selector);assert.notEqual(node.disabled,true);node.click();};
 const change=(selector,value)=>{const node=sh.querySelector(selector);assert.ok(node,selector);node.value=String(value);node.dispatchEvent(new window.Event('input',{bubbles:true}));node.dispatchEvent(new window.Event('change',{bubbles:true}));};
 const field=(label,value)=>change(`[aria-label="${label}"]`,value),save=()=>saveEditorScheme(sh,storage),page=value=>change('#workspace-page',value),region=value=>change('#region-select',value);
 const path=()=>[sh.querySelector('#workspace-page').value,sh.querySelector('#region-select').value];
 try{
  click('.launcher');sh.querySelector('[data-flow=continue]')?.click();const initial=await save();
  assert.deepEqual(Object.keys(initial.pageHeaders),Object.keys(PAGE_HEADER_PAGES));
  for(const header of Object.values(initial.pageHeaders))assert.deepEqual(header,PAGE_HEADER_DEFAULTS);
  page('chat');assert.ok(![...sh.querySelector('#region-select').options].some(option=>option.value==='page-header'));
  for(const [i,target]of Object.keys(PAGE_HEADER_PAGES).entries()){
   page(target);region('page-header');const caller=path();
   assert.equal(sh.querySelector('[aria-label="显示页面头部"]').value,'false');assert.equal(sh.querySelector('[aria-label="头部高度 数值"]'),null);assert.equal(sh.querySelector('#mode-layers').disabled,true);
   const before=await save();click(`[data-page-header-artwork=${target}]`);assert.deepEqual([...sh.querySelectorAll('[data-material-category]')].map(node=>node.dataset.materialCategory),['images']);
   const stale=sh.querySelector('button[data-builtin-asset]');click('#material-back');stale.click();assert.deepEqual(await save(),before);assert.deepEqual(path(),caller);
   click(`[data-page-header-artwork=${target}]`);const escape=new window.Event('keydown',{bubbles:true,cancelable:true});Object.defineProperty(escape,'key',{value:'Escape'});sh.querySelector('.fields').dispatchEvent(escape);assert.deepEqual(await save(),before);
   click(`[data-page-header-artwork=${target}]`);document.querySelector('#WI-SP-button .drawer-toggle').click();await settleNativeCanvas();click('button[data-builtin-asset]');assert.deepEqual(path(),caller);assert.equal(sh.querySelector('[aria-label="显示页面头部"]').value,'true');
   field('顶部留白 数值',i+4);field('左右留白 数值',i+7);field('头部高度 数值',160+i);field('图片显示','contain');field('水平取景 数值',30+i);field('垂直取景 数值',70-i);
   let edited=await save();assert.ok(edited.pageHeaders[target].asset);assert.equal(edited.pageHeaders[target].height,160+i);assert.equal(edited.pageHeaders[target].topGap,i+4);assert.equal(edited.pageHeaders[target].sideGap,i+7);assert.equal(edited.pageHeaders[target].fit,'contain');assert.equal(edited.pageHeaders[target].x,30+i);assert.equal(edited.pageHeaders[target].y,70-i);
   for(const other of Object.keys(PAGE_HEADER_PAGES).filter(key=>key!==target))assert.deepEqual(edited.pageHeaders[other],before.pageHeaders[other]);
   field('高度方式','ratio');assert.equal(sh.querySelector('[aria-label="头部高度 数值"]'),null);assert.equal(sh.querySelector('[aria-label="图片显示"]'),null);assert.equal((await save()).pageHeaders[target].sizing,'ratio');
   field('高度方式','fixed');assert.equal(Number(sh.querySelector('[aria-label="头部高度 数值"]').value),160+i);
   field('头部高度 数值',601);assert.equal((await save()).pageHeaders[target].height,160+i);assert.equal(sh.querySelector('[aria-label="头部高度 数值"]').getAttribute('aria-invalid'),'true');
   field('显示页面头部','false');assert.equal((await save()).pageHeaders[target].enabled,false);click('#undo');assert.equal((await save()).pageHeaders[target].enabled,true);
   edited=await save();click(`[data-remove-page-header=${target}]`);assert.equal((await save()).pageHeaders[target].asset,'');click('#undo');assert.deepEqual((await save()).pageHeaders[target],edited.pageHeaders[target]);
  }
  const complete=await save();assert.deepEqual(complete.layers,initial.layers);assert.deepEqual(complete.pageStyle,initial.pageStyle);assert.deepEqual(complete.commonStyle,initial.commonStyle);assert.equal(document.querySelector('#native-setting').value,'keep');
  for(const width of [320,390,500,1180]){window.innerWidth=width;window.dispatchEvent(new window.Event('resize'));assert.deepEqual(path(),['formatting','page-header']);assert.ok(sh.querySelector('[aria-label="高度方式"]'));}
  const upload=sh.querySelector('#import-file');
  const importScheme=async value=>{Object.defineProperty(upload,'files',{value:[{size:100,text:async()=>JSON.stringify(value)}],configurable:true});const event=new window.Event('change');upload.dispatchEvent(event);Object.defineProperty(event,'target',{value:upload});await new Promise(resolve=>setImmediate(resolve));};
  await importScheme({...complete,pageHeaders:{chat:{enabled:true}}});assert.deepEqual(await save(),complete);assert.match(sh.querySelector('#notice').textContent,/页面|保存/);
  let exported;const createURL=URL.createObjectURL,revokeURL=URL.revokeObjectURL;URL.createObjectURL=blob=>{exported=blob;return 'blob:page-headers-export';};URL.revokeObjectURL=()=>{};
  try{click('#export');assert.deepEqual(JSON.parse(await exported.text()).pageHeaders,complete.pageHeaders);}finally{URL.createObjectURL=createURL;URL.revokeObjectURL=revokeURL;}
  const legacy={...complete};delete legacy.pageHeaders;await importScheme(legacy);for(const header of Object.values((await save()).pageHeaders))assert.deepEqual(header,PAGE_HEADER_DEFAULTS);
  await importScheme(complete);assert.deepEqual((await save()).pageHeaders,complete.pageHeaders);
  click('#close');document.querySelector('#orange-theme-lab').remove();await import('./index.js?page-headers-reload');const reloaded=document.querySelector('#orange-theme-lab').shadowRoot;reloaded.querySelector('.launcher').click();reloaded.querySelector('[data-flow=continue]')?.click();assert.deepEqual((await saveEditorScheme(reloaded,storage)).pageHeaders,complete.pageHeaders);reloaded.querySelector('#close').click();
 }finally{document.querySelector('#orange-theme-lab')?.shadowRoot.querySelector('#close')?.click();}
});
