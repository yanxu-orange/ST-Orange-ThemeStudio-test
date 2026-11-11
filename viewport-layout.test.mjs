import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {createWorkbench,workbenchMarkup} from './workbench-ui.mjs';
import {installMobileFlow} from './mobile-flow.mjs';

test('viewport events share one frame and do not rewrite unchanged sizing',t=>{
 const {document,window}=parseHTML('<html><body></body></html>');
 const host=document.createElement('div');document.body.append(host);const shadow=host.attachShadow({mode:'open'});shadow.innerHTML=workbenchMarkup();
 const frames=[];Object.assign(window,{innerWidth:390,innerHeight:844,visualViewport:new window.EventTarget(),requestAnimationFrame:callback=>(frames.push(callback),frames.length)});Object.assign(window.visualViewport,{height:844,offsetTop:0});
 let layouts=0;const bench=createWorkbench(shadow,{onLayout:()=>layouts++});
 const apply=document.createElement('button');apply.id='apply-live';shadow.querySelector('#save').after(apply);installMobileFlow({shadow});
 const style=host.style,proto=Object.getPrototypeOf(style),set=proto.setProperty;let writes=0;proto.setProperty=function(...args){if(this===style)writes++;return set.apply(this,args);};t.after(()=>{proto.setProperty=set;});
 for(let i=0;i<20;i++){window.dispatchEvent(new window.Event('resize'));window.visualViewport.dispatchEvent(new window.Event('resize'));window.visualViewport.dispatchEvent(new window.Event('scroll'));}
 assert.equal(frames.length,1);assert.equal(layouts,0);frames.shift()();assert.equal(layouts,1);assert.equal(writes,0);
 bench.ui.layoutEditing=true;window.visualViewport.height=420;window.visualViewport.offsetTop=30;window.visualViewport.dispatchEvent(new window.Event('resize'));
 assert.equal(bench.ui.layoutEditing,false,'keyboard arrival cancels layout editing before the frame');frames.shift()();
 assert.equal(layouts,2);assert.equal(writes,2);assert.equal(style.getPropertyValue('--wb-vv-height'),'420px');assert.equal(style.getPropertyValue('--wb-vv-top'),'30px');
 window.visualViewport.height=844;window.visualViewport.offsetTop=0;window.visualViewport.dispatchEvent(new window.Event('resize'));frames.shift()();assert.equal(layouts,3);assert.equal(style.getPropertyValue('--wb-vv-height'),'844px');
 bench.ui.layoutEditing=true;window.innerWidth=1180;window.dispatchEvent(new window.Event('resize'));assert.equal(bench.ui.layoutEditing,false);frames.shift()();assert.equal(layouts,4);assert.equal(shadow.querySelector('#save').textContent,'保存方案');
});
