import {GLASS_DEFAULTS,ensureGlassStyle,resolveGlass,setGlassSource} from './glass-model.mjs';
export function createGlassEditor({getConfig,make,field,editorControl,propertyHeading,remember,apply,renderFields,notify}){
 const changed=()=>{apply();renderFields();notify?.('玻璃效果已更新，尚未保存');};
 function select(container,label,value,options,onChange){const row=make('label','field',label),input=make('select');input.setAttribute('aria-label',label);for(const [key,text]of options){const option=make('option','',text);option.value=key;input.append(option);}input.value=value;input.addEventListener('change',()=>{remember();onChange(input.value);changed();});row.append(input);container.append(row);}
 function materialFields(container,target){
  select(container,'玻璃类型',target.mode,[['none','无玻璃'],['frosted','磨砂玻璃'],['liquid','液态玻璃']],value=>{target.mode=value;if(value==='liquid')target.blur=0;else if(value==='frosted'&&target.blur===0)target.blur=8;});
  if(target.mode==='none')return;
  for(const f of [field('玻璃底色','color','color'),field('玻璃不透明度','opacity','range',{min:0,max:1,step:0.01}),field('背景模糊','blur','range',{min:0,max:24,unit:'px'}),...(target.mode==='liquid'?[field('折射强度','refraction','range',{min:0,max:30,unit:'px'}),field('边缘高光','highlight','range',{min:0,max:1,step:0.05})]:[])])editorControl(container,f,target);
 }
 function renderGlassFields(container,{region,global=false}={}){
  const config=getConfig();propertyHeading(container,global?'全局玻璃效果':'玻璃效果');
  if(global){
   if(!config.glassStyle){select(container,'玻璃类型','none',[['none','无玻璃'],['frosted','磨砂玻璃'],['liquid','液态玻璃']],mode=>{const g=ensureGlassStyle(config);g.global={...GLASS_DEFAULTS,mode,blur:mode==='frosted'?8:0};});return false;}
   materialFields(container,config.glassStyle.global);return config.glassStyle.global.mode!=='none';
  }
  const raw=config.glassStyle?.regions?.[region];
  select(container,'玻璃设置',raw?.source??'inherit',[['inherit','跟随全局'],['custom','单独设置'],['none','无玻璃']],source=>setGlassSource(config,region,source));
  if(raw?.source==='custom')materialFields(container,raw.material);
  return resolveGlass(config,region)?.mode!=='none'&&resolveGlass(config,region)!==null;
 }
 return {renderGlassFields};
}
