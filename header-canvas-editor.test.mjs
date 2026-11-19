import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {createSchemeModel} from './scheme-model.mjs';
import {createAvatarEditor} from './avatar-editor.mjs';
import {newLayer} from './layers.mjs';

const model=createSchemeModel();
function editor(config){
 const {document,window}=parseHTML('<html><body><div id="fields"></div></body></html>');
 const desc=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:desc.get,set(v){for(const o of this.options)o.toggleAttribute('selected',o.value===String(v));},configurable:true});
 const counts={remember:0,apply:0,render:0},messages=[],controls=[];
 const make=(tag,classes='',text)=>{const n=document.createElement(tag);n.className=classes;if(text)n.textContent=text;return n;};
 const api=createAvatarEditor({make,getConfig:()=>config,remember:()=>counts.remember++,getPhotoScope:()=> 'ai',apply:()=>counts.apply++,renderFields:()=>counts.render++,validate:model.validate,notify:m=>messages.push(m),setPhotoScope:()=>{},getUi:()=>({}),propertyHeading:()=>{},editorControl:(_,f)=>controls.push(f),field:model.field});
 return {document,window,container:document.querySelector('#fields'),api,counts,messages,controls};
}
test('enabling a legal small percentage avatar remains saveable and editable below40 design px',()=>{
 const c=structuredClone(model.templates.blank);c.photos.ai.widthUnit='percent';c.photos.ai.size=1;
 model.validate(c);const old=structuredClone(c),f=editor(c);f.api.renderHeaderHeightFields(f.container);f.container.querySelector('#enable-header-canvas').click();
 assert.equal(c.version,11);assert.ok(c.photos.ai.size>1&&c.photos.ai.size<40);assert.deepEqual(model.validate(c),c);assert.equal(f.counts.remember,1);assert.deepEqual(f.messages,[]);
 const beforeRender=structuredClone(c);f.container.replaceChildren();f.api.renderPhotoFields(f.container);assert.equal(f.controls.find(v=>v.key==='size').min,1);
 assert.equal(f.container.querySelector('[aria-label="头像宽度单位"]'),null);assert.equal(f.controls.find(v=>v.key==='size').unit,'px');assert.deepEqual(c,beforeRender);
 old.photos.ai.widthUnit='px';old.photos.ai.size=1;assert.throws(()=>model.validate(old),/头像参数/);
});
test('out-of-range legacy percentage offset cannot leave the editor in an unsaveable new mode',()=>{
 const c=model.validate({...structuredClone(model.templates.blank),headerHeight:1000,layers:[newLayer('asset',{asset:'shared-spring-flower-stem',offsetUnit:'percent',x:600,y:600})],regionOrder:undefined});
 const before=structuredClone(c),f=editor(c);f.api.renderHeaderHeightFields(f.container);f.container.querySelector('#enable-header-canvas').click();
 assert.deepEqual(c,before);assert.deepEqual(f.counts,{remember:0,apply:0,render:0});assert.match(f.messages[0],/^未启用制作画布：/);assert.deepEqual(model.validate(c),before);
});


test('legacy avatar width still offers px and percent, while rendering does not mutate saved geometry',()=>{
 const c=model.validate(structuredClone(model.templates.blank)),before=structuredClone(c),f=editor(c);f.api.renderPhotoFields(f.container);
 const unit=f.container.querySelector('[aria-label="头像宽度单位"]');assert.ok(unit);assert.deepEqual([...unit.options].map(o=>o.value),['px','percent']);assert.deepEqual(c,before);assert.deepEqual(model.validate(c),before);assert.equal(f.counts.remember,0);
});
