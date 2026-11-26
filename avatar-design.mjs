import {canvasEnabled} from './header-canvas.mjs';
import {photoDimensions} from './photos.mjs';
// Runtime presentation and one-shot preview sources. Preview images never enter config.
export function readPreviewAvatars(document){
 const result={};for(const [scope,user]of [['ai','false'],['user','true']]){
  const messages=[...document.querySelectorAll(`#chat > .mes[is_user="${user}"]:not([data-orange-lab-fixture])`)];
  const img=messages.reverse().map(m=>m.querySelector('.mesAvatarWrapper .avatar img')).find(Boolean);
  const src=img?.currentSrc||img?.getAttribute('src');if(src)result[scope]=src;
 }return result;
}
export function avatarDesignRules(q,c,preview=false){return ['ai','user'].map(scope=>{
 const p=c.photos[scope],v=c.avatarFill[scope];if(v.enabled)return '';const s=q+`[is_user="${scope==='user'}"]`,group=s+' .otl-header>.otl-photo-group',photo=preview?group+'>.mesAvatarWrapper':s+'>.mesAvatarWrapper>.avatar',img=photo+(preview?'>img':'>img:not([data-otl-live-owned])');
 const canvas=canvasEnabled(c),px=n=>canvas?`calc(${n}px * var(--hc-scale))`:n+'px';
 const dimensions=photoDimensions(p,0),responsive=canvas||p.widthUnit==='percent',width=responsive?'var(--sc-photo-width)':dimensions.width+'px',height=responsive?'var(--sc-photo-height)':dimensions.height+'px';
 const y=p.verticalAnchor==='bottom'?'var(--ol-photo-y)':px(-p.y);
 return `${preview?group:photo}{width:${width}!important;height:${height}!important;aspect-ratio:${p.height!==undefined&&p.height!=='auto'?'auto':p.ratio}!important;transform:translate(${px(p.x)},${y}) rotate(${p.rotation}deg)!important;}${photo}{border:0!important;outline:0!important;box-shadow:none!important;border-radius:${px(p.radius)}!important;}${img}{box-sizing:border-box!important;border:${px(p.enabled?p.frameWidth:0)} solid ${p.frameColor}!important;outline:none!important;box-shadow:${p.shadow?`${px(1)} ${px(2)} ${px(3)} #6c7b962b`:'none'}!important;border-radius:${px(p.radius)}!important;transform:none!important;object-fit:cover!important;object-position:${v.x}% ${v.y}%!important;}`;
}).join('\n');}

