// Material settings own only glass appearance, never layout or saved host themes.
export const GLASS_REGIONS = Object.freeze(['message','topbar','input','home','settings','worldbook','presets','connection','backgrounds','extensions','personas','characters','formatting']);
export const GLASS_DEFAULTS = Object.freeze({mode:'none',color:'#103948',opacity:0.22,blur:0,refraction:15,highlight:0.65});
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const keys=(v,allowed,label)=>{if(!object(v)||Object.keys(v).some(k=>!allowed.includes(k)))throw Error(label+'字段无效');};
export function normalizeGlassMaterial(raw={}){
 keys(raw,Object.keys(GLASS_DEFAULTS),'玻璃');const v={...GLASS_DEFAULTS,...raw};
 if(!['none','frosted','liquid'].includes(v.mode))throw Error('玻璃类型无效');
 if(typeof v.color!=='string'||!/^#[0-9a-f]{6}$/i.test(v.color))throw Error('玻璃底色无效');
 for(const [k,max]of [['opacity',1],['blur',24],['refraction',30],['highlight',1]])if(!Number.isFinite(v[k])||v[k]<0||v[k]>max)throw Error('玻璃数值无效：'+k);
 return v;
}
export function newGlassStyle(){return {version:1,global:{...GLASS_DEFAULTS},regions:Object.fromEntries(GLASS_REGIONS.map(k=>[k,{source:'inherit'}]))};}
export function normalizeGlassStyle(raw){
 keys(raw,['version','global','regions'],'玻璃设置');if(raw.version!==1)throw Error('玻璃设置版本无效');
 keys(raw.regions??{},GLASS_REGIONS,'玻璃区域');const regions={};
 for(const key of GLASS_REGIONS){const r=raw.regions?.[key]??{source:'inherit'};keys(r,['source','material'],'局部玻璃');
  if(!['inherit','custom','none'].includes(r.source))throw Error('局部玻璃来源无效');
  if(r.source!=='custom'&&r.material!==undefined)throw Error('跟随或关闭的玻璃不能携带独立参数');
  regions[key]=r.source==='custom'?{source:'custom',material:normalizeGlassMaterial(r.material)}:{source:r.source};
 }
 return {version:1,global:normalizeGlassMaterial(raw.global),regions};
}
export function normalizeGlassConfig(raw){return raw.glassStyle===undefined?raw:{...raw,glassStyle:normalizeGlassStyle(raw.glassStyle)};}
// Missing settings deliberately retain the complete old render path. Only an
// explicit glass edit opts an old work into the new material model, in memory.
export function ensureGlassStyle(config){
 if(config.glassStyle!==undefined)return config.glassStyle;
 const g=newGlassStyle();
 if(config.glass>0)g.regions.message={source:'custom',material:{...GLASS_DEFAULTS,mode:'frosted',color:config.surface??'#fffdf8',opacity:config.surfaceOpacity??0.81,blur:config.glass,highlight:0}};
 for(const key of ['topbar','input']){const v=config.chromeStyle?.[key];if(v?.blur>0)g.regions[key]={source:'custom',material:{...GLASS_DEFAULTS,mode:'frosted',color:v.color,opacity:v.alpha,blur:v.blur,highlight:0}};}
 config.glassStyle=g;return g;
}
export function resolveGlass(config,region){
 if(config.glassStyle===undefined)return null;
 const g=normalizeGlassStyle(config.glassStyle);if(!GLASS_REGIONS.includes(region))throw Error('玻璃区域无效');
 const r=g.regions[region];return r.source==='none'?{...GLASS_DEFAULTS,mode:'none'}:r.source==='custom'?r.material:g.global;
}
export function setGlassSource(config,region,source){
 if(!GLASS_REGIONS.includes(region)||!['inherit','custom','none'].includes(source))throw Error('玻璃来源无效');
 const g=ensureGlassStyle(config),current=resolveGlass(config,region);
 g.regions[region]=source==='custom'?{source,material:{...current}}:{source};
 return g.regions[region];
}
