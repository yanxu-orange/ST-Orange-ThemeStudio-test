import {regionZ} from '../../../../region-layers.mjs';
import {ORNAMENT_DIVIDER} from '../../../../shape-assets.mjs';
import {Q,B,rule} from './shared.mjs';
import {footerCaptionDiagnostics,footerCaptionCss} from './footer-caption.mjs';
export const MIN_CARD_WIDTH=200;
const active=(c,anchor,role)=>c.layers.filter(l=>l.visible&&l.anchor===anchor&&(l.scope==='both'||l.scope===role));
export function staticCompositionDiagnostics(c){
 const errors=[...footerCaptionDiagnostics(c)],bad=(l,reason)=>errors.push({severity:'error',code:'STATIC_COMPOSITION',field:'layers.'+c.layers.indexOf(l),reason});
 if(c.layers.some(l=>l.visible&&l.anchor==='footer')&&2*c.cardPadding>=MIN_CARD_WIDTH)errors.push({severity:'error',code:'STATIC_COMPOSITION',field:'cardPadding',reason:'Footer content width must remain positive at the 200px minimum card width'});
 for(const role of ['ai','user'])if(active(c,'message',role).length>1)errors.push({severity:'error',code:'CAPACITY',field:'layers.message',reason:role+' needs more than one overall paint slot'});
 for(const l of c.layers.filter(l=>l.visible&&['message','footer'].includes(l.anchor))){
  if(!['asset','custom',...(l.anchor==='footer'?['shape']:[])].includes(l.kind)||l.rotation||l.imageSizing||l.heightPercent||l.vertical!=='top'||l.offsetUnit!=='px'||l.y<0)bad(l,'Only natural images or finite footer shapes, unrotated top anchors and px offsets are supported');
  if(l.anchor==='footer'){
   if(l.opacity!==1||l.x<0||l.widthUnit==='percent'&&(l.x!==0||l.width>100)||l.widthUnit==='px'&&l.width+l.x>MIN_CARD_WIDTH-2*c.cardPadding)bad(l,'Footer backgrounds require opacity1 and guaranteed horizontal containment at the 200px minimum card width');
   if(l.kind==='shape'&&(!['rectangle',ORNAMENT_DIVIDER].includes(l.shape)||l.heightUnit!=='px'))bad(l,'Only explicit px-height footer rectangles and ornament dividers are supported');
   if(l.kind!=='shape'&&l.widthUnit==='percent')bad(l,'Percentage-width natural images require dynamic union rounding outside this finite contract; explicit px-height rectangles remain supported');
  }
 }
 return errors;
}
export function staticCompositionCss(c,ctx){
 const out=[rule(Q+' > .swipeRightBlock',{'z-index':60})],P=c.cardPadding;
 for(const role of ['ai','user']){
  const selector=Q+`[is_user="${role==='user'}"]`,whole=active(c,'message',role)[0],footer=active(c,'footer',role);
  if(whole){const ix=c.layers.indexOf(whole),field=ctx.firstField('layers.'+ix+'.'),info=ctx.image(field),w=whole.widthUnit==='percent'?whole.width+'%':whole.width+'px',h=whole.widthUnit==='percent'?`calc(${whole.width/100*info.height/info.width} * var(--yj-static-card-width))`:whole.width*info.height/info.width+'px';out.push(rule(selector+'::before',{'--yj-static-card-width':'100cqw',content:'""',position:'absolute',[whole.side]:whole.x+'px',top:whole.y+'px',width:w,height:h,background:`${ctx.source(field)} center / 100% 100% no-repeat`,opacity:whole.opacity,'pointer-events':'none','z-index':2*regionZ(c,'overall','image:'+whole.id)+1,'clip-path':'none'}));}
  if(!footer.length)continue;
  const width=l=>l.widthUnit==='percent'?`calc(${l.width/100} * var(--yj-static-footer-width))`:l.width+'px';
  const size=l=>{if(l.kind==='shape')return l.height+'px';const field=ctx.firstField('layers.'+c.layers.indexOf(l)+'.'),r=ctx.image(field);return `calc(${width(l)} * ${r.height/r.width})`;};
  const height=Math.ceil(Math.max(...footer.map(l=>{const r=l.kind==='shape'?null:ctx.image(ctx.firstField('layers.'+c.layers.indexOf(l)+'.'));return l.y+(l.kind==='shape'?l.height:l.width*r.height/r.width);})))+'px';
  const ordered=[...footer].sort((a,b)=>regionZ(c,'footer','image:'+b.id)-regionZ(c,'footer','image:'+a.id));
  // Resolve container lengths on B (whose query ancestor is the whole card), then inherit.
  out.push(rule(selector+' > .mes_block',{'--yj-static-footer-width':`calc(100cqw - ${2*P}px)`,'padding-bottom':P+'px'}),rule(selector+' > .mes_block::after',{content:'""',display:'block',position:'relative','box-sizing':'border-box',width:`calc(100% - ${2*P}px)`,height,'min-height':height,margin:`12px ${P}px 0`,padding:0,border:0,'pointer-events':'none',isolation:'isolate','z-index':0,'background-image':ordered.map(l=>ctx.source(ctx.firstField('layers.'+c.layers.indexOf(l)+'.'))).join(','),'background-size':ordered.map(l=>`${width(l)} ${size(l)}`).join(','),'background-position':ordered.map(l=>`${l.side} ${l.x}px top ${l.y}px`).join(','),'background-repeat':'no-repeat','background-origin':'border-box','background-clip':'border-box'}));
 }
 const caption=footerCaptionCss(c,ctx);
 return '@property --yj-static-card-width{syntax:"<length>";inherits:true;initial-value:0px}\n@property --yj-static-footer-width{syntax:"<length>";inherits:true;initial-value:0px}\n'+out.join('\n')+(caption?'\n'+caption:'');
}
