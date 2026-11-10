import {ASSETS,assetUrl} from './catalog.mjs';
import {validImage,clone} from './layers.mjs';
import {TIME_FONTS,validateTextItems} from './text-layout.mjs';
export const DRAWERS=[['ai-config-button','生成参数'],['sys-settings-button','API连接'],['advanced-formatting-button','回复格式'],['WI-SP-button','世界书'],['user-settings-button','用户设置'],['backgrounds-button','背景'],['extensions-settings-button','扩展'],['persona-management-button','用户人设'],['rightNavHolder','角色卡']];
export const INPUT_ICONS=[['options_button','菜单'],['extensionsMenuButton','魔棒工具'],['send_but','发送'],['mes_stop','停止']];
const source=()=>({mode:'native',asset:'',image:''});
const surface=()=>({color:'#fffdf8',alpha:1,blur:0,radius:10,borderEnabled:true,borderColor:'#6f8973',borderWidth:1});
export const CHROME_DEFAULTS={topbar:{enabled:false,...surface(),iconSize:22,slot:36,gap:4,padY:4,icons:Object.fromEntries(DRAWERS.map(([id])=>[id,source()]))},input:{enabled:false,...surface(),radius:12,width:100,leftGap:0,rightGap:0,padX:8,padY:8,layout:'inline',fontMode:'interface',font:'sans-serif',fontLink:null,size:16,weight:400,textColor:'#354b42',lineHeight:1.5,minHeight:44,maxHeight:320,iconSize:22,slot:36,gap:6,icons:Object.fromEntries(INPUT_ICONS.map(([id])=>[id,source()]))}};
export function validateChromeSource(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>!['mode','asset','image'].includes(k))||!['native','image'].includes(raw.mode)||typeof raw.asset!=='string'||raw.asset&&!Object.hasOwn(ASSETS,raw.asset)||typeof raw.image!=='string'||raw.image&&!validImage(raw.image))throw Error('按钮图片无效');
 return {mode:raw.mode,asset:raw.asset,image:raw.image};
}
export const chromeSourceUrl=v=>v.mode==='image'?(v.image||assetUrl(v.asset)||''):'';
export function validateChromeStyle(raw){
 if(!raw||Object.keys(raw).some(k=>!['topbar','input'].includes(k)))throw Error('页面外观字段无效');
 const out=clone(CHROME_DEFAULTS);
 for(const zone of ['topbar','input']){
  const v=raw[zone],defaults=out[zone];if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!Object.hasOwn(defaults,k)))throw Error('页面区域字段无效');
  Object.assign(defaults,v);for(const k of ['enabled','borderEnabled'])if(typeof defaults[k]!=='boolean')throw Error('区域开关无效');
  for(const k of ['color','borderColor',...(zone==='input'?['textColor']:[])])if(typeof defaults[k]!=='string'||!/^#[a-f0-9]{6}$/i.test(defaults[k]))throw Error('区域颜色无效');
  const ranges=[['alpha',0,1],['blur',0,24],['radius',0,40],['borderWidth',0,6],['iconSize',12,40],['slot',28,64],['gap',0,zone==='input'?24:16],['padY',0,zone==='input'?32:16],...(zone==='input'?[['width',50,100],['leftGap',0,80],['rightGap',0,80],['padX',0,32],['size',8,60],['lineHeight',1,3],['minHeight',32,160],['maxHeight',80,600]]:[])];
  for(const [k,min,max]of ranges)if(!Number.isFinite(defaults[k])||defaults[k]<min||defaults[k]>max)throw Error('区域数值超出范围：'+k);
  const ids=(zone==='topbar'?DRAWERS:INPUT_ICONS).map(([id])=>id);if(!v.icons||Object.keys(v.icons).length!==ids.length||Object.keys(v.icons).some(k=>!ids.includes(k)))throw Error('按钮列表无效');defaults.icons=Object.fromEntries(ids.map(id=>[id,validateChromeSource(v.icons[id])]));
  if(zone==='input'){
   if(!['inline','stacked'].includes(defaults.layout)||!['interface','chat','custom'].includes(defaults.fontMode)||!TIME_FONTS.includes(defaults.font)||defaults.maxHeight<defaults.minHeight)throw Error('输入区排布或字体无效');
   const item=validateTextItems({name:{weight:defaults.weight,fontLink:defaults.fontLink}}).name;defaults.weight=item.weight;defaults.fontLink=item.fontLink;if(defaults.weight==='auto')throw Error('输入字重无效');
  }
 }
 return out;
}
export function normalizeChromeConfig(raw){
 if(!raw||![1,2,3,4,5,6,7,8,9,10].includes(raw.version))throw Error('方案版本不支持');
 if(raw.version<9&&(Object.hasOwn(raw,'chromeStyle')||raw.layers?.some(l=>l.anchor==='input')))throw Error('旧版本不能包含新页面区域');
 return {...raw,version:Math.max(9,raw.version),chromeStyle:raw.version>=9?validateChromeStyle(raw.chromeStyle):clone(CHROME_DEFAULTS)};
}
export function chromeFontEntries(c){const i=c.chromeStyle.input;return i.enabled&&i.fontMode==='custom'?{'chrome-input':{fontLink:i.fontLink}}:{};}
const rgba=(color,alpha)=>color+Math.round(alpha*255).toString(16).padStart(2,'0');
const surfaceRules=v=>`background:${rgba(v.color,v.alpha)}!important;backdrop-filter:blur(${v.blur}px)!important;border:${v.borderEnabled?v.borderWidth:0}px solid ${v.borderColor}!important;border-radius:${v.radius}px!important;`;
export const LIVE_CHROME_SELECTORS={root:'html[data-orange-live]',topbar:'#top-bar',holder:'#top-settings-holder',drawer:':scope > .drawer',input:'#send_form',nonQR:'#nonQRFormItems',left:'#leftSendForm',right:'#rightSendForm',textarea:'#send_textarea'};
export const PREVIEW_CHROME_SELECTORS={root:'html[data-orange-lab]',topbar:'.otl-page-topbar',holder:'.otl-page-topbar',input:'.otl-page-input',nonQR:'.otl-page-composer',left:'.otl-page-tools',right:'.otl-page-send',textarea:'.otl-page-textarea'};
export function chromeTopMetrics(width,t){const gap=Math.min(t.gap,Math.max(0,width)*.01),slot=Math.min(t.slot,Math.max(1,(width-8-8*gap)/9));return {gap,slot,icon:Math.min(t.iconSize,Math.max(8,slot-6))};}
export function chromeRules(c,s=LIVE_CHROME_SELECTORS,families={},interfaceFamily='sans-serif',preview=false){
 const t=c.chromeStyle.topbar,i=c.chromeStyle.input,r=s.root,top=`${r} ${s.topbar}`,holder=`${r} ${s.holder}`,form=`${r} ${s.input}`,non=`${r} ${s.nonQR}`,text=`${r} ${s.textarea}`;let css='';
 if(t.enabled){const h=t.slot+t.padY*2+(t.borderEnabled?t.borderWidth*2:0);css+=`${r}${preview?'': ' body'}{--topBarBlockSize:${h}px;--topBarIconSize:${t.iconSize}px}${top}{${surfaceRules(t)}height:${h}px!important;box-sizing:border-box!important;box-shadow:none!important}${holder}{height:${h}px!important;box-sizing:border-box!important;display:grid!important;grid-template-columns:repeat(9,minmax(0,1fr));gap:var(--oc-top-gap,${t.gap}px);padding:${t.padY}px 4px;${preview?'':`border:${t.borderEnabled?t.borderWidth:0}px solid transparent;`}align-items:center;overflow:visible!important}${holder} > ${preview?'button':'.drawer'}{min-width:0;${preview?'':'width:auto!important;'}justify-content:center}${holder} ${preview?'button':'.drawer-toggle'}{position:relative;box-sizing:border-box;width:var(--oc-top-slot,${t.slot}px);height:${t.slot}px;display:grid;place-items:center;margin:auto;cursor:pointer}${holder} ${preview?'button':'.drawer-icon'}{position:relative;box-sizing:border-box;font-size:var(--oc-top-icon,${t.iconSize}px);max-width:100%;padding:0;${preview?'':'width:100%;height:100%;display:grid;place-items:center'}}${holder} .openIcon,${holder} [data-demo-open=true]{box-shadow:0 2px 0 ${t.borderColor}}${holder} :focus-visible{outline:2px solid ${t.borderColor};outline-offset:2px}${holder} .redOverlayGlow:after,${holder} [data-demo-disconnected=true]:after{content:'!';position:absolute;right:-5px;top:-5px;display:grid;place-items:center;width:13px;height:13px;border-radius:50%;background:#a42335;color:white;font:bold 10px sans-serif;box-shadow:0 0 0 1px white;pointer-events:none}`;}
 if(i.enabled){
  const family=i.fontMode==='chat'?(families.body?`${JSON.stringify(families.body)},${c.font}`:c.font):i.fontMode==='interface'?interfaceFamily:(families['chrome-input']?`"${families['chrome-input']}",${i.font}`:i.font);
  const textPadY=Math.max(6,(i.minHeight-i.size*i.lineHeight)/2);
  css+=`${form}{${surfaceRules(i)}box-sizing:border-box!important;width:clamp(120px,${i.width}%,calc(100% - ${i.leftGap+i.rightGap}px))!important;max-width:calc(100% - ${i.leftGap+i.rightGap}px)!important;margin-left:${i.leftGap}px!important;margin-right:${i.rightGap}px!important;padding:${i.padY}px ${i.padX}px!important;position:relative;isolation:isolate;overflow:visible}${non}{display:grid!important;grid-template-columns:${i.layout==='stacked'?'minmax(0,1fr) minmax(0,1fr)':'minmax(0,max-content) minmax(0,1fr) minmax(0,max-content)'};gap:${i.gap}px;width:100%;min-width:0;align-items:${i.layout==='inline'?'center':'end'}}${text}{${i.layout==='stacked'?'grid-column:1 / -1;grid-row:1;':'grid-column:2;grid-row:1;'}min-width:0!important;width:100%!important;box-sizing:border-box!important;margin:0!important;border:0!important;padding:${textPadY}px 6px!important;min-height:${i.minHeight}px!important;max-height:min(${i.maxHeight}px,60vh)!important;font-family:${family}!important;font-size:${i.size}px!important;font-weight:${i.weight}!important;color:${i.textColor}!important;line-height:${i.lineHeight}!important;letter-spacing:normal!important;overflow-y:auto;resize:vertical;background:transparent!important}${r} ${s.left},${r} ${s.right}{min-width:0;width:auto!important;height:auto;display:flex;flex-wrap:wrap;align-items:center;gap:${i.gap}px;order:initial!important;padding:0!important;${i.layout==='inline'?'max-width:100%;':''}}${r} ${s.left}{grid-column:1;grid-row:${i.layout==='stacked'?2:1};justify-content:flex-start}${r} ${s.right}{grid-column:${i.layout==='stacked'?2:3};grid-row:${i.layout==='stacked'?2:1};justify-content:flex-end}
${form} :where(${s.left},${s.right}) > ${preview?'button':'div'}{box-sizing:border-box;width:${i.slot}px;height:${i.slot}px;font-size:${i.iconSize}px;line-height:${i.slot}px;text-align:center;margin:0;padding:0;position:relative;flex-shrink:0}
${form} .otl-input-art{position:absolute;inset:0;pointer-events:none;z-index:0}${form} .otl-input-art>img{position:absolute;max-width:none;border:0;border-radius:0;box-shadow:none;pointer-events:none;object-fit:contain}${form}>:not(.otl-input-art){position:relative;z-index:1}`;
 }
 css+=`${r} [data-oc-image]{position:relative}${r} [data-oc-image]:before,${r} [data-oc-image]>i:not([data-oc-owned]){visibility:hidden!important}${r} .otl-chrome-icon{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:var(--oc-icon-size,22px);height:var(--oc-icon-size,22px);max-width:100%;object-fit:contain;pointer-events:none;border:0!important;border-radius:0!important;outline:0!important;box-shadow:none!important}`;
 return css;
}
