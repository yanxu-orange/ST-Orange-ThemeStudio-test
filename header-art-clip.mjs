import {runLayoutPass} from './layout-pass.mjs';
// Clip each header artwork leaf independently, retaining its existing stacking order.
const finite=n=>Number.isFinite(n);
const pixels=(value,basis)=>{
 if(typeof value!=='string'||!/^[-+]?(?:\d*\.)?\d+(?:px|%)?$/.test(value.trim()))return null;
 const n=parseFloat(value);return value.trim().endsWith('%')?n*basis/100:n;
};
export function headerArtworkClipPolygon({width,height,x,y,rotation=0},regionWidth,regionHeight){
 if(![width,height,x,y,rotation,regionWidth,regionHeight].every(finite)||width<=0||height<=0||regionWidth<0||regionHeight<0)return null;
 const a=rotation*Math.PI/180,cos=Math.cos(a),sin=Math.sin(a),ox=width/2,oy=height/2;
 return [[-24,-24],[regionWidth+24,-24],[regionWidth+24,regionHeight],[-24,regionHeight]].map(([px,py])=>{
  const dx=px-x-ox,dy=py-y-oy;
  return `${Number((ox+cos*dx+sin*dy).toFixed(5))}px ${Number((oy-sin*dx+cos*dy).toFixed(5))}px`;
 }).join(',');
}
/** Call after assigning styles/layout and again on image load and temporary drag updates.
 * Region width is the interior width; height is total header height minus 24px.
 * Only the owned image's clip-path changes. No wrappers, model data, or z-index change.
 */
export function updateHeaderArtworkClip(...args){return runLayoutPass([headerArtworkClipLayout(...args)])[0];}
export function* headerArtworkClipLayout(node,layer,regionWidth,regionHeight){
 if(layer.anchor!=='header')return null;
 const polygon=yield()=>{
 const style=node.style,computed=node.ownerDocument?.defaultView?.getComputedStyle?.(node);
 const dimension=(key,basis)=>{
  const resolved=pixels(computed?.[key],basis),inline=pixels(style[key],basis);
  if(resolved>0)return resolved;if(inline>0)return inline;
  return Number(node[key==='width'?'offsetWidth':'offsetHeight'])||Number(node[key==='width'?'clientWidth':'clientHeight'])||0;
 };
 const width=dimension('width',regionWidth);let height=dimension('height',regionHeight);
 if(!height&&node.naturalWidth>0&&node.naturalHeight>0)height=width*node.naturalHeight/node.naturalWidth;
 const offset=(side,basis,fallback)=>pixels(style[side],basis)??fallback*(layer.offsetUnit==='percent'?basis/100:1);
 const horizontal=offset(layer.side,regionWidth,layer.x),vertical=offset(layer.vertical,regionHeight,layer.y);
 const x=layer.side==='right'?regionWidth-horizontal-width:horizontal,y=layer.vertical==='bottom'?regionHeight-vertical-height:vertical;
 return headerArtworkClipPolygon({width,height,x,y,rotation:layer.rotation},regionWidth,regionHeight);
 };
 // Unloaded/zero-sized artwork stays clipped until the caller's load/layout refresh.
 node.style.setProperty('clip-path',polygon?`polygon(${polygon})`:'inset(50%)','important');
 return polygon;
}
