import {createPageTitleDecorationAdapter} from './page-title-decoration.mjs';
import {PAGE_TITLE_SUBTITLE_SELECTORS,createPageTitleSubtitleAdapter} from './page-title-subtitle.mjs';
const ROW='data-otl-title-row',TEXT='data-otl-title-text',SETTINGS='data-otl-settings-layout';
export const PAGE_TITLE_LAYOUT_CSS=`
[${ROW}]{position:relative;box-sizing:border-box;display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;min-height:87px;padding:9px 10px;margin:0 0 8px;gap:5px;border:0;border-bottom:1px solid var(--SmartThemeBorderColor,rgba(0,0,0,.15));border-radius:0}
[${ROW}="compact"]{min-height:36px}
[${ROW}="short"]{min-height:61px}
html:is([data-orange-live],[data-orange-lab]) :is(#left-nav-panel,#rm_api_block,#WorldInfo,#Backgrounds,#rm_extensions_block,#PersonaManagement,#AdvancedFormatting,#chat) [${TEXT}="show"][${TEXT}="show"]{font-size:24px!important;line-height:1.35!important;letter-spacing:1px}
[${TEXT}="hide"]{display:none!important}
[${ROW}]>h3,[${ROW}]>strong,[${ROW}]>.flex1{flex:0 0 100%;width:100%;min-width:0;margin:0;padding:0}
[${ROW}="compact"]>strong,[${ROW}="compact"]>h3,[${ROW}="compact"]>.flex1{flex:0 1 auto;width:auto}
[${ROW}]>.flex-container:not(.flex1),[${ROW}]>[data-cc-null]{margin-left:auto;max-width:100%;flex-wrap:wrap;justify-content:flex-end}
[${ROW}] .menu_button{width:max-content;flex-shrink:0;white-space:nowrap}
#WorldInfo [${ROW}]>h3{flex:1 1 auto;width:auto}
#bg-header-fixed [${ROW}]{display:grid;grid-template-columns:minmax(0,1fr) repeat(3,auto);min-height:0;gap:8px 6px}
#bg-header-fixed [${ROW}]>h3{grid-column:1 / -1}
#bg-header-fixed [${ROW}]>.expander{display:none}
#bg-header-fixed [${ROW}]>#background_fitting{min-width:0;width:100%;margin:0}
#bg-header-fixed [${ROW}]>:is(#auto_background,#bg_add_folder_button,#add_background_button_top){min-width:32px;min-height:32px;margin:0;justify-self:end}
[${SETTINGS}]{display:grid!important;grid-template-columns:minmax(0,1fr) auto minmax(0,1.15fr);gap:10px 8px;align-items:center;margin-bottom:12px}
[${SETTINGS}] [name="userSettingsRowOne"],[${SETTINGS}] [name="UserSettingsRowTwo"]{display:contents!important}
[${SETTINGS}] [data-otl-settings-title]{display:none!important}
[${SETTINGS}] #version_display{grid-column:1 / -1;grid-row:1;min-width:0;font-size:.72em;line-height:1.45;overflow-wrap:anywhere}
[${SETTINGS}] #UI-language-block{grid-column:1;grid-row:2;min-width:0;gap:8px;flex-wrap:nowrap;align-items:center}
[${SETTINGS}] #UI-language-block>span{flex:0 0 auto}
[${SETTINGS}] #ui_language_select{min-width:0;width:100%}
[${SETTINGS}] #account_controls{grid-column:2;grid-row:2;min-width:0;max-width:6.5em;gap:6px}
[${SETTINGS}] #settingsSearch{grid-column:3;grid-row:2;min-width:0;width:100%;max-width:100%;box-sizing:border-box;margin:0}
`;
const selectors=Object.fromEntries(Object.entries(PAGE_TITLE_SUBTITLE_SELECTORS).map(([page,targets])=>[page,Object.values(targets)]));
export function createPageTitleLayoutAdapter({document}={}){
 const owned=new Map(),subtitles=createPageTitleSubtitleAdapter({document}),decorations=createPageTitleDecorationAdapter({document});let style=null;
 function set(node,key,value,wanted){if(!node)return;let values=owned.get(node);if(!values){values=new Map();owned.set(node,values);}if(!values.has(key))values.set(key,{old:node.getAttribute(key),last:value});values.get(key).last=value;if(node.getAttribute(key)!==value)node.setAttribute(key,value);if(!wanted.has(node))wanted.set(node,new Set());wanted.get(node).add(key);}
 function restore(node,key,r){if(node.getAttribute(key)!==r.last)return;if(r.old===null)node.removeAttribute(key);else node.setAttribute(key,r.old);}
 function sync(entries){const wanted=new Map();for(const {page,host,header,config}of entries){if(!config.enabled||config.layout!=='standard')continue;
  if(page==='settings'){if(!header)continue;const row=host.querySelector('[name="userSettingsRowOne"]'),group=row?.parentElement,title=row?.querySelector('[data-i18n="User Settings"]')?.closest('h3');if(group&&group!==host){set(group,SETTINGS,'true',wanted);const wrap=title?.closest('[name="userSettingsRowOne"] > .flex-container');set(wrap||title,'data-otl-settings-title','true',wanted);}continue;}
  for(const selector of selectors[page]||[])for(const node of host.querySelectorAll(selector)){
   const isApi=node.id==='title_api',profile=page==='connection'&&!!host.querySelector('#connection_profiles');set(node,TEXT,header||isApi&&profile?'hide':'show',wanted);
   if(isApi){if(!profile)set(node,ROW,header?'compact':'short',wanted);continue;}
   let row=node.parentElement;if(node.tagName==='H3'||node.tagName==='STRONG')row=node.parentElement;else if(row?.tagName==='H3'||row?.tagName==='STRONG')row=row.parentElement;
   if(page==='personas'&&row?.classList.contains('flex1'))row=row.parentElement;
   set(row,ROW,header?'compact':page==='connection'||page==='worldbook'?'short':'full',wanted);
  }
 }
 for(const [node,values]of owned){for(const [key,r]of values)if(!wanted.get(node)?.has(key)){restore(node,key,r);values.delete(key);}if(!values.size)owned.delete(node);}
 subtitles.sync(entries);decorations.sync(entries);
 if(owned.size&&!style){style=document.createElement('style');style.setAttribute('data-otl-title-style','');style.textContent=PAGE_TITLE_LAYOUT_CSS;document.head.append(style);}else if(!owned.size){style?.remove();style=null;}}
 function stop(){subtitles.stop();decorations.stop();for(const [node,values]of owned)for(const [key,r]of values)restore(node,key,r);owned.clear();style?.remove();style=null;}
 return {sync,stop,updateFonts:subtitles.updateFonts};
}
