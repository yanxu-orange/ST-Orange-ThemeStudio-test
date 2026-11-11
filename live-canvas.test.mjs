import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {createLiveCanvas} from './live-canvas.mjs';

// A small capture-order EventTarget is intentional: linkedom does not model capture.
function documentFor(){
 const {document,window}=parseHTML('<html><head></head><body><div id="top-bar"></div><div id="top-settings-holder"><div id="user-settings-button"><button class="drawer-toggle"></button><div class="drawer-content"><input value="untouched"></div></div><div id="WI-SP-button"><button class="drawer-toggle"></button><div class="drawer-content"><textarea>world text</textarea></div></div></div><div id="sheld"><div id="chat"><div class="mes">native</div></div><div id="send_form"><textarea id="send_textarea">draft</textarea><button class="swipe_right">arrow</button></div></div></body></html>');
 const handlers=new Map(),add=document.addEventListener.bind(document),remove=document.removeEventListener.bind(document);
 document.addEventListener=(type,fn,capture)=>{if(type.startsWith('swiped-')){const list=handlers.get(type)||[];list.push({fn,capture:!!capture});handlers.set(type,list);}else add(type,fn,capture);};
 document.removeEventListener=(type,fn,capture)=>{if(type.startsWith('swiped-'))handlers.set(type,(handlers.get(type)||[]).filter(x=>x.fn!==fn||x.capture!==!!capture));else remove(type,fn,capture);};
 const swipe=type=>{let stopped=false;const event={stopImmediatePropagation(){stopped=true;}};for(const item of [...(handlers.get(type)||[])].sort((a,b)=>b.capture-a.capture)){item.fn(event);if(stopped)break;}};
 for(const toggle of document.querySelectorAll('.drawer-toggle'))toggle.addEventListener('click',()=>toggle.parentElement.querySelector('.drawer-content').classList.toggle('openDrawer'));
 return {document,window,swipe};
}

test('entire edit session blocks only horizontal synthetic swipe, preserves clicks, and restores both directions',()=>{
 const {document,swipe}=documentFor();let left=0,right=0,clicks=0;
 document.addEventListener('swiped-left',()=>left++);document.addEventListener('swiped-right',()=>right++);
 const button=document.querySelector('.swipe_right');button.addEventListener('click',()=>clicks++);
 const canvas=createLiveCanvas({document});canvas.start();canvas.start();swipe('swiped-left');swipe('swiped-right');button.click();
 assert.equal(left,0);assert.equal(right,0);assert.equal(clicks,1);
 canvas.stop();swipe('swiped-left');swipe('swiped-right');assert.equal(left,1);assert.equal(right,1);
 canvas.start();swipe('swiped-left');assert.equal(left,1);canvas.stop();swipe('swiped-left');assert.equal(left,2);
});

test('layout and real page navigation retain native nodes, values, and independent scroll containers',()=>{
 const {document}=documentFor(),chat=document.querySelector('#chat'),message=chat.firstElementChild,input=document.querySelector('#send_textarea'),canvas=createLiveCanvas({document});
 canvas.start();canvas.layout({left:8,width:374,top:12,height:420});
 const css=document.getElementById('orange-workbench-layout').textContent;
 assert.match(css,/#chat\{[^}]*overflow-y:auto/);assert.match(css,/drawer-content.openDrawer[^}]*overflow-y:auto/);
 assert.match(css,/touch-action:pan-y pinch-zoom/);assert.match(css,/height:372px/);
 assert.equal(document.querySelector('#chat'),chat);assert.equal(chat.firstElementChild,message);assert.equal(input.value,'draft');
 assert.equal(canvas.showPage('settings'),true);assert.equal(document.querySelector('#user-settings-button .drawer-content').classList.contains('openDrawer'),true);
 canvas.showPage('worldbook');assert.equal(document.querySelector('#user-settings-button .drawer-content').classList.contains('openDrawer'),false);assert.equal(document.querySelector('#WI-SP-button .drawer-content').classList.contains('openDrawer'),true);
 canvas.showPage('chat');assert.equal(document.querySelector('#WI-SP-button .drawer-content').classList.contains('openDrawer'),false);
 canvas.stop();assert.equal(document.getElementById('orange-workbench-layout'),null);assert.equal(document.documentElement.hasAttribute('data-orange-editor'),false);assert.equal(input.value,'draft');assert.equal(chat.firstElementChild,message);
});
