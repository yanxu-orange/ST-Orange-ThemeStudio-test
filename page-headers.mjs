import {ASSETS,assetUrl} from './catalog.mjs';
import {validImage} from './image-sources.mjs';

export const PAGE_HEADER_PAGES=Object.freeze({home:'首页',presets:'预设',connection:'API',worldbook:'世界书',settings:'设置',backgrounds:'背景',extensions:'扩展',personas:'人设',characters:'角色',formatting:'回复格式'});
export const PAGE_HEADER_DEFAULTS=Object.freeze({enabled:false,asset:'',image:'',sizing:'fixed',height:160,fit:'cover',x:50,y:50});
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
export function normalizePageHeaders(raw={}){
 if(!object(raw))throw Error('页面头部方案无效');
 const supplied=raw.pageHeaders===undefined?{}:raw.pageHeaders;
 if(!object(supplied)||Object.keys(supplied).some(k=>!Object.hasOwn(PAGE_HEADER_PAGES,k)))throw Error('页面头部字段无效');
 const pageHeaders={};
 for(const page of Object.keys(PAGE_HEADER_PAGES)){
  const source=supplied[page]===undefined?{}:supplied[page];
  if(!object(source)||Object.keys(source).some(k=>!Object.hasOwn(PAGE_HEADER_DEFAULTS,k)))throw Error('页面头部属性无效');
  const v={...PAGE_HEADER_DEFAULTS,...source};
  if(typeof v.enabled!=='boolean'||typeof v.asset!=='string'||v.asset&&!Object.hasOwn(ASSETS,v.asset)||typeof v.image!=='string'||v.image&&!validImage(v.image)||v.asset&&v.image)throw Error('页面头部图片无效');
  if(!['fixed','ratio'].includes(v.sizing)||!['cover','contain'].includes(v.fit))throw Error('页面头部显示方式无效');
  if(!Number.isFinite(v.height)||v.height<40||v.height>600)throw Error('页面头部高度须为 40–600 像素');
  for(const k of ['x','y'])if(!Number.isFinite(v[k])||v[k]<0||v[k]>100)throw Error('页面头部取景须为 0–100');
  pageHeaders[page]=v;
 }
 return {...raw,pageHeaders};
}

// Verified against SillyTavern 1.18.0. Welcome is a direct #chat child,
// never a system message. Drawer banners belong in the native scrolling flow.
export const PAGE_HEADER_MOUNTS=Object.freeze({home:'#chat > .welcomePanel',presets:'#left-nav-panel > .scrollableInner',connection:'#rm_api_block',worldbook:'#WorldInfo',settings:'#user-settings-block',backgrounds:'#bg_global_tab,#bg_chat_tab',extensions:'#rm_extensions_block',personas:'#PersonaManagement',characters:'#right-nav-panel > .scrollableInner',formatting:'#AdvancedFormatting'});
const OWN='data-otl-page-header';
const headerKeys=Object.keys(PAGE_HEADER_DEFAULTS);
function sameHeaders(a,b){return !!a&&Object.keys(PAGE_HEADER_PAGES).every(page=>headerKeys.every(key=>a[page]?.[key]===b[page]?.[key]));}
export function createPageHeaderAdapter({document,MutationObserver:Observe,requestFrame,cancelFrame,resolveArtwork}={}){
 const win=document.defaultView,Observer=Observe||win?.MutationObserver;
 const raf=requestFrame||win?.requestAnimationFrame?.bind(win)||(fn=>setTimeout(fn,0)),caf=cancelFrame||win?.cancelAnimationFrame?.bind(win)||clearTimeout;
 const mounted=new Map();let config=null,observer=null,frame=null,candidates='';
 function remove(host){const node=mounted.get(host);if(node){node.remove();mounted.delete(host);}}
 function reconcile(){
  if(!config)return;
  const wanted=new Set();
  for(const [page,v]of Object.entries(config)){
   if(!v.enabled||!v.asset&&!v.image)continue;
   const src=v.image||(resolveArtwork?.({kind:'asset',asset:v.asset,image:''})||assetUrl(v.asset));
   if(!src)continue;
   for(const host of document.querySelectorAll(PAGE_HEADER_MOUNTS[page])){
    wanted.add(host);let node=mounted.get(host);
    if(!node){node=document.createElement('div');node.setAttribute(OWN,page);node.setAttribute('data-otl-live-owned','');node.setAttribute('aria-hidden','true');
     node.style.cssText='display:block;position:relative;box-sizing:border-box;width:100%;min-width:0;max-width:100%;flex:0 0 auto;pointer-events:none;overflow:hidden;margin:0;padding:0;border:0;';
     const img=document.createElement('img');img.alt='';img.draggable=false;img.setAttribute('aria-hidden','true');img.style.cssText='display:block;position:static;box-sizing:border-box;width:100%;min-width:0;max-width:100%;min-height:0;max-height:none;margin:0;padding:0;border:0;pointer-events:none;';node.append(img);mounted.set(host,node);
    }
    if(node.parentNode!==host)host.prepend(node);
    const img=node.firstElementChild;
    if(img.getAttribute('src')!==src)img.setAttribute('src',src);
    const height=v.sizing==='fixed'?v.height+'px':'auto';
    if(node.style.height!==height)node.style.height=height;
    if(img.style.height!==height)img.style.height=height;
    if(img.style.objectFit!==v.fit)img.style.objectFit=v.fit;
    const position=`${v.x}% ${v.y}%`;if(img.style.objectPosition!==position)img.style.objectPosition=position;
   }
  }
  for(const host of mounted.keys())if(!wanted.has(host))remove(host);
 }
 function relevant(node){return !!candidates&&node?.nodeType===1&&!node.hasAttribute(OWN)&&!node.closest?.(`[${OWN}]`)&&(node.matches(candidates)||!!node.querySelector(candidates));}
 function changed(records){
  if(frame!==null||!config)return;
  // Ignore streaming text, control state, and our own insertions. A removed owned
  // banner is relevant only when its host still exists (native innerHTML rebuild).
  if(records.some(r=>[...r.addedNodes,...r.removedNodes].some(relevant)||r.removedNodes.length&&mounted.has(r.target)&&[...r.removedNodes].includes(mounted.get(r.target))))frame=raf(()=>{frame=null;reconcile();});
 }
 function unwatch(){observer?.disconnect();observer=null;if(frame!==null)caf(frame);frame=null;}
 function update(raw,{validated=false}={}){
  // Live editor snapshots are already isolated and validated; avoid re-scanning
  // multi-megabyte embedded sources during unrelated color/slider updates.
  const next=validated&&raw.pageHeaders?raw.pageHeaders:normalizePageHeaders(raw).pageHeaders;
  if(sameHeaders(config,next))return;
  config=Object.fromEntries(Object.entries(next).map(([key,value])=>[key,{...value}]));
  const enabledPages=Object.keys(config).filter(page=>config[page].enabled&&(config[page].asset||config[page].image));
  candidates=enabledPages.flatMap(page=>PAGE_HEADER_MOUNTS[page].split(',').map(selector=>selector.split(' > ').at(-1))).join(',');
  const enabled=enabledPages.length>0;
  if(!enabled)unwatch();reconcile();
  if(enabled&&!observer&&Observer){observer=new Observer(changed);observer.observe(document.body,{subtree:true,childList:true});}
 }
 function stop(){unwatch();config=null;for(const host of mounted.keys())remove(host);}
 return {update,stop,reconcile};
}
