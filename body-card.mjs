import {validateCaptionStyle} from './captions.mjs';
export const CARD_SHADOW_VALUE='0 5px 25px #344b4210';
export const cardShadowValue=c=>c.cardShadow===false?'none':CARD_SHADOW_VALUE;
export const BODY_CARD_DEFAULTS=Object.freeze({cardPadding:24,cardShadow:true,bodyFontLink:null,cardGutter:12,messageGap:18,cardFullWidth:false,bodyWeight:'auto',bodyParagraphGap:12,bodyInset:0,bodyPaddingLeft:10,bodyPaddingRight:10,bodyIndent:false,bodyLeftBorderWidth:0,bodyLeftBorderColor:'#e48fa6',cardBorderMode:'all',cardBorderColor:'auto',cardBorderWidth:1,cardBorderStyle:'solid',cardBorderTop:true,cardBorderRight:true,cardBorderBottom:true,cardBorderLeft:true});
export function bodyCardSettings(raw={}){
 const value={...BODY_CARD_DEFAULTS};for(const key of Object.keys(value))if(raw[key]!==undefined)value[key]=raw[key];
 if(raw.chatMaxWidth!==undefined){
  if(!Number.isFinite(raw.chatMaxWidth)||raw.chatMaxWidth<320||raw.chatMaxWidth>2000)throw Error('聊天与输入栏最大宽度超出范围');
  value.chatMaxWidth=raw.chatMaxWidth;
 }
 value.bodyFontLink=validateCaptionStyle({fontLink:value.bodyFontLink}).fontLink;
 if(value.bodyWeight!=='auto'&&(!Number.isFinite(value.bodyWeight)||value.bodyWeight<100||value.bodyWeight>900))throw Error('正文字重超出范围');
 for(const [key,max]of [['cardPadding',80],['messageGap',120],['cardGutter',80],['bodyParagraphGap',80],['bodyInset',80],['bodyPaddingLeft',100],['bodyPaddingRight',100],['cardBorderWidth',12],['bodyLeftBorderWidth',12]])if(!Number.isFinite(value[key])||value[key]<0||value[key]>max)throw Error('排版数值超出范围：'+key);
 for(const key of ['cardShadow','cardFullWidth','bodyIndent','cardBorderTop','cardBorderRight','cardBorderBottom','cardBorderLeft'])if(typeof value[key]!=='boolean')throw Error('排版开关无效：'+key);
 if(!['none','all','custom'].includes(value.cardBorderMode)||!['solid','dashed','dotted','paper'].includes(value.cardBorderStyle))throw Error('卡片边框选项无效');
 if(typeof value.bodyLeftBorderColor!=='string'||!/^#[0-9a-f]{6}$/i.test(value.bodyLeftBorderColor))throw Error('正文左边框颜色无效');
 if(value.cardBorderColor!=='auto'&&(typeof value.cardBorderColor!=='string'||!/^#[0-9a-f]{6}$/i.test(value.cardBorderColor)))throw Error('卡片边框颜色无效');return value;
}
export function borderWidths(raw){const c=bodyCardSettings(raw);return ['Top','Right','Bottom','Left'].map(side=>c.cardBorderMode==='none'?0:c.cardBorderMode==='all'||c['cardBorder'+side]?c.cardBorderWidth:0);}
const selectedBorderColor=(c,surface)=>c.cardBorderColor==='auto'?(surface==='preview'?'#ffffffaa':'#ffffff88'):c.cardBorderColor;
export function borderColor(raw,surface='live'){const c=bodyCardSettings(raw);return c.cardBorderStyle==='paper'?'transparent':selectedBorderColor(c,surface);}
export const physicalBorderStyle=c=>c.cardBorderStyle==='paper'?'solid':c.cardBorderStyle;
const paperStrokes=[
 ['390 10','M1 10Q1 1.5 10 1.5L90 1.9 180 1.2 270 1.8 380 1.5Q389 1.5 389 10'],
 ['8 100','M6.5 0L6.2 20 6.8 41 6.3 62 6.7 82 6.5 100'],
 ['390 10','M1 0Q1 8.5 10 8.5L90 8.1 180 8.8 270 8.2 380 8.5Q389 8.5 389 0'],
 ['8 100','M1.5 0L1.8 20 1.2 41 1.7 62 1.3 82 1.5 100'],
];
export function paperCardEdgeDeclarations(raw,surface='live'){
 if(raw.cardBorderStyle!=='paper')return {};
 const c=bodyCardSettings(raw),widths=borderWidths(c),color=selectedBorderColor(c,surface);
 const top=widths[0]?10:0,bottom=widths[2]?10:0,verticalSize=`8px calc(100% - ${top+bottom}px)`;
 const positions=['center top',`right 0px top ${top}px`,'center bottom',`left 0px top ${top}px`];
 const sizes=['100% 10px',verticalSize,'100% 10px',verticalSize];
 const edges=widths.flatMap((width,index)=>{
  if(!width)return [];
  const [viewBox,path]=paperStrokes[index];
  const image=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBox}" preserveAspectRatio="none" fill="none"><path d="${path}" stroke="${color}" stroke-width="${width}" vector-effect="non-scaling-stroke"/></svg>`;
  return [{image:`url("data:image/svg+xml,${encodeURIComponent(image)}")`,position:positions[index],size:sizes[index]}];
 });
 if(!edges.length)return {};
 return {
  'background-image':edges.map(edge=>edge.image).join(','),
  'background-position':edges.map(edge=>edge.position).join(','),
  'background-size':edges.map(edge=>edge.size).join(','),
  'background-repeat':'no-repeat','background-origin':'border-box','background-clip':'border-box',
 };
}
const SPECIAL=['blockquote','pre','code','ul','ol','li','details','summary','table','thead','tbody','tfoot','tr','td','th','figure','figcaption','.mes_reasoning','.mes_reasoning_details','.mes_buttons','.mes_edit_buttons'];
const EMBEDDED='pre,code,ul,ol,li,blockquote,details,summary,table,img,picture,video,audio,iframe,svg,canvas,object,embed,form,button,input,select,textarea,[contenteditable],a[role="button"]';
/** Only ordinary paragraphs; neither content nor host nodes are rewritten. */
export function ordinaryParagraphSelector(body){const filter=`:not(:empty):not(:is(${SPECIAL.map(parent=>parent+' p').join(',')})):not(:has(${EMBEDDED}))`;return `${body} > p${filter},${body} > :is(.text_segment,.custom-text_segment) p${filter}`;}
/** Extend only the body over the card’s configured inset; header/avatar/footer keep it. */
export function bodyCardRules(body,card,raw,surface='live',bodyFamily){
 const c=bodyCardSettings(raw),paragraphs=ordinaryParagraphSelector(body),outset=c.cardPadding-c.bodyInset;
 const paper=Object.entries(paperCardEdgeDeclarations(c,surface)).map(([key,value])=>`;${key}:${value}!important`).join('');
 return `${card}{border-color:${borderColor(c,surface)}!important;border-style:${physicalBorderStyle(c)}!important;border-width:${borderWidths(c).map(n=>n+'px').join(' ')}!important${paper}}
${body}{${bodyFamily?`font-family:${JSON.stringify(bodyFamily)}!important;`:""}${c.bodyLeftBorderWidth?`border-left:${c.bodyLeftBorderWidth}px solid ${c.bodyLeftBorderColor}!important;`:''}box-sizing:border-box!important;width:calc(100% + ${outset*2}px)!important;max-width:none!important;margin-left:${-outset}px!important;margin-right:${-outset}px!important;padding-left:${c.bodyPaddingLeft}px!important;padding-right:${c.bodyPaddingRight}px!important;${c.bodyWeight==='auto'?'':`font-weight:${c.bodyWeight}!important;`}}
${body} blockquote{border-color:${raw.accent||'currentColor'}!important;background:color-mix(in srgb,${raw.accent||'currentColor'} 8%,transparent)!important;}
${body} :is(em,i,q,u,strong,b,blockquote){color:inherit!important;}
${paragraphs}{margin-top:0!important;margin-bottom:${c.bodyParagraphGap}px!important;text-indent:${c.bodyIndent?'2em':'0'}!important}`;
}


/** The same chat-area gutters and card limit on both surfaces. */
export function chatFrameRules(chat,card,raw){const c=bodyCardSettings(raw);return `${chat}{box-sizing:border-box!important;padding:20px ${c.cardGutter}px 90px!important;gap:0!important}\n${card}{margin-bottom:${c.messageGap}px!important;max-width:${c.cardFullWidth?'none':raw.cardWidth+'px'}!important}\n@media(max-width:700px){${card}{max-width:none!important}}`;}
export function sharedChatWidthRules(c,scope=''){
 if(c.chatMaxWidth===undefined)return '';
 const shell=(scope?scope+' ':'')+'#sheld';
 return `${shell} > #chat,${shell} > #form_sheld{box-sizing:border-box!important;width:100%!important;min-width:0!important;max-width:${c.chatMaxWidth}px!important;margin-inline:auto!important}`;
}


export const cardPadding=c=>c.cardPadding??24;
