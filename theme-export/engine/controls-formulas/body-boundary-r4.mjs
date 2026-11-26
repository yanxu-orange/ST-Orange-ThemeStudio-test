import {Q,B,rule} from '../core/regions/shared.mjs';
// Finite subset of body-card.mjs ordinaryParagraphSelector exclusions.
// Flatten into Q-level :has predicates: CSS does not permit nested :has().
const embedded='pre,code,ul,ol,li,blockquote,details,summary,table,img,picture,video,audio,iframe,svg,canvas,object,embed,form,button,input,select,textarea,[contenteditable],a[role="button"]';
export function paragraphBoundarySelector(){
 return Q+':has(> .mes_block > .mes_text > p:first-child:not(:empty)):has(> .mes_block > .mes_text > p:last-child:not(:empty))'+
  ':not(:has(> .mes_block > .mes_text > :not(p)))'+
  ':not(:has(> .mes_block > .mes_text > p:empty))'+
  ':not(:has(> .mes_block > .mes_text > p:is([contenteditable],[role="button"])))'+
  `:not(:has(> .mes_block > .mes_text > p :is(${embedded})))`+
  ':has(> .mes_block > .mes_media_wrapper:empty):has(> .mes_block > .mes_file_wrapper:empty):has(> .mes_block > .mes_bias:empty)';
}
export function paragraphBoundaryRules(c){
 const q=paragraphBoundarySelector(),body=q+' > .mes_block > .mes_text';
 return '/* r4: finite ordinary-p chain only; keep all attachment/other branches unchanged. */\n'+[
  rule(q,{'--yj-footer-leading':'0px'}),
  rule(body+' > p:last-child',{'margin-bottom':0}),
  rule(body,{'margin-bottom':`max(${c.bodyParagraphGap}px,12px)`}),
  rule(q+' > .mes_block::after',{'margin-top':'var(--yj-footer-leading,12px)'})
 ].join('\n');
}
