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
 return `${preview?group:photo}{transform:translate(${p.x}px,${-p.y}px) rotate(${p.rotation}deg) scale(${p.scale})!important;}${photo}{border-radius:${p.radius}px!important;}${img}{border-radius:${p.radius}px!important;object-position:${v.x}% ${v.y}%!important;}`;
}).join('\n');}
