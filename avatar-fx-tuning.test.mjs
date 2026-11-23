import test from 'node:test';import assert from 'node:assert/strict';import {parseHTML} from 'linkedom';
import {createSchemeModel} from './scheme-model.mjs';import {chooseAvatarFx,effectSettings,avatarEffectRules} from './avatar-effects.mjs';import {validateAvatarFx,avatarFxTuning,styleStaticAvatarFx,createAvatarFxNode,AVATAR_FX_CSS} from './avatar-fx.mjs';import {snapshotDraft} from './draft-snapshot.mjs';import {captureCombination,applyCombination} from './region-combinations.mjs';
const model=createSchemeModel(),base=()=>model.validate(structuredClone(model.templates.blank)),fx={kind:'sparkle',motion:true,color:'#ffffff'};
test('legacy three-field FX uses implicit 100% without migration or extra serialized fields',()=>{
 const c=base();chooseAvatarFx(c,'ai','sparkle');const before=snapshotDraft(c);assert.deepEqual(c.avatarEffects.ai.fx,fx);assert.deepEqual(model.validate(c),before);assert.deepEqual(avatarFxTuning(c.avatarEffects.ai.fx),{size:1,strength:1});assert.deepEqual(validateAvatarFx(fx),fx);assert.equal(Object.hasOwn(model.validate(c).avatarEffects.ai.fx,'size'),false);
});
test('optional tuning rejects invalid numbers and keys but preserves valid boundary data through JSON and combinations',()=>{
 for(const [key,bad]of [['size',49],['size',201],['size','100'],['size',NaN],['strength',24],['strength',201],['strength',Infinity],['strength',null]])assert.throws(()=>validateAvatarFx({...fx,[key]:bad}));assert.throws(()=>validateAvatarFx({...fx,intensity:100}));
 for(const size of[50,100,200])for(const strength of[25,100,200]){const c=base();c.avatarDesign='separate';chooseAvatarFx(c,'ai','sparkle');c.avatarEffects.ai.fx={...fx,size,strength};const before=snapshotDraft(c);assert.deepEqual(model.validate(JSON.parse(JSON.stringify(c))),before);const combo=captureCombination(c,'header','settings'),round=applyCombination(base(),combo,'settings',{moveNative:true});assert.deepEqual(model.validate(round).avatarEffects.ai.fx,c.avatarEffects.ai.fx);assert.equal(c.avatarEffects.user.fx,undefined);chooseAvatarFx(c,'ai','sweep');assert.equal(c.avatarEffects.ai.fx.size,size);assert.equal(c.avatarEffects.ai.fx.strength,strength);}
});
test('tuning is CSS variables only; root geometry and original image rules remain unchanged',()=>{
 const c=base();chooseAvatarFx(c,'ai','sparkle');const before=avatarEffectRules('.mes',c);effectSettings(c).fx.size=200;effectSettings(c).fx.strength=200;const after=avatarEffectRules('.mes',c);assert.equal(after.replaceAll('--otl-fx-size:2;--otl-fx-strength:2;','--otl-fx-size:1;--otl-fx-strength:1;'),before);assert.equal(after.split('@keyframes otl-fx-star').length,2);assert.match(AVATAR_FX_CSS,/opacity:min\(\.95,calc\(\.8 \* var\(--otl-fx-strength,1\)\)\)/);assert.match(AVATAR_FX_CSS,/translateX\(calc\(-80% \/ var\(--otl-fx-size,1\)\)\)/);
});
test('static shapes apply size and true strength above 100 while retaining fixed star count and baseline values',()=>{
 const{document}=parseHTML('<html><body></body></html>');
 for(const kind of['sparkle','breathe','sweep'])for(const size of[50,100,200])for(const strength of[25,100,200]){const v={...fx,kind,size,strength},root=createAvatarFxNode(document,v,{owned:false});styleStaticAvatarFx(root,v);assert.equal(root.children.length,3);const first=root.firstElementChild;
  const expected=Math.min(.95,{sparkle:.55,breathe:.16,sweep:.12}[kind]*strength/100);assert.ok(Math.abs(Number(first.style.opacity)-expected)<1e-8);
  if(kind==='sparkle'){assert.equal(first.style.width,9*size/100+'%');assert.equal(first.style.maxWidth,20*size/100+'px');assert.equal(first.style.transform,'scale(.8)');}
  if(kind==='breathe')assert.ok(first.style.background.includes('transparent '+72*size/100+'%'));
  if(kind==='sweep'){assert.equal(first.style.width,52*size/100+'%');const center=Number(first.style.left.slice(0,-1))+Number(first.style.width.slice(0,-1))/2;assert.ok(Math.abs(center-33.8)<1e-8);}
 }
});
test('sweep compensates its own width so all sizes traverse the whole avatar with original nine-second cadence',()=>{
 for(const size of[.5,1,2]){const width=.52*size,start=-.65+width*(-.8/size),end=-.65+width*(3.9/size),staticCenter=-.65+width*(1.9/size-.5)+width/2;assert.ok(Math.abs(start+1.066)<1e-10);assert.ok(Math.abs(end-1.378)<1e-10);assert.ok(start+width<0);assert.ok(end>1);assert.ok(Math.abs(staticCenter-.338)<1e-10);}
 assert.match(AVATAR_FX_CSS,/otl-fx-sweep 9s/);assert.match(AVATAR_FX_CSS,/0%,72%/);
});
