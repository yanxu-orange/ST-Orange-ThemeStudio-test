import {normalizeWorldEntry,worldEntryRules} from './world-entry-style.mjs';
import {staticPresetManager,baiPresetRules,guardPresetRules} from './bai-preset-style.mjs';
import {normalizeCommonConfig,commonStyleRules,COMMON_STYLE_DEFAULTS} from './common-style.mjs';
import {ASSETS,assetUrl} from './catalog.mjs';
import {validImage} from './image-sources.mjs';

const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const common=Object.keys(COMMON_STYLE_DEFAULTS);
// Native SillyTavern 1.18 page roots; no copied pages or business controls.
export const PAGE_ROOTS={settings:'#user-settings-block',worldbook:'#WorldInfo',presets:'#left-nav-panel',connection:'#rm_api_block',backgrounds:'#Backgrounds',extensions:'#rm_extensions_block',personas:'#PersonaManagement',characters:'#right-nav-panel',formatting:'#AdvancedFormatting'};
export const PAGE_GROUPS=Object.fromEntries(Object.keys(PAGE_ROOTS).map(page=>[page,[...common,...({settings:['section'],worldbook:['entry','entryHeading'],presets:['entry']}[page]||[])]]));
const baseGroup=group=>({section:'panel',entry:'panel',entryHeading:'heading'}[group]||group);
export const PAGE_ART_DEFAULTS={asset:'',image:'',fit:'cover',x:50,y:50};
function normalizeArt(raw){
 if(raw===null)return null;
 if(!object(raw)||Object.keys(raw).some(k=>!Object.hasOwn(PAGE_ART_DEFAULTS,k)))throw Error('页面背景字段无效');
 const v={...PAGE_ART_DEFAULTS,...raw};
 if(typeof v.asset!=='string'||v.asset&&!Object.hasOwn(ASSETS,v.asset)||typeof v.image!=='string'||v.image&&!validImage(v.image)||v.asset&&v.image||!['cover','contain','auto'].includes(v.fit))throw Error('页面背景图片无效');
 for(const key of ['x','y'])if(!Number.isFinite(v[key])||v[key]<0||v[key]>100)throw Error('页面背景位置无效');
 return v;
}
export function normalizePageConfig(raw={}){
 if(!object(raw))throw Error('页面外观方案无效');
 const supplied=raw.pageStyle===undefined?{}:raw.pageStyle;
 if(!object(supplied)||Object.keys(supplied).some(k=>!Object.hasOwn(PAGE_ROOTS,k)))throw Error('页面外观字段无效');
 const pageStyle={};
 for(const page of Object.keys(PAGE_ROOTS)){
  const source=supplied[page]===undefined?{}:supplied[page],groups=PAGE_GROUPS[page];
  if(!object(source)||Object.keys(source).some(k=>!groups.includes(k)&&k!=='art'&&!(page==='worldbook'&&k==='entryDetails')&&!(page==='presets'&&['promptList','sliderTip'].includes(k))))throw Error('页面外观分组无效');
  const result={};
  for(const group of groups){const v=source[group];result[group]=v===null||v===undefined?null:normalizeCommonConfig({commonStyle:{[baseGroup(group)]:v}}).commonStyle[baseGroup(group)];}
  if(page==='presets'){result.promptList=source.promptList??false;result.sliderTip=source.sliderTip??'native';if(typeof result.promptList!=='boolean'||!['native','flow'].includes(result.sliderTip))throw Error('预设内容设置无效');}
  if(page==='worldbook')result.entryDetails=normalizeWorldEntry(source.entryDetails);
  const surfaces=['page',...({settings:['section'],worldbook:['entry']}[page]||[])],art=source.art===undefined?{}:source.art;
  if(!object(art)||Object.keys(art).some(k=>!surfaces.includes(k)))throw Error('页面素材区域无效');
  result.art=Object.fromEntries(surfaces.map(k=>[k,normalizeArt(art[k]===undefined?null:art[k])]));pageStyle[page]=result;
 }
 return {...raw,pageStyle};
}
export function resolvePageGroup(config,page,group){
 if(!PAGE_GROUPS[page]?.includes(group))throw Error('页面外观分组无效');
 const local=normalizePageConfig(config).pageStyle[page],base=baseGroup(group);
 return local[group]||local[base]||normalizeCommonConfig(config).commonStyle[base];
}
export function pageFontEntries(config){
 const pages=normalizePageConfig(config).pageStyle;
 return Object.fromEntries(Object.keys(PAGE_ROOTS).filter(page=>pages[page].text).map(page=>['page-'+page,{fontLink:pages[page].text.fontLink}]));
}
const panelCSS=p=>`background:rgba(${[1,3,5].map(i=>parseInt(p.background.slice(i,i+2),16)).join(',')},${p.opacity})!important;border:${p.width}px solid ${p.border}!important;border-radius:${p.radius}px!important`;
export function pageStyleRules(config,{preview=false,page=null,families={},resolveArtwork}={}){
 const c=normalizePageConfig(config),global=normalizeCommonConfig(c).commonStyle,rules=[];
 for(const key of Object.keys(PAGE_ROOTS)){
  if(page&&key!==page)continue;
  const v=c.pageStyle[key],root=preview?`html[data-orange-lab] #chat>.otl-native-page[data-otl-page="${key}"]`:`html[data-orange-live] ${PAGE_ROOTS[key]}`;
  const section=key==='settings'?`${root} :is(#UI-Theme-Block,#UI-Customization,#power-user-options-block)`:key==='worldbook'?`${root} #world_popup_entries_list .wi-card-entry`:null;
  if(common.some(group=>v[group])){
   const resolved=Object.fromEntries(common.map(group=>[group,v[group]||global[group]]));
   rules.push(commonStyleRules({...c,commonStyle:resolved},{preview,rootScope:root,dropdownScope:preview?`${root} .select2-dropdown`:`html[data-orange-live] body>.select2-container--open[data-otl-page-owner="${key}"] .select2-dropdown`,family:v.text?families['page-'+key]||'':families.common||''}));
  }
  const surface=key==='settings'?'section':'entry';
  if(section&&(v[surface]||v.panel))rules.push(`${section}{${panelCSS(v[surface]||v.panel)}}`);
  if(key==='worldbook'&&(v.entryHeading||v.heading)){
   const h=v.entryHeading||v.heading,header=`${root} #world_popup_entries_list .world_entry_form > .inline-drawer > .inline-drawer-header`,title=`${header} textarea[name=comment]`;
   if(v.entryHeading)rules.push(`${header}{color:${h.color}!important;background:${h.background}!important;font-size:${h.size}px!important;font-weight:${h.weight}!important;border-radius:${h.radius}px!important;text-shadow:none!important}`);
   // The editable memo is the actual entry title. Preserve field backgrounds,
   // borders and focus states while giving its text the entry heading style.
   rules.push(`${title}{color:${h.color}!important;font-size:${h.size}px!important;font-weight:${h.weight}!important}`);
   rules.push(`@media(max-width:700px){${title}{font-size:${Math.max(16,h.size)}px!important}}`);
   if(preview)rules.push(`@container(max-width:700px){${title}{font-size:${Math.max(16,h.size)}px!important}}`);
  }
  if(key==='worldbook')rules.push(worldEntryRules(root,v,global));
  if(key==='presets')rules.push(presetContentRules(root,v,global));
  for(const [surface,art]of Object.entries(v.art)){
   if(!art)continue;
   const src=art.image||(art.asset?(resolveArtwork?.({kind:'asset',asset:art.asset,image:''})||assetUrl(art.asset)):'');
   if(src)rules.push(`${surface==='page'?root:section}{background-image:url(${JSON.stringify(src)})!important;background-size:${art.fit}!important;background-position:${art.x}% ${art.y}%!important;background-repeat:no-repeat!important}`);
  }
 }
 if(!preview&&c.template==='spring')rules.push(`@media(max-width:600px){@supports(height:calc-size(auto,size)){html[data-orange-live] #top-settings-holder > .drawer > .drawer-content{height:calc-size(auto,size);transition-property:display;transition-duration:var(--animation-duration-2x);transition-behavior:allow-discrete}html[data-orange-live] #top-settings-holder > .drawer > .drawer-content.openDrawer{@starting-style{height:calc-size(auto,size)}}}}`);
 return rules.filter(Boolean).join('\n');
}


export function presetContentRules(root,page,global){
 const text=page.text||global.text,field=page.field||global.field,panel=page.entry||page.panel||global.panel,rules=[];
 if(page.promptList){
  const manager=staticPresetManager(root),list=`${manager} #completion_prompt_manager_list`,item=`${manager} li.completion_prompt_manager_prompt`,name=`${manager} .completion_prompt_manager_prompt_name`,off=`${manager} .completion_prompt_manager_prompt_disabled`,tokens=`${manager} .prompt_manager_prompt_tokens`;
  const surface=page.panel||global.panel,bg=`rgba(${[1,3,5].map(i=>parseInt(surface.background.slice(i,i+2),16)).join(',')},${surface.opacity})`;
  rules.push(`${manager},${list}{background-color:${bg}!important;box-shadow:none!important}`);
  rules.push(`${item}{${panelCSS(panel)}}`);
  rules.push(`${name},${name} .prompt-manager-inspect-action{white-space:normal!important;overflow-wrap:anywhere;color:${text.color}!important}`);
  rules.push(`${off} .completion_prompt_manager_prompt_name,${off} .completion_prompt_manager_prompt_name .prompt-manager-inspect-action{color:${text.muted}!important}`);
  rules.push(`${manager} .prompt-manager-edit-action,${manager} .completion_prompt_manager_prompt_draggable > .drag-handle{color:${text.color}!important}`);
  rules.push(`${manager} .completion_prompt_manager_prompt:not(.completion_prompt_manager_prompt_disabled) .prompt-manager-toggle-action{color:${text.accent}!important}`);
  rules.push(`${off} .prompt-manager-toggle-action{color:${text.muted}!important}`);
  rules.push(`${tokens},${name} > :is(.fa-star,.fa-asterisk){color:${text.muted}!important}`);
  rules.push(`${manager} :is(.prompt-manager-edit-action,.prompt-manager-toggle-action,.prompt-manager-detach-action):focus-visible{outline:2px solid ${field.focus};outline-offset:2px}`);
  rules.push(`${manager} .completion_prompt_manager_header > div:has(> span[data-i18n="Total Tokens:"]){color:${text.muted}!important}`);
  rules.push(`${manager} .completion_prompt_manager_header_advanced > span[data-i18n="Prompts"],${list} > .completion_prompt_manager_list_head > span[data-i18n="Name"]{color:${text.color}!important}`);
 }
 if(page.promptList){for(let i=0;i<rules.length;i++)rules[i]=guardPresetRules(rules[i]);rules.push(baiPresetRules(root,page,global));}
 if(page.sliderTip==='flow')rules.push(`${root} #clickSlidersTips{position:static!important;inset:auto!important;box-sizing:border-box;width:auto!important;margin:2px 32px 3px 10px!important;padding:0!important;text-align:left!important;font-size:${text.size*.8}px!important;line-height:1.4!important;color:${text.muted}!important}`);
 return rules.join('\n');
}

// Associate Select2 body dropdowns by their result IDs, never last focus/click.
export function createPageDropdownBridge({document,MutationObserver:Observe}={}){
 const attr='data-otl-page-owner',originals=new Map();let observer=null;
 function restore(node,record){if(node.getAttribute(attr)===record.last){if(record.old===null)node.removeAttribute(attr);else node.setAttribute(attr,record.old);}}
 function sync(){
  const containers=document.querySelectorAll('body>.select2-container--open');
  if(!containers.length&&!originals.size)return;
  const active=new Map();
  if(containers.length){
   const owners=new Map();
   for(const [page,selector]of Object.entries(PAGE_ROOTS))for(const node of document.querySelectorAll(`${selector} .select2-container--open [aria-controls],${selector} .select2-container--open [aria-owns]`)){
    for(const id of `${node.getAttribute('aria-controls')||''} ${node.getAttribute('aria-owns')||''}`.split(/\s+/).filter(Boolean))owners.set(id,page);
   }
   for(const container of containers){
    const pages=new Set([...container.querySelectorAll('[id]')].map(node=>owners.get(node.id)).filter(Boolean));
    if(pages.size===1)active.set(container,[...pages][0]);
   }
  }
  for(const [node,record]of originals)if(!active.has(node)){restore(node,record);originals.delete(node);}
  for(const [node,page]of active){if(!originals.has(node))originals.set(node,{old:node.getAttribute(attr),last:page});const record=originals.get(node);record.last=page;if(node.getAttribute(attr)!==page)node.setAttribute(attr,page);}
 }
 function stop(){observer?.disconnect();observer=null;for(const [node,record]of originals)restore(node,record);originals.clear();}
 const select2=':is(.select2-container,.select2-container--open,.select2-dropdown,.select2-results,.select2-selection)';
 function relevant(node){return node?.nodeType===1&&(node.matches(select2)||!!node.closest(select2));}
 function changed(records){
  // One scan per observer batch, and none for streaming/chat/body mode updates.
  if(records.some(record=>relevant(record.target)||(record.type==='childList'&&[...record.addedNodes,...record.removedNodes].some(node=>relevant(node)||node.nodeType===1&&!!node.querySelector(select2)))))sync();
 }
 function start(){stop();sync();const Observer=Observe||document.defaultView?.MutationObserver;if(Observer){observer=new Observer(changed);observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','aria-controls','aria-owns','id']});}}
 return {start,stop,sync};
}

