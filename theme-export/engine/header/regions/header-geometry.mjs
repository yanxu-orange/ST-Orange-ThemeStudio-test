import {resolveMetadata,metadataItem} from '../../../../native-metadata.mjs';
export const roleMatches=(item,role)=>item.scope==='both'||item.scope===role;
export function inverseRotate([x,y],angle){
 if(!angle)return [x,y];
 const radians=angle*Math.PI/180;
 const cos=Number(Math.cos(radians).toFixed(12)),sin=Number(Math.sin(radians).toFixed(12));
 return [`calc(${cos} * ${x} + ${sin} * ${y})`,`calc(${cos} * ${y} - ${sin} * ${x})`];
}
export function avatarClipPath(g,inverse){
 const corners=[['0px','0px'],[g.W,'0px'],[g.W,g.H],['0px',g.H]];
 return `polygon(${corners.map(corner=>inverse(corner).join(' ')).join(',')})`;
}
export function roleMetadata(c,role,key){
 const custom=resolveMetadata(c,role==='user')[key];
 return {value:custom||metadataItem(c,key),custom:!!custom,fontField:custom?`metadata.${c.metadata.design==='separate'?'roles.'+role:'unified'}.${key}.style.fontLink.url`:`textItems.${key}.fontLink.url`};
}
export function geometry(c,role){
 const canvas=!!c.headerCanvas,length=n=>canvas?`calc(${n} * var(--yj-header-unit))`:n+'px',W='var(--yj-card-width)',P=length(c.cardPadding),inner=`calc(${W} - ${length(c.cardPadding*2)})`,H=length(role==='user'&&c.userHeaderHeight!=null?c.userHeaderHeight:c.headerHeight),photo=c.photos[role];
 const point=(item,offsets=true)=>({left:canvas?length(c.cardPadding+item.x):`calc(${P} + ${inner} * ${(item.x+(offsets?c.textInset||0:0))/100})`,top:length(c.cardPadding+item.y+(offsets&&!canvas?c.textTop||0:0))});
 const textWidth=item=>item.width==='auto'?'max-content':canvas?length(item.width):`calc(${inner} * ${item.width/100})`;
 const maxWidth=item=>item.width==='auto'?inner:textWidth(item);
 const clip=(left,top,sx=1,clamp=false)=>{const edges=[`calc(0px - ${top})`,`calc(100% - (${W} - ${left}) / ${sx})`,`calc(100% - (${H} - ${top}))`,`calc((0px - ${left}) / ${sx})`];return `inset(${edges.map(x=>clamp?`max(0px,${x})`:x).join(' ')})`;};
 const polygon=(left,top)=>`polygon(calc(0px - ${left}) calc(0px - ${top}),calc(${W} - ${left}) calc(0px - ${top}),calc(${W} - ${left}) calc(${H} - ${top}),calc(0px - ${left}) calc(${H} - ${top}))`;
 const fill=!!c.avatarFill?.[role]?.enabled,photoWidth=fill?W:photo.widthUnit==='percent'?`calc(${inner} * ${photo.size/100})`:length(photo.size),photoHeight=fill?H:photo.height==='auto'?`calc(${photoWidth} / ${Number(photo.ratio)})`:length(photo.height),photoLeft=fill?'0px':length(c.cardPadding+photo.x);
 const bottom=!fill&&photo.verticalAnchor==='bottom';
 const photoTop=fill?'0px':bottom?`max(0px,${H} - ${photoHeight})`:length(c.cardPadding-photo.y);
 const photoShiftY=bottom?`calc(${photoTop} - ${P})`:length(-photo.y);
 // Inverse of translate + uniform scale around the portrait's bottom centre.
 const scaledPolygon=scale=>{const ox=`calc(${photoWidth} / 2)`,oy=photoHeight;return `polygon(${[['0px','0px'],[W,'0px'],[W,H],['0px',H]].map(([x,y])=>`calc(${ox} + (${x} - ${photoLeft} - ${ox}) / ${scale}) calc(${oy} + (${y} - ${photoTop} - ${oy}) / ${scale})`).join(',')})`;};
 const photoOrigin=[`calc(${photoWidth} / 2)`,photoHeight],photoOffset=[photoLeft,photoTop],photoAngle=fill?0:photo.rotation;
 const inversePhoto=(point,scale)=>{
  const offset=point.map((value,index)=>`calc(${value} - ${photoOffset[index]} - ${photoOrigin[index]})`);
  return inverseRotate(offset,photoAngle).map((value,index)=>`calc(${photoOrigin[index]} + ${value} / ${scale})`);
 };
 return {length,W,P,inner,H,point,textWidth,maxWidth,clip,polygon,photoWidth,photoHeight,photoLeft,photoTop,photoShiftY,fill,scaledPolygon,photoOrigin,photoAngle,inversePhoto};
}
