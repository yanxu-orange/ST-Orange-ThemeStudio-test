import {actionDisplay,visualActions} from './action-display.mjs';
import {readingControlsCss,readingSafetyCss} from './reading.mjs';
import {authoredActionsCss} from './authored-actions.mjs';
import {rightFooterActionsCss} from './right-footer-actions.mjs';
import {proofRules} from '../controls-layout/proof-rules.mjs';
import {controlsPrototypeR4} from '../controls-formulas/controls-prototype-r4.mjs';
import {Q,H,rule} from '../core/regions/shared.mjs';
export function controlsSafetyRules(c){
 const normal=H+' > .mes_buttons',editing=H+' > .mes_edit_buttons',bookmark=normal+' > .mes_bookmark',extra=normal+' > .extraMesButtons';
 const bookmarked=Q+'[bookmark_link]:not([bookmark_link=""]) > .mes_block > .ch_name > .mes_buttons';
 const open=normal+':has(> .extraMesButtons.visible)';
 return [
  rule(normal+','+editing,{transition:'none'}),
  rule(normal,{'max-width':`calc(${(100-c.nativeStyle.actions.edit.x)/100} * var(--yj-controls-width))`}),
  rule(open+','+bookmarked,{'grid-row':8,'margin-top':0}),
  rule(bookmark,{order:1,'flex':'0 0 100%',width:'100%','box-sizing':'border-box','margin-top':'6px','min-height':'24px','font-size':c.nativeStyle.actions.size+'px'}),
  rule(normal+'::after,'+normal+':has(> .extraMesButtons.visible)::after',{order:2}),rule(extra,{order:3})
 ].join('\n');
}
export function renderFiniteControls(c,{layout,ctx}={}){
 if(layout==='reading-right-actions')return {controlsLayout:proofRules(c,'B'),controls:readingControlsCss(c,{includeActions:false}),controlsSafety:rightFooterActionsCss(c,ctx)};
 if(layout==='authored-reading')return {controlsLayout:proofRules(c,'B'),controls:readingControlsCss(c,{includeActions:false}),controlsSafety:authoredActionsCss(c,{ctx,displayModes:visualActions(c.nativeStyle.actions)})};
 if(layout==='reading-visual')return {controlsLayout:proofRules(c,'B'),controls:readingControlsCss(c,{displayModes:true,ctx}),controlsSafety:readingSafetyCss(c)+(actionDisplay(c.nativeStyle.actions,c.nativeStyle.actions.more).mode==='icon'?'\n'+rule(Q+'[bookmark_link]:not([bookmark_link=""]) > .mes_block > .ch_name > .mes_buttons > .extraMesButtonsHint',{position:'relative'}):'')};
 if(layout==='reading')return {controlsLayout:proofRules(c,'B'),controls:readingControlsCss(c),controlsSafety:readingSafetyCss(c)};
 return {controlsLayout:proofRules(c,'B'),controls:controlsPrototypeR4(c,{safeEditor:true}),controlsSafety:controlsSafetyRules(c)};
}
