import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {imageRegionForLayer} from './image-sizing-editor.mjs';
import {newLayer} from './layers.mjs';
import {editImagePixels} from './image-sizing.mjs';
function setup(){const {document}=parseHTML('<html><body><div class="mes" data-otl-live is_user="false"><img data-layer-id="x"></div><div class="mes" data-otl-live is_user="true"><img data-layer-id="x"></div><form id="send_form"><img data-layer-id="input"></form></body></html>');document.defaultView.getComputedStyle=()=>({display:'block',visibility:'visible'});for(const [i,node]of [...document.querySelectorAll('img')].entries()){Object.assign(node,{naturalWidth:200,naturalHeight:100,offsetWidth:100,offsetHeight:50,offsetParent:node.parentElement,getClientRects:()=>[{}]});Object.defineProperties(node.parentElement,{clientWidth:{value:400},clientHeight:{value:100+i*100}});}return document;}
test('region resolver selects role and input, refuses hidden or zero real region',()=>{const document=setup(),l=newLayer('custom',{id:'x',scope:'both'});assert.equal(imageRegionForLayer(document,l,{scope:'user'}).height,200);assert.equal(imageRegionForLayer(document,l,{scope:'ai'}).height,100);assert.equal(imageRegionForLayer(document,{...l,id:'input',anchor:'input'}).height,300);document.querySelector('img').offsetHeight=0;assert.equal(imageRegionForLayer(document,l,{scope:'ai'}).reference,'用户消息');assert.throws(()=>imageRegionForLayer(document,{...l,scope:'ai'},{scope:'ai'}));});
test('absolute pixel editing can work without a visible chat, percentages cannot',()=>{const l=newLayer('custom',{width:100});const n=editImagePixels(l,'height',80,2);assert.equal(n.imageSizing.driver,'height');assert.equal(n.imageSizing.height,80);assert.throws(()=>editImagePixels({...l,widthUnit:'percent'},'width',50,2));assert.equal(l.imageSizing,undefined);});

test('visible image editor changes units without jumping and exposes cover focal controls',async()=>{
 const {renderImageSizing}=await import('./image-sizing-editor.mjs');const document=setup(),window=document.defaultView;
 const d=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:d.get,set(v){for(const o of this.options)o.toggleAttribute('selected',o.value===String(v));},configurable:true});
 const layer=newLayer('custom',{id:'x',width:100,scope:'ai'}),container=document.createElement('div');document.body.append(container);let saved=0;
 const make=(tag,cls='',text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const draw=()=>{container.replaceChildren();renderImageSizing({container,layer,document,make,remember:()=>saved++,apply(){},renderFields:draw,notify:m=>{throw Error(m);}});};draw();
 const unit=container.querySelector('[aria-label="宽度单位"]');unit.value='percent';unit.dispatchEvent(new window.Event('change'));assert.equal(layer.width,25);assert.equal(saved,1);
 const cover=[...container.querySelectorAll('button')].find(n=>n.textContent==='铺满区域');cover.click();assert.equal(layer.imageSizing.mode,'cover');const focal=container.querySelector('[aria-label="取景横向位置"]');focal.value='15';focal.dispatchEvent(new window.Event('change'));assert.equal(layer.imageSizing.mode,'cover');assert.equal(layer.imageSizing.focalX,15);
});

test('late image decode cannot write after same-layer panel rebuild or source replacement',async()=>{
 const {renderImageSizing}=await import('./image-sizing-editor.mjs');const {document,window}=parseHTML('<html><body><div id="panel"></div></body></html>'),container=document.querySelector('#panel');const layer=newLayer('custom',{image:'https://example.com/a.png'}),pending=[],previous=globalThis.Image;
 globalThis.Image=class{naturalWidth=200;naturalHeight=100;decode(){return new Promise(resolve=>pending.push(resolve));}};
 const make=(tag,cls='',text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};let remembers=0;
 const draw=()=>{container.replaceChildren();renderImageSizing({container,layer,document,make,remember:()=>remembers++,apply(){},renderFields:draw,notify(){}});};
 try{draw();let input=container.querySelector('[aria-label="素材宽度"]');input.value='110';input.dispatchEvent(new window.Event('change'));draw();input=container.querySelector('[aria-label="素材宽度"]');input.value='140';input.dispatchEvent(new window.Event('change'));pending[1]();await new Promise(r=>setImmediate(r));pending[0]();await new Promise(r=>setImmediate(r));assert.equal(layer.width,140);assert.equal(remembers,1);
 input=container.querySelector('[aria-label="素材宽度"]');input.value='160';input.dispatchEvent(new window.Event('change'));layer.image='https://example.com/b.png';pending[2]();await new Promise(r=>setImmediate(r));assert.equal(layer.width,140);
 }finally{globalThis.Image=previous;}
});

test('late first image load fills missing height without changing the scheme or focused input',async()=>{
 const {renderImageSizing}=await import('./image-sizing-editor.mjs');const {document}=parseHTML('<html><body><div id="panel"></div></body></html>'),container=document.querySelector('#panel');const layer=newLayer('custom',{image:'https://example.com/a.png',width:100}),probes=[],previous=globalThis.Image;
 globalThis.Image=class{naturalWidth=200;naturalHeight=100;constructor(){probes.push(this);}};
 const make=(tag,cls='',text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};let writes=0;
 const draw=()=>{container.replaceChildren();renderImageSizing({container,layer,document,make,remember:()=>writes++,apply(){},renderFields:draw,notify(){}});};
 try{draw();let input=container.querySelector('[aria-label="图片高度"]');assert.equal(input.value,'');probes[0].onload();assert.equal(input.value,'50');assert.equal(writes,0);assert.equal(layer.imageSizing,undefined);draw();input=container.querySelector('[aria-label="图片高度"]');input.value='75';probes[1].onload();assert.equal(input.value,'75');draw();const callback=probes[2].onload;draw();callback();assert.equal(container.querySelector('[aria-label="图片高度"]').value,'');}finally{globalThis.Image=previous;}
});
