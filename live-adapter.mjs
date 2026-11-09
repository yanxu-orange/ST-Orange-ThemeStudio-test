import {createScrollbarVisibility,normalizeScrollbars} from './scrollbars.mjs';
import {normalizeAvatarFill,avatarFillRules} from './avatar-fill.mjs';
import {normalizeChromeConfig,chromeFontEntries} from './chrome.mjs';
import {createChromeAdapter} from './chrome-adapter.mjs';
import {normalizeTextScene,prepareScene,placeScene,sceneTextRules,sceneFrameRules} from './text-scene.mjs';
import {normalizeNativeConfig,nativeRules,renderNative,latestAI,nativeControlNodes} from './native.mjs';
import {normalizeFooterConfig,footerTextEntries,footerRules,renderFooter,measureFooter} from './footer.mjs';
import {normalizeReasoningConfig,reasoningFontEntries,reasoningRules,reasoningLabel,interfaceFont,watchInterfaceFont} from './reasoning.mjs';
import {bodyCardSettings,bodyCardRules} from './body-card.mjs';
import {normalizeCaptionConfig,captionKey,captionToken,textEntries,textTokens,textFallbacks} from './captions.mjs';
import {clone} from './layers.mjs';
import {collageMetrics} from './photos.mjs';
import {createFontSession} from './font-sources.mjs';
import {textSettings,captionWidthPixels,metadataPadding,customTextLayout,validateTextItems,freeText,sceneReserves,textItemRules} from './text-layout.mjs';

const OWN = 'data-otl-live-owned';
const FLAG = 'data-otl-live';
const q = '#chat > .mes[data-otl-live]';
const head = `${q} > .mes_block > .ch_name`;
const avatar = `${q} > .mesAvatarWrapper > .avatar`;
const meta = `${head} [data-otl-live-meta]`;
const captionHost = `${meta} > :is(.otl-live-caption,.otl-live-caption-slot)`;

function styleText(config,families={},interfaceFamily='sans-serif') {
  const items=textEntries(config),moving=freeText(items),tokens=textTokens(config);
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
${meta}{position:absolute!important;display:flex!important;flex-direction:column!important;align-items:flex-start!important;gap:4px!important;left:var(--ol-meta-left)!important;top:var(--ol-meta-top)!important;width:var(--ol-meta-width)!important;min-width:0!important;z-index:3}
${settings.timeFont==='auto'?'':`${meta} > .timestamp{font-family:${settings.timeFont}!important}`}
${custom?`${meta}{box-sizing:border-box!important;padding:var(--ol-text-top) var(--ol-text-inset) 0!important;align-items:${alignment}!important;text-align:${settings.textAlign}!important}
${q}[data-otl-live-time=beside] > .mes_block > .ch_name [data-otl-live-meta]{justify-content:${alignment}!important}`:''}
${meta} > .name_text{font-family:var(--ol-nameFont)!important;font-size:var(--ol-nameSize)!important;font-weight:400!important;line-height:1.4!important;color:var(--ol-nameColor)!important;overflow-wrap:anywhere;order:1}
${meta} > .timestamp{font-size:var(--ol-timeSize)!important;line-height:1.5!important;color:var(--ol-timeColor)!important;white-space:normal!important;order:2}
${meta} .otl-live-caption{line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere;order:0}
${q}[data-otl-live-time=beside] > .mes_block > .ch_name [data-otl-live-meta]{flex-direction:row!important;flex-wrap:wrap!important;align-items:baseline!important;gap:4px 9px!important}
${q}[data-otl-live-time=beside] > .mes_block > .ch_name [data-otl-live-meta] > :is(.otl-live-caption,.otl-live-caption-slot){flex-basis:100%}
${q} > .mesAvatarWrapper{position:absolute!important;left:24px!important;top:calc(24px + var(--ol-photo-top) + var(--ol-scene-top,0px))!important;width:var(--ol-photo-width)!important;height:auto!important;min-height:0!important;display:flex!important;flex-wrap:wrap!important;justify-content:center!important;align-content:flex-start!important;gap:3px 6px!important;margin:0!important;padding:0!important;z-index:2}
${avatar}{position:relative!important;display:block!important;box-sizing:border-box!important;width:var(--ol-photo-width)!important;height:var(--ol-photo-height)!important;max-width:none!important;min-width:0!important;flex:0 0 100%!important;margin:0!important;padding:0!important;border:0!important;outline:0!important;box-shadow:none!important;overflow:visible!important;transform:translate(var(--ol-photo-x),var(--ol-photo-y)) rotate(var(--ol-photo-rotation)) scale(var(--ol-photo-scale))!important;transform-origin:50% 100%;isolation:isolate}
${avatar} > img:not([${OWN}]){position:relative!important;display:block!important;box-sizing:border-box!important;width:100%!important;height:100%!important;max-width:none!important;object-fit:cover!important;border:var(--ol-photo-frame-width) solid var(--ol-photo-frame-color)!important;outline:var(--ol-photo-outline)!important;border-radius:var(--ol-photo-radius)!important;box-shadow:var(--ol-photo-shadow)!important;transform:rotate(var(--ol-photo-tilt))!important;z-index:2}
${q} > .mesAvatarWrapper > :is(.mesIDDisplay,.mes_timer,.tokenCounterDisplay){max-width:100%;font:11px/1.5 sans-serif;color:var(--ol-timeColor)}
${head} > :is(.mes_buttons,.mes_edit_buttons){position:absolute;right:0;top:0;z-index:6;max-width:100%}
${head} .mes_button{min-width:24px;min-height:24px}
${q} > .mes_block > .mes_text{position:relative!important;width:100%!important;margin:0!important;padding:0!important;font-family:var(--ol-font)!important;font-size:var(--ol-size)!important;line-height:var(--ol-line)!important;color:var(--ol-text)!important;overflow-wrap:anywhere}
${q} > .mes_block > .mes_text p{margin:0 0 12px!important;line-height:inherit!important;color:inherit!important}
${q} > .mes_block > .mes_text :is(img,video){max-width:100%;height:auto}
${q} > .mes_block > .mes_text pre{max-width:100%;overflow:auto}
${q} .mes_reasoning_summary{cursor:pointer;min-width:0}
${q} .mes_reasoning_header_block{min-width:0;flex:1}
${q} .mes_reasoning_actions{flex-shrink:0}
${q} .mes_reasoning_header_title[data-otl-live-reasoning]{font-size:0!important}
${reasoningRules(`${q} .mes_reasoning_header`,`${q} .mes_reasoning`,`${q} .otl-reasoning-bg`,config,families,interfaceFamily)}
${q} .otl-live-art{display:contents}
${q} .otl-live-art > img{position:absolute!important;max-width:none!important;min-width:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;outline:0!important;box-shadow:none!important;background:transparent!important;filter:none!important;object-fit:contain;pointer-events:none!important;transform-origin:center}
${q} > .mes_block > .mes_text textarea{max-width:100%;box-sizing:border-box}
${q} > :is(.swipe_left,.swipeRightBlock){z-index:5}
${q}[data-otl-live-avatar-hidden=true] > .mesAvatarWrapper > .avatar{display:none!important}
${q}[data-otl-live-avatar-hidden=true] > .mesAvatarWrapper{position:relative!important;left:auto!important;top:auto!important;width:100%!important;justify-content:flex-start!important}
body.documentstyle ${q} > .mesAvatarWrapper,body.documentstyle ${captionHost}{display:none!important}
body.no-blur ${q}{backdrop-filter:none!important}
${footerRules(q,config,families)}
${nativeRules(q,config)}
${bodyCardRules(`${q} > .mes_block > .mes_text`,q,config)}
${config.captions.map(cap=>{const node=`${meta} .otl-live-caption[data-caption-id="${cap.id}"]`;return `${node}{font-family:${cap.font}!important;font-size:${cap.size}px!important;color:${cap.color}!important;${cap.visible?'':'display:none!important;'}}`;}).join('\n')}
${textItemRules(items,selectors,families,tokens,fallbacks,{position:false})}
${sceneTextRules(config,selectors)}
${sceneFrameRules(q,head)}
${meta}{position:static!important;width:auto!important;padding:0!important;z-index:auto!important;transform:none!important}
${meta} > .otl-live-caption-slot{position:static!important;display:contents!important}
${q} > .mesAvatarWrapper{top:calc(24px + var(--ol-photo-top) + var(--sc-reserve-top,0px))!important}
${q} .otl-live-art.otl-scene-art{display:block!important}
${avatarFillRules(q,config)}

`;
}

/** Only owns private markers, CSS variables and injected nodes. Native nodes are never moved. */
export function createLiveAdapter({document,resolveArtwork,requestFrame,cancelFrame,MutationObserver:Observe,ResizeObserver:Resize,fitInput}={}) {
  const chrome=createChromeAdapter({document,resolveArtwork,fitInput,MutationObserver:Observe,ResizeObserver:Resize});
  const win=document.defaultView;
  const raf=requestFrame||win?.requestAnimationFrame?.bind(win)||(fn=>setTimeout(fn,0));
  const caf=cancelFrame||win?.cancelAnimationFrame?.bind(win)||clearTimeout;
  const Observer=Observe||win?.MutationObserver;
  const ResizeObs=Resize||win?.ResizeObserver;
  const scrollbarVisibility=createScrollbarVisibility({document});
  let snapshot=null,style=null,observer=null,resizer=null,frame=null,theme=null,themeDisabled=false,rootOriginal=null,session=0,fontHandler=null,fontSession=null,stopInterfaceWatch=null,currentInterface='sans-serif';
  const states=new Map();
  const observedSizes=new Set();
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
    for(const node of state.nodes)node.remove();
    for(const r of state.attributes)if(r.node.getAttribute(r.key)===r.last){if(r.old===null)r.node.removeAttribute(r.key);else r.node.setAttribute(r.key,r.old);}
    for(const r of state.variables)if(r.node.style.getPropertyValue(r.key)===r.last){if(r.old)r.node.style.setProperty(r.key,r.old,r.priority);else r.node.style.removeProperty(r.key);}
    for(const [node,existed]of state.styleOrigins)if(!existed&&!node.getAttribute('style'))node.removeAttribute('style');
  }
  function releaseDetached(state,msg){
    const attached=r=>r.node===msg||msg.contains(r.node);
    for(const r of state.attributes)if(!attached(r)&&r.node.getAttribute(r.key)===r.last){if(r.old===null)r.node.removeAttribute(r.key);else r.node.setAttribute(r.key,r.old);}
    state.attributes=state.attributes.filter(attached);
    state.variables=state.variables.filter(attached);
    for(const node of state.styleOrigins.keys())if(node!==msg&&!msg.contains(node))state.styleOrigins.delete(node);
    for(const node of [...state.nodes])if(!msg.contains(node)){node.remove();state.nodes.delete(node);}
  }
  function artContainer(state,parent,role){
    let node=[...state.nodes].find(n=>n.parentNode===parent&&n.getAttribute('data-otl-live-role')===role);
    if(!node){node=owned(state,'div','otl-live-art',parent);node.setAttribute('data-otl-live-role',role);}
    return node;
  }
  function renderMessage(msg,isLatest=false){
    const block=msg.querySelector(':scope > .mes_block'),header=block?.querySelector(':scope > .ch_name'),photo=msg.querySelector(':scope > .mesAvatarWrapper > .avatar'),nativeImage=photo?.querySelector(':scope > img:not([data-otl-live-owned])'),name=header?.querySelector('.name_text');
    if(!header||!photo||!nativeImage||!name)return false;
    let state=states.get(msg);if(!state){const knownHidden=document.body.classList.contains('hideChatAvatars')||document.body.classList.contains('documentstyle');const getStyle=win?.getComputedStyle;const nativeHidden=!knownHidden&&typeof getStyle==='function'&&(getStyle.call(win,photo).display==='none'||getStyle.call(win,photo.parentElement).display==='none');state={nodes:new Set(),attributes:[],variables:[],styleOrigins:new Map(),nativeHidden};states.set(msg,state);}
    releaseDetached(state,msg);
    const c=snapshot,settings=textSettings(c),items=textEntries(c),tokens=textTokens(c),moving=freeText(items),user=msg.getAttribute('is_user')==='true',p=c.photos[user?'user':'ai'],names=name.parentElement;
    if(state.meta&&state.meta!==names){const hidden=state.nativeHidden;clearState(state);state={nodes:new Set(),attributes:[],variables:[],styleOrigins:new Map(),nativeHidden:hidden};states.set(msg,state);}state.meta=names;
    attribute(state,msg,FLAG,'');attribute(state,msg,'data-otl-live-layout',c.layout);attribute(state,msg,'data-otl-live-time',c.timePosition);attribute(state,names,'data-otl-live-meta','');
    const captions=[];
    for(const cap of c.captions){
      let parent=names;
      if(cap.width!=='auto'){let slot=[...state.nodes].find(n=>n.className==='otl-live-caption-slot'&&n.dataset.captionId===cap.id&&n.parentNode===names);if(!slot){slot=owned(state,'div','otl-live-caption-slot',names);slot.dataset.captionId=cap.id;}parent=slot;}
      let node=[...state.nodes].find(n=>n.className==='otl-live-caption'&&n.dataset.captionId===cap.id&&n.parentNode===parent);if(!node){node=owned(state,'div','otl-live-caption',parent);node.dataset.captionId=cap.id;}
      if(node.textContent!==cap.content)node.textContent=cap.content;if(cap.visible)captions.push(node);
    }
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
    const scene=prepareScene(msg,header,c,sceneNodes,(node,key,value)=>variable(state,node,key,value),photoHidden);
    const {photoWidth,photoHeight,photoTop}=scene;
    for(const [key,value]of Object.entries({'header-height':scene.height+'px','photo-top':photoTop+'px','photo-width':photoWidth+'px','photo-height':photoHeight+'px','photo-x':(p.enabled?p.x:0)+'px','photo-y':(p.enabled?-p.y:0)+'px','photo-rotation':(p.enabled?p.rotation:0)+'deg','photo-scale':p.enabled?p.scale:1,'photo-frame-width':(p.enabled?p.frameWidth:0)+'px','photo-frame-color':p.frameColor,'photo-outline':p.enabled?'1px solid '+p.outlineColor:'none','photo-radius':p.enabled?'1px':c.avatarRadius+'px','photo-shadow':p.enabled&&p.shadow?'1px 2px 3px #6c7b962b':'none','photo-tilt':(p.enabled?p.photoRotation:0)+'deg'}))variable(state,msg,'--ol-'+key,value);
    const destinations={header,avatar:photo,message:msg,'reasoning-entry':reasonEntry,'reasoning-body':hasReason?reasonBody:null};
    for(const anchor of Object.keys(destinations)){
      if(!destinations[anchor])continue;const container=artContainer(state,destinations[anchor],anchor);if(anchor==='header')container.classList.add('otl-scene-art');if(anchor.startsWith('reasoning-'))container.setAttribute('data-otl-reason-owned','');
      const layers=c.layers.filter(l=>l.visible&&l.anchor===anchor&&!(photoHidden&&anchor==='avatar')&&(l.scope==='both'||l.scope===(user?'user':'ai')));
      const existing=new Map([...container.children].map(e=>[e.getAttribute('data-layer-id'),e]));
      for(const layer of layers){
        const src=resolveArtwork(layer);if(!src)continue;
        let image=existing.get(layer.id);if(!image){image=owned(state,'img','',container);image.setAttribute('data-layer-id',layer.id);if(anchor.startsWith('reasoning-'))image.setAttribute('data-otl-reason-owned','');image.alt='';image.setAttribute('aria-hidden','true');}
        existing.delete(layer.id);if(image.getAttribute('src')!==src)image.setAttribute('src',src);
        Object.assign(image.style,{width:layer.width+(layer.widthUnit==='percent'?'%':'px'),height:layer.heightPercent?layer.heightPercent+'%':'auto',objectPosition:layer.side+' '+layer.vertical,left:'auto',right:'auto',top:'auto',bottom:'auto',[layer.side]:layer.x+(layer.offsetUnit==='percent'?'%':'px'),[layer.vertical]:layer.y+(layer.offsetUnit==='percent'?'%':'px'),opacity:layer.opacity,transform:`rotate(${layer.rotation}deg)`,zIndex:layer.z});
      }
      for(const image of existing.values()){state.nodes.delete(image);image.remove();}
    }
    const footerSession=session;renderFooter(msg,c,{resolveArtwork,createNode:(tag,cls,parent)=>owned(state,tag,cls,parent),removeNode:node=>{for(const n of [...state.nodes])if(n===node||node.contains(n)){n.remove();state.nodes.delete(n);}node.remove();},onImageLoad:()=>{if(snapshot&&session===footerSession&&states.get(msg)===state&&msg.isConnected)schedule();}});measureFooter(msg,c);
    renderNative(msg,c,{createNode:(tag,cls,parent)=>owned(state,tag,cls,parent),removeNode:node=>{for(const n of [...state.nodes])if(n===node||node.contains(n)){n.remove();state.nodes.delete(n);}node.remove();},attribute:(node,key,value)=>attribute(state,node,key,value),variable:(node,key,value)=>variable(state,node,key,value),latest:isLatest});
    placeScene(msg,header,c,sceneNodes,scene,(node,key,value)=>variable(state,node,key,value));
    return true;
  }
  function reconcile(){
    if(!snapshot)return 0;
    const nextInterface=interfaceFont(document);if(currentInterface!==nextInterface){currentInterface=nextInterface;if(style)style.textContent=styleText(snapshot,fontSession?.families()||{},currentInterface);}
    chrome.update(snapshot,fontSession?.families()||{});
    const messages=[...document.querySelectorAll('#chat > .mes:not([data-orange-lab-fixture])')].filter(m=>m.getAttribute('is_system')!=='true'&&!m.classList.contains('smallSysMes'));
    const live=new Set(messages);
    for(const [msg,state]of states)if(!live.has(msg)){clearState(state);states.delete(msg);}
    const latest=latestAI(messages);let count=0;for(const msg of messages)if(renderMessage(msg,msg===latest))count++;
    if(resizer){const wanted=new Set([document.querySelector('#chat'),...[...states.keys()].flatMap(msg=>[msg.querySelector('[data-otl-live-meta]'),...msg.querySelectorAll('[data-otl-live-meta] .name_text,[data-otl-live-meta] .timestamp,[data-otl-live-meta] .otl-live-caption'),msg.querySelector('.mes_reasoning_header'),msg.querySelector('.mes_reasoning'),msg.querySelector('.otl-footer'),msg.querySelector('.otl-footer-flow'),msg.querySelector(':scope > .swipe_left'),msg.querySelector(':scope > .swipeRightBlock'),...nativeControlNodes(msg)])].filter(Boolean));for(const node of observedSizes)if(!wanted.has(node)){resizer.unobserve(node);observedSizes.delete(node);}for(const node of wanted)if(!observedSizes.has(node)){resizer.observe(node);observedSizes.add(node);}}
    return count;
  }
  function schedule(){if(!snapshot||frame!==null)return;frame=raf(()=>{frame=null;reconcile();});}
  function isOwned(node){return node?.nodeType===1&&(node.hasAttribute(OWN)||!!node.closest?.(`[${OWN}]`));}
  function relevant(records){return records.some(record=>{
    if(isOwned(record.target))return false;
    if(record.type==='childList'){
      const changed=[...record.addedNodes,...record.removedNodes];
      if(changed.length&&changed.every(isOwned))return false;
      if(record.target.closest?.('#chat'))return true;
      return changed.some(node=>node.nodeType===1&&(!!node.closest?.('#chat')||node.id==='chat'||!!node.querySelector?.('#chat')||node.matches?.('.mes')));
    }
    if(record.attributeName==='style'&&record.target!==document.body&&record.target!==document.documentElement)return record.target.matches?.('.mes_buttons,.mes_edit_buttons,.mesIDDisplay,.mes_timer,.tokenCounterDisplay,.swipe_left,.swipeRightBlock,.swipe_right,.swipes-counter,.extraMesButtonsHint,.extraMesButtons')||false;
    if((record.target===document.body||record.target===document.documentElement)&&['class','style'].includes(record.attributeName))return true;
    return !!(record.target.nodeType===1?record.target:record.target.parentElement)?.closest?.('#chat');
  });}
  function stop(){
    if(!snapshot)return;
    scrollbarVisibility.stop();snapshot=null;chrome.stop();session++;stopInterfaceWatch?.();stopInterfaceWatch=null;fontSession?.dispose();fontSession=null;observer?.disconnect();observer=null;resizer?.disconnect();resizer=null;observedSizes.clear();if(frame!==null)caf(frame);frame=null;
    if(fontHandler)document.fonts?.removeEventListener?.('loadingdone',fontHandler);fontHandler=null;
    for(const state of states.values())clearState(state);states.clear();style?.remove();style=null;
    if(rootOriginal===null)document.documentElement.removeAttribute('data-orange-live');else document.documentElement.setAttribute('data-orange-live',rootOriginal);
    if(theme?.isConnected)theme.disabled=themeDisabled;theme=null;
  }
  function start(config){
    if(!document.querySelector('#chat'))throw Error('酒馆聊天区域尚未就绪');
    const next=normalizeAvatarFill(normalizeChromeConfig(normalizeTextScene(normalizeNativeConfig(normalizeFooterConfig(normalizeReasoningConfig(normalizeCaptionConfig(clone(config))))))));Object.assign(next,bodyCardSettings(next));next.hideScrollbars=normalizeScrollbars(next.hideScrollbars);stop();snapshot=next;
    rootOriginal=document.documentElement.getAttribute('data-orange-live');theme=document.querySelector('#custom-style');themeDisabled=theme?.disabled||false;
    try{
      scrollbarVisibility.set(snapshot.hideScrollbars);
      if(theme)theme.disabled=true;document.documentElement.setAttribute('data-orange-live','');
      style=document.createElement('style');style.id='orange-theme-live-style';style.setAttribute(OWN,'');currentInterface=interfaceFont(document);style.textContent=styleText(snapshot,{},currentInterface);document.head.append(style);
      fontSession=createFontSession({document,onChange:()=>{if(!snapshot)return;style.textContent=styleText(snapshot,fontSession.families(),currentInterface);schedule();}});fontSession.update({...textEntries(snapshot),...reasoningFontEntries(snapshot),...footerTextEntries(snapshot),...chromeFontEntries(snapshot)});stopInterfaceWatch=watchInterfaceFont(document,schedule,{fontEvents:false});
      if(ResizeObs)resizer=new ResizeObs(schedule);
      const token=++session;const count=reconcile();
      if(Observer){observer=new Observer(records=>{if(relevant(records))schedule();});observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['is_user','is_system','class','src','data-duration','data-state','open','style','hidden']});}
      fontHandler=()=>{if(snapshot&&session===token){chrome.refreshInput();schedule();}};document.fonts?.addEventListener?.('loadingdone',fontHandler);document.fonts?.ready?.then?.(fontHandler,()=>{});
      return {messages:count};
    }catch(error){stop();throw error;}
  }
  return {start,stop,reconcile,get active(){return !!snapshot;},get messageCount(){return states.size;}};
}
