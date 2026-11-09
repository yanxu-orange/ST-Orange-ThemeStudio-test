import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TEXT_DEFAULTS,TIME_FONTS,textSettings,metadataPadding,customTextLayout,captionWidthPixels,validateTextItems,freeText,sceneReserves} from './text-layout.mjs';

test('old configurations retain inherited font and original composition without mutation',()=>{
  const old={version:3,caption:'原有文案\n换行'};
  assert.deepEqual(textSettings(old),TEXT_DEFAULTS);assert.equal(customTextLayout(textSettings(old)),false);
  assert.deepEqual(Object.keys(old),['version','caption']);
});
test('controlled settings survive serialized snapshots and reject malformed values',()=>{
  for(const timeFont of ['auto',...TIME_FONTS])for(const textAlign of ['start','center','end']){
    const settings={...TEXT_DEFAULTS,timeFont,textAlign,textInset:20,textTop:80};
    assert.deepEqual(textSettings(JSON.parse(JSON.stringify(settings))),settings);
  }
  for(const raw of [{timeFont:'url(fake)'},{textAlign:'justify'},{textInset:-1},{textInset:21},{textInset:'2'},{textTop:81},{textTop:NaN},{textTop:null}])assert.throws(()=>textSettings(raw));
});
test('inset scales with the current corridor, including a new independent collage row',()=>{
  const settings=textSettings({textInset:20,textTop:80});
  assert.equal(metadataPadding(100,settings),20);assert.equal(metadataPadding(320,settings),64);
  assert.equal(metadataPadding(-10,settings),0);
  assert.equal(100-2*metadataPadding(100,settings),60);
});

test('independent text settings backfill, preserve snapshots and reject invalid offsets and links',()=>{
  const old=validateTextItems();assert.equal(freeText(old),false);old.name.x=20;assert.equal(old.time.x,0);
  const value=validateTextItems({name:{x:-100,y:-400,weight:900,z:0,fontLink:{url:'https://example.com/font?id=1',faceWeight:'100 900'}},caption:{x:100,y:400,z:21}});
  assert.equal(freeText(value),true);assert.equal(value.caption.z,21);assert.throws(()=>validateTextItems({caption:{z:-1}}));assert.deepEqual(validateTextItems(JSON.parse(JSON.stringify(value))),value);
  for(const input of [{name:{x:101}},{name:{y:-401}},{time:{weight:450}},{caption:{z:22}},{extra:{}},{name:{fontLink:{url:'javascript:alert(1)'}}},{name:{fontLink:{url:'https://user:secret@example.com/font'}}},{name:{fontLink:{url:'https://example.com/font#x'}}},{name:{fontLink:{url:'https://example.com/font',faceWeight:'bold'}}}])assert.throws(()=>validateTextItems(input));
});
test('visual reserves include both directions, ignore hidden zero boxes and do not accumulate',()=>{
  const node=(top,bottom,width=30)=>({getBoundingClientRect:()=>({top,bottom,width,height:bottom-top})});
  const scene={top:100,bottom:300};
  assert.deepEqual(sceneReserves(scene,[node(40,80),node(380,450),node(-1000,1000,0)]),{top:60,bottom:150});
  assert.deepEqual(sceneReserves(scene,[node(40,80),node(380,450)]),{top:60,bottom:150});
  assert.deepEqual(sceneReserves(scene,[node(150,190)]),{top:0,bottom:0});
});

test('caption width defaults to auto, validates bounded percentages and uses the full header',()=>{
  assert.equal(textSettings({}).captionWidth,'auto');assert.equal(captionWidthPixels('auto',600),null);
  for(const width of [10,60,100])assert.equal(captionWidthPixels(width,600),600*width/100);
  assert.equal(captionWidthPixels(60,300),180);
  for(const bad of [0,9,101,'60',null,NaN,Infinity])assert.throws(()=>textSettings({captionWidth:bad}));
  assert.equal(textSettings(JSON.parse(JSON.stringify({captionWidth:75}))).captionWidth,75);
});
