import {expectPortableExport} from './test-support/portable-export.mjs';
import { settleSchemeApplication } from './test-support/editor-storage.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {editorStorage,saveEditorScheme} from './test-support/editor-storage.mjs';
import {seedNativeChat,requestNativeFrame,cancelNativeFrame,settleNativeCanvas} from './test-support/native-chat.mjs';
import {resolvePageGroup,pageFontEntries,PAGE_ROOTS} from './page-style.mjs';

test('world entry layout controls save and undo independently',async()=>{
 const {document,window}=parseHTML('<html><head><style id="custom-style"></style></head><body><div id="sheld"><div id="chat"></div></div><div id="user-settings-block"><section id="UI-Theme-Block"><h4>设置分组</h4><input id="real-setting" value="original"><button id="real-setting-button">设置操作</button></section></div><div id="WorldInfo"><div id="world_popup_entries_list"><div class="world_entry"><form class="world_entry_form wi-card-entry"><div class="inline-drawer"><div class="inline-drawer-header">条目</div><div class="inline-drawer-content"><textarea id="real-entry">original entry</textarea><button id="real-entry-button">条目操作</button></div></div></form></div></div></div></body></html>');
 for(const [page,selector]of Object.entries(PAGE_ROOTS))if(!document.querySelector(selector))document.body.insertAdjacentHTML('beforeend',`<div id="${selector.slice(1)}"><h3>Native ${page}</h3><input id="real-${page}" value="original"><button id="real-${page}-button">native action</button></div>`);
 const descriptor=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:descriptor.get,set(value){for(const option of this.options)option.toggleAttribute('selected',option.value===String(value));},configurable:true});
 const values=new Map();Object.assign(globalThis,{document,window,localStorage:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)},requestAnimationFrame:requestNativeFrame,cancelAnimationFrame:cancelNativeFrame,ResizeObserver:class{observe(){}unobserve(){}disconnect(){}}});window.innerWidth=390;window.innerHeight=844;window.confirm=()=>true;
 seedNativeChat(document);const storage=await editorStorage();await import('./index.js');const sh=document.querySelector('#orange-theme-lab').shadowRoot;
 const click=selector=>{const node=sh.querySelector(selector);assert.ok(node,selector);assert.notEqual(node.disabled,true);node.click();};
 const change=(selector,value)=>{const node=sh.querySelector(selector);assert.ok(node,selector);node.value=String(value);node.dispatchEvent(new window.Event('input',{bubbles:true}));node.dispatchEvent(new window.Event('change',{bubbles:true}));};
 const field=(label,value)=>change(`[aria-label="${label}"]`,value),save=()=>saveEditorScheme(sh,storage),page=value=>change('#workspace-page',value),region=value=>change('#region-select',value),part=value=>click(`[data-kind=${value}]`),custom=()=>field('样式来源','custom');
 const path=()=>[sh.querySelector('#workspace-page').value,sh.querySelector('#region-select').value,sh.querySelector('[data-kind][aria-pressed=true]')?.dataset.kind];

 click('.launcher');click('[data-flow=continue]');page('worldbook');region('page-content');part('surface');
 assert.equal((await save()).pageStyle.worldbook.entryDetails,null);
 field('条目排版来源','custom');field('条目边框','bottom');field('条目间距 数值',10);
 field('标题底色','true');field('渐变右侧颜色 HEX','#ffffff');field('操作图标边框','true');field('停用条目文字','true');field('输入框字体与字号','native');
 let result=await save();assert.equal(result.pageStyle.worldbook.entryDetails.borderMode,'bottom');assert.equal(result.pageStyle.worldbook.entryDetails.headerGradient,true);assert.equal(result.pageStyle.worldbook.entryDetails.plainIcons,true);assert.equal(result.pageStyle.worldbook.entryDetails.mutedDisabled,true);assert.equal(result.pageStyle.worldbook.entryDetails.fieldTypography,'native');
 field('条目排版来源','native');assert.equal((await save()).pageStyle.worldbook.entryDetails,null);click('#undo');assert.equal((await save()).pageStyle.worldbook.entryDetails.fieldTypography,'native');
});
