import {createLiveAdapter} from './live-adapter.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import {parseHTML} from 'linkedom';
import {navigateRegion} from './test-support/editor-navigation.mjs';
import {seedNativeChat,requestNativeFrame,cancelNativeFrame,settleNativeCanvas} from './test-support/native-chat.mjs';
import {editorStorage,saveEditorScheme} from './test-support/editor-storage.mjs';
test('stat objects independently style native values and labels, persist, restore and clean up',async()=>{
 const {document,window}=parseHTML('<html><head><style id="custom-style"></style></head><body><div id="sheld"><div id="chat" style="gap:18px"></div></div></body></html>');
 const d=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:d.get,set(v){for(const o of this.options)o.toggleAttribute('selected',o.value===String(v));},configurable:true});
 const proto=Object.getPrototypeOf(document.createElement('dialog'));proto.showModal=function(){};proto.close=function(){};
 const values=new Map();Object.assign(globalThis,{document,window,localStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},requestAnimationFrame:requestNativeFrame,cancelAnimationFrame:cancelNativeFrame,ResizeObserver:class{observe(){}unobserve(){}disconnect(){}}});
 seedNativeChat(document);const storage=await editorStorage(null);await import('./index.js');
 const shadow=document.querySelector('#orange-theme-lab').shadowRoot;
 shadow.querySelector('.launcher').click();await settleNativeCanvas();navigateRegion(shadow,'native');shadow.querySelector('[data-kind="info"]').click();
 const set=async(label,v,event='input')=>{const input=shadow.querySelector(`[aria-label="${label}"]`);assert.ok(input,label);input.value=String(v);input.dispatchEvent(new window.Event(event));if(event==='input')input.dispatchEvent(new window.Event('change'));await settleNativeCanvas();};
 assert.ok(shadow.querySelector('[data-object="floor"]'));assert.equal(shadow.querySelectorAll('[aria-label="所在区域"]').length,1);
 await set('前缀','第 ');await set('后缀',' 期');await set('左右移动 数值',12);
 shadow.querySelector('[data-object="tokens"]').click();assert.equal(shadow.querySelector('[aria-label="标签样式"]'),null);
 const labelInput=shadow.querySelector('[aria-label="标签文案"]');labelInput.value='本期篇幅';labelInput.dispatchEvent(new window.Event('input'));labelInput.dispatchEvent(new window.Event('blur'));assert.ok(shadow.querySelector('[aria-label="标签样式"]'));await set('数值样式','custom','change');await set('字号 数值',13);await set('字重','500');
 await set('标签样式','custom','change');assert.equal(shadow.querySelectorAll('[aria-label="字体"]')[1].querySelector('option[value="auto"]').textContent,'跟随数值字体');assert.equal(shadow.querySelectorAll('[aria-label="字重"]')[1].querySelector('option[value="auto"]').textContent,'跟随数值字重');const labels=shadow.querySelectorAll('[aria-label="字号 数值"]');assert.equal(labels.length,2);labels[1].value='9';labels[1].dispatchEvent(new window.Event('input'));labels[1].dispatchEvent(new window.Event('change'));await settleNativeCanvas();
 const stat=document.querySelector('.tokenCounterDisplay');assert.equal(stat.textContent,'42');assert.equal(stat.dataset.otlStatLabel,'本期篇幅');assert.equal(stat.dataset.otlStatValue,'true');
 const saved=await saveEditorScheme(shadow,storage);assert.equal(saved.nativeStyle.stats.tokens.valueStyle.size,13);assert.equal(saved.nativeStyle.stats.tokens.valueStyle.weight,500);assert.equal(saved.nativeStyle.stats.tokens.label.style.size,9);assert.equal(saved.nativeStyle.stats.floor.x,12);assert.equal(saved.nativeStyle.stats.time.label,undefined);
 await set('标签文案','');assert.equal(shadow.querySelector('[aria-label="标签样式"]'),null);shadow.querySelector('#restore').click();await settleNativeCanvas();assert.equal(stat.dataset.otlStatLabel,'本期篇幅');
 let blob;const create=URL.createObjectURL,revoke=URL.revokeObjectURL;URL.createObjectURL=b=>{blob=b;return 'blob:stats';};URL.revokeObjectURL=()=>{};shadow.querySelector('#export').click();await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(JSON.parse(await blob.text()),saved);URL.createObjectURL=create;URL.revokeObjectURL=revoke;
 shadow.querySelector('#close').click();assert.equal(stat.hasAttribute('data-otl-stat-label'),false);assert.equal(stat.textContent,'42');
 let observers=[];const queue=[];class Observer{constructor(cb){this.cb=cb;observers.push(this);}observe(){}disconnect(){}}
 const adapter=createLiveAdapter({document,resolveArtwork:()=>'',MutationObserver:Observer,requestFrame:fn=>{queue.push(fn);return queue.length;},cancelFrame:()=>{}});
 const flush=()=>{for(let i=0;i<10&&queue.length;i++){const batch=queue.splice(0);for(const fn of batch)fn();}};
 adapter.start(saved);flush();
 const mutate=(text)=>{stat.textContent=text;for(const observer of observers)observer.cb([{type:'childList',target:stat,addedNodes:[...stat.childNodes],removedNodes:[]}]);flush();};
 mutate('');assert.equal(stat.dataset.otlStatValue,'false');mutate('12345');assert.equal(stat.dataset.otlStatValue,'true');assert.equal(stat.textContent,'12345');
 stat.hidden=true;for(const observer of observers)observer.cb([{type:'attributes',target:stat,attributeName:'hidden',addedNodes:[],removedNodes:[]}]);flush();assert.equal(stat.hidden,true);stat.hidden=false;
 adapter.stop();assert.equal(stat.hasAttribute('data-otl-stat-label'),false);assert.equal(stat.textContent,'12345');

});
