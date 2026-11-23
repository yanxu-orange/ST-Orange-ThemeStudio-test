import {frameAssetUrl} from './avatar-frame-pairs.mjs';
import {FRAME_MASK_DATA} from './avatar-frame-mask-data.mjs';

export const MASK_FINISH_DEFAULTS=Object.freeze({feather:0,fade:'none',start:40});
// A small shared cache holds immutable image strings, never nodes or per-message canvases.
export function createMaskCache(maxEntries=4,maxBytes=8*1024*1024){
 const entries=new Map();let bytes=0;
 return {get(key){const item=entries.get(key);if(!item)return;entries.delete(key);entries.set(key,item);return item.value;},set(key,value){const cost=(key.length+value.length)*2;if(cost>maxBytes)return value;const old=entries.get(key);if(old){bytes-=old.cost;entries.delete(key);}while(entries.size&&(entries.size>=maxEntries||bytes+cost>maxBytes)){const first=entries.keys().next().value;bytes-=entries.get(first).cost;entries.delete(first);}entries.set(key,{value,cost});bytes+=cost;return value;},get size(){return entries.size;},get bytes(){return bytes;}};
}
const cache=createMaskCache();
const svgUrl=svg=>'data:image/svg+xml,'+encodeURIComponent(svg);
export function maskSource(mask){
 if(mask.kind==='none')return '';
 if(mask.kind==='frame')return frameAssetUrl(mask.image,'mask');
 if(mask.kind==='custom')return mask.image;
 const shape=mask.kind==='diamond'?'<path d="M50 0L100 50L50 100L0 50Z" fill="white"/>':`<ellipse cx="50" cy="50" rx="${mask.kind==='circle'?50:38}" ry="50" fill="white"/>`;
 return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${shape}</svg>`);
}
export function pngMaskSize(source){
 // Only IHDR is needed; do not decode a multi-megabyte upload on every style pass.
 try{const s=atob(source.slice('data:image/png;base64,'.length,'data:image/png;base64,'.length+44));if(s.slice(1,4)!=='PNG'||s.slice(12,16)!=='IHDR')return null;const u=i=>((s.charCodeAt(i)*16777216)+(s.charCodeAt(i+1)<<16)+(s.charCodeAt(i+2)<<8)+s.charCodeAt(i+3));const width=u(16),height=u(20);return width>0&&height>0?{width,height}:null;}catch{return null;}
}
function softenedSvg(width,height,content,feather){
 const r=Math.min(width,height)*feather/100;
 return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><filter id="soft" x="0" y="0" width="${width}" height="${height}" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feMorphology in="SourceAlpha" operator="erode" radius="${r/2}"/><feGaussianBlur stdDeviation="${r/3}"/></filter></defs><g filter="url(#soft)">${content}</g></svg>`);
}
export function softenedMaskSource(mask,feather){
 if(!feather||mask.kind==='none')return maskSource(mask);
 const key=`shape:${mask.kind}:${feather}:${mask.image}`,cached=cache.get(key);if(cached)return cached;
 let width=100,height=100,content;
 if(mask.kind==='custom'||mask.kind==='frame'){
  const source=mask.kind==='frame'?FRAME_MASK_DATA[mask.image]:mask.image,size=pngMaskSize(source);
  if(!source||!size)return maskSource(mask);({width,height}=size);content=`<image href="${source}" width="${width}" height="${height}"/>`;
 }else content=mask.kind==='diamond'?'<path d="M50 0L100 50L50 100L0 50Z" fill="white"/>':`<ellipse cx="50" cy="50" rx="${mask.kind==='circle'?50:38}" ry="50" fill="white"/>`;
 return cache.set(key,softenedSvg(width,height,content,feather));
}
export function softRectangleMask(width,height,radius,topOnly,feather){
 if(!(width>0&&height>0&&feather>0))return '';
 // Normalize the longer edge, so equivalent scaled geometry shares one cache entry.
 const scale=1000/Math.max(width,height),round=n=>Math.round(n*10000)/10000;
 width=round(width*scale);height=round(height*scale);radius=round(Math.min(radius*scale,width/2,height/2));
 const key=`rect:${width}:${height}:${radius}:${topOnly}:${feather}`,cached=cache.get(key);if(cached)return cached;
 const content=topOnly?`<path d="M0 ${height}V${radius}A${radius} ${radius} 0 0 1 ${radius} 0H${width-radius}A${radius} ${radius} 0 0 1 ${width} ${radius}V${height}Z" fill="white"/>`:`<rect width="${width}" height="${height}" rx="${radius}" fill="white"/>`;
 return cache.set(key,softenedSvg(width,height,content,feather));
}
export function avatarRectangleMask(effects,photo,fill,radius,geometry){
 if(!(effects.maskFinish?.feather>0)||effects.mask.kind!=='none')return '';
 return softRectangleMask(geometry.photoWidth,geometry.photoHeight,effects.frame?0:fill.enabled?radius:photo.radius,fill.enabled,effects.maskFinish.feather);
}
export function avatarMaskCss(effects,fill,rectangleSource=''){
 const finish=effects.maskFinish||MASK_FINISH_DEFAULTS,mask=softenedMaskSource(effects.mask,finish.feather),parts=[];
 if(mask)parts.push(`url("${mask}")`);
 else if(finish.feather>0)parts.push(rectangleSource?`url("${rectangleSource}")`:'var(--otl-avatar-shape-mask)');
 if(fill.enabled&&fill.gradient)parts.push(`linear-gradient(to bottom,#000 ${fill.start}%,rgb(0 0 0 / ${1-fill.opacity}) 100%)`);
 if(finish.fade!=='none'&&finish.start<100){const direction={down:'bottom',left:'left',right:'right'}[finish.fade];parts.push(`linear-gradient(to ${direction},#000 ${finish.start}%,transparent 100%)`);}
 return parts.join(',')||'none';
}
