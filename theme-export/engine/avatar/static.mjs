import {avatarClipPath,geometry} from '../header/regions/header-geometry.mjs';
import {regionZ} from '../../../region-layers.mjs';
import {Q,rule} from '../core/regions/shared.mjs';
const roles=['ai','user'];
export function assessAvatarStatic(c){
 const diagnostics=[],bad=(role,key,reason)=>diagnostics.push({severity:'error',code:'AVATAR_STATIC_UNSUPPORTED',field:`avatarEffects.${role}.${key}`,reason});
 for(const role of roles){const v=c.avatarEffects?.[role];if(!v)continue;
  for(const key of ['fx','reflection'])if(v[key])bad(role,key,'Animation and reflection are not part of static portrait export');
  if(v.maskFinish&&(v.maskFinish.feather>0||v.maskFinish.fade!=='none'&&v.maskFinish.start<100))bad(role,'maskFinish','Active feather or fade is not implemented in static portrait export');
 }
 return diagnostics;
}
export function avatarStaticCoverage(c,diagnostics){return roles.flatMap(role=>Object.entries(c.avatarEffects?.[role]||{}).map(([key,value])=>{const field=`avatarEffects.${role}.${key}`,unsupported=diagnostics.some(d=>d.field===field||d.field.startsWith(field+'.'));return {field,owner:'avatar-static',status:unsupported?'unsupported':['zoom','brightness','saturation','mask','frame','scale'].includes(key)?'consumed':'inactive',reason:unsupported?'Explicitly outside first static portrait contract':'Original native avatar/img or wrapper pseudo CSS; no source replacement or runtime node'};}));}
export function avatarStaticCss(c,ctx,{controlsMode='native-default'}={}){
 const out=[];
 for(const role of roles){const fill=c.avatarFill[role],v=c.avatarEffects?.[role]||{zoom:100,brightness:100,saturation:100,scale:100,mask:{kind:'none',image:''}},g=geometry(c,role),p=c.photos[role],changedGeometry=fill.enabled||v.scale!==100;if(!changedGeometry&&v.zoom===100&&v.brightness===100&&v.saturation===100&&v.mask.kind==='none'&&!v.frame)continue;
  const q=Q+`[is_user="${role==='user'}"]`,avatar=q+' > .mesAvatarWrapper > .avatar',image=avatar+' > img',parts=[];if(v.mask.kind!=='none')parts.push(ctx.source(`avatarEffects.${role}.mask.${['circle','ellipse','diamond'].includes(v.mask.kind)?'@generated':'image'}`));if(fill.enabled&&fill.gradient)parts.push(`linear-gradient(to bottom,#000 ${fill.start}%,rgb(0 0 0 / ${1-fill.opacity}) 100%)`);const mask=parts.join(',')||'none';
  out.push(rule(avatar,{'mask-image':mask,'mask-composite':'intersect','mask-mode':'alpha','mask-size':'contain','mask-position':'center','mask-repeat':'no-repeat','-webkit-mask-image':mask,'-webkit-mask-composite':'source-in','-webkit-mask-size':'contain','-webkit-mask-position':'center','-webkit-mask-repeat':'no-repeat'}));
  const props={};if(v.zoom!==100){props.transform=`scale(${v.zoom/100})`;props['transform-origin']=`${c.avatarFill[role].x}% ${c.avatarFill[role].y}%`;}
  if(v.brightness!==100||v.saturation!==100)props.filter=`brightness(${v.brightness}%) saturate(${v.saturation}%)`;
  if(Object.keys(props).length)out.push(rule(image,props));
  const translate=`translate(${g.length(p.x)},${g.photoShiftY})`+(g.photoAngle?` rotate(${g.photoAngle}deg)`:'');
  const scale=v.scale/100,transform=fill.enabled?`scale(${scale})`:`${translate} scale(${scale})`,portrait=avatar+':has(> img)';
  const clip=g.photoAngle?avatarClipPath(g,point=>g.inversePhoto(point,scale)):changedGeometry?g.scaledPolygon(scale):g.polygon(g.photoLeft,g.photoTop);
  if(changedGeometry){
   out.push(rule(portrait,{position:controlsMode==='finite-footer'?'absolute':'relative',left:controlsMode==='finite-footer'?(fill.enabled?'0px':g.P):'auto',top:controlsMode==='finite-footer'?(fill.enabled?'0px':g.P):'auto',width:g.photoWidth,height:g.photoHeight,transform,'transform-origin':'50% 100%','clip-path':clip}));
   if(fill.enabled){const a=q+' > .mesAvatarWrapper:has(> .avatar > img)',radius=c.radius+'px '+c.radius+'px 0 0';out.push(rule(a,{left:0,top:0,width:g.photoWidth,height:g.photoHeight}),rule(portrait,{'border-radius':0,border:0,'box-shadow':'none'}),rule(image,{border:0,outline:0,'box-shadow':'none','border-radius':v.frame?0:radius}),rule(portrait+'::after',{content:fill.gradient?'""':'none',position:'absolute',inset:0,'pointer-events':'none','z-index':3,'border-radius':radius,background:`linear-gradient(to bottom,transparent ${fill.start}%,${fill.color+Math.round(fill.opacity*255).toString(16).padStart(2,'0')} 100%)`}));}
  }
  if(v.frame){
   const a=q+' > .mesAvatarWrapper:has(> .avatar > img)',frame=a+'::after',finite=controlsMode==='finite-footer',src=ctx.source(`avatarEffects.${role}.frame.id`);
   out.push(rule(avatar,{'border-radius':0,transition:'none'}),rule(image,{border:0,'border-radius':0,'box-shadow':'none'}));
   out.push(rule(frame,{content:'""',position:'absolute',left:finite&&!fill.enabled?g.P:0,top:finite&&!fill.enabled?g.P:0,width:g.photoWidth,height:g.photoHeight,transform:changedGeometry?transform:translate,'transform-origin':'50% 100%',transition:'none','clip-path':clip,background:v.frame.color,'mask-image':src,'mask-mode':'alpha','mask-size':'contain','mask-position':'center','mask-repeat':'no-repeat','-webkit-mask-image':src,'-webkit-mask-size':'contain','-webkit-mask-position':'center','-webkit-mask-repeat':'no-repeat','pointer-events':'none','z-index':finite?2*regionZ(c,'header','avatar')+1:3,border:0,'border-radius':0}));
   out.push(rule('body.hideChatAvatars '+frame,{display:'none'}));
  }
 }
 return out.join('\n');
}
