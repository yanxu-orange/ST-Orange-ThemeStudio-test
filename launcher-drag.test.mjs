import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {installLauncherDrag,LAUNCHER_POSITION_KEY} from './launcher-drag.mjs';
function fixture(initial){
 const {document,window}=parseHTML('<html><body><button>工坊</button></body></html>');window.innerWidth=390;window.innerHeight=844;
 const launcher=document.querySelector('button'),saved=new Map(initial?[[LAUNCHER_POSITION_KEY,JSON.stringify(initial)]]:[]);launcher.getBoundingClientRect=()=>({left:parseFloat(launcher.style.left)||330,top:parseFloat(launcher.style.top)||770,width:52,height:44});
 const storage={getItem:key=>saved.get(key),setItem:(key,value)=>saved.set(key,value)},control=installLauncherDrag({launcher,storage});let opens=0;launcher.addEventListener('click',()=>opens++);
 const event=(type,x,y,extra={})=>{const e=new window.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{clientX:x,clientY:y,pointerId:1,button:0,...extra});(type==='pointerdown'||type==='click'?launcher:document).dispatchEvent(e);return e;};
 return {document,window,launcher,control,event,saved,get opens(){return opens;}};
}
test('launcher tap opens, tiny movement opens, real drag snaps and does not open',()=>{
 const f=fixture();f.event('pointerdown',350,800);f.event('pointerup',350,800);f.event('click',350,800,{detail:1});assert.equal(f.opens,1);
 f.event('pointerdown',350,800);f.event('pointermove',352,801);f.event('pointerup',352,801);f.event('click',352,801,{detail:1});assert.equal(f.opens,2);assert.equal(f.saved.size,0);
 f.event('pointerdown',350,800);f.event('pointermove',40,300);f.event('pointerup',40,300);const click=f.event('click',40,300,{detail:1});assert.equal(f.opens,2);assert.equal(click.defaultPrevented,true);assert.equal(f.launcher.style.left,'8px');assert.equal(JSON.parse(f.saved.get(LAUNCHER_POSITION_KEY)).side,'left');
 f.event('pointerdown',25,300);f.event('pointerup',25,300);f.event('click',25,300,{detail:1});assert.equal(f.opens,3);
});
test('launcher stores normalized height, restores after reload, and remains visible after viewport changes',()=>{
 const f=fixture({side:'left',y:.4});assert.equal(f.launcher.style.left,'8px');assert.equal(parseFloat(f.launcher.style.top),8+(844-44-16)*.4);
 f.window.innerWidth=320;f.window.innerHeight=200;f.window.dispatchEvent(new f.window.Event('resize'));assert.equal(f.launcher.style.left,'8px');assert.equal(parseFloat(f.launcher.style.top),8+(200-44-16)*.4);
 f.event('pointerdown',25,80);f.event('pointermove',800,-200);f.event('pointerup',800,-200);assert.equal(f.launcher.style.left,'260px');assert.equal(f.launcher.style.top,'8px');assert.deepEqual(JSON.parse(f.saved.get(LAUNCHER_POSITION_KEY)),{side:'right',y:0});
 const fresh=fixture(JSON.parse(f.saved.get(LAUNCHER_POSITION_KEY)));assert.equal(fresh.launcher.style.left,'330px');assert.equal(fresh.launcher.style.top,'8px');
});
test('cancel, resize during drag, keyboard click and unavailable storage preserve an operable launcher',()=>{
 const f=fixture({side:'right',y:.5}),before=f.launcher.style.top;
 f.event('pointerdown',350,400);f.event('pointermove',30,90);f.event('pointercancel',30,90);assert.equal(f.launcher.style.left,'330px');assert.equal(f.launcher.style.top,before);assert.deepEqual(JSON.parse(f.saved.get(LAUNCHER_POSITION_KEY)),{side:'right',y:.5});
 f.event('click',0,0,{detail:0});assert.equal(f.opens,1);
 f.event('pointerdown',350,400);f.event('pointermove',30,90);f.window.dispatchEvent(new f.window.Event('resize'));assert.equal(f.launcher.hasAttribute('data-dragging'),false);assert.equal(f.launcher.style.left,'330px');
 f.control.destroy();const control=installLauncherDrag({launcher:f.launcher,storage:{getItem(){throw Error('blocked');},setItem(){throw Error('full');}}});f.event('pointerdown',350,800);f.event('pointermove',30,50);f.event('pointerup',30,50);assert.equal(f.launcher.style.left,'8px');control.destroy();
});
test('visual viewport offsets and insets constrain the launcher',()=>{
 const f=fixture();f.window.visualViewport={offsetLeft:20,offsetTop:50,width:250,height:180};f.window.getComputedStyle=()=>({getPropertyValue:name=>name==='--launcher-safe-bottom'?'20px':'0px'});f.control.sync();assert.equal(f.launcher.style.left,'210px');assert.equal(f.launcher.style.top,'158px');
});
