import test from 'node:test';
import assert from 'node:assert/strict';
import {createSchemeModel} from './scheme-model.mjs';
import {enableHeaderCanvas,projectHeaderConfig,headerCanvasScale,validateHeaderCanvas} from './header-canvas.mjs';
import {newLayer} from './layers.mjs';
import {captureCombination,applyCombination} from './region-combinations.mjs';
import {itemPoint,sceneGeometry,newSceneCaption,resetSceneLayout} from './text-scene.mjs';
const model=createSchemeModel();
test('new protocol retains design pixels and immutable source through 400/600/1000 projections',()=>{
 const original=structuredClone(model.templates.spring),before=JSON.stringify(original),c=enableHeaderCanvas(original,600);
 assert.equal(JSON.stringify(original),before);c.headerHeight=300;c.captions[0].x=340;c.captions[0].width=220;
 c.layers=[newLayer('asset',{asset:'shared-spring-flower-stem',width:600,x:160,y:30,side:'left'})];
 delete c.regionOrder;const saved=model.validate(c);assert.equal(saved.version,11);assert.equal(saved.captions[0].x,340);assert.equal(saved.layers[0].width,600);
 for(const width of [400,600,1000,600]){const r=projectHeaderConfig(saved,width),s=headerCanvasScale(saved,width),inner=width-r.cardPadding*2;
  assert.equal(r.headerHeight,300*s);assert.ok(Math.abs(itemPoint(r,r.captions[0],inner).x/s-340)<1e-8);assert.equal(r.layers[0].width/s,600);
  assert.ok(Math.abs(r.cardPadding/s-saved.cardPadding)<1e-8);assert.equal(r.commonStyle,saved.commonStyle);assert.equal(r.footerCaptions,saved.footerCaptions);
 }
 assert.deepEqual(model.validate(JSON.parse(JSON.stringify(saved))),saved);
});
test('missing canvas and old protocol with new canvas reject; legacy normalization stays version10',()=>{
 assert.throws(()=>model.validate({...model.templates.blank,version:11}),/画布/);
 assert.throws(()=>model.validate({...model.templates.blank,headerCanvas:{width:600}}),/画布/);
 assert.throws(()=>validateHeaderCanvas({version:11,headerCanvas:{width:0}}));
 assert.equal(model.validate(model.templates.blank).version,10);
});
test('metadata body anchors remain responsive while header uses design pixels',()=>{
 const c=enableHeaderCanvas(model.templates.spring);c.metadata.roles.ai.name.region='body-top';c.metadata.roles.ai.name.x=20;c.metadata.roles.ai.time.x=300;
 const r=projectHeaderConfig(c,1000);assert.equal(r.metadata.roles.ai.name.x,20);assert.equal(r.metadata.roles.ai.name.style.size,c.metadata.roles.ai.name.style.size);
 assert.ok(Math.abs(r.metadata.roles.ai.time.x-300/(600-c.cardPadding*2)*100)<1e-8);
 assert.equal(newSceneCaption(c).x,c.textItems.name.x);
});
test('header combination carries and replaces the coordinate protocol explicitly',()=>{
 const c=enableHeaderCanvas(model.templates.spring),old=model.templates.blank;
 const applied=model.validate(applyCombination(old,captureCombination(c,'header')));assert.equal(applied.version,11);assert.equal(applied.headerCanvas.width,600);
 const removed=model.validate(applyCombination(c,captureCombination(old,'header')));assert.equal(removed.version,10);assert.equal(removed.headerCanvas,undefined);
});
test('fill shares the same full design rectangle at every display size',()=>{
 const c=enableHeaderCanvas(model.templates.blank);c.headerHeight=300;c.avatarFill.ai.enabled=true;
 for(const width of [400,600,1000]){const r=projectHeaderConfig(c,width),s=width/600,g=sceneGeometry(r,width-r.cardPadding*2,r.photos.ai);assert.ok(Math.abs(g.photoWidth-width)<1e-8);assert.equal(g.photoHeight,300*s);}
});


test('layout reseeding never converts saved pixel widths or sizes a second time',()=>{const c=enableHeaderCanvas(model.templates.spring);c.captions[0].width=220;const w=c.metadata.roles.ai.name.width;const next=resetSceneLayout(c,'left');assert.equal(next.captions[0].width,220);assert.equal(next.metadata.roles.ai.name.width,w);assert.equal(next.photos.ai.size,c.photos.ai.size);assert.ok(next.textItems.name.x<600);assert.equal(next.metadata.roles.ai.name.x,next.textItems.name.x);model.validate(next);});

test('per-floor projection copies mutable geometry without cloning embedded media',()=>{
 const c=enableHeaderCanvas(model.templates.blank),image='data:image/png;base64,'+'A'.repeat(1024*1024);
 c.photos.ai.image=image;c.photos.user.image=image;
 const layer=newLayer('asset',{asset:'shared-spring-flower-stem',anchor:'header',image,width:300,imageSizing:{mode:'manual',fit:'contain',height:120,heightUnit:'px',lockRatio:false,ratio:2.5,driver:'width',focalX:50,focalY:50}});
 c.layers=[layer];const before=structuredClone(c),clone=globalThis.structuredClone,inputs=[];
 let projected;
 try{globalThis.structuredClone=value=>{inputs.push(value);return clone(value);};projected=projectHeaderConfig(c,1000);}finally{globalThis.structuredClone=clone;}
 assert.ok(!inputs.includes(c.photos));assert.ok(!inputs.includes(layer));
 assert.equal(projected.photos.ai.image,image);assert.equal(projected.layers[0].image,image);
 assert.notEqual(projected.photos.ai,c.photos.ai);assert.notEqual(projected.layers[0],layer);assert.notEqual(projected.layers[0].imageSizing,layer.imageSizing);
 assert.equal(projected.layers[0].width,500);assert.equal(projected.layers[0].imageSizing.height,200);
 projected.photos.ai.x=999;projected.layers[0].imageSizing.height=999;
 assert.deepEqual(c,before);
});
