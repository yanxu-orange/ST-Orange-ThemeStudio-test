import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSchemeStorage, SCHEME_DB, SCHEME_STORE, SCHEME_KEY} from './scheme-storage.mjs';
import {indexedDatabase} from './test-support/indexed-db.mjs';
const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('one scheme persists large JSON without using localStorage and later saves replace it',async()=>{
  const {factory,databases}=indexedDatabase();const first=createSchemeStorage({indexedDB:factory});
  assert.equal(await first.load(),null);
  const json=JSON.stringify({version:10,image:'x'.repeat(28*1024*1024)});
  await first.save(json);assert.equal(await createSchemeStorage({indexedDB:factory}).load(),json);
  await first.save('{"version":10}');assert.equal(await first.load(),'{"version":10}');
  assert.equal(databases.get(SCHEME_DB).get(SCHEME_STORE).size,1);
  assert.deepEqual(databases.get(SCHEME_DB).get(SCHEME_STORE).get(SCHEME_KEY),{id:SCHEME_KEY,json:'{"version":10}'});
  await assert.rejects(first.save({version:10}),TypeError);
});

test('scheme writes only report success at transaction completion and roll back failed replacements',async()=>{
  const {factory,controls}=indexedDatabase();const storage=createSchemeStorage({indexedDB:factory});
  await storage.save('original');controls.holdCommit=true;let finished=false;
  const pending=storage.save('replacement').then(()=>finished=true);await tick();assert.equal(finished,false);
  controls.holdCommit=false;controls.finish();await pending;assert.equal(await storage.load(),'replacement');
  for(const name of ['QuotaExceededError','AbortError']){
    controls.failNext=name;await assert.rejects(storage.save('discarded'),error=>name==='QuotaExceededError'?error.name===name:error.name==='SchemeStorageError');
    assert.equal(await storage.load(),'replacement');
  }
});

test('missing, denied and blocked IndexedDB do not fall back; failed opens can retry',async()=>{
  let localReads=0;globalThis.localStorage={getItem(){localReads++;throw Error('must not read');},setItem(){throw Error('must not write');}};
  const unavailable=createSchemeStorage({indexedDB:null});await assert.rejects(unavailable.load());await assert.rejects(unavailable.save('json'));assert.equal(localReads,0);
  const {factory,controls}=indexedDatabase(),storage=createSchemeStorage({indexedDB:factory});
  controls.blocked=true;await assert.rejects(storage.load());controls.blocked=false;controls.failOpen=true;await assert.rejects(storage.load());
  controls.failOpen=false;await storage.save('json');assert.equal(await storage.load(),'json');assert.equal(localReads,0);
});

test('malformed records fail visibly without clearing stored contents',async()=>{
  const {factory,databases}=indexedDatabase(),storage=createSchemeStorage({indexedDB:factory});await storage.load();
  databases.get(SCHEME_DB).get(SCHEME_STORE).set(SCHEME_KEY,{id:SCHEME_KEY,json:42});await assert.rejects(storage.load(),/记录无效/);
  assert.equal(databases.get(SCHEME_DB).get(SCHEME_STORE).get(SCHEME_KEY).json,42);
});
