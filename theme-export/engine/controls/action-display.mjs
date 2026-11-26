import {effectiveNativeMode} from '../../../native.mjs';
import {iconStyle,iconFill} from '../../../icon-style.mjs';
import {rule,esc} from '../core/regions/shared.mjs';
export function actionDisplay(a,v){
 const mode=effectiveNativeMode(v),d=mode==='icon'?(v.size||v.imageSize):mode==='image'?v.imageSize:null;
 return {mode,width:d===null?'max-content':d+'px',minWidth:mode==='text'?25:mode==='default'?24:d,height:mode==='text'?Math.max(24,a.size*1.5+2):Math.max(24,d||0),size:d};
}
export const visualActions=a=>['edit','more'].some(key=>effectiveNativeMode(a[key])!=='text');
export function actionPlaceholder(c,v){const a=c.nativeStyle.actions,m=actionDisplay(a,v);return m.mode==='text'?{}:{content:'""',width:m.mode==='default'?'24px':m.width,'min-width':m.minWidth+'px',height:m.height+'px','min-height':m.height+'px',padding:0,'font-size':0,'line-height':0};}
export function actionDisplayCss(selector,c,v,key,ctx,{ellipsis=false}={}){
 const a=c.nativeStyle.actions,m=actionDisplay(a,v),color=a.color==='auto'?c.accent:a.color,out=[];
 out.push(rule(selector,{width:m.width,'min-width':m.minWidth+'px',height:m.height+'px','min-height':m.height+'px','box-sizing':'border-box',color,filter:'none','text-shadow':'none','font-size':m.mode==='default'?a.size+'px':0,'background-image':'none'}));
 if(m.mode==='default'){
  // Keep the original Font Awesome content and font on the real native node.
  out.push(rule(selector+'::before',{display:'inline-block','pointer-events':'none'}),rule(selector+'::after',{content:'none',display:'none','pointer-events':'none'}));
 }else{
  out.push(rule(selector+'::before',{content:'none',display:'none','pointer-events':'none'}));
  if(m.mode==='text')out.push(rule(selector+'::after',{content:esc(v.text),display:ellipsis?'block':'inline','font-family':c.font,'font-size':a.size+'px','line-height':1.5,'white-space':ellipsis?'nowrap':'pre-wrap','overflow-wrap':'anywhere',...(ellipsis?{overflow:'hidden','text-overflow':'ellipsis'}:{}),'pointer-events':'none'}));
  else{
   const field=`nativeStyle.actions.${key}.`+(m.mode==='icon'&&v.icon?'icon':'source.'+(v.source.kind==='asset'?'asset':'image')),src=ctx.source(field);
   if(m.mode==='image')out.push(rule(selector,{'background-image':src,'background-size':'contain','background-repeat':'no-repeat','background-position':'center'}),rule(selector+'::after',{content:'none',display:'none','pointer-events':'none'}));
   else{const s=iconStyle(v);out.push(rule(selector+'::after',{content:'""',position:'absolute',left:'50%',top:'50%',width:m.size+'px',height:m.size+'px',transform:'translate(-50%,-50%)','pointer-events':'none',background:s.tint?iconFill(s):`${src} center/contain no-repeat`,'mask-image':s.tint?src:'none','mask-mode':'alpha','mask-size':'contain','mask-position':'center','mask-repeat':'no-repeat','-webkit-mask-image':s.tint?src:'none','-webkit-mask-size':'contain','-webkit-mask-position':'center','-webkit-mask-repeat':'no-repeat'}));}
  }
 }
 return out.join('\n');
}
