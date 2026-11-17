import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DOMParser} from 'linkedom';
import {newLayer,validateLayers} from './layers.mjs';
import {shapeSvg,shapeDataUrl,layerSizeStyle,lineThicknessTarget} from './shape-assets.mjs';
import {pinchLayer} from './layer-drag.mjs';
const doc=l=>new DOMParser().parseFromString(shapeSvg(l),'image/svg+xml');
test('lines offer readable defaults and thickness changes preserve real box geometry and saved schema',()=>{
 for(const shape of ['line','dashed','dotted','wave']){
  const l=newLayer('shape',{shape});assert.equal(l.width,200);assert.equal(lineThicknessTarget(l).height,2);
  const target=lineThicknessTarget(l);target.height=5;assert.equal(target.height,5);assert.equal(l.height,shape==='wave'?30:5);
  assert.deepEqual(validateLayers(JSON.parse(JSON.stringify([l]))),[l]);assert.equal(layerSizeStyle(l).height,l.height+'px');
  const node=doc(l).querySelector(shape==='line'?'rect':'path');assert.equal(node.getAttribute(shape==='line'?'height':'stroke-width'),'5');
  l.color='#123456';assert.equal(doc(l).querySelector('rect,path').getAttribute(shape==='line'?'fill':'stroke'),'#123456');
  assert.equal(decodeURIComponent(shapeDataUrl(l).split(',')[1]),shapeSvg(l));
  const next=pinchLayer(l,2,0,0,400,200,200,l.height);assert.equal(next.height,l.height*2);
 }
});
test('dash and wave paths are bounded, have no remote dependencies and support narrow lengths',()=>{
 for(const shape of ['dashed','dotted','wave'])for(const width of [1,20,200,500])for(const thickness of [1,2,40]){
  const l=newLayer('shape',{shape,width});lineThicknessTarget(l).height=thickness;const d=doc(l),path=d.querySelector('path');
  assert.equal(path.getAttribute('stroke-width'),String(thickness));assert.equal(path.getAttribute('vector-effect'),'non-scaling-stroke');assert.equal(d.querySelector('svg').getAttribute('viewBox'),`0 0 ${width} ${l.height}`);
  if(shape==='dashed')assert.equal(path.getAttribute('stroke-dasharray'),`${thickness*4} ${thickness*3}`);
  else if(shape==='dotted'){assert.equal(path.getAttribute('stroke-linecap'),'round');assert.equal(path.getAttribute('stroke-dasharray'),`0 ${thickness*3}`);}
  else {assert.match(path.getAttribute('d'),/^M0 /);assert.ok(path.getAttribute('d').includes(` ${width} ${l.height/2}`));}
  assert.equal(d.querySelectorAll('image,script,foreignObject').length,0);
 }
});

test('percentage-width waves repeat in display pixels instead of stretching a percentage-sized path',()=>{
 for(const width of [30,60,100]){
  const l=newLayer('shape',{shape:'wave',widthUnit:'percent',width,height:36,color:'#336699'}),d=doc(l);
  assert.equal(d.querySelector('svg').getAttribute('viewBox'),null);
  assert.equal(d.querySelector('pattern').getAttribute('patternUnits'),'userSpaceOnUse');
  assert.equal(d.querySelector('pattern').getAttribute('width'),'72');
  assert.equal(d.querySelector('path').getAttribute('stroke-width'),'6');
  assert.equal(d.querySelector('svg > rect').getAttribute('fill'),'#336699');
  l.fillMode='gradient';assert.match(doc(l).querySelector('foreignObject div').getAttribute('style'),/linear-gradient\(90deg,/);
 }
});
