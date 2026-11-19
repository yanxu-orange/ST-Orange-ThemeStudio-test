import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {createSchemeModel} from './scheme-model.mjs';
import {newLayer} from './layers.mjs';
import {syncRegionOrder} from './region-layers.mjs';
import {avatarCompositionEntries} from './avatar-composition-order.mjs';
import {setAvatarEffects,EFFECT_DEFAULTS} from './avatar-effects.mjs';
import {openEditor} from './test-support/open-editor.mjs';
import {seedNativeChat,requestNativeFrame,cancelNativeFrame} from './test-support/native-chat.mjs';
import {editorStorage,saveEditorScheme} from './test-support/editor-storage.mjs';

test('composition keyboard sorting saves, undoes once and retains image geometry, effects and unlisted order',async()=>{
 const {document,window}=parseHTML('<html><head></head><body><div id="sheld"><div id="chat"></div></div></body></html>');const desc=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:desc.get,set(v){for(const o of this.options)o.toggleAttribute('selected',o.value===String(v));},configurable:true});
 const storage=new Map();Object.assign(globalThis,{document,window,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},requestAnimationFrame:requestNativeFrame,cancelAnimationFrame:cancelNativeFrame,ResizeObserver:class{observe(){}unobserve(){}disconnect(){}}});
 const model=createSchemeModel();let initial=model.validate(model.templates.blank);initial.avatarDesign='separate';initial.layers=['back','front','top'].map((id,i)=>newLayer('shape',{id,name:id,anchor:'avatar',scope:'ai',width:50+i,x:5+i,y:10+i,visible:i!==2}));initial.layers.push(newLayer('shape',{id:'user',name:'user',scope:'user',anchor:'avatar'}),newLayer('shape',{id:'free',name:'free',anchor:'header'}));initial=syncRegionOrder(initial);const desired=['image:back','image:user','avatar','name','image:free','image:front','time','image:top'];initial.regionOrder.header=[...desired,...initial.regionOrder.header.filter(k=>!desired.includes(k))];setAvatarEffects(initial,'ai',{...structuredClone(EFFECT_DEFAULTS),saturation:40,mask:{kind:'diamond',image:''}});initial=model.validate(initial);
 const store=await editorStorage(JSON.stringify(initial));seedNativeChat(document);await import('./index.js');const sh=document.querySelector('#orange-theme-lab').shadowRoot;openEditor(sh);sh.querySelector('[data-kind=avatar]').click();sh.querySelector('[data-avatar-tab=materials]').click();
 const save=()=>saveEditorScheme(sh,store),keys=()=>[...sh.querySelectorAll('[data-composition-key]')].map(row=>row.dataset.compositionKey);assert.deepEqual(keys(),['image:top','image:front','avatar','image:back']);assert.match(sh.querySelector('[data-composition-key="image:top"]').textContent,/已隐藏/);
 sh.querySelector('[data-composition-layer=front]').click();const h=sh.querySelector('[data-composition-handle=front]'),event=new window.Event('keydown');Object.defineProperty(event,'key',{value:'ArrowDown'});h.dispatchEvent(event);let c=await save();assert.deepEqual(avatarCompositionEntries(c,'ai').map(e=>e.key),['image:top','avatar','image:front','image:back']);assert.deepEqual(c.layers,initial.layers);assert.deepEqual(c.photos,initial.photos);assert.deepEqual(c.avatarEffects,initial.avatarEffects);assert.deepEqual(c.regionOrder.header.filter(k=>k!=='image:front'),initial.regionOrder.header.filter(k=>k!=='image:front'));assert.equal(sh.querySelector('[data-composition-layer=front]').getAttribute('aria-pressed'),'true');
 sh.querySelector('#undo').click();c=await save();assert.deepEqual(c.regionOrder,initial.regionOrder);assert.deepEqual(keys(),['image:top','image:front','avatar','image:back']);assert.deepEqual(model.validate(JSON.parse(JSON.stringify(c))).regionOrder,initial.regionOrder);
 sh.querySelector('#close').click();
});
