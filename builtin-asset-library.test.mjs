import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createBuiltinAssetLibrary,HIDDEN_BUILTIN_ASSETS_KEY} from './builtin-asset-library.mjs';
import {builtinAssetGroups,assetUrl,ASSETS} from './catalog.mjs';

test('removed builtins stay out of new catalogs while registered sources remain usable',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 const groups=builtinAssetGroups(),id=groups[0].assets[0].id,url=assetUrl(id),library=createBuiltinAssetLibrary({storage});
 library.remove(id);library.remove(id);
 assert.deepEqual(JSON.parse(values.get(HIDDEN_BUILTIN_ASSETS_KEY)),[id]);
 const updated=[...groups,{name:'新素材',assets:[{id:'new-one'}]}];
 const visible=createBuiltinAssetLibrary({storage}).visible(updated).flatMap(g=>g.assets);
 assert.equal(visible.some(a=>a.id===id),false);assert.equal(visible.some(a=>a.id==='new-one'),true);
 assert.ok(ASSETS[id]);assert.equal(assetUrl(id),url);assert.equal(groups[0].assets[0].id,id);
});

test('failed storage never reports a successful removal',()=>{
 const groups=builtinAssetGroups(),id=groups[0].assets[0].id;
 const library=createBuiltinAssetLibrary({storage:{getItem:()=>null,setItem:()=>{throw new Error('quota');}}});
 assert.throws(()=>library.remove(id),/quota/);assert.ok(library.visible(groups).flatMap(g=>g.assets).some(a=>a.id===id));
});
