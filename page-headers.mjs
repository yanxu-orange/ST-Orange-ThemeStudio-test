import {createPageHeaderScrollAdapter,PAGE_HEADER_SCROLL_CSS} from './page-header-scroll.mjs';
import {ASSETS,assetUrl} from './catalog.mjs';
import {validImage} from './image-sources.mjs';

export const PAGE_HEADER_PAGES=Object.freeze({home:'首页',presets:'预设',connection:'API',worldbook:'世界书',settings:'设置',backgrounds:'背景',extensions:'扩展',personas:'人设',characters:'角色',formatting:'回复格式'});
export const PAGE_HEADER_DEFAULTS=Object.freeze({enabled:false,asset:'',image:'',sizing:'fixed',height:160,fit:'cover',x:50,y:50,topGap:0,sideGap:0});
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
  for(const k of ['topGap','sideGap'])if(!Number.isFinite(v[k])||v[k]<0||v[k]>160)throw Error('页面头部留白须为 0–160 像素');
  pageHeaders[page]=v;
 }
 return {...raw,pageHeaders};
}

// Verified against SillyTavern 1.18.0. Welcome is a direct #chat child,
// never a system message. Scroll ownership is adapted only for enabled headers.
export const PAGE_HEADER_MOUNTS=Object.freeze({home:'#chat > .welcomePanel',presets:'#left-nav-panel',connection:'#rm_api_block',worldbook:'#WorldInfo',settings:'#user-settings-block',backgrounds:'#Backgrounds',extensions:'#rm_extensions_block',personas:'#PersonaManagement',characters:'#right-nav-panel',formatting:'#AdvancedFormatting'});
const OWN='data-otl-page-header';
const headerKeys=Object.keys(PAGE_HEADER_DEFAULTS);
function sameHeaders(a,b){return !!a&&Object.keys(PAGE_HEADER_PAGES).every(page=>headerKeys.every(key=>a[page]?.[key]===b[page]?.[key]));}
export function createPageHeaderAdapter({document,MutationObserver:Observe,requestFrame,cancelFrame,resolveArtwork}={}){
 const win=document.defaultView,Observer=Observe||win?.MutationObserver;
 const raf=requestFrame||win?.requestAnimationFrame?.bind(win)||(fn=>setTimeout(fn,0)),caf=cancelFrame||win?.cancelAnimationFrame?.bind(win)||clearTimeout;
 const scroll=createPageHeaderScrollAdapter({document});
 const mounted=new Map();let config=null,observer=null,frame=null,candidates='',resize=null,scrollStyle=null;
 function layout(host,node,v){
  const style=win?.getComputedStyle?.(host);
  const left=parseFloat(style?.paddingLeft)||0,right=parseFloat(style?.paddingRight)||0,top=parseFloat(style?.paddingTop)||0;
  const width=`max(0px, calc(100% + ${left+right-v.sideGap*2}px))`;
  node.style.width=width;node.style.maxWidth='none';node.style.marginLeft=(v.sideGap-left)+'px';node.style.marginRight=(v.sideGap-right)+'px';
  node.style.marginTop=-top+'px';node.style.paddingTop=v.topGap+'px';
  node.style.height=v.sizing==='fixed'?(v.height+v.topGap)+'px':'auto';
 }
 function refreshLayout(){for(const [host,node]of mounted){const v=config?.[node.getAttribute(OWN)];if(v)layout(host,node,v);}}
 function watchLayout(){if(resize)return;const Resize=win?.ResizeObserver;if(Resize){resize=new Resize(refreshLayout);for(const host of mounted.keys())resize.observe(host);}win?.addEventListener?.('resize',refreshLayout);}
 function remove(host){const node=mounted.get(host);if(node){resize?.unobserve(host);node.remove();mounted.delete(host);}}
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
     node.style.cssText='display:block;position:relative;box-sizing:border-box;width:100%;min-width:0;max-width:100%;flex:0 0 auto;grid-column:1 / -1;align-self:flex-start;pointer-events:none;overflow:hidden;margin:0;padding:0;border:0;';
     const img=document.createElement('img');img.alt='';img.draggable=false;img.setAttribute('aria-hidden','true');img.style.cssText='display:block;position:static;box-sizing:border-box;width:100%;min-width:0;max-width:100%;min-height:0;max-height:none;margin:0;padding:0;border:0;pointer-events:none;';node.append(img);mounted.set(host,node);resize?.observe(host);
    }
    if(host.firstElementChild!==node)host.prepend(node);
    const img=node.firstElementChild;
    if(img.getAttribute('src')!==src)img.setAttribute('src',src);
    const height=v.sizing==='fixed'?v.height+'px':'auto';
    layout(host,node,v);
    if(img.style.height!==height)img.style.height=height;
    if(img.style.objectFit!==v.fit)img.style.objectFit=v.fit;
    const position=`${v.x}% ${v.y}%`;if(img.style.objectPosition!==position)img.style.objectPosition=position;
   }
  }
  for(const host of mounted.keys())if(!wanted.has(host))remove(host);
  scroll.sync([...mounted.keys()]);
 }
 function relevant(node){return !!candidates&&node?.nodeType===1&&!node.hasAttribute(OWN)&&!node.closest?.(`[${OWN}]`)&&(node.matches(candidates)||!!node.querySelector(candidates));}
 function changed(records){
  if(frame!==null||!config)return;
  // Ignore streaming text, control state, and our own insertions. A removed owned
  // banner is relevant only when its host still exists (native innerHTML rebuild).
  if(records.some(r=>[...r.addedNodes,...r.removedNodes].some(relevant)||mounted.has(r.target)&&([...r.removedNodes].includes(mounted.get(r.target))||[...r.addedNodes].some(node=>node.nodeType===1&&!node.hasAttribute(OWN)))))frame=raf(()=>{frame=null;reconcile();});
 }
 function unwatch(){observer?.disconnect();observer=null;resize?.disconnect();resize=null;win?.removeEventListener?.('resize',refreshLayout);if(frame!==null)caf(frame);frame=null;}
 function update(raw,{validated=false}={}){
  // Live editor snapshots are already isolated and validated; avoid re-scanning
  // multi-megabyte embedded sources during unrelated color/slider updates.
  const next=validated&&raw.pageHeaders?raw.pageHeaders:normalizePageHeaders(raw).pageHeaders;
  if(sameHeaders(config,next)){refreshLayout();return;}
  config=Object.fromEntries(Object.entries(next).map(([key,value])=>[key,{...value}]));
  const enabledPages=Object.keys(config).filter(page=>config[page].enabled&&(config[page].asset||config[page].image));
  candidates=enabledPages.flatMap(page=>PAGE_HEADER_MOUNTS[page].split(',').map(selector=>selector.split(' > ').at(-1))).join(',');
  const enabled=enabledPages.length>0;
  if(enabled&&!scrollStyle){scrollStyle=document.createElement('style');scrollStyle.setAttribute('data-otl-page-header-scroll','');scrollStyle.textContent=PAGE_HEADER_SCROLL_CSS;document.head.append(scrollStyle);}
  if(!enabled)unwatch();reconcile();if(enabled)watchLayout();else{scrollStyle?.remove();scrollStyle=null;}
  if(enabled&&!observer&&Observer){observer=new Observer(changed);observer.observe(document.body,{subtree:true,childList:true});}
 }
 function stop(){unwatch();scroll.stop();scrollStyle?.remove();scrollStyle=null;config=null;for(const host of mounted.keys())remove(host);}
 return {update,stop,reconcile};
}
