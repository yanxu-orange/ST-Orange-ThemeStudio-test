import {newLayer,validateLayers} from './layers.mjs';
import {newCaption,validateCaptions} from './captions.mjs';
import {layerSizeStyle,shapeSvg} from './shape-assets.mjs';
import {assetUrl} from './catalog.mjs';
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const cleanImage=({anchor,scope,z,...v})=>v;
const cleanText=({scope,position,z,...v})=>v;
export const pageHeaderImageKey=id=>'image:'+id;
export const pageHeaderTextKey=id=>'text:'+id;
export const pageHeaderSceneFontKey=(page,id)=>`page-header-${page}-text-${id}`;
export function newPageHeaderImage(kind='custom',overrides={}){return cleanImage(newLayer(kind,overrides));}
export function newPageHeaderText(overrides={}){return {...cleanText(newCaption(overrides)),align:overrides.align??'left'};}
export function normalizePageHeaderScene(raw={images:[],texts:[],order:[]}){
 if(!object(raw)||Object.keys(raw).some(k=>!['images','texts','order'].includes(k))||!Array.isArray(raw.images)||!Array.isArray(raw.texts)||!Array.isArray(raw.order))throw Error('页面头部图层无效');
 if(raw.images.some(v=>!object(v)||['anchor','scope','z'].some(k=>Object.hasOwn(v,k)))||raw.texts.some(v=>!object(v)||['scope','position','z'].some(k=>Object.hasOwn(v,k))))throw Error('页面头部图层字段无效');
 if(raw.texts.length>20)throw Error('最多放置20条页面文字');
 const images=validateLayers(raw.images.map(v=>({...v,anchor:'header',scope:'both',z:0}))).map(cleanImage),texts=raw.texts.map(v=>{if(!['left','center','right'].includes(v.align))throw Error('页面文字对齐无效');const {align,...rest}=v;return {...cleanText(validateCaptions([{...rest,scope:'both',z:0}],{large:true,header:true})[0]),align};});
 if(new Set(texts.map(t=>t.id)).size!==texts.length)throw Error('页面文字标识重复');
 const keys=[...images.map(v=>pageHeaderImageKey(v.id)),...texts.map(v=>pageHeaderTextKey(v.id))];
 if(keys.length>40||raw.order.length!==keys.length||new Set(raw.order).size!==keys.length||raw.order.some(k=>!keys.includes(k)))throw Error('页面头部图层顺序无效');
 return {images,texts,order:[...raw.order]};
}
export function pageHeaderSceneFontEntries(config){return Object.fromEntries(Object.entries(config.pageHeaders||{}).flatMap(([page,v])=>v.enabled?[...(v.scene?.texts||[]).filter(t=>t.visible).map(t=>[pageHeaderSceneFontKey(page,t.id),{fontLink:t.fontLink}]),...(page==='home'&&v.placement==='native'&&v.native?.version?[['page-header-home-native-version',{fontLink:v.native.version.fontLink}]]:[])]:[]));}
export function sceneHasLayers(scene){return !!scene&&(scene.images.some(v=>v.visible)||scene.texts.some(v=>v.visible&&v.content.trim()));}
export function createPageHeaderScene({document,resolveArtwork,onChange=()=>{}}={}){
 const records=new Map();let families={};
 function source(v){return v.kind==='shape'?'data:image/svg+xml,'+encodeURIComponent(shapeSvg(v)):resolveArtwork?.(v)||(v.kind==='asset'?assetUrl(v.asset):v.image);}
 function remove(root){const record=records.get(root);if(!record)return;for(const n of record.nodes.values()){n.onload=null;n.onerror=null;n.remove();}records.delete(root);}
 function render(root,page,scene){
  let record=records.get(root);if(!record){record={nodes:new Map(),scene,page};records.set(root,record);}record.scene=scene;record.page=page;
  root.setAttribute('data-otl-header-scene',page);root.style.cssText=`position:absolute;left:0;right:0;bottom:0;top:${root.style.top||'0px'};overflow:hidden;pointer-events:none;isolation:isolate;`;
  const wanted=new Set(scene.order),items=new Map([...scene.images.map(v=>[pageHeaderImageKey(v.id),v]),...scene.texts.map(v=>[pageHeaderTextKey(v.id),v])]);
  for(const [key,n]of record.nodes)if(!wanted.has(key)){n.onload=null;n.onerror=null;n.remove();record.nodes.delete(key);}
  let effective=false;
  for(const [index,key]of scene.order.entries()){
   const v=items.get(key),isText=key.startsWith('text:');let n=record.nodes.get(key);
   if(!n){n=document.createElement(isText?'div':'img');n.setAttribute('data-otl-header-layer',key);n.setAttribute('data-otl-live-owned','');if(!isText){n.alt='';n.draggable=false;n.setAttribute('aria-hidden','true');}record.nodes.set(key,n);}
   root.append(n);n.style.cssText=`position:absolute;box-sizing:border-box;margin:0;padding:0;border:0;max-width:none;max-height:none;pointer-events:none;z-index:${index};`;
   if(isText){
    n.textContent=v.content;const family=families[pageHeaderSceneFontKey(page,v.id)];Object.assign(n.style,{left:v.x+'%',top:v.y+'px',width:v.width==='auto'?'auto':v.width+'%',fontFamily:family?`"${family}",${v.font}`:v.font,fontSize:v.size+'px',fontWeight:v.weight==='auto'?'inherit':String(v.weight),color:v.color,textAlign:v.align,lineHeight:'1.35',whiteSpace:'pre-wrap',overflowWrap:'anywhere'});
    n.hidden=!v.visible||!v.content.trim();if(!n.hidden)effective=true;
   }else{
    const src=source(v)||'';if(n.getAttribute('src')!==src){n.removeAttribute('data-otl-loaded');n.removeAttribute('data-otl-failed');if(src){n.onload=()=>{if(records.get(root)===record&&record.nodes.get(key)===n&&n.getAttribute('src')===src){n.setAttribute('data-otl-loaded','');n.removeAttribute('data-otl-failed');onChange();}};n.onerror=()=>{if(records.get(root)===record&&record.nodes.get(key)===n&&n.getAttribute('src')===src){n.setAttribute('data-otl-failed','');n.removeAttribute('data-otl-loaded');n.hidden=true;onChange();}};n.setAttribute('src',src);}else n.removeAttribute('src');}
    Object.assign(n.style,layerSizeStyle(v),{[v.side]:v.x+(v.offsetUnit==='percent'?'%':'px'),[v.vertical]:v.y+(v.offsetUnit==='percent'?'%':'px'),opacity:String(v.opacity),transform:`rotate(${v.rotation}deg)`});
    n.hidden=!v.visible||!src||n.hasAttribute('data-otl-failed');if(!n.hidden&&v.opacity>0&&(v.kind==='shape'||n.hasAttribute('data-otl-loaded')))effective=true;
   }
  }
  return effective;
 }
 function setFontFamilies(next={}){const keys=new Set([...records.values()].flatMap(r=>r.scene.texts.map(t=>pageHeaderSceneFontKey(r.page,t.id))));const changed=[...keys].some(key=>(families[key]||'')!==(next[key]||''));families=next;if(changed)for(const [root,r]of records)render(root,r.page,r.scene);return changed;}
 return {render,remove,setFontFamilies,stop(){for(const root of [...records.keys()])remove(root);}};
}
