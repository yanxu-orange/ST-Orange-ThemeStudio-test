import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';

test('preview statistics use native-format values without banners and leave real messages unchanged',async()=>{
 const {document,window}=parseHTML('<html><head><style id="custom-style">.mesIDDisplay::after{content:"封"}</style></head><body><div id="sheld"><div id="chat"><div class="mes" mesid="41"><div class="mesIDDisplay">#41</div><div class="mes_timer">8.3s</div><div class="tokenCounterDisplay">907t</div><div class="swipes-counter">2/3</div></div></div></div></body></html>');
 const desc=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:desc.get,set(v){for(const o of this.options)o.toggleAttribute('selected',o.value===String(v));},configurable:true});
 const values=new Map();Object.assign(globalThis,{document,window,localStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{},ResizeObserver:class{observe(){}unobserve(){}disconnect(){}}});
 const real=document.querySelector('.mes'),original=real.outerHTML,custom=document.querySelector('#custom-style'),customText=custom.textContent;
 await import('./index.js');const sh=document.querySelector('#orange-theme-lab').shadowRoot;
 const check=()=>{
  assert.equal(document.querySelector('#otl-sample-heading'),null);
  const samples=[...document.querySelectorAll('[data-orange-lab-fixture=message]')];assert.equal(samples.length,3);
  for(const sample of samples){
   for(const [cls,value]of [['mesIDDisplay','#1'],['mes_timer','2.0s'],['tokenCounterDisplay','120t'],['swipes-counter','1\u200b/\u200b2']]){
    const node=sample.querySelector('.'+cls);assert.equal(node.textContent,value);assert.doesNotMatch(node.textContent,/示例|虚构/);
   }
  }
  assert.equal(real.outerHTML,original);assert.equal(custom.textContent,customText);
 };
 sh.querySelector('.launcher').click();check();sh.querySelector('#narrow').click();check();
 sh.querySelector('[data-region="native"]').click();check();
 sh.querySelector('#close').click();assert.equal(document.querySelectorAll('[data-orange-lab-fixture]').length,0);assert.equal(real.outerHTML,original);assert.equal(custom.disabled,false);
 sh.querySelector('.launcher').click();check();sh.querySelector('#close').click();assert.equal(real.outerHTML,original);assert.equal(values.size,0);
});
