import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {createWorkshopEntries,WORKSHOP_ENTRIES_KEY} from './workshop-entries.mjs';
function setup({native=true,stored=null,storageError=false}={}){
 const {document,window}=parseHTML('<html><body>'+(native?'<button id="extensionsMenuButton"></button><div id="extensionsMenu"><div id="native-item">Native</div></div><div id="extensions_settings"><div id="native-setting">Native</div></div>':'')+'<div id="host"></div></body></html>');
 const shadow=document.querySelector('#host').attachShadow({mode:'open'}),launcher=document.createElement('button');shadow.append(launcher);
 const values=new Map(stored===null?[]:[[WORKSHOP_ENTRIES_KEY,JSON.stringify(stored)]]),messages=[];let opens=0,stops=0;
 const storage={getItem:k=>values.get(k),setItem(k,v){if(storageError)throw Error('quota');values.set(k,v);}};
 const entries=createWorkshopEntries({document,launcher,storage,onOpen:()=>opens++,onStopApplied:()=>stops++,onMessage:m=>messages.push(m)});
 return {document,window,shadow,launcher,entries,values,messages,get opens(){return opens;},get stops(){return stops;}};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('all entry actions share the open route and preserve native siblings',()=>{
 const f=setup();
 for(const name of ['wand','extensions'])f.document.querySelector(`[data-workshop-entry="${name}"] button`).click();
 assert.equal(f.opens,2);assert.equal(f.document.querySelector('#native-item').textContent,'Native');assert.ok(f.document.querySelector('#native-setting'));
 f.entries.setApplied(true);
 const root=f.document.querySelector('[data-workshop-entry="wand"]');assert.equal(root.firstElementChild.textContent,'继续编辑');assert.equal(root.lastElementChild.hidden,false);root.lastElementChild.click();assert.equal(f.stops,1);
 f.entries.setApplied(false);assert.equal(root.lastElementChild.hidden,true);
 f.entries.destroy();assert.ok(f.document.querySelector('#native-item'));assert.equal(f.document.querySelector('[data-workshop-entry]'),null);
});
test('floating visibility remains off across editing, applying, closing and reloading',()=>{
 const f=setup();assert.equal(f.entries.setPreference('floating',false),true);
 for(const value of [true,false,true,false]){f.entries.setEditing(value);f.entries.setApplied(!value);assert.equal(f.launcher.classList.contains('hidden'),true);}
 const value=JSON.parse(f.values.get(WORKSHOP_ENTRIES_KEY));assert.equal(value.floating,false);
 const reload=setup({stored:value});assert.equal(reload.launcher.classList.contains('hidden'),true);reload.entries.destroy();f.entries.destroy();
});
test('last viable entry cannot be disabled while native containers are unavailable',async()=>{
 const f=setup({native:false});assert.equal(f.entries.setPreference('floating',false),false);assert.match(f.messages.at(-1),/至少保留/);
 const menu=f.document.createElement('div');menu.id='extensionsMenu';f.document.body.append(menu);await tick();
 assert.ok(menu.querySelector('[data-workshop-entry="wand"]'));assert.equal(f.entries.setPreference('floating',false),false,'menu without its host button is not usable');
 const button=f.document.createElement('button');button.id='extensionsMenuButton';f.document.body.append(button);await tick();
 assert.equal(f.entries.setPreference('floating',false),true);assert.equal(f.entries.setPreference('wand',false),false);
 menu.remove();const replacement=f.document.createElement('div');replacement.id='extensionsMenu';f.document.body.append(replacement);await tick();
 assert.equal(replacement.querySelectorAll('[data-workshop-entry]').length,1);f.entries.sync();assert.equal(replacement.querySelectorAll('[data-workshop-entry]').length,1);f.entries.destroy();
});
test('checkbox settings are browser local and failed persistence keeps the original preference',()=>{
 const f=setup({storageError:true}),root=f.entries.renderSettings();f.shadow.append(root);
 const input=root.querySelector('[data-workshop-entry-choice="floating"]');input.checked=false;input.dispatchEvent(new f.window.Event('change'));
 assert.equal(input.checked,true);assert.equal(f.entries.preferences.floating,true);assert.equal(f.launcher.classList.contains('hidden'),false);assert.match(f.messages.at(-1),/未保存/);assert.equal(f.values.size,0);
 assert.match(root.textContent,/不随方案保存或导出/);f.entries.destroy();
});
test('invalid or unreadable preference is reported instead of silently discarded',()=>{
 const f=setup({stored:{wand:false,extensions:false,floating:false}});assert.match(f.messages[0],/未能读取/);assert.equal(f.launcher.classList.contains('hidden'),false);f.entries.destroy();
 const g=setup();const messages=[];const entries=createWorkshopEntries({document:g.document,launcher:g.launcher,storage:{getItem(){throw Error('blocked');}},onMessage:m=>messages.push(m)});assert.match(messages[0],/blocked/);entries.destroy();g.entries.destroy();
});
test('last selected native entry is protected and multiple controls stay synchronized',()=>{
 const f=setup(),a=f.entries.renderSettings(),b=f.entries.renderSettings();
 f.entries.setPreference('floating',false);f.entries.setPreference('extensions',false);assert.equal(f.entries.setPreference('wand',false),false);
 for(const root of [a,b]){assert.equal(root.querySelector('[data-workshop-entry-choice="wand"]').checked,true);assert.equal(root.querySelector('[data-workshop-entry-choice="floating"]').checked,false);}
 const copy=f.entries.preferences;copy.wand=false;assert.equal(f.entries.preferences.wand,true);f.entries.destroy();
});

test('native entry buttons retain readable width and touch height under host menu styles',()=>{
 const f=setup();
 for(const root of f.document.querySelectorAll('[data-workshop-entry]')){
  assert.equal(root.style.width,'100%');
  for(const button of root.querySelectorAll('button')){
   assert.equal(button.style.minWidth,'120px');assert.equal(button.style.minHeight,'44px');assert.equal(button.style.whiteSpace,'nowrap');
  }
 }
 f.entries.destroy();
});
