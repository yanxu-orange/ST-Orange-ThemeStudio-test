import {styleIconElement} from './icon-style.mjs';
import {regionZ,imageKey} from './region-layers.mjs';
import {layerSizeStyle} from './shape-assets.mjs';
import {DRAWERS,INPUT_ICONS,LIVE_CHROME_SELECTORS,chromeRules,chromeSourceUrl,chromeTopMetrics} from './chrome.mjs';
import {interfaceFont} from './reasoning.mjs';
/** Owns only added pictures, private markers and a stylesheet. Never moves host controls or snapshots drafts. */
export function createChromeAdapter({document,resolveArtwork,fitInput,MutationObserver:Observe,ResizeObserver:Resize}={}){
 const owned=new Set(),attrs=new Map(),variables=new Map(),failed=new Map();let style=null,observer=null,stateObserver=null,config=null,families={},epoch=0,lastFit='',pending=false,resizer=null,observed=new Set(),lastWidth=0;
 const make=(tag,cls,parent)=>{const n=document.createElement(tag);n.className=cls;n.setAttribute('data-oc-owned','');owned.add(n);parent.append(n);return n;};
 function mark(node,key,value){let map=attrs.get(node);if(!map){map=new Map();attrs.set(node,map);}if(!map.has(key))map.set(key,{old:node.getAttribute(key),last:null});const r=map.get(key);r.last=value;if(value===null)node.removeAttribute(key);else if(node.getAttribute(key)!==value)node.setAttribute(key,value);}
 function restore(node,map){for(const [key,r]of map)if(node.getAttribute(key)===r.last){if(r.old===null)node.removeAttribute(key);else node.setAttribute(key,r.old);}}
 function fit(){if(typeof fitInput!=='function')return;try{const result=fitInput();result?.catch?.(error=>console.warn('[主题输入增高]',error.message));}catch(error){console.warn('[主题输入增高]',error.message);}}
 function clearZone(zone){
  for(const node of failed.keys())if(node.closest?.(zone==='topbar'?'#top-settings-holder':'#send_form'))failed.delete(node);
  for(const [node,map]of attrs)if(map.zone===zone){restore(node,map);attrs.delete(node);failed.delete(node);}
  for(const node of [...owned])if(node.dataset.ocZone===zone){node.remove();owned.delete(node);}
  if(zone==='topbar'){for(const [node,map]of variables){for(const [k,r]of map)if(node.style.getPropertyValue(k)===r.last){if(r.old)node.style.setProperty(k,r.old,r.priority);else node.style.removeProperty(k);}if(map.originalStyle===null&&!node.style.cssText.trim())node.removeAttribute('style');variables.delete(node);}}
 }
 function variable(node,key,value){let map=variables.get(node);if(!map){map=new Map();map.originalStyle=node.getAttribute('style');variables.set(node,map);}if(!map.has(key))map.set(key,{old:node.style.getPropertyValue(key),priority:typeof node.style.getPropertyPriority==='function'?node.style.getPropertyPriority(key):'',last:null});map.get(key).last=value;if(node.style.getPropertyValue(key)!==value)node.style.setProperty(key,value);}
 function icon(node,source,size,zone){
  if(!node)return;const src=chromeSourceUrl(source);let image=[...owned].find(n=>n.className==='otl-chrome-icon'&&n.parentNode===node);
  if(image&&image.querySelector('img')?.getAttribute('src')!==src){image.remove();owned.delete(image);image=null;}
  if(!src||failed.get(node)===src){if(!src)failed.delete(node);if(image){image.remove();owned.delete(image);}if(attrs.has(node)){restore(node,attrs.get(node));attrs.delete(node);}return;}
  if(!image){image=make('span','otl-chrome-icon',node);image.dataset.ocZone=zone;const picture=document.createElement('img');image.append(picture);const token=epoch,current=image;picture.onerror=()=>{if(config&&epoch===token&&current.isConnected&&current.parentNode===node&&picture.getAttribute('src')===src){failed.set(node,src);current.remove();owned.delete(current);if(attrs.has(node)){restore(node,attrs.get(node));attrs.delete(node);}}};picture.src=src;}
  styleIconElement(image,image.querySelector('img'),src,source.mode==='icon'?source:{},size);mark(node,'data-oc-image','true');attrs.get(node).zone=zone;
 }
 function artwork(){
  const form=document.querySelector('#send_form');if(!form||!config.chromeStyle.input.enabled)return;
  const layers=config.layers.filter(l=>l.anchor==='input'&&l.visible).map(l=>[l,resolveArtwork?.(l)]).filter(([,src])=>src);let root=[...owned].find(n=>n.className==='otl-input-art'&&n.parentNode===form);
  if(!layers.length){if(root){for(const n of [...owned])if(root===n||root.contains(n))owned.delete(n);root.remove();}return;}
  if(!root){root=make('div','otl-input-art',form);root.setAttribute('aria-hidden','true');root.dataset.ocZone='input';}
  const existing=new Map([...root.children].map(n=>[n.dataset.layerId,n]));
  for(const [l,src]of layers){let image=existing.get(l.id);if(!image){image=make('img','',root);image.dataset.layerId=l.id;image.dataset.ocZone='input';image.alt='';}existing.delete(l.id);if(image.getAttribute('src')!==src)image.src=src;Object.assign(image.style,{...layerSizeStyle(l),left:'auto',right:'auto',top:'auto',bottom:'auto',[l.side]:l.x+(l.offsetUnit==='percent'?'%':'px'),[l.vertical]:l.y+(l.offsetUnit==='percent'?'%':'px'),opacity:l.opacity,transform:`rotate(${l.rotation}deg)`,zIndex:regionZ(config,'input',imageKey(l.id))});root.append(image);}
  for(const image of existing.values()){image.remove();owned.delete(image);}
 }
 function emptyText(){
  const form=document.querySelector('#send_form'),area=document.querySelector('#send_textarea'),v=config.chromeStyle.input.emptyText;
  let overlay=[...owned].find(n=>n.className==='otl-input-empty-text');
  const ordinary=area&&[area.getAttribute('connected_text'),'Type a message, or /? for help','输入想发送的消息，或输入 /? 获取帮助'].filter(Boolean).includes(area.getAttribute('placeholder'));
  const available=config.chromeStyle.input.enabled&&v.enabled&&form&&area&&ordinary&&!form.classList.contains('no-connection')&&!document.querySelector('#form_sheld.isExecutingCommandsFromChatInput')&&!area.disabled&&!area.hasAttribute('readonly');
  const stop=document.querySelector('#mes_stop'),computed=stop&&document.defaultView?.getComputedStyle?.(stop);
  const generating=stop&&!stop.hidden&&!stop.classList.contains('displayNone')&&(computed?.display||stop.style.display)!=='none'&&(computed?.visibility||stop.style.visibility)!=='hidden';
  const content=available?(generating?v.generating||v.idle:v.idle):'';
  if(!content){if(overlay){overlay.remove();owned.delete(overlay);}if(form&&attrs.get(form)?.has('data-oc-empty-text')){restore(form,attrs.get(form));attrs.delete(form);}return;}
  if(overlay&&overlay.parentNode!==form){overlay.remove();owned.delete(overlay);overlay=null;}
  if(!overlay){overlay=make('span','otl-input-empty-text',form);overlay.dataset.ocZone='input';overlay.setAttribute('aria-hidden','true');}
  if(overlay.textContent!==content)overlay.textContent=content;
  const a=area.getBoundingClientRect(),f=form.getBoundingClientRect();
  Object.assign(overlay.style,{left:(a.left-f.left-(form.clientLeft||0))+'px',top:(a.top-f.top-(form.clientTop||0))+'px',width:a.width+'px',height:a.height+'px'});
  mark(form,'data-oc-empty-text','true');attrs.get(form).zone='input';
 }
 function render(){
  if(!config)return;
  for(const n of [...owned])if(!n.isConnected){owned.delete(n);n.remove();}for(const [n,map]of attrs)if(!n.isConnected){restore(n,map);attrs.delete(n);}
  if(!config.chromeStyle.topbar.enabled)clearZone('topbar');if(!config.chromeStyle.input.enabled)clearZone('input');
  const holder=document.querySelector('#top-settings-holder');let topSize=config.chromeStyle.topbar.iconSize;if(config.chromeStyle.topbar.enabled&&holder){const m=chromeTopMetrics(holder.clientWidth||holder.getBoundingClientRect().width||390,config.chromeStyle.topbar);topSize=m.icon;for(const [key,value]of Object.entries(m))variable(holder,'--oc-top-'+key,value+'px');}
  if(config.chromeStyle.topbar.enabled)for(const [id]of DRAWERS)icon(document.getElementById(id)?.querySelector(':scope > .drawer-toggle .drawer-icon'),config.chromeStyle.topbar.icons[id],topSize,'topbar');
  if(config.chromeStyle.input.enabled)for(const [id]of INPUT_ICONS)icon(document.getElementById(id),config.chromeStyle.input.icons[id],config.chromeStyle.input.iconSize,'input');
  artwork();emptyText();const form=document.querySelector('#send_form'),width=form?.getBoundingClientRect().width||0;if(config.chromeStyle.input.enabled&&width!==lastWidth){lastWidth=width;fit();}
  const ResizeObserver=Resize||document.defaultView?.ResizeObserver;if(!resizer&&ResizeObserver)resizer=new ResizeObserver(()=>render());if(resizer){const wanted=new Set([holder,form,document.querySelector('#send_textarea')].filter(Boolean));for(const n of observed)if(!wanted.has(n)){resizer.unobserve(n);observed.delete(n);}for(const n of wanted)if(!observed.has(n)){resizer.observe(n);observed.add(n);}}
 }
 function update(next,nextFamilies={}){
  config=next;families=nextFamilies;if(!style){style=make('style','',document.head);style.id='orange-theme-chrome-style';}const text=chromeRules(config,LIVE_CHROME_SELECTORS,families,interfaceFont(document));if(style.textContent!==text)style.textContent=text;
  render();const key=config.chromeStyle.input.enabled?JSON.stringify([config.chromeStyle.input,families['chrome-input'],interfaceFont(document),config.font]):'';if(key!==lastFit){const was=lastFit;lastFit=key;if(key||was)fit();}
  if(!observer){const Observer=Observe||document.defaultView?.MutationObserver;if(Observer){observer=new Observer(records=>{if(!config||pending)return;const relevant=records.some(r=>{if(r.target.closest?.('[data-oc-owned]'))return false;const changed=[...r.addedNodes,...r.removedNodes];if(changed.length&&changed.every(n=>n.nodeType===1&&n.hasAttribute('data-oc-owned')))return false;if(r.type==='attributes'&&r.attributeName==='data-oc-empty-text')return false;return r.target.closest?.('#top-settings-holder,#send_form,#form_sheld')||changed.some(n=>n.nodeType===1&&(n.id==='send_form'||n.id==='top-settings-holder'||n.querySelector?.('#send_form,#top-settings-holder')));});if(relevant){pending=true;const token=epoch;queueMicrotask(()=>{pending=false;if(config&&token===epoch)render();});}});observer.observe(document.body,{subtree:true,childList:true});stateObserver=new Observer(records=>{if(!config||pending||!records.some(r=>!r.target.closest?.('[data-oc-owned]')&&r.target.matches?.('#send_form,#send_textarea,#mes_stop,#form_sheld')))return;pending=true;const token=epoch;queueMicrotask(()=>{pending=false;if(config&&token===epoch)render();});});stateObserver.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','style','placeholder','connected_text','disabled','readonly','hidden']});}}
 }
 function stop(){const hadInput=config?.chromeStyle.input.enabled;config=null;epoch++;observer?.disconnect();observer=null;stateObserver?.disconnect();stateObserver=null;resizer?.disconnect();resizer=null;observed.clear();pending=false;clearZone('topbar');clearZone('input');failed.clear();for(const [node,map]of attrs)restore(node,map);attrs.clear();for(const node of owned)node.remove();owned.clear();style=null;lastFit='';if(hadInput)fit();}
 return {update,stop,render,refreshInput:()=>{if(config?.chromeStyle.input.enabled)fit();}};
}

// Evaluate visibility at the lazy bridge boundary, after synchronous editor transitions finish.
export function createInputFitBridge({document,load}={}){let loaded;return ()=>{loaded??=Promise.resolve().then(load);return loaded.then(fit=>{if(document.documentElement.hasAttribute('data-orange-lab'))return;if(typeof fit!=='function')throw Error('未找到1.18原生输入增高导出');fit();});};}

