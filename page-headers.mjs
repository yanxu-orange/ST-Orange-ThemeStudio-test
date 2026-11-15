import {normalizePageTitleSubtitle} from './page-title-subtitle.mjs';
import {normalizePageHeaderScene,sceneHasLayers,createPageHeaderScene} from './page-header-scene.mjs';
import {normalizePageHeaderNative,createPageHeaderNative} from './page-header-native.mjs';
import {createPageTitleLayoutAdapter} from './page-title-layout.mjs';
import {createPageHeaderScrollAdapter,PAGE_HEADER_SCROLL_CSS} from './page-header-scroll.mjs';
import {ASSETS,assetUrl} from './catalog.mjs';
import {validImage} from './image-sources.mjs';

export const PAGE_HEADER_PAGES=Object.freeze({home:'首页',presets:'预设',connection:'API',worldbook:'世界书',settings:'设置',backgrounds:'背景',extensions:'扩展',personas:'人设',characters:'角色',formatting:'回复格式'});
export const PAGE_HEADER_DEFAULTS=Object.freeze({enabled:false,asset:'',image:'',sizing:'fixed',height:160,fit:'cover',x:50,y:50,topGap:0,sideGap:0,layout:'native',titleSubtitle:null,title:'',titleSize:22,titleColor:'#354b42',titleAlign:'left',titleWeight:400,placement:'banner',scene:Object.freeze({images:[],texts:[],order:[]}),native:Object.freeze({hideLogo:false,version:null,settings:null,show:null,hide:null})});
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
  if(!['native','standard'].includes(v.layout)||typeof v.title!=='string'||v.title.length>300||!Number.isFinite(v.titleSize)||v.titleSize<8||v.titleSize>60||typeof v.titleColor!=='string'||!/^#[a-f0-9]{6}$/i.test(v.titleColor)||!['left','center','right'].includes(v.titleAlign)||!Number.isFinite(v.titleWeight)||v.titleWeight<100||v.titleWeight>900)throw Error('页面标题设置无效');
  if(!['banner','native'].includes(v.placement)||page!=='home'&&v.placement!=='banner')throw Error('页面头部挂载方式无效');
  v.titleSubtitle=normalizePageTitleSubtitle(page,v.titleSubtitle);v.scene=normalizePageHeaderScene(v.scene);v.native=normalizePageHeaderNative(v.native);
  if(page!=='home'&&(v.native.hideLogo||['version','settings','show','hide'].some(k=>v.native[k])))throw Error('原生首页对象仅用于首页');
  pageHeaders[page]=v;
 }
 return {...raw,pageHeaders};
}

// Verified against SillyTavern 1.18.0. Welcome is a direct #chat child,
// never a system message. Scroll ownership is adapted only for enabled headers.
export const PAGE_HEADER_MOUNTS=Object.freeze({home:'#chat > .welcomePanel',presets:'#left-nav-panel',connection:'#rm_api_block',worldbook:'#WorldInfo',settings:'#user-settings-block',backgrounds:'#Backgrounds',extensions:'#rm_extensions_block',personas:'#PersonaManagement',characters:'#right-nav-panel',formatting:'#AdvancedFormatting'});
const OWN='data-otl-page-header';
const headerKeys=Object.keys(PAGE_HEADER_DEFAULTS);
function sameHeaders(a,b){return !!a&&Object.keys(PAGE_HEADER_PAGES).every(page=>headerKeys.every(key=>JSON.stringify(a[page]?.[key])===JSON.stringify(b[page]?.[key])));}
export function createPageHeaderAdapter({document,MutationObserver:Observe,requestFrame,cancelFrame,resolveArtwork,onRender=()=>{}}={}){
 const win=document.defaultView,Observer=Observe||win?.MutationObserver;
 const raf=requestFrame||win?.requestAnimationFrame?.bind(win)||(fn=>setTimeout(fn,0)),caf=cancelFrame||win?.cancelAnimationFrame?.bind(win)||clearTimeout;
 const scroll=createPageHeaderScrollAdapter({document}),titles=createPageTitleLayoutAdapter({document});
 const scene=createPageHeaderScene({document,resolveArtwork,onChange:()=>reconcile()}),native=createPageHeaderNative({document});
 const mounted=new Map(),appliedLayouts=new WeakMap(),effectiveLayouts=new WeakMap(),failedSources=new WeakMap(),loadedSources=new WeakMap();let config=null,observer=null,frame=null,candidates='',resize=null,scrollStyle=null;
 // Read every host before writing headers: padding may change without a resize
 // (for example, left/right padding can trade space at the same total width).
 function layout(host,node,v){
  const style=win?.getComputedStyle?.(host);
  const left=parseFloat(style?.paddingLeft)||0,right=parseFloat(style?.paddingRight)||0,top=parseFloat(style?.paddingTop)||0;
  if(v.placement==='native')return [node,{width:'100%',maxWidth:'none',marginLeft:'0px',marginRight:'0px',marginTop:'0px',paddingTop:v.topGap+'px',height:(v.height+v.topGap)+'px'}];
  return [node,{width:`max(0px, calc(100% + ${left+right-v.sideGap*2}px))`,maxWidth:'none',
   marginLeft:(v.sideGap-left)+'px',marginRight:(v.sideGap-right)+'px',marginTop:(host.firstElementChild===node?-top:0)+'px',
   paddingTop:v.topGap+'px',height:sceneHasLayers(v.scene)||v.sizing==='fixed'||!v.asset&&!v.image?(v.height+v.topGap)+'px':'auto'}];
 }
 function applyLayouts(entries){
  const measured=entries.map(([host,node,v])=>layout(host,node,v));
  for(const [node,values]of measured){
   // CSSOM may serialize calc()/max() differently. Compare our last requested
   // values, not the browser's normalized spelling of these owned styles.
   const previous=appliedLayouts.get(node);
   for(const [key,value]of Object.entries(values))if(previous?.[key]!==value)node.style[key]=value;
   appliedLayouts.set(node,values);
  }
 }
 function refreshLayout(){
  const entries=[];for(const [host,node]of mounted){const v=effectiveLayouts.get(node)||config?.[node.getAttribute(OWN)];if(v)entries.push([host,node,v]);}
  applyLayouts(entries);onRender({nodes:[...mounted.values()].map(n=>n.querySelector('[data-otl-header-scene]')).filter(Boolean)});
 }
 function watchLayout(){if(resize)return;const Resize=win?.ResizeObserver;if(Resize){resize=new Resize(refreshLayout);for(const host of mounted.keys())resize.observe(host);}win?.addEventListener?.('resize',refreshLayout);}
 function remove(host){const node=mounted.get(host);if(node){resize?.unobserve(host);const surface=node.querySelector('[data-otl-header-scene]');if(surface)scene.remove(surface);node.remove();mounted.delete(host);}}
 function reconcile(){
  if(!config)return;
  const wanted=new Set(),layouts=[],titleEntries=[],nativeEntries=[];
  for(const [page,v]of Object.entries(config)){
   if(!v.enabled||!v.asset&&!v.image&&!v.title.trim()&&!sceneHasLayers(v.scene)&&v.placement!=='native'&&v.layout!=='standard')continue;
   const src=v.image||(resolveArtwork?.({kind:'asset',asset:v.asset,image:''})||assetUrl(v.asset));
   for(const pageHost of document.querySelectorAll(PAGE_HEADER_MOUNTS[page])){
    const host=v.placement==='native'?pageHost.querySelector(':scope > .welcomeHeaderTitle'):pageHost;if(!host)continue;
    if(v.placement==='native')nativeEntries.push({host,config:v});
    const entry={page,host:pageHost,config:v,header:!!v.title.trim()||!!src&&loadedSources.get(host)===src};titleEntries.push(entry);
    const imageSource=failedSources.get(host)===src?'':src;if(!imageSource&&!v.title.trim()&&!sceneHasLayers(v.scene)&&v.placement!=='native')continue;
    wanted.add(host);let node=mounted.get(host);
    if(!node){node=document.createElement('div');node.setAttribute(OWN,page);node.setAttribute('data-otl-live-owned','');node.setAttribute('aria-hidden','true');
     node.style.cssText='display:block;position:relative;box-sizing:border-box;width:100%;min-width:0;max-width:100%;flex:0 0 auto;grid-column:1 / -1;align-self:flex-start;pointer-events:none;overflow:hidden;margin:0;padding:0;border:0;';
     const img=document.createElement('img');img.alt='';img.draggable=false;img.setAttribute('aria-hidden','true');img.style.cssText='display:block;position:static;box-sizing:border-box;width:100%;min-width:0;max-width:100%;min-height:0;max-height:none;margin:0;padding:0;border:0;pointer-events:none;';img.setAttribute('data-otl-header-base-image','');node.append(img);const surface=document.createElement('div');surface.setAttribute('data-otl-header-scene',page);node.append(surface);mounted.set(host,node);resize?.observe(host);
    }
    const after=page==='characters'?host.querySelector(':scope > #rm_PinAndTabs'):null;
    if(after){if(after.nextElementSibling!==node)after.after(node);}else if(host.firstElementChild!==node)host.prepend(node);
    node.style.position=v.placement==='native'?'absolute':'relative';node.style.top=v.placement==='native'?'0px':'';node.style.left=v.placement==='native'?'0px':'';node.style.zIndex=v.placement==='native'?'-1':'';
    const img=node.querySelector('[data-otl-header-base-image]');
    if(imageSource){if(img.getAttribute('src')!==imageSource){const current=node,expected=imageSource;img.onload=()=>{if(config&&mounted.get(host)===current&&img.getAttribute('src')===expected){loadedSources.set(host,expected);failedSources.delete(host);reconcile();}};img.onerror=()=>{if(config&&mounted.get(host)===current&&img.getAttribute('src')===expected){failedSources.set(host,expected);loadedSources.delete(host);reconcile();}};img.setAttribute('src',imageSource);}img.style.display='block';}else{img.removeAttribute('src');img.style.display='none';}
    let title=node.querySelector('[data-otl-header-title]');
    if(v.title.trim()){if(!title){title=document.createElement('div');title.setAttribute('data-otl-header-title','');title.setAttribute('role','heading');title.setAttribute('aria-level','2');node.append(title);}if(title.textContent!==v.title)title.textContent=v.title;title.style.cssText=`position:absolute;inset:${v.topGap}px 0 0;display:flex;align-items:center;justify-content:${v.titleAlign==='left'?'flex-start':v.titleAlign==='right'?'flex-end':'center'};padding:12px;box-sizing:border-box;font-size:${v.titleSize}px;font-weight:${v.titleWeight};color:${v.titleColor};line-height:1.35;text-align:${v.titleAlign};white-space:pre-wrap;overflow-wrap:anywhere;pointer-events:none;`;node.removeAttribute('aria-hidden');}else{title?.remove();node.setAttribute('aria-hidden','true');}
    const height=sceneHasLayers(v.scene)||v.placement==='native'||v.sizing==='fixed'?v.height+'px':'auto';
    const surface=node.querySelector('[data-otl-header-scene]');entry.header=scene.render(surface,page,v.scene)||entry.header;surface.style.top=v.topGap+'px';
    if(v.scene.texts.some(t=>t.visible&&t.content.trim()))node.removeAttribute('aria-hidden');
    if(title)title.style.zIndex=String(v.scene.order.length+1);
    const effective=imageSource?v:{...v,asset:'',image:''};effectiveLayouts.set(node,effective);layouts.push([host,node,effective]);
    if(img.style.height!==height)img.style.height=height;
    if(img.style.objectFit!==v.fit)img.style.objectFit=v.fit;
    const position=`${v.x}% ${v.y}%`;if(img.style.objectPosition!==position)img.style.objectPosition=position;
   }
  }
  for(const host of mounted.keys())if(!wanted.has(host))remove(host);
  applyLayouts(layouts);
  scroll.sync([...mounted.keys()]);titles.sync(titleEntries);native.sync(nativeEntries);onRender({nodes:[...mounted.values()].map(n=>n.querySelector('[data-otl-header-scene]')).filter(Boolean)});
 }
 function relevant(node){return !!candidates&&node?.nodeType===1&&!node.hasAttribute(OWN)&&!node.closest?.(`[${OWN}]`)&&(node.matches(candidates)||!!node.querySelector(candidates));}
 function changed(records){
  if(frame!==null||!config)return;
  // Ignore streaming text, control state, and our own insertions. A removed owned
  // banner is relevant only when its host still exists (native innerHTML rebuild).
  if(records.some(r=>!r.target.closest?.(`[${OWN}]`)&&([...r.addedNodes,...r.removedNodes].some(relevant)||(mounted.has(r.target)||r.target.closest?.(candidates))&&([...r.removedNodes].includes(mounted.get(r.target))||[...r.addedNodes].some(node=>node.nodeType===1&&!node.hasAttribute(OWN))))))frame=raf(()=>{frame=null;reconcile();});
 }
 function unwatch(){observer?.disconnect();observer=null;resize?.disconnect();resize=null;win?.removeEventListener?.('resize',refreshLayout);if(frame!==null)caf(frame);frame=null;}
 function update(raw,{validated=false}={}){
  // Live editor snapshots are already isolated and validated; avoid re-scanning
  // multi-megabyte embedded sources during unrelated color/slider updates.
  const next=validated&&raw.pageHeaders?raw.pageHeaders:normalizePageHeaders(raw).pageHeaders;
  if(sameHeaders(config,next)){refreshLayout();return;}
  config=structuredClone(next);
  const enabledPages=Object.keys(config).filter(page=>config[page].enabled&&(config[page].asset||config[page].image||config[page].title.trim()||sceneHasLayers(config[page].scene)||config[page].placement==='native'||config[page].layout==='standard'));
  candidates=enabledPages.flatMap(page=>[...PAGE_HEADER_MOUNTS[page].split(',').map(selector=>selector.split(' > ').at(-1)),...(page==='home'&&config[page].placement==='native'?['.welcomeHeaderTitle']:[])]).join(',');
  const enabled=enabledPages.length>0;
  if(enabled&&!scrollStyle){scrollStyle=document.createElement('style');scrollStyle.setAttribute('data-otl-page-header-scroll','');scrollStyle.textContent=PAGE_HEADER_SCROLL_CSS;document.head.append(scrollStyle);}
  if(!enabled)unwatch();reconcile();if(enabled)watchLayout();else{scrollStyle?.remove();scrollStyle=null;}
  if(enabled&&!observer&&Observer){observer=new Observer(changed);observer.observe(document.body,{subtree:true,childList:true});}
 }
 function stop(){unwatch();scroll.stop();titles.stop();native.stop();scene.stop();scrollStyle?.remove();scrollStyle=null;config=null;for(const host of mounted.keys())remove(host);}
 return {update,stop,reconcile,updateFonts(families){const sceneChanged=scene.setFontFamilies(families),nativeChanged=native.updateFonts(families),titleChanged=titles.updateFonts(families);if(!sceneChanged&&!nativeChanged&&!titleChanged)return false;onRender({nodes:[...mounted.values()].map(n=>n.querySelector('[data-otl-header-scene]')).filter(Boolean)});return true;}};
}

