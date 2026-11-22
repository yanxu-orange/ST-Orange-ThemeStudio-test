import {avatarScopeSelector} from './avatar-fill.mjs';
import {validEmbeddedImage} from './image-sources.mjs';
import {framePair,frameAssetUrl} from './avatar-frame-pairs.mjs';

export const EFFECT_DEFAULTS=Object.freeze({zoom:100,brightness:100,saturation:100,scale:100,mask:Object.freeze({kind:'none',image:''})});
export const MASK_KINDS=['none','circle','ellipse','diamond','custom','frame'];
export function effectSettings(c,user=false){return c.avatarEffects?.[user?'user':'ai']||structuredClone(EFFECT_DEFAULTS);}
export function validateAvatarEffects(raw){
 if(raw.avatarEffects===undefined){if(raw.version===12)throw Error('头像效果设置缺失');return undefined;}
 if(raw.version!==12)throw Error('头像效果需要新版方案格式');
 const v=raw.avatarEffects;if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).length!==2||Object.keys(v).some(k=>!['ai','user'].includes(k)))throw Error('头像效果分组无效');
 return Object.fromEntries(['ai','user'].map(role=>{
  const x=v[role];if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).length!==(x.frame===undefined?5:6)||Object.keys(x).some(k=>k!=='frame'&&!Object.hasOwn(EFFECT_DEFAULTS,k)))throw Error('头像效果字段无效');
  const out={};for(const [key,min,max]of [['zoom',100,300],['brightness',0,200],['saturation',0,200],['scale',25,300]]){if(!Number.isFinite(x[key])||x[key]<min||x[key]>max)throw Error('头像效果数值无效：'+key);out[key]=x[key];}
  const m=x.mask;if(!m||typeof m!=='object'||Array.isArray(m)||Object.keys(m).length!==2||!MASK_KINDS.includes(m.kind)||typeof m.image!=='string'||(m.kind==='frame'?!framePair(m.image):((m.image&&!/^data:image\/png;base64,/.test(m.image))||(m.image&&!validEmbeddedImage(m.image))||(m.kind==='custom'&&!m.image))))throw Error('头像遮罩无效');
  if(x.frame!==undefined){const f=x.frame;if(!f||typeof f!=='object'||Array.isArray(f)||Object.keys(f).length!==2||!framePair(f.id)||!/^#[a-f0-9]{6}$/i.test(f.color))throw Error('头像框无效');out.frame={id:f.id,color:f.color};}
  out.mask={kind:m.kind,image:m.image};return[role,out];
 }));
}
export function setAvatarEffects(c,scope,value){
 if(!c.avatarEffects)c.avatarEffects={ai:structuredClone(EFFECT_DEFAULTS),user:structuredClone(EFFECT_DEFAULTS)};
 c.version=12;c.avatarEffects[scope]=value;
 if(c.avatarDesign==='unified')c.avatarEffects[scope==='ai'?'user':'ai']=structuredClone(value);
}
export function hasAvatarEffects(c,user=false){const v=effectSettings(c,user);return !!v.frame||v.zoom!==100||v.brightness!==100||v.saturation!==100||v.scale!==100||v.mask.kind!=='none';}
export function chooseAvatarFrame(c,scope,id){
 const v=structuredClone(effectSettings(c,scope==='user'));
 if(id){if(!framePair(id))throw Error('头像框无效');v.frame={id,color:v.frame?.color||'#526f5b'};v.mask={kind:'frame',image:id};}
 else{delete v.frame;if(v.mask.kind==='frame')v.mask={kind:'none',image:''};}
 setAvatarEffects(c,scope,v);return v;
}
export function compositionScale(c,user=false){return effectSettings(c,user).scale/100;}
export function maskSource(mask){
 if(mask.kind==='none')return '';
 if(mask.kind==='frame')return frameAssetUrl(mask.image,'mask');
 if(mask.kind==='custom')return mask.image;
 const shape=mask.kind==='diamond'?'<path d="M50 0L100 50L50 100L0 50Z" fill="white"/>':`<ellipse cx="50" cy="50" rx="${mask.kind==='circle'?50:38}" ry="50" fill="white"/>`;
 return 'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${shape}</svg>`);
}
// Outer viewport owns the mask. The original native image alone owns crop and tone.
export function avatarEffectRules(q,c){
 if(!c.avatarEffects)return '';
 return ['ai','user'].map(role=>{
  const user=role==='user';if(!hasAvatarEffects(c,user))return '';const v=effectSettings(c,user),p=c.photos[role],f=c.avatarFill[role],s=avatarScopeSelector(q,role)+' > .mesAvatarWrapper > .avatar',image=s+'>img:not([data-otl-live-owned])',mask=maskSource(v.mask);
  const fade=f.enabled&&f.gradient?`linear-gradient(to bottom,#000 ${f.start}%,rgb(0 0 0 / ${1-f.opacity}) 100%)`:'',maskCss=[...(mask?[`url("${mask}")`]:[]),...(fade?[fade]:[])].join(',')||'none';
  const canvas=!!c.headerCanvas,px=n=>canvas?`calc(${n}px * var(--hc-scale))`:n+'px',transform=f.enabled?`scale(${v.scale/100})`:`translate(${px(p.x)},${px(-p.y)}) rotate(${p.rotation}deg) scale(${v.scale/100})`;
  const frame=v.frame?`${avatarScopeSelector(q,role)} > .mesAvatarWrapper::after{content:""!important;position:absolute!important;left:0!important;top:0!important;width:var(--ol-photo-width)!important;height:${f.enabled?'var(--sc-fill-height)':'var(--ol-photo-height)'}!important;transform:${transform}!important;transform-origin:50% 100%!important;transition:none!important;clip-path:polygon(var(--sc-avatar-clip))!important;background:${v.frame.color}!important;mask:url("${frameAssetUrl(v.frame.id)}") center/contain no-repeat!important;mask-mode:alpha!important;-webkit-mask:url("${frameAssetUrl(v.frame.id)}") center/contain no-repeat!important;pointer-events:none!important;z-index:3!important;border:0!important;border-radius:0!important;}`:'';
  return `${frame}\n${s}{transform:${transform}!important;transform-origin:50% 100%!important;${v.zoom!==100?'overflow:hidden!important;':''}mask-image:${maskCss}!important;mask-composite:intersect!important;mask-mode:alpha!important;mask-size:contain!important;mask-position:center!important;mask-repeat:no-repeat!important;-webkit-mask-image:${maskCss}!important;-webkit-mask-composite:source-in!important;-webkit-mask-size:contain!important;-webkit-mask-position:center!important;-webkit-mask-repeat:no-repeat!important;}
${image}{${v.frame?'border:0!important;border-radius:0!important;box-shadow:none!important;':''}${v.zoom!==100?`transform:scale(${v.zoom/100})!important;transform-origin:${f.x}% ${f.y}%!important;`:''}${v.brightness!==100||v.saturation!==100?`filter:brightness(${v.brightness}%) saturate(${v.saturation}%)!important;`:''}}${v.frame?`${s}{border-radius:0!important;transition:none!important;}`:''}`;
 }).join('\n');
}
