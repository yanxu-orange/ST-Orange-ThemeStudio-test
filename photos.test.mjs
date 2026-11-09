import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defaultPhoto,validatePhotos,kittyLayers,collageMetrics} from './photos.mjs';
import {validateLayers,clone} from './layers.mjs';

test('legacy configurations get independent disabled photo groups',()=>{
  const p=validatePhotos();p.ai.x=50;assert.equal(p.user.x,0);assert.equal(p.user.enabled,false);
});
test('photo settings round trip and reject unsafe sources or transforms',()=>{
  const raw={ai:defaultPhoto({enabled:true,rotation:10,asset:'kitty-ai-window'}),user:defaultPhoto({frameWidth:8})};
  assert.deepEqual(validatePhotos(JSON.parse(JSON.stringify(raw))),raw);
  const bad=clone(raw);bad.ai.image='https://unknown.invalid/tracker';assert.throws(()=>validatePhotos(bad));
  bad.ai.image='';bad.ai.scale=99;assert.throws(()=>validatePhotos(bad));
});
test('kitty layers use separate scene and photo anchors and registered assets',()=>{
  const layers=validateLayers(kittyLayers());assert.equal(layers.length,9);
  const scene=layers.find(l=>l.asset==='kitty-ai-window');assert.equal(scene.anchor,'header');assert.equal(scene.vertical,'bottom');assert.equal(scene.widthUnit,'percent');assert.ok(scene.heightPercent>0&&scene.heightPercent<=100);
  const cat=layers.find(l=>l.asset==='kitty-ai-cat');assert.equal(cat.anchor,'avatar');assert.equal(cat.scope,'ai');
  const fake=clone(layers);fake[0].asset='../private';assert.throws(()=>validateLayers(fake));
});
test('old decoration layers keep pixel and top defaults',()=>{
  const [old]=kittyLayers();delete old.widthUnit;delete old.offsetUnit;delete old.vertical;
  const [converted]=validateLayers([old]);assert.equal(converted.widthUnit,'px');assert.equal(converted.vertical,'top');
});
test('long captions receive separate space above photos',()=>{
  const normal=collageMetrics(350,230,80,150);assert.equal(normal.stacked,false);
  const long=collageMetrics(300,230,260,150);assert.equal(long.stacked,true);assert.ok(long.height>=456);
  for(const width of [240,320,390,600,900])assert.ok(collageMetrics(width,230,50,120).height>=150);
});
