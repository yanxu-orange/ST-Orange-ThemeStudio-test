import {PAGE_ROOTS} from '../../../page-style.mjs';
import {commonStyleRules} from '../../../common-style.mjs';
import {worldEntryRules} from '../../../world-entry-style.mjs';
import {presetContentRules} from '../../../page-style.mjs';
const allowed={worldbook:new Set(['button','entry','entryHeading','entryDetails']),presets:new Set(['promptList'])};
const localGroups=['text','panel','heading','button','field'];
const supportedGroup=(page,group)=>group==='art'||localGroups.includes(group)||page==='settings'&&group==='section'||!!allowed[page]?.has(group);
const eq=(a,b)=>a===b||!!a&&!!b&&typeof a==='object'&&typeof b==='object'&&Object.keys(a).length===Object.keys(b).length&&Object.keys(a).every(k=>Object.hasOwn(b,k)&&eq(a[k],b[k]));
export function assessPages(c,defaults){
 const diagnostics=[];
 for(const [page,v]of Object.entries(c.pageStyle))for(const [group,value]of Object.entries(v)){
  if(supportedGroup(page,group)||eq(value,defaults.pageStyle[page][group]))continue;
  diagnostics.push({severity:'error',code:'PAGE_STYLE_UNSUPPORTED',field:`pageStyle.${page}.${group}`,reason:'This page-local group/art/slider behavior has no bounded independent renderer in batch12'});
 }
 return diagnostics;
}
export function pageFieldCoverage(c,diagnostics){
 return Object.entries(c.pageStyle).flatMap(([page,v])=>Object.entries(v).map(([group,value])=>{
  const field=`pageStyle.${page}.${group}`,supported=supportedGroup(page,group),active=value!==null&&(typeof value!=='object'||Object.values(value).some(x=>x!==null));
  return {field,owner:'page-native-style',status:diagnostics.some(d=>d.field===field)?'unsupported':supported?'consumed':active&&group!=='sliderTip'?'no-active-customization':'inactive',reason:supported?'Pure source rules on native page roots; no runtime dropdown-owner bridge':'No active local override; inherited global appearance remains'};
 }));
}
export function pagesCss(c,ctx){
 const global=c.commonStyle,v=c.pageStyle.worldbook,root='#WorldInfo',rules=[];
 for(const [page,local]of Object.entries(c.pageStyle))if(localGroups.some(group=>local[group])){
  // The source reapplies the complete resolved common baseline before its entry rules.
  // A local dropdown scope can only match descendants; body-appended Select2 retains
  // global appearance because this exporter does not own the source runtime bridge.
  const pageRoot=PAGE_ROOTS[page],resolved=Object.fromEntries(localGroups.map(group=>[group,local[group]||global[group]])),family=ctx.fontFamily(local.text?'pageStyle.'+page+'.text.fontLink.url':'commonStyle.text.fontLink.url');
  rules.push(commonStyleRules({...c,commonStyle:resolved},{rootScope:pageRoot,dropdownScope:pageRoot+' .select2-dropdown',family}));
 }
 const settings=c.pageStyle.settings,sectionStyle=settings.section||settings.panel;
 if(sectionStyle){const p=sectionStyle,bg=`rgba(${[1,3,5].map(i=>parseInt(p.background.slice(i,i+2),16)).join(',')},${p.opacity})`;rules.push(`#user-settings-block :is(#UI-Theme-Block,#UI-Customization,#power-user-options-block){background:${bg}!important;border:${p.width}px solid ${p.border}!important;border-radius:${p.radius}px!important}`);}
 const section=root+' #world_popup_entries_list .wi-card-entry';
 if(v.entry||v.panel){const p=v.entry||v.panel,bg=`rgba(${[1,3,5].map(i=>parseInt(p.background.slice(i,i+2),16)).join(',')},${p.opacity})`;rules.push(`${section}{background:${bg}!important;border:${p.width}px solid ${p.border}!important;border-radius:${p.radius}px!important}`);}
 if(v.entryHeading||v.heading){
  const h=v.entryHeading||v.heading,header=root+' #world_popup_entries_list .world_entry_form > .inline-drawer > .inline-drawer-header',title=header+' textarea[name=comment]';
  if(v.entryHeading)rules.push(`${header}{color:${h.color}!important;background:${h.background}!important;font-size:calc(${h.size}px * var(--fontScale, 1))!important;font-weight:${h.weight}!important;border-radius:${h.radius}px!important;text-shadow:none!important}`);
  rules.push(`${title}{color:${h.color}!important;font-size:calc(${h.size}px * var(--fontScale, 1))!important;font-weight:${h.weight}!important}`);
  rules.push(`@media(max-width:700px){${title}{font-size:calc(${Math.max(16,h.size)}px * var(--fontScale, 1))!important}}`);
 }
 rules.push(worldEntryRules(root,v,global),presetContentRules('#left-nav-panel',c.pageStyle.presets,global));
 for(const [page,v]of Object.entries(c.pageStyle))for(const [surface,art]of Object.entries(v.art)){if(!art||!art.image&&!art.asset)continue;const root=PAGE_ROOTS[page],selector=surface==='page'?root:page==='settings'?root+' :is(#UI-Theme-Block,#UI-Customization,#power-user-options-block)':root+' #world_popup_entries_list .wi-card-entry',field=ctx.firstField('pageStyle.'+page+'.art.'+surface+'.');rules.push(`${selector}{background-image:${ctx.source(field)}!important;background-size:${art.fit}!important;background-position:${art.x}% ${art.y}%!important;background-repeat:no-repeat!important}`);}
 return rules.filter(Boolean).join('\n');
}
