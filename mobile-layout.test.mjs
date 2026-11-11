import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {createWorkbench,workbenchMarkup,mobileGeometry,mobileLayoutShare} from './workbench-ui.mjs';
function setup(width=390){
 const {document,window}=parseHTML('<html><body></body></html>'),desc=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:desc.get,set(v){for(const o of this.options)o.toggleAttribute('selected',o.value===String(v));},configurable:true});window.innerWidth=width;window.innerHeight=844;
 const host=document.createElement('div');document.body.append(host);const sh=host.attachShadow({mode:'open'});sh.innerHTML=workbenchMarkup();let layouts=0;const wb=createWorkbench(sh,{onNavigate:()=>wb.render(),onLayout:()=>{layouts++;wb.setMobileGeometry(mobileGeometry(844,18,true,0,false,0,{share:wb.ui.mobileSplit,fullscreen:wb.ui.libraryExpanded,editing:wb.ui.layoutEditing}));}});wb.render();wb.setMobileGeometry(mobileGeometry(844,18,true));
 const event=(selector,type,props={})=>{const e=new window.Event(type,{bubbles:true,cancelable:true,composed:true});Object.assign(e,props);sh.querySelector(selector).dispatchEvent(e);return e;};const pointer=(type,y,id=1)=>event('#wb-mobile-splitter',type,{pointerId:id,clientY:y,button:0,isPrimary:true});
 return {window,sh,wb,event,pointer,layouts:()=>layouts,click:selector=>sh.querySelector(selector).click()};
}
test('phone divider only responds in layout mode, supports reset, completion and cancelled pointers',()=>{
 const {sh,wb,click,pointer,event}=setup();pointer('pointerdown',400);pointer('pointermove',520);assert.equal(wb.ui.mobileSplit,54);
 click('#layout-adjust');assert.equal(wb.ui.mobileView,'adjust');assert.equal(wb.ui.layoutEditing,true);assert.equal(sh.querySelector('#wb-mobile-splitter').classList.contains('hidden'),false);
 pointer('pointerdown',400);pointer('pointermove',475,2);assert.equal(wb.ui.mobileSplit,54);pointer('pointermove',475);assert.ok(wb.ui.mobileSplit>54&&wb.ui.mobileSplit<65);pointer('pointercancel',475);pointer('pointermove',550);assert.ok(wb.ui.mobileSplit>54&&wb.ui.mobileSplit<65);
 pointer('pointerdown',475);pointer('pointermove',550);assert.ok(wb.ui.mobileSplit>63&&wb.ui.mobileSplit<75);pointer('lostpointercapture',550);pointer('pointermove',300);assert.ok(wb.ui.mobileSplit>63&&wb.ui.mobileSplit<75);
 click('#layout-reset');assert.equal(wb.ui.mobileSplit,54);event('#wb-mobile-splitter','keydown',{key:'ArrowUp'});assert.equal(wb.ui.mobileSplit,53);assert.equal(sh.querySelector('#wb-mobile-splitter').getAttribute('aria-valuenow'),'53');event('#wb-mobile-splitter','keydown',{key:'End'});assert.equal(wb.ui.mobileSplit,75);event('#wb-mobile-splitter','keydown',{key:'Home'});assert.equal(wb.ui.mobileSplit,20);
 click('#layout-done');assert.equal(wb.ui.layoutEditing,false);pointer('pointerdown',400);pointer('pointermove',600);event('#wb-mobile-splitter','keydown',{key:'ArrowDown'});assert.equal(wb.ui.mobileSplit,20);
 click('#layout-adjust');event('#wb-mobile-splitter','keydown',{key:'Escape'});assert.equal(wb.ui.layoutEditing,false);
});
test('material expansion preserves mobile and desktop splits across repeated toggles and exits',()=>{
 const {window,sh,wb,click,event}=setup();click('#layout-adjust');event('#wb-mobile-splitter','keydown',{key:'ArrowDown'});click('#layout-done');click('#mode-library');const share=wb.ui.mobileSplit,desktop=wb.ui.split;
 for(let i=0;i<3;i++){click('#library-expand');assert.equal(wb.ui.libraryExpanded,true);wb.render();assert.equal(wb.ui.libraryExpanded,true);click('#library-expand');assert.equal(wb.ui.libraryExpanded,false);assert.equal(wb.ui.mobileSplit,share);assert.equal(wb.ui.split,desktop);}
 click('#library-expand');event('#library-expand','keydown',{key:'Escape'});assert.equal(wb.ui.libraryExpanded,false);assert.equal(wb.ui.mobileSplit,share);click('#library-expand');click('#mode-edit');assert.equal(wb.ui.libraryExpanded,false);assert.equal(sh.querySelector('#library-expand').hidden,true);
 click('#mode-library');click('#library-expand');wb.choosePage('settings');assert.equal(wb.ui.libraryExpanded,false);wb.choosePage('chat');assert.equal(wb.ui.mobileSplit,share);
 window.innerWidth=1400;window.dispatchEvent(new window.Event('resize'));wb.split(61);click('#mode-library');click('#library-expand');assert.equal(wb.ui.libraryExpanded,true);click('#library-expand');assert.equal(wb.ui.split,61);
 window.innerWidth=390;window.dispatchEvent(new window.Event('resize'));assert.equal(wb.ui.split,61);assert.equal(wb.ui.mobileSplit,share);window.innerWidth=1400;window.dispatchEvent(new window.Event('resize'));assert.equal(wb.ui.split,61);
});
test('navigation, preview picks, close and changing to desktop dismiss layout handles without losing ratio',()=>{
 const {window,sh,wb,click,event,pointer}=setup();for(const end of [()=>click('#full-view'),()=>{wb.ui.mobileView='preview';wb.render();},()=>wb.choosePage('settings'),()=>wb.resetLayoutSession(),()=>{window.innerWidth=1400;window.dispatchEvent(new window.Event('resize'));}]){window.innerWidth=390;wb.choosePage('chat');click('#layout-adjust');event('#wb-mobile-splitter','keydown',{key:'ArrowDown'});const share=wb.ui.mobileSplit;pointer('pointerdown',400);end();pointer('pointermove',600);assert.equal(wb.ui.layoutEditing,false);assert.equal(sh.querySelector('#wb-mobile-splitter').classList.contains('hidden'),true);assert.equal(wb.ui.mobileSplit,share);}
});
test('mobile geometry keeps bounds through heights, safe areas, keyboard and full material mode',()=>{
 for(const height of [160,320,667,844])for(const share of [20,54,75])for(const compact of [false,true])for(const fullscreen of [false,true])for(const editing of [false,true]){const g=mobileGeometry(height,64,true,25,compact,34,{share,fullscreen,editing});assert.ok(g.height>=0&&g.sheet>=0);assert.ok(g.top+g.height<=g.panelTop);assert.ok(g.panelTop+g.sheet<=25+height-42+.01);if(compact||fullscreen)assert.equal(g.height,0);}
 assert.equal(mobileLayoutShare(NaN),54);assert.equal(mobileLayoutShare(-1),20);assert.equal(mobileLayoutShare(100),75);
 const normal=mobileGeometry(844,18,true,0,false,0,{share:63}),keyboard=mobileGeometry(420,64,true,80,true,0,{share:63});assert.equal(keyboard.height,0);assert.deepEqual(mobileGeometry(844,18,true,0,false,0,{share:63}),normal);
});
test('desktop drag and arrows remain immediate while mobile does not alter desktop split',()=>{
 const {window,wb,event}=setup(1400);event('#wb-splitter','pointerdown',{pointerId:1});event('#wb-splitter','pointermove',{clientX:800});assert.ok(wb.ui.split>55);event('#wb-splitter','pointercancel',{});const share=wb.ui.split;event('#wb-splitter','pointermove',{clientX:1000});assert.equal(wb.ui.split,share);event('#wb-splitter','keydown',{key:'ArrowLeft'});assert.equal(wb.ui.split,share-1);
 window.innerWidth=390;window.dispatchEvent(new window.Event('resize'));const desktop=wb.ui.split;event('#wb-splitter','pointerdown',{});event('#wb-splitter','pointermove',{clientX:300});event('#wb-splitter','keydown',{key:'ArrowRight'});assert.equal(wb.ui.split,desktop);
});
