import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSchemeModel} from './scheme-model.mjs';

test('blank is a neutral reading start with a rectangular avatar and editable caption',()=>{
 const m=createSchemeModel(), c=m.validate(m.templates.blank);
 assert.equal(c.fontSize,16);assert.equal(c.lineHeight,1.8);
 assert.equal(c.surface,'#f7f8f9');assert.equal(c.text,'#363a40');
 assert.equal(c.cardShadow,false);assert.equal(c.bodyPaddingLeft,16);assert.equal(c.bodyPaddingRight,16);
 assert.equal(c.captions.length,1);assert.equal(c.layers.length,0);assert.equal(c.footerCaptions.length,0);
 assert.equal(c.photos.ai.size,26);assert.equal(c.photos.user.size,26);
 assert.equal(c.reasoningStyle.entry.content,'思考过程');
 assert.deepEqual(m.validate(JSON.parse(JSON.stringify(c))),c);
});
test('legacy letter drafts and built-in works retain their settings',()=>{
 const m=createSchemeModel();
 assert.equal(m.validate(m.templates.letter).fontSize,17);
 assert.equal(m.validate(m.templates.letter).surface,'#fffdf8');
 for(const key of ['letter','jinghai','spring']){
  const c=m.validate(m.templates[key]);assert.deepEqual(m.validate(JSON.parse(JSON.stringify(c))),c);
 }
});
