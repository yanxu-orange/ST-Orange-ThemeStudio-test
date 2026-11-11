import {navigateRegion} from './test-support/editor-navigation.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {seedNativeChat,requestNativeFrame,cancelNativeFrame,settleNativeCanvas} from './test-support/native-chat.mjs';

test('real canvas retains native statistic values, input draft and message identity without sample banners',async()=>{
 const {document,window}=parseHTML('<html><head><style id="custom-style">.mesIDDisplay::after{content:"封"}</style></head><body><div id="sheld"><div id="chat"></div></div></body></html>');
 const desc=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:desc.get,set(v){for(const o of this.options)o.toggleAttribute('selected',o.value===String(v));},configurable:true});
 const values=new Map();Object.assign(globalThis,{document,window,localStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},requestAnimationFrame:requestNativeFrame,cancelAnimationFrame:cancelNativeFrame,ResizeObserver:class{observe(){}unobserve(){}disconnect(){}}});
 seedNativeChat(document);window.requestAnimationFrame=requestNativeFrame;window.cancelAnimationFrame=cancelNativeFrame;
 const messages=[...document.querySelectorAll('#chat > .mes')],original=messages.map(m=>m.outerHTML),stats=messages.map(m=>[...m.querySelectorAll('.mesIDDisplay,.mes_timer,.tokenCounterDisplay,.swipes-counter')].map(n=>[n,n.textContent])),custom=document.querySelector('#custom-style'),customText=custom.textContent;
 await import('./index.js');const sh=document.querySelector('#orange-theme-lab').shadowRoot;
 const check=()=>{assert.equal(document.querySelector('#otl-sample-heading,[data-orange-lab-fixture]'),null);assert.deepEqual([...document.querySelectorAll('#chat > .mes')],messages);for(const nodes of stats)for(const [node,value]of nodes)assert.equal(node.textContent,value);assert.equal(custom.textContent,customText);};
 sh.querySelector('.launcher').click();await settleNativeCanvas();check();sh.querySelector('#narrow').click();check();navigateRegion(sh,'native');check();
 sh.querySelector('#close').click();await settleNativeCanvas();assert.deepEqual(messages.map(m=>m.outerHTML),original);assert.equal(custom.disabled,false);
 sh.querySelector('.launcher').click();await settleNativeCanvas();check();sh.querySelector('#close').click();assert.deepEqual(messages.map(m=>m.outerHTML),original);assert.equal(values.size,0);
});
