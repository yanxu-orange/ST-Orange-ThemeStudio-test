import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import { createSchemeModel } from './scheme-model.mjs';
import { createCombinationPreview } from './combination-preview.mjs';
import { enableHeaderCanvas } from './header-canvas.mjs';
import { newSceneCaption } from './text-scene.mjs';
import { syncRegionOrder } from './region-layers.mjs';
import { newLayer } from './layers.mjs';
const { validate, templates } = createSchemeModel();
test('combination previews cover all regions without modifying configuration', () => {
 const { document } = parseHTML('<html><body></body></html>');
 const c = validate(structuredClone(templates.blank)), before = structuredClone(c);
 for (const region of ['header','footer','home','page','input','topbar']) {
  const el = createCombinationPreview(document,c,{region,pageId:'settings'});
  assert.equal(el.getAttribute('role'),'img'); assert.ok(el.getAttribute('viewBox'));
 }
 assert.deepEqual(c,before);
});
test('preview text is text, not interpreted markup', () => {
 const { document } = parseHTML('<html><body></body></html>');
 const c = validate(structuredClone(templates.blank));
 c.pageHeaders.settings.title='<script>test</script>';
 const el=createCombinationPreview(document,c,{region:'page',pageId:'settings'});
 assert.equal(el.querySelector('script'),null); assert.ok(el.textContent.includes('<script>'));
});
test('header thumbnail lays out the selected text and preserves other captions', () => {
 const { document } = parseHTML('<html><body></body></html>');
 const raw=enableHeaderCanvas(validate(templates.blank),600);
 raw.captions=[
  newSceneCaption(raw,{id:'joined',content:'同行文案',size:17}),
  newSceneCaption(raw,{id:'free',content:'独立文案'}),
 ];
 raw.headerTextStack={captionId:'joined'};
 raw.headerCanvas.textScale='fixed';
 const config=validate(syncRegionOrder(raw)),before=structuredClone(config);
 const thumbnail=createCombinationPreview(document,config,{region:'header'});
 const items=Object.fromEntries([...thumbnail.querySelectorAll('div')].filter(n=>n.childElementCount===0).map(n=>[n.textContent,n]));
 const name=items['角色名字'],time=items['2026年11月17日 13:28'],joined=items['同行文案'],free=items['独立文案'];
 assert.equal(name.parentElement,time.parentElement);
 assert.equal(name.parentElement,joined.parentElement);
 assert.notEqual(name.parentElement,free.parentElement);
 assert.equal(name.parentElement.style.getPropertyValue('flex-wrap'),'nowrap');
 assert.deepEqual([name,time,joined].map(n=>n.style.getPropertyValue('order')),['1','2','3']);
 assert.equal(joined.style.getPropertyValue('font-size'),'17px');
 assert.deepEqual(config,before);
 config.captions[0].visible=false;
 assert.equal(createCombinationPreview(document,config,{region:'header'}).textContent.includes('同行文案'),false);
 delete config.headerTextStack;
 const freeThumbnail=createCombinationPreview(document,config,{region:'header'});
 const freeName=[...freeThumbnail.querySelectorAll('div')].find(n=>n.childElementCount===0&&n.textContent==='角色名字');
 assert.equal(freeName.style.getPropertyValue('position'),'absolute');
});
test('legacy coordinate thumbnail keeps avatar decoration with an opted-in bottom portrait', () => {
 const { document } = parseHTML('<html><body></body></html>');
 const raw=validate(templates.blank);
 Object.assign(raw.photos.ai,{size:90,widthUnit:'px',ratio:'1',height:'auto',y:25,verticalAnchor:'bottom'});
 raw.headerHeight=210;
 raw.layers=[newLayer('shape',{id:'photo-decor',anchor:'avatar',width:20,height:12})];
 const config=validate(syncRegionOrder(raw));
 assert.equal(config.headerCanvas,undefined);
 assert.equal(config.avatarEffects,undefined);
 const image=createCombinationPreview(document,config,{region:'header'}).querySelector('img');
 assert.equal(image.parentElement.style.transform,`translate(0px,${120-config.cardPadding}px) rotate(0deg)`);
 const manual=structuredClone(config);
 delete manual.photos.ai.verticalAnchor;
 const old=createCombinationPreview(document,manual,{region:'header'}).querySelector('img');
 assert.equal(old.parentElement.style.transform,'');
});
