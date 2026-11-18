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
  top: calc(var(--otl-canvas-top, 0px) + var(--oc-island-inset)) !important;
  height: var(--oc-island-height) !important;
  pointer-events: none;
}
${scope}:not([data-orange-editor]) body ${holderSelector} {
  left: 0 !important;
  right: 0 !important;
  margin-inline: auto !important;
}
${scope} body #top-bar {
  left: calc(var(--otl-canvas-left, 0px) + (var(--otl-canvas-width, 100%) - var(--oc-island-width)) / 2) !important;
  right: auto !important;
  width: var(--oc-island-width) !important;
  min-width: 0 !important;
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
${scope}:not([data-orange-editor]) body:not(.movingUI) #WorldInfo {
  top: calc(var(--oc-island-inset) + var(--oc-island-height)) !important;
  max-height: calc(100dvh - var(--oc-island-inset) - var(--oc-island-height)) !important;
}
@media (max-width: 1000px) {
  ${scope}:not([data-orange-editor]) body ${holderSelector} > .drawer > .drawer-content {
    top: calc(var(--oc-island-inset) + var(--oc-island-height)) !important;
    max-height: calc(100dvh - var(--oc-island-inset) - var(--oc-island-height)) !important;
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
  const columns = width < 520 ? 5 : 9;
  const rows = Math.ceil(9 / columns);
  const gap = Math.min(topbar.gap, 8);
  const padding = Math.max(8, topbar.padY);
  const slot = Math.min(Math.max(44,topbar.slot), Math.max(1, (width-112-2*padding-(columns-1)*gap)/columns));
  return {
    columns, gap, slot, height:rows * slot + (rows-1)*gap + topbar.padY*2,
    width:columns * slot + (columns-1)*gap + 2*padding, radius:rows===1?'999px':'26px',
  };
}

export function createTopbarIsland(document) {
  const root = document.documentElement;
  const win = document.defaultView;
  let style,button,mark,drag,current,opened=false,icon='';

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
    });
    button.addEventListener('click',onClick);
    button.addEventListener('mousedown',stopBubble);
    button.addEventListener('touchstart',stopBubble);
    document.addEventListener('keydown',onKey);
    show(false);
  }
  function sync(holder=document.querySelector(holderSelector)) {
    if(!current || !holder)return null;
    const width=holder.clientWidth||holder.getBoundingClientRect().width||win?.innerWidth||390;
    const geometry=topbarIslandGeometry(width,current);
    for(const [key,value] of Object.entries(geometry)){
      const cssValue=key==='columns'||key==='radius'?String(value):value+'px';
      if(root.style.getPropertyValue('--oc-island-'+key)!==cssValue)root.style.setProperty('--oc-island-'+key,cssValue);
    }
    drag.sync();
    return geometry;
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
    button=style=mark=drag=current=null;
    icon='';
    root.removeAttribute('data-oc-island');
    root.removeAttribute('data-oc-island-open');
    for(const key of ['columns','gap','slot','height','width','radius'])root.style.removeProperty('--oc-island-'+key);
  }
  return {update,sync,stop,resetPosition:()=>drag?.reset()};
}
