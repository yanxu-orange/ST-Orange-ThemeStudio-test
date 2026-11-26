import {actionDisplay,actionDisplayCss} from './action-display.mjs';
import {assessReading} from './assess-reading.mjs';
import {H,Q,rule} from '../core/regions/shared.mjs';

const keys=['edit','more'];
const gap=6;
const footprint=(group,action)=>{
 const model=actionDisplay(group,action);
 return {width:model.mode==='default'?model.minWidth:model.size,height:model.height};
};

export function usesRightFooterActions(actions){
 return keys.every(key=>actions[key].position==='footer')&&keys.some(key=>actions[key].x>=50);
}

export function assessRightFooterActions(c){
 const {actions,stats,swipe}=c.nativeStyle;
 const {diagnostics,fieldCoverage}=assessReading(c,{includeActions:false});
 const check=(field,ok,reason)=>{
  fieldCoverage.push({field,owner:'right-footer-actions',status:ok?'consumed':'unsupported',reason});
  if(!ok)diagnostics.push({severity:'error',code:'NATIVE_CONTROLS_UNSUPPORTED',field,reason});
 };
 const range=(value,min,max)=>value>=min&&value<=max;
 const widths=Object.fromEntries(keys.map(key=>[key,footprint(actions,actions[key])]));
 check('nativeStyle.actions.design',actions.design!=='separate','Right-side footer actions require the same styling for both roles');
 check('nativeStyle.actions.size',range(actions.size,10,18),'Right-side footer action labels need a size from 10 to 18');
 for(const key of keys){
  const action=actions[key],field='nativeStyle.actions.'+key;
  check(field+'.anchor',action.anchor==='top','Right-side footer actions use a top anchor');
  check(field+'.mode',widths[key].width!==null,'Right-side footer actions need a fixed hit width, using a native glyph, image, or icon');
  check(field+'.x',range(action.x,50,100),'Both action positions must be in the right half of the footer');
  check(field+'.y',range(action.y,24,64),'Right-side footer actions use y24..64');
 }
 const width=320-2*c.cardPadding;
 const {edit,more}=actions,moreWidth=widths.more.width;
 if(widths.edit.width!==null&&moreWidth!==null){
  const moreX=more.x/100*width,editX=edit.x/100*width+moreWidth+gap;
  check('nativeStyle.actions.edit.x',editX+widths.edit.width+gap<=moreX,'Edit needs a clear gap before More at a 320px card width');
  check('nativeStyle.actions.more.x',moreX+moreWidth<=width,'More must fit within the footer at a 320px card width');
 }
 for(const key of ['floor','time','tokens']){
  check('nativeStyle.stats.'+key+'.y',stats[key].y+stats.size*1.5<=Math.min(edit.y,more.y),'The statistic must finish before the right-side action buttons');
 }
 const actionBottom=Math.max(...keys.map(key=>actions[key].y+widths[key].height));
 check('nativeStyle.swipe.y',swipe.y>=actionBottom+gap,'Compact swipe controls must start 6px below both action hit areas');
 return {mode:diagnostics.length?'unsupported':'finite-footer',layout:'reading-right-actions',diagnostics,fieldCoverage};
}

export function rightFooterActionsCss(c,ctx){
 const actions=c.nativeStyle.actions,padding=c.cardPadding,W='var(--yj-controls-width)';
 const color=actions.color==='auto'?c.accent:actions.color;
 const normal=H+' > .mes_buttons',editing=H+' > .mes_edit_buttons',tray=normal+' > .extraMesButtons';
 const model=Object.fromEntries(keys.map(key=>[key,footprint(actions,actions[key])]));
 const shift={edit:model.more.width+gap,more:0};
 const percent=value=>`calc(${value/100} * ${W})`;
 const top=value=>`calc(var(--yj-footer-leading,0px) + ${value}px)`;
 const end=key=>`calc(${percent(actions[key].x)} + ${shift[key]+model[key].width}px)`;
 const rightEdge=key=>`calc(${padding}px + ${percent(100-actions[key].x)} - ${shift[key]+model[key].width}px)`;
 const bottom=Math.max(...keys.map(key=>actions[key].y+model[key].height));
 const expanded=normal+':has(> .extraMesButtons.visible),'+
  Q+'[bookmark_link]:not([bookmark_link=""]) > .mes_block > .ch_name > .mes_buttons,body.expandMessageActions '+normal;
 const safeRow=key=>({
  'grid-row':8,'grid-column':'1 / -1','align-self':'start','justify-self':'end',
  width:'max-content','max-width':end(key),'min-width':0,margin:`6px ${rightEdge(key)} 8px 0`,
 });
 const out=['/* Right footer actions and inward native panels. */'];
 for(const role of ['false','true']){
  out.push(rule(Q+`[is_user="${role}"]`,{'grid-template-rows':`repeat(6,auto) minmax(${top(bottom+8)},auto) auto`}));
 }
 out.push(
  rule(normal,{
   position:'static','grid-row':7,'grid-column':'1 / -1','justify-self':'end','align-self':'start',
   transform:'none',filter:'none','backdrop-filter':'none',perspective:'none',contain:'none','will-change':'auto',
   'box-sizing':'border-box',width:'auto','max-width':W,'min-width':0,height:'auto','min-height':0,
   margin:0,padding:0,gap:'6px','flex-direction':'column','align-items':'flex-end','justify-content':'flex-start',
   overflow:'visible','z-index':'auto',transition:'none',
  }),
  rule(normal+'::before,'+normal+'::after',{content:'none',display:'none'}),
  rule(expanded,safeRow('more')),
  rule(tray,{
   position:'static',left:'auto',top:'auto',right:'auto',bottom:'auto',transform:'none',
   width:'max-content','max-width':'100%','min-width':0,'box-sizing':'border-box',
   'align-self':'flex-end','justify-content':'flex-end','flex-wrap':'wrap',gap:'6px',
   padding:'1px',margin:0,order:1,overflow:'visible','z-index':66,
  }),
  rule(normal+' > .mes_bookmark',{
   position:'static',order:0,'align-self':'flex-end',width:'max-content','max-width':'100%',
   'min-height':'24px','font-size':actions.size+'px',margin:0,
  }),
  rule(editing,{
   ...safeRow('edit'),position:'relative',left:'auto',right:'auto',top:'auto',bottom:'auto',
   'box-sizing':'border-box',padding:'0 0 5px','flex-wrap':'wrap',gap:'5px',
   'justify-content':'flex-end','align-items':'flex-start',overflow:'visible',
   transform:'none',filter:'none',transition:'none','z-index':67,
  }),
  rule(tray+' > .mes_button,'+editing+' > .menu_button',{'font-size':actions.size+'px',color,'flex-shrink':0}),
  rule(normal+' .mes_button:not(:disabled):not([aria-disabled=true]):not(.disabled),'+
   editing+' .menu_button:not(:disabled):not([aria-disabled=true]):not(.disabled)',{opacity:1}),
 );
 for(const [key,child] of [['edit','.mes_edit'],['more','.extraMesButtonsHint']]){
  const selector=normal+' > '+child;
  const fixedWidth=model[key].width+'px';
  out.push(
   actionDisplayCss(selector,c,actions[key],key,ctx),
   rule(selector,{
    position:'absolute','grid-row':7,'grid-column':'1 / -1',
    left:`calc(${padding+shift[key]}px + ${percent(actions[key].x)})`,top:top(actions[key].y),
    right:'auto',bottom:'auto',transform:'none',margin:0,padding:0,width:fixedWidth,
    'min-width':fixedWidth,'max-width':fixedWidth,'z-index':65,
   }),
  );
 }
 return out.join('\n');
}
