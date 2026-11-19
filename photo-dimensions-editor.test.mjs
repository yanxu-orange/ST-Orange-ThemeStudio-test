import {openEditor} from './test-support/open-editor.mjs';
import {navigateRegion} from './test-support/editor-navigation.mjs';
import {seedNativeChat,requestNativeFrame,cancelNativeFrame,settleNativeCanvas} from './test-support/native-chat.mjs';
import {editorStorage,saveEditorScheme} from './test-support/editor-storage.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import {parseHTML} from 'linkedom';
test('responsive photo dimensions save, restore and remain independent',async()=>{
 const {document,window}=parseHTML('<html><head><style id="custom-style"></style></head><body><div id="sheld"><div id="chat"></div></div></body></html>');
 const desc=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:desc.get,set(v){for(const o of this.options)o.toggleAttribute('selected',o.value===String(v));},configurable:true});
 const values=new Map();Object.assign(globalThis,{document,window,localStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},requestAnimationFrame:requestNativeFrame,cancelAnimationFrame:cancelNativeFrame,ResizeObserver:class{observe(){}unobserve(){}disconnect(){}}});
 const scheme=await editorStorage(null);seedNativeChat(document);await import('./index.js');const sh=document.querySelector('#orange-theme-lab').shadowRoot;
 const edit=(label,v)=>{const n=sh.querySelector(`[aria-label="${label}"]`);assert.ok(n,label);n.value=String(v);n.dispatchEvent(new window.Event('input'));n.dispatchEvent(new window.Event('change'));};
 const save=()=>saveEditorScheme(sh,scheme);
 openEditor(sh);navigateRegion(sh,'header');sh.querySelector('[data-kind="avatar"]').click();edit('AI 与用户','separate');
 edit('头像宽度单位','percent');edit('头像窗口宽度 数值',43);const prior=await save(),msg=document.querySelector('#chat > .mes[data-otl-live][is_user="false"]'),inner=Math.max(1,(msg.clientWidth||prior.cardWidth)-(prior.cardPadding??24)*2);edit('头像窗口高度','fixed');assert.ok(Math.abs((await save()).photos.ai.height-Math.min(600,inner*.43/Number(prior.photos.ai.ratio)))<1e-8);edit('窗口高度 数值',166);let c=await save();assert.equal(c.photos.ai.widthUnit,'percent');assert.equal(c.photos.ai.size,43);assert.equal(c.photos.ai.height,166);assert.equal(c.photos.user.widthUnit,prior.photos.user.widthUnit);
 edit('窗口高度 数值',150);sh.querySelector('#restore').click();assert.equal((await save()).photos.ai.height,166);
 edit('头像窗口高度','auto');assert.ok(sh.querySelector('[aria-label="头像比例"]'));edit('头像比例','0.75');assert.equal((await save()).photos.ai.height,'auto');
 edit('AI 与用户','unified');edit('头像窗口高度','fixed');edit('窗口高度 数值',180);c=await save();assert.deepEqual(c.photos.ai,c.photos.user);
 navigateRegion(sh,'overall');edit('卡片内边距 数值',16);edit('卡片阴影','false');c=await save();assert.equal(c.cardPadding,16);assert.equal(c.cardShadow,false);sh.querySelector('#close').click();
});
