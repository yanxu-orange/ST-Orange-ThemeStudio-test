import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {newLayer} from './layers.mjs';
import {shapeDataUrl} from './shape-assets.mjs';
import {CHROME_DEFAULTS} from './chrome.mjs';
import {createChromeAdapter} from './chrome-adapter.mjs';
import {createChromePreview} from './chrome-preview.mjs';
import {syncRegionOrder,moveRegionItem,imageKey,regionZ} from './region-layers.mjs';

test('input preview and live render matching shape dimensions, fill, scope and unified ordering',()=>{
  const {document,window}=parseHTML('<html><head></head><body><div id="sheld"><div id="send_form"><textarea id="send_textarea">Native draft</textarea></div></div></body></html>');
  const shape=newLayer('shape',{id:'shape',anchor:'input',shape:'rectangle',fillMode:'gradient',width:240,height:40,rotation:12,side:'left',vertical:'bottom',x:9,y:7,opacity:.6});
  const bitmap=newLayer('custom',{id:'image',anchor:'input',image:'data:image/png;base64,YQ==',width:33,heightPercent:20,z:20});
  const hidden=newLayer('shape',{id:'hidden',anchor:'input',visible:false});
  let c=syncRegionOrder({font:'serif',layers:[shape,bitmap,hidden],chromeStyle:structuredClone(CHROME_DEFAULTS)});c.chromeStyle.input.enabled=true;c=moveRegionItem(c,'input',imageKey(shape.id),'top');
  const resolveArtwork=layer=>layer.kind==='shape'?shapeDataUrl(layer):layer.image,picks=[];
  const preview=createChromePreview({document,ui:{page:'chat',previewMode:'page',demoState:'normal'},resolveArtwork,onPick:(...args)=>picks.push(args)}),live=createChromeAdapter({document,resolveArtwork});
  preview.update(c);live.update(c);
  const shapeNodes=()=>[document.querySelector('.otl-page-input [data-layer-id="shape"]'),document.querySelector('#send_form [data-layer-id="shape"]')];
  for(const node of shapeNodes()){
    assert.ok(node);assert.equal(node.getAttribute('src'),shapeDataUrl(shape));assert.equal(node.style.width,'240px');assert.equal(node.style.height,'40px');assert.equal(node.style.objectFit,'fill');assert.equal(node.style.left,'9px');assert.equal(node.style.bottom,'7px');assert.equal(node.style.transform,'rotate(12deg)');assert.equal(Number(node.style.zIndex),regionZ(c,'input',imageKey(shape.id)));
  }
  for(const selector of ['.otl-page-input','#send_form']){
    const bitmapNode=document.querySelector(selector+' [data-layer-id="image"]');assert.equal(bitmapNode.style.objectFit,'contain');assert.equal(bitmapNode.style.width,'33px');assert.equal(bitmapNode.style.height,'20%');assert.equal(document.querySelector(selector+' [data-layer-id="hidden"]'),null);
  }
  shapeNodes()[0].dispatchEvent(new window.Event('click',{bubbles:true}));assert.deepEqual(picks,[['input','image','shape']]);
  shape.height=50;shape.heightUnit='percent';shape.color='#123456';shape.gradientAngle=270;c=moveRegionItem(c,'input',imageKey(shape.id),'bottom');preview.update(c);live.update(c);
  for(const node of shapeNodes()){assert.equal(node.style.height,'50%');assert.equal(node.getAttribute('src'),shapeDataUrl(shape));assert.equal(Number(node.style.zIndex),1);}
  preview.close();live.stop();assert.equal(document.querySelector('[data-layer-id]'),null);assert.equal(document.querySelector('#send_textarea').value,'Native draft');
});
