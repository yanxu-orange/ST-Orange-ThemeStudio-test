import {actionDisplay,actionDisplayCss,actionPlaceholder} from './action-display.mjs';
import {Q,H,rule,esc} from '../core/regions/shared.mjs';
import {geometry} from '../header/regions/header-geometry.mjs';
export function authoredActionsCss(c,{ctx,displayModes=false}={}){
 const a=c.nativeStyle.actions,P=c.cardPadding,W='var(--yj-controls-width)',pct=n=>`calc(${n/100} * ${W})`,T=Math.max(24,a.size*1.5+2),color=a.color==='auto'?c.accent:a.color;
 const normal=H+' > .mes_buttons',editing=H+' > .mes_edit_buttons',tray=normal+' > .extraMesButtons',edit=normal+' > .mes_edit',hint=normal+' > .extraMesButtonsHint';
 const models={edit:actionDisplay(a,a.edit),more:actionDisplay(a,a.more)},out=[],height=(displayModes?models.more.height:T)+'px',label={content:'none','font-family':c.font,'font-size':a.size+'px','line-height':1.5,'font-weight':900,'white-space':'nowrap','pointer-events':'none'};
 const row=v=>v.position==='header'?1:7,top=v=>v.position==='header'?`${P+v.y}px`:`calc(var(--yj-footer-leading,0px) + ${v.y}px)`;
 // Header source x addresses the trigger's right edge; footer x addresses its left.
 // Left-side panels start beside that edge; right-side panels end at that edge.
 const edge=v=>v.position==='header'?100+v.x:v.x,inwardRight=v=>edge(v)<50;
 const cap=v=>pct(inwardRight(v)?100-edge(v):edge(v));
 const flow=(v,y=top(v))=>({'grid-row':row(v),'grid-column':'1 / -1','align-self':'start','justify-self':inwardRight(v)?'start':'end',margin:inwardRight(v)?`${y} 0 8px calc(${P}px + ${pct(edge(v))})`:`${y} calc(${P}px + ${pct(100-edge(v))}) 8px 0`,'max-width':cap(v)});
 for(const role of ['ai','user']){const q=Q+`[is_user="${role==='user'}"]`,g=geometry(c,role),tail=a.edit.position==='footer'?a.edit:a.more,head=a.edit.position==='header'?a.edit:a.more;
  out.push(rule(q,{'grid-template-rows':`minmax(max(${g.H},${P+head.y+(displayModes?models[head===a.edit?'edit':'more'].height:T)+8}px),auto) repeat(5,auto) minmax(calc(var(--yj-footer-leading,0px) + ${tail.y+(displayModes?models[tail===a.edit?'edit':'more'].height:T)+8}px),auto) auto`}));
 }
 out.push(rule(normal,{'grid-row':row(a.more),'grid-column':'1 / -1','align-self':'start','justify-self':'start',margin:`${top(a.more)} ${P}px 8px`,position:'static',transform:'none',filter:'none','backdrop-filter':'none',perspective:'none',contain:'none','will-change':'auto',width:W,'max-width':W,height:'auto','min-height':height,padding:0,'flex-direction':'column','align-items':'flex-start','justify-content':'flex-start',gap:'6px','flex-wrap':'nowrap',overflow:'visible',transition:'none','z-index':'auto'}),
 rule(normal+'::before',{...label,content:esc(a.more.text),display:'block',visibility:'hidden','box-sizing':'border-box',height,'min-height':height,width:'max-content','min-width':'25px',padding:'1px 3px',margin:0,'flex-shrink':0,order:0,...(displayModes?actionPlaceholder(c,a.more):{})}),rule(normal+'::after',{content:'none',display:'none'}));
 for(const [selector,v,key]of [[edit,a.edit,'edit'],[hint,a.more,'more']]){
  const pos={position:'absolute','grid-row':row(v),'grid-column':'1 / -1',top:top(v),bottom:'auto',left:v.position==='header'?'auto':`calc(${P}px + ${pct(v.x)})`,right:v.position==='header'?`calc(${P}px + ${pct(-v.x)})`:'auto',transform:'none',margin:0,padding:'1px 3px','box-sizing':'border-box',width:'max-content','max-width':pct(v.position==='header'?100+v.x:100-v.x),'min-width':'25px',height,'min-height':height,'font-size':0,color,'z-index':65,'text-shadow':'none',filter:'none'};
  if(displayModes){out.push(rule(selector,pos),actionDisplayCss(selector,c,v,key,ctx,{ellipsis:true}));continue;}
  out.push(rule(selector,pos),rule(selector+'::before',{content:'none',display:'none'}),rule(selector+'::after',{...label,content:esc(v.text),display:'block',overflow:'hidden','text-overflow':'ellipsis'}));
 }
 out.push(rule(tray,{position:'static',left:'auto',top:'auto',right:'auto',bottom:'auto',transform:'none',width:'max-content','max-width':cap(a.more),'box-sizing':'border-box','justify-content':inwardRight(a.more)?'flex-start':'flex-end','align-self':inwardRight(a.more)?'flex-start':'flex-end','column-gap':'6px','row-gap':'6px','flex-wrap':'wrap',padding:'1px',margin:inwardRight(a.more)?`0 0 0 ${pct(edge(a.more))}`:`0 ${pct(100-edge(a.more))} 0 0`,order:1,overflow:'visible','z-index':66}),
 rule(normal+' > .mes_bookmark',{position:'static',order:2,'align-self':'stretch',width:'100%','min-height':'24px','font-size':a.size+'px',margin:0}),
 rule(editing,{...flow(a.edit,a.edit.position==='footer'?'6px':top(a.edit)),...(a.edit.position==='footer'?{'grid-row':8}:{}),position:'relative',left:'auto',top:'auto',right:'auto',bottom:'auto',width:'max-content','box-sizing':'border-box',padding:'0 0 5px','flex-wrap':'wrap','column-gap':'5px','row-gap':'5px','justify-content':inwardRight(a.edit)?'flex-start':'flex-end','align-items':'flex-start',overflow:'visible',transform:'none',filter:'none',transition:'none','z-index':67}),
 rule(editing+' > .menu_button',{'flex-shrink':0,'font-size':a.size+'px','line-height':1,color}),
 rule(tray+' > .mes_button',{'font-size':a.size+'px','line-height':1,color}),
 rule(normal+' .mes_button:not(:disabled):not([aria-disabled=true]):not(.disabled),'+editing+' .menu_button:not(:disabled):not([aria-disabled=true]):not(.disabled)',{opacity:1}));
 if(a.more.position==='footer'){
  const open=normal+':has(> .extraMesButtons.visible)',flag=Q+'[bookmark_link]:not([bookmark_link=""]) > .mes_block > .ch_name > .mes_buttons',expanded='body.expandMessageActions '+normal;
  out.push(rule(open+','+flag+','+expanded,{'grid-row':8,'margin-top':'6px','min-height':0}),rule(open+'::before,'+flag+'::before,'+expanded+'::before',{content:'none',display:'none'}));
 }
 return '/* Authored cross-region actions: original nodes and state; wrapping panels in their respective regions. */\n'+out.join('\n');
}
