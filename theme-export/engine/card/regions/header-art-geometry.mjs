import {rule} from '../../core/regions/shared.mjs';
export const legacyHeaderArt=l=>!l.rotation&&l.vertical==='top'&&l.widthUnit==='px'&&l.offsetUnit==='px'&&!l.heightPercent&&!l.imageSizing&&(l.kind!=='shape'||l.shape==='rectangle'&&l.heightUnit==='px');
export const headerArtNeedsNaturalRatio=l=>l.kind!=='shape'&&!l.imageSizing&&!l.heightPercent;
export const independentHeaderArt=l=>!!l.imageSizing||!!l.heightPercent||!!l.rotation;
export function headerArtBox(c,l,g,resource){
 const U=g.inner,V=`calc(${g.H} - ${g.P})`,percent=(n,basis)=>`calc(${n/100} * ${basis})`,w=l.widthUnit==='percent'?percent(l.width,U):g.length(l.width),s=l.imageSizing;
 let width=w,height,fit='100% 100%',position='center';
 if(l.kind==='shape')height=l.heightUnit==='percent'?percent(l.height,V):g.length(l.height);
 else if(s){const h=s.heightUnit==='percent'?percent(s.height,V):g.length(s.height);if(s.mode==='cover'){width=U;height=V;}else if(s.lockRatio){if(s.driver==='width')height=`calc(${width} / ${s.ratio})`;else{height=h;width=`calc(${height} * ${s.ratio})`;}}else height=h;fit=(s.mode==='cover'?'cover':s.fit)==='fill'?'100% 100%':s.mode==='cover'?'cover':s.fit;position=`${s.focalX}% ${s.focalY}%`;}
 else if(l.heightPercent){height=percent(l.heightPercent,V);fit='contain';position=`${l.side} ${l.vertical}`;}
 else height=`calc(${width} * ${resource.height/resource.width})`;
 const ox=l.offsetUnit==='percent'?percent(l.x,U):g.length(l.x),oy=l.offsetUnit==='percent'?percent(l.y,V):g.length(l.y),left=l.side==='right'?`calc(${g.P} + ${U} - ${ox} - ${width})`:`calc(${g.P} + ${ox})`,top=l.vertical==='bottom'?`calc(${g.H} - ${oy} - ${height})`:`calc(${g.P} + ${oy})`;
 const a=l.rotation*Math.PI/180,cos=Number(Math.cos(a).toFixed(12)),sin=Number(Math.sin(a).toFixed(12)),cx=`calc(${width} / 2)`,cy=`calc(${height} / 2)`;
 const clip=l.rotation?`polygon(${[['0px','0px'],[g.W,'0px'],[g.W,g.H],['0px',g.H]].map(([x,y])=>`calc(${cx} + ${cos} * (${x} - ${left} - ${cx}) + ${sin} * (${y} - ${top} - ${cy})) calc(${cy} - ${sin} * (${x} - ${left} - ${cx}) + ${cos} * (${y} - ${top} - ${cy}))`).join(',')})`:g.polygon(left,top);
 return {width,height,left,top,fit,position,clip};
}
export function headerArtLeafCss(selector,c,l,g,ctx,z){const field=ctx.firstField('layers.'+c.layers.indexOf(l)+'.'),box=headerArtBox(c,l,g,ctx.image(field));return rule(selector,{content:'""',position:'absolute',left:box.left,top:box.top,width:box.width,height:box.height,background:`${ctx.source(field)} ${box.position} / ${box.fit} no-repeat`,opacity:l.opacity,transform:l.rotation?`rotate(${l.rotation}deg)`:'none','transform-origin':'50% 50%','clip-path':box.clip,'pointer-events':'none','z-index':z});}
