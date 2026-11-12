import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {createWorkshopEntries,WORKSHOP_ENTRIES_KEY,WORKSHOP_ICON_URL} from './workshop-entries.mjs';
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
 for(const name of ['wand','extensions'])f.document.querySelector(`[data-workshop-entry="${name}"] [data-workshop-action="open"]`).click();
 assert.equal(f.opens,2);assert.equal(f.document.querySelector('#native-item').textContent,'Native');assert.ok(f.document.querySelector('#native-setting'));
 f.entries.setApplied(true);
 const root=f.document.querySelector('[data-workshop-entry="wand"]');assert.equal(root.firstElementChild.textContent,'继续编辑主题工坊');assert.equal(root.lastElementChild.hidden,false);root.lastElementChild.click();assert.equal(f.stops,1);
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

test('native entries are compact icon and label rows, without nested buttons or fixed flex height',()=>{
 const f=setup();
 for(const root of f.document.querySelectorAll('[data-workshop-entry]')){
  assert.equal(root.className,'extension_container');assert.ok(!root.style.width);
  assert.equal(root.querySelector('button'),null);
  const open=root.querySelector('[data-workshop-action="open"]');
  assert.equal(open.getAttribute('role'),'button');assert.equal(open.getAttribute('tabindex'),'0');
  assert.equal(open.style.flex,'0 0 auto');assert.ok(!open.style.minHeight);
  assert.equal(open.style.justifyContent,'flex-start');
  assert.equal(open.getAttribute('aria-label'),'打开主题工坊');
  const icon=open.querySelector('img');assert.equal(icon.src,WORKSHOP_ICON_URL);
  assert.equal(icon.getAttribute('aria-hidden'),'true');assert.equal(icon.alt,'');
  assert.equal(icon.style.width,'1.25em');assert.equal(icon.style.height,'1.25em');
  const label=open.querySelector('span');assert.equal(label.textContent,'主题工坊');
  f.entries.setApplied(true);assert.equal(open.querySelector('img'),icon);assert.equal(label.textContent,'继续编辑主题工坊');
  f.entries.setApplied(false);assert.equal(open.querySelector('img'),icon);
 }
 assert.ok(f.document.querySelector('[data-workshop-entry="wand"] > .list-group-item'));
 assert.ok(f.document.querySelector('[data-workshop-entry="extensions"] > .standoutHeader'));
 f.entries.destroy();
});
test('native rows support Enter and Space once, and hidden applied actions stay hidden after remount',async()=>{
 const f=setup();
 const open=f.document.querySelector('[data-workshop-entry="wand"] [data-workshop-action="open"]');
 for(const key of ['Enter',' ']){
  const event=new f.window.Event('keydown',{cancelable:true});Object.assign(event,{key,repeat:false});open.dispatchEvent(event);assert.equal(event.defaultPrevented,true);
 }
 assert.equal(f.opens,2);
 const repeat=new f.window.Event('keydown',{cancelable:true});Object.assign(repeat,{key:'Enter',repeat:true});open.dispatchEvent(repeat);assert.equal(f.opens,2);
 f.entries.setPreference('wand',false);assert.equal(f.document.querySelector('[data-workshop-entry="wand"]').style.display,'none');
 f.entries.setApplied(true);f.document.querySelector('#extensionsMenu').replaceChildren();f.entries.sync();await tick();
 const root=f.document.querySelector('[data-workshop-entry="wand"]');assert.equal(root.style.display,'none');assert.equal(root.lastElementChild.hidden,false);
 f.entries.setApplied(false);assert.equal(root.lastElementChild.style.display,'none');
 f.entries.setPreference('wand',true);assert.equal(root.style.display,'');assert.equal(root.lastElementChild.style.display,'none');
 assert.equal(f.document.querySelectorAll('[data-workshop-entry="wand"]').length,1);f.entries.destroy();
});

test('unrelated chat and native child batches do not reconcile entry targets',async()=>{
 const f=setup();await tick();
 const chat=f.document.createElement('div');chat.id='chat';f.document.body.append(chat);await tick();
 const query=f.document.querySelector.bind(f.document);let targetQueries=0;
 f.document.querySelector=selector=>{if(['#extensionsMenu','#extensions_settings'].includes(selector))targetQueries++;return query(selector);};
 for(let i=0;i<20;i++){
  const message=f.document.createElement('div');message.className='mes';message.innerHTML='<div class="mes_text"><p>Streaming text</p></div>';chat.replaceChildren(message);
  const unrelated=f.document.createElement('span');query('#extensionsMenu').append(unrelated);await tick();unrelated.remove();await tick();
 }
 assert.equal(targetQueries,0);
 f.entries.destroy();
});

test('native ancestor replacement and removed owned rows recover automatically once',async()=>{
 const f=setup();f.entries.setApplied(true);f.entries.setPreference('wand',false);await tick();
 const wrapper=f.document.createElement('section');wrapper.innerHTML='<div id="extensionsMenu"></div><div id="extensions_settings"></div>';
 f.document.querySelector('#extensionsMenu').remove();f.document.querySelector('#extensions_settings').remove();f.document.body.append(wrapper);await tick();await tick();
 for(const name of ['wand','extensions']){
  const root=f.document.querySelector(`[data-workshop-entry="${name}"]`);assert.ok(root);assert.equal(root.lastElementChild.hidden,false);
  root.remove();await tick();await tick();assert.equal(f.document.querySelectorAll(`[data-workshop-entry="${name}"]`).length,1);
 }
 assert.equal(f.document.querySelector('[data-workshop-entry="wand"]').style.display,'none');
 wrapper.querySelector('#extensionsMenu').replaceChildren();await tick();await tick();
 assert.equal(wrapper.querySelectorAll('[data-workshop-entry="wand"]').length,1);
 f.entries.destroy();
});

test('late native target ancestors and wand button availability update settings',async()=>{
 const f=setup({native:false}),settings=f.entries.renderSettings();f.shadow.append(settings);
 const wrapper=f.document.createElement('section');wrapper.innerHTML='<div id="extensionsMenu"></div><div id="extensions_settings"></div>';f.document.body.append(wrapper);await tick();
 assert.equal(f.document.querySelectorAll('[data-workshop-entry]').length,2);
 assert.match(settings.querySelector('[data-workshop-entry-hint="wand"]').textContent,/等待/);
 const button=f.document.createElement('button');button.id='extensionsMenuButton';wrapper.append(button);await tick();
 assert.equal(settings.querySelector('[data-workshop-entry-hint="wand"]').textContent,'');
 button.remove();await tick();assert.match(settings.querySelector('[data-workshop-entry-hint="wand"]').textContent,/等待/);
 f.entries.destroy();
});
