import { normalizePageTitleSubtitle, PAGE_TITLE_SUBTITLE_SELECTORS } from './page-title-subtitle.mjs';

export const pageTitleFontKey = page => `page-title-${page}`;
export function normalizePageTitleStyle(page, raw = null) {
  if (raw === null) return null;
  if(!raw||typeof raw!=='object'||Object.keys(raw).some(key=>!['font','fontLink','lineHeight','letterSpacing'].includes(key)))throw Error('原生标题字体设置无效');
  const style = normalizePageTitleSubtitle(page, {texts:{},style:{...raw,font:raw.font==='auto'?'sans-serif':raw.font,size:24,weight:400,color:'#000000'}}).style;
  return {font:raw.font==='auto'?'auto':style.font,fontLink:style.fontLink,lineHeight:style.lineHeight,letterSpacing:style.letterSpacing};
}
export function pageTitleFontEntries(config) {
  return Object.fromEntries(Object.entries(config.pageHeaders || {})
    .filter(([,value]) => value.enabled && value.layout === 'standard' && value.titleStyle)
    .map(([page,value]) => [pageTitleFontKey(page),{fontLink:value.titleStyle.fontLink}]));
}
export function createPageTitleStyleAdapter({document}) {
  const owned = new Map();
  let entries = [], families = {};
  function restore(node, values) {
    for (const [key,value] of values) if (node.style.getPropertyValue(key) === value.last) {
      if (value.old) node.style.setProperty(key,value.old,value.priority);
      else node.style.removeProperty(key);
    }
  }
  function sync(next) {
    entries = next;
    const wanted = new Set();
    for (const {page,host,config} of entries) {
      const style = config.titleStyle;
      if (!config.enabled || config.layout !== 'standard' || !style) continue;
      for (const selector of Object.values(PAGE_TITLE_SUBTITLE_SELECTORS[page] || {})) for (const node of host.querySelectorAll(selector)) {
        if (node.getAttribute('data-otl-title-text') !== 'show') continue;
        wanted.add(node);
        let values = owned.get(node);
        if (!values) { values = new Map(); owned.set(node,values); }
        const loaded = families[pageTitleFontKey(page)];
        const font = style.font === 'auto' ? 'inherit' : style.font;
        const props = {'font-family':loaded ? JSON.stringify(loaded)+(font==='inherit'?'':','+font) : font,'font-size':config.titleSize+'px','font-weight':String(config.titleWeight),color:config.titleColor,'line-height':String(style.lineHeight),'letter-spacing':style.letterSpacing+'px'};
        for (const [key,value] of Object.entries(props)) {
          if (!values.has(key)) values.set(key,{old:node.style.getPropertyValue(key),priority:typeof node.style.getPropertyPriority==='function'?node.style.getPropertyPriority(key):'',last:''});
          node.style.setProperty(key,value,'important');values.get(key).last=node.style.getPropertyValue(key);
        }
      }
    }
    for (const [node,values] of owned) if (!wanted.has(node)) { restore(node,values);owned.delete(node); }
  }
  return {sync,stop(){for(const [node,values]of owned)restore(node,values);owned.clear();entries=[];families={};},updateFonts(next={}){
    const changed=entries.some(({page})=>(families[pageTitleFontKey(page)]||'')!==(next[pageTitleFontKey(page)]||''));
    families=next;if(changed)sync(entries);return changed;
  }};
}
