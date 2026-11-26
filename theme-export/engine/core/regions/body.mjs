import {ordinaryParagraphSelector} from '../../../../body-card.mjs';
import {Q,B,rule} from './shared.mjs';
export function bodyCss(c,ctx){
 const body=B+' > .mes_text',paragraphs=ordinaryParagraphSelector(body),t=ctx.formatTypography;
 return [rule(body,{position:'relative','box-sizing':'border-box',width:`calc(100% - ${c.bodyInset*2}px)`,'max-width':'none',margin:`0 ${c.bodyInset}px`,padding:`0 ${c.bodyPaddingRight}px 0 ${c.bodyPaddingLeft}px`,'font-family':t.bodyFont,'font-size':`calc(${t.bodySize} * var(--fontScale,1))`,'font-weight':c.bodyWeight==='auto'?400:c.bodyWeight,'line-height':t.bodyLineHeight,color:c.text,'text-shadow':'none',background:'transparent','border-left':`${c.bodyLeftBorderWidth}px solid ${c.bodyLeftBorderColor}`,'overflow-wrap':'anywhere'}),
 rule(paragraphs,{'margin-top':0,'margin-bottom':t.bodyParagraphGap,'text-indent':`calc(2em * ${t.bodyIndent})`}),
 rule(body+' blockquote',{'border-color':c.accent,background:`color-mix(in srgb,${c.accent} 8%,transparent)`}),
 rule(body+' :is(em,i,q,u,strong,b,blockquote)',{color:'inherit'}),
 rule(body+' :is(img,video)',{'max-width':'100%',height:'auto'}),rule(body+' pre',{'max-width':'100%',overflow:'auto'}),
 rule(body+' > #curEditTextarea',{'box-sizing':'border-box','max-width':'100%','font-family':'inherit','font-size':'inherit','line-height':'inherit'})].join('\n');
}
