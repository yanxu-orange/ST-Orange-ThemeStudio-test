import {GLASS_REGIONS,resolveGlass} from './glass-model.mjs';
export const glassFilterId=(m,namespace='live')=>`otl-glass-${namespace}-${m.refraction}-${m.blur}`.replaceAll('.','_');
const rgba=(color,alpha)=>`rgba(${[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)).join(',')},${alpha})`;
export function glassSurfaceDeclarations(config,region,{preview=false,portable=false}={}){
 const m=resolveGlass(config,region);if(!m)return '';
 if(m.mode==='none')return ['none','custom'].includes(config.glassStyle.regions?.[region]?.source)?'backdrop-filter:none!important;-webkit-backdrop-filter:none!important;':'';
 const cyanHighlight=Math.min(1,Number((.48*(m.highlight/.65)).toFixed(6)));
 const fallback=`blur(${m.blur}px)`,filter=m.mode==='liquid'&&!portable?`url("#${glassFilterId(m,preview?'preview':'live')}")`:fallback;
 // background-color preserves an explicitly chosen surface image. A surface's
 // own image is not its backdrop; we must not silently erase that artwork.
 return `background-color:${rgba(m.color,m.opacity)}!important;-webkit-backdrop-filter:${fallback}!important;backdrop-filter:${fallback}!important;${filter!==fallback?`-webkit-backdrop-filter:${filter}!important;backdrop-filter:${filter}!important;`:''}${m.mode==='liquid'?`box-shadow:inset 1px 1px 2px ${rgba('#ffffff',m.highlight)},inset -1px -1px 3px rgba(117,185,211,${cyanHighlight}),0 8px 18px rgba(8,45,57,0.125)!important;`:''}`;
}
export function glassRule(selector,config,region,options){const css=glassSurfaceDeclarations(config,region,options);return css?`${selector}{${css}}`:'';}
export function liquidGlassProfiles(config){const profiles=new Map();for(const key of GLASS_REGIONS){const m=resolveGlass(config,key);if(m?.mode==='liquid')profiles.set(`${m.refraction}/${m.blur}`,m);}return [...profiles.values()];}
// A plain CSS file cannot carry inline SVG definitions. Exporters must opt into
// this explicit fallback (and disclose it), or export the accompanying runtime.
export function glassExportInfo(config){return liquidGlassProfiles(config).length?{requiresSvg:true,standaloneCss:'frosted-fallback',notice:'液态折射依赖绘境；独立 CSS 保留底色与高光，折射回退为背景模糊。'}:{requiresSvg:false,standaloneCss:'complete',notice:''};}
