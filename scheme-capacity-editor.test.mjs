import {seedNativeChat,requestNativeFrame,cancelNativeFrame,settleNativeCanvas} from './test-support/native-chat.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {newLayer} from './layers.mjs';
import {createSchemeStorage,SCHEME_DB,SCHEME_STORE,SCHEME_KEY} from './scheme-storage.mjs';
import {indexedDatabase} from './test-support/indexed-db.mjs';
import {saveEditorScheme} from './test-support/editor-storage.mjs';

const tick=()=>new Promise(resolve=>setImmediate(resolve));
function mount(factory,{legacyValue='{"version":10,"headerHeight":999}'}={}){
  const {document,window}=parseHTML('<html><head><style id="custom-style"></style></head><body><div id="sheld"><div id="chat"></div></div></body></html>');
  const descriptor=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');
  Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:descriptor.get,set(value){for(const option of this.options)option.toggleAttribute('selected',option.value===String(value));},configurable:true});
  let legacyReads=0,legacyWrites=0;const values=new Map([['orange.theme-lab.mobile-test.v1',legacyValue]]);
  const storage={getItem:name=>{if(name==='orange.theme-lab.mobile-test.v1')legacyReads++;return values.get(name);},setItem:(name,value)=>{if(name==='orange.theme-lab.mobile-test.v1')legacyWrites++;values.set(name,value);}};
  Object.assign(globalThis,{document,window,indexedDB:factory,localStorage:storage,requestAnimationFrame:requestNativeFrame,cancelAnimationFrame:cancelNativeFrame,ResizeObserver:class{observe(){}unobserve(){}disconnect(){}}});
  seedNativeChat(document);
  return {document,window,legacy:()=>({reads:legacyReads,writes:legacyWrites,value:values.get('orange.theme-lab.mobile-test.v1')})};
}
async function importFile(shadow,window,file){
  const input=shadow.querySelector('#import-file');Object.defineProperty(input,'files',{value:[file],configurable:true});
  const event=new window.Event('change');input.dispatchEvent(event);Object.defineProperty(event,'target',{value:input});await tick();
  assert.equal(input.value,'','import clears the picker for selecting the same file again');
}

test('large schemes save, reload and roundtrip in IndexedDB; failed replacement retains the last save',async()=>{
  const {factory,controls}=indexedDatabase(),storage=createSchemeStorage({indexedDB:factory});let env=mount(factory),{document,window}=env;
  await import('./index.js?capacity-first');let shadow=document.querySelector('#orange-theme-lab').shadowRoot;
  let blob;const create=URL.createObjectURL,revoke=URL.revokeObjectURL;URL.createObjectURL=value=>{blob=value;return 'blob:capacity-test';};URL.revokeObjectURL=()=>{};
  const exportText=async()=>{shadow.querySelector('#export').click();return blob.text();};
  try{
    shadow.querySelector('.launcher').click();await settleNativeCanvas();const normal=JSON.stringify(await saveEditorScheme(shadow,storage),null,2);assert.notEqual(JSON.parse(normal).headerHeight,999,'legacy localStorage is not loaded');
    await importFile(shadow,window,new Blob([normal]));assert.match(shadow.querySelector('#notice').textContent,/已导入/);assert.deepEqual(JSON.parse(await exportText()),JSON.parse(normal));
    const large=JSON.parse(normal);large.layers=Array.from({length:10},(_,index)=>newLayer('custom',{name:'large-'+index,image:'data:image/png;base64,'+'A'.repeat(2790000)}));delete large.regionOrder;
    const largeFile=new Blob([JSON.stringify(large)]);assert.ok(largeFile.size>24*1024*1024);
    await importFile(shadow,window,largeFile);assert.match(shadow.querySelector('#notice').textContent,/已导入/);
    const exported=await exportText();assert.ok(blob.size>24*1024*1024);assert.equal(JSON.parse(exported).layers.length,10);
    await importFile(shadow,window,new Blob([exported]));assert.equal(await exportText(),exported);
    assert.deepEqual(await saveEditorScheme(shadow,storage),JSON.parse(exported));const savedLarge=await storage.load();assert.ok(savedLarge.length>24*1024*1024);
    assert.deepEqual(env.legacy(),{reads:0,writes:0,value:'{"version":10,"headerHeight":999}'});
    shadow.querySelector('#close').click();env=mount(factory);({document,window}=env);await import('./index.js?capacity-reload');shadow=document.querySelector('#orange-theme-lab').shadowRoot;shadow.querySelector('.launcher').click();await settleNativeCanvas();assert.equal(await exportText(),exported,'refresh restores the large saved scheme without a manual import');
    const changed={...JSON.parse(exported),headerHeight:350};await importFile(shadow,window,new Blob([JSON.stringify(changed)]));const changedExport=await exportText();
    for(const failure of ['QuotaExceededError','AbortError']){controls.failNext=failure;shadow.querySelector('#save').click();await tick();assert.equal(shadow.querySelector('#save').disabled,false);assert.equal(shadow.querySelector('#save-state').textContent,'未保存');assert.match(shadow.querySelector('#notice').textContent,failure==='QuotaExceededError'?/可用存储空间不足.*原有保存未变.*重试/:/未保存/);assert.equal(await storage.load(),savedLarge);assert.equal(await exportText(),changedExport,'failed save preserves the current draft');}
    await importFile(shadow,window,new Blob(['{bad-json']));assert.match(shadow.querySelector('#notice').textContent,/未导入/);assert.equal(await exportText(),changedExport);
    shadow.querySelector('#restore').click();assert.equal(await exportText(),exported);
    let resolve;const pending={size:1,text:()=>new Promise(done=>resolve=done)};await importFile(shadow,window,pending);shadow.querySelector('#close').click();resolve(changedExport);await tick();shadow.querySelector('.launcher').click();await settleNativeCanvas();assert.equal(await exportText(),exported,'closing during import discards stale data');
    await importFile(shadow,window,new Blob([normal]));assert.deepEqual(await saveEditorScheme(shadow,storage),JSON.parse(normal));assert.deepEqual(env.legacy(),{reads:0,writes:0,value:'{"version":10,"headerHeight":999}'});shadow.querySelector('#close').click();
  }finally{URL.createObjectURL=create;URL.revokeObjectURL=revoke;}
});

test('pending save commits its snapshot once and never marks newer edits or imports saved',async()=>{
  const {factory,controls,databases}=indexedDatabase(),storage=createSchemeStorage({indexedDB:factory}),{document,window}=mount(factory);await import('./index.js?save-races');
  const shadow=document.querySelector('#orange-theme-lab').shadowRoot;shadow.querySelector('.launcher').click();await settleNativeCanvas();const initial=await saveEditorScheme(shadow,storage);
  shadow.querySelector('[data-region="header"]').click();shadow.querySelector('[data-kind="region"]').click();
  controls.holdCommit=true;shadow.querySelector('#save').click();await tick();assert.equal(shadow.querySelector('#save').disabled,true);assert.equal(shadow.querySelector('#save-state').textContent,'正在保存…');
  const pendingCommit=controls.finish;shadow.querySelector('#save').click();await tick();assert.equal(controls.finish,pendingCommit,'repeated clicks cannot start a second write');
  const field=shadow.querySelector('[aria-label="头像区总高度 数值"]');field.value='350';field.dispatchEvent(new window.Event('input'));field.dispatchEvent(new window.Event('change'));
  controls.holdCommit=false;pendingCommit();await tick();assert.equal(shadow.querySelector('#save-state').textContent,'未保存的草稿');assert.match(shadow.querySelector('#notice').textContent,/之后的修改尚未保存/);assert.equal(JSON.parse(await storage.load()).headerHeight,initial.headerHeight);assert.equal(field.value,'350');
  await saveEditorScheme(shadow,storage);assert.equal(JSON.parse(await storage.load()).headerHeight,350);
  controls.holdCommit=true;shadow.querySelector('#save').click();await tick();const finish=controls.finish;
  await importFile(shadow,window,new Blob([JSON.stringify({...initial,headerHeight:420})]));shadow.querySelector('#close').click();controls.holdCommit=false;finish();await tick();shadow.querySelector('.launcher').click();await settleNativeCanvas();assert.equal(shadow.querySelector('#save-state').textContent,'未保存的草稿');assert.equal((await saveEditorScheme(shadow,storage)).headerHeight,420);
  assert.equal(databases.get(SCHEME_DB).get(SCHEME_STORE).size,1,'all saves use the same slot');shadow.querySelector('#close').click();
});

test('failed startup reads do not overwrite storage; explicit retry cannot clobber a changed draft',async()=>{
  const {factory,controls,databases}=indexedDatabase(),storage=createSchemeStorage({indexedDB:factory});const saved=JSON.stringify({version:1,headerHeight:333});await storage.save(saved);controls.failOpen=true;
  const {document,window}=mount(factory);await import('./index.js?failed-load');const shadow=document.querySelector('#orange-theme-lab').shadowRoot;shadow.querySelector('.launcher').click();await settleNativeCanvas();assert.match(shadow.querySelector('#notice').textContent,/方案未载入/);
  shadow.querySelector('#save').click();assert.match(shadow.querySelector('#notice').textContent,/先点击.*重新读取/);assert.equal(databases.get(SCHEME_DB).get(SCHEME_STORE).get(SCHEME_KEY).json,saved);
  controls.failOpen=false;controls.holdCommit=true;shadow.querySelector('#restore').click();await tick();
  await importFile(shadow,window,new Blob([JSON.stringify({version:1,headerHeight:344})]));controls.holdCommit=false;controls.finish();await tick();assert.match(shadow.querySelector('#notice').textContent,/重新读取保存方案/);assert.equal((await saveEditorScheme(shadow,storage)).headerHeight,344,'retry does not replace a newer imported draft');shadow.querySelector('#close').click();
});

test('starting a new file import takes priority over an earlier restore retry before the file finishes reading',async()=>{
  const {factory,controls}=indexedDatabase(),storage=createSchemeStorage({indexedDB:factory});await storage.save(JSON.stringify({version:1,headerHeight:333}));controls.failOpen=true;
  const {document,window}=mount(factory);await import('./index.js?restore-import-race');const shadow=document.querySelector('#orange-theme-lab').shadowRoot;shadow.querySelector('.launcher').click();await settleNativeCanvas();
  controls.failOpen=false;controls.holdCommit=true;shadow.querySelector('#restore').click();await tick();const finish=controls.finish;
  let finishFile;await importFile(shadow,window,{size:100,text:()=>new Promise(resolve=>finishFile=resolve)});
  controls.holdCommit=false;finish();await tick();assert.match(shadow.querySelector('#notice').textContent,/重新读取保存方案/);
  finishFile(JSON.stringify({version:1,headerHeight:344}));await tick();assert.match(shadow.querySelector('#notice').textContent,/已导入/);assert.equal((await saveEditorScheme(shadow,storage)).headerHeight,344);shadow.querySelector('#close').click();
});
