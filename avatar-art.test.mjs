import {test} from 'node:test';
import assert from 'node:assert/strict';
import {avatarArtworkFrameStyle} from './avatar-art.mjs';
import {avatarClipPolygon,sceneGeometry} from './text-scene.mjs';
import {defaultPhoto} from './photos.mjs';
import {FILL_DEFAULT} from './avatar-fill.mjs';
const config=()=>({headerHeight:240,photos:{ai:defaultPhoto({size:120,ratio:'0.75',x:12,y:-8,rotation:15}),user:defaultPhoto({size:80,x:-5,y:9,rotation:-10})},avatarFill:{ai:{...FILL_DEFAULT},user:{...FILL_DEFAULT}}});

test('avatar artwork uses the normal photo frame geometry, regional z and no independent scaling',()=>{
  const c=config(),g={...sceneGeometry(c,320,c.photos.ai),reserveTop:0},style=avatarArtworkFrameStyle(c,false,g,7);
  assert.equal(style.position,'absolute');assert.equal(style.left,'24px');assert.equal(style.top,'24px');assert.equal(style.width,'120px');assert.equal(style.height,'160px');assert.equal(style.transform,'translate(12px,8px) rotate(15deg)');assert.equal(style.transform.includes('scale'),false);assert.equal(style.transformOrigin,'50% 100%');assert.equal(style.zIndex,'7');assert.equal(style.pointerEvents,'none');assert.equal(style.clipPath,'polygon(var(--sc-avatar-clip))');
  const userGeometry={...sceneGeometry(c,320,c.photos.user,false,true),reserveTop:0},userStyle=avatarArtworkFrameStyle(c,true,userGeometry,2);assert.equal(userStyle.width,'80px');assert.equal(userStyle.height,'80px');assert.equal(userStyle.transform,'translate(-5px,-9px) rotate(-10deg)');assert.equal(userStyle.zIndex,'2');
});

test('fill-mode avatar artwork starts at the full header origin without photo transforms',()=>{
  const c=config();c.avatarFill.ai.enabled=true;
  const g={...sceneGeometry(c,320,c.photos.ai,false,false),reserveTop:0},style=avatarArtworkFrameStyle(c,false,g,4);
  assert.equal(g.photoTop,-24);assert.equal(style.left,'0px');assert.equal(style.top,'0px');assert.equal(style.width,'368px');assert.equal(style.height,'240px');assert.equal(style.transform,'none');assert.equal(style.zIndex,'4');
  const normalUser={...sceneGeometry(c,320,c.photos.user,false,true),reserveTop:0};assert.equal(avatarArtworkFrameStyle(c,true,normalUser,3).left,'24px','AI fill does not move the user frame');
});

test('normal and fill avatar clipping stay finite after removal of the photo scale property',()=>{
  const c=config();
  for(const user of [false,true])for(const fill of [false,true]){
    const key=user?'user':'ai',p=c.photos[key];c.avatarFill[key].enabled=fill;assert.equal(Object.hasOwn(p,'scale'),false);
    const g=sceneGeometry(c,320,p,false,user),clip=avatarClipPolygon(c,g,p,user);
    assert.equal(/NaN|Infinity|undefined/.test(clip),false);assert.equal(clip.split(',').length,4);assert.equal((clip.match(/px/g)||[]).length,8);
  }
});
