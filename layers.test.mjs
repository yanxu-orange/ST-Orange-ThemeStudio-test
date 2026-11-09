import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newLayer,migrateLayers,validateLayers,clone,cropRect} from './layers.mjs';

test('old saved image and placement survive migration',()=>{
  const image='data:image/png;base64,YQ==';
  const [layer]=migrateLayers({decoration:'custom',image,decorationWidth:130,decorationX:22,decorationY:60,decorationOpacity:.6});
  assert.equal(layer.image,image); assert.equal(layer.width,130); assert.equal(layer.y,60);assert.equal(layer.opacity,.6);
  assert.deepEqual(migrateLayers({decoration:'none'}),[]);
});
test('history snapshots do not share editable layers',()=>{
  const current={layers:[newLayer()]};const previous=clone(current);
  current.layers[0].rotation=40;current.layers.push(newLayer('star'));
  assert.equal(previous.layers[0].rotation,0);assert.equal(previous.layers.length,1);
});
test('round trip retains independent layering and rejects invalid imports',()=>{
  const layers=[newLayer('leaf',{scope:'ai',side:'left',z:0}),newLayer('tape',{rotation:-18,visible:false})];
  assert.deepEqual(validateLayers(JSON.parse(JSON.stringify(layers))),layers);
  assert.throws(()=>validateLayers([layers[0],layers[0]]));
  assert.throws(()=>validateLayers([newLayer('custom',{image:'javascript:alert(1)'})]));
  assert.throws(()=>validateLayers([newLayer('star',{x:Infinity})]));
});
test('crop stays in source and preserves target ratio at every corner',()=>{
  for(const [w,h]of [[1200,600],[600,1200],[900,900]])for(const ratio of [1,3/4,4/3,16/9,w/h])for(const zoom of [1,2,4])for(const x of [0,50,100])for(const y of [0,50,100]){
    const r=cropRect(w,h,ratio,zoom,x,y);
    assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=w+1e-8&&r.y+r.height<=h+1e-8);
    assert.ok(Math.abs(r.width/r.height-ratio)<1e-8);
  }
  assert.throws(()=>cropRect(0,200,1));assert.throws(()=>cropRect(200,200,1,0));
});
