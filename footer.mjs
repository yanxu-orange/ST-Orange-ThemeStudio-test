import {runLayoutPass} from './layout-pass.mjs';
import {layerSizeStyle} from './shape-assets.mjs';
import {regionZ,imageKey} from './region-layers.mjs';
import {CAPTION_LIMIT,newCaption,validateCaptions,captionToken,captionMatchesScope} from './captions.mjs';
import {textItemRules} from './text-layout.mjs';
export const FOOTER_LIMIT=CAPTION_LIMIT;
export const footerKey=id=>'footer:'+id;
export const footerToken=id=>'footer-'+captionToken(id);
export function newFooterCaption(overrides={}){const c=newCaption(overrides);delete c.position;return c;}
export function validateFooterCaptions(raw,{large=false}={}){
 if(!Array.isArray(raw)||raw.length>FOOTER_LIMIT)throw Error('尾部文案无效或超过20条');
 if(raw.some(c=>!c||Object.hasOwn(c,'position')))throw Error('尾部文案不能包含头像位置');
 return validateCaptions(raw.map(c=>({...c,position:'below'})),{large}).map(c=>{delete c.position;return c;});
}
export function normalizeFooterConfig(raw){
 if(!raw||![1,2,3,4,5,6,7,8,9,10].includes(raw.version))throw Error('方案版本不支持');
 if(raw.version<6&&Object.hasOwn(raw,'footerCaptions'))throw Error('旧版本不能包含新尾部文案');
 return {...raw,version:Math.max(6,raw.version),footerCaptions:raw.version>=6?validateFooterCaptions(raw.footerCaptions,{large:raw.version>=8}):[]};
}
export function footerTextEntries(c){return Object.fromEntries(c.footerCaptions.map(v=>[footerKey(v.id),v]));}
export function footerLayers(c,user){return c.layers.filter(l=>l.anchor==='footer'&&l.visible&&(l.scope==='both'||l.scope===(user?'user':'ai')));}
export function visibleFooterCaptions(c,user=false){return c.footerCaptions.filter(v=>v.visible&&v.content.trim()&&captionMatchesScope(v,user));}
export function footerRules(q,c,families={},interactive=false){
 const root=q+' .otl-footer',scene=root+' > .otl-footer-scene',cap=root+' .otl-footer-caption';
 const items=footerTextEntries(c),selectors=Object.fromEntries(c.footerCaptions.map(v=>[footerKey(v.id),cap+`[data-footer-caption-id="${v.id}"]`])),tokens=Object.fromEntries(c.footerCaptions.map(v=>[footerKey(v.id),footerToken(v.id)])),fallbacks=Object.fromEntries(c.footerCaptions.map(v=>[footerKey(v.id),v.font]));
 return `${q} > .mes_block:has(> .otl-footer){overflow:visible!important}
${root}{position:relative!important;box-sizing:border-box!important;width:100%!important;min-width:0!important;min-height:0!important;max-width:100%!important;margin:12px 0 0!important;padding:0!important;border:0!important;overflow:visible!important;isolation:isolate;}
${scene}{position:absolute!important;left:0!important;right:0!important;width:100%!important;min-width:0!important;overflow:visible!important;}
${root} .otl-footer-flow{position:relative!important;width:100%!important;min-width:0!important;padding:0!important;margin:0!important;}
${cap}{display:block!important;position:relative!important;box-sizing:border-box!important;min-width:0!important;max-width:none!important;flex-shrink:0!important;margin:0!important;padding:0!important;white-space:pre-wrap!important;overflow-wrap:anywhere;line-height:1.6!important;font-weight:400;z-index:3;}
${root} .otl-footer-art{display:contents}
${root} .otl-footer-image{position:absolute!important;display:block!important;max-width:none!important;min-width:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;outline:0!important;box-shadow:none!important;background:transparent!important;filter:none!important;object-fit:contain;transform-origin:center;pointer-events:${interactive?'auto':'none'}!important;}
${c.footerCaptions.map(v=>`${selectors[footerKey(v.id)]}{width:${v.width==='auto'?100:v.width}%!important;font-family:${v.font}!important;font-size:${v.size}px!important;color:${v.color}!important}`).join('\n')}
${textItemRules(items,selectors,families,tokens,fallbacks,{zIndices:Object.fromEntries(c.footerCaptions.map(v=>[footerKey(v.id),regionZ(c,'footer',footerKey(v.id))]))})}`;
}
/** Only self-owned nodes; the native block and its children are never moved. */
export function renderFooter(message,c,{createNode,removeNode,resolveArtwork,onImageLoad=()=>{},interactive=false}={}){
 const block=message.querySelector(':scope > .mes_block');if(!block)return null;
 let root=block.querySelector(':scope > .otl-footer');const caps=visibleFooterCaptions(c,message.getAttribute('is_user')==='true'),layers=footerLayers(c,message.getAttribute('is_user')==='true').filter(l=>resolveArtwork(l));
 const remove=removeNode||(n=>n.remove()),create=createNode||((tag,cls,parent)=>{const node=message.ownerDocument.createElement(tag);node.className=cls;parent.append(node);return node;});
 if(!caps.length&&!layers.length){if(root)remove(root);return null;}
 if(!root){root=create('div','otl-footer',block);const scene=create('div','otl-footer-scene',root);create('div','otl-footer-flow',scene);create('div','otl-footer-art',scene);}
 const nativeSlot=block.querySelector(':scope > .otl-native-footer');if(nativeSlot){if(root.nextElementSibling!==nativeSlot)block.insertBefore(root,nativeSlot);}else if(block.lastElementChild!==root)block.append(root);
 const scene=root.querySelector('.otl-footer-scene'),flow=scene.querySelector('.otl-footer-flow'),art=scene.querySelector('.otl-footer-art');
 const oldCaps=new Map([...flow.children].map(n=>[n.dataset.footerCaptionId,n]));
 for(const cap of caps){let node=oldCaps.get(cap.id);oldCaps.delete(cap.id);if(!node){node=create('div','otl-footer-caption',flow);node.dataset.footerCaptionId=cap.id;if(interactive)node.dataset.pick='footer-text';}if(node.textContent!==cap.content)node.textContent=cap.content;flow.append(node);}
 for(const node of oldCaps.values())remove(node);
 const oldImages=new Map([...art.children].map(n=>[n.dataset.layerId,n]));
 for(const l of layers){const src=resolveArtwork(l);if(!src)continue;let node=oldImages.get(l.id);oldImages.delete(l.id);if(!node){node=create('img','otl-footer-image'+(interactive?' otl-decoration':''),art);node.dataset.layerId=l.id;node.alt=interactive?l.name:'';node.addEventListener('load',onImageLoad);node.addEventListener('error',onImageLoad);if(interactive){node.dataset.pick='decoration';node.tabIndex=0;node.setAttribute('role','button');}else node.setAttribute('aria-hidden','true');}
  if(interactive){node.alt=l.name;node.setAttribute('aria-label','选择素材：'+l.name);}if(node.getAttribute('src')!==src)node.src=src;
  Object.assign(node.style,{...layerSizeStyle(l),objectPosition:l.side+' '+l.vertical,left:'auto',right:'auto',top:'auto',bottom:'auto',[l.side]:l.x+(l.offsetUnit==='percent'?'%':'px'),[l.vertical]:l.y+(l.offsetUnit==='percent'?'%':'px'),opacity:l.opacity,transform:`rotate(${l.rotation}deg)`,zIndex:regionZ(c,'footer',imageKey(l.id))});art.append(node);
 }
 for(const node of oldImages.values())remove(node);
 return root;
}
export function footerBaseHeight(flowHeight,width,layers,images){
 return Math.max(0,flowHeight,...layers.filter(l=>images.some(n=>n.dataset.layerId===l.id)).map(l=>{const n=images.find(n=>n.dataset.layerId===l.id),ratio=n?.naturalWidth>0&&n?.naturalHeight>0?n.naturalHeight/n.naturalWidth:1;const resolvedWidth=l.widthUnit==='percent'?width*l.width/100:l.width;return l.kind==='shape'?(l.heightUnit==='px'?l.height:resolvedWidth):resolvedWidth*ratio;}));
}
export function footerUnion(origin,nodes){let top=0,bottom=0;for(const n of nodes){const r=n.getBoundingClientRect();if(!r.width||!r.height)continue;top=Math.min(top,r.top-origin);bottom=Math.max(bottom,r.bottom-origin);}return {top:Math.max(0,Math.ceil(-top)),height:Math.max(0,Math.ceil(bottom))+Math.max(0,Math.ceil(-top))};}
export function nativeFooterClearance(message){
 const getStyle=message.ownerDocument.defaultView?.getComputedStyle;let height=0;
 for(const node of message.querySelectorAll(':scope > .swipe_left,:scope > .swipeRightBlock')){const r=node.getBoundingClientRect();if(!r.width||!r.height||node.hidden||node.style.display==='none')continue;if(getStyle){const style=getStyle.call(message.ownerDocument.defaultView,node);if(style.display==='none'||style.visibility==='hidden')continue;}height=Math.max(height,r.height);}
 return height?Math.ceil(height+8):0;
}
export function measureFooter(...args){return runLayoutPass([footerLayout(...args)])[0];}
export function* footerLayout(message,c){
 const root=message.querySelector(':scope > .mes_block > .otl-footer');if(!root)return;
 const scene=root.querySelector('.otl-footer-scene'),flow=scene.querySelector('.otl-footer-flow'),images=[...scene.querySelectorAll('.otl-footer-image')];
 const width=yield()=>root.clientWidth||root.getBoundingClientRect().width||Math.max(1,c.cardWidth-48);
 const set=(node,key,value)=>{if(node.style.getPropertyValue(key)!==value)node.style.setProperty(key,value);};
 for(const cap of c.footerCaptions)set(root,'--otx-'+footerToken(cap.id),cap.x*width/100+'px');
 const base=yield()=>footerBaseHeight(flow.getBoundingClientRect().height,width,footerLayers(c,message.getAttribute('is_user')==='true'),images);set(scene,'height',base+'px');
 const {bounds,clearance}=yield()=>({bounds:footerUnion(scene.getBoundingClientRect().top,[...flow.children,...images]),clearance:c.nativeStyle?0:nativeFooterClearance(message)});set(scene,'top',bounds.top+'px');set(root,'height',(bounds.height+clearance)+'px');
}
