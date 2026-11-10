import {editorStorage,saveEditorScheme} from './test-support/editor-storage.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import {parseHTML} from 'linkedom';
test('workbench fill and gradient save, restore, undo and keep independent normal settings',async()=>{
 const {document,window}=parseHTML('<html><head><style id="custom-style"></style></head><body><div id="sheld"><div id="chat"></div></div></body></html>');
 const desc=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:desc.get,set(v){for(const o of this.options)o.toggleAttribute('selected',o.value===String(v));},configurable:true});
 const values=new Map();Object.assign(globalThis,{document,window,localStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{},ResizeObserver:class{observe(){}unobserve(){}disconnect(){}}});
 const scheme=await editorStorage(null);await import('./index.js');const sh=document.querySelector('#orange-theme-lab').shadowRoot;
 const edit=(label,v)=>{const n=sh.querySelector(`[aria-label="${label}"]`);assert.ok(n,label);n.value=String(v);n.dispatchEvent(new window.Event('input'));n.dispatchEvent(new window.Event('change'));};
 const save=()=>saveEditorScheme(sh,scheme);
 sh.querySelector('.launcher').click();sh.querySelector('[data-region="header"]').click();sh.querySelector('[data-kind="avatar"]').click();edit('设计对象','separate');
 const before=(await save());assert.equal(before.photos.ai.enabled,false);edit('铺满卡片顶部','true');edit('头像取景水平位置 数值',25);edit('渐变遮罩','true');edit('渐变强度 数值',.7);
 let c=(await save());assert.equal(c.version,10);assert.equal(c.avatarFill.ai.enabled,true);assert.equal(c.avatarFill.ai.x,25);assert.equal(c.avatarFill.ai.gradient,true);assert.equal(c.avatarFill.ai.opacity,.7);assert.equal(c.avatarFill.user.enabled,false);assert.deepEqual(c.photos,before.photos);
 assert.match([...document.querySelectorAll('style')].map(n=>n.textContent).join('\n'),/object-position:25% 50%/);
 edit('铺满卡片顶部','false');sh.querySelector('#restore').click();c=(await save());assert.equal(c.avatarFill.ai.enabled,true);
 edit('铺满卡片顶部','false');sh.querySelector('#undo').click();assert.equal((await save()).avatarFill.ai.enabled,true);
 const importer=sh.querySelector('#import-file');let good=(await save());const positions=structuredClone(good.textItems);sh.querySelector('[data-kind="region"]').click();edit('头像区总高度 数值',1000);assert.equal((await save()).headerHeight,1000);assert.deepEqual((await save()).textItems,positions);
 for(const version of [9,10]){const bad=structuredClone(good);bad.version=version;bad.headerHeight=version===9?361:1001;if(version===9)delete bad.avatarFill;Object.defineProperty(importer,'files',{value:[{size:100,text:async()=>JSON.stringify(bad)}],configurable:true});const event=new window.Event('change');importer.dispatchEvent(event);Object.defineProperty(event,'target',{value:importer});await new Promise(r=>setImmediate(r));assert.equal((await save()).headerHeight,1000);}
 sh.querySelector('#close').click();assert.equal(document.querySelector('[data-orange-lab-fixture]'),null);
});
