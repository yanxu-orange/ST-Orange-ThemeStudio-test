import test from 'node:test';
import assert from 'node:assert/strict';
import {createSchemeModel} from './scheme-model.mjs';
import {avatarCombinationScheme,freshBlankScheme} from './default-layout.mjs';
import {newSceneCaption,sceneGeometry} from './text-scene.mjs';
import {newFooterCaption} from './footer.mjs';
import {cardPadding} from './body-card.mjs';
import {syncRegionOrder} from './region-layers.mjs';
import {compilePageHeaders} from './theme-export/engine/headers/compile-page-headers.mjs';

const model=createSchemeModel();
const fresh=()=>model.validate(freshBlankScheme(model.templates.blank));

test('fresh blank contains the portrait and flows native text without including the demonstration',async()=>{
 const old=model.validate(model.templates.blank),c=fresh(),pad=cardPadding(c);
 assert.equal(old.captions[0].content,'这里放一行自定义文案');
 assert.equal(old.photos.ai.widthUnit,'percent');
 assert.equal(avatarCombinationScheme(old).captions[0].content,'这里放一行自定义文案');
 assert.deepEqual(c.captions,[]);
 assert.deepEqual(c.headerTextStack,{captionId:''});
 assert.equal(c.photos.ai.widthUnit,'px');
 for(const width of [378,760]){
  const g=sceneGeometry(c,width-pad*2,c.photos.ai);
  assert.equal(g.photoWidth,88);
  assert.ok(pad+g.photoHeight<=g.baseHeight);
 }
 const compiled=await compilePageHeaders(c,{target:{name:'空白起点验证'}});
 assert.equal(compiled.ok,true,JSON.stringify(compiled.diagnostics));
 assert.match(compiled.sections.header,/flex-direction:column!important;flex-wrap:nowrap!important/);
 assert.doesNotMatch(compiled.css,/这里放一行自定义文案/);
});

test('new caption starts on the text side in visible space without moving existing text',()=>{
 const c=fresh();
 c.captions=[
  newSceneCaption(c,{id:'prior',y:90}),
  newSceneCaption(c,{id:'hidden',visible:false,y:900}),
  newSceneCaption(c,{id:'empty',content:'    ',y:1100}),
 ];
 const before=structuredClone(c),first=newSceneCaption(c);
 assert.deepEqual(c,before);
 assert.equal(first.x,c.textItems.name.x);
 assert.equal(first.width,c.textItems.name.width);
 assert.ok(first.y>=90);
 assert.ok(first.y+first.size*1.6+cardPadding(c)<=c.headerHeight+1e-9);
 assert.equal(first.y,newSceneCaption({...c,captions:[c.captions[0]]}).y);
 const copy=newSceneCaption(c,{...first,id:'copy',x:-50,y:850,width:'auto'});
 assert.equal(copy.x,-50);
 assert.equal(copy.y,850);
 assert.equal(copy.width,'auto');
});

test('only drawn ordinary captions can refuse an unavailable implicit font',async()=>{
 const c=fresh(),font='"LabSongti",serif',target={name:'可见字体验证'};
 c.captions=[newSceneCaption(c,{id:'hidden-header',visible:false,font})];
 c.footerCaptions=[newFooterCaption({id:'empty-footer',content:'   ',font})];
 const inactive=await compilePageHeaders(model.validate(syncRegionOrder(c)),{target});
 assert.equal(inactive.ok,true,JSON.stringify(inactive.diagnostics));
 assert.doesNotMatch(inactive.css,/LabSongti/);
 c.captions[0].visible=true;
 c.footerCaptions[0].content='Visible footer';
 const active=await compilePageHeaders(model.validate(syncRegionOrder(c)),{target});
 assert.equal(active.ok,false);
 assert.ok(active.diagnostics.some(d=>d.field==='captions.0.font'));
 assert.ok(active.diagnostics.some(d=>d.field==='footerCaptions.0.font'));
});
