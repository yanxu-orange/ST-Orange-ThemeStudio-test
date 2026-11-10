import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
test('preview text and images select directly across regions, gestures save and undo once, exit cancels, and desktop layout stays expanded',async()=>{
 const {document,window}=parseHTML('<html><head><style id="custom-style"></style></head><body><div id="sheld"><div id="chat"><div id="real-message">Original</div></div><div id="form_sheld"><textarea id="send_textarea">真实草稿</textarea></div></div></body></html>');
 const desc=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:desc.get,set(v){for(const o of this.options)o.toggleAttribute('selected',o.value===String(v));},configurable:true});
 const values=new Map([['formal-store','untouched']]);Object.assign(globalThis,{document,window,localStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{},ResizeObserver:class{observe(){}unobserve(){}disconnect(){}}});window.innerWidth=390;window.innerHeight=844;window.getComputedStyle=()=>({transform:'none',zoom:'1'});
 await import('./index.js');const sh=document.querySelector('#orange-theme-lab').shadowRoot,key='orange.theme-lab.mobile-test.v1',save=()=>{sh.querySelector('#save').click();return JSON.parse(values.get(key));},node=selector=>document.querySelector('[data-orange-lab-fixture=message] '+selector),click=selector=>sh.querySelector(selector).click();
 const pointer=(type,target,x=0,y=0,id=1)=>{const e=new window.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{pointerId:id,clientX:x,clientY:y,button:0,isPrimary:id===1});target.dispatchEvent(e);return e;};
 const drag=(target,dx,dy)=>{pointer('pointerdown',target);pointer('pointermove',target,dx,dy);pointer('pointerup',target,dx,dy);};
 click('.launcher');click('[data-flow=continue]');assert.equal(sh.querySelector('.bar').dataset.toolbarExpanded,'false');const before=save();
 // Direct click keeps the preview open rather than covering the selected object with controls.
 node('.name_text').click();assert.equal(sh.querySelector('.panel').dataset.mobileView,'preview');assert.equal(node('.name_text').dataset.previewDraggable,'true');assert.equal(node('.timestamp').style.touchAction,'auto');
 drag(node('.name_text'),20,30);const nameMoved=save();assert.ok(nameMoved.textItems.name.x>before.textItems.name.x);assert.equal(nameMoved.textItems.name.y,before.textItems.name.y+30);assert.deepEqual(nameMoved.textItems.time,before.textItems.time);click('#undo');assert.deepEqual(save(),before);
 // List selection still gives the same selected time object and numeric controls.
 click('[data-region=header]');click('[data-kind=time]');assert.equal(node('.timestamp').dataset.previewDraggable,'true');assert.ok(sh.querySelector('input[type=number]'));drag(node('.timestamp'),15,12);assert.equal(save().textItems.time.y,before.textItems.time.y+12);click('#undo');assert.deepEqual(save(),before);
 // Wait-free selection via list also covers custom header captions.
 click('[data-kind=text]');const headerCap=before.captions[0];assert.ok(headerCap);sh.querySelector(`[data-object="caption:${headerCap.id}"]`).click();drag(node(`[data-caption-id="${headerCap.id}"]`),5,9);assert.equal(save().captions[0].y,headerCap.y+9);click('#undo');assert.deepEqual(save(),before);
 // Footer captions use their own model and coordinates.
 click('[data-region=footer]');click('#add-footer-caption');const withFooter=save(),footerCap=withFooter.footerCaptions[0],footerNode=node(`[data-footer-caption-id="${footerCap.id}"]`);drag(footerNode,10,15);assert.equal(save().footerCaptions[0].y,footerCap.y+15);click('#undo');assert.deepEqual(save(),withFooter);
 drag(node(`[data-footer-caption-id="${footerCap.id}"]`),99999,99999);const footerBounded=save();assert.equal(footerBounded.footerCaptions[0].x,100);assert.equal(footerBounded.footerCaptions[0].y,400);assert.doesNotMatch(sh.querySelector('#notice').textContent,/未保存/);click('#undo');assert.deepEqual(save(),withFooter);
 drag(node(`[data-footer-caption-id="${footerCap.id}"]`),-99999,-99999);const footerLow=save();assert.equal(footerLow.footerCaptions[0].x,-100);assert.equal(footerLow.footerCaptions[0].y,-400);click('#undo');assert.deepEqual(save(),withFooter);click('#undo');assert.deepEqual(save(),before);
 // Add a new image; region need not already be selected before tapping it.
 click('[data-region=header]');click('.mobile-dock [data-mobile-view=library]');[...sh.querySelectorAll('button')].find(b=>b.textContent==='添加所选素材').click();const withImage=save(),image=withImage.layers.at(-1);click('[data-region=body]');
 const imageNode=node(`[data-layer-id="${image.id}"]`);assert.equal(imageNode.style.pointerEvents,'auto');
 // A new unrelated click may follow a completed gesture after the browser's suppressed compatibility click window.
 const realNow=Date.now;Date.now=()=>realNow()+1000;imageNode.click();Date.now=realNow;
 assert.equal(imageNode.dataset.layerDraggable,'true');assert.equal(sh.querySelector('.panel').dataset.mobileView,'preview');Object.assign(imageNode,{clientWidth:100,clientHeight:50});
 pointer('pointerdown',imageNode,0,0);pointer('pointerdown',imageNode,100,0,2);pointer('pointermove',imageNode,200,0,2);assert.equal(values.get(key),JSON.stringify(withImage));pointer('pointerup',imageNode,200,0,2);pointer('pointerup',imageNode,0,0);const enlarged=save();assert.equal(enlarged.layers.at(-1).width,image.width*2);click('#undo');assert.deepEqual(save(),withImage);
 // Leaving mid-gesture discards transient styles, and reopening starts collapsed.
 const current=node(`[data-layer-id="${image.id}"]`);pointer('pointerdown',current);pointer('pointermove',current,50,60);click('.mobile-toolbar-toggle');click('#close');assert.equal(document.querySelector('[data-orange-lab-fixture]'),null);click('.launcher');click('[data-flow=continue]');assert.equal(sh.querySelector('.bar').dataset.toolbarExpanded,'false');assert.deepEqual(save(),withImage);
 assert.equal(values.get('formal-store'),'untouched');assert.equal(document.querySelector('#send_textarea').value,'真实草稿');assert.equal(document.querySelector('#real-message').textContent,'Original');
 window.innerWidth=1200;window.dispatchEvent(new window.Event('resize'));assert.equal(sh.querySelector('.bar').dataset.toolbarExpanded,'true');assert.equal(sh.querySelector('#save').textContent,'保存方案');assert.ok(sh.querySelector('.panel-head #page-scope'));
});
