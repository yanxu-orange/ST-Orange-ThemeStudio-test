import {navigateRegion} from './test-support/editor-navigation.mjs';
import {seedNativeChat,requestNativeFrame,cancelNativeFrame,settleNativeCanvas} from './test-support/native-chat.mjs';
import {editorStorage,saveEditorScheme} from './test-support/editor-storage.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {previewFrameGeometry} from './preview-layout.mjs';
import {bodyCardSettings,chatFrameRules} from './body-card.mjs';

test('preview uses captured host width, fits available space and narrows the frame rather than cards',()=>{
 assert.deepEqual(previewFrameGeometry(760,1600,410),{width:760,left:224});
 assert.deepEqual(previewFrameGeometry(900,1200,410),{width:772,left:18});
 assert.deepEqual(previewFrameGeometry(900,1600,410,true),{width:390,left:409});
 assert.deepEqual(previewFrameGeometry(390,390,410,true),{width:374,left:8});
 assert.deepEqual(previewFrameGeometry(320,320,410),{width:304,left:8});
 assert.deepEqual(previewFrameGeometry(0,390,410),{width:374,left:8});
});
test('chat gutters allow zero and full card width removes the cap with shared rules',()=>{
 const c={...bodyCardSettings({cardGutter:0,cardFullWidth:true}),cardWidth:760};
 for(const root of ['html[data-orange-live]','html[data-orange-lab]']){const css=chatFrameRules(root+' #chat',root+' .mes',c);assert.match(css,/padding:20px 0px 90px!important/);assert.match(css,/max-width:none!important/);assert.match(css,/gap:0!important/);}
 assert.match(chatFrameRules('#chat','.mes',{...c,cardFullWidth:false,cardGutter:23}),/padding:20px 23px 90px!important/);
 assert.match(chatFrameRules('#chat','.mes',{...c,cardFullWidth:false}),/max-width:760px!important/);
 for(const c of [{cardGutter:-1},{cardGutter:81},{cardGutter:'0'},{cardFullWidth:'true'}])assert.throws(()=>bodyCardSettings(c));
});
test('new preview controls persist, undo and export without navigation changing design',async()=>{
 const {document,window}=parseHTML('<html><head><style id="custom-style"></style></head><body><div id="sheld"><div id="chat"></div></div></body></html>');
 const desc=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:desc.get,set(v){for(const o of this.options)o.toggleAttribute('selected',o.value===String(v));},configurable:true});
 const values=new Map();Object.assign(globalThis,{document,window,localStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},requestAnimationFrame:requestNativeFrame,cancelAnimationFrame:cancelNativeFrame,ResizeObserver:class{observe(){}unobserve(){}disconnect(){}}});
 document.querySelector('#chat').getBoundingClientRect=()=>({width:900});
 const scheme=await editorStorage(null);seedNativeChat(document);await import('./index.js');const sh=document.querySelector('#orange-theme-lab').shadowRoot;
 const set=(label,value)=>{const n=sh.querySelector(`[aria-label="${label}"]`);assert.ok(n,label);n.value=String(value);n.dispatchEvent(new window.Event('input'));n.dispatchEvent(new window.Event('change'));},save=()=>saveEditorScheme(sh,scheme);
 sh.querySelector('.launcher').click();navigateRegion(sh,'overall');set('卡片宽度','true');assert.equal(sh.querySelector('[aria-label="卡片最大宽度 数值"]'),null);set('卡片两侧留白 数值',0);let c=(await save());assert.equal(c.cardFullWidth,true);assert.equal(c.cardGutter,0);
 navigateRegion(sh,'reasoning');assert.equal(sh.querySelector('[aria-label="显示入口箭头"]').value,'false');set('显示入口箭头','true');set('入口文字水平位置 数值',30);set('入口文字纵向位置 数值',-16);c=(await save());assert.equal(c.reasoningStyle.entry.showArrow,true);assert.deepEqual(c.reasoningStyle.entry.labelPosition,{x:30,y:-16});sh.querySelector('#undo').click();assert.deepEqual((await save()).reasoningStyle.entry.labelPosition,{x:30,y:0});
 navigateRegion(sh,'native');set('垂直定位','bottom');set('所在区域','footer');assert.equal(sh.querySelectorAll('[aria-label="垂直定位"]').length,1);set('所在区域','header');assert.equal(sh.querySelector('[aria-label="垂直定位"]').value,'bottom');c=(await save());assert.equal(c.nativeStyle.actions.edit.anchor,'bottom');
 await settleNativeCanvas();const message=document.querySelector('[data-otl-live]'),hint=message.querySelector('.extraMesButtonsHint.mes_button'),edit=message.querySelector('.mes_edit.mes_button');assert.ok(hint);assert.ok(edit);const nativeParent=hint.parentNode;let nativeClicks=0;hint.addEventListener('click',()=>nativeClicks++);hint.click();assert.equal(nativeClicks,1);assert.equal(hint.parentNode,nativeParent);assert.equal(document.querySelectorAll('[data-orange-lab-fixture]').length,0);assert.doesNotMatch(document.querySelector('#orange-theme-live-style').textContent,/otl-native-demo/);
 sh.querySelector('#narrow').click();assert.deepEqual((await save()),c);assert.doesNotMatch(document.querySelector('#orange-workbench-layout').textContent,/min-width:390px/);assert.doesNotMatch(document.querySelector('#orange-theme-live-style').textContent,/[^{]*data-otl-narrow[^{}]*#chat>\.mes[^{}]*\{[^}]*max-width:390px/);
 let blob;const create=URL.createObjectURL,revoke=URL.revokeObjectURL;URL.createObjectURL=b=>{blob=b;return 'blob:fake';};URL.revokeObjectURL=()=>{};sh.querySelector('#export').click();assert.deepEqual(JSON.parse(await blob.text()),c);URL.createObjectURL=create;URL.revokeObjectURL=revoke;
 sh.querySelector('#close').click();assert.equal(document.querySelector('#orange-workbench-layout'),null);assert.equal(document.querySelectorAll('[data-orange-lab-fixture]').length,0);sh.querySelector('.launcher').click();assert.deepEqual((await save()),c);sh.querySelector('#close').click();
});
