// Saved geometry is expressed in design pixels. Projection is disposable and never saved.
import {cardPadding} from './body-card.mjs';
export const canvasEnabled=c=>[11,12].includes(c.version)&&!!c.headerCanvas;
export function validateHeaderCanvas(raw){
 if(raw.headerCanvas===undefined){if(raw.version===11)throw Error('制作画布缺失');return undefined;}
 const v=raw.headerCanvas;if(![11,12].includes(raw.version)||!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).length!==1||!Number.isFinite(v.width)||v.width<200||v.width>2000)throw Error('制作画布无效');
 return {width:v.width};
}
export function headerCanvasScale(c,actualWidth){return canvasEnabled(c)?Math.max(1,actualWidth)/c.headerCanvas.width:1;}
export function designInnerWidth(c){return Math.max(1,c.headerCanvas.width-cardPadding(c)*2);}
export function enableHeaderCanvas(c,width=600){
 const out=structuredClone(c),p=cardPadding(out),inner=Math.max(1,width-p*2);
 out.version=out.avatarEffects?12:11;out.headerCanvas={width};
 for(const v of [...Object.values(out.textItems),...out.captions]){v.x=(v.x+(out.textInset||0))*inner/100;v.y+=out.textTop||0;if(v.width!=='auto')v.width=v.width*inner/100;}
 for(const group of [out.metadata?.unified,out.metadata?.roles.ai,out.metadata?.roles.user])for(const v of Object.values(group||{}))if(v?.region==='header'){v.x=v.x*inner/100;if(v.width!=='auto')v.width=v.width*inner/100;}
 out.textInset=0;out.textTop=0;
 for(const photo of Object.values(out.photos)){if(photo.widthUnit==='percent'){photo.size=photo.size*inner/100;photo.widthUnit='px';}}
 for(const layer of out.layers.filter(l=>['header','avatar'].includes(l.anchor))){
  const photo=out.photos[layer.scope==='user'?'user':'ai'],pw=photo.size,ph=photo.height==='auto'?pw/Number(photo.ratio):photo.height;
  const w=layer.anchor==='avatar'?pw:inner,h=layer.anchor==='avatar'?ph:out.headerHeight-p;
  if(layer.widthUnit==='percent'){layer.width=layer.width*w/100;layer.widthUnit='px';}
  if(layer.offsetUnit==='percent'){layer.x=layer.x*w/100;layer.y=layer.y*h/100;layer.offsetUnit='px';}
  if(layer.kind==='shape'&&layer.heightUnit==='percent'){layer.height=layer.height*h/100;layer.heightUnit='px';}
  if(layer.imageSizing?.heightUnit==='percent'){layer.imageSizing.height=layer.imageSizing.height*h/100;layer.imageSizing.heightUnit='px';}
 }
 return out;
}
export function projectHeaderConfig(c,actualWidth){
 if(!canvasEnabled(c))return c;
 // Copy geometry that this pass changes; embedded image strings stay shared and immutable.
 const out={...c,textItems:structuredClone(c.textItems),captions:structuredClone(c.captions),metadata:structuredClone(c.metadata),photos:Object.fromEntries(Object.entries(c.photos).map(([key,p])=>[key,{...p}])),layers:c.layers.map(l=>['header','avatar'].includes(l.anchor)?{...l,...(l.imageSizing?{imageSizing:{...l.imageSizing}}:{})}:l)},s=headerCanvasScale(c,actualWidth),inner=designInnerWidth(c),scale=(o,keys)=>{for(const k of keys)if(Number.isFinite(o[k]))o[k]*=s;};
 out.cardPadding=cardPadding(c)*s;scale(out,['headerHeight','userHeaderHeight','nameSize','timeSize']);
 for(const v of [...Object.values(out.textItems),...out.captions]){v.x=v.x/inner*100;if(v.width!=='auto')v.width=v.width/inner*100;v.y*=s;if(Number.isFinite(v.size))v.size*=s;}
 for(const group of [out.metadata?.unified,out.metadata?.roles.ai,out.metadata?.roles.user])for(const v of Object.values(group||{}))if(v?.region==='header'){v.x=v.x/inner*100;v.y*=s;if(v.width!=='auto')v.width=v.width/inner*100;v.style.size*=s;if(v.prefixStyle?.size!=null)v.prefixStyle.size*=s;}
 for(const p of Object.values(out.photos)){if(p.widthUnit==='px')p.size*=s;scale(p,['height','radius','frameWidth','x','y']);}
 if(c.avatarEffects)out.avatarEffects=Object.fromEntries(Object.entries(c.avatarEffects).map(([role,effects])=>[role,effects.reflection?{...effects,reflection:{...effects.reflection,gap:effects.reflection.gap*s}}:effects]));
 for(const layer of out.layers.filter(l=>['header','avatar'].includes(l.anchor))){if(layer.widthUnit==='px')layer.width*=s;if(layer.offsetUnit==='px')scale(layer,['x','y']);if(layer.kind==='shape'&&layer.heightUnit==='px')scale(layer,['height']);if(layer.kind==='shape')scale(layer,['cornerRadius','borderWidth']);if(layer.imageSizing?.heightUnit==='px')layer.imageSizing.height*=s;}
 return out;
}
export function headerCanvasRules(q,head,c){
 if(!canvasEnabled(c))return '';
 const pad=cardPadding(c),v=n=>`calc(${n}px * var(--hc-scale))`;
 let css=`${q} > .mesAvatarWrapper{left:${v(pad)}!important;top:calc(${v(pad)} + var(--ol-photo-top) + var(--sc-reserve-top,0px))!important;}\n${head} .otl-scene-art{left:${v(pad)}!important;top:${v(pad)}!important;width:calc(100% - ${v(pad*2)})!important;}\n`;
 const meta=`${head} [data-otl-live-meta]`;
 css+=`${meta} > .name_text{font-size:${v(c.nameSize)}!important}${meta} > .timestamp{font-size:${v(c.timeSize)}!important}`;
 for(const cap of c.captions)css+=`${meta} [data-caption-id="${cap.id}"].otl-live-caption{font-size:${v(cap.size)}!important}`;
 const m=c.metadata;if(m)for(const scope of m.design==='separate'?['ai','user']:['unified'])for(const key of ['name','time']){const item=(scope==='unified'?m.unified:m.roles[scope])[key];if(item?.region!=='header')continue;const sel=q+(scope==='unified'?'':`[is_user="${scope==='user'}"]`)+` > .mes_block > .ch_name [data-otl-live-meta] > .${key==='name'?'name_text':'timestamp'}[data-otl-metadata="${key}"]`;css+=`${sel}{font-size:${v(item.style.size)}!important}`;if(key==='time')css+=`${q+(scope==='unified'?'':`[is_user="${scope==='user'}"]`)} > .mes_block > .ch_name [data-otl-live-meta] > .timestamp-icon[data-otl-metadata="time-icon"]{font-size:${v(item.style.size)}!important}`;if(key==='name'&&item.prefixStyle?.size!=null)css+=`${sel}::before{font-size:${v(item.prefixStyle.size)}!important}`;}
 return css;
}
