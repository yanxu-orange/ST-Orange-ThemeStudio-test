import {seedNativeChat,requestNativeFrame,cancelNativeFrame,settleNativeCanvas} from './test-support/native-chat.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import {parseHTML} from 'linkedom';
import {PAGE_DRAWERS,PREVIEW_PAGES} from './canvas-pages.mjs';
import {editorStorage,saveEditorScheme} from './test-support/editor-storage.mjs';
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
test('independent page editing and native view synchronize safely across navigation, failures, global editing and reopen',async()=>{
 const {document,window}=parseHTML('<html><head><style id="custom-style"></style></head><body><div id="sheld"><div id="chat"><div id="real-message">真实消息</div></div><div id="form_sheld"><textarea id="send_textarea">真实草稿</textarea></div></div></body></html>');
 const desc=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:desc.get,set(v){for(const o of this.options)o.toggleAttribute('selected',o.value===String(v));},configurable:true});
 Object.assign(globalThis,{document,window,localStorage:{getItem:()=>null,setItem:()=>{}},requestAnimationFrame:requestNativeFrame,cancelAnimationFrame:cancelNativeFrame,ResizeObserver:class{observe(){}unobserve(){}disconnect(){}}});window.innerWidth=390;window.innerHeight=844;
 const storage=await editorStorage();seedNativeChat(document);await import('./index.js');
 const sh=document.querySelector('#orange-theme-lab').shadowRoot,view=sh.querySelector('#page-scope'),editing=sh.querySelector('#workspace-page');
 const change=(select,page)=>{select.value=page;select.dispatchEvent(new window.Event('change',{bubbles:true}));};
 const navigate=async(page,select=editing)=>{change(select,page);await wait(65);await settleNativeCanvas();};
 const save=()=>saveEditorScheme(sh,storage),content=page=>document.querySelector(`#${PAGE_DRAWERS[page]} .drawer-content`);
 const native=async page=>{for(const el of document.querySelectorAll('.drawer-content.openDrawer'))el.classList.remove('openDrawer');if(page!=='chat')document.querySelector(`#${PAGE_DRAWERS[page]} .drawer-toggle`).click();await wait(65);};
 sh.querySelector('.launcher').click();sh.querySelector('[data-flow=continue]').click();await wait(65);sh.querySelector('[data-region=body]').click();const initial=await save();
 const nativeMessage=document.querySelector('#chat .mes'),nativeName=nativeMessage.querySelector('.name_text'),draft=document.querySelector('#send_textarea'),drawerField=document.querySelector('#WI-SP-button .drawer-content textarea');drawerField.value='原生世界书编辑中的文本';
 const preserved=()=>{assert.equal(document.querySelector('#chat .mes'),nativeMessage);assert.equal(nativeMessage.querySelector('.name_text'),nativeName);assert.equal(nativeMessage.hidden,false);assert.equal(draft.value,'真实草稿');assert.equal(drawerField.value,'原生世界书编辑中的文本');assert.equal(document.querySelectorAll('[data-orange-lab-fixture],.otl-native-page,.otl-page-topbar,.otl-page-input').length,0);};
 assert.deepEqual([...view.options].map(o=>o.value),Object.keys(PREVIEW_PAGES));assert.equal(view.querySelector('[value=home]').hasAttribute('disabled'),true);
 for(const width of [390,1200,390]){
  window.innerWidth=width;window.dispatchEvent(new window.Event('resize'));
  for(const select of [view,editing]){assert.equal(sh.querySelectorAll('#'+select.id).length,1);assert.equal(select.closest('details'),null);assert.ok(select.closest('.preview-tools'));}
  for(const [page,id] of Object.entries(PAGE_DRAWERS)){
   await navigate(page);assert.equal(editing.value,page);assert.equal(view.value,page);
   assert.equal(document.querySelectorAll('.drawer-content.openDrawer').length,id?1:0,page);if(id)assert.ok(content(page).classList.contains('openDrawer'));
   assert.equal(sh.querySelector('#mode-library').disabled,false);
   if(page!=='chat'){assert.equal(sh.querySelector('.kind-tabs').childElementCount,0);assert.match(sh.querySelector('.fields').textContent,/尚未独立设计/);assert.equal(sh.querySelector('#mode-layers').disabled,true);}
   preserved();
  }
  await navigate('chat');assert.equal(sh.querySelector('[data-region=body]').getAttribute('aria-pressed'),'true');assert.ok(sh.querySelector('[aria-label="正文字号"]'));assert.deepEqual(await save(),initial);
 }
 // Native toolbar clicks update both selectors when editing an independent page.
 await native('settings');assert.equal(view.value,'settings');assert.equal(editing.value,'settings');
 await native('worldbook');assert.equal(view.value,'worldbook');assert.equal(editing.value,'worldbook');
 // Global selection is purely an editing scope and does not close a drawer/chat.
 await navigate('home');assert.equal(editing.value,'home');assert.equal(view.value,'worldbook');assert.ok(content('worldbook').classList.contains('openDrawer'));
 await native('settings');assert.equal(view.value,'settings');assert.equal(editing.value,'home');
 await navigate('connection',view);assert.equal(view.value,'connection');assert.equal(editing.value,'home');assert.match(sh.querySelector('#view-context').textContent,/首页和全局/);
 await navigate('chat');sh.querySelector('[data-region=body]').click();
 // Missing/disabled targets and ignored native handlers keep the complete old editing target.
 const settingsToggle=document.querySelector('#user-settings-button .drawer-toggle');settingsToggle.disabled=true;await navigate('settings');assert.equal(editing.value,'chat');assert.equal(view.value,'chat');assert.ok(sh.querySelector('[aria-label="正文字号"]'));settingsToggle.disabled=false;
 const characterHost=document.getElementById('rightNavHolder'),nextHost=characterHost.nextSibling,hostParent=characterHost.parentNode;characterHost.remove();await navigate('characters');assert.equal(editing.value,'chat');assert.equal(view.value,'chat');hostParent.insertBefore(characterHost,nextHost);
 const original=document.querySelector('#WI-SP-button .drawer-toggle'),noop=original.cloneNode(true);original.replaceWith(noop);change(editing,'worldbook');await wait(1600);assert.equal(editing.value,'chat');assert.equal(view.value,'chat');assert.ok(sh.querySelector('[aria-label="正文字号"]'));noop.replaceWith(original);
 // Repeated requests share the native async transition rather than double toggling it.
 const old=document.querySelector('#user-settings-button .drawer-toggle'),delayed=old.cloneNode(true);old.replaceWith(delayed);let clicks=0;
 delayed.addEventListener('click',()=>{clicks++;setTimeout(()=>content('settings').classList.toggle('openDrawer'),100);});
 change(editing,'settings');change(editing,'settings');assert.equal(editing.value,'chat');assert.equal(view.value,'chat');await wait(170);assert.equal(clicks,1);assert.equal(editing.value,'settings');assert.equal(view.value,'settings');delayed.replaceWith(old);
 await navigate('worldbook');preserved();assert.deepEqual(await save(),initial);
 sh.querySelector('#close').click();assert.equal(document.querySelectorAll('[data-orange-lab-fixture],[data-otl-live]').length,0);assert.equal(document.documentElement.hasAttribute('data-orange-editor'),false);
 const closedView=view.value;await native('settings');assert.equal(view.value,closedView,'closed workbench no longer observes native clicks');
 sh.querySelector('.launcher').click();sh.querySelector('[data-flow=continue]').click();await wait(100);assert.equal(view.value,'settings');assert.equal(editing.value,'settings');assert.equal(document.querySelectorAll('#native-content-WI-SP-button').length,1);preserved();
 await navigate('chat');
 const welcome=document.createElement('div');welcome.className='welcomePanel';document.querySelector('#chat').append(welcome);await wait(65);assert.equal(view.value,'home');assert.equal(editing.value,'home');
 welcome.remove();await wait(65);assert.equal(view.value,'chat');assert.equal(editing.value,'home','return from native home does not discard global editing');
 assert.deepEqual(await save(),initial);sh.querySelector('#close').click();
});
