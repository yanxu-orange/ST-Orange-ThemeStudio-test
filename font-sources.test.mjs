import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createFontSession} from './font-sources.mjs';
import {validateTextItems} from './text-layout.mjs';
function setup(){
  const loaded=[],added=new Set(),timers=new Map();let changes=0,id=0;
  class Face{constructor(family,source,descriptors){Object.assign(this,{family,source,descriptors});loaded.push(this);}load(){return new Promise((resolve,reject)=>Object.assign(this,{resolve:()=>resolve(this),reject}));}}
  const document={fonts:{add:face=>added.add(face),delete:face=>added.delete(face)}};
  const session=createFontSession({document,FontFace:Face,onChange:()=>changes++,setTimer:fn=>{timers.set(++id,fn);return id;},clearTimer:id=>timers.delete(id)});
  return {session,loaded,added,timers,get changes(){return changes;}};
}
const linked=(keys=['name'])=>validateTextItems(Object.fromEntries(keys.map(k=>[k,{fontLink:{url:'https://fonts.example/font.woff2',faceWeight:'400'}}])));
const flush=()=>new Promise(r=>setImmediate(r));
test('font loading registers only on success, deduplicates and releases by remaining references',async()=>{
  const env=setup(),{session,loaded,added}=env;
  session.update(linked(['name','caption']));assert.equal(loaded.length,1);assert.equal(session.status('name'),'loading');assert.deepEqual(session.families(),{});
  loaded[0].resolve();await flush();assert.equal(added.size,1);assert.equal(session.families().name,session.families().caption);
  session.update(linked(['caption']));assert.equal(added.size,1);assert.equal(session.status('name'),'idle');
  session.update(validateTextItems());assert.equal(added.size,0);session.dispose();assert.equal(env.timers.size,0);
});
test('failed or timed-out fonts stay on fallback, retry works and late load cannot register',async()=>{
  const {session,loaded,added,timers}=setup();session.update(linked());loaded[0].reject(Error('CORS'));await flush();assert.equal(session.status('name'),'error');assert.deepEqual(session.families(),{});
  session.retry();assert.equal(loaded.length,2);[...timers.values()][0]();loaded[1].resolve();await flush();assert.equal(added.size,0);assert.equal(session.status('name'),'error');
  session.retry();loaded[2].resolve();await flush();assert.equal(added.size,1);session.dispose();assert.equal(added.size,0);
});
test('replacement and disposal reject stale async completion without deleting others fonts',async()=>{
  const {session,loaded,added}=setup(),external={};added.add(external);session.update(linked());
  session.update(validateTextItems({name:{fontLink:{url:'https://fonts.example/other',faceWeight:'100 900'}}}));
  loaded[0].resolve();await flush();assert.deepEqual([...added],[external]);assert.equal(loaded[1].descriptors.weight,'100 900');
  session.dispose();loaded[1].resolve();await flush();assert.deepEqual([...added],[external]);assert.deepEqual(session.families(),{});
});
test('missing FontFace support fails without breaking a session',()=>{
  const session=createFontSession({document:{fonts:{}},FontFace:null});session.update(linked());assert.equal(session.status('name'),'error');session.dispose();
});

test('dynamic caption font keys share a face until the last reference disappears',async()=>{
 const {session,loaded,added}=setup(),link={url:'https://fonts.example/shared.woff2',faceWeight:'400'};
 session.update({'caption:a':{fontLink:link},'caption:b':{fontLink:link}});assert.equal(loaded.length,1);loaded[0].resolve();await flush();assert.equal(session.status('caption:b'),'loaded');assert.equal(session.families()['caption:a'],session.families()['caption:b']);
 session.update({'caption:b':{fontLink:link}});assert.equal(added.size,1);assert.equal(session.status('caption:a'),'idle');session.update({});assert.equal(added.size,0);session.dispose();
});
