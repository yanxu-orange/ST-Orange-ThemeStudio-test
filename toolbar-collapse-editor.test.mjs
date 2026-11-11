import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {navigateRegion} from './test-support/editor-navigation.mjs';
import {editorStorage,saveEditorScheme} from './test-support/editor-storage.mjs';
import {seedNativeChat,requestNativeFrame,cancelNativeFrame,settleNativeCanvas} from './test-support/native-chat.mjs';

test('toolbar collapse keeps the current editor usable, restores only the toolbar, and ignores the floating entry preference',async()=>{
 const {document,window}=parseHTML('<html><head><style id="custom-style"></style></head><body><div id="extensions_settings"></div><div id="sheld"><div id="chat"></div></div></body></html>');
 const descriptor=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:descriptor.get,set(value){for(const option of this.options)option.toggleAttribute('selected',option.value===String(value));},configurable:true});
 window.innerWidth=390;window.innerHeight=844;const values=new Map();Object.assign(globalThis,{document,window,localStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},requestAnimationFrame:requestNativeFrame,cancelAnimationFrame:cancelNativeFrame,ResizeObserver:class{observe(){}unobserve(){}disconnect(){}}});
 seedNativeChat(document);const store=await editorStorage();await import('./index.js');const host=document.querySelector('#orange-theme-lab'),sh=host.shadowRoot,save=()=>saveEditorScheme(sh,store);
 sh.querySelector('.launcher').click();assert.equal(sh.querySelector('[aria-label="隐藏滚动条"]').parentElement.firstElementChild,sh.querySelector('[aria-label="隐藏滚动条"]'));navigateRegion(sh,'body');await settleNativeCanvas();
 const floating=sh.querySelector('[data-workshop-entry-choice=floating]');floating.checked=false;floating.dispatchEvent(new window.Event('change'));
 assert.equal(floating.checked,false);const before=await save(),panel=sh.querySelector('.panel'),source=sh.querySelector('[aria-label="正文左侧留白 数值"]');
 sh.querySelector('.inspector').scrollTop=120;sh.querySelector('#collapse-toolbar').click();
 assert.equal(host.dataset.toolbarCollapsed,'true');assert.equal(host.dataset.fullView,'false');assert.equal(panel.dataset.mobileView,'adjust');assert.equal(panel.classList.contains('hidden'),false);assert.equal(sh.querySelector('[aria-label="正文左侧留白 数值"]'),source);assert.equal(sh.querySelector('.inspector').scrollTop,120);assert.equal(sh.querySelector('.launcher').getAttribute('aria-label'),'展开顶部工具栏，可拖动调整位置');
 assert.deepEqual(await save(),before,'collapse is not a theme edit');
 const styles=()=>[...document.querySelectorAll('style')].map(n=>n.textContent).filter(s=>s.includes('--otl-canvas-width:')).join('\n');
 assert.ok(styles());assert.match(styles(),/z-index:30!important/,'chat remains below native topbar drawers');assert.doesNotMatch(styles(),/#top-bar|#top-settings-holder/,'native topbar gets no editor positioning while collapsed');
 source.value='18';source.dispatchEvent(new window.Event('input'));source.dispatchEvent(new window.Event('change'));await settleNativeCanvas();assert.equal((await save()).bodyPaddingLeft,18,'property edits still apply while collapsed');assert.equal(host.dataset.toolbarCollapsed,'true');
 sh.querySelector('.launcher').click();assert.equal(host.dataset.toolbarCollapsed,'false');assert.equal(panel.dataset.mobileView,'adjust');assert.equal(sh.querySelector('[aria-label="正文左侧留白 数值"]'),source);assert.equal(sh.querySelector('.inspector').scrollTop,120);assert.equal(floating.checked,false);assert.match(styles(),/#top-settings-holder/);
 // A context picker keeps its return target when the toolbar is collapsed and expanded.
 navigateRegion(sh,'topbar');sh.querySelector('[data-kind=icons]').click();sh.querySelector('#chrome-icon-pick').click();sh.querySelector('#collapse-toolbar').click();assert.equal(panel.dataset.mobileView,'library');sh.querySelector('.launcher').click();assert.equal(panel.dataset.mobileView,'library');sh.querySelector('#material-back').click();assert.ok(sh.querySelector('#chrome-icon-pick'));
 for(const choose of [false,true]){
  // Returning from a picker must not restore an old toolbar state.
  sh.querySelector('#chrome-icon-pick').click();sh.querySelector('#collapse-toolbar').click();
  sh.querySelector(choose?'[data-builtin-asset]':'#material-back').click();assert.equal(host.dataset.toolbarCollapsed,'true');assert.ok(sh.querySelector('#chrome-icon-pick'));
  sh.querySelector('#chrome-icon-pick').click();sh.querySelector('.launcher').click();
  sh.querySelector(choose?'[data-builtin-asset]':'#material-back').click();assert.equal(host.dataset.toolbarCollapsed,'false');
 }
 sh.querySelector('#mode-library').click();sh.querySelector('#collapse-toolbar').click();sh.querySelector('#material-back').click();assert.equal(host.dataset.toolbarCollapsed,'true');sh.querySelector('.launcher').click();
 // Full preview remains separate, and exit/reopen does not leave a forced launcher.
 sh.querySelector('#full-view').click();assert.equal(host.dataset.fullView,'true');assert.equal(host.dataset.toolbarCollapsed,'false');sh.querySelector('#full-view').click();assert.equal(host.dataset.fullView,'false');
 sh.querySelector('#collapse-toolbar').click();sh.querySelector('#close').click();assert.equal(host.dataset.toolbarCollapsed,'false');assert.equal(sh.querySelector('.launcher').classList.contains('hidden'),true);document.querySelector('[data-workshop-entry=extensions] button').click();assert.equal(host.dataset.toolbarCollapsed,'false');assert.equal(panel.classList.contains('hidden'),false);sh.querySelector('#close').click();
});
