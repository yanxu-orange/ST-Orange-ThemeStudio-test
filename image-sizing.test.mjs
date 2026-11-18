import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newLayer,validateLayers} from './layers.mjs';
import {imageSizeStyle,imageDimensions,editImageSize,coverImage} from './image-sizing.mjs';
import {layerSizeStyle} from './shape-assets.mjs';
import {pinchLayer} from './layer-drag.mjs';
import {footerBaseHeight} from './footer.mjs';
const region={width:400,height:200,ratio:2};
const fresh=()=>newLayer('custom',{width:100,side:'right',vertical:'bottom'});
test('old layer absence retains original contain dimensions and edge alignment',()=>{
 const l=fresh();l.heightPercent=80;const r=validateLayers([l])[0];assert.equal(r.imageSizing,undefined);assert.deepEqual(layerSizeStyle(r),{width:'100px',height:'80%',objectFit:'contain',aspectRatio:'auto',objectPosition:'right bottom'});
 const n=editImageSize(l,'widthUnit','percent',region);assert.equal(n.width,25);assert.deepEqual(imageDimensions(n,region),{width:100,height:160});assert.equal(n.imageSizing.fit,'contain');assert.equal(n.imageSizing.focalX,100);assert.equal(n.imageSizing.focalY,100);
});
test('locked driver remains proportional after region resize and axis changes',()=>{
 let l=editImageSize(fresh(),'widthUnit','percent',region);l=editImageSize(l,'width',50,region);
 assert.deepEqual(imageDimensions(l,region),{width:200,height:100});assert.deepEqual(imageDimensions(l,{...region,width:800,height:300}),{width:400,height:200});
 l=editImageSize(l,'heightUnit','percent',region);l=editImageSize(l,'height',50,region);
 assert.equal(l.imageSizing.driver,'height');assert.deepEqual(imageDimensions(l,{...region,width:800,height:300}),{width:300,height:150});assert.equal(imageSizeStyle(l).width,'auto');assert.deepEqual(layerSizeStyle(l),imageSizeStyle(l),'shared renderer must use the new image contract');
});
test('cover focal survives; manual size retains crop, unlocking is explicit distortion',()=>{
 let l=coverImage(fresh(),region);l=editImageSize(l,'focalX',20,region);assert.equal(l.imageSizing.mode,'cover');assert.equal(l.imageSizing.focalX,20);
 l=editImageSize(l,'width',50,region);assert.equal(l.imageSizing.mode,'manual');assert.equal(l.imageSizing.fit,'cover');assert.deepEqual(imageDimensions(l,region),{width:200,height:100});assert.equal(imageSizeStyle(l).objectFit,'cover');
 l=editImageSize(l,'lockRatio',false,region);assert.equal(l.imageSizing.fit,'fill');l=editImageSize(l,'height',80,region);assert.deepEqual(imageDimensions(l,region),{width:200,height:160});
 assert.deepEqual(validateLayers([JSON.parse(JSON.stringify(l))])[0].imageSizing,l.imageSizing);
});
test('missing measurements and invalid values do not mutate old layer; shapes reject image state',()=>{
 const l=fresh(),before=structuredClone(l);assert.throws(()=>editImageSize(l,'widthUnit','percent',{...region,height:0}));assert.throws(()=>editImageSize(l,'width',0,region));assert.deepEqual(l,before);
 const n=coverImage(l,region);assert.throws(()=>validateLayers([{...newLayer('shape'),imageSizing:n.imageSizing}]));
});
test('pinch preserves locked image ratio and records second dimension',()=>{
 const l=editImageSize(fresh(),'width',100,region),n=pinchLayer(l,2,0,0,400,200,100,50);assert.equal(n.width,200);assert.equal(n.imageSizing.height,100);assert.equal(n.imageSizing.driver,'width');
});
test('footer fixed height is measured while percent baseline is nonrecursive',()=>{
 let l=editImageSize(fresh(),'lockRatio',false,region);l=editImageSize(l,'height',150,region);const image={dataset:{layerId:l.id},naturalWidth:200,naturalHeight:100};assert.equal(footerBaseHeight(20,400,[l],[image]),150);
 l=coverImage({...l,anchor:'footer'}, {...region,height:100});assert.equal(footerBaseHeight(20,400,[l],[image]),100);image.naturalWidth=387;image.naturalHeight=800;assert.equal(footerBaseHeight(20,400,[l],[image]),100,'cover preserves existing footer region rather than natural full-width height');
});

test('cover explicitly relocks a formerly distorted image',()=>{const region={width:400,height:100,ratio:2};const old=newLayer('custom',{width:100});const unlocked=editImageSize(old,'lockRatio',false,region);const next=coverImage(unlocked,region);assert.equal(next.imageSizing.lockRatio,true);assert.equal(next.imageSizing.driver,'width');assert.equal(next.imageSizing.ratio,4);assert.equal(next.imageSizing.fit,'cover');});
