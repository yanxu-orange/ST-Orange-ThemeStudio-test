// SillyTavern 1.18: only these three drawers move their scroll surface to
// the header's host. Native IDs, display/visibility rules and DOM stay intact.
const marker='data-otl-header-scroll';
const rootSelector=`:is(#left-nav-panel,#right-nav-panel,#Backgrounds)[${marker}]`;
export const PAGE_HEADER_SCROLL_CSS=`
${rootSelector}{overflow-y:auto!important;overflow-x:hidden!important}
${rootSelector}>*{flex-shrink:0}
#left-nav-panel[data-otl-header-scroll]>.scrollableInner,
#right-nav-panel[data-otl-header-scroll]>.scrollableInner,
#right-nav-panel[data-otl-header-scroll] :is(#rm_characters_block,#rm_print_characters_block,#rm_ch_create_block,#form_create,#rm_group_chats_block),
#Backgrounds[data-otl-header-scroll] :is(#bg_tabs,#bg_global_tab,#bg_chat_tab){height:auto!important;max-height:none!important;overflow:visible!important;flex:0 0 auto!important}
#Backgrounds[data-otl-header-scroll]>#bg-scroll-top{transform:translateY(var(--otl-header-scroll-top,0px))!important}
`;
const flattened={
 'left-nav-panel':':scope > .scrollableInner',
 'right-nav-panel':':scope > .scrollableInner,#rm_characters_block,#rm_print_characters_block,#rm_ch_create_block,#form_create,#rm_group_chats_block',
 Backgrounds:'#bg_tabs,#bg_global_tab,#bg_chat_tab',
};
const targets={
 'left-nav-panel':[],
 'right-nav-panel':['rm_print_characters_block'],
 Backgrounds:['bg_global_tab','bg_chat_tab'],
};

export function createPageHeaderScrollAdapter({document}={}){
 const win=document.defaultView,active=new Map();
 function install(root){
  const ids=targets[root.id],background=root.id==='Backgrounds',patched=new Map();
  const rootScrollTop=root.scrollTop,previousMarker=root.getAttribute(marker),offsets=new Map();
  const buttonOffset='--otl-header-scroll-top',hadStyle=root.hasAttribute('style');
  const previousButtonOffset=background?root.style.getPropertyValue(buttonOffset):'';
  const previousButtonPriority=background&&typeof root.style.getPropertyPriority==='function'?root.style.getPropertyPriority(buttonOffset):'';
  function resetNative(element){
   if(offsets.has(element))return;
   offsets.set(element,{scrollTop:element.scrollTop,descriptor:Object.getOwnPropertyDescriptor(element,'scrollTop')});
   element.scrollTop=0;
  }
  for(const element of root.querySelectorAll(flattened[root.id]))resetNative(element);
  function restore(element){
   const saved=patched.get(element);
   for(const [key,descriptor]of saved.descriptors){
    if(descriptor)Object.defineProperty(element,key,descriptor);else delete element[key];
   }
   // Native scrollTop is normally inherited. Restore its actual scroll offset,
   // not a permanent own property. Existing own descriptors stay byte-for-byte.
   const descriptor=saved.descriptors.get('scrollTop');
   if(!descriptor||descriptor.set)element.scrollTop=offsets.get(element).scrollTop;
   offsets.delete(element);
   patched.delete(element);
  }
  function visible(element){return !element.getClientRects||element.getClientRects().length>0;}
  function listOrigin(element){
   return element.getBoundingClientRect().top-root.getBoundingClientRect().top+root.scrollTop-(root.clientTop||0);
  }
  function refresh(){
   const wanted=ids.map(id=>root.querySelector(`#${id}`)).filter(Boolean);
   for(const element of patched.keys())if(!wanted.includes(element))restore(element);
   for(const element of wanted){
    if(patched.has(element))continue;
    resetNative(element);
    const descriptors=new Map((background?['scrollTop','scrollTo']:['scrollTop']).map(key=>[key,key==='scrollTop'?offsets.get(element).descriptor:Object.getOwnPropertyDescriptor(element,key)]));
    // Do this before shadowing the native accessor: a flattened container must
    // not retain an invisible internal scrolling offset.
    element.scrollTop=0;
    Object.defineProperty(element,'scrollTop',{configurable:true,get(){
     if(background)return root.scrollTop;
     // Negative values deliberately represent the header/controls above the
     // list. Clamping here would break native refresh's read/write roundtrip.
     return visible(element)?root.scrollTop-listOrigin(element):0;
    },set(value){
     if(background)root.scrollTop=value;
     else if(visible(element))root.scrollTop=listOrigin(element)+Number(value);
    }});
    if(background)Object.defineProperty(element,'scrollTo',{configurable:true,writable:true,value(...args){root.scrollTo(...args);}});
    patched.set(element,{descriptors});
   }
  }
  function onScroll(event){
   if(event.target!==root)return;
   root.style.setProperty(buttonOffset,`${root.scrollTop}px`);
   // Native setupScrollToTop installs listeners on BOTH tabs for one button.
   // Both must observe the shared root, including the currently hidden tab.
   for(const element of patched.keys())element.dispatchEvent(new win.Event('scroll'));
  }
  refresh();
  root.setAttribute(marker,'');
  if(background){root.style.setProperty(buttonOffset,`${root.scrollTop}px`);root.addEventListener('scroll',onScroll,{passive:true});}
  const Observer=win?.MutationObserver;
  const observer=ids.length&&Observer?new Observer(records=>{
   const selector=ids.map(id=>`#${id}`).join(',');
   if([...patched.keys()].some(element=>!root.contains(element))||records.some(record=>[...record.addedNodes].some(node=>node.nodeType===1&&(node.matches(selector)||node.querySelector(selector)))))refresh();
  }):null;
  observer?.observe(root,{childList:true,subtree:true});
  return {refresh,stop(){
   observer?.disconnect();root.removeEventListener('scroll',onScroll);
   const visibleTab=background&&root.isConnected?[...patched.keys()].find(visible):null;
   if(background){
    if(previousButtonOffset)root.style.setProperty(buttonOffset,previousButtonOffset,previousButtonPriority);else root.style.removeProperty(buttonOffset);
    if(!hadStyle&&root.getAttribute('style')==='')root.removeAttribute('style');
   }
   if(previousMarker===null)root.removeAttribute(marker);else root.setAttribute(marker,previousMarker);
   for(const element of patched.keys())restore(element);
   for(const [element,saved]of offsets){
    if(saved.descriptor)Object.defineProperty(element,'scrollTop',saved.descriptor);
    if(!saved.descriptor||saved.descriptor.set)element.scrollTop=saved.scrollTop;
   }
   offsets.clear();root.scrollTop=rootScrollTop;
   // Reconcile the shared button from the restored, visible native tab only.
   visibleTab?.dispatchEvent(new win.Event('scroll'));
  }};
 }
 return {
  sync(mountedHosts){
   const wanted=new Set([...mountedHosts].filter(root=>Object.hasOwn(targets,root.id)&&root.isConnected&&[...root.children].some(node=>node.hasAttribute('data-otl-page-header'))));
   for(const [root,record]of active)if(!wanted.has(root)){record.stop();active.delete(root);}
   for(const root of wanted){if(active.has(root))active.get(root).refresh();else active.set(root,install(root));}
  },
  stop(){for(const record of active.values())record.stop();active.clear();},
 };
}
