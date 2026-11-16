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
  "spring-pageheaders-presets-scene-images-0": "e3f8dae01afaf3354e6c5cdc1369a0b4982504421ac747a15bcfa00c784147a5",
  "spring-pageheaders-connection-scene-images-0": "fad18d4c9976f3ca66bfeca25aa840c3cdc38996ddcd598a481b18a9b36ff8ba",
  "spring-pageheaders-worldbook-scene-images-0": "8906020a45bc79dcd1c362719e60a3205458b928b8da4a8b2ed6fadb1185e6a4",
  "spring-pageheaders-settings-scene-images-0": "faca8b1f92187cb7a310f1e58158d99765adf702b03844d092157882df972b2f",
  "spring-pageheaders-backgrounds-scene-images-0": "7fc91a7b7d2ff73a0e97587385625d8a8d8bb49a37969650b4251a8822e36c8a",
  "spring-pageheaders-extensions-scene-images-0": "d4a0daa191a154ddec184b3e47cabae059950044ba5364d6d501370dbf5ebd28",
  "spring-pageheaders-personas-scene-images-0": "34059cd24341a0abf8a953594992613a766730643a36af17f44ca776b4dae21f",
  "spring-pageheaders-characters-scene-images-0": "1623d965bfd300e490f2d77c07cc02cd17bdae6ba481bfb11fbe6b2db8996156",
  "spring-pageheaders-formatting-scene-images-0": "49fe40e54bee2e81ae6cc6e378d4e2312df292da0f7ae7bcf3cfa23b831f2ffa",
  "shared-spring-flower-stem": "9f5582165770560847f66ae0b991acc25fab065b62993ff7cacf0455e4c6728a",
  "shared-spring-pink-flowers": "d5ef4f0510a776510b18c38e4c7da1db79fbc930ee40a91846f063a8aa385a93",
  "spring-layers-2": "5d380ed6e5bdb190727565479b35aed668d0ea894dc2e23d1cdd79f95e509be4",
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
test('spring assets preserve original bytes and stay outside the general library',()=>{
 const c=createSpringTemplate();let count=0;
 function visit(o){for(const [key,v]of Object.entries(o||{})){
  if(key==='image'&&typeof v==='string'){assert.ok(!v.startsWith('data:image/'));if(o.asset){count++;const id=o.asset;assert.ok(imageHashes[id]);const bytes=fs.readFileSync(new URL(assetUrl(id)));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),imageHashes[id]);if(id.startsWith('spring-'))assert.equal(SHARED_ASSETS[id],undefined);}}
  else if(v&&typeof v==='object')visit(v);
 }}visit(c);assert.equal(count,26);assert.ok(fs.statSync(new URL('./spring-template.mjs',import.meta.url)).size<100000);
});
