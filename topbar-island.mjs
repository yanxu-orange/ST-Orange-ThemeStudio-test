import { resolveGlass } from './glass-model.mjs';
import { iconUrl } from './icon-catalog.mjs';
import { installLauncherDrag } from './launcher-drag.mjs';

export const TOPBAR_ISLAND_POSITION_KEY = 'orange.theme-lab.topbar-island-position.v1';
const scope = 'html[data-orange-live][data-oc-island]';
const holderSelector = '#top-settings-holder';

const css = `
${scope} {
  --oc-island-inset: max(8px, env(safe-area-inset-top));
}
${scope} body #top-bar,
${scope} body ${holderSelector} {
  position: fixed !important;
  left: var(--oc-island-left) !important;
  right: auto !important;
  top: var(--oc-island-top) !important;
  width: var(--oc-island-width) !important;
  height: var(--oc-island-height) !important;
  max-width: var(--oc-island-area-width) !important;
  min-width: 0 !important;
  margin: 0 !important;
  z-index: 10010 !important;
  pointer-events: none;
}
${scope} body #top-bar {
  border-radius: var(--oc-island-radius) !important;
  visibility: hidden !important;
}
${scope}[data-oc-island-open] body #top-bar {
  visibility: var(--otl-canvas-island-visibility, visible) !important;
}
${scope} body ${holderSelector} {
  --topBarBlockSize: var(--oc-island-height);
  grid-template-columns: repeat(var(--oc-island-columns), minmax(0, var(--oc-island-slot))) !important;
  grid-auto-rows: var(--oc-island-slot);
  gap: var(--oc-island-gap) !important;
  padding: 0 !important;
  border: 0 !important;
  align-content: center !important;
  justify-content: center !important;
}
${scope} body ${holderSelector} > .drawer > .drawer-toggle {
  width: 100% !important;
  min-width: 0 !important;
  height: var(--oc-island-slot) !important;
  visibility: hidden !important;
}
${scope}[data-oc-island-open] body ${holderSelector} > .drawer > .drawer-toggle {
  visibility: var(--otl-canvas-island-visibility, visible) !important;
  pointer-events: auto;
}
${scope} body ${holderSelector} .drawer-content {
  pointer-events: auto;
}
${scope}:not([data-orange-editor]) body #sheld {
  top: 0 !important;
  height: calc(100dvh - 1px) !important;
  max-height: calc(100dvh - 1px) !important;
}
${scope}:not([data-orange-editor]) body #chat {
  max-height: none;
}
${scope} body:not(.movingUI) :is(${holderSelector} > .drawer > .drawer-content,#WorldInfo,#floatingPrompt) {
  position: fixed !important;
  width: min(var(--sheldWidth, 550px), var(--oc-island-area-width)) !important;
  max-width: var(--oc-island-area-width) !important;
  min-width: 0 !important;
  min-height: 0 !important;
  left: clamp(var(--oc-island-area-left), var(--oc-island-left), calc(var(--oc-island-area-right) - min(var(--sheldWidth, 550px), var(--oc-island-area-width)))) !important;
  right: auto !important;
  top: var(--oc-island-drawer-top) !important;
  bottom: var(--oc-island-drawer-bottom) !important;
  max-height: var(--oc-island-drawer-height) !important;
  margin: 0 !important;
  transform: var(--oc-island-drawer-transform) !important;
}
${scope}[data-orange-editor] body :is(${holderSelector} > .drawer > .drawer-content,#WorldInfo,#floatingPrompt) {
  left: var(--oc-island-area-left) !important;
  width: var(--oc-island-area-width) !important;
}
@media (max-width: 1000px) {
  ${scope} body:not(.movingUI) :is(${holderSelector} > .drawer > .drawer-content,#WorldInfo,#floatingPrompt) {
    left: var(--oc-island-area-left) !important;
    width: var(--oc-island-area-width) !important;
  }
}
${scope} button[data-topbar-island-toggle] {
  --launcher-safe-top: env(safe-area-inset-top);
  --launcher-safe-right: env(safe-area-inset-right);
  --launcher-safe-bottom: env(safe-area-inset-bottom);
  --launcher-safe-left: env(safe-area-inset-left);
  position: fixed;
  z-index: 10015;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  box-sizing: border-box;
  border: 1px solid currentColor;
  border-radius: 50%;
  box-shadow: 0 3px 12px #1f302840;
  padding: 0;
  font: 600 17px / 1 system-ui, sans-serif;
  cursor: pointer;
  touch-action: none;
  user-select: none;
  visibility: var(--otl-canvas-island-visibility, visible);
}
${scope} button[data-topbar-island-toggle]:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
${scope} button[data-topbar-island-toggle][data-dragging] {
  cursor: grabbing;
}
${scope} button[data-topbar-island-toggle] img {
  width: 22px;
  height: 22px;
  object-fit: contain;
  pointer-events: none;
}
`;

function dragDefault(position) {
  return { side:position.endsWith('left')?'left':'right', y:position.startsWith('bottom')?1:0 };
}

function foreground(color) {
  const channels = [1,3,5].map(offset=>parseInt(color.slice(offset,offset+2),16));
  return channels[0]*.299+channels[1]*.587+channels[2]*.114>145?'#283a32':'#ffffff';
}

export function topbarIslandGeometry(width, topbar) {
  const gap = Math.min(topbar.gap, 8);
  const padding = Math.max(8, topbar.padY);
  const slot = Math.max(44,topbar.slot);
  const columns = Math.max(1,Math.min(9,Math.floor((width-2*padding+gap)/(slot+gap))));
  const rows = Math.ceil(9 / columns);
  return {
    columns, gap, slot, height:rows * slot + (rows-1)*gap + padding*2,
    width:columns * slot + (columns-1)*gap + 2*padding, radius:rows===1?'999px':'26px',
  };
}

const clamp=(value,min,max)=>Math.min(Math.max(value,min),Math.max(min,max));
/** Menu and drawer share the safe visible area, never their own rendered width. */
export function topbarIslandPlacement(anchor,topbar) {
  const a=anchor.area,gap=8,leftRoom=anchor.left-a.left-gap,rightRoom=a.right-anchor.left-anchor.width-gap;
  const horizontal=Math.max(leftRoom,rightRoom)>=44+Math.max(8,topbar.padY)*2;
  const geometry=topbarIslandGeometry(horizontal?Math.max(leftRoom,rightRoom):a.right-a.left,topbar);
  const side=leftRoom>=rightRoom?'left':'right';
  let left=horizontal?(side==='left'?anchor.left-gap-geometry.width:anchor.left+anchor.width+gap):anchor.left+(anchor.width-geometry.width)/2;
  let top=horizontal?anchor.top+(anchor.height-geometry.height)/2:(a.bottom-anchor.top-anchor.height>=anchor.top-a.top?anchor.top+anchor.height+gap:anchor.top-gap-geometry.height);
  left=clamp(left,a.left,a.right-geometry.width);top=clamp(top,a.top,a.bottom-geometry.height);
  const below=a.bottom-top-geometry.height-gap,above=top-gap-a.top,drawerBelow=below>=above;
  return {...geometry,left,top,area:a,drawerBelow,drawerEdge:drawerBelow?top+geometry.height+gap:top-gap,drawerHeight:Math.max(1,drawerBelow?below:above)};
}

export function createTopbarIsland(document) {
  const root = document.documentElement;
  const win = document.defaultView;
  let style,button,mark,drag,current,opened=false,icon='',anchor;
  const variables=new Set();
  function variable(key,value){variables.add(key);if(root.style.getPropertyValue('--oc-island-'+key)!==value)root.style.setProperty('--oc-island-'+key,value);}
  function positionPanel(next=anchor){
    if(!current||!next)return null;anchor=next;
    const geometry=topbarIslandPlacement(next,current);
    for(const key of ['columns','gap','slot','height','width','radius','left','top'])variable(key,key==='columns'||key==='radius'?String(geometry[key]):geometry[key]+'px');
    const a=geometry.area;
    for(const [key,value]of Object.entries({'area-left':a.left,'area-right':a.right,'area-width':a.right-a.left,'drawer-height':geometry.drawerHeight}))variable(key,value+'px');
    // The host's transformed zero-height html is a fixed containing block: bottom
    // cannot be viewport-relative here. Translate only the drawer's own height.
    variable('drawer-top',geometry.drawerEdge+'px');
    variable('drawer-bottom','auto');
    variable('drawer-transform',geometry.drawerBelow?'none':'translateY(-100%)');
    return geometry;
  }

  function show(open) {
    opened=open;
    root.toggleAttribute('data-oc-island-open',open);
    const label=open?'收起酒馆顶栏':'展开酒馆顶栏';
    button.title=label;
    button.setAttribute('aria-label',label);
    button.setAttribute('aria-expanded',String(open));
    const source=!open && icon ? iconUrl(icon) : '';
    if(source){
      const image=document.createElement('img');
      image.src=source;
      image.alt='';
      image.addEventListener('error',()=>{if(image.parentNode===mark)mark.textContent='•••';},{once:true});
      mark.replaceChildren(image);
    }else mark.textContent=open?'×':'•••';
    if(!open && document.activeElement?.closest(holderSelector+' .drawer-toggle'))button.focus({preventScroll:true});
  }
  const onClick=event=>{event.stopPropagation();show(!opened);};
  const stopBubble=event=>event.stopPropagation();
  const onKey=event=>{if(event.key==='Escape'&&opened&&!document.querySelector('dialog[open]'))show(false);};
  function mount(initial) {
    style=document.createElement('style');
    style.setAttribute('data-oc-owned','');
    style.textContent=css;
    document.head.append(style);
    button=document.createElement('button');
    button.type='button';
    button.setAttribute('data-oc-owned','');
    button.setAttribute('data-topbar-island-toggle','');
    button.setAttribute('aria-controls','top-settings-holder');
    mark=document.createElement('span');
    mark.setAttribute('aria-hidden','true');
    button.append(mark);
    document.body.append(button);
    root.setAttribute('data-oc-island','');
    drag=installLauncherDrag({
      launcher:button,key:TOPBAR_ISLAND_POSITION_KEY,defaultPosition:dragDefault(initial.position),
      region:()=>root.hasAttribute('data-orange-editor')?document.querySelector('#sheld')?.getBoundingClientRect():null,
      onPosition:positionPanel,
    });
    button.addEventListener('click',onClick);
    button.addEventListener('mousedown',stopBubble);
    button.addEventListener('touchstart',stopBubble);
    document.addEventListener('keydown',onKey);
    show(false);
  }
  function sync() {
    if(!current||!drag)return null;
    drag.sync();
    return positionPanel();
  }
  function update(config) {
    const topbar=config.chromeStyle.topbar;
    if(!topbar.enabled || topbar.layout!=='island' || !document.querySelector(holderSelector)){stop();return;}
    const settings=topbar.island;
    const wasIcon=icon;
    const previousPosition=current?.island.position;
    icon=settings.icon;
    current=topbar;
    if(!button)mount(settings);
    else if(wasIcon!==icon&&!opened)show(false);
    if(previousPosition!==settings.position)drag.setDefault(dragDefault(settings.position));
    const glass=resolveGlass(config,'topbar'), material=glass&&glass.mode!=='none'?glass:null;
    const color=settings.colorMode==='custom'?settings.color:(material?.color??topbar.color);
    const opacity=settings.colorMode==='custom'?1:(material?.opacity??topbar.alpha);
    button.style.backgroundColor=color+Math.round(opacity*255).toString(16).padStart(2,'0');
    button.style.color=foreground(color);
    return sync();
  }
  function stop() {
    if(!button)return;
    drag.destroy();
    document.removeEventListener('keydown',onKey);
    button.remove();
    style.remove();
    button=style=mark=drag=current=anchor=null;
    icon='';
    root.removeAttribute('data-oc-island');
    root.removeAttribute('data-oc-island-open');
    for(const key of variables)root.style.removeProperty('--oc-island-'+key);variables.clear();
  }
  return {update,sync,stop,resetPosition:()=>drag?.reset()};
}
