import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {openEditor} from './test-support/open-editor.mjs';
import {seedNativeChat,requestNativeFrame,cancelNativeFrame} from './test-support/native-chat.mjs';
import {editorStorage,saveEditorScheme} from './test-support/editor-storage.mjs';

test('new avatar panels save independent effects, cancel stale uploads and use the existing material picker',async()=>{
 const {document,window}=parseHTML('<html><head></head><body><div id="sheld"><div id="chat"></div></div></body></html>');
 const desc=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:desc.get,set(v){for(const o of this.options)o.toggleAttribute('selected',o.value===String(v));},configurable:true});
 const storage=new Map(),bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64');let color=[255,255,255,255],decode=null;
 const file={size:bytes.length,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};
 Object.assign(globalThis,{document,window,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},requestAnimationFrame:requestNativeFrame,cancelAnimationFrame:cancelNativeFrame,ResizeObserver:class{observe(){}unobserve(){}disconnect(){}},
 createImageBitmap:async()=>decode?await new Promise(r=>decode=r):({width:1,height:1,close(){}}),
 OffscreenCanvas:class{constructor(w,h){this.width=w;this.height=h;}getContext(){return{drawImage(){},getImageData:()=>({data:new Uint8ClampedArray(color)}),putImageData(){}};}async convertToBlob(){return new Blob([bytes],{type:'image/png'});}},
 FileReader:class{readAsDataURL(blob){blob.arrayBuffer().then(b=>{this.result='data:image/png;base64,'+Buffer.from(b).toString('base64');this.onload();});}}});
 const store=await editorStorage(null);seedNativeChat(document);const originals=[...document.querySelectorAll('#chat .avatar>img')];await import('./index.js');const sh=document.querySelector('#orange-theme-lab').shadowRoot;openEditor(sh);sh.querySelector('[data-kind=avatar]').click();
 const tab=x=>sh.querySelector(`[data-avatar-tab=${x}]`).click(),save=()=>saveEditorScheme(sh,store),edit=(name,value)=>{const n=sh.querySelector(`[aria-label="${name}"]`);assert.ok(n,name);n.value=String(value);n.dispatchEvent(new window.Event(n.tagName==='SELECT'?'change':'input'));};
 const unchanged=await save();assert.equal(unchanged.avatarEffects,undefined);tab('avatar');assert.equal((await save()).avatarEffects,undefined);
 edit('AI 与用户','separate');edit('取景缩放 数值',150);edit('饱和度 数值',0);edit('头像取景水平位置 数值',25);
 let c=await save();assert.equal(c.version,12);assert.equal(c.avatarEffects.ai.zoom,150);assert.equal(c.avatarEffects.user.zoom,100);assert.equal(c.avatarFill.ai.x,25);assert.equal(sh.querySelector('[aria-label="头像取景水平位置"]').closest('.position-nudge'),null);
 const upload=async()=>{const input=sh.querySelector('#avatar-mask-file');Object.defineProperty(input,'files',{value:[file],configurable:true});input.dispatchEvent(new window.Event('change'));await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r));};
 await upload();c=await save();assert.equal(c.avatarEffects.ai.mask.kind,'custom');const previous=c.avatarEffects.ai.mask.image;
 color=[0,0,0,255];await upload();assert.match(sh.querySelector('#notice').textContent,/没有可显示/);assert.equal((await save()).avatarEffects.ai.mask.image,previous);
 color=[255,255,255,255];decode=true;await upload();assert.equal(typeof decode,'function');edit('正在设计','user');decode({width:1,height:1,close(){}});decode=null;await new Promise(r=>setImmediate(r));assert.match(sh.querySelector('#notice').textContent,/已取消/);assert.equal((await save()).avatarEffects.user.mask.kind,'none');
 decode=true;await upload();const release=decode;edit('正在设计','ai');await save();const newerNotice=sh.querySelector('#notice').textContent;release({width:1,height:1,close(){}});decode=null;await new Promise(r=>setImmediate(r));assert.equal(sh.querySelector('#notice').textContent,newerNotice,'cancelled upload must not overwrite a newer notice');
 edit('AI 与用户','unified');c=await save();assert.deepEqual(c.avatarEffects.user,c.avatarEffects.ai);
 tab('whole');edit('组合缩放 数值',125);assert.equal((await save()).avatarEffects.ai.scale,125);
 tab('materials');const n=(await save()).layers.length;sh.querySelector('#add-avatar-material').click();sh.querySelector('button[data-builtin-asset]').click();c=await save();assert.equal(c.layers.length,n+1);const layer=c.layers.at(-1);assert.equal(layer.anchor,'avatar');assert.equal(layer.scope,'both');assert.ok(sh.querySelector('[data-avatar-tab=materials][aria-pressed=true]'));
 const handle=sh.querySelector('[data-composition-handle]');const down=new window.Event('keydown');Object.defineProperty(down,'key',{value:'ArrowDown'});handle.dispatchEvent(down);c=await save();assert.ok(c.regionOrder.header.indexOf('image:'+layer.id)<c.regionOrder.header.indexOf('avatar'));
 assert.deepEqual([...document.querySelectorAll('#chat .avatar>img')],originals);sh.querySelector('#close').click();
});
