import {test} from 'node:test';import assert from 'node:assert/strict';
import {normalizeCaptionConfig,validateCaptions,newCaption,textEntries,textTokens} from './captions.mjs';
test('real v1-v3 single caption migration preserves all styles, hidden state, width and image source',()=>{
 for(const version of [1,2,3]){
  const old={version,caption:'旧文案\n第二行',captionFont:'monospace',captionSize:25,captionColor:'#123456',captionPosition:'hidden',captionWidth:72,textItems:{caption:{x:-30,y:80,weight:700,z:21,fontLink:{url:'https://example.com/font.woff2',faceWeight:'700'}}},layers:[{id:'sample',kind:'custom',image:'data:image/png;base64,AAAA'}]},before=structuredClone(old),value=normalizeCaptionConfig(old),c=value.captions[0];
  assert.equal(value.version,4);assert.equal(c.id,'caption-legacy');assert.equal(c.content,old.caption);assert.equal(c.font,old.captionFont);assert.equal(c.size,25);assert.equal(c.color,'#123456');assert.equal(c.visible,false);assert.equal(c.position,'above');assert.equal(c.width,72);assert.deepEqual({x:c.x,y:c.y,weight:c.weight,z:c.z,fontLink:c.fontLink},old.textItems.caption);assert.deepEqual(value.layers,old.layers);assert.deepEqual(old,before);
  assert.equal(Object.hasOwn(value,'caption'),false);assert.equal(Object.hasOwn(value.textItems,'caption'),false);assert.deepEqual(normalizeCaptionConfig(JSON.parse(JSON.stringify(value))),value);
  for(const key of ['caption','captionFont','captionSize','captionColor','captionPosition','captionWidth'])assert.throws(()=>normalizeCaptionConfig({...old,[key]:null}));
 }
 assert.equal(normalizeCaptionConfig({version:1}).captions[0].content,'今日也有一封来信');
});
test('v4 list is the sole source, explicit zero remains zero, and invalid/duplicate IDs are rejected',()=>{
 const value=normalizeCaptionConfig({version:4,captions:[]});assert.deepEqual(value.captions,[]);assert.deepEqual(normalizeCaptionConfig(JSON.parse(JSON.stringify(value))).captions,[]);
 assert.throws(()=>normalizeCaptionConfig({version:4}));assert.throws(()=>normalizeCaptionConfig({version:4,captions:[],caption:'ghost'}));assert.throws(()=>normalizeCaptionConfig({version:4,captions:[],textItems:{caption:{}}}));assert.throws(()=>normalizeCaptionConfig({version:3,captions:[]}));
 const cap=newCaption({id:'a'});assert.throws(()=>validateCaptions([cap,cap]));assert.throws(()=>validateCaptions([{...cap,id:'a:b'}]));assert.throws(()=>validateCaptions([{...cap,width:101}]));assert.throws(()=>validateCaptions(Array.from({length:21},(_,i)=>({...cap,id:'id'+i}))));assert.equal(validateCaptions(Array.from({length:20},(_,i)=>({...cap,id:'id'+i}))).length,20);
});
test('dynamic keys are separate from native text and have safe CSS tokens with isolated styles',()=>{
 const a=newCaption({id:'name',x:20,fontLink:{url:'https://example.com/a',faceWeight:'400'}}),b=newCaption({id:'b',y:30}),value=normalizeCaptionConfig({version:4,captions:[a,b]}),entries=textEntries(value),tokens=textTokens(value);
 assert.ok(entries.name);assert.equal(entries['caption:name'].x,20);assert.equal(entries['caption:b'].y,30);assert.equal(tokens['caption:name'],'cap-name');assert.ok(Object.values(tokens).every(token=>!token.includes(':')));value.captions[1].x=90;assert.equal(value.captions[0].x,20);
});
