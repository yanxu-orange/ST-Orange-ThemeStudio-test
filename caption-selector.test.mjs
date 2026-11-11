import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {createWorkbench,workbenchMarkup,normalizeSelection,REGION_NAMES} from './workbench-ui.mjs';
function fixture(region='header'){
 const {document,window}=parseHTML('<html><body><div id="host"></div></body></html>');
 const desc=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:desc.get,set(value){for(const option of this.options)option.selected=option.value===String(value);},configurable:true});
 const shadow=document.querySelector('#host').attachShadow({mode:'open'});shadow.innerHTML=workbenchMarkup();
 let navigations=0;const bench=createWorkbench(shadow,{onNavigate:()=>navigations++});bench.choose(region,'text','');
 const prefix=region==='footer'?'footer:':'caption:';
 const render=(captions)=>{normalizeSelection(bench.ui,[],region==='header'?captions:[],region==='footer'?captions:[]);const add=document.createElement('button');add.id='add';add.textContent='添加文案';bench.render({kinds:[['text','自定义文案']],objects:captions.map(c=>[prefix+c.id,c.name]),title:'当前文案',actions:add});return shadow.querySelector('[aria-label="选择文案"]');};
 return {shadow,window,bench,render,prefix,navigations:()=>navigations};
}
for(const region of ['header','footer'])test(`${region} captions use a native selector for selected, new, deleted and empty objects`,()=>{
 const f=fixture(region),caps=[{id:'a',name:'第一条'},{id:'b',name:'第二条 · 已隐藏'}];
 let select=f.render(caps);assert.equal(select.value,f.prefix+'a');assert.equal(select.options.length,2);assert.equal(select.hasAttribute('size'),false);assert.equal(f.shadow.querySelector('.object-list button'),null);assert.equal(f.shadow.querySelector('#add').closest('.object-list'),null);assert.equal(f.shadow.querySelector('.object-list').dataset.captionSelector,'true');assert.equal(f.shadow.querySelector('.selected-title').hidden,true);
 for(const option of select.options)option.selected=option.value===f.prefix+'b';select.dispatchEvent(new f.window.Event('change'));assert.equal(f.bench.ui.object,f.prefix+'b');assert.equal(f.navigations(),1);assert.equal(f.bench.ui.mobileView,'adjust');
 select=f.render(caps);assert.equal(select.value,f.prefix+'b');
 caps.push({id:'c',name:'新文案'});f.bench.ui.object=f.prefix+'c';select=f.render(caps);assert.equal(select.value,f.prefix+'c');
 caps.pop();select=f.render(caps);assert.equal(select.value,f.prefix+'a');assert.equal(f.bench.ui.object,f.prefix+'a');
 select=f.render([]);assert.equal(select.disabled,true);assert.equal(select.value,'');assert.equal(select.textContent,'暂无文案');assert.equal(f.shadow.querySelector('#add').disabled,false);
 f.bench.ui.object=f.prefix+'d';select=f.render([{id:'d',name:'重新添加'}]);assert.equal(select.disabled,false);assert.equal(select.value,f.prefix+'d');
});
test('image objects keep buttons and pressed state; native region is renamed',()=>{
 const f=fixture();f.bench.choose('header','image','image-b');f.bench.render({objects:[['image-a','图片一'],['image-b','图片二']],title:'图片二'});
 assert.equal(f.shadow.querySelector('[aria-label="选择文案"]'),null);assert.equal(f.shadow.querySelector('[data-object="image-b"]').getAttribute('aria-pressed'),'true');f.shadow.querySelector('[data-object="image-a"]').click();assert.equal(f.bench.ui.object,'image-a');
 assert.equal(REGION_NAMES.native,'消息控件');assert.equal(f.shadow.querySelector('#region-select [value=native]').textContent,'消息控件');
 assert.match(f.shadow.querySelector('style').textContent,/\.object-list\[data-caption-selector=true\]\{[^}]*max-height:none;overflow:visible/);
});
