import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createJinghaiTemplate} from './jinghai-template.mjs';
import {createSchemeModel} from './scheme-model.mjs';

test('Jinghai is a registered, independently editable, portable template',()=>{
 const model=createSchemeModel(),config=model.validate(model.templates.jinghai);
 assert.equal(config.template,'jinghai');
 assert.deepEqual(model.validate(JSON.parse(JSON.stringify(config))),config);
 assert.equal(config.font,'serif');
 assert.equal(config.headerHeight,model.templates.jinghai.headerHeight);
 for(const photo of Object.values(config.photos)){
  assert.equal(photo.image,'');assert.equal(photo.asset,'');
 }
 const inspect=value=>{
  if(!value||typeof value!=='object')return;
  for(const [key,item]of Object.entries(value)){
   if(key==='fontLink'||key==='bodyFontLink')assert.equal(item,null);
   if(typeof item==='string')assert.doesNotMatch(item,/^https?:\/\//);
   inspect(item);
  }
 };
 inspect(config);
 assert.ok(config.pageHeaders.home.scene.images.some(v=>v.image.startsWith('data:image/')));
 const second=createJinghaiTemplate();
 config.captions[0].content='changed';
 assert.notEqual(second.captions[0].content,'changed');
 assert.notEqual(model.templates.jinghai.captions[0].content,'changed');
});
