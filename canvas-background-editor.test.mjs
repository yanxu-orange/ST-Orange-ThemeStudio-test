import {test} from 'node:test';import assert from 'node:assert/strict';import {parseHTML} from 'linkedom';
test('old solid plan migrates explicitly, undo works, preview and live share wallpaper policy',async()=>{
 const {document,window}=parseHTML('<html><head><style id="custom-style"></style></head><body><div id="bg1" class="cover" style="background-image:url(wallpaper.png)"></div><div id="sheld"><div id="chat"></div><div id="form_sheld"><textarea id="send_textarea">真实当前草稿</textarea></div></div></body></html>'),desc=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:desc.get,set(v){for(const o of this.options)o.toggleAttribute('selected',o.value===String(v));},configurable:true});const original=JSON.stringify({version:3,caption:'旧内容',textItems:{name:{x:7,y:20}}}),values=new Map([['orange.theme-lab.mobile-test.v1',original]]);Object.assign(globalThis,{document,window,localStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{},ResizeObserver:class{observe(){}unobserve(){}disconnect(){}}});window.innerWidth=390;window.innerHeight=844;await import('./index.js');const sh=document.querySelector('#orange-theme-lab').shadowRoot,go=r=>sh.querySelector(`[data-region="${r}"]`).click(),kind=k=>sh.querySelector(`[data-kind="${k}"]`).click(),edit=(label,value)=>{const node=sh.querySelector(`[aria-label="${label}"]`);assert.ok(node,label);node.value=String(value);node.dispatchEvent(new window.Event('input'));node.dispatchEvent(new window.Event('change'));return node;},button=text=>{const n=[...sh.querySelectorAll('button')].find(b=>b.textContent===text);assert.ok(n,text);n.click();},save=()=>{sh.querySelector('#save').click();return JSON.parse(values.get('orange.theme-lab.mobile-test.v1'));};


 const bg=document.querySelector('#bg1'),bgStyle=bg.getAttribute('style'),theme=document.querySelector('#custom-style');theme.disabled=false;
 sh.querySelector('.launcher').click();sh.querySelector('[data-flow=continue]').click();
 assert.equal(theme.disabled,true);
 go('overall');
 assert.equal(save().canvasBackground,'legacy-solid');
 assert.equal(sh.querySelector('[aria-label="整体背景"]'),null);
 button('改为跟随酒馆背景');assert.equal(bg.getAttribute('style'),bgStyle);assert.equal(bg.className,'cover');assert.equal(save().canvasBackground,'tavern');
 assert.ok([...document.querySelectorAll('style')].some(s=>s.textContent.includes('html[data-orange-lab] #sheld,html[data-orange-lab] #chat{background:transparent')));
 sh.querySelector('#undo').click();assert.equal(save().canvasBackground,'legacy-solid');
 button('改为跟随酒馆背景');sh.querySelector('#apply-live').click();
 assert.ok([...document.querySelectorAll('style')].some(s=>s.textContent.includes('html[data-orange-live] #sheld,html[data-orange-live] #chat{background:transparent')));
 assert.equal(theme.disabled,true);assert.equal(bg.getAttribute('style'),bgStyle);
 button('退出应用');assert.equal(theme.disabled,false);assert.equal(bg.getAttribute('style'),bgStyle);assert.equal(bg.className,'cover');assert.ok(![...document.querySelectorAll('style')].some(s=>s.textContent.includes('html[data-orange-live] #sheld,html[data-orange-live] #chat{background:transparent')));
});
