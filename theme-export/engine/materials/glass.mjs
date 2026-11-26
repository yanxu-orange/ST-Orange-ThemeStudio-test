import {GLASS_REGIONS,resolveGlass} from '../../../glass-model.mjs';
import {glassSurfaceDeclarations} from '../../../glass-style.mjs';
import {PAGE_ROOTS} from '../../../page-style.mjs';
import {Q} from '../core/regions/shared.mjs';
export function assessGlass(c){const active=new Map();for(const region of GLASS_REGIONS){if(resolveGlass(c,region)?.mode!=='liquid')continue;const source=c.glassStyle.regions[region].source,field=source==='custom'?`glassStyle.regions.${region}.material.mode`:'glassStyle.global.mode';if(!active.has(field))active.set(field,[]);active.get(field).push(region);}return [...active].map(([field,regions])=>({severity:'error',code:'GLASS_RUNTIME_REQUIRED',field,regions,reason:'Liquid refraction is active in '+regions.join(', ')+'. The complete liquid effect requires companion runtime; it is not silently replaced with frosted blur.'}));}
export function standaloneGlassCss(c){
 if(assessGlass(c).length)throw Error('Liquid material requires runtime');
 const out=[];
 for(const region of GLASS_REGIONS){let css=glassSurfaceDeclarations(c,region);
  if(!css&&region==='message'&&c.glass>0)css=`backdrop-filter:blur(${c.glass}px)!important;-webkit-backdrop-filter:blur(${c.glass}px)!important;`;
  if(!css)continue;
  const target=region==='message'?Q:region==='topbar'?'#top-bar':region==='input'?'#send_form':region==='home'?'#chat > .welcomePanel .recentChatList > .recentChat':PAGE_ROOTS[region];
  // Same outer element, one cascade winner; no nested panel/entry filtering.
  out.push({region,css:`${target},body.no-blur ${target}{${css}}`});
 }
 return out;
}
export const legacyGlassActive=c=>c.glass>0&&!glassSurfaceDeclarations(c,'message');
export function glassCoverage(c){const g=c.glassStyle;if(!g)return [];const used=Object.values(g.regions).some(v=>v.source==='inherit')&&g.global.mode!=='none';return [{field:'glassStyle.global',owner:'static-material',status:used?(g.global.mode==='liquid'?'unsupported':'consumed'):'inactive',reason:'Only effective inherited material matters; dormant global liquid does not block'},...GLASS_REGIONS.map(region=>{const m=resolveGlass(c,region),source=g.regions[region].source;return {field:'glassStyle.regions.'+region,owner:'static-material',status:m.mode==='liquid'?'unsupported':m.mode==='none'&&source==='inherit'?'inactive':'consumed',reason:m.mode==='liquid'?'Whole liquid effect requires runtime':m.mode==='none'?'Explicit local off clears material filter; inherited none leaves older surface/blur behavior':'Original color/alpha/blur applied once to its outer native surface; images and card shadow preserved'};})];}
