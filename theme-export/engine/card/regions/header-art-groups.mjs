import {regionEntries,regionZ} from '../../../../region-layers.mjs';
import {rule} from '../../core/regions/shared.mjs';
import {legacyHeaderArt,independentHeaderArt,headerArtBox,headerArtLeafCss} from './header-art-geometry.mjs';
import {avatarArtworkLeafCss} from './avatar-art-geometry.mjs';
import {headerTextStack} from '../../../../header-text-stack.mjs';
const matches=(v,role)=>v.scope==='both'||v.scope===role;
/** Only adjacent unit-opacity images share a paint plane. Text and native portraits remain independent. */
export function headerArtPlan(c,role){
 const images=c.layers.filter(l=>l.visible&&['header','avatar'].includes(l.anchor)&&matches(l,role));
 if(images.length<=2&&images.every(l=>l.anchor==='header'&&legacyHeaderArt(l)))return {legacy:true,planes:[],available:2};
 const planes=[];let current=[];
 const flush=()=>{if(current.length){planes.push({group:true,layers:current});current=[];}};
 for(const e of regionEntries(c,'header')){
  if(e.kind==='image'){
   if(!images.includes(e.item))continue;
   if(e.item.anchor==='header'&&e.item.opacity===1&&!independentHeaderArt(e.item))current.push(e.item);else{flush();planes.push({group:false,layers:[e.item]});}
  }else if(e.key==='avatar'||e.key==='name'||e.key==='time'||e.visible&&matches(e,role)&&e.item?.content?.trim())flush();
 }
 flush();
 const captions=c.captions.filter(t=>t.visible&&t.content.trim()&&matches(t,role)).length-Number(!!headerTextStack(c,role==='user')?.caption);
 // The card itself is free only when overall art has no claim on its first pseudo-element.
 const cardSlot=images.some(l=>l.anchor==='avatar')&&!c.layers.some(l=>l.visible&&l.anchor==='message'&&matches(l,role));
 return {legacy:false,planes,available:2+Math.max(0,4-captions)+Number(cardSlot),cardSlot};
}
export function groupedHeaderArtCss(c,ctx,role,g,slots,avatarSelector){
 const out=[],plan=headerArtPlan(c,role);
 for(const [index,plane]of plan.planes.entries()){
  const l=plane.layers[0],z=2*regionZ(c,'header','image:'+l.id),source=v=>ctx.source(ctx.firstField('layers.'+c.layers.indexOf(v)+'.'));
  if(l.anchor==='avatar'){out.push(avatarArtworkLeafCss(avatarSelector(slots[index]),c,l,role,g,ctx,z));continue;}
  const size=v=>{const image=ctx.image(ctx.firstField('layers.'+c.layers.indexOf(v)+'.'));return {width:g.length(v.width),height:g.length(v.kind==='shape'?v.height:v.width*image.height/image.width)};};
  if(!plane.group){
   if(!legacyHeaderArt(l)){out.push(headerArtLeafCss(slots[index],c,l,g,ctx,z));continue;}
   const s=size(l),left=l.side==='right'?`calc(${g.W} - ${g.length(c.cardPadding+l.x)} - ${s.width})`:g.length(c.cardPadding+l.x),top=g.length(c.cardPadding+l.y);
   out.push(rule(slots[index],{content:'""',position:'absolute',left,top,width:s.width,height:s.height,background:`${source(l)} center / 100% 100% no-repeat`,opacity:l.opacity,'clip-path':g.polygon(left,top),'pointer-events':'none','z-index':z}));continue;
  }
  const ordered=[...plane.layers].reverse();
  if(!ordered.every(legacyHeaderArt)){
   const box=v=>headerArtBox(c,v,g,ctx.image(ctx.firstField('layers.'+c.layers.indexOf(v)+'.')));
   out.push(rule(slots[index],{content:'""',position:'absolute',left:0,top:0,width:g.W,height:g.H,margin:0,padding:0,border:0,'box-sizing':'border-box','background-image':ordered.map(source).join(','),'background-size':ordered.map(v=>box(v).width+' '+box(v).height).join(','),'background-position':ordered.map(v=>'left '+box(v).left+' top '+box(v).top).join(','),'background-repeat':'no-repeat','background-origin':'border-box','background-clip':'border-box',opacity:1,'pointer-events':'none','z-index':z}));continue;
  }
  out.push(rule(slots[index],{content:'""',position:'absolute',left:0,top:0,width:g.W,height:g.H,margin:0,padding:0,border:0,'box-sizing':'border-box','background-image':ordered.map(source).join(','),'background-size':ordered.map(v=>{const s=size(v);return s.width+' '+s.height;}).join(','),'background-position':ordered.map(v=>`${v.side} ${g.length(c.cardPadding+v.x)} top ${g.length(c.cardPadding+v.y)}`).join(','),'background-repeat':'no-repeat','background-origin':'border-box','background-clip':'border-box',opacity:1,'pointer-events':'none','z-index':z}));
 }
 return out;
}
