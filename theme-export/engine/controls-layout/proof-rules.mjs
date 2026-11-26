import {Q,H,B,rule,esc} from '../core/regions/shared.mjs';
import {geometry} from '../header/regions/header-geometry.mjs';
import {regionZ} from '../../../region-layers.mjs';
export const headerSpacer=(q,c)=>q+(c.headerTextStack?' > .mesAvatarWrapper::before':' > .mes_block > .ch_name > div.flex1 > div.alignItemsBaseline::after');
export function proofRules(c,mode='A'){
 if(!['A','B'].includes(mode))throw Error('Unknown proof mode');
 const out=[rule(H,{position:'static',transform:'none',filter:'none','backdrop-filter':'none',contain:'none',perspective:'none'}),
 rule(H+' > .mes_buttons',{position:'static',overflow:'visible',transform:'none',filter:'none',contain:'none',perspective:'none'}),
 rule(Q+' > .mesAvatarWrapper > :is(.mesIDDisplay,.mes_timer,.tokenCounterDisplay)',{position:'absolute',bottom:'8px','z-index':60}),
 rule(Q+' > .mesAvatarWrapper > .mesIDDisplay',{opacity:0}),
 rule(Q+'[mesid]:not([mesid=""])::after',{content:esc('第 ')+' attr(mesid) '+esc(' 封'),position:'absolute',right:c.cardPadding+'px',bottom:c.cardPadding+'px','font-family':'sans-serif','font-size':'11px','line-height':1.5,color:'#465244','pointer-events':'none','z-index':60}),
 rule('body.no-mesIDDisplay '+Q+'::after',{display:'none'}),rule('body.hideChatAvatars '+Q+' > .mesAvatarWrapper > .avatar',{display:'none'})];
 for(const role of ['ai','user']){const q=Q+`[is_user="${role==='user'}"]`,g=geometry(c,role);out.push(rule(q+' > .mesAvatarWrapper',{display:'contents',position:'static',transform:'none',filter:'none',contain:'none'}),rule(q+' > .mesAvatarWrapper > .avatar',{position:'absolute',left:g.P,top:g.P,width:g.photoWidth,height:g.photoHeight,'z-index':2*regionZ(c,'header','avatar')}));
  if(mode==='B')out.push(rule(q,{display:'grid','grid-template-columns':'minmax(0,1fr)','grid-template-rows':'repeat(7,auto)','row-gap':0,'padding-top':0,'padding-bottom':c.cardPadding+'px'}),rule(headerSpacer(q,c),{content:'""',position:'static',display:'block','grid-row':1,'grid-column':1,height:g.H,'min-height':g.H,margin:'0 0 14px',padding:0,border:0,'pointer-events':'none','z-index':0}));
  if(mode==='B'&&c.headerTextStack)out.push(rule(q+' > .mes_block > .ch_name > div.flex1 > div.alignItemsBaseline',{'grid-row':1,'grid-column':'1 / -1','align-self':'start','justify-self':'start','margin-top':'var(--yj-stack-y)','margin-bottom':'14px'}));
 }
 if(mode==='B'){
  out.push(rule(B+','+H,{display:'contents',position:'static',transform:'none',filter:'none',contain:'none'}),rule(H+' .mes_ghost',{position:'absolute',right:c.cardPadding+'px',top:'4px'}));
  for(const [selector,row]of [['.mes_reasoning_details',2],['.mes_text',3],['.mes_media_wrapper',4],['.mes_file_wrapper',5],['.mes_bias',6]])out.push(rule(B+' > '+selector,{'grid-row':row,'grid-column':1}));
  out.push(rule(B+'::after',{'grid-row':7,'grid-column':1,'align-self':'start'}),
  rule(H+' > :is(.mes_buttons,.mes_edit_buttons)',{position:'static','grid-row':7,'grid-column':1,'align-self':'start','justify-self':'stretch','justify-content':'flex-start',float:'none','box-sizing':'border-box',width:'calc(100% - 112px)','max-width':'calc(100% - 112px)',margin:'32px 64px 8px 48px',overflow:'visible',transform:'none',filter:'none',contain:'none','flex-wrap':'wrap','z-index':60}),
  rule(H+' > .mes_buttons > .mes_edit',{'margin-left':0}),
  rule(H+' > .mes_buttons > .extraMesButtons',{position:'static',order:2,width:'100%','max-width':'100%','box-sizing':'border-box','justify-content':'flex-start','flex-wrap':'wrap',overflow:'visible'}));
 }
 return `/* 09 ${mode}: disposable proof only, not nativeStyle export support. */\n`+out.join('\n');
}
