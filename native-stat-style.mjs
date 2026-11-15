import {validateCaptionStyle} from './captions.mjs';
export const STAT_KEYS=['floor','time','tokens'];
export function resolveNativeStats(stats,isUser=false){return stats.design==='separate'?{...stats,...stats.roles[isUser?'user':'ai']}:stats;}
export function statValueStyle(stats,key){return {size:stats.size,color:stats.color,font:'auto',weight:'auto',fontLink:null,...stats[key].valueStyle};}
export function validateStatStyle(style){
 if(style==null)return;
 if(typeof style!=='object'||Array.isArray(style)||Object.keys(style).some(k=>!['size','color','font','weight','fontLink'].includes(k)))throw Error('楼层信息外观无效');
 if(!Number.isFinite(style.size)||style.size<8||style.size>28)throw Error('楼层信息字号超出范围');
 if(style.color!=='auto'&&(typeof style.color!=='string'||!/^#[a-f0-9]{6}$/i.test(style.color)))throw Error('楼层信息颜色无效');
 if(style.font!=='auto'&&(typeof style.font!=='string'||!['serif','sans-serif','Georgia, serif','monospace','"LabSongti",serif'].includes(style.font)))throw Error('楼层信息字体无效');
 if(style.weight!=='auto'&&(!Number.isFinite(style.weight)||style.weight<100||style.weight>900))throw Error('楼层信息字重无效');
 validateCaptionStyle({fontLink:style.fontLink});
}
export function validateStatLabel(label){
 if(label==null)return;
 if(typeof label!=='object'||Array.isArray(label)||Object.keys(label).some(k=>!['text','style','gap'].includes(k))||typeof label.text!=='string'||label.text.length>40||/[\r\n]/.test(label.text))throw Error('楼层信息标签无效');
 if(!Number.isFinite(label.gap)||label.gap<0||label.gap>40)throw Error('标签间距超出范围');validateStatStyle(label.style);
}
export function nativeStatFontEntries(config){const result={},stats=config.nativeStyle.stats,scopes=stats.design==='separate'?['ai','user']:[''];for(const scope of scopes){const selected=resolveNativeStats(stats,scope==='user'),prefix='native-'+(scope?scope+'-':'');for(const key of STAT_KEYS){const item=selected[key];if(item.valueStyle)result[prefix+key+'-value']=item.valueStyle;if(item.label?.text&&item.label.style)result[prefix+key+'-label']=item.label.style;}}return result;}
export function statStyleRules(selector,style,config,family){return `${selector}{font-size:${style.size}px!important;color:${style.color==='auto'?config.timeColor:style.color}!important;${style.font==='auto'&&!family?'':`font-family:${family?JSON.stringify(family):style.font}!important;`}${style.weight==='auto'?'':`font-weight:${style.weight}!important;`}}`;}
function scopedStatRules(q,config,families,stats,prefix){
 return STAT_KEYS.map((key,i)=>{
  const item=stats[key],value=statValueStyle(stats,key),role=`${q} [data-otl-native-role="stat-${i}"]`,label=item.label;
  let css=statStyleRules(role,value,config,families[prefix+key+'-value']);
  if(key==='floor')css+=`${role}[data-otl-native-floor-custom=true]{font-size:0!important;}`+statStyleRules(role+'[data-otl-native-floor-custom=true]::after',value,config,families[prefix+key+'-value']);
  if(label?.text){const ls=label.style||value,sel=role+'[data-otl-stat-value=true]::before';css+=`${sel}{display:inline!important;content:attr(data-otl-stat-label)!important;margin-right:${label.gap}px!important;pointer-events:none!important;}`+statStyleRules(sel,ls,config,families[prefix+key+'-label']||(!label.style?families[prefix+key+'-value']:''));css+=`${role}[data-otl-stat-value=false]::before{display:none!important;}`;}
  return css;
 }).join('\n');
}

export function nativeStatRules(q,config,families={}){const stats=config.nativeStyle.stats;if(stats.design!=='separate')return scopedStatRules(q,config,families,stats,'native-');return scopedStatRules(q+':not([is_user="true"])',config,families,resolveNativeStats(stats,false),'native-ai-')+'\n'+scopedStatRules(q+'[is_user="true"]',config,families,resolveNativeStats(stats,true),'native-user-');}
