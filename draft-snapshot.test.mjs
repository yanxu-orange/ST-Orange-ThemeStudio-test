import {test} from 'node:test';
import assert from 'node:assert/strict';
import {snapshotDraft} from './draft-snapshot.mjs';

test('draft snapshots isolate every object and array while preserving primitive values',()=>{
 const image='data:image/png;base64,'+'A'.repeat(2000000);
 const source={layers:[{image,x:8}],photos:{ai:{image}},pageHeaders:{settings:{image}},nativeStyle:{actions:{edit:{source:{image}}}},captions:[{content:'old'}],regionOrder:{header:['image:a','name']},values:[null,true,false,0,'',undefined]};
 const a=snapshotDraft(source),b=snapshotDraft(source);
 function isolated(x,y){assert.deepEqual(x,y);if(x&&typeof x==='object'){assert.notEqual(x,y);for(const key of Object.keys(x))isolated(x[key],y[key]);}}
 isolated(source,a);isolated(a,b);
 source.layers[0].x=50;source.layers[0].image='new';source.layers.push({image:'added'});source.photos.ai.image='avatar';source.pageHeaders.settings.image='header';source.nativeStyle.actions.edit.source.image='icon';source.captions[0].content='new';source.regionOrder.header.reverse();
 assert.equal(a.layers.length,1);assert.equal(a.layers[0].x,8);assert.equal(a.layers[0].image,image);assert.equal(a.photos.ai.image,image);assert.equal(a.pageHeaders.settings.image,image);assert.equal(a.nativeStyle.actions.edit.source.image,image);assert.equal(a.captions[0].content,'old');assert.deepEqual(a.regionOrder.header,['image:a','name']);
 a.layers.splice(0,1);a.captions[0].content='edit after undo';assert.equal(b.layers.length,1);assert.equal(b.captions[0].content,'old');
});

test('snapshot creation does not serialize or structured-clone embedded images',()=>{
 const originalClone=globalThis.structuredClone,originalStringify=JSON.stringify;
 try{globalThis.structuredClone=()=>{throw Error('unexpected structuredClone');};JSON.stringify=()=>{throw Error('unexpected serialization');};const image='data:image/png;base64,'+'A'.repeat(2000000);assert.equal(snapshotDraft({layers:[{image}]}).layers[0].image,image);}
 finally{globalThis.structuredClone=originalClone;JSON.stringify=originalStringify;}
});
