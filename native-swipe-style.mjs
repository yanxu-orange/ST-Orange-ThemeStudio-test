import {validateStatStyle,validateStatLabel,statStyleRules} from './native-stat-style.mjs';
export const SWIPE_COUNTER_DEFAULTS={position:'group',anchor:'left',x:0,y:0,mode:'native',pad:false,hideSingle:false,valueStyle:null,label:null,italic:false};
export function swipeValueStyle(s,custom){return {size:s.size,color:s.color,font:'auto',weight:'auto',fontLink:null,...custom};}
export function parseSwipeCounter(text){const m=String(text).replace(/[\u200b\u200c\u200d\ufeff]/g,'').trim().match(/^(\d+)\s*\/\s*(\d+)$/);if(!m)return null;const current=Number(m[1]),total=Number(m[2]);return Number.isSafeInteger(current)&&Number.isSafeInteger(total)&&current>0&&total>0&&current<=total?{current,total}:null;}
export function validateSwipeExtras(s){
 if(s.hideHistoryControls!==undefined&&typeof s.hideHistoryControls!=='boolean')throw Error('历史翻页开关无效');
 for(const k of ['left','right'])validateStatStyle(s[k].valueStyle);
 if(s.counter==null)return;
 const c=s.counter;if(typeof c!=='object'||Array.isArray(c)||Object.keys(c).some(k=>!Object.hasOwn(SWIPE_COUNTER_DEFAULTS,k)))throw Error('版本计数设置无效');
 if(!['group','header','footer'].includes(c.position)||!['left','center','right'].includes(c.anchor)||!['native','current'].includes(c.mode))throw Error('版本计数选项无效');
 if(!Number.isFinite(c.x)||c.x< -100||c.x>100||!Number.isFinite(c.y)||c.y< -160||c.y>160)throw Error('版本计数位置无效');
 for(const k of ['pad','hideSingle','italic'])if(typeof c[k]!=='boolean')throw Error('版本计数开关无效');
 validateStatStyle(c.valueStyle);validateStatLabel(c.label);
}
export function swipeFontEntries(c){const s=c.nativeStyle.swipe,r={};for(const k of ['left','right'])if(s[k].valueStyle)r['native-swipe-'+k]=s[k].valueStyle;if(s.counter?.valueStyle)r['native-swipe-counter-value']=s.counter.valueStyle;if(s.counter?.label?.text&&s.counter.label.style)r['native-swipe-counter-label']=s.counter.label.style;return r;}
export function swipeExtraRules(q,c,families={}){
 const s=c.nativeStyle.swipe,sc={...c,timeColor:c.accent},counter=s.counter,n=`${q} .swipes-counter`;let css='';
 if(s.hideHistoryControls)css+=`${q}[data-otl-native-latest-ai=false] :is(.swipe_left,.swipeRightBlock){display:none!important;}`;
 for(const k of ['left','right'])if(s[k].valueStyle){const sel=`${q} .swipe_${k}`;css+=statStyleRules(sel,{...swipeValueStyle(s,s[k].valueStyle),font:'auto',weight:'auto',fontLink:null},sc);css+=statStyleRules(sel+' > .otl-native-label',swipeValueStyle(s,s[k].valueStyle),sc,families['native-swipe-'+k]);css+=`${sel}[data-otl-native-mode=text]{font-size:0!important;}`;}
 if(!counter)return css;
 const v=swipeValueStyle(s,counter.valueStyle),family=families['native-swipe-counter-value'];
 css+=statStyleRules(n,v,sc,family)+`${n}{font-style:${counter.italic?'italic':'normal'}!important;}`;
 if(counter.position!=='group')css+=`${n}{position:absolute!important;left:var(--on-counter-x,0px)!important;top:var(--on-counter-y,0px)!important;right:auto!important;bottom:auto!important;margin:0!important;min-width:0!important;width:max-content!important;height:auto!important;white-space:nowrap!important;}`;
 css+=`${n}[data-otl-counter-single=true]{display:none!important;}${n}[data-otl-counter-custom=true]{font-size:0!important;}${n}[data-otl-counter-custom=true]::after{content:attr(data-otl-counter-text)!important;pointer-events:none!important;}`+statStyleRules(n+'[data-otl-counter-custom=true]::after',v,sc,family);
 if(counter.label?.text){const label=counter.label,ls=label.style||v,sel=n+'[data-otl-counter-value=true]::before';css+=`${sel}{content:attr(data-otl-counter-label)!important;margin-right:${label.gap}px!important;pointer-events:none!important;}`+statStyleRules(sel,ls,sc,families['native-swipe-counter-label']||(!label.style?family:''));}
 return css;
}
