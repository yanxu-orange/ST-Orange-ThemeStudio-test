import {test} from 'node:test';
import assert from 'node:assert/strict';
import {avatarCompositionEntries,reorderAvatarComposition} from './avatar-composition-order.mjs';
import {syncRegionOrder,regionZ} from './region-layers.mjs';

function sample(){return syncRegionOrder({layers:[
 {id:'back',name:'月亮',anchor:'avatar',scope:'ai',visible:true,width:80,x:12,y:7},
 {id:'front',name:'镜框',anchor:'avatar',scope:'ai',visible:true,width:90,x:2,y:3},
 {id:'shared',name:'雪花',anchor:'avatar',scope:'both',visible:false,width:70,x:8,y:4},
 {id:'user',name:'用户素材',anchor:'avatar',scope:'user',visible:true},
 {id:'free',name:'自由素材',anchor:'header',scope:'both',visible:true},
 ],captions:[],regionOrder:{header:['image:back','image:user','avatar','name','image:free','image:front','time','image:shared']}});}

test('composition projects front-to-back, includes hidden/shared art and fixes the avatar pivot',()=>{
 const c=sample();assert.deepEqual(avatarCompositionEntries(c,'ai').map(v=>v.key),['image:shared','image:front','avatar','image:back']);
 assert.deepEqual(avatarCompositionEntries(c,'user').map(v=>v.key),['image:shared','avatar','image:user']);
 assert.equal(avatarCompositionEntries(c,'ai')[0].layer.visible,false);
 assert.throws(()=>reorderAvatarComposition(c,'ai','avatar',0));assert.throws(()=>reorderAvatarComposition(c,'ai','image:user',0));
});

test('moving artwork across avatar preserves all untouched keys and all geometry',()=>{
 const c=sample(),snapshot=structuredClone(c),order=reorderAvatarComposition(c,'ai','image:back',1);
 const next={...c,regionOrder:{...c.regionOrder,header:order}};
 assert.deepEqual(avatarCompositionEntries(next,'ai').map(v=>v.key),['image:shared','image:back','image:front','avatar']);
 assert.deepEqual(order.filter(v=>v!=='image:back'),c.regionOrder.header.filter(v=>v!=='image:back'));
 assert.ok(regionZ(next,'header','image:back')>regionZ(next,'header','avatar'));
 assert.deepEqual(c,snapshot);assert.deepEqual(next.layers,snapshot.layers);
 assert.equal(regionZ(next,'header','image:user')<regionZ(next,'header','avatar'),true);
});

test('no-op retains exact full order including unlisted interleaving items',()=>{
 const c=sample();assert.deepEqual(reorderAvatarComposition(c,'ai','image:front',1),c.regionOrder.header);
 const bottom=reorderAvatarComposition(c,'ai','image:shared',3);assert.deepEqual(bottom.filter(v=>v!=='image:shared'),c.regionOrder.header.filter(v=>v!=='image:shared'));
 assert.deepEqual(avatarCompositionEntries({...c,regionOrder:{...c.regionOrder,header:bottom}},'ai').map(v=>v.key),['image:front','avatar','image:back','image:shared']);
 assert.throws(()=>reorderAvatarComposition(c,'ai','image:front',-1));assert.throws(()=>reorderAvatarComposition(c,'ai','image:front',9));
});
