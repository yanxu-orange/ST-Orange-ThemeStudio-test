import {navigateRegion} from './test-support/editor-navigation.mjs';
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
  // Blob.text() is asynchronous for large files. Wait for that actual read rather
  // than assuming one event-loop turn completes a 27 MiB import under load.
  let readDone;const read=new Promise(resolve=>{readDone=resolve;});
  const tracked={text:async()=>{try{return await file.text();}finally{readDone();}}};
  const input=shadow.querySelector('#import-file');Object.defineProperty(input,'files',{value:[tracked],configurable:true});
  const event=new window.Event('change');input.dispatchEvent(event);Object.defineProperty(event,'target',{value:input});if(file instanceof Blob)await read;await tick();
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
  navigateRegion(shadow,'header');shadow.querySelector('[data-kind="region"]').click();
  controls.holdCommit=true;shadow.querySelector('#save').click();await tick();assert.equal(shadow.querySelector('#save').disabled,true);assert.equal(shadow.querySelector('#save-state').textContent,'正在保存…');
  const pendingCommit=controls.finish;
  navigateRegion(shadow,'body');navigateRegion(shadow,'header');shadow.querySelector('[data-kind="region"]').click();
  assert.equal(shadow.querySelector('#save').disabled,true,'field redraw cannot unlock an in-flight save');
  shadow.querySelector('#save').dispatchEvent(new window.Event('click'));await tick();assert.equal(controls.finish,pendingCommit,'save state rejects a repeated event independently of the button DOM');
  const field=shadow.querySelector('[aria-label="头像区总高度 数值"]');field.value='350';field.dispatchEvent(new window.Event('input'));field.dispatchEvent(new window.Event('change'));assert.equal(shadow.querySelector('#save-state').textContent,'正在保存…','new edits do not hide an in-flight write');
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

test('image-bearing undo isolates edits, replacement, deletion, branch edits and the 40-step limit',async()=>{
 const {factory}=indexedDatabase(),storage=createSchemeStorage({indexedDB:factory}),{document,window}=mount(factory);
 await import('./index.js?undo-snapshot-isolation');const sh=document.querySelector('#orange-theme-lab').shadowRoot;sh.querySelector('.launcher').click();await settleNativeCanvas();
 const save=()=>saveEditorScheme(sh,storage),undo=()=>sh.querySelector('#undo').click();
 const imageA='data:image/png;base64,'+'A'.repeat(200000),imageB='data:image/png;base64,'+'B'.repeat(200000);
 const initial=await save();initial.layers=[newLayer('custom',{id:'undo-image',image:imageA,x:8})];delete initial.regionOrder;
 await importFile(sh,window,new Blob([JSON.stringify(initial)]));const baseline=await save();
 function layerFields(){navigateRegion(sh,'header');sh.querySelector('[data-kind="image"]').click();}
 function input(label,value,finish=true){const node=sh.querySelector(`[aria-label="${label}"]`);assert.ok(node,label);node.value=String(value);node.dispatchEvent(new window.Event('input'));if(finish)node.dispatchEvent(new window.Event('change'));return node;}
 layerFields();
 const originalClone=globalThis.structuredClone,originalStringify=JSON.stringify;
 try{
  globalThis.structuredClone=(value,...args)=>{assert.ok(!value?.layers?.some(l=>l.image===imageA),'history must not structured-clone images');return originalClone(value,...args);};
  JSON.stringify=(value,...args)=>{assert.ok(!value?.layers?.some(l=>l.image===imageA),'history must not serialize images');return originalStringify(value,...args);};
  input('距右边距离 数值',20,false);input('距右边距离 数值',30,false);input('距右边距离 数值',40);
 }finally{globalThis.structuredClone=originalClone;JSON.stringify=originalStringify;}
 assert.equal((await save()).layers[0].x,40);undo();assert.deepEqual(await save(),baseline,'continuous slider edits are one history item');
 layerFields();input('距右边距离 数值',45);const moved=await save();
 const replaced=structuredClone(moved);replaced.layers[0].image=imageB;await importFile(sh,window,new Blob([JSON.stringify(replaced)]));layerFields();
 [...sh.querySelectorAll('button')].find(b=>b.textContent==='移除素材').click();assert.equal((await save()).layers.length,0);
 undo();assert.equal((await save()).layers[0].image,imageB);undo();assert.deepEqual(await save(),moved);
 layerFields();input('距右边距离 数值',70);assert.equal((await save()).layers[0].x,70);undo();assert.deepEqual(await save(),moved);undo();assert.deepEqual(await save(),baseline,'editing after undo preserves earlier history');
 // Import mutates nested persisted branches; each undo must restore the complete prior snapshot.
 const nested=structuredClone(baseline);nested.photos.ai.image=imageB;nested.pageHeaders.settings.image=imageB;nested.pageHeaders.settings.enabled=true;nested.captions[0].content='new caption';nested.nativeStyle.actions.edit.source={kind:'custom',asset:'',image:imageB};
 await importFile(sh,window,new Blob([JSON.stringify(nested)]));assert.equal((await save()).pageHeaders.settings.image,imageB);undo();assert.deepEqual(await save(),baseline);
 navigateRegion(sh,'header');sh.querySelector('[data-kind="region"]').click();
 for(let i=0;i<41;i++)input('头像区总高度 数值',300+i);
 assert.equal((await save()).headerHeight,340);for(let i=0;i<40;i++)undo();assert.equal((await save()).headerHeight,300);assert.equal(sh.querySelector('#undo').disabled,true);sh.querySelector('#close').click();
});
