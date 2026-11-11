import {PAGE_DRAWERS} from './canvas-pages.mjs';
import {DRAWERS} from './chrome.mjs';

/** Positions the original Tavern UI. Does not move, copy or replace host nodes/data. */
export function createLiveCanvas({document,onPage=()=>{}}={}){
 let active=false,style=null,originalRoot=null;
 const root=document.documentElement;
 // SillyTavern 1.18 consumes these synthesized events, not pointermove.
 // Capture prevents its document bubble handler without cancelling native scroll.
 const stopSwipe=e=>{if(active){e.stopImmediatePropagation();}};
 function start(){if(active)return;active=true;originalRoot=root.getAttribute('data-orange-editor');root.setAttribute('data-orange-editor','');
  document.addEventListener('swiped-left',stopSwipe,true);document.addEventListener('swiped-right',stopSwipe,true);
  style=document.createElement('style');style.id='orange-workbench-layout';document.head.append(style);
 }
 function layout({left=8,width=374,top=14,height=500,hidden=false}={}){
  if(!active)return;const toolbar=Math.min(48,Math.max(30,height/5)),bodyTop=top+toolbar,bodyHeight=Math.max(1,height-toolbar);
  const scope='html[data-orange-editor]';
  style.textContent=`
${scope}{--otl-canvas-left:${left}px;--otl-canvas-width:${width}px;--otl-canvas-top:${top}px;--otl-canvas-height:${height}px}
${scope} #sheld{position:fixed!important;left:${left}px!important;right:auto!important;top:${bodyTop}px!important;bottom:auto!important;width:${width}px!important;height:${bodyHeight}px!important;max-width:none!important;max-height:${bodyHeight}px!important;min-width:0!important;min-height:0!important;margin:0!important;transform:none!important;display:flex!important;flex-direction:column!important;z-index:10000!important}
${scope} #chat{min-height:0!important;flex:1 1 0!important;overflow-y:auto!important;overscroll-behavior:contain;touch-action:pan-y pinch-zoom}
${scope} #form_sheld{flex:0 0 auto;max-height:60%;overflow:auto}
${scope} #top-bar,${scope} #top-settings-holder{position:fixed!important;left:${left}px!important;right:auto!important;top:${top}px!important;width:${width}px!important;max-width:${width}px!important;min-width:0!important;height:${toolbar}px!important;margin:0!important;transform:none!important;z-index:10010!important}
${scope} #top-settings-holder{align-items:center!important;overflow:visible!important}
${scope} body :is(.drawer-content,#WorldInfo,#floatingPrompt){position:fixed!important;left:${left}px!important;right:auto!important;top:${bodyTop}px!important;bottom:auto!important;width:${width}px!important;min-width:0!important;max-width:${width}px!important;max-height:${bodyHeight}px!important;margin:0!important;transform:none!important;overscroll-behavior:contain;touch-action:pan-y pinch-zoom}
${scope} body :is(.drawer-content.openDrawer,.drawer-content.open,#WorldInfo.open,#floatingPrompt.open){overflow-y:auto!important}
${scope} #movingDivs{position:relative;z-index:10020}
${scope} :is(#chat,.drawer-content){scroll-padding-block:12px}
${hidden?`${scope} :is(#sheld,#top-bar,#top-settings-holder,.drawer-content,#WorldInfo,#floatingPrompt){visibility:hidden!important;pointer-events:none!important}`:''}`;
 }
 function showPage(page){
  if(!active||!Object.hasOwn(PAGE_DRAWERS,page))return false;const id=PAGE_DRAWERS[page];
  const drawer=id?document.getElementById(id):null;
  if(id&&!drawer)return false;
  for(const [otherId]of DRAWERS){const host=document.getElementById(otherId),content=host?.querySelector('.drawer-content');if(otherId!==id&&content?.classList.contains('openDrawer'))host.querySelector('.drawer-toggle')?.click();}
  if(drawer&&!drawer.querySelector('.drawer-content')?.classList.contains('openDrawer'))drawer.querySelector('.drawer-toggle')?.click();
  onPage(page);return true;
 }
 function stop(){if(!active)return;active=false;document.removeEventListener('swiped-left',stopSwipe,true);document.removeEventListener('swiped-right',stopSwipe,true);style?.remove();style=null;if(originalRoot===null)root.removeAttribute('data-orange-editor');else root.setAttribute('data-orange-editor',originalRoot);}
 return {start,layout,showPage,stop,get active(){return active;}};
}
