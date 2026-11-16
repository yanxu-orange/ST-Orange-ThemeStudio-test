import {PAGE_TITLE_SUBTITLE_SELECTORS} from './page-title-subtitle.mjs';
export function newPageTitleDecoration(){return {shape:'square',color:'#b53232',size:8,x:0,y:0};}
export function normalizePageTitleDecoration(page,raw=null){
 if(raw===null)return null;
 if(!PAGE_TITLE_SUBTITLE_SELECTORS[page]||!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>!['shape','color','size','x','y'].includes(k))||!['square','dot','line'].includes(raw.shape)||typeof raw.color!=='string'||!/^#[\da-f]{6}$/i.test(raw.color)||!Number.isFinite(raw.size)||raw.size<2||raw.size>40||!Number.isFinite(raw.x)||Math.abs(raw.x)>80||!Number.isFinite(raw.y)||Math.abs(raw.y)>80)throw Error('标题角标装饰无效');
 return {...raw};
}
const ATTR='data-otl-title-decoration',STYLE='data-otl-title-decoration-style';
export function createPageTitleDecorationAdapter({document}={}){
 const owned=new Map();let sheet=null;
 function own(node,v){let r=owned.get(node);if(!r){r={attr:node.getAttribute(ATTR),lastAttr:null,hadStyle:node.hasAttribute('style'),props:new Map()};owned.set(node,r);}node.setAttribute(ATTR,v.shape);r.lastAttr=v.shape;
  for(const [key,value] of Object.entries({'--otl-title-decoration-color':v.color,'--otl-title-decoration-size':v.size+'px','--otl-title-decoration-x':v.x+'px','--otl-title-decoration-y':v.y+'px'})){if(!r.props.has(key))r.props.set(key,{old:node.style.getPropertyValue(key),priority:typeof node.style.getPropertyPriority==='function'?node.style.getPropertyPriority(key):'',last:''});node.style.setProperty(key,value);r.props.get(key).last=node.style.getPropertyValue(key);}
 }
 function release(node,r){if(node.getAttribute(ATTR)===r.lastAttr){if(r.attr===null)node.removeAttribute(ATTR);else node.setAttribute(ATTR,r.attr);}for(const [key,p] of r.props)if(node.style.getPropertyValue(key)===p.last){if(p.old)node.style.setProperty(key,p.old,p.priority);else node.style.removeProperty(key);}if(!r.hadStyle&&!node.style.cssText)node.removeAttribute('style');owned.delete(node);}
 function sync(entries){const wanted=new Set();for(const {page,host,config:v}of entries){if(!v.enabled||v.layout!=='standard'||!v.titleDecoration)continue;for(const selector of Object.values(PAGE_TITLE_SUBTITLE_SELECTORS[page]||{}))for(const node of host.querySelectorAll(selector)){if(node.getAttribute('data-otl-title-text')!=='show')continue;wanted.add(node);own(node,v.titleDecoration);}}
  for(const [node,r]of owned)if(!wanted.has(node))release(node,r);
  if(owned.size&&!sheet){sheet=document.createElement('style');sheet.setAttribute(STYLE,'');sheet.textContent=`[data-otl-title-text="show"][${ATTR}]::before{content:"";display:inline-block;width:var(--otl-title-decoration-size);height:var(--otl-title-decoration-size);margin-right:8px;background:var(--otl-title-decoration-color);vertical-align:middle;transform:translate(var(--otl-title-decoration-x),var(--otl-title-decoration-y));pointer-events:none}[data-otl-title-text="show"][${ATTR}="dot"]::before{border-radius:50%}[data-otl-title-text="show"][${ATTR}="line"]::before{height:2px}`;document.head.append(sheet);}else if(!owned.size&&sheet){sheet.remove();sheet=null;}
 }
 return {sync,stop(){for(const [node,r]of owned)release(node,r);sheet?.remove();sheet=null;}};
}
