import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {createAvatarCompositionList} from './avatar-composition-list.mjs';
import {syncRegionOrder} from './region-layers.mjs';

function setup(){
 const {document,window}=parseHTML('<html><body></body></html>');const config=syncRegionOrder({layers:[{id:'back',name:'月亮',anchor:'avatar',scope:'ai',visible:true},{id:'front',name:'镜框',anchor:'avatar',scope:'ai',visible:true}],regionOrder:{header:['image:back','avatar','name','time','image:front']}});
 let active=true;const commits=[],selections=[];const result=createAvatarCompositionList({make:(tag,cls='',text='')=>{const el=document.createElement(tag);el.className=cls;el.textContent=text;return el;},config,scope:'ai',selected:'front',valid:()=>active,onSelect:id=>selections.push(id),onCommit:(key,order)=>commits.push({key,order}),onAdd:()=>{}});
 document.body.append(result.element);result.element.getBoundingClientRect=()=>({left:0,right:400,top:0,bottom:200});[...result.element.querySelectorAll('[data-composition-key]')].forEach((r,i)=>r.getBoundingClientRect=()=>({left:0,right:400,top:i*50,bottom:i*50+50,height:50}));
 const event=(node,type,extra={})=>{const e=new window.Event(type,{bubbles:true,cancelable:true});for(const [key,value]of Object.entries({pointerId:1,button:0,clientX:20,clientY:20,...extra}))Object.defineProperty(e,key,{value});node.dispatchEvent(e);return e;};
 return{...result,document,config,commits,selections,event,setActive:v=>active=v};
}

test('subject clicks select only; keyboard order crosses fixed avatar with one commit',()=>{
 const s=setup(),front=s.element.querySelector('[data-composition-layer=front]');front.click();assert.deepEqual(s.selections,['front']);assert.equal(s.commits.length,0);
 const handle=s.element.querySelector('[data-composition-handle=front]');s.event(handle,'keydown',{key:'ArrowDown'});assert.equal(s.commits.length,1);assert.ok(s.commits[0].order.indexOf('image:front')<s.commits[0].order.indexOf('avatar'));
 assert.equal(s.element.querySelector('[data-composition-key=avatar] button'),null);s.dispose();
});

test('touch-style drag changes no config before release; cancel, escape and stale context never commit',()=>{
 for(const cancel of ['pointercancel','Escape','stale','outside','dispose']){
  const s=setup(),before=structuredClone(s.config),h=s.element.querySelector('[data-composition-handle=front]');s.event(h,'pointerdown',{pointerType:'touch'});s.event(s.document,'pointermove',{pointerType:'touch',clientY:145});assert.equal(s.commits.length,0);assert.deepEqual(s.config,before);
  if(cancel==='pointercancel')s.event(s.document,'pointercancel');else if(cancel==='Escape')s.event(s.document,'keydown',{key:'Escape'});else if(cancel==='stale')s.setActive(false);else if(cancel==='outside')s.event(s.document,'pointermove',{clientX:800,clientY:145});else s.dispose();
  s.event(s.document,'pointerup',{clientY:145,...(cancel==='outside'?{clientX:800}:{})});assert.equal(s.commits.length,0,cancel);s.dispose();
 }
});

test('completed drag commits once, while taps and no-op drops do not commit',()=>{
 const s=setup(),h=s.element.querySelector('[data-composition-handle=front]');s.event(h,'pointerdown');s.event(s.document,'pointermove',{clientY:145});s.event(s.document,'pointerup',{clientY:145});assert.equal(s.commits.length,1);assert.equal(s.commits[0].key,'image:front');s.event(s.document,'pointerup');assert.equal(s.commits.length,1);s.dispose();
 const tap=setup(),t=tap.element.querySelector('[data-composition-handle=front]');tap.event(t,'pointerdown');tap.event(tap.document,'pointerup');assert.equal(tap.commits.length,0);tap.event(t,'pointerdown');tap.event(tap.document,'pointermove',{clientY:30});tap.event(tap.document,'pointerup',{clientY:30});assert.equal(tap.commits.length,0);tap.dispose();
});
