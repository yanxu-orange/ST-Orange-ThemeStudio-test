import {seedNativeChat,requestNativeFrame,cancelNativeFrame,settleNativeCanvas} from './test-support/native-chat.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import {parseHTML} from 'linkedom';
import {PAGE_DRAWERS} from './canvas-pages.mjs';import {PAGE_NAMES} from './workbench-ui.mjs';
import {editorStorage,saveEditorScheme} from './test-support/editor-storage.mjs';import {selectRegion} from './test-support/workbench-shell.mjs';
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
test('workshop scopes never navigate native Tavern or follow its page changes',async(t)=>{
 const {document,window}=parseHTML('<html><head><style id="custom-style"></style></head><body><div id="sheld"><div id="chat"></div><div id="form_sheld"><textarea id="send_textarea">真实草稿</textarea></div></div></body></html>');
 const desc=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:desc.get,set(v){for(const o of this.options)o.toggleAttribute('selected',o.value===String(v));},configurable:true});
 Object.assign(globalThis,{document,window,localStorage:{getItem:()=>null,setItem:()=>{}},requestAnimationFrame:requestNativeFrame,cancelAnimationFrame:cancelNativeFrame,ResizeObserver:class{observe(){}unobserve(){}disconnect(){}}});window.innerWidth=390;window.innerHeight=844;
 const storage=await editorStorage();seedNativeChat(document);await import('./index.js');
 const sh=document.querySelector('#orange-theme-lab').shadowRoot,editing=sh.querySelector('#workspace-page');t.after(()=>sh.querySelector('#close').click());
 const change=async page=>{editing.value=page;editing.dispatchEvent(new window.Event('change',{bubbles:true}));await settleNativeCanvas();};
 const native=async page=>{for(const el of document.querySelectorAll('.drawer-content.openDrawer'))el.classList.remove('openDrawer');if(page!=='chat')document.querySelector(`#${PAGE_DRAWERS[page]} .drawer-toggle`).click();await wait(65);};
 sh.querySelector('.launcher').click();sh.querySelector('[data-flow=continue]').click();await wait(65);selectRegion(sh,window,'body');const initial=await saveEditorScheme(sh,storage);
 const nativeMessage=document.querySelector('#chat .mes'),nativeName=nativeMessage.querySelector('.name_text'),draft=document.querySelector('#send_textarea'),drawerField=document.querySelector('#WI-SP-button .drawer-content textarea');drawerField.value='原生世界书编辑中的文本';
 const preserved=()=>{assert.equal(document.querySelector('#chat .mes'),nativeMessage);assert.equal(nativeMessage.querySelector('.name_text'),nativeName);assert.equal(nativeMessage.hidden,false);assert.equal(draft.value,'真实草稿');assert.equal(drawerField.value,'原生世界书编辑中的文本');assert.equal(document.querySelectorAll('[data-orange-lab-fixture],.otl-native-page,.otl-page-topbar,.otl-page-input').length,0);};
 assert.equal(sh.querySelector('#page-scope'),null);assert.equal(sh.querySelector('.preview-tools'),null);
 for(const width of [390,768,1366,390]){window.innerWidth=width;window.dispatchEvent(new window.Event('resize'));assert.equal(sh.querySelectorAll('#workspace-page').length,1);assert.ok(editing.closest('.panel-head'));await native('worldbook');
  for(const page of Object.keys(PAGE_NAMES)){await change(page);assert.equal(editing.value,page);assert.ok(document.querySelector('#WI-SP-button .drawer-content').classList.contains('openDrawer'));assert.equal(sh.querySelector('#mode-library').disabled,false);preserved();}
  await change('chat');assert.equal(sh.querySelector('#region-select').value,'body');assert.ok(sh.querySelector('[aria-label="正文字号"]'));assert.deepEqual(await saveEditorScheme(sh,storage),initial);
 }
 // Native operations are fully independent even during a specific-page edit.
 for(const scope of ['chat','settings','home']){await change(scope);for(const nativePage of ['settings','worldbook','chat']){await native(nativePage);assert.equal(editing.value,scope);preserved();}}
 // Missing or disabled native entrances do not prevent selecting an editing scope.
 const toggle=document.querySelector('#user-settings-button .drawer-toggle');toggle.disabled=true;await change('settings');assert.equal(editing.value,'settings');toggle.disabled=false;
 await change('chat');selectRegion(sh,window,'body');sh.querySelector('#close').click();await native('settings');sh.querySelector('.launcher').click();sh.querySelector('[data-flow=continue]').click();await wait(100);assert.equal(editing.value,'chat');assert.equal(sh.querySelector('#region-select').value,'body');preserved();
 const welcome=document.createElement('div');welcome.className='welcomePanel';document.querySelector('#chat').append(welcome);await wait(65);assert.equal(editing.value,'chat');welcome.remove();await wait(65);assert.equal(editing.value,'chat');assert.deepEqual(await saveEditorScheme(sh,storage),initial);
});
