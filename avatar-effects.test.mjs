import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSchemeModel} from './scheme-model.mjs';
import {EFFECT_DEFAULTS,effectSettings,setAvatarEffects,validateAvatarEffects,avatarEffectRules} from './avatar-effects.mjs';
import {normalizeMaskPixels} from './avatar-mask-upload.mjs';
import {enableHeaderCanvas,canvasEnabled,projectHeaderConfig} from './header-canvas.mjs';
import {captureCombination,applyCombination} from './region-combinations.mjs';
import {avatarArtworkFrameStyle} from './avatar-art.mjs';
import {avatarClipPolygon,sceneGeometry} from './text-scene.mjs';
import {snapshotDraft} from './draft-snapshot.mjs';
const {validate,templates}=createSchemeModel();
const base=()=>validate(structuredClone(templates.blank));
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';
test('old schemes stay unchanged until editing effects; schema12 preserves custom masks and independent roles',()=>{
 const old=base(),saved=JSON.stringify(old);assert.equal(old.version,10);assert.equal(old.avatarEffects,undefined);effectSettings(old);assert.equal(JSON.stringify(old),saved);
 old.avatarDesign='separate';const effects=structuredClone(EFFECT_DEFAULTS);effects.zoom=180;effects.mask={kind:'custom',image:png};setAvatarEffects(old,'ai',effects);
 const next=validate(JSON.parse(JSON.stringify(old)));assert.equal(next.version,12);assert.equal(next.avatarEffects.ai.zoom,180);assert.equal(next.avatarEffects.ai.mask.image,png);assert.equal(next.avatarEffects.user.zoom,100);assert.equal(next.headerCanvas,undefined);
 const snapshot=snapshotDraft(next);snapshot.avatarEffects.ai.mask.kind='none';assert.equal(next.avatarEffects.ai.mask.kind,'custom');
 assert.throws(()=>validate({...next,version:11}),/画布|头像效果/);
});
test('schema12 handles both coordinate modes and canvas activation without dropping effects',()=>{
 const c=base();setAvatarEffects(c,'ai',{...structuredClone(EFFECT_DEFAULTS),scale:125});assert.equal(canvasEnabled(c),false);
 const canvas=validate(enableHeaderCanvas(c,600));assert.equal(canvas.version,12);assert.equal(canvasEnabled(canvas),true);
 const projected=projectHeaderConfig(canvas,300);assert.equal(projected.photos.ai.size,canvas.photos.ai.size*.5);assert.equal(projected.avatarEffects.ai.scale,125);
 assert.equal(validate(JSON.parse(JSON.stringify(canvas))).avatarEffects.ai.scale,125);
});
test('invalid effect shape, unknown fields and unsafe/custom missing sources fail',()=>{
 const c=base();setAvatarEffects(c,'ai',structuredClone(EFFECT_DEFAULTS));
 for(const patch of [{zoom:0},{scale:301},{brightness:201},{other:1},{mask:{kind:'mirror',image:''}},{mask:{kind:'custom',image:'https://example.com/a.png'}},{mask:{kind:'custom',image:'data:image/svg+xml,<svg/>'}}]){const v=structuredClone(c);Object.assign(v.avatarEffects.ai,patch);assert.throws(()=>validate(v));}
 assert.throws(()=>validateAvatarEffects({version:12}));
});
test('alpha masks use opacity regardless of RGB; opaque masks use brightness; empty masks fail',()=>{
 const alpha=new Uint8ClampedArray([0,0,0,255,255,255,255,0]);assert.equal(normalizeMaskPixels(alpha),'alpha');assert.deepEqual([...alpha],[255,255,255,255,255,255,255,0]);
 const gray=new Uint8ClampedArray([0,0,0,255,255,255,255,255,128,128,128,255]);assert.equal(normalizeMaskPixels(gray),'luminance');assert.deepEqual([...gray],[255,255,255,0,255,255,255,255,255,255,255,128]);
 assert.throws(()=>normalizeMaskPixels(new Uint8ClampedArray([255,255,255,0])),/没有可显示/);assert.throws(()=>normalizeMaskPixels(new Uint8ClampedArray([0,0,0,255])),/没有可显示/);
 const white=new Uint8ClampedArray([255,255,255,255]);normalizeMaskPixels(white);assert.equal(white[3],255);
});
test('image zoom is distinct from viewport mask; fill gradient composes and decorations are not masked',()=>{
 const c=base();c.avatarDesign='separate';setAvatarEffects(c,'ai',{...structuredClone(EFFECT_DEFAULTS),zoom:180,mask:{kind:'custom',image:png}});
 let css=avatarEffectRules('.mes',c);assert.match(css,/\.avatar\{[^}]*mask-image:url/);assert.match(css,/>img:not\(\[data-otl-live-owned\]\)\{transform:scale\(1.8\)/);assert.doesNotMatch(css,/otl-avatar-art-frame/);
 c.avatarFill.ai.enabled=true;c.avatarFill.ai.gradient=true;css=avatarEffectRules('.mes',c);assert.match(css,/mask-image:url\([\s\S]*?,linear-gradient/);assert.match(css,/mask-composite:intersect/);assert.match(css,/\[data-otl-live-avatar-hidden=false\]\[is_user="false"\]/);assert.doesNotMatch(css,/is_user="true"/);
 const untouched=base();assert.equal(avatarEffectRules('.mes',untouched),'');
});
test('composition scaling shares transformed frame and avatar clipping; free layers retain their model',()=>{
 const c=base();c.photos.ai.size=120;c.photos.ai.x=17;c.photos.ai.y=-9;const geometry=sceneGeometry(c,500,c.photos.ai);
 setAvatarEffects(c,'ai',{...structuredClone(EFFECT_DEFAULTS),scale:200});
 const style=avatarArtworkFrameStyle(c,false,{...geometry,reserveTop:0},5);assert.match(style.transform,/translate\(17px,9px\).*scale\(2\)/);assert.equal(style.transformOrigin,'50% 100%');
 const clip=avatarClipPolygon(c,geometry,c.photos.ai);assert.ok(clip.includes('px'));assert.notEqual(clip,avatarClipPolygon({...c,avatarEffects:undefined},geometry,c.photos.ai));
});
test('header combinations carry effects and replacing with an old header clears effects explicitly',()=>{
 const c=base();setAvatarEffects(c,'ai',{...structuredClone(EFFECT_DEFAULTS),mask:{kind:'custom',image:png}});
 const combo=captureCombination(c,'header');const applied=validate(applyCombination(base(),combo));assert.equal(applied.version,12);assert.equal(applied.avatarEffects.ai.mask.image,png);
 const reset=validate(applyCombination(applied,captureCombination(base(),'header')));assert.equal(reset.version,10);assert.equal(reset.avatarEffects,undefined);
});
