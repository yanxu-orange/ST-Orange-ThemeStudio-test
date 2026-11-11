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
 const click=selector=>{const node=sh.querySelector(selector);assert.ok(node,selector);assert.equal(node.disabled,false,selector);node.click();};
 const change=(selector,value)=>{const node=sh.querySelector(selector);assert.ok(node,selector);node.value=value;node.dispatchEvent(new window.Event('change',{bubbles:true}));};
 const idle=async()=>{await new Promise(resolve=>setTimeout(resolve,80));await settleNativeCanvas();};
 const save=()=>saveEditorScheme(sh,storage),button=text=>[...sh.querySelectorAll('button')].find(node=>node.textContent===text);
 try{
  click('.launcher');await idle();const initial=await save();
  assert.deepEqual([...sh.querySelector('#workspace-page').options].map(option=>option.value),Object.keys(PAGE_NAMES));
  assert.equal(sh.querySelector('[data-region=common]').closest('[data-region-scope]').hidden,true);
  for(const region of ['body','native']){click(`[data-region=${region}]`);assert.equal(sh.querySelector('#mode-layers').disabled,true);assert.equal(sh.querySelector('#mode-library').disabled,false);}
  change('#workspace-page','home');assert.equal(sh.querySelector('#workspace-page').value,'home');assert.equal(sh.querySelector('#page-scope').value,'chat');assert.ok(sh.querySelector('[aria-label="界面文字颜色 HEX"]'));
  document.querySelector('#chat .name_text').click();assert.equal(sh.querySelector('#workspace-page').value,'home');assert.ok(sh.querySelector('[aria-label="界面文字颜色 HEX"]'));
  click('[data-region=home-design]');assert.match(sh.querySelector('.fields').textContent,/尚未独立设计/);assert.equal(sh.querySelector('.fields input'),null);
  click('[data-region=topbar]');assert.equal(sh.querySelector('#mode-layers').disabled,true);click('[data-region=input]');assert.equal(sh.querySelector('#mode-layers').disabled,false);
  change('#workspace-page','settings');await idle();assert.equal(sh.querySelector('#workspace-page').value,'settings');assert.match(sh.querySelector('.fields').textContent,/尚未独立设计/);assert.equal(sh.querySelector('.fields input'),null);assert.equal(sh.querySelector('#mode-library').disabled,false);
  click('#mode-library');assert.equal(sh.querySelector('[aria-label="素材应用区域"]').value,'');assert.equal(button('添加所选素材').disabled,true);button('添加所选素材').click();assert.deepEqual(await save(),initial);
  click('[data-material-category=shapes]');assert.equal(sh.querySelector('[data-add-shape]').disabled,true);click('[data-material-category=icons]');assert.equal(sh.querySelector('[aria-label="图标应用按钮"]').value,'');click('.icon-library-use');assert.match(sh.querySelector('#notice').textContent,/请先选择/);assert.deepEqual(await save(),initial);
  click('[data-material-category=fonts]');assert.ok(sh.querySelector('[aria-label="字体库直链"]'));
  click('[data-material-category=images]');change('[aria-label="素材应用区域"]','footer');assert.equal(button('添加所选素材').disabled,false);button('添加所选素材').click();await idle();const added=await save();assert.equal(added.layers.length,initial.layers.length+1);assert.equal(added.layers.at(-1).anchor,'footer');assert.equal(sh.querySelector('#workspace-page').value,'chat');assert.equal(sh.querySelector('#page-scope').value,'chat');
  click('#undo');assert.deepEqual(await save(),initial);
  const choice=name=>sh.querySelector(`[data-workshop-entry-choice=${name}]`),toggle=(name,value)=>{choice(name).checked=value;choice(name).dispatchEvent(new window.Event('change',{bubbles:true}));};
  toggle('floating',false);assert.equal(JSON.parse(values.get(WORKSHOP_ENTRIES_KEY)).floating,false);toggle('wand',false);toggle('extensions',false);assert.equal(choice('extensions').checked,true);assert.match(sh.querySelector('#notice').textContent,/至少保留/);assert.deepEqual(await save(),initial);
  click('#apply-live');assert.equal(sh.querySelector('.launcher').classList.contains('hidden'),true);assert.equal(sh.querySelector('.live-bar').classList.contains('hidden'),true);assert.equal(document.querySelector('[data-workshop-entry=extensions]').style.display,'');
  const nativeOpen=document.querySelector('[data-workshop-entry=extensions] button');assert.equal(nativeOpen.textContent,'继续编辑');nativeOpen.click();await idle();assert.equal(sh.querySelector('.panel').classList.contains('hidden'),false);assert.equal(sh.querySelector('.launcher').classList.contains('hidden'),true);click('#close');assert.equal(sh.querySelector('.launcher').classList.contains('hidden'),true);assert.equal(sh.querySelector('.live-bar').classList.contains('hidden'),true);
  nativeOpen.click();await idle();assert.deepEqual(await save(),initial);assert.equal(document.querySelector('#send_textarea').value,'真实草稿');
 }finally{sh.querySelector('#close')?.click();}
});
