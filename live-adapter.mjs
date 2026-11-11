import {normalizeCommonConfig,commonStyleRules,commonFontEntries} from './common-style.mjs';
import {normalizePageConfig,pageStyleRules,pageFontEntries,createPageDropdownBridge} from './page-style.mjs';
import {createImageDisplay} from './image-display.mjs';
import {runLayoutPass} from './layout-pass.mjs';
import {avatarArtworkFrameStyle} from './avatar-art.mjs';
import {regionZ,regionForImage,imageKey} from './region-layers.mjs';
import {layerSizeStyle} from './shape-assets.mjs';
import {captionMatchesScope} from './captions.mjs';
import {headerArtworkClipLayout} from './header-art-clip.mjs';
import {avatarDesignRules} from './avatar-design.mjs';
import {canvasBackgroundRules} from './canvas-background.mjs';
import {createScrollbarVisibility,normalizeScrollbars} from './scrollbars.mjs';
import {normalizeAvatarFill,avatarFillRules} from './avatar-fill.mjs';
import {normalizeChromeConfig,chromeFontEntries} from './chrome.mjs';
import {createChromeAdapter} from './chrome-adapter.mjs';
import {normalizeTextScene,prepareScene,placeSceneLayout,sceneWidth,sceneTextRules,sceneFrameRules} from './text-scene.mjs';
import {normalizeNativeConfig,nativeRules,nativeLayout,latestAI,nativeControlNodes,clearNativeIconFailures} from './native.mjs';
import {normalizeFooterConfig,footerTextEntries,footerRules,renderFooter,footerLayout} from './footer.mjs';
import {normalizeReasoningConfig,reasoningFontEntries,reasoningRules,reasoningShellRules,reasoningLabel,interfaceFont,watchInterfaceFont} from './reasoning.mjs';
import {bodyCardSettings,bodyCardRules,chatFrameRules} from './body-card.mjs';
import {normalizeCaptionConfig,captionKey,textEntries,textTokens,textFallbacks} from './captions.mjs';
import {clone} from './layers.mjs';
import {createFontSession} from './font-sources.mjs';
import {textSettings,customTextLayout,textItemRules} from './text-layout.mjs';

const OWN = 'data-otl-live-owned';
const FLAG = 'data-otl-live';
const q = '#chat > .mes[data-otl-live]';
const head = `${q} > .mes_block > .ch_name`;
const avatar = `${q} > .mesAvatarWrapper > .avatar`;
const meta = `${head} [data-otl-live-meta]`;
const captionHost = `${meta} > :is(.otl-live-caption,.otl-live-caption-slot)`;

function styleText(config,families={},interfaceFamily='sans-serif') {
  const items=textEntries(config),tokens=textTokens(config);
  const settings=textSettings(config),custom=customTextLayout(settings);
  const alignment={start:'flex-start',center:'center',end:'flex-end'}[settings.textAlign];
  const opacity=Math.round((config.surfaceOpacity??1)*255).toString(16).padStart(2,'0');
  const vars={background:config.background,surface:config.surface+opacity,text:config.text,accent:config.accent,radius:config.radius+'px',font:config.font,size:config.fontSize+'px',line:config.lineHeight,nameFont:config.nameFont,nameColor:config.nameColor,nameSize:config.nameSize+'px',timeColor:config.timeColor,timeSize:config.timeSize+'px',glass:config.glass+'px',cardWidth:config.cardWidth+'px',avatarRadius:config.avatarRadius+'px'};
  const fallbacks=textFallbacks(config),selectors={name:`${meta} > .name_text`,time:`${meta} > .timestamp`,...Object.fromEntries(config.captions.map(c=>[captionKey(c.id),`${meta} .otl-live-caption[data-caption-id="${c.id}"]`]))};
  const font=new URL('./materials/字体/SourceHanSerifCN-VF.ttf.woff2',import.meta.url).href;
  return `@font-face{font-family:LabSongti;src:url("${font}") format("woff2");font-style:normal;font-weight:250 900;font-display:swap}
html[data-orange-live] #chat{${Object.entries(vars).map(([k,v])=>`--ol-${k}:${v}`).join(';')};background:var(--ol-background)!important;padding:20px 12px 90px!important;gap:18px!important}
${q}{position:relative!important;display:block!important;box-sizing:border-box!important;width:100%!important;max-width:var(--ol-cardWidth)!important;min-width:0!important;height:auto!important;max-height:none!important;margin:0 auto 18px!important;padding:24px!important;background:var(--ol-surface)!important;color:var(--ol-text)!important;border:1px solid #ffffff88!important;border-radius:var(--ol-radius)!important;box-shadow:0 5px 25px #344b4210!important;backdrop-filter:blur(var(--ol-glass))!important;text-shadow:none!important;overflow:visible!important;container-type:inline-size}
${q} > .mes_block{position:static!important;display:block!important;width:100%!important;max-width:none!important;margin:0!important;padding:0!important;min-width:0!important;overflow:visible!important}
${head}{position:relative!important;display:block!important;box-sizing:border-box!important;min-height:var(--ol-header-height)!important;width:100%!important;margin:0 0 14px!important;padding:0!important;border-bottom:1px solid color-mix(in srgb,var(--ol-accent) 22%,transparent)}
${meta}{position:static!important;display:flex!important;flex-direction:column!important;align-items:flex-start!important;gap:4px!important;width:auto!important;min-width:0!important;padding:0!important;z-index:auto!important;transform:none!important}
${settings.timeFont==='auto'?'':`${meta} > .timestamp{font-family:${settings.timeFont}!important}`}
${custom?`${meta}{box-sizing:border-box!important;align-items:${alignment}!important;text-align:${settings.textAlign}!important}`:''}
${meta} > .name_text{font-family:var(--ol-nameFont)!important;font-size:var(--ol-nameSize)!important;font-weight:400!important;line-height:1.4!important;color:var(--ol-nameColor)!important;overflow-wrap:anywhere;order:1}
${meta} > .timestamp{font-size:var(--ol-timeSize)!important;line-height:1.5!important;color:var(--ol-timeColor)!important;white-space:normal!important;order:2}
${meta} .otl-live-caption{line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere;order:0}
${q} > .mesAvatarWrapper{position:absolute!important;left:24px!important;top:calc(24px + var(--ol-photo-top) + var(--sc-reserve-top,0px))!important;width:var(--ol-photo-width)!important;height:auto!important;min-height:0!important;display:flex!important;flex-wrap:wrap!important;justify-content:center!important;align-content:flex-start!important;gap:3px 6px!important;margin:0!important;padding:0!important;z-index:${regionZ(config,'header','avatar')}!important}
${avatar}{position:relative!important;display:block!important;box-sizing:border-box!important;width:var(--ol-photo-width)!important;height:var(--ol-photo-height)!important;max-width:none!important;min-width:0!important;flex:0 0 100%!important;margin:0!important;padding:0!important;border:0!important;outline:0!important;box-shadow:none!important;overflow:visible!important;transform:translate(var(--ol-photo-x),var(--ol-photo-y)) rotate(var(--ol-photo-rotation))!important;transform-origin:50% 100%;isolation:isolate;clip-path:polygon(var(--sc-avatar-clip))!important;}
${avatar} > img:not([${OWN}]){position:relative!important;display:block!important;box-sizing:border-box!important;width:100%!important;height:100%!important;max-width:none!important;object-fit:cover!important;z-index:2}
${q} > .mesAvatarWrapper > :is(.mesIDDisplay,.mes_timer,.tokenCounterDisplay){max-width:100%;font:11px/1.5 sans-serif;color:var(--ol-timeColor)}
${head} > :is(.mes_buttons,.mes_edit_buttons){position:absolute;right:0;top:0;z-index:6;max-width:100%}
${head} .mes_button{min-width:24px;min-height:24px}
${q} > .mes_block > .mes_text{position:relative!important;width:100%!important;margin:0!important;padding:0!important;font-family:var(--ol-font)!important;font-size:var(--ol-size)!important;line-height:var(--ol-line)!important;color:var(--ol-text)!important;overflow-wrap:anywhere}
${q} > .mes_block > .mes_text p{margin:0 0 12px!important;line-height:inherit!important;color:inherit!important}
${q} > .mes_block > .mes_text :is(img,video){max-width:100%;height:auto}
${q} > .mes_block > .mes_text pre{max-width:100%;overflow:auto}
${reasoningShellRules(q)}
${q} .mes_reasoning_actions{flex-shrink:0}
${q} .mes_reasoning_header_title[data-otl-live-reasoning]{font-size:0!important}
${reasoningRules(`${q} .mes_reasoning_header`,`${q} .mes_reasoning`,`${q} .otl-reasoning-bg`,config,families,interfaceFamily)}
${q} .otl-live-art{display:contents}
${q} .otl-live-art img{position:absolute!important;max-width:none!important;min-width:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;outline:0!important;box-shadow:none!important;background:transparent!important;filter:none!important;object-fit:contain;pointer-events:none!important;transform-origin:center}
${q} > .mes_block > .mes_text textarea{max-width:100%;box-sizing:border-box}
${q} > :is(.swipe_left,.swipeRightBlock){z-index:5}
${q}[data-otl-live-avatar-hidden=true] > .mesAvatarWrapper > .avatar{display:none!important}
${q}[data-otl-live-avatar-hidden=true] > .mesAvatarWrapper{position:relative!important;left:auto!important;top:auto!important;width:100%!important;justify-content:flex-start!important}
body.documentstyle ${q} > .mesAvatarWrapper,body.documentstyle ${captionHost}{display:none!important}
body.no-blur ${q}{backdrop-filter:none!important}
${footerRules(q,config,families)}
${nativeRules(q,config)}
${bodyCardRules(`${q} > .mes_block > .mes_text`,q,config,'live',families.body)}
${chatFrameRules('html[data-orange-live] #chat',q,config)}
${config.captions.map(cap=>{const node=`${meta} .otl-live-caption[data-caption-id="${cap.id}"]`;return `${node}{font-family:${cap.font}!important;font-size:${cap.size}px!important;color:${cap.color}!important;${cap.visible?'':'display:none!important;'}}`;}).join('\n')}
${meta} .otl-live-caption[hidden]{display:none!important}
${textItemRules(items,selectors,families,tokens,fallbacks,{position:false})}
${sceneTextRules(config,selectors)}
${sceneFrameRules(q,head)}
${meta} > .otl-live-caption-slot{position:static!important;display:contents!important}
${q} .otl-live-art.otl-scene-art{display:block!important}
${avatarDesignRules(q,config)}
${avatarFillRules(q,config)}
${canvasBackgroundRules(config,'html[data-orange-live]')}
${commonStyleRules(config,{family:families.common||''})}
${pageStyleRules(config,{families})}

`;
}

function normalizeLiveConfig(config){
  const next=normalizeAvatarFill(normalizeChromeConfig(normalizeTextScene(normalizeNativeConfig(normalizeFooterConfig(normalizeReasoningConfig(normalizeCaptionConfig(clone(config))))))));
  Object.assign(next,bodyCardSettings(next),{commonStyle:normalizeCommonConfig(next).commonStyle,pageStyle:normalizePageConfig(next).pageStyle});
  next.hideScrollbars=normalizeScrollbars(next.hideScrollbars);return next;
}
// Drafts already normalized by the editor need object isolation, not another
// structuredClone of every embedded image string. Strings are immutable/shared.
function copyDraft(value){
  if(!value||typeof value!=='object')return value;
  if(Array.isArray(value))return value.map(copyDraft);
  return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,copyDraft(item)]));
}
const cssRootFields=new Set(['background','surface','surfaceOpacity','text','accent','nameColor','timeColor','cardBorderColor','glass','hideScrollbars','canvasBackground']);
const cssCommonFields=new Set(['color','muted','accent','background','border','hover','focus','opacity']);
const cssChromeFields=new Set(['color','borderColor','textColor','alpha','blur']);
function cssOnlyField(path,key){
  if(!path.length&&key==='pageStyle')return true;
  if(!path.length)return cssRootFields.has(key);
  const [root,group,part]=path;
  if(path.length===2){
    if(['captions','footerCaptions','nativeStyle','avatarFill'].includes(root))return key==='color';
    if(root==='photos')return key==='frameColor';
    if(root==='chromeStyle')return cssChromeFields.has(key);
    if(root==='commonStyle')return cssCommonFields.has(key);
    if(root==='reasoningStyle')return key==='color';
  }
  if(root==='reasoningStyle'&&path.length===3){
    if(group==='entry'&&part==='background')return key==='color'||key==='opacity';
    if(group==='body'&&part==='container')return key==='color'||key==='borderColor';
  }
  return false;
}
// Compare scalar leaves directly. In particular, never serialize/base64-copy
// image sources to detect a change. No global source cache retains old images.
function sameLayout(a,b,path=[]){
  if(a===b)return true;
  if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;
  const keys=Object.keys(a).filter(key=>!cssOnlyField(path,key));
  if(keys.length!==Object.keys(b).filter(key=>!cssOnlyField(path,key)).length)return false;
  return keys.every(key=>Object.hasOwn(b,key)&&sameLayout(a[key],b[key],[...path,key]));
}
function fontEntries(config){return {body:{fontLink:config.bodyFontLink},...textEntries(config),...reasoningFontEntries(config),...footerTextEntries(config),...chromeFontEntries(config),...commonFontEntries(config),...pageFontEntries(config)};}

/** Only owns private markers, CSS variables and injected nodes. Native nodes are never moved. */
export function createLiveAdapter({document,resolveArtwork,requestFrame,cancelFrame,MutationObserver:Observe,ResizeObserver:Resize,fitInput,onRender}={}) {
  const pageDropdowns=createPageDropdownBridge({document,MutationObserver:Observe});
  const imageDisplay=createImageDisplay({document,selector:'img[data-layer-id][data-otl-live-owned]'});
  const chrome=createChromeAdapter({document,resolveArtwork,fitInput,MutationObserver:Observe,ResizeObserver:Resize});
  const win=document.defaultView;
  const raf=requestFrame||win?.requestAnimationFrame?.bind(win)||(fn=>setTimeout(fn,0));
  const caf=cancelFrame||win?.cancelAnimationFrame?.bind(win)||clearTimeout;
  const Observer=Observe||win?.MutationObserver;
  const ResizeObs=Resize||win?.ResizeObserver;
  const scrollbarVisibility=createScrollbarVisibility({document});
  let pendingConfig=null,snapshot=null,style=null,observer=null,resizer=null,frame=null,theme=null,themeDisabled=false,rootOriginal=null,session=0,fontHandler=null,fontSession=null,stopInterfaceWatch=null,currentInterface='sans-serif';
  const states=new Map();
  const observedSizes=new Map(),dirtyMessages=new Set();
  let chat=null,messages=[],latest=null,fullPending=false,structurePending=false,hostModes='';
  const readHostModes=()=>['documentstyle','hideChatAvatars'].map(name=>document.body.classList.contains(name)).join(',');
  function hostLayoutChanged(){
    const next=readHostModes(),changed=next!==hostModes;hostModes=next;
    // Geometry observers and the interface-font watcher handle other host CSS.
    // Older hosts without ResizeObserver retain conservative invalidation.
    if(changed||!resizer)schedule();
  }
  function unobserveMessage(msg){
    for(const node of states.get(msg)?.observed||[]){resizer?.unobserve(node);observedSizes.delete(node);}
  }
  function observeMessage(msg){
    if(!resizer)return;
    const state=states.get(msg),wanted=new Set([msg,msg.querySelector('[data-otl-live-meta]'),...msg.querySelectorAll('[data-otl-live-meta] .name_text,[data-otl-live-meta] .timestamp,[data-otl-live-meta] .otl-live-caption'),msg.querySelector('.mes_reasoning_header'),msg.querySelector('.mes_reasoning'),msg.querySelector('.otl-footer'),msg.querySelector('.otl-footer-flow'),...nativeControlNodes(msg)].filter(Boolean));
    for(const node of state.observed||[])if(!wanted.has(node)){resizer.unobserve(node);observedSizes.delete(node);}
    for(const node of wanted)if(!observedSizes.has(node)){observedSizes.set(node,{message:msg,size:null});resizer.observe(node);}
    state.observed=wanted;
  }
  function attribute(state,node,key,value){
    let record=state.attributes.find(r=>r.node===node&&r.key===key);
    if(!record){record={node,key,old:node.getAttribute(key),last:null};state.attributes.push(record);}
    record.last=String(value);if(node.getAttribute(key)!==record.last)node.setAttribute(key,record.last);
  }
  function variable(state,node,key,value){
    if(!state.styleOrigins.has(node))state.styleOrigins.set(node,node.hasAttribute('style'));
    let record=state.variables.find(r=>r.node===node&&r.key===key);
    if(!record){record={node,key,old:node.style.getPropertyValue(key),priority:typeof node.style.getPropertyPriority==='function'?node.style.getPropertyPriority(key):'',last:null};state.variables.push(record);}
    record.last=String(value);if(node.style.getPropertyValue(key)!==record.last)node.style.setProperty(key,record.last);
  }
  function owned(state,tag,cls,parent){const node=document.createElement(tag);node.className=cls;node.setAttribute(OWN,'');state.nodes.add(node);parent.append(node);return node;}
  function clearState(state){
    clearNativeIconFailures(state.attributes.filter(r=>r.key==='data-otl-native-mode').map(r=>r.node));
    for(const node of state.nodes)node.remove();
    for(const r of state.attributes)if(r.node.getAttribute(r.key)===r.last){if(r.old===null)r.node.removeAttribute(r.key);else r.node.setAttribute(r.key,r.old);}
    for(const r of state.variables)if(r.node.style.getPropertyValue(r.key)===r.last){if(r.old)r.node.style.setProperty(r.key,r.old,r.priority);else r.node.style.removeProperty(r.key);}
    for(const [node,existed]of state.styleOrigins)if(!existed&&!node.getAttribute('style'))node.removeAttribute('style');
  }
  function releaseDetached(state,msg){
    const attached=r=>r.node===msg||msg.contains(r.node);
    for(const r of state.attributes)if(!attached(r)&&r.node.getAttribute(r.key)===r.last){if(r.old===null)r.node.removeAttribute(r.key);else r.node.setAttribute(r.key,r.old);}
    state.attributes=state.attributes.filter(attached);
    // Hosts can cache and reuse replaced native nodes. Restore our variables
    // before forgetting them, preserving any concurrent host writes.
    for(const r of state.variables)if(!attached(r)&&r.node.style.getPropertyValue(r.key)===r.last){if(r.old)r.node.style.setProperty(r.key,r.old,r.priority);else r.node.style.removeProperty(r.key);}
    state.variables=state.variables.filter(attached);
    for(const [node,existed]of state.styleOrigins)if(node!==msg&&!msg.contains(node)){if(!existed&&!node.getAttribute('style'))node.removeAttribute('style');state.styleOrigins.delete(node);}
    for(const node of [...state.nodes])if(!msg.contains(node)){node.remove();state.nodes.delete(node);}
  }
  function artContainer(state,parent,role){
    let node=[...state.nodes].find(n=>n.parentNode===parent&&n.getAttribute('data-otl-live-role')===role);
    if(!node){node=owned(state,'div','otl-live-art',parent);node.setAttribute('data-otl-live-role',role);}
    return node;
  }
  function* prepareMessage(msg){
    const block=msg.querySelector(':scope > .mes_block'),header=block?.querySelector(':scope > .ch_name'),photo=msg.querySelector(':scope > .mesAvatarWrapper > .avatar'),nativeImage=photo?.querySelector(':scope > img:not([data-otl-live-owned])'),name=header?.querySelector('.name_text');
    if(!header||!photo||!nativeImage||!name)return false;
    let state=states.get(msg);const nativeHidden=yield()=>{if(state)return state.nativeHidden;const knownHidden=document.body.classList.contains('hideChatAvatars')||document.body.classList.contains('documentstyle'),getStyle=win?.getComputedStyle;return !knownHidden&&typeof getStyle==='function'&&(getStyle.call(win,photo).display==='none'||getStyle.call(win,photo.parentElement).display==='none');};if(!state){state={nodes:new Set(),attributes:[],variables:[],styleOrigins:new Map(),nativeHidden};states.set(msg,state);}
    releaseDetached(state,msg);
    const c=snapshot,user=msg.getAttribute('is_user')==='true',p=c.photos[user?'user':'ai'],names=name.parentElement;
    if(state.meta&&state.meta!==names){const hidden=state.nativeHidden;unobserveMessage(msg);clearState(state);state={nodes:new Set(),attributes:[],variables:[],styleOrigins:new Map(),nativeHidden:hidden};states.set(msg,state);}state.meta=names;
    attribute(state,msg,FLAG,'');attribute(state,msg,'data-otl-live-layout',c.layout);attribute(state,names,'data-otl-live-meta','');
    const captionIds=new Set(c.captions.map(cap=>cap.id));
    for(const node of [...state.nodes])if(node.classList.contains('otl-live-caption')&&!captionIds.has(node.dataset.captionId)){node.remove();state.nodes.delete(node);}
    for(const cap of c.captions){
      let parent=names;
      if(cap.width!=='auto'){let slot=[...state.nodes].find(n=>n.className==='otl-live-caption-slot'&&n.dataset.captionId===cap.id&&n.parentNode===names);if(!slot){slot=owned(state,'div','otl-live-caption-slot',names);slot.dataset.captionId=cap.id;}parent=slot;}
      let node=[...state.nodes].find(n=>n.className==='otl-live-caption'&&n.dataset.captionId===cap.id);
      if(!node){node=owned(state,'div','otl-live-caption',parent);node.dataset.captionId=cap.id;}
      else if(node.parentNode!==parent)parent.append(node);
      if(node.textContent!==cap.content)node.textContent=cap.content;node.hidden=!cap.visible||!captionMatchesScope(cap,user);
    }
    for(const node of [...state.nodes])if(node.classList.contains('otl-live-caption-slot')&&!node.querySelector('.otl-live-caption')){node.remove();state.nodes.delete(node);}
    const details=block.querySelector('.mes_reasoning_details'),reasonBody=details?.querySelector('.mes_reasoning'),nativeTitle=details?.querySelector('.mes_reasoning_header_title');
    const hasReason=details&&details.dataset.state!=='none'&&reasonBody&&(reasonBody.textContent.trim()||reasonBody.querySelector('img:not([data-otl-live-owned]),video,audio,pre,textarea'));
    const reasonEntry=hasReason?details.querySelector('.mes_reasoning_header'):null,reasoning=hasReason?nativeTitle:null;
    if(state.reasonTitle!==reasoning){
      for(const node of [...state.nodes])if(node.hasAttribute('data-otl-reason-owned')){node.remove();state.nodes.delete(node);}
      const previous=state.reasonTitle,record=state.attributes.find(r=>r.node===previous&&r.key==='data-otl-live-reasoning');if(record){if(previous.getAttribute(record.key)===record.last){if(record.old===null)previous.removeAttribute(record.key);else previous.setAttribute(record.key,record.old);}state.attributes.splice(state.attributes.indexOf(record),1);}state.reasonTitle=reasoning;
    }
    if(reasoning&&reasonEntry){
      attribute(state,reasoning,'data-otl-live-reasoning','');
      let label=[...state.nodes].find(n=>n.className==='otl-live-reasoning'&&n.parentNode===reasoning.parentElement);if(!label){label=owned(state,'span','otl-live-reasoning',reasoning.parentElement);label.setAttribute('data-otl-reason-owned','');reasoning.after(label);label.setAttribute('aria-hidden','true');}
      const text=reasoningLabel(c.reasoningStyle.entry.content,reasoning.getAttribute('data-duration'));if(label.textContent!==text)label.textContent=text;
      let bg=[...state.nodes].find(n=>n.className==='otl-reasoning-bg'&&n.parentNode===reasonEntry);if(!bg){bg=owned(state,'div','otl-reasoning-bg',reasonEntry);bg.setAttribute('data-otl-reason-owned','');bg.setAttribute('aria-hidden','true');reasonEntry.prepend(bg);}
    }
    const documentMode=document.body.classList.contains('documentstyle');
    const photoHidden=state.nativeHidden||photo.hidden||photo.parentElement.hidden||photo.style.display==='none'||photo.parentElement.style.display==='none'||documentMode||document.body.classList.contains('hideChatAvatars');
    attribute(state,msg,'data-otl-live-avatar-hidden',photoHidden?'true':'false');
    const sceneNodes={name,time:names.querySelector('.timestamp'),...Object.fromEntries(c.captions.map(cap=>[captionKey(cap.id),[...state.nodes].find(n=>n.className==='otl-live-caption'&&n.dataset.captionId===cap.id)]))};
    const width=yield()=>sceneWidth(msg,c);
    const scene=prepareScene(msg,header,c,sceneNodes,(node,key,value)=>variable(state,node,key,value),photoHidden,width);
    const {photoWidth,photoHeight,photoTop}=scene;
    for(const [key,value]of Object.entries({'header-height':scene.height+'px','photo-top':photoTop+'px','photo-width':photoWidth+'px','photo-height':photoHeight+'px','photo-x':p.x+'px','photo-y':(-p.y)+'px','photo-rotation':p.rotation+'deg'}))variable(state,msg,'--ol-'+key,value);
    const headerArtwork=[],destinations={header,avatar:header,message:msg,'reasoning-entry':reasonEntry,'reasoning-body':hasReason?reasonBody:null};
    for(const anchor of Object.keys(destinations)){
      if(!destinations[anchor])continue;const container=artContainer(state,destinations[anchor],anchor);if(anchor==='header')container.classList.add('otl-scene-art');if(anchor.startsWith('reasoning-'))container.setAttribute('data-otl-reason-owned','');
      const layers=c.layers.filter(l=>l.visible&&l.anchor===anchor&&!(photoHidden&&anchor==='avatar')&&(l.scope==='both'||l.scope===(user?'user':'ai')));
      const existing=new Map([...container.querySelectorAll('[data-layer-id]')].map(e=>[e.getAttribute('data-layer-id'),e]));
      for(const layer of layers){
        const src=resolveArtwork(layer);if(!src)continue;
        let image=existing.get(layer.id);if(!image){let imageParent=container;if(anchor==='avatar'){imageParent=owned(state,'div','otl-avatar-art-frame',container);}image=owned(state,'img','',imageParent);image.setAttribute('data-layer-id',layer.id);if(anchor==='header')image.onload=()=>scheduleMessage(msg);if(anchor.startsWith('reasoning-'))image.setAttribute('data-otl-reason-owned','');image.alt='';image.setAttribute('aria-hidden','true');}
        existing.delete(layer.id);if(image.getAttribute('src')!==src)image.setAttribute('src',src);
        if(anchor==='avatar')Object.assign(image.parentElement.style,avatarArtworkFrameStyle(c,user,scene,regionZ(c,'header',imageKey(layer.id))));
        Object.assign(image.style,{...layerSizeStyle(layer),position:'absolute',objectPosition:layer.side+' '+layer.vertical,left:'auto',right:'auto',top:'auto',bottom:'auto',[layer.side]:layer.x+(layer.offsetUnit==='percent'?'%':'px'),[layer.vertical]:layer.y+(layer.offsetUnit==='percent'?'%':'px'),opacity:layer.opacity,transform:`rotate(${layer.rotation}deg)`,zIndex:regionZ(c,regionForImage(layer),imageKey(layer.id))});if(anchor==='header')headerArtwork.push({image,layer});
      }
      for(const image of existing.values()){const frame=image.parentElement;state.nodes.delete(image);image.remove();if(frame.classList.contains('otl-avatar-art-frame')){state.nodes.delete(frame);frame.remove();}}
    }
    const footerSession=session;renderFooter(msg,c,{resolveArtwork,createNode:(tag,cls,parent)=>owned(state,tag,cls,parent),removeNode:node=>{for(const n of [...state.nodes])if(n===node||node.contains(n)){n.remove();state.nodes.delete(n);}node.remove();},onImageLoad:()=>{if(snapshot&&session===footerSession&&states.get(msg)===state&&msg.isConnected)scheduleMessage(msg);}});
    return {msg,header,sceneNodes,scene,headerArtwork,state};
  }
  function nativeOptions(msg,state,isLatest){return {createNode:(tag,cls,parent)=>owned(state,tag,cls,parent),removeNode:node=>{for(const n of [...state.nodes])if(n===node||node.contains(n)){n.remove();state.nodes.delete(n);}node.remove();},attribute:(node,key,value)=>attribute(state,node,key,value),variable:(node,key,value)=>variable(state,node,key,value),latest:isLatest};}
  function isMessage(msg){return msg?.parentElement===chat&&msg.matches('.mes:not([data-orange-lab-fixture])')&&msg.getAttribute('is_system')!=='true'&&!msg.classList.contains('smallSysMes');}
  function syncMessages(){
    const nextChat=document.querySelector('#chat');
    if(nextChat!==chat){
      if(chat){resizer?.unobserve(chat);observedSizes.delete(chat);}
      chat=nextChat;
      if(chat&&resizer){observedSizes.set(chat,{message:null,size:null});resizer.observe(chat);}
    }
    messages=[...(chat?.children||[])].filter(isMessage);
    const live=new Set(messages);
    for(const [msg,state]of states)if(!live.has(msg)){unobserveMessage(msg);clearState(state);states.delete(msg);dirtyMessages.delete(msg);}
    for(const msg of dirtyMessages)if(!live.has(msg))dirtyMessages.delete(msg);
    for(const msg of messages)if(!states.has(msg))dirtyMessages.add(msg);
    const nextLatest=latestAI(messages);
    if(nextLatest!==latest){if(live.has(latest))dirtyMessages.add(latest);if(nextLatest)dirtyMessages.add(nextLatest);latest=nextLatest;}
  }
  function flush(){
    if(!snapshot)return 0;
    let chromeChanged=false;
    if(pendingConfig){
      const next=pendingConfig;pendingConfig=null;
      const needsLayout=!sameLayout(snapshot,next);
      snapshot=next;scrollbarVisibility.set(snapshot.hideScrollbars);fontSession?.update(fontEntries(snapshot));
      const css=styleText(snapshot,fontSession?.families()||{},currentInterface);if(style.textContent!==css)style.textContent=css;
      chrome.update(snapshot,fontSession?.families()||{});chromeChanged=true;
      if(needsLayout)for(const msg of messages)dirtyMessages.add(msg);
    }
    const full=fullPending;
    if(full||structurePending)syncMessages();
    fullPending=false;structurePending=false;
    if(full){
      const nextInterface=interfaceFont(document);if(currentInterface!==nextInterface){currentInterface=nextInterface;if(style)style.textContent=styleText(snapshot,fontSession?.families()||{},currentInterface);}
      chrome.update(snapshot,fontSession?.families()||{});chromeChanged=true;
      for(const msg of messages)dirtyMessages.add(msg);
    }
    const pending=[...dirtyMessages].filter(isMessage);dirtyMessages.clear();
    const prepared=runLayoutPass(pending.map(prepareMessage)).filter(Boolean);
    runLayoutPass(prepared.flatMap(({headerArtwork,scene})=>headerArtwork.map(({image,layer})=>headerArtworkClipLayout(image,layer,scene.width,Math.max(0,scene.height-24)))));
    runLayoutPass(prepared.map(({msg})=>footerLayout(msg,snapshot)));
    runLayoutPass(prepared.map(({msg,state})=>nativeLayout(msg,snapshot,nativeOptions(msg,state,msg===latest))));
    runLayoutPass(prepared.map(({msg,header,sceneNodes,scene,state})=>placeSceneLayout(msg,header,snapshot,sceneNodes,scene,(node,key,value)=>variable(state,node,key,value))));
    for(const {msg}of prepared)observeMessage(msg);
    onRender?.({messages:states.size,updated:prepared.length,nodes:prepared.map(({msg})=>msg),chromeChanged});
    return prepared.length;
  }
  function reconcile(){fullPending=true;return flush();}
  function requestFlush(){if(!snapshot||frame!==null)return;frame=raf(()=>{frame=null;flush();});}
  function schedule(){fullPending=true;requestFlush();}
  function scheduleMessage(msg){if(!snapshot||msg?.parentElement!==chat)return;dirtyMessages.add(msg);requestFlush();}
  function messageFor(node){const element=node?.nodeType===1?node:node?.parentElement,msg=element?.closest?.('#chat > .mes');return msg?.parentElement===chat?msg:null;}
  function isOwned(node){return node?.nodeType===1&&(node.hasAttribute(OWN)||!!node.closest?.(`[${OWN}]`));}
  function changed(records){
    for(const record of records){
      const target=record.target.nodeType===1?record.target:record.target.parentElement;
      if(isOwned(target))continue;
      if(record.type==='childList'){
        const nodes=[...record.addedNodes,...record.removedNodes];
        if(nodes.length&&nodes.every(isOwned))continue;
        if(target===chat){structurePending=true;requestFlush();continue;}
        const msg=messageFor(target);
        if(msg){scheduleMessage(msg);continue;}
        if(nodes.some(node=>node.nodeType===1&&(node.id==='chat'||node.querySelector?.('#chat'))))schedule();
        continue;
      }
      if((target===document.body||target===document.documentElement)&&['class','style'].includes(record.attributeName)){hostLayoutChanged();continue;}
      if(record.attributeName==='style'&&!target.matches?.('.mes_buttons,.mes_edit_buttons,.mesIDDisplay,.mes_timer,.tokenCounterDisplay,.swipe_left,.swipeRightBlock,.swipe_right,.swipes-counter,.extraMesButtonsHint,.extraMesButtons,.avatar,.mesAvatarWrapper'))continue;
      if(target.parentElement===chat&&(states.has(target)||target.matches('.mes'))&&['class','is_user','is_system','data-orange-lab-fixture'].includes(record.attributeName)){structurePending=true;scheduleMessage(target);continue;}
      const msg=messageFor(target);
      if(msg)scheduleMessage(msg);
      else if(target===chat){if(['class','style'].includes(record.attributeName))hostLayoutChanged();else schedule();}
    }
  }
  function resized(entries){
    for(const entry of entries){
      const observed=observedSizes.get(entry.target);if(!observed)continue;
      const size=entry.contentRect,previous=observed.size;observed.size={width:size.width,height:size.height};
      // Initial delivery can include media loaded after renderMessage; reconcile it too.
      if(!observed.message){if(!previous||size.width!==previous.width)schedule();}
      else if(!previous||size.width!==previous.width||size.height!==previous.height)scheduleMessage(observed.message);
    }
  }
  function stop(){
    if(!snapshot)return;
    pageDropdowns.stop();
    imageDisplay.clear();scrollbarVisibility.stop();pendingConfig=null;snapshot=null;chrome.stop();session++;stopInterfaceWatch?.();stopInterfaceWatch=null;fontSession?.dispose();fontSession=null;observer?.disconnect();observer=null;resizer?.disconnect();resizer=null;observedSizes.clear();dirtyMessages.clear();messages=[];chat=null;latest=null;fullPending=false;structurePending=false;if(frame!==null)caf(frame);frame=null;
    if(fontHandler)document.fonts?.removeEventListener?.('loadingdone',fontHandler);fontHandler=null;
    for(const state of states.values())clearState(state);states.clear();style?.remove();style=null;
    if(rootOriginal===null)document.documentElement.removeAttribute('data-orange-live');else document.documentElement.setAttribute('data-orange-live',rootOriginal);
    if(theme?.isConnected)theme.disabled=themeDisabled;theme=null;
  }
  function start(config){
    if(!document.querySelector('#chat'))throw Error('酒馆聊天区域尚未就绪');
    const next=normalizeLiveConfig(config);stop();snapshot=next;hostModes=readHostModes();
    rootOriginal=document.documentElement.getAttribute('data-orange-live');theme=document.querySelector('#custom-style');themeDisabled=theme?.disabled||false;
    try{
      pageDropdowns.start();
      scrollbarVisibility.set(snapshot.hideScrollbars);
      if(theme)theme.disabled=true;document.documentElement.setAttribute('data-orange-live','');
      style=document.createElement('style');style.id='orange-theme-live-style';style.setAttribute(OWN,'');currentInterface=interfaceFont(document);style.textContent=styleText(snapshot,{},currentInterface);document.head.append(style);
      let layoutFamilies='{}';
      fontSession=createFontSession({document,onChange:()=>{if(!snapshot)return;const families=fontSession.families();style.textContent=styleText(snapshot,families,currentInterface);const next=JSON.stringify(Object.fromEntries(Object.entries(families).filter(([key])=>!key.startsWith('page-'))));if(next!==layoutFamilies){layoutFamilies=next;schedule();}}});fontSession.update(fontEntries(snapshot));stopInterfaceWatch=watchInterfaceFont(document,schedule,{fontEvents:false});
      if(ResizeObs)resizer=new ResizeObs(resized);
      const token=++session;const count=reconcile();imageDisplay.watch(document.querySelector('#chat'));
      if(Observer){observer=new Observer(changed);observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['mesid','is_user','is_system','data-orange-lab-fixture','class','src','data-duration','data-state','open','style','hidden']});}
      fontHandler=event=>{if(snapshot&&session===token){const families=fontSession.families(),pageFamilies=new Set(Object.entries(families).filter(([key])=>key.startsWith('page-')).map(([,family])=>family)),layoutFonts=new Set(Object.entries(families).filter(([key])=>!key.startsWith('page-')).map(([,family])=>family));if(event?.fontfaces?.length&&event.fontfaces.every(face=>pageFamilies.has(face.family)&&!layoutFonts.has(face.family)))return;chrome.refreshInput();schedule();}};document.fonts?.addEventListener?.('loadingdone',fontHandler);document.fonts?.ready?.then?.(fontHandler,()=>{});
      return {messages:count};
    }catch(error){stop();throw error;}
  }
  // validated is for complete, normalized editor drafts only. External/imported
  // schemes use the default validation path; an inactive adapter always validates.
  function update(config,{validated=false}={}){
    if(!snapshot)return start(config);
    pendingConfig=validated?copyDraft(config):normalizeLiveConfig(config);requestFlush();return {messages:states.size};
  }
  return {start,update,stop,reconcile,fontStatus:key=>fontSession?.status(key)||'idle',retryFonts:()=>fontSession?.retry(),get active(){return !!snapshot;},get messageCount(){return states.size;}};
}

