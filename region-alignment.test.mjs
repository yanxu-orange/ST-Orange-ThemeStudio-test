import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {ALIGNMENTS,alignmentDelta,regionSnap} from './region-alignment.mjs';
import {createLayerDrag} from './layer-drag.mjs';
import {createAlignmentGuides,renderAlignmentControls} from './editor-alignment.mjs';
const rect=(left,top,width,height)=>({left,top,right:left+width,bottom:top+height,width,height});
const region=rect(0,0,200,100),box=rect(30,20,40,30);
test('six visual bounds alignments and strict keys',()=>{
 assert.deepEqual(ALIGNMENTS.map(([k])=>alignmentDelta(box,region,k)),[{x:-30,y:0},{x:50,y:0},{x:130,y:0},{x:0,y:-20},{x:0,y:15},{x:0,y:50}]);
 for(const k of ['constructor','__proto__','nope'])assert.equal(alignmentDelta(box,region,k),null);
});
test('six region references use screen threshold and closest line',()=>{
 for(const [b,k]of [[rect(5,30,20,20),'left'],[rect(84,30,20,20),'centerX'],[rect(175,30,20,20),'right'],[rect(30,5,20,20),'top'],[rect(30,34,20,20),'centerY'],[rect(30,75,20,20),'bottom']])assert.ok(regionSnap(b,region).lines.includes(k),k);
 assert.deepEqual(regionSnap(rect(7,7,20,20),region).lines,[]);
});
function fixture({item={},target={},matrix='none',own='none',regionRect=region,boxRect=box,candidate=()=>true}={}){
 const {document,window}=parseHTML('<html><body><div data-orange-lab-fixture><div id="region"><img data-layer-id="a"></div></div></body></html>');
 const node=document.querySelector('img'),parent=node.parentElement;
 window.getComputedStyle=n=>({transform:n===parent?matrix:n===node?own:'none',zoom:'1',display:'block',visibility:'visible'});
 window.DOMMatrix=class {constructor(v){this.is2D=!v.startsWith('matrix3d');[this.a,this.b,this.c,this.d]=v.startsWith('rotate')?[0,1,-1,0]:[2,0,0,2];}};
 let reads=0;parent.getBoundingClientRect=()=>{reads++;return regionRect;};node.getBoundingClientRect=()=>{reads++;return boxRect;};
 Object.assign(parent,{clientWidth:200,clientHeight:100});Object.assign(node,{offsetWidth:40,offsetHeight:30});
 const layer={id:'a',visible:true,x:30,y:20,side:'left',vertical:'top',offsetUnit:'px',width:40,...item},state={active:true,page:'chat',mode:'edit',region:'header',kind:'image',object:'a',layers:[layer],regionFor:()=> 'header'},commits=[];
 const guides=createAlignmentGuides(document);let snap=true;
 const drag=createLayerDrag({document,getState:()=>state,getLayerTarget:()=>target,getAlignmentRegion:n=>n.parentElement,alignmentCandidate:candidate,getSnapEnabled:()=>snap,guides,onCommit:(i,next)=>{commits.push(next);}});drag.refresh();
 function event(type,x=0,y=0,id=1,extra={}){const e=new window.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{pointerId:id,clientX:x,clientY:y,button:0,isPrimary:true,...extra});node.dispatchEvent(e);}
 return {document,window,node,parent,layer,state,drag,commits,event,get reads(){return reads;},setSnap:v=>snap=v};
}
test('one-click rotated visual layout box keeps units anchors and size unchanged',()=>{
 const f=fixture({item:{side:'right',vertical:'bottom',offsetUnit:'percent'},own:'rotate(30deg)'});
 assert.equal(f.drag.align('right'),true);assert.deepEqual(f.commits,[{x:-35,y:20}]);assert.equal(f.layer.width,40);assert.equal(f.layer.offsetUnit,'percent');
 f.drag.align('bottom');assert.deepEqual(f.commits[1],{x:30,y:-30});f.drag.reset();
});
test('scaled canvas conversion and out-of-range alignment disable instead of clamping',()=>{
 const f=fixture({target:{canvasScale:2,maxSize:4000},regionRect:rect(0,0,400,200),boxRect:rect(60,40,80,60)});
 f.drag.align('left');assert.deepEqual(f.commits[0],{x:0,y:20});
 const g=fixture({item:{x:599},regionRect:rect(0,0,1000,100)});assert.equal(g.drag.alignmentAvailability().right,false);assert.equal(g.drag.align('right'),false);assert.equal(g.commits.length,0);f.drag.reset();g.drag.reset();
});
test('single drag caches geometry, snaps only within screen six px, commits once',()=>{
 const f=fixture();f.event('pointerdown');const reads=f.reads;f.event('pointermove',-25,0);assert.equal(f.node.style.left,'0px');assert.equal(f.reads,reads,'move does not read geometry');assert.ok(f.document.querySelector('[data-otl-alignment-guides]'));
 const guide=f.document.querySelector('[data-otl-alignment-guides]');f.event('pointermove',-26,0);assert.equal(f.document.querySelector('[data-otl-alignment-guides]'),guide,'same line keeps owned DOM');
 f.event('pointerup',-26,0);assert.deepEqual(f.commits,[{x:0,y:20}]);assert.equal(f.document.querySelector('[data-otl-alignment-guides]'),null);f.drag.reset();
});
test('disabled snapping, clamp unreachable targets, and parent rotation safely stay free',()=>{
 const f=fixture();f.setSnap(false);f.event('pointerdown');f.event('pointermove',-25,0);assert.equal(f.node.style.left,'5px');assert.equal(f.document.querySelector('[data-otl-alignment-guides]'),null);f.drag.cancel();
 const g=fixture({matrix:'rotate(30deg)'});assert.ok(Object.values(g.drag.alignmentAvailability()).every(v=>!v));g.event('pointerdown');g.event('pointermove',-25,0);assert.equal(g.document.querySelector('[data-otl-alignment-guides]'),null);
 const h=fixture({item:{x:-300},boxRect:rect(5,20,40,30)});h.event('pointerdown');h.event('pointermove',-5,0);assert.equal(h.document.querySelector('[data-otl-alignment-guides]'),null,'clamp cannot pretend to reach left line');
 for(const v of [f,g,h])v.drag.reset();
});
test('cancel lifecycle zero commits and pinch has no guides',()=>{
 for(const action of ['pointercancel','lostpointercapture','Escape','scroll','resize','blur']){
  const f=fixture();f.event('pointerdown');f.event('pointermove',-25,0);assert.ok(f.document.querySelector('[data-otl-alignment-guides]'));
  if(action==='Escape')f.event('keydown',0,0,1,{key:'Escape'});else if(['resize','blur'].includes(action))f.window.dispatchEvent(new f.window.Event(action));else f.event(action);
  assert.equal(f.drag.dragging,false,action);assert.equal(f.commits.length,0);assert.equal(f.document.querySelector('[data-otl-alignment-guides]'),null);f.drag.reset();
 }
 const f=fixture();f.event('pointerdown');f.event('pointermove',-25,0);f.event('pointerdown',50,0,2);assert.equal(f.document.querySelector('[data-otl-alignment-guides]'),null);f.drag.reset();
});
test('UI sits after the selected item position, not a later unrelated position',()=>{
 const f=fixture(),container=f.document.createElement('div');f.document.body.append(container);
 for(const item of [f.layer,{}]){const y=f.document.createElement('label');y.dataset.positionControl='y';y._otlPositionTarget=item;container.append(y);}
 renderAlignmentControls({container,document:f.document,drag:f.drag,getSnap:()=>true,setSnap:()=>{}});
 const controls=container.querySelector('[data-alignment-controls]');assert.equal(controls.previousElementSibling,container.firstElementChild);assert.equal(controls.querySelectorAll('button').length,6);f.drag.reset();
});
test('same layer across 32 messages uses matching identity and last pointer message only',()=>{
 let selectedActor='ai';const f=fixture({candidate:n=>n.dataset.actor===selectedActor});f.node.dataset.actor='ai';
 for(let i=0;i<31;i++){const parent=f.parent.cloneNode(true),node=parent.querySelector('img');node.dataset.actor=i%2?'ai':'user';parent.getBoundingClientRect=()=>rect(0,200+i*100,200,100);node.getBoundingClientRect=()=>rect(30,220+i*100,40,30);Object.assign(parent,{clientWidth:200,clientHeight:100});f.parent.parentElement.append(parent);}
 f.drag.refresh();const chosen=f.parent.parentElement.lastElementChild.querySelector('img');chosen.dataset.actor='ai';chosen.getBoundingClientRect=()=>rect(30,3270,40,30);chosen.parentElement.getBoundingClientRect=()=>rect(0,3200,200,100);
 for(const type of ['pointerdown','pointerup']){const e=new f.window.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{pointerId:1,clientX:0,clientY:0,button:0,isPrimary:true});chosen.dispatchEvent(e);}
 f.drag.align('top');assert.deepEqual(f.commits[0],{x:30,y:-50});assert.equal(f.commits.length,1);
 selectedActor='absent';assert.equal(f.drag.align('left'),false);assert.equal(f.drag.selectedItem(),null);f.drag.reset();
});
test('text geometry keeps percent x and pixel y, preserves original anchor',()=>{
 const {document,window}=parseHTML('<html><body><div id="r"><span data-text-item="quote">Text</span></div></body></html>');const node=document.querySelector('span'),parent=node.parentElement,item={x:10,y:20,anchor:'center'};window.getComputedStyle=()=>({transform:'none',zoom:'1'});parent.getBoundingClientRect=()=>region;node.getBoundingClientRect=()=>box;Object.assign(parent,{clientWidth:200,clientHeight:100});
 const commits=[],drag=createLayerDrag({document,selector:'[data-text-item]',getState:()=>({active:true,mode:'edit',page:'chat'}),getTextTarget:()=>({item,selected:true,parent,width:200}),getAlignmentRegion:()=>parent,onCommit:(_,next)=>commits.push(next)});drag.refresh();drag.align('centerX');drag.align('bottom');assert.deepEqual(commits,[{x:35,y:20},{x:10,y:70}]);assert.equal(item.anchor,'center');drag.reset();
});
test('legacy metadata UI materializes only on alignment after undo snapshot, retaining legacy source',()=>{
 const {document,window}=parseHTML('<html><body><div id="r"><span data-text-item="name">Name</span></div><section></section></body></html>');window.getComputedStyle=()=>({transform:'none',zoom:'1'});
 const node=document.querySelector('span'),parent=node.parentElement,source={x:0,y:0},effective={x:20,y:10,region:'header'},config={legacy:source,metadata:null},history=[];
 parent.getBoundingClientRect=()=>region;node.getBoundingClientRect=()=>box;Object.assign(parent,{clientWidth:200,clientHeight:100});
 const drag=createLayerDrag({document,selector:'[data-text-item]',getState:()=>({active:true,mode:'edit',page:'chat'}),getTextTarget:()=>({item:config.metadata||source,selected:true,parent,width:200}),getAlignmentRegion:()=>parent,onCommit:(item,next,beforeCommit)=>{history.push(structuredClone(config));beforeCommit?.();Object.assign(item,next);}});drag.refresh();
 const container=document.querySelector('section'),y=document.createElement('label');y.dataset.positionControl='y';y._otlPositionTarget=effective;y._otlPositionSource=source;y._otlPositionBeforeApply=()=>{config.metadata=effective;};container.append(y);
 renderAlignmentControls({container,document,drag,getSnap:()=>true,setSnap:()=>{}});assert.equal(config.metadata,null,'merely opening UI preserves old config');
 container.querySelector('[data-align="left"]').click();assert.deepEqual(config.metadata,{x:5,y:10,region:'header'});assert.deepEqual(config.legacy,{x:0,y:0});assert.equal(history.length,1);assert.equal(history[0].metadata,null,'undo snapshot is before materialization');container.querySelector('[data-align="right"]').click();assert.equal(history.length,1,'stale bridge cannot apply to a newly materialized target');drag.reset();
});
