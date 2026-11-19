import {avatarCompositionEntries,reorderAvatarComposition} from './avatar-composition-order.mjs';

export const COMPOSITION_LIST_CSS=`
.avatar-composition-list{display:flex;flex-direction:column;gap:6px;margin:12px 0;min-width:0}
.avatar-composition-row{position:relative;display:flex;align-items:center;gap:4px;min-height:48px;border:1px solid var(--line);background:var(--paper);min-width:0}
.avatar-composition-row[data-selected=true]{border-color:var(--accent);background:#edf1e9}
.avatar-composition-row[data-dragging=true]{opacity:.45}
.avatar-composition-row[data-drop=before]::before,.avatar-composition-row[data-drop=after]::after{content:"";position:absolute;left:0;right:0;height:3px;background:var(--accent);z-index:1;pointer-events:none}
.avatar-composition-row[data-drop=before]::before{top:-5px}.avatar-composition-row[data-drop=after]::after{bottom:-5px}
.avatar-composition-handle{flex:none;width:44px;min-height:44px;padding:4px;border:0;background:transparent;cursor:grab;touch-action:none;font-size:21px}
.avatar-composition-handle:active{cursor:grabbing}
.avatar-composition-select{min-width:0;flex:1;border:0;background:transparent;text-align:left;padding:9px 6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.avatar-composition-select[aria-pressed=true]{background:transparent;color:inherit;border:0}
.avatar-composition-status{font-size:var(--wb-font-label,12px);color:var(--muted);padding-right:10px;flex:none;max-width:42%;text-align:right}
.avatar-composition-divider{justify-content:center;color:var(--muted);background:#f2f3ed;font-size:var(--wb-font-label,12px);min-height:36px}
.avatar-composition-list .avatar-composition-add{margin-top:3px;width:100%}
`;

/** List-only pointer listeners exist during a drag and are released on every exit. */
export function createAvatarCompositionList({make,config,scope,selected,valid,onSelect,onCommit,onAdd}){
 const list=make('div','avatar-composition-list');list.setAttribute('aria-label','头像组合素材顺序');
 const entries=avatarCompositionEntries(config,scope),front=entries.findIndex(e=>e.key==='avatar');
 const document=list.ownerDocument,rootDocument=document,rows=[];let drag=null;
 function clearMarks(){for(const row of rows){delete row.dataset.drop;delete row.dataset.dragging;}}
 function dispose(){const old=drag;drag=null;clearMarks();if(!old)return;for(const [type,handler]of old.listeners)rootDocument.removeEventListener(type,handler,true);try{if(old.handle.hasPointerCapture?.(old.id))old.handle.releasePointerCapture(old.id);}catch{}}
 function contextValid(){return list.isConnected&&valid();}
 function commit(key,index,focus){
  if(!contextValid())return;
  const order=reorderAvatarComposition(config,scope,key,index),before=config.regionOrder?.header;
  if(before&&order.length===before.length&&order.every((v,i)=>v===before[i]))return;
  const root=list.getRootNode();onCommit(key,order);
  if(focus)queueMicrotask(()=>[...root.querySelectorAll('[data-composition-handle]')].find(n=>n.dataset.compositionHandle===key.slice(6))?.focus?.());
 }
 function dropIndex(y,key){
  const candidates=rows.filter(row=>row.dataset.compositionKey!==key);
  const i=candidates.findIndex(row=>{const r=row.getBoundingClientRect();return y<r.top+r.height/2;});
  return i===-1?candidates.length:i;
 }
 function mark(index,key){clearMarks();rows.find(row=>row.dataset.compositionKey===key).dataset.dragging='true';const rest=rows.filter(row=>row.dataset.compositionKey!==key);if(index<rest.length)rest[index].dataset.drop='before';else rest.at(-1).dataset.drop='after';}
 for(const [index,entry]of entries.entries()){
  const row=make('div','avatar-composition-row'+(entry.layer?'':' avatar-composition-divider'));row.dataset.compositionKey=entry.key;rows.push(row);
  if(!entry.layer){row.textContent='角色头像';row.setAttribute('aria-label','角色头像前后分界');list.append(row);continue;}
  const layer=entry.layer;row.dataset.selected=String(selected===layer.id);
  const handle=make('button','avatar-composition-handle','⋮⋮');handle.type='button';handle.dataset.compositionHandle=layer.id;handle.setAttribute('aria-label','拖动'+layer.name+'排序');handle.setAttribute('aria-description','按方向键上移或下移');handle.title='拖动排序；方向键上移或下移';
  const select=make('button','avatar-composition-select',layer.name);select.type='button';select.dataset.compositionLayer=layer.id;select.setAttribute('aria-pressed',String(selected===layer.id));select.addEventListener('click',()=>{dispose();if(contextValid())onSelect(layer.id);});
  const label=[index<front?'头像前面':'头像后面',...(layer.scope==='both'?['AI与用户']:[]),...(layer.visible===false?['已隐藏']:[])];const status=make('span','avatar-composition-status',label.join(' · '));
  row.append(handle,select,status);list.append(row);
  handle.addEventListener('keydown',event=>{if(!['ArrowUp','ArrowDown'].includes(event.key)||!contextValid())return;event.preventDefault();dispose();const old=entries.findIndex(v=>v.key===entry.key),index=old+(event.key==='ArrowUp'?-1:1);if(index>=0&&index<entries.length)commit(entry.key,index,true);});
  handle.addEventListener('pointerdown',event=>{
   if(event.button!==undefined&&event.button!==0||!contextValid())return;
   event.preventDefault();dispose();const pointerId=event.pointerId,originX=event.clientX,originY=event.clientY;
   drag={handle,id:pointerId,key:entry.key,moved:false,index,inside:true,listeners:[]};
   const listen=(type,handler)=>{rootDocument.addEventListener(type,handler,true);drag.listeners.push([type,handler]);};
   const move=e=>{if(!drag||e.pointerId!==pointerId)return;if(!contextValid()){dispose();return;}const r=list.getBoundingClientRect();drag.inside=e.clientX>=r.left-16&&e.clientX<=r.right+16&&e.clientY>=r.top-20&&e.clientY<=r.bottom+20;if(Math.hypot(e.clientX-originX,e.clientY-originY)>=5)drag.moved=true;if(!drag.moved)return;e.preventDefault();if(!drag.inside){clearMarks();return;}drag.index=dropIndex(e.clientY,entry.key);mark(drag.index,entry.key);};
   const end=e=>{if(!drag||e.pointerId!==pointerId)return;if(drag.moved)move(e);if(!drag)return;const result={...drag};dispose();if(result.moved&&result.inside&&contextValid())commit(entry.key,result.index,false);};
   listen('pointermove',move);listen('pointerup',end);listen('pointercancel',e=>{if(e.pointerId===pointerId)dispose();});listen('lostpointercapture',e=>{if(e.pointerId===pointerId)dispose();});listen('keydown',e=>{if(e.key==='Escape'){e.preventDefault();dispose();}});listen('pointerdown',e=>{if(e.pointerId!==pointerId)dispose();});listen('click',e=>{if(!e.composedPath?.().includes(list))dispose();});
   try{handle.setPointerCapture?.(pointerId);}catch{}
  });
 }
 const add=make('button','avatar-composition-add','＋ 添加组合素材');add.type='button';add.id='add-avatar-material';add.addEventListener('click',()=>{dispose();if(contextValid())onAdd();});list.append(add);
 return{element:list,dispose};
}
