import {openEditor} from './test-support/open-editor.mjs';
import {navigateRegion} from './test-support/editor-navigation.mjs';
import {editorStorage,saveEditorScheme} from './test-support/editor-storage.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {indexedDatabase} from './test-support/indexed-db.mjs';
import {assetUrl} from './catalog.mjs';

test('builtin deletion cancels, preserves placed works, persists across pickers and reopening',async()=>{
 const {document,window}=parseHTML('<html><head><style id="custom-style"></style></head><body><div id="sheld"><div id="chat"></div></div></body></html>');
 const descriptor=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:descriptor.get,set(value){for(const option of this.options)option.toggleAttribute('selected',option.value===String(value));},configurable:true});
 const values=new Map(),{factory}=indexedDatabase();let confirmed=false,fail=false,count=0;
 window.confirm=message=>{assert.match(message,/已放入作品的图片不受影响/);count++;return confirmed;};
 Object.assign(globalThis,{document,window,indexedDB:factory,localStorage:{getItem:key=>values.get(key),setItem:(key,value)=>{if(fail)throw new Error('quota');values.set(key,value);}},requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{},ResizeObserver:class{observe(){}unobserve(){}disconnect(){}}});
 const draft=await editorStorage(null);await import('./index.js');
 const sh=document.querySelector('#orange-theme-lab').shadowRoot,tick=()=>new Promise(r=>setImmediate(r)),save=()=>saveEditorScheme(sh,draft);
 openEditor(sh);navigateRegion(sh,'header');sh.querySelector('[data-kind=image]').click();sh.querySelector('#add-current-image').click();
 const first=sh.querySelector('[data-builtin-asset]'),id=first.dataset.builtinAsset,url=assetUrl(id);first.click();const placed=await save();assert.equal(placed.layers.at(-1).asset,id);
 const show=async()=>{sh.querySelector('#mode-library').click();await tick();};await show();
 const card=()=>sh.querySelector(`[data-builtin-asset="${id}"]`),remove=()=>sh.querySelector(`[data-remove-builtin-asset="${id}"]`);
 assert.equal(count,0);remove().click();assert.ok(card());assert.deepEqual(await save(),placed);
 confirmed=true;fail=true;remove().click();assert.ok(card());assert.equal(remove().disabled,false);assert.match(sh.querySelector('[data-builtin-asset-status]').textContent,/未删除/);fail=false;
 remove().click();assert.equal(card(),null);assert.deepEqual(await save(),placed);assert.equal(assetUrl(id),url);
 navigateRegion(sh,'header');sh.querySelector('[data-kind=image]').click();sh.querySelector('#add-current-image').click();assert.equal(card(),null);assert.equal(sh.querySelector('[data-remove-builtin-asset]'),null);sh.querySelector('#material-back').click();await show();const stale=sh.querySelector('[data-remove-builtin-asset]');sh.querySelector('#mode-edit').click();const n=count;stale.click();assert.equal(count,n);
 navigateRegion(sh,'native');sh.querySelector('#native-edit-pick').click();assert.equal(card(),null);sh.querySelector('#material-back').click();
 sh.querySelector('#close').click();sh.querySelector('.launcher').click();sh.querySelector('[data-flow=continue]').click();await tick();await show();assert.equal(card(),null);assert.equal(sh.querySelectorAll('[data-builtin-asset]').length,23);assert.deepEqual(await save(),placed);await show();
 for(const button of [...sh.querySelectorAll('[data-remove-builtin-asset]')]) {const active=sh.querySelector(`[data-remove-builtin-asset="${button.dataset.removeBuiltinAsset}"]`);active.click();}
 assert.equal(sh.querySelectorAll('[data-builtin-asset]').length,0);assert.match(sh.querySelector('.material-grid').textContent,/暂无内置素材/);assert.deepEqual(await save(),placed);sh.querySelector('#close').click();
});
