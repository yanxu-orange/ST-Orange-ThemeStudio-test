import {ICONS,iconUrl} from './icon-catalog.mjs';
export const ICON_STYLE_FIELDS=['icon','tint','fillMode','color','color2','gradientAngle','size'];
export const ICON_STYLE_DEFAULTS={icon:'',tint:false,fillMode:'solid',color:'#6f8973',color2:'#e9ca81',gradientAngle:90,size:0};
/** Optional fields stay optional so old saved themes round-trip unchanged. */
export function validateIconStyle(raw){
 const out={};for(const k of ICON_STYLE_FIELDS)if(Object.hasOwn(raw,k))out[k]=raw[k];
 if('icon'in out&&(typeof out.icon!=='string'||out.icon&&!Object.hasOwn(ICONS,out.icon)))throw Error('内置图标无效');
 if('tint'in out&&typeof out.tint!=='boolean')throw Error('图标染色开关无效');
 if('fillMode'in out&&!['solid','gradient'].includes(out.fillMode))throw Error('图标填色无效');
 for(const k of ['color','color2'])if(k in out&&(typeof out[k]!=='string'||!/^#[a-f0-9]{6}$/i.test(out[k])))throw Error('图标颜色无效');
 if('gradientAngle'in out&&(!Number.isFinite(out.gradientAngle)||out.gradientAngle<0||out.gradientAngle>360))throw Error('图标渐变角度无效');
 if('size'in out&&(!Number.isFinite(out.size)||(out.size!==0&&(out.size<12||out.size>40))))throw Error('图标尺寸无效');
 return out;
}
export const iconStyle=v=>({...ICON_STYLE_DEFAULTS,tint:!!v?.icon,...validateIconStyle(v||{})});
export const builtinIconUrl=v=>v?.icon&&Object.hasOwn(ICONS,v.icon)?iconUrl(v.icon):'';
export function iconFill(v){const s=iconStyle(v);return s.fillMode==='gradient'?`linear-gradient(${s.gradientAngle}deg,${s.color},${s.color2})`:s.color;}
/** Alpha masking preserves the source silhouette and paints exact selected colors. */
export function styleIconElement(wrapper,image,src,raw,defaultSize){
 const s=iconStyle(raw),size=s.size||defaultSize,mask=s.tint?`url(${JSON.stringify(src)})`:'';
 const styles={width:size+'px',height:size+'px',display:'inline-block',pointerEvents:'none',background:s.tint?iconFill(s):'transparent',maskImage:mask,webkitMaskImage:mask,maskMode:'alpha',maskSize:'contain',webkitMaskSize:'contain',maskPosition:'center',webkitMaskPosition:'center',maskRepeat:'no-repeat',webkitMaskRepeat:'no-repeat'};
 for(const [key,value]of Object.entries(styles))if(wrapper.style[key]!==value)wrapper.style[key]=value;
 wrapper.style.setProperty('--oc-icon-size',size+'px');
 Object.assign(image.style,{display:'block',width:'100%',height:'100%',objectFit:'contain',opacity:s.tint?'0':'1',pointerEvents:'none'});
 image.alt='';image.setAttribute('aria-hidden','true');wrapper.setAttribute('aria-hidden','true');
 return size;
}
