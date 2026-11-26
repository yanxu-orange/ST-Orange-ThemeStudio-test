import {regionZ} from '../../../../region-layers.mjs';
import {SCROLLBAR_CSS} from '../../../../scrollbars.mjs';
import {Q,H,B,rule,esc} from '../../core/regions/shared.mjs';
import {avatarClipPath,geometry,roleMetadata,roleMatches} from '../../header/regions/header-geometry.mjs';
import {legacyDecorationSvg} from '../../../../legacy-decorations.mjs';
import {borderWidths,borderColor,physicalBorderStyle,paperCardEdgeDeclarations,cardShadowValue,sharedChatWidthRules} from '../../../../body-card.mjs';
import {headerArtPlan,groupedHeaderArtCss} from './header-art-groups.mjs';
import {headerTextStack,STACK_BOX,STACK_MEMBER,stackCaptionClip,stackAnchorFactor} from '../../../../header-text-stack.mjs';
const outer=h=>h+' > div.flex1',inner=h=>outer(h)+' > div.alignItemsBaseline';
export function headerCompositionDiagnostics(c){
 const errors=[],bad=(field,reason,code='HEADER_COMPOSITION')=>errors.push({severity:'error',code,field,reason});
 for(const role of ['ai','user']){
  if(c.captions.filter(x=>x.visible&&x.content.trim()&&roleMatches(x,role)).length>4+Number(!!headerTextStack(c,role==='user')?.caption))bad('captions',role+' requires more than four independent caption slots','CAPACITY');
  const plan=headerArtPlan(c,role);
  if(!plan.legacy&&plan.planes.length>plan.available)bad('layers.header',role+' has '+plan.planes.length+' independent interleaved/opacity paint planes but '+plan.available+' native leaves are free; planes: '+plan.planes.map(p=>p.layers.map(l=>l.name||l.id).join(' + ')).join(' | '),'CAPACITY');
  for(const key of ['name','time']){const {value:v,custom}=roleMetadata(c,role,key);if(custom&&(v.region!=='header'||!c.headerTextStack&&v.anchor!=='left'||v.prefix))bad('metadata.'+role+'.'+key,'Only original name/time content in header (left anchor for free layout) without prefix is supported');}
 }
 for(const l of c.layers.filter(l=>l.visible&&l.anchor==='header'))if(!['asset','custom','shape'].includes(l.kind)||l.kind==='shape'&&l.shape!=='rectangle')bad('layers.'+c.layers.indexOf(l),'Header artwork requires an authored image or supported rectangle; other shape semantics are not implemented');
 for(const l of c.layers.filter(l=>l.visible&&l.anchor==='avatar')){
  if((l.kind==='asset'&&!l.asset)||(l.kind==='custom'&&!l.image)||(!['asset','custom','shape'].includes(l.kind)&&!legacyDecorationSvg(l.kind)))bad('layers.'+c.layers.indexOf(l),'Avatar-relative artwork needs a resolved image or supported authored shape');
 }
 return errors;
}
export function headerCompositionCss(c,ctx){
 const unit=c.headerCanvas?`calc(100cqw / ${c.headerCanvas.width})`:'1px',z=key=>2*regionZ(c,'header',key),foundation=[];
 if(c.hideScrollbars)foundation.push(SCROLLBAR_CSS);
 if(c.chatMaxWidth!==undefined)foundation.push(sharedChatWidthRules(c));
 foundation.push(rule('#sheld,#chat',{background:'transparent','backdrop-filter':'none','-webkit-backdrop-filter':'none'}),rule('#chat',{'box-sizing':'border-box',padding:`20px ${c.cardGutter}px 90px`,gap:0}));
 const types=`@property --yj-header-unit{syntax:"<length>";inherits:true;initial-value:0px}\n@property --yj-card-width{syntax:"<length>";inherits:true;initial-value:0px}`;
 const out=[
 rule(Q,{position:'relative',display:'block','box-sizing':'border-box',width:'100%','max-width':c.cardFullWidth?'none':c.cardWidth+'px','min-width':0,margin:`0 auto ${c.messageGap}px`,padding:0,'border-width':borderWidths(c).map(n=>n+'px').join(' '),'border-style':physicalBorderStyle(c),'border-color':borderColor(c,'live'),'border-radius':c.radius+'px',background:c.surface+Math.round(c.surfaceOpacity*255).toString(16).padStart(2,'0'),color:c.text,'box-shadow':cardShadowValue(c),'text-shadow':'none','backdrop-filter':'none','container-type':'inline-size',isolation:'isolate',overflow:'visible',...paperCardEdgeDeclarations(c)}),
 rule(B,{position:'relative',display:'block','box-sizing':'border-box',width:'100%','max-width':'none','min-width':0,margin:0,padding:`0 0 ${c.cardPadding}px`,'--yj-header-unit':unit,'--yj-card-width':'100cqw','container-type':'normal',overflow:'visible'}),
 rule(H,{position:'relative',display:'block','box-sizing':'border-box',width:'100%',margin:'0 0 14px',padding:0,'container-type':'normal',overflow:'visible'}),
 rule(outer(H)+','+inner(H),{display:'contents',position:'static',transform:'none',filter:'none',contain:'none','container-type':'normal','z-index':'auto','clip-path':'none'}),rule(H+' .timestamp-icon',{display:'none'}),
 rule(H+' > :is(.mes_buttons,.mes_edit_buttons)',{position:'absolute',right:0,top:0,'max-width':'100%','flex-wrap':'wrap','z-index':60})];
 for(const role of ['ai','user']){
  const q=Q+`[is_user="${role==='user'}"]`,b=q+' > .mes_block',h=b+' > .ch_name',a=q+' > .mesAvatarWrapper',g=geometry(c,role),p=c.photos[role];
  const stack=headerTextStack(c,role==='user'),group=inner(h),fontLength=c.headerCanvas?.textScale==='fixed'?n=>n+'px':g.length;
  if(!stack)out.push(rule(h,{height:g.H,'min-height':g.H,'max-height':g.H}));
  else{
   const {left,top}=g.point(stack.anchor,false),authored=g.maxWidth(stack.anchor);
   const width=stack.maxWidth===undefined?authored:`min(${authored},${stack.maxWidth}px)`,factor=stackAnchorFactor[stack.anchor.anchor];
   out.push(rule(h,{height:'auto','min-height':g.H,'max-height':'none','--yj-stack-x':`max(0px,${left} + (${g.inner} - ${width}) * ${factor})`,'--yj-stack-y':`max(0px,${top})`,'--yj-stack-width':`max(0px,min(${width},${g.W} - var(--yj-stack-x)))`,'padding-top':'var(--yj-stack-y)'}));
   out.push(rule(group,STACK_BOX));
   out.push(rule(group+' > :is(.name_text,.timestamp):is(:empty,[hidden])',{display:'none'}));
   out.push(rule(group+' > .mes_ghost',{position:'absolute',right:`calc(var(--yj-stack-width) - ${g.W} + var(--yj-stack-x) + ${g.P})`,top:'calc(4px - var(--yj-stack-y))'}));
   out.push(rule(group+'::before',{translate:'calc(0px - var(--yj-stack-x)) calc(0px - var(--yj-stack-y))'}));
  }
  const text=(item,size,font,color,line,offsets=true,clamp=false)=>{const point=g.point(item,offsets),sx=item.scaleX??1;return {position:'absolute',...point,width:g.textWidth(item),'max-width':g.maxWidth(item),'min-width':0,'box-sizing':'border-box',margin:0,padding:0,'font-family':font,'font-size':fontLength(size),'font-weight':item.weight==='auto'||item.weight==null?400:item.weight,color,'line-height':line,'letter-spacing':'normal','white-space':'pre-wrap','overflow-wrap':'anywhere','text-align':c.textAlign,'text-shadow':'none',transform:`scaleX(${sx})`,'transform-origin':'left top','clip-path':g.clip(point.left,point.top,sx,clamp)};};
  for(const key of ['name','time']){const {value:v,fontField,custom}=roleMetadata(c,role,key),t={...v,weight:v.style.weight},cls=key==='name'?'.name_text':'.timestamp',member=stack?.[key];out.push(rule(member?group+' > '+cls:h+' '+cls,{...text(t,v.style.size,ctx.family(fontField,v.style.font),v.style.color,key==='name'?1.4:1.5,false,custom),...(member?{...STACK_MEMBER,order:key==='name'?1:2}:{}),'z-index':z(key)}));}
  const slots=[h+'::before',h+'::after',outer(h)+'::before',outer(h)+'::after'];
  const captions=c.captions.filter(t=>t.visible&&t.content.trim()&&roleMatches(t,role)),freeCaptions=captions.filter(t=>t!==stack?.caption);
  let freeSlot=0;
  for(const t of captions){
   const member=t===stack?.caption;
   out.push(rule(member?group+'::after':slots[freeSlot++],{content:esc(t.content),...text(t,t.size,ctx.family(`captions.${c.captions.indexOf(t)}.fontLink.url`,t.font),t.color,t.lineHeight??1.6),...(member?{...STACK_MEMBER,order:3,'clip-path':stackCaptionClip(t)}:{}),'pointer-events':'none','z-index':z('caption:'+t.id)}));
  }
  const artworkSlots=[b+'::before',inner(h)+'::before'];
  const plan=headerArtPlan(c,role);
  if(plan.legacy)c.layers.filter(l=>l.visible&&l.anchor==='header'&&roleMatches(l,role)).forEach((l,slot)=>{const ix=c.layers.indexOf(l),field=ctx.firstField('layers.'+ix+'.'),image=ctx.image(field),height=l.kind==='shape'?l.height:l.width*image.height/image.width,left=l.side==='right'?`calc(${g.W} - ${g.length(c.cardPadding+l.x)} - ${g.length(l.width)})`:g.length(c.cardPadding+l.x),top=g.length(c.cardPadding+l.y);out.push(rule(artworkSlots[slot],{content:'""',position:'absolute',left,top,width:g.length(l.width),height:g.length(height),background:`${ctx.source(field)} center / 100% 100% no-repeat`,opacity:l.opacity,'clip-path':g.polygon(left,top),'pointer-events':'none','z-index':z('image:'+l.id)}));});
  else{
   const captionCount=freeCaptions.length;
   const visibleAvatar=q+':has(> .mesAvatarWrapper:not([hidden]) > .avatar:not([hidden]) > img:not([hidden]))';
   const avatarSelector=selector=>'body:not(:is(.hideChatAvatars,.documentstyle)) '+selector.replace(q,visibleAvatar);
   const freeSlots=[...artworkSlots,...slots.slice(captionCount)];
   if(plan.cardSlot&&plan.planes.length>freeSlots.length){
    const cardSlot=q+'::before';
    freeSlots.push(cardSlot);
    out.push(rule(cardSlot,{'--yj-header-unit':unit,'--yj-card-width':'100cqw'}));
   }
   out.push(...groupedHeaderArtCss(c,ctx,role,g,freeSlots,avatarSelector));
  }
  const effects=c.avatarEffects?.[role],legacyFrame=!g.fill&&!effects?.frame;
  const border=legacyFrame&&p.enabled&&p.frameWidth?`${g.length(p.frameWidth)} solid ${p.frameColor}`:0;
  const shadow=legacyFrame&&p.shadow?`${g.length(1)} ${g.length(2)} ${g.length(3)} #6c7b962b`:'none';
  const transform=`translate(${g.length(p.x)},${g.photoShiftY})`+(g.photoAngle?` rotate(${g.photoAngle}deg)`:'');
  const clip=g.photoAngle?avatarClipPath(g,point=>g.inversePhoto(point,1)):g.polygon(g.photoLeft,g.photoTop);
  out.push(rule(a,{position:'absolute',left:g.P,top:g.P,width:g.photoWidth,height:g.photoHeight,margin:0,padding:0,'min-height':0,'max-width':'none',display:'flex','flex-direction':'column','flex-wrap':'nowrap','justify-content':'flex-start','align-items':'flex-start',gap:0,'--yj-header-unit':unit,'--yj-card-width':'100cqw','z-index':z('avatar'),'container-type':'normal'}),
  rule(a+' > .avatar',{position:'relative',display:'block','box-sizing':'border-box',width:'100%',height:g.photoHeight,'min-height':0,flex:'none','min-width':0,'max-width':'none',margin:0,padding:0,border:0,'border-radius':g.length(p.radius),transform,'transform-origin':'50% 100%','box-shadow':'none',overflow:shadow!=='none'&&(effects?.zoom??100)===100?'visible':'hidden','clip-path':clip}),
  rule(a+' > .avatar > img',{position:'relative',display:'block','box-sizing':'border-box',width:'100%',height:'100%','min-height':0,'max-height':'100%','min-width':0,'max-width':'none',margin:0,padding:0,border,'border-radius':g.length(p.radius),'object-fit':'cover','object-position':`${c.avatarFill[role].x}% ${c.avatarFill[role].y}%`,transform:'none',filter:'none','box-shadow':shadow}));
 }
 return {types,foundation:foundation.join('\n'),chat:out.join('\n')};
}
