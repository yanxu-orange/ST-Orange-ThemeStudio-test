import {navigateRegion} from './test-support/editor-navigation.mjs';
import {editorStorage,saveEditorScheme} from './test-support/editor-storage.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {itemPoint,sceneTextRules} from './text-scene.mjs';

test('individual text editor hides batch controls but preserves legacy offsets through navigation, edits, import and export',async()=>{
 const {document,window}=parseHTML('<html><head><style id="custom-style"></style></head><body><div id="sheld"><div id="chat"></div></div></body></html>');
 const desc=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:desc.get,set(v){for(const o of this.options)o.toggleAttribute('selected',o.value===String(v));},configurable:true});
 const raw=JSON.stringify({version:3,template:'kitty',layout:'collage',textAlign:'end',textInset:13,textTop:63}),values=new Map();
 Object.assign(globalThis,{document,window,localStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{},ResizeObserver:class{observe(){}unobserve(){}disconnect(){}}});
 const scheme=await editorStorage(raw);await import('./index.js');const sh=document.querySelector('#orange-theme-lab').shadowRoot;
 const save=()=>saveEditorScheme(sh,scheme);
 const retained=c=>{assert.equal(c.textAlign,'end');assert.equal(c.textInset,13);assert.equal(c.textTop,63);};
 const region=()=>{navigateRegion(sh,'header');sh.querySelector('[data-kind="region"]').click();assert.ok(!sh.innerHTML.includes('文字区整体排版'));for(const label of ['文字区对齐','文字区两侧内缩','文字区上方留白'])assert.equal(sh.querySelector(`[aria-label="${label}"]`),null);};
 sh.querySelector('.launcher').click();assert.equal((await scheme.load()),raw);region();const before=(await save());retained(before);
 const point=itemPoint(before,before.textItems.name,300);assert.deepEqual(point,{x:300*(before.textItems.name.x+13)/100,y:before.textItems.name.y+63});
 assert.match(sceneTextRules(before,{name:'.name'}),/text-align:end!important/);
 for(const kind of ['name','time','text']){sh.querySelector(`[data-kind="${kind}"]`).click();assert.ok(sh.querySelector(`[aria-label="${{name:'名字',time:'时间',text:'文案'}[kind]} 纵向位置 数值"]`));retained((await save()));}
 sh.querySelector('[data-kind="name"]').click();const input=sh.querySelector('[aria-label="名字 纵向位置 数值"]');input.value='321';input.dispatchEvent(new window.Event('input'));input.dispatchEvent(new window.Event('change'));retained((await save()));sh.querySelector('#undo').click();assert.deepEqual((await save()),before);
 sh.querySelector('#narrow').click();region();assert.deepEqual((await save()),before);sh.querySelector('#close').click();sh.querySelector('.launcher').click();region();assert.deepEqual((await save()),before);
 const importer=sh.querySelector('#import-file');Object.defineProperty(importer,'files',{value:[{size:100,text:async()=>JSON.stringify(before)}],configurable:true});const event=new window.Event('change');importer.dispatchEvent(event);Object.defineProperty(event,'target',{value:importer});await new Promise(r=>setImmediate(r));assert.deepEqual((await save()),before);
 let blob;const oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;try{URL.createObjectURL=b=>{blob=b;return 'blob:test';};URL.revokeObjectURL=()=>{};sh.querySelector('#export').click();assert.deepEqual(JSON.parse(await blob.text()),before);}finally{URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;}
 assert.deepEqual(itemPoint((await save()),before.textItems.name,300),point);
 sh.querySelector('[data-kind="time"]').click();
 const timeBefore=(await save()),y=sh.querySelector('[aria-label="时间 纵向位置 数值"]'),plus=sh.querySelector('[aria-label="时间 纵向位置 增加"]'),minus=sh.querySelector('[aria-label="时间 纵向位置 减少"]');
 assert.equal(y.min,-400);assert.equal(y.max,1600);assert.equal(y.step,1);
 plus.click();plus.click();assert.equal((await save()).textItems.time.y,timeBefore.textItems.time.y+2);
 sh.querySelector('#undo').click();assert.equal((await save()).textItems.time.y,timeBefore.textItems.time.y+1);
 sh.querySelector('#undo').click();assert.deepEqual((await save()),timeBefore);
 const setY=value=>{const field=sh.querySelector('[aria-label="时间 纵向位置 数值"]');field.value=String(value);field.dispatchEvent(new window.Event('input'));field.dispatchEvent(new window.Event('change'));};
 setY(1600);assert.equal(sh.querySelector('[aria-label="时间 纵向位置 增加"]').disabled,true);sh.querySelector('[aria-label="时间 纵向位置 减少"]').click();assert.equal((await save()).textItems.time.y,1599);
 setY(-400);assert.equal(sh.querySelector('[aria-label="时间 纵向位置 减少"]').disabled,true);sh.querySelector('[aria-label="时间 纵向位置 增加"]').click();assert.equal((await save()).textItems.time.y,-399);
 setY('');assert.equal(sh.querySelector('[aria-label="时间 纵向位置 增加"]').disabled,true);assert.equal(sh.querySelector('[aria-label="时间 纵向位置 减少"]').disabled,true);
 setY(timeBefore.textItems.time.y);const beforeOrder=(await save());sh.querySelector('#mode-layers').click();assert.equal(sh.querySelector('.region-layer-row.selected').dataset.layerKey,'time');const up=[...sh.querySelectorAll('.region-layer-row.selected button')].find(b=>b.textContent==='上移');assert.ok(up);up.click();const ordered=(await save());assert.equal(ordered.regionOrder.header.indexOf('time'),beforeOrder.regionOrder.header.indexOf('time')+1);assert.deepEqual(ordered.textItems,beforeOrder.textItems);assert.equal(new Set(ordered.regionOrder.header).size,ordered.regionOrder.header.length);assert.equal(sh.querySelector('.region-layer-row.selected').dataset.layerKey,'time');sh.querySelector('#undo').click();assert.deepEqual((await save()),beforeOrder);

});
