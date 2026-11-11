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
 assert.match(css,/touch-action:pan-y pinch-zoom/);assert.match(css,/height:max\(1px, calc\(432px - calc\(12px \+ var\(--topBarBlockSize, 48px\)\)\)\)/);
 assert.doesNotMatch(css,/#top-bar[^}]*height:/,'canvas does not override native or configured topbar height');
 assert.equal(document.querySelector('#chat'),chat);assert.equal(chat.firstElementChild,message);assert.equal(input.value,'draft');
 assert.equal(canvas.showPage('settings'),true);assert.equal(document.querySelector('#user-settings-button .drawer-content').classList.contains('openDrawer'),true);
 canvas.showPage('worldbook');assert.equal(document.querySelector('#user-settings-button .drawer-content').classList.contains('openDrawer'),false);assert.equal(document.querySelector('#WI-SP-button .drawer-content').classList.contains('openDrawer'),true);
 canvas.showPage('chat');assert.equal(document.querySelector('#WI-SP-button .drawer-content').classList.contains('openDrawer'),false);
 canvas.stop();assert.equal(document.getElementById('orange-workbench-layout'),null);assert.equal(document.documentElement.hasAttribute('data-orange-editor'),false);assert.equal(input.value,'draft');assert.equal(chat.firstElementChild,message);
});

// Deliver MutationObserver callbacks before starting the report debounce wait.
const tick=async()=>{await new Promise(resolve=>setImmediate(resolve));await new Promise(resolve=>setTimeout(resolve,60));};
test('native toggles and external class changes report actual page once without recursive clicks',async()=>{
 const {document}=documentFor(),pages=[],canvas=createLiveCanvas({document,onPage:page=>pages.push(page)});
 canvas.start();await tick();assert.deepEqual(pages,['chat']);
 document.querySelector('#user-settings-button .drawer-toggle').click();await tick();
 assert.equal(canvas.currentPage,'settings');assert.deepEqual(pages,['chat','settings']);
 document.querySelector('#user-settings-button .drawer-content').classList.remove('openDrawer');await tick();assert.equal(pages.at(-1),'chat');
 assert.equal(await canvas.navigateToPage('worldbook'),true);await tick();assert.equal(pages.at(-1),'worldbook');
 const count=pages.length;assert.equal(await canvas.navigateToPage('worldbook'),true);await tick();assert.equal(pages.length,count);
 canvas.stop();document.querySelector('#WI-SP-button .drawer-toggle').click();await tick();assert.equal(pages.length,count);
});
test('unsupported, missing, hidden and disabled drawers leave existing page unchanged',async()=>{
 const {document}=documentFor(),canvas=createLiveCanvas({document});canvas.start();await canvas.navigateToPage('worldbook');
 for(const page of ['unknown','connection','home'])assert.equal(canvas.showPage(page),false);
 const toggle=document.querySelector('#user-settings-button .drawer-toggle');toggle.disabled=true;assert.equal(canvas.showPage('settings'),false);toggle.disabled=false;
 toggle.style.display='none';assert.equal(canvas.showPage('settings'),false);toggle.style.display='';toggle.remove();assert.equal(canvas.showPage('settings'),false);
 assert.equal(canvas.currentPage,'worldbook');canvas.stop();
});
test('observes home without navigating or clearing chat; chat request only closes drawers',async()=>{
 const {document}=documentFor(),pages=[],canvas=createLiveCanvas({document,onPage:page=>pages.push(page)});canvas.start();
 const welcome=document.createElement('div');welcome.className='welcomePanel';document.querySelector('#chat').append(welcome);await tick();assert.equal(pages.at(-1),'home');
 assert.equal(canvas.showPage('home'),false);await canvas.navigateToPage('settings');await canvas.navigateToPage('chat');assert.equal(canvas.currentPage,'home');assert.equal(welcome.isConnected,true);
 welcome.remove();await tick();assert.equal(pages.at(-1),'chat');canvas.stop();
});
test('newer requests and stop cancel pending confirmation; restart has only one subscription',async()=>{
 const {document}=documentFor(),pages=[],canvas=createLiveCanvas({document,onPage:page=>pages.push(page)});canvas.start();
 const first=canvas.navigateToPage('settings'),second=canvas.navigateToPage('worldbook');assert.equal(await first,false);assert.equal(await second,true);assert.equal(canvas.currentPage,'worldbook');
 const pending=canvas.navigateToPage('settings');canvas.stop();assert.equal(await pending,false);const count=pages.length;await tick();assert.equal(pages.length,count);
 canvas.start();await tick();assert.equal(pages.length,count+1);canvas.stop();
});
test('delayed host transition reports actual state rather than the requested label',async()=>{
 const {document}=documentFor(),pages=[];
 const old=document.querySelector('#user-settings-button .drawer-toggle'),toggle=old.cloneNode();old.replaceWith(toggle);
 toggle.addEventListener('click',()=>setTimeout(()=>toggle.parentElement.querySelector('.drawer-content').classList.add('openDrawer'),90));
 const canvas=createLiveCanvas({document,onPage:page=>pages.push(page)});canvas.start();await tick();
 const request=canvas.navigateToPage('settings');assert.equal(canvas.currentPage,'chat');await tick();assert.equal(pages.at(-1),'chat');assert.equal(await request,true);assert.equal(pages.at(-1),'settings');canvas.stop();
});
test('ignored native request fails confirmation and reports actual page for UI rollback',async()=>{
 const {document}=documentFor(),pages=[];
 const old=document.querySelector('#user-settings-button .drawer-toggle');old.replaceWith(old.cloneNode());
 const canvas=createLiveCanvas({document,onPage:page=>pages.push(page)});canvas.start();await tick();
 assert.equal(await canvas.navigateToPage('settings'),false);assert.deepEqual(pages,['chat','chat']);assert.equal(canvas.currentPage,'chat');canvas.stop();
});

test('streaming message and artwork changes do not read drawer layout',async()=>{
 const {document,window}=documentFor();let reads=0;
 window.getComputedStyle=()=>{reads++;return {display:''};};
 const canvas=createLiveCanvas({document});canvas.start();await tick();const before=reads;
 const message=document.querySelector('#chat .mes');
 for(let n=0;n<30;n++){message.style.width=(100+n)+'px';const part=document.createElement('span');part.textContent='stream '+n;message.append(part);}
 await tick();assert.equal(reads,before,'chat-only mutations must not schedule native drawer measurements');
 document.querySelector('#user-settings-button .drawer-toggle').click();await tick();assert.ok(reads>before);canvas.stop();
});

test('collapsed workbench restores native topbar geometry without moving native nodes',()=>{
 const {document}=documentFor(),bar=document.querySelector('#top-bar'),holder=document.querySelector('#top-settings-holder'),canvas=createLiveCanvas({document});
 bar.getBoundingClientRect=holder.getBoundingClientRect=()=>({bottom:42});
 canvas.start();canvas.layout({top:88});
 const style=document.getElementById('orange-workbench-layout');assert.match(style.textContent,/#top-bar[^}]*top:88px/);
 for(let i=0;i<3;i++){
  canvas.layout({top:6,height:800,preserveTopbar:true});
  assert.doesNotMatch(style.textContent,/#top-bar|#top-settings-holder/);assert.match(style.textContent,/z-index:30!important/);
  assert.match(style.textContent,/#sheld\{[^}]*top:max\(6px, var\(--topBarBlockSize, 48px\)\)/);
  assert.equal(document.querySelector('#top-bar'),bar);assert.equal(document.querySelector('#top-settings-holder'),holder);
  canvas.layout({top:88});assert.match(style.textContent,/#top-bar[^}]*top:88px/);
 }
 canvas.stop();assert.equal(document.getElementById('orange-workbench-layout'),null);
});


test('unchanged canvas geometry does not rewrite its stylesheet',()=>{
 const {document}=documentFor(),canvas=createLiveCanvas({document});canvas.start();
 const style=document.getElementById('orange-workbench-layout');let css='',writes=0;
 Object.defineProperty(style,'textContent',{get:()=>css,set:value=>{writes++;css=value;},configurable:true});
 canvas.layout({top:64,height:500});assert.equal(writes,1);
 for(let i=0;i<20;i++)canvas.layout({top:64,height:500});assert.equal(writes,1);
 canvas.layout({top:64,height:450});assert.equal(writes,2);
 canvas.layout({top:6,height:800,preserveTopbar:true});assert.equal(writes,3);
 for(let i=0;i<20;i++)canvas.layout({top:6,height:800,preserveTopbar:true});assert.equal(writes,3);
 canvas.stop();canvas.start();canvas.layout({top:64,height:500});assert.ok(document.getElementById('orange-workbench-layout').textContent);canvas.stop();
});
