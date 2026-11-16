import test from 'node:test';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {ASSETS,SHARED_ASSETS,assetUrl} from './catalog.mjs';
import assert from 'node:assert/strict';
import {createSchemeModel} from './scheme-model.mjs';
import {createSpringTemplate} from './spring-template.mjs';
test('spring is a complete editable native scheme with nine packaged page illustrations',()=>{
 const m=createSchemeModel(),c=m.validate(m.templates.spring);
 assert.equal(c.template,'spring');assert.equal(c.bodyLeftBorderWidth,2);assert.equal(c.bodyLeftBorderColor,'#f49fb3');
 assert.equal(c.captions.find(x=>x.id==='spring').scaleX,.646);
 assert.equal(c.captions.find(x=>x.id==='letter').scaleX,.74);
 assert.equal(c.captions.find(x=>x.id==='to-you').width,'auto');
 assert.equal(c.reasoningStyle.entry.secondary.content,'——朱自清《细雨》');
 for(const id of ['presets','connection','formatting','worldbook','settings','backgrounds','extensions','personas','characters']){
   const h=c.pageHeaders[id];assert.equal(h.enabled,true);assert.equal(h.scene.images[0].image,'');assert.ok(ASSETS[h.scene.images[0].asset]);assert.equal(h.scene.texts.length,2);
 }
 assert.deepEqual(m.validate(JSON.parse(JSON.stringify(c))),c);
 const copy=createSpringTemplate();copy.captions[0].content='新文字';assert.equal(createSpringTemplate().captions[0].content,'SPRING');
});
test('spring fonts resolve against its installed extension, without deployment-host binding',()=>{
 const c=createSchemeModel().validate(createSpringTemplate('https://example.test/scripts/extensions/third-party/theme/spring-template.mjs'));
 assert.equal(c.captions[0].fontLink.url,'https://example.test/scripts/extensions/third-party/theme/materials/fonts/spring/bodoni-moda-24pt.woff2');
 assert.match(c.reasoningStyle.entry.fontLink.url,/\/materials\/fonts\/spring\/poem-serif-light.ttf$/);
 assert.doesNotMatch(JSON.stringify(c),/127\.0\.0\.1|file\.garden/);
});

const imageHashes={
  "spring-pageheaders-presets-scene-images-0": "ab19e9df02f27b188aaebb16c18a54a8e1633795a548c95ec5fa9d722e363762",
  "spring-pageheaders-connection-scene-images-0": "d10a196e3645367a23d728cc62a1aa7356e722b35309d3b9060a91a9de2d33b0",
  "spring-pageheaders-worldbook-scene-images-0": "b639dd05898c64e46834b23ced4e44a54c42c78e344552ab5a431a5fbfcd3b93",
  "spring-pageheaders-settings-scene-images-0": "ba7476aea6b447ca08400bff73c53985c8bc33300125a349ad6e26fdf9173662",
  "spring-pageheaders-backgrounds-scene-images-0": "68b268286d93f8b32eca502246e4588c9ad84ec65262d411a0dcf70e20c04503",
  "spring-pageheaders-extensions-scene-images-0": "1125abc552d0500189ed47b09ef64dd482a0439d1556bb7decf0097ac7c03dd1",
  "spring-pageheaders-personas-scene-images-0": "1035ab9fb300cbc87668172dfb6fbe406925515867c2dcae0c4ec84495caeacc",
  "spring-pageheaders-characters-scene-images-0": "1623d965bfd300e490f2d77c07cc02cd17bdae6ba481bfb11fbe6b2db8996156",
  "spring-pageheaders-formatting-scene-images-0": "4db1cf1465027b6f14ad442e331ff002eb0c28ca33d93896ce40651029556095",
  "shared-spring-flower-stem": "9f5582165770560847f66ae0b991acc25fab065b62993ff7cacf0455e4c6728a",
  "shared-spring-pink-flowers": "d5ef4f0510a776510b18c38e4c7da1db79fbc930ee40a91846f063a8aa385a93",
  "spring-layers-2": "549268c854dc24f826f5e353d3b44f766fefa5e6a731f76ca95576e71d868561",
  "spring-layers-3": "e842b1da5b28484716779d43eea4a98fd5e2ddccb6c828a3ca00eab45ab961c2",
  "spring-chromestyle-topbar-icons-ai-config-button": "ee5eb5308152ddf19d4f1b7b145477bc529a143d5305dae8f3e6c206786e2dbd",
  "spring-chromestyle-topbar-icons-sys-settings-button": "4379a401491958086bd0eb9823f90ab6adeba511fcdb08378d90e701763ad922",
  "spring-chromestyle-topbar-icons-advanced-formatting-button": "1d7186485ef69773e304f2f29e0f56177e747b5fe40acb60c299c5d6932849e2",
  "spring-chromestyle-topbar-icons-wi-sp-button": "58d0107e164841def9a0b5e253a0cec81cad447ab09fec17e1d3f8071f1b9d16",
  "spring-chromestyle-topbar-icons-user-settings-button": "4e8f783dcc28a8f32774a2402b5991c6465ad3a49c8d75d8a511dfbb0fefe702",
  "spring-chromestyle-topbar-icons-backgrounds-button": "5f4102d42605ee1a58a1d1c71922d3a862fd3cc26518d31121149cbcdbecb42b",
  "spring-chromestyle-topbar-icons-extensions-settings-button": "02480cc82c9a619966f5b1b86972e8147a1192f3676ced2bb9aad2249cd7bd3f",
  "spring-chromestyle-topbar-icons-persona-management-button": "ed05974cf7b251e776ce6665c51a3b6703245acd8e1fae6a5872fda708d52410",
  "spring-chromestyle-topbar-icons-rightnavholder": "b3f043d67d7c3f2d188696d75f3480470449daba3649774a342158c2d6add586",
  "spring-chromestyle-input-icons-options_button": "acd7ff74b6bc9a848cac2ca89adf78f2cbc76dfba1659f415e809f5c755fd1be",
  "spring-chromestyle-input-icons-extensionsmenubutton": "86bd8a366aa1eec25c63e6d6a800ee23e130d7ba6052ac825deaf32b4b4f2455",
  "spring-chromestyle-input-icons-send_but": "ec849c63d03a1b9fc0d6b5575e610e1e26fbea7c71e3bd2c0dbc3fb7cf62367c",
  "spring-chromestyle-input-icons-mes_stop": "e70c3bbb8262422b654e0fca05f317a6c97423c4c9aaa29e0b9ceb3ffd89a2f2"
};
test('spring assets match packaged artwork and stay outside the general library',()=>{
 const c=createSpringTemplate();let count=0;
 function visit(o){for(const [key,v]of Object.entries(o||{})){
  if(key==='image'&&typeof v==='string'){assert.ok(!v.startsWith('data:image/'));if(o.asset){count++;const id=o.asset;assert.ok(imageHashes[id]);const bytes=fs.readFileSync(new URL(assetUrl(id)));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),imageHashes[id]);if(id.startsWith('spring-'))assert.equal(SHARED_ASSETS[id],undefined);}}
  else if(v&&typeof v==='object')visit(v);
 }}visit(c);assert.equal(count,27);assert.ok(fs.statSync(new URL('./spring-template.mjs',import.meta.url)).size<100000);
});

test('spring portrait and border keep the original ordinary-width composition',()=>{
 const c=createSchemeModel().validate(createSpringTemplate());
 assert.equal(c.headerHeight,280);assert.equal(c.bodyInset,14);
 assert.ok(Math.abs((390-c.cardPadding*2)*c.photos.ai.size/100-390*.42)<.02);
 const flower=c.layers.find(v=>v.id==='spring-ai-flower');
 assert.equal(flower.anchor,'message');assert.equal(flower.x,0);assert.equal(flower.y,50);
 assert.ok(c.regionOrder.overall.includes('image:spring-ai-flower'));
});

test('spring mobile illustrations remain compact transparent WebP assets',()=>{
 const names=['presets','connection','worldbook','settings','backgrounds','extensions','personas','formatting'];
 for(const name of [...names.map(x=>`pageheaders-${x}-scene-images-0`),'layers-2']){
  const bytes=fs.readFileSync(new URL(`./materials/spring/${name}.webp`,import.meta.url));
  assert.ok(bytes.length<100000);assert.equal(bytes.toString('ascii',12,16),'VP8L');
  const bits=bytes.readUInt32LE(21);assert.equal(1+(bits&0x3fff),name==='layers-2'?152:480);assert.equal((bits>>>28)&1,1);
 }
});
