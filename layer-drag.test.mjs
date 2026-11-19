import {test} from 'node:test';import assert from 'node:assert/strict';import {parseHTML} from 'linkedom';import {dragPosition,createLayerDrag} from './layer-drag.mjs';
const layer={id:'a',x:10,y:20,side:'left',vertical:'top',offsetUnit:'px',visible:true};
test('drag coordinates preserve anchors, percentages, rotated scaled parents and bounds',()=>{
 assert.deepEqual(dragPosition(layer,20,40,200,400),{x:30,y:60});
 assert.deepEqual(dragPosition({...layer,side:'right',vertical:'bottom',offsetUnit:'percent'},20,40,200,400),{x:0,y:10});
 assert.deepEqual(dragPosition(layer,-40,20,200,400,[0,2,-2,0]),{x:20,y:40});
 assert.equal(dragPosition(layer,1,1,2,2,[0,0,0,0]),null);
 assert.equal(dragPosition({...layer,offsetUnit:'percent'},1,1,0,0),null);
 assert.deepEqual(dragPosition(layer,900,-900,1,1),{x:600,y:-300});
});
test('only selected fixture decoration drags; release commits once and cancellation changes no config',()=>{
 const {document,window}=parseHTML('<html><body><div data-orange-lab-fixture="message"><div><img data-layer-id="a"></div></div><img id="real" data-layer-id="a"></body></html>');window.getComputedStyle=()=>({transform:'none',zoom:'1'});const node=document.querySelector('[data-orange-lab-fixture] img');node.style.left='10px';node.style.top='20px';const state={active:true,page:'chat',mode:'edit',region:'header',kind:'image',object:'a',layers:[layer],regionFor:()=> 'header'},commits=[];const drag=createLayerDrag({document,getState:()=>state,onCommit:(l,p)=>commits.push(p)});drag.refresh();assert.equal(node.style.touchAction,'none');assert.equal(document.querySelector('#real').dataset.layerDraggable,undefined);
 function event(type,target,x=0,y=0,id=1){const e=new window.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{pointerId:id,clientX:x,clientY:y,button:0,isPrimary:true});target.dispatchEvent(e);}
 event('pointerdown',node);event('pointermove',node,30,40);assert.equal(node.style.left,'40px');assert.equal(layer.x,10);event('pointerup',node,30,40);assert.deepEqual(commits,[{x:40,y:60}]);assert.equal(node.style.left,'10px');
 event('pointerdown',node);event('pointermove',node,70,80);event('pointercancel',node);assert.equal(commits.length,1);assert.equal(node.style.left,'10px');
 event('pointerdown',node);event('pointermove',node,70,80);event('pointerdown',node,0,0,2);assert.equal(drag.dragging,true);event('pointercancel',node,0,0,2);assert.equal(drag.dragging,false);assert.equal(commits.length,1);
 event('pointerdown',node);event('pointermove',node,70,80);node.remove();event('pointerup',document,70,80);assert.equal(commits.length,1);document.querySelector('[data-orange-lab-fixture] div').append(node);
 event('pointerdown',node);event('pointermove',node,70,80);state.object='other';event('pointerup',node,70,80);assert.equal(commits.length,1);
 state.object='other';drag.refresh();assert.equal(node.style.touchAction,'auto');event('pointerdown',node);event('pointermove',node,70,80);event('pointerup',node);assert.equal(commits.length,1);
 state.region='body';drag.refresh();assert.equal(node.style.pointerEvents,'auto');assert.equal(node.style.touchAction,'auto');
});
test('removed native message subtrees release editor markers before host reuse',async()=>{
 const {document,window}=parseHTML('<html><body><div id="chat"><div class="mes"><span class="name_text" style="color:red">Native</span></div></div></body></html>');
 const name=document.querySelector('.name_text'),msg=name.parentNode,state={active:true,page:'chat',mode:'edit'},item={x:0,y:0};
 const drag=createLayerDrag({document,selector:'.mes .name_text',scopeSelector:'.mes',getState:()=>state,getTextTarget:()=>({item,selected:true}),onCommit:()=>{}});
 drag.refresh();assert.equal(name.dataset.previewDraggable,'true');msg.remove();await new Promise(r=>setImmediate(r));
 assert.equal(name.hasAttribute('data-preview-draggable'),false);assert.equal(name.style.color,'red');assert.ok(!name.style.getPropertyValue('touch-action'));
 name.style.touchAction='pan-x';drag.reset();assert.equal(name.style.touchAction,'pan-x','released nodes are no longer restored by closing the editor');
 document.querySelector('#chat').append(msg);drag.refresh();assert.equal(name.style.touchAction,'none');drag.reset();assert.equal(name.style.touchAction,'pan-x');
});

test('page scene target resolver commits only the active page and cancels when it changes',()=>{
 const {document,window}=parseHTML('<html><body><div data-scene><img data-header-image></div></body></html>');window.getComputedStyle=()=>({transform:'none',zoom:'1'});const node=document.querySelector('img'),item={...layer},state={active:true,page:'settings',mode:'edit'},commits=[];
 const drag=createLayerDrag({document,selector:'[data-header-image]',scopeSelector:'[data-scene]',getState:()=>state,resolveTarget:()=>state.page==='settings'?{item,image:true,selected:true,width:200,height:200}:null,onCommit:(_,next)=>commits.push(next)});drag.refresh();
 const event=(type,x,y)=>{const e=new window.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{pointerId:1,clientX:x,clientY:y,button:0,isPrimary:true});node.dispatchEvent(e);};
 event('pointerdown',0,0);event('pointermove',20,30);event('pointerup',20,30);assert.deepEqual(commits,[{x:30,y:50}]);event('pointerdown',0,0);event('pointermove',20,30);state.page='worldbook';drag.refresh();assert.equal(drag.dragging,false);event('pointerup',20,30);assert.equal(commits.length,1);drag.reset();assert.equal(node.hasAttribute('data-preview-draggable'),false);
});


test('height-driven image pinch rebases actual dimensions when fingers leave and rejoin',async()=>{
 const {newLayer}=await import('./layers.mjs');const item=newLayer('custom',{id:'a',width:90,imageSizing:{mode:'manual',fit:'contain',height:200,heightUnit:'px',lockRatio:true,ratio:2,driver:'height',focalX:50,focalY:50}});
 const {document,window}=parseHTML('<html><body><div data-orange-lab-fixture><div><img data-layer-id="a"></div></div></body></html>');window.getComputedStyle=()=>({transform:'none',zoom:'1'});const n=document.querySelector('img');Object.assign(n,{offsetWidth:400,offsetHeight:200});Object.defineProperties(n.parentElement,{clientWidth:{value:600},clientHeight:{value:400}});
 const commits=[],drag=createLayerDrag({document,getState:()=>({active:true,page:'chat',mode:'edit',region:'header',kind:'image',object:'a',layers:[item],regionFor:()=> 'header'}),onCommit:(_,v)=>commits.push(v)});drag.refresh();
 const event=(type,x,id)=>{const e=new window.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{pointerId:id,clientX:x,clientY:0,button:0,isPrimary:true});n.dispatchEvent(e);};
 event('pointerdown',0,1);event('pointerdown',100,2);event('pointermove',110,2);assert.ok(Math.abs(parseFloat(n.style.width)-440)<.001);event('pointerup',110,2);event('pointerdown',110,2);event('pointermove',121,2);assert.ok(Math.abs(parseFloat(n.style.width)-484)<.001);event('pointerup',121,2);event('pointerup',0,1);assert.equal(commits.length,1);assert.ok(Math.abs(commits[0].width-484)<.001);assert.equal(item.width,90);drag.reset();
});


test('design canvas pinch projects live size once while committing unscaled pixels beyond legacy limits',async()=>{
 const {newLayer}=await import('./layers.mjs');const item=newLayer('custom',{id:'a',width:600,x:0,y:0,imageSizing:{mode:'manual',fit:'contain',height:600,heightUnit:'px',lockRatio:true,ratio:1,driver:'width',focalX:50,focalY:50}});
 const {document,window}=parseHTML('<html><body><div data-orange-lab-fixture><div><img data-layer-id="a"></div></div></body></html>');window.getComputedStyle=()=>({transform:'none',zoom:'1'});const n=document.querySelector('img');Object.assign(n,{offsetWidth:1000,offsetHeight:1000});Object.defineProperties(n.parentElement,{clientWidth:{value:1000},clientHeight:{value:500}});
 const commits=[],drag=createLayerDrag({document,getState:()=>({active:true,page:'chat',mode:'edit',region:'header',kind:'image',object:'a',layers:[item],regionFor:()=> 'header'}),getLayerTarget:()=>({canvasScale:5/3,maxSize:4000}),onCommit:(_,v)=>commits.push(v)});drag.refresh();
 const event=(type,x,id)=>{const e=new window.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{pointerId:id,clientX:x,clientY:0,button:0,isPrimary:true});n.dispatchEvent(e);};
 event('pointerdown',0,1);event('pointerdown',100,2);event('pointermove',120,2);assert.ok(Math.abs(parseFloat(n.style.width)-1200)<1e-6);event('pointerup',120,2);event('pointerup',0,1);assert.equal(commits.length,1);assert.ok(Math.abs(commits[0].width-720)<1e-6);assert.equal(item.width,600);drag.reset();
});
