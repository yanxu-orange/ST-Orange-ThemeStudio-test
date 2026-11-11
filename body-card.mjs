import {validateCaptionStyle} from './captions.mjs';
export const BODY_CARD_DEFAULTS=Object.freeze({bodyFontLink:null,cardGutter:12,cardFullWidth:false,bodyWeight:'auto',bodyParagraphGap:12,bodyPaddingLeft:10,bodyPaddingRight:10,bodyIndent:false,cardBorderMode:'all',cardBorderColor:'auto',cardBorderWidth:1,cardBorderStyle:'solid',cardBorderTop:true,cardBorderRight:true,cardBorderBottom:true,cardBorderLeft:true});
export function bodyCardSettings(raw={}){
 const value={...BODY_CARD_DEFAULTS};for(const key of Object.keys(value))if(raw[key]!==undefined)value[key]=raw[key];
 value.bodyFontLink=validateCaptionStyle({fontLink:value.bodyFontLink}).fontLink;
 if(value.bodyWeight!=='auto'&&(!Number.isFinite(value.bodyWeight)||value.bodyWeight<100||value.bodyWeight>900))throw Error('正文字重超出范围');
 for(const [key,max]of [['cardGutter',80],['bodyParagraphGap',80],['bodyPaddingLeft',100],['bodyPaddingRight',100],['cardBorderWidth',12]])if(!Number.isFinite(value[key])||value[key]<0||value[key]>max)throw Error('排版数值超出范围：'+key);
 for(const key of ['cardFullWidth','bodyIndent','cardBorderTop','cardBorderRight','cardBorderBottom','cardBorderLeft'])if(typeof value[key]!=='boolean')throw Error('排版开关无效：'+key);
 if(!['none','all','custom'].includes(value.cardBorderMode)||!['solid','dashed','dotted'].includes(value.cardBorderStyle))throw Error('卡片边框选项无效');
 if(value.cardBorderColor!=='auto'&&(typeof value.cardBorderColor!=='string'||!/^#[0-9a-f]{6}$/i.test(value.cardBorderColor)))throw Error('卡片边框颜色无效');return value;
}
export function borderWidths(raw){const c=bodyCardSettings(raw);return ['Top','Right','Bottom','Left'].map(side=>c.cardBorderMode==='none'?0:c.cardBorderMode==='all'||c['cardBorder'+side]?c.cardBorderWidth:0);}
export function borderColor(raw,surface='live'){const c=bodyCardSettings(raw);return c.cardBorderColor==='auto'?(surface==='preview'?'#ffffffaa':'#ffffff88'):c.cardBorderColor;}
const SPECIAL=['blockquote','pre','code','ul','ol','li','details','summary','table','thead','tbody','tfoot','tr','td','th','figure','figcaption','.mes_reasoning','.mes_reasoning_details','.mes_buttons','.mes_edit_buttons'];
const EMBEDDED='pre,code,ul,ol,li,blockquote,details,summary,table,img,picture,video,audio,iframe,svg,canvas,object,embed,form,button,input,select,textarea,[contenteditable],a[role="button"]';
/** Only ordinary paragraphs; neither content nor host nodes are rewritten. */
export function ordinaryParagraphSelector(body){const filter=`:not(:empty):not(:is(${SPECIAL.map(parent=>parent+' p').join(',')})):not(:has(${EMBEDDED}))`;return `${body} > p${filter},${body} > :is(.text_segment,.custom-text_segment) p${filter}`;}
/** Extend only the body over the card’s shared 24px inset; header/avatar/footer keep it. */
export function bodyCardRules(body,card,raw,surface='live',bodyFamily){
 const c=bodyCardSettings(raw),paragraphs=ordinaryParagraphSelector(body);
 return `${card}{border-color:${borderColor(c,surface)}!important;border-style:${c.cardBorderStyle}!important;border-width:${borderWidths(c).map(n=>n+'px').join(' ')}!important}
${body}{${bodyFamily?`font-family:${JSON.stringify(bodyFamily)}!important;`:""}box-sizing:border-box!important;width:calc(100% + 48px)!important;max-width:none!important;margin-left:-24px!important;margin-right:-24px!important;padding-left:${c.bodyPaddingLeft}px!important;padding-right:${c.bodyPaddingRight}px!important;${c.bodyWeight==='auto'?'':`font-weight:${c.bodyWeight}!important;`}}
${paragraphs}{margin-top:0!important;margin-bottom:${c.bodyParagraphGap}px!important;text-indent:${c.bodyIndent?'2em':'0'}!important}`;
}


/** The same chat-area gutters and card limit on both surfaces. */
export function chatFrameRules(chat,card,raw){const c=bodyCardSettings(raw);return `${chat}{box-sizing:border-box!important;padding:20px ${c.cardGutter}px 90px!important;gap:0!important}\n${card}{max-width:${c.cardFullWidth?'none':raw.cardWidth+'px'}!important}\n@media(max-width:700px){${card}{max-width:none!important}}`;}
