// A local UI preference only. Launcher position is never included in theme data.
export const LAUNCHER_POSITION_KEY='orange.theme-lab.launcher-position.v1';
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
export function installLauncherDrag({launcher,storage,key=LAUNCHER_POSITION_KEY}={}){
 const doc=launcher.ownerDocument,win=doc.defaultView;
 if(storage===undefined){try{storage=win?.localStorage||globalThis.localStorage;}catch{storage=null;}}
 let position={side:'right',y:1},gesture=null,suppressUntil=0;
 try{const saved=JSON.parse(storage?.getItem(key)||'null');if(saved&&['left','right'].includes(saved.side)&&Number.isFinite(saved.y))position={side:saved.side,y:clamp(saved.y,0,1)};}catch{}
 function bounds(){
  const vv=win?.visualViewport,rect=launcher.getBoundingClientRect(),width=rect.width||52,height=rect.height||44;
  const x=Math.max(0,vv?.offsetLeft||0),y=Math.max(0,vv?.offsetTop||0),vw=vv?.width||win?.innerWidth||1200,vh=vv?.height||win?.innerHeight||800;
  const css=win?.getComputedStyle?.(launcher),safe=edge=>Math.max(0,parseFloat(css?.getPropertyValue?.('--launcher-safe-'+edge))||0);
  const left=x+8+safe('left'),top=y+8+safe('top');
  return {left,top,right:Math.max(left,x+vw-width-8-safe('right')),bottom:Math.max(top,y+vh-height-8-safe('bottom'))};
 }
 function place(x,y){launcher.style.left=x+'px';launcher.style.top=y+'px';launcher.style.right='auto';launcher.style.bottom='auto';}
 function sync(){const b=bounds();place(position.side==='left'?b.left:b.right,b.top+(b.bottom-b.top)*position.y);}
 function finish(cancelled=false){
  if(!gesture)return;const g=gesture;gesture=null;launcher.removeAttribute('data-dragging');
  if(g.moved){suppressUntil=Date.now()+700;if(!cancelled){const b=bounds();position={side:g.x<(b.left+b.right)/2?'left':'right',y:b.bottom===b.top?0:clamp((g.y-b.top)/(b.bottom-b.top),0,1)};try{storage?.setItem(key,JSON.stringify(position));}catch{}}}
  try{launcher.releasePointerCapture?.(g.id);}catch{}
  sync();
 }
 const down=e=>{
  if(gesture||e.isPrimary===false||(e.button!=null&&e.button!==0))return;
  suppressUntil=0;const rect=launcher.getBoundingClientRect();gesture={id:e.pointerId,startX:e.clientX,startY:e.clientY,left:parseFloat(launcher.style.left)||rect.left||0,top:parseFloat(launcher.style.top)||rect.top||0,moved:false};
  try{launcher.setPointerCapture?.(e.pointerId);}catch{}
 };
 const move=e=>{
  const g=gesture;if(!g||e.pointerId!==g.id)return;const dx=e.clientX-g.startX,dy=e.clientY-g.startY;if(!g.moved&&Math.hypot(dx,dy)<7)return;
  g.moved=true;launcher.dataset.dragging='true';const b=bounds();g.x=clamp(g.left+dx,b.left,b.right);g.y=clamp(g.top+dy,b.top,b.bottom);place(g.x,g.y);e.preventDefault();
 };
 const up=e=>{if(e.pointerId===gesture?.id)finish();},cancel=e=>{if(e.pointerId===gesture?.id)finish(true);},blur=()=>finish(true),resize=()=>{finish(true);sync();};
 // Capture before the launcher opens the workbench. Keyboard clicks remain valid.
 const click=e=>{if(suppressUntil&&Date.now()<=suppressUntil&&e.detail!==0){suppressUntil=0;e.preventDefault();e.stopImmediatePropagation();}};
 launcher.addEventListener('pointerdown',down);launcher.addEventListener('click',click,true);launcher.addEventListener('lostpointercapture',cancel);
 doc.addEventListener('pointermove',move,{passive:false});doc.addEventListener('pointerup',up);doc.addEventListener('pointercancel',cancel);win?.addEventListener?.('blur',blur);win?.addEventListener?.('resize',resize);
 for(const type of ['resize','scroll'])win?.visualViewport?.addEventListener?.(type,resize);
 sync();
 return {sync,destroy(){finish(true);launcher.removeEventListener('pointerdown',down);launcher.removeEventListener('click',click,true);launcher.removeEventListener('lostpointercapture',cancel);doc.removeEventListener('pointermove',move);doc.removeEventListener('pointerup',up);doc.removeEventListener('pointercancel',cancel);win?.removeEventListener?.('blur',blur);win?.removeEventListener?.('resize',resize);for(const type of ['resize','scroll'])win?.visualViewport?.removeEventListener?.(type,resize);}};
}
