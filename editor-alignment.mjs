import {ALIGNMENTS} from './region-alignment.mjs';
export function createAlignmentGuides(document){
 let root=null,signature='';
 const clear=()=>{root?.remove();root=null;signature='';};
 return {clear,show(region,keys){
  const next=JSON.stringify([region,keys]);if(next===signature)return;clear();if(!keys.length)return;signature=next;
  root=document.createElement('div');root.setAttribute('data-otl-live-owned','');root.setAttribute('data-otl-alignment-guides','');root.setAttribute('aria-hidden','true');
  root.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:2147483000;';
  for(const key of keys){const vertical=['left','centerX','right'].includes(key),line=document.createElement('i');
   const coordinate=key==='centerX'?(region.left+region.right)/2:key==='centerY'?(region.top+region.bottom)/2:region[key];
   line.style.cssText=vertical?`position:absolute;left:${coordinate}px;top:${region.top}px;width:1px;height:${region.bottom-region.top}px;background:#db6d91;`:`position:absolute;left:${region.left}px;top:${coordinate}px;width:${region.right-region.left}px;height:1px;background:#db6d91;`;
   root.append(line);
  }
  document.body.append(root);
 }};
}
export function renderAlignmentControls({container,document,drag,getSnap,setSnap}){
 container.querySelector('[data-alignment-controls]')?.remove();
 const item=drag.selectedItem(),markers=[...container.querySelectorAll('[data-position-control="y"]')].filter(node=>node._otlPositionTarget===item||node._otlPositionSource===item);if(!markers.length)return;
 const marker=markers.at(-1),root=document.createElement('div');root.setAttribute('data-alignment-controls','');
 root.style.cssText='display:flex;gap:5px;flex-wrap:wrap;margin:4px 0 12px;';
 const override=marker._otlPositionSource===item?{source:item,item:marker._otlPositionTarget,beforeCommit:marker._otlPositionBeforeApply}:null;
 const available=drag.alignmentAvailability(override);
 for(const [key,label]of ALIGNMENTS){const button=document.createElement('button');button.type='button';button.textContent=label;button.disabled=!available[key];button.dataset.align=key;button.addEventListener('click',()=>drag.align(key,override));root.append(button);}
 const label=document.createElement('label');label.style.cssText='display:flex;align-items:center;gap:4px;white-space:nowrap;';const check=document.createElement('input');check.type='checkbox';check.checked=getSnap();check.addEventListener('change',()=>setSnap(check.checked));label.append(check,document.createTextNode('拖动吸附'));root.append(label);
 const paired=marker.parentElement?.classList.contains('paired-fields')?marker.parentElement:marker;paired.after(root);return true;
}
