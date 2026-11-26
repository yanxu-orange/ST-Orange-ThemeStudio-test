import {avatarMaskCss} from './avatar-mask-style.mjs';
export {maskSource} from './avatar-mask-style.mjs';
import {AVATAR_FX_CSS,validateAvatarFx,avatarFxTuning,avatarSnowTile} from './avatar-fx.mjs';
import {avatarScopeSelector} from './avatar-fill.mjs';
import {validEmbeddedImage} from './image-sources.mjs';
import {framePair,frameAssetUrl} from './avatar-frame-pairs.mjs';
import {validateReflection,REFLECTION_CSS} from './avatar-reflection.mjs';

export const EFFECT_DEFAULTS=Object.freeze({zoom:100,brightness:100,saturation:100,scale:100,mask:Object.freeze({kind:'none',image:''})});
export const MASK_KINDS=['none','circle','ellipse','diamond','custom','frame'];
export function effectSettings(c,user=false){return c.avatarEffects?.[user?'user':'ai']||structuredClone(EFFECT_DEFAULTS);}
export function validateAvatarEffects(raw){
 if(raw.avatarEffects===undefined){if(raw.version===12)throw Error('头像效果设置缺失');return undefined;}
 if(raw.version!==12)throw Error('头像效果需要新版方案格式');
 const v=raw.avatarEffects;if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).length!==2||Object.keys(v).some(k=>!['ai','user'].includes(k)))throw Error('头像效果分组无效');
 return Object.fromEntries(['ai','user'].map(role=>{
  const x=v[role];if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).length!==(5+Number(x.frame!==undefined)+Number(x.fx!==undefined)+Number(x.maskFinish!==undefined)+Number(x.reflection!==undefined))||Object.keys(x).some(k=>!['frame','fx','maskFinish','reflection'].includes(k)&&!Object.hasOwn(EFFECT_DEFAULTS,k)))throw Error('头像效果字段无效');
  const out={};for(const [key,min,max]of [['zoom',100,300],['brightness',0,200],['saturation',0,200],['scale',25,300]]){if(!Number.isFinite(x[key])||x[key]<min||x[key]>max)throw Error('头像效果数值无效：'+key);out[key]=x[key];}
  const m=x.mask;if(!m||typeof m!=='object'||Array.isArray(m)||Object.keys(m).length!==2||!MASK_KINDS.includes(m.kind)||typeof m.image!=='string'||(m.kind==='frame'?!framePair(m.image):((m.image&&!/^data:image\/png;base64,/.test(m.image))||(m.image&&!validEmbeddedImage(m.image))||(m.kind==='custom'&&!m.image))))throw Error('头像遮罩无效');
  if(x.frame!==undefined){const f=x.frame;if(!f||typeof f!=='object'||Array.isArray(f)||Object.keys(f).length!==2||!framePair(f.id)||!/^#[a-f0-9]{6}$/i.test(f.color))throw Error('头像框无效');out.frame={id:f.id,color:f.color};}
  if(x.fx!==undefined)out.fx=validateAvatarFx(x.fx);
  if(x.reflection!==undefined)out.reflection=validateReflection(x.reflection);
  if(x.maskFinish!==undefined){const f=x.maskFinish;if(!f||typeof f!=='object'||Array.isArray(f)||Object.keys(f).length!==3||Object.keys(f).some(k=>!['feather','fade','start'].includes(k))||!Number.isFinite(f.feather)||f.feather<0||f.feather>20||!['none','down','left','right'].includes(f.fade)||!Number.isFinite(f.start)||f.start<0||f.start>100)throw Error('头像柔边与渐隐无效');out.maskFinish={feather:f.feather,fade:f.fade,start:f.start};}
  out.mask={kind:m.kind,image:m.image};return[role,out];
 }));
}
export function setAvatarEffects(c,scope,value){
 if(!c.avatarEffects)c.avatarEffects={ai:structuredClone(EFFECT_DEFAULTS),user:structuredClone(EFFECT_DEFAULTS)};
 c.version=12;c.avatarEffects[scope]=value;
 if(c.avatarDesign==='unified')c.avatarEffects[scope==='ai'?'user':'ai']=structuredClone(value);
}
export function hasAvatarEffects(c,user=false){const v=effectSettings(c,user);return !!v.reflection||!!v.frame||!!v.fx||!!(v.maskFinish&&(v.maskFinish.feather>0||v.maskFinish.fade!=='none'&&v.maskFinish.start<100))||v.zoom!==100||v.brightness!==100||v.saturation!==100||v.scale!==100||v.mask.kind!=='none';}
export function chooseAvatarFrame(c,scope,id){
 const v=structuredClone(effectSettings(c,scope==='user'));
 if(id){if(!framePair(id))throw Error('头像框无效');v.frame={id,color:v.frame?.color||'#526f5b'};v.mask={kind:'frame',image:id};}
 else{delete v.frame;if(v.mask.kind==='frame')v.mask={kind:'none',image:''};}
 setAvatarEffects(c,scope,v);return v;
}
export function chooseAvatarFx(c,scope,kind){
 const v=structuredClone(effectSettings(c,scope==='user'));
 if(kind)v.fx=validateAvatarFx({...v.fx,kind,motion:v.fx?.motion??true,color:v.fx?.color||'#ffffff'});else delete v.fx;
 setAvatarEffects(c,scope,v);return v;
}
export function compositionScale(c,user=false){return effectSettings(c,user).scale/100;}
// Outer viewport owns the mask. The original native image alone owns crop and tone.
export function avatarEffectRules(q,c){
 if(!c.avatarEffects)return '';
 return (['ai','user'].some(role=>c.avatarEffects[role]?.fx)?AVATAR_FX_CSS:'')+(['ai','user'].some(role=>c.avatarEffects[role]?.reflection)?REFLECTION_CSS:'')+['ai','user'].map(role=>{
  const user=role==='user';if(!hasAvatarEffects(c,user))return '';const v=effectSettings(c,user),p=c.photos[role],f=c.avatarFill[role],host=avatarScopeSelector(q,role)+' > .mesAvatarWrapper',nativeHost=host+':has(> .avatar > img:not([data-otl-live-owned]))',avatar=host+' > .avatar',nativeAvatar=avatar+':has(> img:not([data-otl-live-owned]))',s=v.mask.kind==='frame'||v.maskFinish?nativeAvatar:avatar,image=s+'>img:not([data-otl-live-owned])';
  const maskCss=avatarMaskCss(v,f);
  const canvas=!!c.headerCanvas,px=n=>canvas?`calc(${n}px * var(--hc-scale))`:n+'px',y=p.verticalAnchor==='bottom'?'var(--ol-photo-y)':px(-p.y),transform=f.enabled?`scale(${v.scale/100})`:`translate(${px(p.x)},${y}) rotate(${p.rotation}deg) scale(${v.scale/100})`;
  const sharedMask=!!v.fx||!!v.maskFinish||!!v.reflection,renderedMask=sharedMask?'var(--otl-avatar-effect-mask)':maskCss,maskOwner=sharedMask?`${v.mask.kind==='frame'||v.maskFinish||v.reflection?nativeHost:host}{--otl-avatar-effect-mask:${maskCss}!important;}`:'';
  const frame=v.frame?`${nativeHost}::after{content:""!important;position:absolute!important;left:0!important;top:0!important;width:var(--ol-photo-width)!important;height:${f.enabled?'var(--sc-fill-height)':'var(--ol-photo-height)'}!important;transform:${transform}!important;transform-origin:50% 100%!important;transition:none!important;clip-path:polygon(var(--sc-avatar-clip))!important;background:${v.frame.color}!important;mask:url("${frameAssetUrl(v.frame.id)}") center/contain no-repeat!important;mask-mode:alpha!important;-webkit-mask:url("${frameAssetUrl(v.frame.id)}") center/contain no-repeat!important;pointer-events:none!important;z-index:3!important;border:0!important;border-radius:0!important;}`:'';
  const tuning=v.fx?avatarFxTuning(v.fx):null;
  const snowTile=v.fx?.kind==='snow'&&v.fx.motion?`--otl-fx-snow-tile:${avatarSnowTile(v.fx)};`:'';
  const fx=v.fx?`${v.maskFinish?nativeHost:avatarScopeSelector(q,role)+' > .mesAvatarWrapper'} > .otl-avatar-fx{width:var(--ol-photo-width)!important;height:${f.enabled?'var(--sc-fill-height)':'var(--ol-photo-height)'}!important;transform:${transform}!important;transform-origin:50% 100%!important;clip-path:polygon(var(--sc-avatar-clip))!important;mask-image:${renderedMask}!important;mask-composite:intersect!important;mask-mode:alpha!important;mask-size:contain!important;mask-position:center!important;mask-repeat:no-repeat!important;-webkit-mask-image:${renderedMask}!important;-webkit-mask-composite:source-in!important;-webkit-mask-size:contain!important;-webkit-mask-position:center!important;-webkit-mask-repeat:no-repeat!important;${snowTile}--otl-fx-size:${tuning?.size};--otl-fx-strength:${tuning?.strength};--otl-fx-speed:${(v.fx.speed??100)/100};--otl-fx-height:${f.enabled?"var(--sc-fill-height)":"var(--ol-photo-height)"};border-radius:${v.frame?'0':f.enabled?`${c.radius}px ${c.radius}px 0 0`:px(p.radius)}!important;color:${v.fx.color}!important;}\n${s}{transition:none!important;}`:'';
  const r=v.reflection,reflection=r?`${nativeHost}>.otl-avatar-reflection{width:var(--ol-photo-width)!important;height:var(--ol-photo-height)!important;transform:${transform}!important;clip-path:polygon(var(--otl-reflection-clip))!important;--otl-reflection-opacity:${r.strength/100};--otl-reflection-origin:${f.x}% ${f.y}%;--otl-reflection-object:${f.enabled?f.x+"% "+f.y+"%":"50% 50%"};--otl-reflection-zoom:${v.zoom/100};--otl-reflection-brightness:${v.brightness/100};--otl-reflection-saturation:${v.saturation/100};}
${nativeHost}>.otl-avatar-reflection>.otl-reflection-window{top:var(--otl-reflection-top)!important;height:var(--otl-reflection-height)!important;}
${nativeHost}>.otl-avatar-reflection img{border:${p.enabled&&!f.enabled&&!v.frame?px(p.frameWidth):"0px"} solid transparent!important;}
${nativeHost}>.otl-avatar-reflection .otl-reflection-source{mask-image:${renderedMask}!important;-webkit-mask-image:${renderedMask}!important;mask-composite:intersect!important;-webkit-mask-composite:source-in!important;mask-mode:alpha!important;mask-size:contain!important;mask-position:center!important;mask-repeat:no-repeat!important;-webkit-mask-size:contain!important;-webkit-mask-position:center!important;-webkit-mask-repeat:no-repeat!important;border-radius:${v.frame?'0':f.enabled?`${c.radius}px ${c.radius}px 0 0`:px(p.radius)}!important;}`:'';
  return `${maskOwner}\n${frame}\n${fx}\n${reflection}\n${s}{transform:${transform}!important;transform-origin:50% 100%!important;${v.zoom!==100?'overflow:hidden!important;':''}mask-image:${renderedMask}!important;mask-composite:intersect!important;mask-mode:alpha!important;mask-size:contain!important;mask-position:center!important;mask-repeat:no-repeat!important;-webkit-mask-image:${renderedMask}!important;-webkit-mask-composite:source-in!important;-webkit-mask-size:contain!important;-webkit-mask-position:center!important;-webkit-mask-repeat:no-repeat!important;}
${image}{${v.frame?'border:0!important;border-radius:0!important;box-shadow:none!important;':''}${v.zoom!==100?`transform:scale(${v.zoom/100})!important;transform-origin:${f.x}% ${f.y}%!important;`:''}${v.brightness!==100||v.saturation!==100?`filter:brightness(${v.brightness}%) saturate(${v.saturation}%)!important;`:''}}${v.frame?`${nativeAvatar}{border-radius:0!important;transition:none!important;}`:''}`;
 }).join('\n');
}
