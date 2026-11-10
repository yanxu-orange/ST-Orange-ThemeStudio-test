import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {createLayerDrag,textDragPosition,pinchLayer} from './layer-drag.mjs';
const base={id:'a',x:10,y:20,width:100,widthUnit:'px',offsetUnit:'px',side:'left',vertical:'top',heightPercent:0,visible:true};
function setup(text=false,options={}){
 const {document,window}=parseHTML('<html><body><div data-orange-lab-fixture="message"><div id="frame"><img data-layer-id="a"><span data-text-item="name">Name</span></div></div><img id="real" data-layer-id="a"></body></html>');window.getComputedStyle=()=>({transform:'none',zoom:'1'});
 const node=document.querySelector(text?'span':'img'),frame=document.querySelector('#frame');Object.assign(frame,{clientWidth:200,clientHeight:400});Object.assign(node,{clientWidth:100,clientHeight:50});node.style.left='10px';node.style.top='20px';node.style.width='100px';
 const item={...base},textItem={x:10,y:20},state={active:true,page:'chat',mode:'edit',region:'header',kind:text?'text':'image',object:text?'name':'a',layers:[item],regionFor:()=> 'header'},commits=[];
 const drag=createLayerDrag({...options,document,getState:()=>state,getTextTarget:()=>({item:textItem,width:200,parent:frame,selected:state.kind==='text'&&state.object==='name'}),onCommit:(item,next)=>commits.push({item,next})});drag.refresh();
 const event=(type,target=node,x=0,y=0,id=1)=>{const e=new window.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{pointerId:id,clientX:x,clientY:y,button:0,isPrimary:id===1});target.dispatchEvent(e);return e;};
 return {document,window,node,frame,item,textItem,state,commits,drag,event};
}
test('pinch geometry preserves center for anchors, units, parent transforms and constrained dimensions',()=>{
 assert.deepEqual(pinchLayer(base,2,0,0,200,400,100,50),{x:-40,y:-5,width:200});
 assert.deepEqual(pinchLayer({...base,side:'right',vertical:'bottom'},2,0,0,200,400,100,50),{x:-40,y:-5,width:200});
 assert.deepEqual(pinchLayer({...base,width:50,widthUnit:'percent',offsetUnit:'percent'},2,20,40,200,400,100,50),{x:-5,y:23.75,width:100});
 assert.deepEqual(pinchLayer(base,2,-40,20,200,400,100,50,[0,2,-2,0]),{x:-30,y:15,width:200});
 assert.equal(pinchLayer(base,0,0,0,1,1,1,1),null);assert.equal(pinchLayer(base,2,0,0,1,1,0,1),null);
 assert.deepEqual(pinchLayer({...base,heightPercent:80},2,0,0,200,400,100,50),{x:-2.5,y:13.75,width:125,heightPercent:100});
 assert.equal(pinchLayer(base,99,0,0,200,400,100,50).width,500);assert.equal(pinchLayer(base,.0001,0,0,200,400,100,50).width,1);
});
test('text movement uses percent X and pixel Y, respects model bounds and supports pixel reasoning label',()=>{
 assert.deepEqual(textDragPosition({x:10,y:20},20,30,200),{x:20,y:50});
 assert.deepEqual(textDragPosition({x:10,y:20},-60,40,200,[0,2,-2,0]),{x:20,y:50});
 assert.deepEqual(textDragPosition({x:10,y:20},9999,-9999,200),{x:200,y:-400});assert.equal(textDragPosition({x:0,y:0},1,1,0),null);
 assert.deepEqual(textDragPosition({x:10,y:20},20,30,0,undefined,{percentX:false,minX:-500,maxX:500,minY:-500,maxY:500}),{x:30,y:50});
});
test('drag then pinch then remaining finger continue smoothly and commit once on final release',()=>{
 const {node,item,commits,drag,event}=setup();
 event('pointerdown',node,0,0);event('pointermove',node,10,10);event('pointerdown',node,110,10,2);event('pointermove',node,210,10,2);
 assert.equal(node.style.width,'200px');assert.equal(commits.length,0);assert.equal(item.width,100);
 event('pointerup',node,210,10,2);assert.equal(drag.dragging,true);assert.equal(commits.length,0);
 event('pointermove',node,20,20);event('pointerup',node,20,20);assert.equal(drag.dragging,false);assert.equal(commits.length,1);
 assert.deepEqual(commits[0].next,{x:30,y:15,width:200});assert.equal(node.style.width,'100px');
 assert.equal(event('click',node).defaultPrevented,true);
});
test('third finger, selection changes, capture loss and blur cancel pinch without committing',()=>{
 for(const end of ['third','selection','capture','blur','cancel']){
  const {node,window,state,commits,drag,event}=setup();event('pointerdown',node,0,0);event('pointerdown',node,100,0,2);event('pointermove',node,200,0,2);assert.equal(node.style.width,'200px');
  if(end==='third')event('pointerdown',node,100,0,3);if(end==='selection'){state.object='other';drag.refresh();}if(end==='capture')event('lostpointercapture',node,0,0,2);if(end==='blur')window.dispatchEvent(new window.Event('blur'));if(end==='cancel')event('pointercancel',node,0,0,2);
  assert.equal(drag.dragging,false,end);assert.equal(node.style.width,'100px',end);assert.equal(commits.length,0,end);
 }
});
test('unselected content and real messages do not consume movement; unrelated cancellation is ignored',()=>{
 const {node,document,state,commits,drag,event}=setup();state.kind='region';drag.refresh();assert.equal(node.style.touchAction,'auto');assert.equal(node.style.pointerEvents,'auto');
 event('pointerdown');assert.equal(event('pointermove',node,10,20).defaultPrevented,false);event('pointerup');assert.equal(commits.length,0);
 event('pointerdown',document.querySelector('#real'));assert.equal(drag.dragging,false);
 state.kind='image';drag.refresh();event('pointerdown');event('pointermove',node,10,20);event('pointercancel',document,0,0,9);assert.equal(drag.dragging,true);event('pointerup',node,10,20);assert.equal(commits.length,1);
});
test('text gestures translate only preview and store one bounded position; second pointer cancels',()=>{
 const {node,textItem,commits,event}=setup(true);event('pointerdown');event('pointermove',node,20,30);assert.equal(node.style.translate,'20px 30px');assert.deepEqual(textItem,{x:10,y:20});event('pointerup',node,20,30);assert.equal(commits.length,1);assert.deepEqual(commits[0].next,{x:20,y:50});assert.equal(node.style.translate,'');
 event('pointerdown');event('pointermove',node,40,60);event('pointerdown',node,100,0,2);assert.equal(node.style.translate,'');assert.equal(commits.length,1);
});
test('footer pinch recomputes dynamic parent height once and preserves center for top/bottom and percent offsets',async()=>{
 const {footerBaseHeight}=await import('./footer.mjs');
 for(const vertical of ['top','bottom'])for(const offsetUnit of ['px','percent']){
  const layer={...base,vertical,offsetUnit,heightPercent:50},image={dataset:{layerId:'a'},naturalWidth:200,naturalHeight:100},heightForWidth=width=>footerBaseHeight(0,200,[{...layer,width}],[image]);
  const oldHeight=heightForWidth(layer.width),oldY=layer.y*(offsetUnit==='percent'?oldHeight/100:1),oldTop=vertical==='bottom'?oldHeight-oldY-25:oldY;
  const next=pinchLayer(layer,2,0,0,200,oldHeight,100,25,undefined,heightForWidth),newHeight=heightForWidth(next.width),newPixelHeight=newHeight*next.heightPercent/100,newY=next.y*(offsetUnit==='percent'?newHeight/100:1),newTop=vertical==='bottom'?newHeight-newY-newPixelHeight:newY;
  assert.equal(next.width,200);assert.equal(next.heightPercent,50);assert.equal(newPixelHeight,50);assert.equal(newTop+newPixelHeight/2,oldTop+12.5);
 }
 const capped=pinchLayer({...base,heightPercent:80},2,0,0,200,200,100,160,undefined,w=>Math.max(200,w/2));assert.ok(Math.abs(capped.width-125)<.0001);assert.ok(capped.heightPercent<=100);
});

test('footer gesture previews pixel height but commits adjusted percentage after a remaining-finger drag',()=>{
 const {node,frame,item,commits,event}=setup(false,{getLayerTarget:()=>({parentHeightForWidth:w=>w/2})});frame.clientHeight=50;node.clientHeight=25;item.heightPercent=50;item.vertical='bottom';item.offsetUnit='percent';node.style.bottom='20%';node.style.height='50%';
 event('pointerdown',node,0,0);event('pointerdown',node,100,0,2);event('pointermove',node,200,0,2);assert.equal(node.style.height,'50px');assert.equal(node.style.bottom,'-5%');
 event('pointerup',node,200,0,2);event('pointermove',node,0,10);event('pointerup',node,0,10);assert.equal(commits.length,1);assert.equal(commits[0].next.width,200);assert.equal(commits[0].next.heightPercent,50);assert.equal(commits[0].next.y,37.5);assert.equal(node.style.height,'50%');assert.equal(node.style.bottom,'20%');
});

test('fractional pinch bounds stay strictly valid for saving after floating-point multiplication',()=>{
 for(let i=0;i<10000;i++){const width=1+(i*49.9)%499,heightPercent=.1+(i*.231)%99.9,next=pinchLayer({...base,width,heightPercent},1e5,0,0,400,400,100,50);assert.ok(next.width>=1&&next.width<=500);assert.ok(next.heightPercent>=0&&next.heightPercent<=100);}
});
