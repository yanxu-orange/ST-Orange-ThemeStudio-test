import test from 'node:test';import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {createSchemeModel} from './scheme-model.mjs';
import {chooseAvatarFx,chooseAvatarFrame,effectSettings,avatarEffectRules} from './avatar-effects.mjs';
import {validateAvatarFx,AVATAR_FX_CSS,avatarSnowTile} from './avatar-fx.mjs';
import {createAvatarFxRuntime} from './avatar-fx-runtime.mjs';
import {snapshotDraft} from './draft-snapshot.mjs';
import {captureCombination,applyCombination} from './region-combinations.mjs';
import {enableHeaderCanvas} from './header-canvas.mjs';
import {createCombinationPreview} from './combination-preview.mjs';
const model=createSchemeModel(),base=()=>model.validate(structuredClone(model.templates.blank));
const fx=(kind='sparkle',motion=true)=>({kind,motion,color:'#bcaadd'});
test('old schemes preserve exact objects; fx is optional, role isolated, together copied and explicitly removable',()=>{
 const c=base(),before=snapshotDraft(c);assert.equal(c.avatarEffects,undefined);assert.deepEqual(model.validate(c),before);
 c.avatarDesign='separate';chooseAvatarFx(c,'ai','sparkle');assert.equal(c.avatarEffects.user.fx,undefined);assert.deepEqual(c.avatarEffects.ai.fx,{kind:'sparkle',motion:true,color:'#ffffff'});
 c.avatarEffects.ai.fx.color='#bcaadd';c.avatarEffects.ai.fx.motion=false;chooseAvatarFx(c,'ai','sweep');assert.deepEqual(c.avatarEffects.ai.fx,fx('sweep',false));
 c.avatarDesign='unified';chooseAvatarFx(c,'ai','breathe');assert.deepEqual(c.avatarEffects.ai.fx,c.avatarEffects.user.fx);assert.notEqual(c.avatarEffects.ai.fx,c.avatarEffects.user.fx);
 chooseAvatarFx(c,'ai','');assert.equal(c.avatarEffects.ai.fx,undefined);assert.equal(c.avatarEffects.user.fx,undefined);assert.deepEqual(model.validate(c),c);
});
test('fx validation rejects malformed fields, prototype names, nonboolean motion and unsafe colors',()=>{
 for(const v of [null,[],{...fx(),extra:1},{...fx(),kind:'__proto__'},{...fx(),kind:'constructor'},{...fx(),motion:'false'},{...fx(),color:'red'},{...fx(),color:'#fff;display:none'}, {kind:'sweep',color:'#ffffff'}])assert.throws(()=>validateAvatarFx(v));
 const c=base();chooseAvatarFx(c,'ai','sparkle');c.avatarEffects.ai.fx.motion='true';assert.throws(()=>model.validate(c));
});
test('fx preserves frame/mask/layers and survives JSON, snapshots and combination round trips',()=>{
 const c=base();chooseAvatarFrame(c,'ai','frame-double');const layers=snapshotDraft(c.layers);chooseAvatarFx(c,'ai','sweep');c.avatarEffects.ai.fx=fx('sweep',false);
 const copy=model.validate(JSON.parse(JSON.stringify(c)));assert.deepEqual(copy,c);assert.deepEqual(snapshotDraft(c),c);assert.deepEqual(c.layers,layers);
 const combo=captureCombination(c,'header','settings'),round=applyCombination(base(),combo,'settings',{moveNative:true});assert.deepEqual(model.validate(round).avatarEffects.ai,c.avatarEffects.ai);
 chooseAvatarFx(c,'ai','');assert.equal(c.avatarEffects.ai.frame.id,'frame-double');assert.equal(c.avatarEffects.ai.mask.image,'frame-double');
});
test('fx geometry shares avatar dimensions transforms mask and corner radius across canvas/fill; shared CSS only once',()=>{
 for(const canvas of[false,true])for(const fill of[false,true]){let c=base();if(canvas)c=enableHeaderCanvas(c);chooseAvatarFx(c,'ai','sweep');chooseAvatarFrame(c,'ai','frame-double');c.avatarFill.ai.enabled=fill;c.photos.ai.rotation=11;effectSettings(c).scale=130;const css=avatarEffectRules('.mes',c);assert.equal(css.split('@keyframes otl-fx-star').length,2);assert.match(css,/mesAvatarWrapper > \.otl-avatar-fx/);assert.match(css,/frame-double-mask.png/);assert.match(css,/overflow:hidden/);assert.match(css,/prefers-reduced-motion/);assert.match(css,/transform-origin:50% 100%/);assert.doesNotMatch(AVATAR_FX_CSS,/filter:blur|box-shadow:|requestAnimationFrame/);}
 const c=base();chooseAvatarFx(c,'ai','sweep');c.photos.ai.radius=45;assert.match(avatarEffectRules('.mes',c),/border-radius:45px!important;color:/);assert.match(AVATAR_FX_CSS,/data-fx-motion=false/);c.avatarFill.ai.enabled=true;c.radius=24;assert.match(avatarEffectRules('.mes',c),/border-radius:24px 24px 0 0!important;color:/);
 const {document}=parseHTML('<html><body></body></html>');const preview=createCombinationPreview(document,c,{region:'header'});assert.equal(preview.querySelectorAll('.otl-avatar-fx-preview').length,1);assert.equal(preview.querySelector('.otl-avatar-fx-preview').dataset.fxMotion,'false');
});
test('large custom mask strings are emitted once per role and shared by avatar and FX including webkit declarations',()=>{
 const c=base();c.avatarDesign='separate';chooseAvatarFx(c,'ai','sweep');chooseAvatarFx(c,'user','breathe');
 const ai='data:image/png;base64,'+'A'.repeat(65536),user='data:image/png;base64,'+'B'.repeat(65536);c.avatarEffects.ai.mask={kind:'custom',image:ai};c.avatarEffects.user.mask={kind:'custom',image:user};model.validate(c);
 const css=avatarEffectRules('.mes',c);assert.equal(css.split(ai).length-1,1);assert.equal(css.split(user).length-1,1);assert.ok(css.includes('[is_user="false"] > .mesAvatarWrapper{--otl-avatar-effect-mask:url("'+ai+'")'));assert.ok(css.includes('[is_user="true"] > .mesAvatarWrapper{--otl-avatar-effect-mask:url("'+user+'")'));assert.match(css,/-webkit-mask-image:var\(--otl-avatar-effect-mask\)/);
});
function env({io=true}={}){
 const {document}=parseHTML('<html><body></body></html>');let hidden=false;Object.defineProperty(document,'hidden',{get:()=>hidden});const instances=[];
 class IO{constructor(cb){this.cb=cb;this.targets=new Set();instances.push(this);}observe(n){this.targets.add(n);}unobserve(n){this.targets.delete(n);}disconnect(){this.targets.clear();}emit(entries){this.cb(entries.map(([target,isIntersecting])=>({target,isIntersecting})));}}
 const runtime=createAvatarFxRuntime({document,IntersectionObserver:io?IO:null});
 const add=()=>{const msg=document.createElement('div'),parent=document.createElement('div');msg.append(parent);document.body.append(msg);return{msg,parent};};
 return{document,runtime,instances,add,hidden:v=>{hidden=v;document.dispatchEvent(new document.defaultView.Event('visibilitychange'));}};
}
test('shared IO only plays intersecting dynamic overlays and pauses hidden document without changing geometry',()=>{
 const e=env(),nodes=[];for(let i=0;i<30;i++){const {msg,parent}=e.add();nodes.push(e.runtime.sync(msg,parent,fx()));}
 assert.equal(e.instances.length,1);assert.equal(e.instances[0].targets.size,30);assert.equal(e.document.querySelectorAll('.otl-avatar-fx').length,30);assert.equal(e.document.querySelectorAll('.otl-avatar-fx>span').length,90);
 e.instances[0].emit(nodes.map((n,i)=>[n,i<2]));assert.equal(e.document.querySelectorAll('[data-fx-play=true]').length,2);
 e.hidden(true);assert.equal(e.document.querySelectorAll('[data-fx-play=true]').length,0);e.hidden(false);assert.equal(e.document.querySelectorAll('[data-fx-play=true]').length,2);
 e.instances[0].emit([[nodes[0],false],[nodes[2],true]]);assert.equal(nodes[0].dataset.fxPlay,'false');assert.equal(nodes[2].dataset.fxPlay,'true');e.runtime.stop();assert.equal(e.document.querySelectorAll('.otl-avatar-fx').length,0);assert.equal(e.instances[0].targets.size,0);
});
test('stable sync performs no DOM writes; switching/static/off never stacks nodes and disconnects',()=>{
 const e=env(),{msg,parent}=e.add(),node=e.runtime.sync(msg,parent,fx());e.instances[0].emit([[node,true]]);let writes=0;const setter=node.setAttribute.bind(node);node.setAttribute=(...args)=>{writes++;setter(...args);};
 for(let i=0;i<20;i++)e.runtime.sync(msg,parent,fx());assert.equal(writes,0);assert.equal(parent.children.length,1);assert.equal(node.children.length,3);
 e.runtime.sync(msg,parent,fx('sweep',false));assert.equal(node.dataset.fxMotion,'false');assert.equal(node.dataset.fxPlay,'false');assert.equal(e.instances[0].targets.size,0);assert.equal(parent.children.length,1);
 e.runtime.sync(msg,parent,undefined);assert.equal(parent.children.length,0);assert.equal(e.runtime.count,0);e.runtime.sync(msg,parent,fx('breathe'));assert.equal(parent.children.length,1);e.runtime.stop();assert.equal(parent.children.length,0);
});
test('missing IO degrades to static; hidden native avatar and replaced parent clean old overlay',()=>{
 const e=env({io:false}),{msg,parent}=e.add(),node=e.runtime.sync(msg,parent,fx('sweep'));assert.equal(node.dataset.fxPlay,'false');assert.equal(node.dataset.fxMotion,'false');assert.equal(e.instances.length,0);
 const next=e.document.createElement('div');msg.append(next);e.runtime.sync(msg,next,fx());assert.equal(parent.children.length,0);assert.equal(next.children.length,1);e.runtime.sync(msg,next,fx(),true);assert.equal(next.children.length,0);e.runtime.stop();
});

test('snow texture preserves density, shape, color and width limits without stretching flakes',()=>{
 for(const density of [3,6,12]){
  const url=avatarSnowTile({...fx('snow'),density,size:150});
  const svg=decodeURIComponent(url.slice('url("data:image/svg+xml,'.length,-2));
  assert.match(svg,/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="100%" height="100%" fill="#bcaadd">/);
  assert.equal([...svg.matchAll(/<polygon /g)].length,Math.ceil(density/2));
  assert.equal([...svg.matchAll(/<circle /g)].length,Math.floor(density/2));
  assert.equal([...svg.matchAll(/preserveAspectRatio="xMinYMin meet"/g)].length,density);
  assert.match(svg,/width:clamp\(3px,5\.25%,15px\)/);
  assert.match(svg,/width:clamp\(2px,2\.85%,8\.25px\)/);
 }
 const large=decodeURIComponent(avatarSnowTile({...fx('snow'),size:200}));
 assert.match(large,/width:clamp\(3px,7%,20px\)/);
 assert.match(large,/width:clamp\(2px,3\.8%,11px\)/);
 const c=base();c.avatarDesign='separate';
 chooseAvatarFx(c,'ai','snow');chooseAvatarFx(c,'user','float');
 effectSettings(c).fx.speed=200;effectSettings(c).fx.strength=150;
 let css=avatarEffectRules('.mes',c);
 assert.equal([...css.matchAll(/--otl-fx-snow-tile:url\("/g)].length,1);
 assert.match(css,/--otl-fx-strength:1\.5;--otl-fx-speed:2;/);
 assert.match(css,/@media\(prefers-reduced-motion:no-preference\)\{\s*\.otl-avatar-fx\[data-fx-kind=snow\]\[data-fx-motion=true\]>span\{display:none;animation:none!important\}/);
 assert.match(css,/@keyframes otl-fx-snow-tile\{to\{transform:translateY\(50%\)\}\}/);
 effectSettings(c).fx.motion=false;
 css=avatarEffectRules('.mes',c);
 assert.doesNotMatch(css,/--otl-fx-snow-tile:url\("/);
});
