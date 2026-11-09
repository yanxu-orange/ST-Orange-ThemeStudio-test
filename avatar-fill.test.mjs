import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeAvatarFill,avatarFillRules} from './avatar-fill.mjs';
import {sceneGeometry,sceneBounds} from './text-scene.mjs';
import {defaultPhoto} from './photos.mjs';

test('old configurations migrate in memory with fill off; schema10 validates independent groups',()=>{
 const old={version:9,photos:{ai:defaultPhoto(),user:defaultPhoto()}},before=JSON.stringify(old),c=normalizeAvatarFill(old);
 assert.equal(JSON.stringify(old),before);assert.equal(c.version,10);assert.equal(c.avatarFill.ai.enabled,false);
 c.avatarFill.ai.enabled=true;c.avatarFill.ai.gradient=true;c.avatarFill.ai.x=30;
 assert.deepEqual(normalizeAvatarFill(JSON.parse(JSON.stringify(c))),c);assert.equal(c.avatarFill.user.enabled,false);
 for(const [key,value]of [['x',101],['gradient','true'],['opacity',2],['color','red;display:none']]){const bad=structuredClone(c);bad.avatarFill.ai[key]=value;assert.throws(()=>normalizeAvatarFill(bad));}
 for(const invalid of [[],{...c.avatarFill,extra:{}},{ai:c.avatarFill.ai},{ai:[],user:c.avatarFill.user},{ai:{...c.avatarFill.ai,extra:1},user:c.avatarFill.user},{ai:{...c.avatarFill.ai,x:undefined},user:c.avatarFill.user}])assert.throws(()=>normalizeAvatarFill({...c,avatarFill:invalid}));
 for(let version=1;version<=9;version++){const original={version,textItems:{name:{x:75,y:-30,width:60}}},raw=JSON.stringify(original),next=normalizeAvatarFill(original);assert.equal(JSON.stringify(original),raw);assert.deepEqual(next.textItems,original.textItems);assert.equal(next.avatarFill.ai.enabled,false);assert.equal(next.avatarFill.user.gradient,false);}
 assert.throws(()=>normalizeAvatarFill({...c,version:9}));assert.throws(()=>normalizeAvatarFill({version:10}));assert.throws(()=>normalizeAvatarFill({version:11}));
});
test('fill width tracks card, reserves header height without photo caps, text may extend space not image',()=>{
 const c=normalizeAvatarFill({version:9,headerHeight:320,layout:'top',avatarSize:88});c.avatarFill.ai.enabled=true;
 const p=defaultPhoto({enabled:true,maxSize:80,scale:1.5,rotation:20});
 for(const w of [240,342,632,852]){const g=sceneGeometry(c,w,p);assert.equal(g.photoWidth,w+48);assert.equal(g.photoHeight,344);assert.equal(g.photoTop,-24);assert.equal(g.baseHeight,320);assert.equal(sceneBounds(c,g,[]).height,320);}
 const normal=sceneGeometry(c,342,p,false,true);assert.equal(normal.photoWidth,80);
 assert.equal(sceneGeometry(c,342,p,true).photoWidth,0);
});
test('preview and live share optional gradient and crop, without altering original avatar source',()=>{
 const c=normalizeAvatarFill({version:9,radius:8});c.avatarFill.ai.enabled=true;
 assert.match(avatarFillRules('.card',c),/content:none/);
 c.avatarFill.ai.gradient=true;c.avatarFill.ai.color='#abcdef';c.avatarFill.ai.opacity=.5;c.avatarFill.ai.x=20;
 for(const preview of [true,false]){const css=avatarFillRules('.card',c,preview);assert.match(css,/object-position:20% 50%/);assert.match(css,/#abcdef80/);assert.match(css,/pointer-events:none/);assert.doesNotMatch(css,/url\(/);assert.doesNotMatch(css,/is_user="true"/);}
});
