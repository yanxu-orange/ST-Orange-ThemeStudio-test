import {clickEditor,navigateRegion} from './test-support/editor-navigation.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {seedNativeChat,requestNativeFrame,cancelNativeFrame,settleNativeCanvas} from './test-support/native-chat.mjs';
import {editorStorage,saveEditorScheme} from './test-support/editor-storage.mjs';
import {PAGE_NAMES} from './workbench-ui.mjs';
import {WORKSHOP_ENTRIES_KEY} from './workshop-entries.mjs';

test('independent scopes, supported material destinations and hidden entry preferences survive application',async()=>{
 const {document,window}=parseHTML('<html><head><style id="custom-style"></style></head><body><div id="extensionsMenu"></div><div id="extensions_settings"></div><div id="sheld"><div id="chat"></div><div id="form_sheld"><textarea id="send_textarea">真实草稿</textarea></div></div></body></html>');
 const desc=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:desc.get,set(value){for(const option of this.options)option.toggleAttribute('selected',option.value===String(value));},configurable:true});
 const values=new Map();Object.assign(globalThis,{document,window,localStorage:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)},requestAnimationFrame:requestNativeFrame,cancelAnimationFrame:cancelNativeFrame,ResizeObserver:class{observe(){}unobserve(){}disconnect(){}}});window.innerWidth=1200;window.innerHeight=900;window.confirm=()=>true;
 const storage=await editorStorage();seedNativeChat(document);await import('./index.js');const sh=document.querySelector('#orange-theme-lab').shadowRoot;
 const click=selector=>clickEditor(sh,selector);
 const change=(selector,value)=>{const node=sh.querySelector(selector);assert.ok(node,selector);node.value=value;node.dispatchEvent(new window.Event('change',{bubbles:true}));};
 const idle=async()=>{await new Promise(resolve=>setTimeout(resolve,80));await settleNativeCanvas();};
 const save=()=>saveEditorScheme(sh,storage),button=text=>[...sh.querySelectorAll('button')].find(node=>node.textContent===text);
 try{
  click('.launcher');await idle();const initial=await save();
  assert.deepEqual([...sh.querySelector('#workspace-page').options].map(option=>option.value),Object.keys(PAGE_NAMES));
  assert.equal(sh.querySelector('#region-select [value=common]'),null);
  for(const region of ['body','native']){navigateRegion(sh,region);assert.equal(sh.querySelector('#mode-layers').disabled,true);assert.equal(sh.querySelector('#mode-library').disabled,false);}
  const nativeBefore=[...document.querySelectorAll('.drawer-content')].map(n=>n.className);
  change('#workspace-page','home');assert.equal(sh.querySelector('#workspace-page').value,'home');assert.equal(sh.querySelector('#page-scope'),null);assert.ok(sh.querySelector('[aria-label="界面文字颜色 HEX"]'));
  assert.deepEqual([...document.querySelectorAll('.drawer-content')].map(n=>n.className),nativeBefore);
  document.querySelector('#chat .name_text').click();assert.equal(sh.querySelector('#workspace-page').value,'home');assert.ok(sh.querySelector('[aria-label="界面文字颜色 HEX"]'));
  navigateRegion(sh,'home-design');assert.match(sh.querySelector('.fields').textContent,/专属样式尚未开放/);assert.equal(sh.querySelector('.fields input'),null);
  navigateRegion(sh,'topbar');assert.equal(sh.querySelector('#mode-layers').disabled,true);navigateRegion(sh,'input');assert.equal(sh.querySelector('#mode-layers').disabled,false);
  change('#workspace-page','settings');await idle();assert.equal(sh.querySelector('#workspace-page').value,'settings');assert.equal(sh.querySelector('#region-select').value,'page-common');assert.equal(sh.querySelector('[aria-label="样式来源"]').value,'inherit');assert.equal(sh.querySelector('.fields input'),null);assert.equal(sh.querySelector('#mode-library').disabled,false);
  assert.deepEqual([...document.querySelectorAll('.drawer-content')].map(n=>n.className),nativeBefore);
  document.querySelector('#WI-SP-button .drawer-toggle').click();await idle();assert.equal(sh.querySelector('#workspace-page').value,'settings');
  click('#mode-library');assert.equal(sh.querySelector('[aria-label="素材应用区域"]'),null);assert.equal(sh.querySelector('button[data-builtin-asset]'),null);assert.ok(sh.querySelector('[data-builtin-asset] img'));assert.deepEqual(await save(),initial);
  click('[data-material-category=shapes]');assert.equal(sh.querySelector('button[data-add-shape]'),null);click('[data-material-category=icons]');assert.equal(sh.querySelector('[aria-label="图标应用按钮"]'),null);assert.equal(sh.querySelector('button.icon-library-use'),null);assert.deepEqual(await save(),initial);
  click('[data-material-category=fonts]');assert.ok(button('添加字体'));click('#material-back');assert.equal(sh.querySelector('#workspace-page').value,'settings');
  navigateRegion(sh,'footer');click('[data-kind=image]');click('#add-current-image');click('button[data-builtin-asset]');await idle();const added=await save();assert.equal(added.layers.length,initial.layers.length+1);assert.equal(added.layers.at(-1).anchor,'footer');assert.equal(sh.querySelector('#workspace-page').value,'chat');assert.ok(document.querySelector('#WI-SP-button .drawer-content').classList.contains('openDrawer'));
  click('#undo');assert.deepEqual(await save(),initial);
  const choice=name=>sh.querySelector(`[data-workshop-entry-choice=${name}]`),toggle=(name,value)=>{choice(name).checked=value;choice(name).dispatchEvent(new window.Event('change',{bubbles:true}));};
  toggle('floating',false);assert.equal(JSON.parse(values.get(WORKSHOP_ENTRIES_KEY)).floating,false);toggle('wand',false);toggle('extensions',false);assert.equal(choice('extensions').checked,true);assert.match(sh.querySelector('#notice').textContent,/至少保留/);assert.deepEqual(await save(),initial);
  click('#apply-live');assert.equal(sh.querySelector('.launcher').classList.contains('hidden'),true);assert.equal(sh.querySelector('.live-bar'),null);assert.equal(document.querySelector('[data-workshop-entry=extensions]').style.display,'');
  const nativeOpen=document.querySelector('[data-workshop-entry=extensions] [data-workshop-action=open]');assert.equal(nativeOpen.textContent,'继续编辑主题工坊');nativeOpen.click();await idle();assert.equal(sh.querySelector('.panel').classList.contains('hidden'),false);assert.equal(sh.querySelector('.launcher').classList.contains('hidden'),true);click('#close');assert.equal(sh.querySelector('.launcher').classList.contains('hidden'),true);assert.equal(sh.querySelector('.live-bar'),null);
  nativeOpen.click();await idle();assert.deepEqual(await save(),initial);assert.equal(document.querySelector('#send_textarea').value,'真实草稿');
 }finally{sh.querySelector('#close')?.click();}
});
