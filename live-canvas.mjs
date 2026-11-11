import {PAGE_DRAWERS} from './canvas-pages.mjs';

/** Positions the original Tavern UI. Does not move, copy or replace host nodes/data. */
export function createLiveCanvas({document,onPage=()=>{}}={}){
 let active=false,style=null,originalRoot=null,observer=null,reportTimer=null,lastPage=null,preferred=null,pending=null,internalClick=false;
 const entries=Object.entries(PAGE_DRAWERS).filter(([,id])=>id);
 const hostFor=page=>document.getElementById(PAGE_DRAWERS[page]);
 function hidden(node){
  for(let el=node;el&&el!==document.body;el=el.parentElement){
   if(el.hidden||el.style?.display==='none'||document.defaultView?.getComputedStyle?.(el)?.display==='none')return true;
  }
  return false;
 }
 function open(page){const host=hostFor(page),content=host?.querySelector('.drawer-content');return !!content?.classList.contains('openDrawer')&&!hidden(content);}
 function actualPage(){
  const pages=entries.filter(([page])=>open(page)).map(([page])=>page);
  if(pages.includes(preferred))return preferred;
  if(pages.includes(lastPage))return lastPage;
  if(pages.length)return pages.at(-1);
  const welcome=document.querySelector('#chat .welcomePanel');
  return welcome&&!hidden(welcome)?'home':'chat';
 }
 function report(force=false){clearTimeout(reportTimer);reportTimer=null;if(!active)return;const page=actualPage();if(force||page!==lastPage){lastPage=page;onPage(page);}}
 function scheduleReport(){if(active&&reportTimer===null)reportTimer=setTimeout(report,20);}
 function cancelPending(){if(pending){clearTimeout(pending.timer);pending.resolve(false);pending=null;}}
 function nativeClick(event){
  const toggle=event.target?.closest?.('.drawer-toggle');if(!toggle)return;
  const entry=entries.find(([,id])=>document.getElementById(id)?.contains(toggle));if(!entry)return;
  preferred=entry[0];if(!internalClick)cancelPending();scheduleReport();
 }
 // Navigation changes the native drawer/welcome containers, not message text or
 // artwork styles. Streaming chat mutations must not trigger page/layout reads.
 function relevant(node){return node?.nodeType===1&&node.matches?.('.drawer,.drawer-content,.welcomePanel');}
 const root=document.documentElement;
 // SillyTavern 1.18 consumes these synthesized events, not pointermove.
 // Capture prevents its document bubble handler without cancelling native scroll.
 const stopSwipe=e=>{if(active){e.stopImmediatePropagation();}};
 function start(){if(active)return;active=true;originalRoot=root.getAttribute('data-orange-editor');root.setAttribute('data-orange-editor','');
  document.addEventListener('swiped-left',stopSwipe,true);document.addEventListener('swiped-right',stopSwipe,true);
  style=document.createElement('style');style.id='orange-workbench-layout';document.head.append(style);
  lastPage=null;preferred=null;
  document.addEventListener('click',nativeClick,true);
  const Observer=document.defaultView?.MutationObserver;
  if(Observer){observer=new Observer(records=>{if(records.some(r=>r.type==='attributes'&&relevant(r.target)||r.type==='childList'&&[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&(n.matches?.('#chat,.drawer,.drawer-content,.welcomePanel')||n.querySelector?.('.drawer,.drawer-content,.welcomePanel')))))scheduleReport();});observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','hidden']});}
  scheduleReport();
 }
 function layout({left=8,width=374,top=14,height=500,hidden=false,preserveTopbar=false}={}){
  if(!active)return;if(preserveTopbar)style.textContent='';const nativeTopbarBottom=preserveTopbar?Math.max(...['top-bar','top-settings-holder'].map(id=>document.getElementById(id)?.getBoundingClientRect?.().bottom||0)):0;
  const toolbar=preserveTopbar?Math.max(0,nativeTopbarBottom-top):Math.min(48,Math.max(30,height/5)),bodyTop=top+toolbar,bodyHeight=Math.max(1,height-toolbar);
  const scope='html[data-orange-editor]';
  style.textContent=`
${scope}{--otl-canvas-left:${left}px;--otl-canvas-width:${width}px;--otl-canvas-top:${top}px;--otl-canvas-height:${height}px}
${scope} #sheld{position:fixed!important;left:${left}px!important;right:auto!important;top:${bodyTop}px!important;bottom:auto!important;width:${width}px!important;height:${bodyHeight}px!important;max-width:none!important;max-height:${bodyHeight}px!important;min-width:0!important;min-height:0!important;margin:0!important;transform:none!important;display:flex!important;flex-direction:column!important;z-index:${preserveTopbar?30:10000}!important}
${scope} #chat{min-height:0!important;flex:1 1 0!important;overflow-y:auto!important;overscroll-behavior:contain;touch-action:pan-y pinch-zoom}
${scope} #form_sheld{flex:0 0 auto;max-height:60%;overflow:auto}
${preserveTopbar?'':`${scope} #top-bar,${scope} #top-settings-holder{position:fixed!important;left:${left}px!important;right:auto!important;top:${top}px!important;width:${width}px!important;max-width:${width}px!important;min-width:0!important;height:${toolbar}px!important;margin:0!important;transform:none!important;z-index:10010!important}
${scope} #top-settings-holder{align-items:center!important;overflow:visible!important}`}
${scope} body :is(.drawer-content,#WorldInfo,#floatingPrompt){position:fixed!important;left:${left}px!important;right:auto!important;top:${bodyTop}px!important;bottom:auto!important;width:${width}px!important;min-width:0!important;max-width:${width}px!important;max-height:${bodyHeight}px!important;margin:0!important;transform:none!important;overscroll-behavior:contain;touch-action:pan-y pinch-zoom}
${scope} body :is(.drawer-content.openDrawer,.drawer-content.open,#WorldInfo.open,#floatingPrompt.open){overflow-y:auto!important}
${scope} #movingDivs{position:relative;z-index:10020}
${scope} :is(#chat,.drawer-content){scroll-padding-block:12px}
${hidden?`${scope} :is(#sheld,#top-bar,#top-settings-holder,.drawer-content,#WorldInfo,#floatingPrompt){visibility:hidden!important;pointer-events:none!important}`:''}`;
 }
 // Acceptance is synchronous; callers changing editing targets should await navigateToPage.
 function showPage(page){
  if(!active||!Object.hasOwn(PAGE_DRAWERS,page))return false;
  const id=PAGE_DRAWERS[page],host=id?hostFor(page):null,toggle=host?.querySelector('.drawer-toggle');
  if(id&&(!host?.querySelector('.drawer-content')||!toggle||toggle.disabled||toggle.getAttribute('aria-disabled')==='true'||hidden(toggle)))return false;
  // Validate every close before mutating anything. Never simulate the home/chat reset button.
  const closing=entries.filter(([other])=>other!==page&&open(other));
  if(closing.some(([other])=>{const button=hostFor(other)?.querySelector('.drawer-toggle');return !button||button.disabled||button.getAttribute('aria-disabled')==='true'||hidden(button);}))return false;
  if(pending?.page===page)return true;
  cancelPending();preferred=page;
  internalClick=true;
  try{
   for(const [other] of closing)hostFor(other).querySelector('.drawer-toggle').click();
   if(toggle&&!open(page))toggle.click();
  }finally{internalClick=false;}
  preferred=page;scheduleReport();confirmNavigation(page);return true;
 }
 function confirmNavigation(page){
  let resolve;const promise=new Promise(done=>{resolve=done;});
  const request={page,promise,resolve,timer:null,deadline:Date.now()+1500};pending=request;
  const check=()=>{
   if(!active||pending!==request)return;
   const actual=actualPage();
   // "chat" only closes drawers: an existing welcome screen remains home.
   const reached=actual===page||(page==='chat'&&actual==='home');
   if(reached||Date.now()>=request.deadline){pending=null;report(!reached);resolve(reached);return;}
   request.timer=setTimeout(check,25);
  };
  request.timer=setTimeout(check,25);return promise;
 }
 function navigateToPage(page){
  if(!showPage(page))return Promise.resolve(false);
  return pending.promise;
 }
 function stop(){if(!active)return;active=false;cancelPending();observer?.disconnect();observer=null;clearTimeout(reportTimer);reportTimer=null;document.removeEventListener('click',nativeClick,true);document.removeEventListener('swiped-left',stopSwipe,true);document.removeEventListener('swiped-right',stopSwipe,true);style?.remove();style=null;if(originalRoot===null)root.removeAttribute('data-orange-editor');else root.setAttribute('data-orange-editor',originalRoot);}
 return {start,layout,showPage,navigateToPage,stop,get currentPage(){return actualPage();},get active(){return active;}};
}
