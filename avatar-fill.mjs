import {clone} from './layers.mjs';

export const FILL_DEFAULT={enabled:false,x:50,y:50,gradient:false,color:'#ffffff',opacity:1,start:40};
export function normalizeAvatarFill(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||![1,2,3,4,5,6,7,8,9,10].includes(raw.version))throw Error('方案版本不支持');
  const out=clone(raw);
  if(raw.version<10&&Object.hasOwn(raw,'avatarFill'))throw Error('旧方案不能包含铺满头像设置');
  if(raw.version===10&&(!raw.avatarFill||typeof raw.avatarFill!=='object'||Array.isArray(raw.avatarFill)||Object.keys(raw.avatarFill).length!==2||Object.keys(raw.avatarFill).some(k=>!['ai','user'].includes(k))))throw Error('铺满头像分组无效');
  out.avatarFill={};
  for(const scope of ['ai','user']){
    const v=raw.version<10?{...FILL_DEFAULT}:raw.avatarFill[scope];
    if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).length!==Object.keys(FILL_DEFAULT).length||Object.keys(v).some(k=>!Object.hasOwn(FILL_DEFAULT,k))||typeof v.enabled!=='boolean'||typeof v.gradient!=='boolean')throw Error('铺满头像开关无效');
    const d={enabled:v.enabled,gradient:v.gradient};
    for(const [k,min,max]of [['x',0,100],['y',0,100],['opacity',0,1],['start',0,100]]){if(!Number.isFinite(v[k])||v[k]<min||v[k]>max)throw Error('铺满头像参数无效');d[k]=v[k];}
    if(typeof v.color!=='string'||!/^#[a-f0-9]{6}$/i.test(v.color))throw Error('渐变颜色无效');d.color=v.color;out.avatarFill[scope]=d;
  }
  out.version=10;return out;
}
export function fillSettings(c,user=false){return c.avatarFill?.[user?'user':'ai']||FILL_DEFAULT;}
// The exact same crop and overlay declarations are used in preview and live.
export function fillImageRules(image,overlay,v,radius){
  const color=v.color+Math.round(v.opacity*255).toString(16).padStart(2,'0');
  return `${image}{object-fit:cover!important;object-position:${v.x}% ${v.y}%!important;border:0!important;outline:0!important;box-shadow:none!important;transform:none!important;border-radius:${radius}px ${radius}px 0 0!important;}
${overlay}::after{content:${v.gradient?'""':'none'}!important;position:absolute!important;inset:0!important;pointer-events:none!important;z-index:3!important;border-radius:${radius}px ${radius}px 0 0!important;background:linear-gradient(to bottom,transparent ${v.start}%,${color} 100%)!important;}`;
}
export function avatarFillRules(q,c,preview=false){
  return ['ai','user'].map(scope=>{
    const v=fillSettings(c,scope==='user');if(!v.enabled)return '';
    const s=q+(preview?'':'[data-otl-live-avatar-hidden=false]')+`[is_user="${scope==='user'}"]`,group=preview?s+' .otl-header>.otl-photo-group':s+'>.mesAvatarWrapper',photo=preview?group+'>.mesAvatarWrapper':group+'>.avatar',img=photo+'>img';
    return `${group}{left:0!important;top:0!important;transform:none!important;aspect-ratio:auto!important;}
${photo}{width:100%!important;height:var(--sc-fill-height)!important;aspect-ratio:auto!important;border:0!important;outline:0!important;box-shadow:none!important;transform:none!important;border-radius:0!important;}
${preview?group:photo}{height:var(--sc-fill-height)!important;}
${fillImageRules(img,photo,v,c.radius)}`;
  }).join('\n');
}
