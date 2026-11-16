import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSchemeModel} from './scheme-model.mjs';
import {sceneGeometry,sceneBounds,avatarClipPolygon} from './text-scene.mjs';
import {captureCombination,applyCombination} from './region-combinations.mjs';

test('independent header height survives saving and applies only to the chosen role',()=>{
 const m=createSchemeModel(), c=m.validate({...m.templates.spring,userHeaderHeight:310});
 const ai=sceneGeometry(c,362,c.photos.ai), user=sceneGeometry(c,362,c.photos.user,false,true);
 assert.equal(sceneBounds(c,ai).height,280);assert.equal(sceneBounds(c,user).height,310);
 assert.ok(Math.abs(user.photoWidth-187.2)<.02);assert.ok(14-c.photos.user.y+user.photoHeight<310);
 assert.notEqual(avatarClipPolygon(c,ai,c.photos.ai),avatarClipPolygon(c,user,c.photos.user,true));
 assert.equal(m.validate(JSON.parse(JSON.stringify(c))).userHeaderHeight,310);
 const plain={...c};delete plain.userHeaderHeight;
 assert.equal(sceneGeometry(plain,362,plain.photos.user,false,true).baseHeight,280);
 assert.throws(()=>m.validate({...c,userHeaderHeight:0}));
 const combo=captureCombination(c,'header');assert.equal(applyCombination(plain,combo).userHeaderHeight,310);
 assert.equal(applyCombination(c,captureCombination(plain,'header')).userHeaderHeight,undefined);
});
