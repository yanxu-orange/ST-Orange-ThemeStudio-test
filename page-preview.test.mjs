import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {createPagePreview,PAGE_PREVIEW_CSS} from './page-preview.mjs';
function setup(){const {document,window}=parseHTML('<html><body><div id="sheld"><div id="chat"><div data-orange-lab-fixture="message">示例聊天</div></div></div></body></html>');const ui={page:'chat'},preview=createPagePreview({document,ui});return {document,window,ui,preview,chat:document.querySelector('#chat')};}
test('settings and worldbook contain native representative structures, never native IDs or mutation forms',()=>{
 const {document,ui,preview}=setup();ui.page='settings';preview.update();const settings=document.querySelector('.otl-native-page[data-preview-page=settings]');assert.ok(settings.querySelector('.drawer-content')===null);assert.equal(settings.querySelectorAll('.otl-settings-column').length,3);for(const selector of ['.text_pole','select','textarea','input[type=checkbox]','input[type=range]','.inline-drawer','button:disabled'])assert.ok(settings.querySelector(selector),selector);
 ui.page='worldbook';preview.update();const worldbook=document.querySelector('.otl-native-page[data-preview-page=worldbook]');assert.equal(worldbook.querySelectorAll('.world_entry').length,3);assert.equal(worldbook.querySelectorAll('.world_entry details[open]').length,1);assert.equal(worldbook.querySelectorAll('.disabledWIEntry').length,1);for(const selector of ['.wi-card-entry','.WIEntryContentAndMemo','.world_entry_thin_controls','.keyprimarytextpole','.keysecondarytextpole','.WIEnteryHeaderControls'])assert.ok(worldbook.querySelector(selector),selector);
 for(const root of [settings,worldbook]){assert.equal(root.querySelector('[id],[name],form,[type=submit]'),null);assert.match(root.textContent,/虚构示例/);}assert.ok(settings.hidden);assert.equal(worldbook.hidden,false);
});
test('sample interactions stay local; search, empty result, slider, state and per-page scroll survive switching',()=>{
 const {document,window,ui,preview,chat}=setup();let hostEvents=0;for(const type of ['click','input','change','keydown','keyup','submit'])document.addEventListener(type,()=>hostEvents++);
 preview.update();chat.scrollTop=115;ui.page='worldbook';preview.update();const worldbook=document.querySelector('.otl-native-page[data-preview-page=worldbook]'),search=worldbook.querySelector('input[type=search]');
 for(const query of ['车站','不存在','']){search.value=query;search.dispatchEvent(new window.Event('input',{bubbles:true}));const visible=[...worldbook.querySelectorAll('.world_entry')].filter(e=>!e.hidden);assert.equal(visible.length,query==='车站'?1:query?0:3);assert.equal(worldbook.querySelector('[data-no-entries]').hidden,query!=='不存在');}
 const slider=worldbook.querySelector('input[type=range]');slider.value='6';slider.dispatchEvent(new window.Event('input',{bubbles:true}));assert.equal(slider.parentElement.querySelector('output').textContent,'6');
 for(const type of ['click','change','keydown','keyup','submit'])search.dispatchEvent(new window.Event(type,{bubbles:true,cancelable:true}));assert.equal(hostEvents,0);
 const folded=worldbook.querySelectorAll('.world_entry details')[1];folded.setAttribute('open','');chat.scrollTop=240;ui.page='settings';preview.update();chat.scrollTop=180;ui.page='chat';preview.update();assert.equal(chat.scrollTop,115);ui.page='worldbook';preview.update();assert.equal(chat.scrollTop,240);assert.ok(folded.hasAttribute('open'));assert.equal(slider.value,'6');ui.page='settings';preview.update();assert.equal(chat.scrollTop,180);
 preview.close();assert.equal(document.querySelector('.otl-native-page'),null);assert.equal(document.documentElement.hasAttribute('data-otl-preview-page'),false);ui.page='worldbook';preview.update();assert.equal(document.querySelectorAll('.otl-native-page').length,1);assert.equal(document.querySelector('input[type=range]').value,'2');
});
test('narrow preview reflows the page content by its actual container width',()=>{assert.match(PAGE_PREVIEW_CSS,/@container\(max-width:600px\)/);assert.match(PAGE_PREVIEW_CSS,/grid-template-columns:1fr/);assert.match(PAGE_PREVIEW_CSS,/flex-direction:column!important/);assert.match(PAGE_PREVIEW_CSS,/@media\(max-width:700px\)/);assert.match(PAGE_PREVIEW_CSS,/min-height:44px/);});

test('page switch captures scroll before changing chrome and restores only after final layout',()=>{
 const {document,ui,preview,chat}=setup();preview.update();chat.scrollTop=500;preview.capture();chat.scrollTop=420;ui.page='settings';preview.update({deferRestore:true});assert.equal(chat.scrollTop,420);preview.restore();assert.equal(chat.scrollTop,0);chat.scrollTop=240;preview.capture();ui.page='chat';preview.update({deferRestore:true});chat.scrollTop=0;preview.restore();assert.equal(chat.scrollTop,500);preview.update();assert.equal(chat.scrollTop,500);ui.page='settings';preview.update();assert.equal(chat.scrollTop,240);preview.close();
});

test('worldbook tag specimen edits only its local keywords and search ignores unchosen suggestions',()=>{
 const {document,window,ui,preview}=setup();ui.page='worldbook';preview.update();const root=document.querySelector('.otl-native-page'),picker=root.querySelector('[data-keyword-picker]'),source=picker.parentElement.querySelector('textarea'),combo=picker.querySelector('[role=combobox]'),input=picker.querySelector('input'),popup=picker.querySelector('.otl-keyword-options');let host=0;document.addEventListener('input',()=>host++);document.addEventListener('click',()=>host++);
 combo.click();assert.equal(popup.hidden,false);assert.equal(combo.getAttribute('aria-expanded'),'true');input.value='新关键词';const enter=new window.Event('keydown',{bubbles:true,cancelable:true});enter.key='Enter';input.dispatchEvent(enter);assert.match(source.value,/新关键词/);assert.equal(input.value,'');assert.equal(host,0);
 const remove=picker.querySelector('[aria-label="移除示例关键字 邮局"]');remove.click();assert.doesNotMatch(source.value,/邮局/);assert.equal(host,0);
 const esc=new window.Event('keydown',{bubbles:true,cancelable:true});esc.key='Escape';input.dispatchEvent(esc);assert.equal(popup.hidden,true);assert.equal(combo.getAttribute('aria-expanded'),'false');
 const search=root.querySelector('input[type=search]');search.value='新关键词';search.dispatchEvent(new window.Event('input',{bubbles:true}));assert.equal([...root.querySelectorAll('.world_entry')].filter(entry=>!entry.hidden).length,1);
 ui.page='settings';preview.update();const button=document.querySelector('[data-sample-toggle]');button.click();assert.equal(button.getAttribute('aria-pressed'),'true');assert.equal(host,0);assert.ok(document.querySelector('.otl-native-page input[readonly]'));preview.close();
});

test('tag specimen resets native absolute remove positioning without affecting live Select2',()=>{assert.match(PAGE_PREVIEW_CSS,/\.select2-selection__choice__remove\{position:static;inset:auto/);assert.match(PAGE_PREVIEW_CSS,/\.select2-selection__choice__display\{padding:0\}/);});
