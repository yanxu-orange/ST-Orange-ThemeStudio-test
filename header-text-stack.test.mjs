import test from 'node:test';
import assert from 'node:assert/strict';
import {createSchemeModel} from './scheme-model.mjs';
import {enableHeaderCanvas,headerCanvasRules,projectHeaderConfig} from './header-canvas.mjs';
import {headerTextStack} from './header-text-stack.mjs';
import {metadataItem} from './native-metadata.mjs';
import {newSceneCaption} from './text-scene.mjs';
import {captureCombination,applyCombination} from './region-combinations.mjs';
import {syncRegionOrder} from './region-layers.mjs';
import {compilePageHeaders} from './theme-export/engine/headers/compile-page-headers.mjs';
import {proofRules} from './theme-export/engine/controls-layout/proof-rules.mjs';

const model=createSchemeModel();
function fixture(){
  const c=enableHeaderCanvas(model.validate(model.templates.blank),600);
  c.captions=[
    newSceneCaption(c,{id:'joined',content:'Joined artwork label',scope:'ai',size:14}),
    newSceneCaption(c,{id:'free',content:'Free artwork label',size:12,x:26,y:58}),
  ];
  c.metadata.unified.name={...metadataItem(c,'name'),x:140,y:22,width:170};
  c.headerTextStack={captionId:'joined'};
  return model.validate(syncRegionOrder(c));
}
test('fixed canvas text preserves sizes while art and positions still follow width',()=>{
  const follow=fixture(),fixed=structuredClone(follow);
  fixed.headerCanvas.textScale='fixed';
  const f=projectHeaderConfig(follow,360),p=projectHeaderConfig(fixed,360);
  assert.equal(f.nameSize,follow.nameSize*.6);
  assert.equal(p.nameSize,fixed.nameSize);
  assert.equal(p.timeSize,fixed.timeSize);
  assert.equal(p.metadata.unified.name.style.size,fixed.metadata.unified.name.style.size);
  assert.equal(p.captions[0].size,fixed.captions[0].size);
  assert.deepEqual(p.photos,f.photos);
  assert.equal(p.headerHeight,f.headerHeight);
  assert.equal(p.captions[1].y,f.captions[1].y);
  assert.match(headerCanvasRules('.mes','.ch_name',fixed),/font-size:14px!important/);
  assert.match(headerCanvasRules('.mes','.ch_name',follow),/font-size:calc\(14px \* var\(--hc-scale\)\)!important/);
});
test('stack carries through schemes and combinations, while free layout restores original positions',()=>{
  const stacked=fixture(),free=structuredClone(stacked);
  delete free.headerTextStack;
  const reopened=model.validate(JSON.parse(JSON.stringify(stacked)));
  assert.deepEqual(reopened,stacked);
  assert.equal(headerTextStack(reopened,false).caption.id,'joined');
  assert.equal(headerTextStack(reopened,true).caption,null);
  reopened.captions[0].visible=false;
  assert.equal(headerTextStack(reopened,false).caption,null);
  reopened.captions[0].visible=true;
  reopened.captions[0].content='   ';
  assert.equal(headerTextStack(reopened,false).caption,null);
  assert.deepEqual(model.validate({...stacked,headerTextStack:{captionId:'missing'}}).headerTextStack,{captionId:''});
  assert.equal(applyCombination(free,captureCombination(stacked,'header')).headerTextStack.captionId,'joined');
  const returned=applyCombination(stacked,captureCombination(free,'header'));
  assert.equal(returned.headerTextStack,undefined);
  assert.deepEqual(returned.captions,free.captions);
});
test('native export uses the original name and timestamp and keeps independent text leaves',async()=>{
  const config=fixture(),target={name:'普通头像区'};
  config.headerCanvas.textScale='fixed';
  config.captions[0].scaleX=2;
  const active=await compilePageHeaders(config,{target});
  assert.equal(active.ok,true,JSON.stringify(active.diagnostics));
  const css=active.sections.header;
  assert.match(css,/div\.alignItemsBaseline > \.name_text\{position:relative!important/);
  assert.match(css,/div\.alignItemsBaseline > \.timestamp\{position:relative!important/);
  assert.match(css,/\.alignItemsBaseline::after\{content:"Joined artwork label"/);
  assert.match(css,/\.alignItemsBaseline::after\{[^}]*clip-path:inset\(0 50% 0 0\)/);
  assert.match(css,/flex-direction:column!important;flex-wrap:nowrap!important/);
  assert.match(css,/\.ch_name::before\{content:"Free artwork label"/);
  assert.match(css,/\.alignItemsBaseline::before\{translate:calc/);
  assert.match(css,/\.timestamp\):is\(:empty,\[hidden\]\)/);
  assert.match(proofRules(config,'B'),/\.mesAvatarWrapper::before\{content:"";?\s*!important/);
  delete config.headerTextStack;delete config.headerCanvas.textScale;
  const free=await compilePageHeaders(config,{target});
  assert.equal(free.ok,true);
  assert.doesNotMatch(free.sections.header,/--yj-stack-/);
  assert.match(free.sections.header,/font-size:calc\(/);
});
