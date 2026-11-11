import {test} from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {parseHTML} from 'linkedom';
import {editorStorage} from './test-support/editor-storage.mjs';

test('workshop initializes and opens without secure-context randomUUID',async()=>{
  const original=Object.getOwnPropertyDescriptor(globalThis,'crypto');
  Object.defineProperty(globalThis,'crypto',{value:{getRandomValues:values=>webcrypto.getRandomValues(values)},configurable:true});
  try{
    const {document,window}=parseHTML('<html><head></head><body><div id="sheld"><div id="chat"></div></div></body></html>');
    const select=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');
    Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:select.get,set(value){for(const option of this.options)option.toggleAttribute('selected',option.value===String(value));},configurable:true});
    const values=new Map();
    Object.assign(globalThis,{document,window,localStorage:{getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)},requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{},ResizeObserver:class{observe(){}unobserve(){}disconnect(){}}});
    await editorStorage();
    await import('./index.js');
    const shadow=document.querySelector('#orange-theme-lab')?.shadowRoot;
    assert.ok(shadow,'startup completes');
    shadow.querySelector('.launcher').click();
    assert.equal(shadow.querySelector('.panel').classList.contains('hidden'),false);
    shadow.querySelector('#close').click();
  }finally{if(original)Object.defineProperty(globalThis,'crypto',original);else delete globalThis.crypto;}
});
