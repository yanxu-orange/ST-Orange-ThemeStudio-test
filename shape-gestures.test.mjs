import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {newLayer,validateLayers} from './layers.mjs';
import {pinchLayer,createLayerDrag} from './layer-drag.mjs';
import {footerBaseHeight} from './footer.mjs';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} ≈ ${b}`);

test('shape pinch scales actual width and height together without changing fill or layer ordering',()=>{
  const layer=newLayer('shape',{width:100,height:40,x:10,y:20,side:'left'});
  const next=pinchLayer(layer,2,0,0,200,400,100,40);
  assert.deepEqual(next,{x:-40,y:0,width:200,height:80});
  assert.deepEqual(validateLayers([{...layer,...next}])[0],{...layer,...next});
  assert.equal(layer.height,40);assert.equal(next.color,undefined);assert.equal(next.z,undefined);
  for(const vertical of ['top','bottom'])for(const side of ['left','right'])for(const offsetUnit of ['px','percent']){
    const current={...layer,side,vertical,offsetUnit},update=pinchLayer(current,1.5,0,0,200,400,100,40);
    const xFactor=offsetUnit==='percent'?2:1,yFactor=offsetUnit==='percent'?4:1;
    close(update.x*xFactor+update.width/2,current.x*xFactor+50);
    close(update.y*yFactor+update.height/2,current.y*yFactor+20);
  }
});

test('shape pinch retains both size bounds at extreme zoom and fractional values',()=>{
  for(const width of [1,2,17.3,100,499.9,500])for(const height of [1,2,17.3,100,499.9,500])for(const ratio of [.00001,1,10000]){
    const layer=newLayer('shape',{width,height}),next=pinchLayer(layer,ratio,0,0,400,400,width,height);
    assert.ok(next.width>=1&&next.width<=500);assert.ok(next.height>=1&&next.height<=500);
    close(next.width/next.height,width/height);assert.doesNotThrow(()=>validateLayers([{...layer,...next}]));
  }
});

test('percent heights and independent width units scale in the actual containing region',()=>{
  const layer=newLayer('shape',{width:50,widthUnit:'percent',height:25,heightUnit:'percent',offsetUnit:'percent',x:10,y:20,side:'left'}),next=pinchLayer(layer,2,0,0,200,400,100,100);
  assert.deepEqual(next,{x:-15,y:7.5,width:100,height:50});
  const capped=pinchLayer({...layer,height:400},2,0,0,200,400,100,1600);close(capped.height,500);close(capped.width,62.5);
});

test('footer shape pinch accounts for explicit candidate height and stable percent reference',()=>{
  for(const heightUnit of ['px','percent'])for(const vertical of ['top','bottom'])for(const offsetUnit of ['px','percent']){
    const layer=newLayer('shape',{id:'shape',anchor:'footer',width:100,height:40,heightUnit,vertical,offsetUnit,x:10,y:20,side:'left'}),image={dataset:{layerId:layer.id}},parentHeight=(width,height=layer.height)=>footerBaseHeight(0,200,[{...layer,width,height}],[image]);
    const originalHeight=parentHeight(layer.width),renderedHeight=heightUnit==='percent'?originalHeight*layer.height/100:layer.height;
    const originalY=layer.y*(offsetUnit==='percent'?originalHeight/100:1),originalTop=vertical==='bottom'?originalHeight-originalY-renderedHeight:originalY;
    const next=pinchLayer(layer,2,0,0,200,originalHeight,100,renderedHeight,undefined,parentHeight),newHeight=parentHeight(next.width,next.height),newRenderedHeight=heightUnit==='percent'?newHeight*next.height/100:next.height,newY=next.y*(offsetUnit==='percent'?newHeight/100:1),newTop=vertical==='bottom'?newHeight-newY-newRenderedHeight:newY;
    assert.equal(next.width,200);assert.equal(next.height,heightUnit==='percent'?40:80);close(newRenderedHeight,renderedHeight*2);close(newTop+newRenderedHeight/2,originalTop+renderedHeight/2);
  }
});

test('shape gesture previews both dimensions, then commits once or restores on cancellation',()=>{
  for(const cancel of [true,false]){
    const {document,window}=parseHTML('<html><body><div data-orange-lab-fixture="message"><div id="frame"><img data-layer-id="shape"></div></div></body></html>');window.getComputedStyle=()=>({transform:'none',zoom:'1'});
    const node=document.querySelector('img'),frame=document.querySelector('#frame'),layer=newLayer('shape',{id:'shape',width:100,height:40,side:'left',x:10,y:20}),commits=[];
    Object.assign(frame,{clientWidth:200,clientHeight:400});Object.assign(node,{clientWidth:100,clientHeight:40});Object.assign(node.style,{width:'100px',height:'40px',left:'10px',top:'20px'});
    const drag=createLayerDrag({document,getState:()=>({active:true,page:'chat',mode:'edit',kind:'image',object:'shape',region:'header',layers:[layer],regionFor:()=> 'header'}),onCommit:(item,next)=>commits.push({item,next})});drag.refresh();const original=node.getAttribute('style');
    const event=(type,x,id=1)=>{const event=new window.Event(type,{bubbles:true,cancelable:true});Object.assign(event,{pointerId:id,clientX:x,clientY:0,button:0,isPrimary:id===1});node.dispatchEvent(event);};
    event('pointerdown',0);event('pointerdown',100,2);event('pointermove',200,2);assert.equal(node.style.width,'200px');assert.equal(node.style.height,'80px');assert.equal(layer.height,40);
    if(cancel)event('pointercancel',200,2);else{event('pointerup',200,2);event('pointerup',0);}
    assert.equal(node.getAttribute('style'),original);assert.equal(commits.length,cancel?0:1);if(!cancel){assert.equal(commits[0].next.width,200);assert.equal(commits[0].next.height,80);}
  }
});
