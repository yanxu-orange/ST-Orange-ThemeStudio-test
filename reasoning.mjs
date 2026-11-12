import {TIME_FONTS,validateTextItems} from './text-layout.mjs';
import {validImage} from './layers.mjs';
import {ASSETS,assetUrl} from './catalog.mjs';
export const REASONING_LEGACY=['reasoning','reasoningFont','reasoningSize'];
const geometry={width:'auto',minHeight:0,radius:0,paddingX:0,paddingY:8};
const background={mode:'none',color:'#eeeeee',opacity:1,source:null,fit:'cover',x:50,y:50};
const container={background:'none',color:'#ffffff',radius:0,borderWidth:0,borderColor:'#cccccc',borderStyle:'solid',paddingX:12,paddingY:12};
const font={fontSource:'custom',font:'serif',size:14,weight:'auto',color:'auto',fontLink:null};
function object(v,keys){if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!keys.includes(k)))throw Error('思维设置字段无效');}
function number(v,min,max){if(!Number.isFinite(v)||v<min||v>max)throw Error('思维设置数值超出范围');}
function choice(v,options){if(!options.includes(v))throw Error('思维设置选项无效');}
function color(v,auto=false){if(!(auto&&v==='auto')&&(typeof v!=='string'||!/^#[a-f0-9]{6}$/i.test(v)))throw Error('思维颜色无效');}
export function validateReasoningStyle(raw){
 object(raw,['entry','body']);object(raw.entry,[...Object.keys(font),'content','background','geometry','showArrow','labelPosition']);object(raw.body,[...Object.keys(font),'container']);
 const e=raw.entry,b=raw.body;
 if(typeof e.showArrow!=='boolean')throw Error('思维入口箭头设置无效');
 object(e.labelPosition,['x','y']);number(e.labelPosition.x,-500,500);number(e.labelPosition.y,-500,500);
 if(typeof e.content!=='string'||e.content.length>300)throw Error('思维入口文字过长');
 for(const [v,max]of [[e,34],[b,28]]){choice(v.fontSource,['body','interface','custom']);choice(v.font,TIME_FONTS);number(v.size,10,max);color(v.color,true);validateTextItems({name:{weight:v.weight,fontLink:v.fontLink}});if(v.weight===undefined||v.fontLink===undefined)throw Error('思维字体设置缺失');}
 object(e.geometry,Object.keys(geometry));const g=e.geometry;if(g.width!=='auto')number(g.width,20,100);for(const [k,max]of [['minHeight',160],['radius',40],['paddingX',40],['paddingY',40]])number(g[k],0,max);
 object(e.background,Object.keys(background));const a=e.background;choice(a.mode,['none','color','image']);color(a.color);number(a.opacity,0,1);choice(a.fit,['cover','contain']);number(a.x,0,100);number(a.y,0,100);
 if(a.source!==null){object(a.source,['kind','asset','image']);if(a.source.kind==='asset'){if(!Object.hasOwn(ASSETS,a.source.asset)||a.source.image!=='')throw Error('思维背景素材无效');}else if(a.source.kind!=='custom'||a.source.asset!==''||!validImage(a.source.image))throw Error('思维背景图片无效');}
 object(b.container,Object.keys(container));const c=b.container;choice(c.background,['none','color']);color(c.color);color(c.borderColor);choice(c.borderStyle,['solid','dashed','dotted']);for(const [k,max]of [['radius',40],['borderWidth',8],['paddingX',40],['paddingY',40]])number(c[k],0,max);
 const out=structuredClone(raw);for(const part of ['entry','body'])out[part].fontLink=validateTextItems({name:{weight:raw[part].weight,fontLink:raw[part].fontLink}}).name.fontLink;return out;
}
export function normalizeReasoningConfig(raw){
 if(!raw||![1,2,3,4,5,6,7,8,9,10].includes(raw.version))throw Error('方案版本不支持');
 let style;
 if(raw.version>=5){if(REASONING_LEGACY.some(k=>Object.hasOwn(raw,k)))throw Error('新版方案不能包含旧思维镜像');style=validateReasoningStyle(raw.reasoningStyle);}
 else{
  if(Object.hasOwn(raw,'reasoningStyle'))throw Error('旧版本不能包含新思维设置');
  const content=raw.reasoning===undefined?'展开这页思绪':raw.reasoning,face=raw.reasoningFont===undefined?'serif':raw.reasoningFont,size=raw.reasoningSize===undefined?14:raw.reasoningSize;
  // Preserve the exact legacy acceptance boundary before migration.
  if(typeof content!=='string'||content.length>300||!TIME_FONTS.includes(face)||!Number.isFinite(size)||size<12||size>24)throw Error('旧思维设置无效');
  style=validateReasoningStyle({entry:{...font,content,font:face,size,showArrow:false,labelPosition:{x:0,y:0},background:{...background},geometry:{...geometry}},body:{...font,font:face,size:15,container:{...container}}});
 }
 const out={...raw,version:Math.max(5,raw.version),reasoningStyle:style};for(const k of REASONING_LEGACY)delete out[k];return out;
}
export function reasoningFontEntries(c){return Object.fromEntries(['entry','body'].filter(k=>c.reasoningStyle[k].fontSource==='custom').map(k=>['reasoning:'+k,c.reasoningStyle[k]]));}
export function interfaceFont(document){const value=document.defaultView?.getComputedStyle?.(document.body)?.fontFamily;return value||'sans-serif';}
export function reasoningImageUrl(source){return source?.kind==='asset'?assetUrl(source.asset):source?.kind==='custom'?source.image:'';}
export function reasoningLabel(content,duration){return content+(duration&&duration!=='unknown'&&Number.isFinite(Number(duration))?' · '+duration+' s':'');}
// Both surfaces use a block containing frame: auto width means fill the available
// header block, not intrinsic flex-item width inherited from native ST classes.
export function reasoningShellRules(root){return `${root} .mes_reasoning_summary{display:flex!important;cursor:pointer;box-sizing:border-box!important;min-width:0!important;max-width:100%!important;margin:0!important;padding:0!important;gap:8px;flex-wrap:nowrap!important}
${root} .mes_reasoning_actions .mes_button{color:inherit!important;filter:none!important;text-shadow:none!important;}
${root} .mes_reasoning_actions .mes_button:not(:disabled):not([aria-disabled=true]):not(.disabled){opacity:1!important;}
${root} .mes_reasoning_header_block{display:block!important;flex:1;min-width:0}
${root} .mes_reasoning_header_title[data-otl-live-reasoning]{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip-path:inset(50%)!important;white-space:nowrap!important}`;}
export function reasoningRules(entry,body,bg,c,families={},interfaceFamily='sans-serif'){
 const s=c.reasoningStyle,e=s.entry,b=s.body,g=e.geometry,a=e.background,t=b.container;
 const family=(part,key)=>{const value=part.fontSource==='body'?(families.body?`${JSON.stringify(families.body)},${c.font}`:c.font):part.fontSource==='interface'?interfaceFamily:part.font;return part.fontSource==='custom'&&families['reasoning:'+key]?'"'+families['reasoning:'+key]+'",'+value:value;};
 const typography=(v,key)=>`font-family:${family(v,key)}!important;font-size:${v.size}px!important;font-weight:${v.weight==='auto'?400:v.weight}!important;color:${v.color==='auto'?(key==='entry'?c.accent:c.text):v.color}!important;line-height:${key==='entry'?1.6:1.8}!important;`;
 const url=reasoningImageUrl(a.source),image=a.mode==='image'&&url?'url('+JSON.stringify(url)+')':'none';
 return `${entry}{position:relative!important;display:flex!important;gap:8px;flex-wrap:nowrap!important;align-items:baseline!important;box-sizing:border-box!important;min-width:0!important;max-width:100%!important;width:${g.width==='auto'?'auto':g.width+'%'}!important;min-height:${g.minHeight}px!important;padding:${g.paddingY}px ${g.paddingX}px!important;margin:0!important;border:0!important;border-radius:${g.radius}px!important;background:transparent!important;${typography(e,'entry')}overflow-wrap:anywhere;}
${entry} > :not(.otl-reasoning-bg):not(.otl-live-art):not(.otl-decoration){position:relative;z-index:1}
${entry} .mes_reasoning_arrow{display:${e.showArrow?'inline-block':'none'}!important;position:static!important;flex:0 0 auto!important;align-self:center;transform:none!important;margin-left:8px}
${entry} .mes_reasoning_arrow:is(.mes_reasoning_details:not([open]) *){transform:rotate(180deg)!important}
${entry} :is(.otl-live-reasoning,.otl-reasoning-title){transform:translate(${e.labelPosition.x}px,${e.labelPosition.y}px)!important;min-width:0;${typography(e,'entry')}white-space:pre-wrap;overflow-wrap:anywhere}
${bg}{display:block!important;position:absolute!important;inset:0!important;z-index:0!important;pointer-events:none!important;border-radius:inherit!important;background-color:${a.mode==='color'?a.color:'transparent'}!important;background-image:${image}!important;background-size:${a.fit}!important;background-position:${a.x}% ${a.y}%!important;background-repeat:no-repeat!important;opacity:${a.opacity}!important;}
${body}{position:relative!important;box-sizing:border-box!important;min-width:0!important;margin:8px 0!important;padding:${t.paddingY}px ${t.paddingX}px!important;border:${t.borderWidth}px ${t.borderStyle} ${t.borderColor}!important;border-radius:${t.radius}px!important;background:${t.background==='color'?t.color:'transparent'}!important;${typography(b,'body')}overflow-wrap:anywhere;overflow:visible!important;}
${body} blockquote{border-color:${c.accent}!important;background:color-mix(in srgb,${c.accent} 8%,transparent)!important;}
${body} :is(em,i,q,u,strong,b,blockquote){color:inherit!important;}
${body} > p{font-family:inherit!important;font-size:inherit!important;line-height:inherit!important;color:inherit!important;}`;
}
export function watchInterfaceFont(document,onChange,{fontEvents=true}={}){
 const win=document.defaultView;let active=true,current=interfaceFont(document);
 const check=()=>{if(!active)return;const next=interfaceFont(document);if(next!==current){current=next;onChange(next);}};
 const observer=win?.MutationObserver?new win.MutationObserver(check):null;
 for(const node of [document.documentElement,document.body])if(node)observer?.observe(node,{attributes:true,attributeFilter:['class','style']});
 win?.addEventListener?.('resize',check);if(fontEvents){document.fonts?.addEventListener?.('loadingdone',check);document.fonts?.ready?.then?.(check,()=>{});}
 return ()=>{active=false;observer?.disconnect();win?.removeEventListener?.('resize',check);document.fonts?.removeEventListener?.('loadingdone',check);};
}
