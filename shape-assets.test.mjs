import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DOMParser} from 'linkedom';
import {newLayer,validateLayers,KINDS,clone} from './layers.mjs';
import {ASSETS} from './catalog.mjs';
import {SHAPES,SHAPE_KEYS,SHAPE_DEFAULTS,validateShapeSettings,shapeSvg,shapeDataUrl,gradientVector,layerSizeStyle} from './shape-assets.mjs';
const documentFor=layer=>new DOMParser().parseFromString(shapeSvg(layer),'image/svg+xml');

test('new shapes have independent fill and geometry while sharing standard layer placement',()=>{
  for(const shape of SHAPES){
    const layer=newLayer('shape',{shape,id:shape,anchor:'footer',side:'left',vertical:'bottom',scope:'user',width:160,height:70,x:12,y:24,rotation:18,z:8,opacity:.7});
    assert.deepEqual(validateLayers(JSON.parse(JSON.stringify([layer]))),[layer]);
    assert.equal(layer.kind,'shape');assert.equal(layer.height,70);assert.equal(layer.width,160);
    assert.equal(layer.fillMode,'solid');assert.equal(layer.heightUnit,'px');assert.equal(layer.heightPercent,0);
  }
  const a=newLayer('shape'),b=newLayer('shape');a.color='#abcdef';assert.equal(b.color,SHAPE_DEFAULTS.color);
  const snapshot=clone(a);a.height=120;assert.equal(snapshot.height,90);
});

test('shape imports strictly reject invalid, missing, injected and conflicting settings',()=>{
  const base=newLayer('shape');
  for(const update of [{shape:'circle'},{height:0},{height:501},{height:NaN},{height:'90'},{heightUnit:'vh'},{cornerRadius:-1},{cornerRadius:251},{cornerRadius:Infinity},{fillMode:'radial'},{color:'red'},{color2:'#fff'},{color:'#ffffff" onload="alert(1)'},{gradientAngle:-1},{gradientAngle:361},{gradientAngle:'90'},{unknown:true},{heightPercent:50},{image:'data:image/png;base64,YQ=='},{asset:Object.keys(ASSETS)[0]}]){
    assert.throws(()=>validateLayers([{...base,...update}]),JSON.stringify(update));
  }
  for(const key of SHAPE_KEYS){const incomplete={...base};delete incomplete[key];assert.throws(()=>validateLayers([incomplete]),key);}
  assert.throws(()=>validateLayers([{...base,anchor:'input',scope:'ai'}]));
  for(const update of [{height:1,cornerRadius:0,gradientAngle:0},{height:500,cornerRadius:250,gradientAngle:360}])assert.doesNotThrow(()=>validateLayers([{...base,...update}]));
});

test('built-in artwork and raster image layers retain their image schema and sizing',()=>{
  assert.equal(KINDS.includes('shape'),true);
  const image='data:image/png;base64,YQ==';
  const layers=['flower','star','tape','leaf','custom','asset'].map(kind=>newLayer(kind,{...(kind==='custom'?{image}:{}),...(kind==='asset'?{asset:Object.keys(ASSETS)[0]}:{})}));
  assert.deepEqual(validateLayers(layers),layers);
  for(const layer of layers){
    assert.equal(SHAPE_KEYS.some(key=>Object.hasOwn(layer,key)),false);
    assert.deepEqual(layerSizeStyle(layer),{width:'90px',height:'auto',objectFit:'contain'});
    assert.equal(shapeDataUrl(layer),'');
    assert.throws(()=>validateLayers([{...layer,color:'#ffffff'}]));
  }
  assert.deepEqual(layerSizeStyle(newLayer('custom',{image,width:50,widthUnit:'percent',heightPercent:80})),{width:'50%',height:'80%',objectFit:'contain'});
  assert.throws(()=>validateLayers([newLayer('custom',{image:'data:image/svg+xml,<svg onload="bad"/>'})]));
});

test('real independent dimensions are used for shape leaves in both unit modes',()=>{
  assert.deepEqual(layerSizeStyle(newLayer('shape',{width:230,height:48})),{width:'230px',height:'48px',objectFit:'fill'});
  assert.deepEqual(layerSizeStyle(newLayer('shape',{width:75,widthUnit:'percent',height:30,heightUnit:'percent'})),{width:'75%',height:'30%',objectFit:'fill'});
  assert.deepEqual(layerSizeStyle(newLayer('shape',{width:75,widthUnit:'percent',height:30,heightUnit:'px'})),{width:'75%',height:'30px',objectFit:'fill'});
});

test('rectangle SVG uses actual dimensions and bounded round corners with no foreign markup',()=>{
  const layer=newLayer('shape',{width:240,height:60,cornerRadius:12,color:'#123456'}),doc=documentFor(layer),svg=doc.querySelector('svg'),rect=doc.querySelector('rect');
  assert.equal(svg.getAttribute('viewBox'),'0 0 240 60');assert.equal(svg.getAttribute('preserveAspectRatio'),'none');
  assert.equal(rect.getAttribute('width'),'240');assert.equal(rect.getAttribute('height'),'60');assert.equal(rect.getAttribute('rx'),'12');assert.equal(rect.getAttribute('fill'),'#123456');
  assert.equal(documentFor({...layer,cornerRadius:250}).querySelector('rect').getAttribute('rx'),'30');
  assert.equal(documentFor({...layer,cornerRadius:0}).querySelector('rect').getAttribute('rx'),'0');
  assert.equal(doc.querySelectorAll('script,image,foreignObject,a').length,0);assert.equal(doc.querySelector('linearGradient'),null);
});

test('stars and hearts use controlled native vector paths with customizable non-square sizes',()=>{
  for(const shape of ['star','heart']){
    const doc=documentFor(newLayer('shape',{shape,width:180,height:60,color:'#ABCDEF'})),path=doc.querySelector('path');
    assert.equal(doc.querySelector('rect'),null);assert.ok(path.getAttribute('d').length>30);assert.equal(path.getAttribute('transform'),'scale(1.8 0.6)');assert.equal(path.getAttribute('fill'),'#ABCDEF');
  }
});

test('two-stop gradients support full-turn CSS directions and remain local to each SVG image',()=>{
  const expected=[{x1:100,y1:100,x2:100,y2:0},{x1:0,y1:50,x2:200,y2:50},{x1:100,y1:0,x2:100,y2:100},{x1:200,y1:50,x2:0,y2:50},{x1:100,y1:100,x2:100,y2:0}];
  [0,90,180,270,360].forEach((angle,i)=>assert.deepEqual(gradientVector(angle,200,100),expected[i]));
  for(const shape of SHAPES)for(const angle of [0,45,90,180,270,360]){
    const doc=documentFor(newLayer('shape',{shape,width:200,height:100,fillMode:'gradient',color:'#123456',color2:'#abcdef',gradientAngle:angle})),gradient=doc.querySelector('linearGradient'),stops=[...doc.querySelectorAll('stop')];
    assert.equal(gradient.getAttribute('id'),'fill');assert.equal(gradient.getAttribute('gradientUnits'),'userSpaceOnUse');
    assert.deepEqual(stops.map(n=>[n.getAttribute('offset'),n.getAttribute('stop-color')]),[['0','#123456'],['1','#abcdef']]);
    assert.equal(doc.querySelector('rect,path').getAttribute('fill'),'url(#fill)');
    if(shape!=='rectangle')assert.equal(gradient.getAttribute('gradientTransform'),'scale(0.5 1)');
  }
  for(const bad of [-1,361,Infinity,'90'])assert.throws(()=>gradientVector(bad));
});

test('generated SVG URLs are deterministic, encoded and never allow arbitrary SVG import',()=>{
  const layer=newLayer('shape',{fillMode:'gradient'}),before=clone(layer),url=shapeDataUrl(layer);
  assert.ok(url.startsWith('data:image/svg+xml;charset=utf-8,'));assert.equal(url.includes('<'),false);assert.equal(url.includes('#'),false);
  assert.equal(decodeURIComponent(url.split(',')[1]),shapeSvg(layer));assert.equal(shapeDataUrl(layer),url);assert.deepEqual(layer,before);
  assert.equal(shapeDataUrl(null),'');assert.throws(()=>shapeSvg({...layer,width:'90" onload="bad'}));assert.throws(()=>validateShapeSettings({...layer,color:'url(https://example.com)'}));
});
