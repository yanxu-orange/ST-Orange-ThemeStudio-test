import test from 'node:test';
import assert from 'node:assert/strict';
import {createSchemeModel} from './scheme-model.mjs';
import {captureCombination,applyCombination,inspectCombinationConflicts} from './region-combinations.mjs';
import {newLayer} from './layers.mjs';
import {syncRegionOrder} from './region-layers.mjs';
import {portableScheme} from './portable-scheme.mjs';
const model=createSchemeModel();
const blank=()=>structuredClone(model.templates.blank);
const jinghai=()=>model.validate(model.templates.jinghai);
for(const region of ['header','footer','home','page','input','topbar'])test(`${region}: captures only the region and applies a valid editable configuration`,()=>{
 const source=jinghai(),target=blank(),before=structuredClone(target),combo=captureCombination(source,region,'worldbook');
 const result=applyCombination(target,combo,'worldbook',{moveNative:true});
 assert.doesNotThrow(()=>model.validate(result));
 assert.deepEqual(target,before);
 assert.equal(result.fontSize,target.fontSize);assert.equal(result.surface,target.surface);assert.deepEqual(result.reasoningStyle,target.reasoningStyle);
 assert.equal(combo.fontSize,undefined);assert.equal(combo.pageStyle,undefined);
 if(region!=='header'){assert.equal(result.avatarSize,target.avatarSize);assert.deepEqual(result.photos,target.photos);}
 if(region!=='footer')assert.deepEqual(result.footerCaptions,target.footerCaptions);
 if(!['home','page'].includes(region))assert.deepEqual(result.pageHeaders,target.pageHeaders);
 if(region!=='input')assert.deepEqual(result.chromeStyle.input,target.chromeStyle.input);
 if(region!=='topbar')assert.deepEqual(result.chromeStyle.topbar,target.chromeStyle.topbar);
});
test('custom avatar content stays with target while frames and text styles travel',()=>{
 const source=blank(),target=blank();source.photos.ai.image='data:image/png;base64,source';source.photos.ai.size=150;source.nameSize=32;target.photos.ai.image='data:image/png;base64,target';
 const combo=captureCombination(source,'header');assert.equal(combo.photos.ai.image,undefined);
 const result=applyCombination(target,combo);assert.equal(result.photos.ai.image,target.photos.ai.image);assert.equal(result.photos.ai.size,150);assert.equal(result.nameSize,32);
});
test('image ID collision is remapped together with its region order',()=>{
 const source=blank(),target=blank();source.layers=[newLayer('star',{id:'same',anchor:'header'})];target.layers=[newLayer('star',{id:'same',anchor:'footer'})];
 const combo=captureCombination(syncRegionOrder(source),'header');const result=applyCombination(syncRegionOrder(target),combo);
 assert.equal(result.layers[0].id,'same');assert.notEqual(result.layers[1].id,'same');assert.ok(result.regionOrder.header.includes('image:'+result.layers[1].id));assert.deepEqual(result.regionOrder.footer,['image:same']);assert.doesNotThrow(()=>model.validate(result));
});
test('cross-region native movement requires explicit application consent',()=>{
 const source=blank(),target=blank();source.nativeStyle.actions.edit.position='footer';
 const combo=captureCombination(source,'footer');assert.ok(inspectCombinationConflicts(target,combo).some(x=>x.includes('编辑按钮')));assert.throws(()=>applyCombination(target,combo),/编辑按钮/);
 const result=applyCombination(target,combo,undefined,{moveNative:true});assert.equal(result.nativeStyle.actions.roles.ai.edit.position,'footer');assert.equal(result.nativeStyle.actions.roles.ai.more.position,'header');assert.doesNotThrow(()=>model.validate(result));
});
test('statistics materialize their own style without changing items in other regions',()=>{
 const source=blank(),target=blank();source.nativeStyle.stats.tokens.position='footer';source.nativeStyle.stats.size=23;source.nativeStyle.stats.color='#123456';target.nativeStyle.stats.tokens.position='footer';
 const before=structuredClone(target.nativeStyle.stats);const combo=captureCombination(source,'footer');const result=applyCombination(target,combo);
 assert.equal(result.nativeStyle.stats.size,before.size);assert.deepEqual(result.nativeStyle.stats.roles.ai.floor,before.floor);assert.equal(result.nativeStyle.stats.roles.ai.tokens.valueStyle.size,23);assert.equal(result.nativeStyle.stats.roles.ai.tokens.valueStyle.color,'#123456');
});
test('shared action appearance affecting another region is explicitly identified',()=>{
 const source=blank(),target=blank();source.nativeStyle.actions.more.position='footer';target.nativeStyle.actions.more.position='footer';source.nativeStyle.actions.size=21;
 const combo=captureCombination(source,'header');assert.ok(inspectCombinationConflicts(target,combo).some(x=>x.includes('字号与颜色')));assert.throws(()=>applyCombination(target,combo),/字号与颜色/);
});
test('source metadata outside the avatar area is not copied or moved',()=>{
 const source=blank(),target=blank();source.metadata.unified.name={region:'body-top',flow:'reserve',anchor:'left',x:0,y:0,width:'auto',style:{font:'serif',fontLink:null,size:28,weight:400,color:'#123456'}};
 const combo=captureCombination(source,'header');assert.equal(combo.metadata.ai.name,undefined);
 const result=applyCombination(target,combo);assert.equal(result.metadata.roles.ai.name.region,'header');assert.equal(result.metadata.roles.ai.name.style.size,target.nameSize);
});
test('moving metadata out of body requires explicit consent',()=>{
 const source=blank(),target=blank();target.metadata.unified.name={region:'body-top',flow:'reserve',anchor:'left',x:0,y:0,width:'auto',style:{font:'serif',fontLink:null,size:28,weight:400,color:'#123456'}};
 const combo=captureCombination(source,'header');assert.throws(()=>applyCombination(target,combo),/名字将从正文区/);assert.equal(applyCombination(target,combo,undefined,{moveNative:true}).metadata.roles.ai.name.region,'header');
});
test('page combination respects destination title and valid page-specific subtitle slots',()=>{
 const source=jinghai(),target=blank();target.pageHeaders.settings.title='保留设置';
 const combo=captureCombination(source,'page','worldbook');const result=applyCombination(target,combo,'settings');assert.equal(result.pageHeaders.settings.title,'保留设置');assert.deepEqual(result.pageHeaders.worldbook,target.pageHeaders.worldbook);assert.doesNotThrow(()=>model.validate(result));
 const chars=applyCombination(target,combo,'characters');assert.equal(chars.pageHeaders.characters.titleDecoration,null);assert.equal(chars.pageHeaders.characters.titleSubtitle,null);assert.doesNotThrow(()=>model.validate(chars));
});
test('font dependencies and portable artwork survive capture without a whole scheme',async()=>{
 const source=blank();source.chromeStyle.input.fontMode='custom';source.chromeStyle.input.fontLink={url:'https://example.com/font.woff2',faceWeight:'400'};
 source.layers=[newLayer('asset',{asset:'jinghai-bird-newspaper',anchor:'input'})];
 const combo=captureCombination(syncRegionOrder(source),'input');const packed=await portableScheme(combo,{resolveAsset:id=>'https://example.com/'+id,fetchImage:async()=>({ok:true,blob:async()=>new Blob(['x'])}),encodeImage:async()=> 'data:image/png;base64,eA=='});
 assert.equal(packed.layers[0].kind,'custom');assert.equal(packed.layers[0].asset,'');assert.equal(packed.layers[0].image,'data:image/png;base64,eA==');assert.deepEqual(packed.chrome.fontLink,source.chromeStyle.input.fontLink);
});
test('invalid region and page fail rather than replacing an unrelated region',()=>{
 assert.throws(()=>captureCombination(blank(),'body'));assert.throws(()=>captureCombination(blank(),'page','home'));assert.throws(()=>applyCombination(blank(),{version:2,region:'header'}));
});
test('captured settings never alias source font dependencies',()=>{
 const source=blank();source.nativeStyle.stats.floor.valueStyle={size:16,color:'auto',font:'auto',weight:400,fontLink:{url:'https://example.com/f.woff2',faceWeight:'400'}};
 const combo=captureCombination(source,'header');combo.native.stats.ai.floor.valueStyle.fontLink.url='https://example.com/other.woff2';assert.equal(source.nativeStyle.stats.floor.valueStyle.fontLink.url,'https://example.com/f.woff2');
});
test('new header time color does not recolor footer statistics',()=>{
 const source=blank(),target=blank();source.timeColor='#ff0000';source.nativeStyle.stats.tokens.position='footer';target.nativeStyle.stats.tokens.position='footer';
 const combo=captureCombination(source,'header');const result=applyCombination(target,combo);
 assert.equal(result.timeColor,'#ff0000');assert.equal(result.nativeStyle.stats.roles.ai.tokens.valueStyle.color,target.timeColor);assert.doesNotThrow(()=>model.validate(result));
});
test('native page title inherits source appearance locally without changing target page palette',()=>{
 const source=jinghai(),target=blank(),combo=captureCombination(source,'page','worldbook');
 assert.equal(combo.header.titleStyle.font,source.commonStyle.text.font);assert.equal(combo.header.titleColor,source.pageStyle.worldbook.heading.color);assert.equal(combo.header.titleSize,24);
 const result=applyCombination(target,combo,'backgrounds');assert.deepEqual(result.pageStyle,target.pageStyle);assert.deepEqual(result.commonStyle,target.commonStyle);assert.equal(result.pageHeaders.backgrounds.titleColor,combo.header.titleColor);assert.doesNotThrow(()=>model.validate(result));
});
test('custom banner title keeps its own typography rather than inheriting native title appearance',()=>{
 const source=blank();source.pageHeaders.worldbook.enabled=true;source.pageHeaders.worldbook.layout='standard';source.pageHeaders.worldbook.title='My banner';source.pageHeaders.worldbook.titleSize=35;
 const combo=captureCombination(source,'page','worldbook');assert.equal(combo.header.titleSize,35);assert.equal(combo.header.titleStyle,null);
});

test('chat input typography carries its body font dependency independently',()=>{
 const source=blank(),target=blank();source.chromeStyle.input.fontMode='chat';source.font='serif';
 source.bodyFontLink={url:'https://example.com/body.woff2',faceWeight:'400'};
 const combo=captureCombination(source,'input');
 assert.equal(combo.chrome.fontMode,'custom');assert.equal(combo.chrome.font,source.font);assert.deepEqual(combo.chrome.fontLink,source.bodyFontLink);
 const result=model.validate(applyCombination(target,combo));assert.deepEqual(result.chromeStyle.input.fontLink,source.bodyFontLink);assert.deepEqual(result.bodyFontLink,target.bodyFontLink);
 combo.chrome.fontLink.url='https://example.com/other.woff2';assert.equal(source.bodyFontLink.url,'https://example.com/body.woff2');
});
test('applying a combination preserves target native controls absent from the source area',()=>{
 const source=blank(),target=blank();source.nativeStyle.actions.edit.position='footer';
 const combo=captureCombination(source,'header');const result=applyCombination(target,combo);
 assert.equal(result.nativeStyle.actions.roles.ai.edit.position,'header');
 assert.equal(result.nativeStyle.actions.roles.user.edit.position,'header');
});
