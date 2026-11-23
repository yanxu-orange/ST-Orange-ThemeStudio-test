import {alignmentDelta,translatedBox,regionSnap,ALIGNMENTS} from './region-alignment.mjs';
import {imageSizeStyle,imageDimensions} from './image-sizing.mjs';
// A complete editor gesture is one change; cancellation writes no config.
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function localDelta(dx,dy,m=[1,0,0,1]){
 const [a,b,c,d]=m,det=a*d-b*c;if(!Number.isFinite(det)||Math.abs(det)<1e-8)return null;
 return {x:(d*dx-c*dy)/det,y:(-b*dx+a*dy)/det};
}
export function dragPosition(layer,dx,dy,width,height,m=[1,0,0,1]){
 const p=localDelta(dx,dy,m);if(!p)return null;let {x,y}=p;
 if(layer.offsetUnit==='percent'){if(!(width>0&&height>0))return null;x=x/width*100;y=y/height*100;}
 x=layer.x+x*(layer.side==='right'?-1:1);y=layer.y+y*(layer.vertical==='bottom'?-1:1);
 return Number.isFinite(x)&&Number.isFinite(y)?{x:clamp(x,layer._canvasLimit?-4000:-300,layer._canvasLimit?4000:600),y:clamp(y,layer._canvasLimit?-4000:-300,layer._canvasLimit?4000:600)}:null;
}
export function textDragPosition(item,dx,dy,width,m=[1,0,0,1],{percentX=true,minX=-100,maxX=200,minY=-400,maxY=1600}={}){
 const p=localDelta(dx,dy,m);if(!p||percentX&&!(width>0))return null;
 return {x:clamp(item.x+p.x*(percentX?100/width:1),minX,maxX),y:clamp(item.y+p.y,minY,maxY)};
}
// Shapes have a real second dimension, unlike image heightPercent's fitting box.
function pinchShape(layer,ratio,dx,dy,width,height,renderedWidth,renderedHeight,m,parentHeightForWidth){
 if(!(layer.height>0)||!['px','percent'].includes(layer.heightUnit))return null;
 const shapeHeight=scale=>layer.heightUnit==='px'?layer.height*scale:renderedHeight*scale/(parentHeightForWidth?.(layer.width*scale)||height)*100;
 const limit=layer._canvasLimit||500;let low=1/layer.width,high=limit/layer.width;
 if(layer.heightUnit==='px'){low=Math.max(low,1/layer.height);high=Math.min(high,limit/layer.height);}
 else {
  if(!(height>0))return null;
  if(shapeHeight(high)<1||shapeHeight(low)>limit)return null;
  if(shapeHeight(low)<1){let a=low,b=high;for(let i=0;i<40;i++){const mid=(a+b)/2;if(shapeHeight(mid)<1)a=mid;else b=mid;}low=b;}
  if(shapeHeight(high)>limit){let a=low,b=high;for(let i=0;i<40;i++){const mid=(a+b)/2;if(shapeHeight(mid)>limit)b=mid;else a=mid;}high=a;}
 }
 const scale=clamp(ratio,low,high),p=localDelta(dx,dy,m);if(!p)return null;
 const next=dragPosition(layer,p.x-(layer.side==='right'?-1:1)*renderedWidth*(scale-1)/2,p.y-(layer.vertical==='bottom'?-1:1)*renderedHeight*(scale-1)/2,width,height);if(!next)return null;
 const nextWidth=clamp(layer.width*scale,1,layer._canvasLimit||500),nextShapeHeight=clamp(shapeHeight(scale),1,layer._canvasLimit||500),nextHeight=parentHeightForWidth?.(nextWidth,nextShapeHeight)||height;
 if(parentHeightForWidth){const y=next.y*(layer.offsetUnit==='percent'?height/100:1)+(layer.vertical==='bottom'?nextHeight-height:0);next.y=clamp(y*(layer.offsetUnit==='percent'?100/nextHeight:1),-300,600);}
 return {...next,width:nextWidth,height:nextShapeHeight};
}
export function pinchLayer(layer,ratio,dx,dy,width,height,renderedWidth,renderedHeight,m=[1,0,0,1],parentHeightForWidth=null){
 if(!(ratio>0&&layer.width>0&&renderedWidth>0&&renderedHeight>0))return null;
 if(layer.imageSizing){
  const v=layer.imageSizing,proxy={...layer,kind:'shape',height:v.height,heightUnit:v.heightUnit};
  if(v.mode==='cover'||v.lockRatio){proxy.width=renderedWidth/(layer.widthUnit==='percent'?width/100:1);proxy.height=renderedHeight/(v.heightUnit==='percent'?height/100:1);}
  const next=pinchShape(proxy,ratio,dx,dy,width,height,renderedWidth,renderedHeight,m,parentHeightForWidth?((w,h)=>parentHeightForWidth(w,h,{...v,mode:'manual',driver:'width',height:h})):null);
  if(!next)return null;const {height:nextHeight,...rest}=next;
  return {...rest,imageSizing:{...v,mode:'manual',height:nextHeight,driver:'width',ratio:v.mode==='cover'?renderedWidth/renderedHeight:v.ratio}};
 }
 if(layer.kind==='shape')return pinchShape(layer,ratio,dx,dy,width,height,renderedWidth,renderedHeight,m,parentHeightForWidth);
 let max=(layer._canvasLimit||500)/layer.width;
 if(layer.heightPercent>0){
  if(!parentHeightForWidth)max=Math.min(max,100/layer.heightPercent);
  else if(renderedHeight*max>parentHeightForWidth(layer.width*max)){let lo=1/layer.width,hi=max;for(let i=0;i<24;i++){const mid=(lo+hi)/2;if(renderedHeight*mid<=parentHeightForWidth(layer.width*mid))lo=mid;else hi=mid;}max=lo;}
 }
 const scale=clamp(ratio,1/layer.width,max),p=localDelta(dx,dy,m);if(!p)return null;
 const next=dragPosition(layer,p.x-(layer.side==='right'?-1:1)*renderedWidth*(scale-1)/2,p.y-(layer.vertical==='bottom'?-1:1)*renderedHeight*(scale-1)/2,width,height);if(!next)return null;
 const nextWidth=clamp(layer.width*scale,1,layer._canvasLimit||500),nextHeight=parentHeightForWidth?.(nextWidth)||height;
 if(parentHeightForWidth){const y=next.y*(layer.offsetUnit==='percent'?height/100:1)+(layer.vertical==='bottom'?nextHeight-height:0);next.y=clamp(y*(layer.offsetUnit==='percent'?100/nextHeight:1),-300,600);}
 return {...next,width:nextWidth,...(layer.heightPercent>0?{heightPercent:parentHeightForWidth?clamp(renderedHeight*scale/nextHeight*100,0,100):clamp(layer.heightPercent*scale,0,100)}:{})};
}
function matrixFor(node,win){
 let m=[1,0,0,1];for(let p=node;p&&p.nodeType===1;p=p.parentElement){const s=win.getComputedStyle(p),t=s.transform;let n=[1,0,0,1];if(t&&t!=='none'){const C=win.DOMMatrixReadOnly||win.DOMMatrix;if(!C)return null;const v=new C(t);if(!v.is2D)return null;n=[v.a,v.b,v.c,v.d];}const zoom=parseFloat(s.zoom)||1;n=n.map(v=>v*zoom);const [a,b,c,d]=n,[e,f,g,h]=m;m=[a*e+c*f,b*e+d*f,a*g+c*h,b*g+d*h];}return m;
}
export function createLayerDrag({document,getState,getTextTarget=()=>null,getLayerTarget=()=>({}),resolveTarget=null,getAlignmentRegion=null,alignmentCandidate=()=>true,getSnapEnabled=()=>true,guides=null,onCommit,selector='[data-orange-lab-fixture] :is([data-layer-id],[data-text-item],[data-caption-id],[data-footer-caption-id],.otl-reasoning-title)',scopeSelector='[data-orange-lab-fixture]'}){
 let session=null,suppressUntil=0,watching=false,lastPicked=null;
 const origins=new Map();
 function original(node){if(origins.has(node))return;const properties=['touch-action','pointer-events','user-select','outline'],attrs=['data-preview-draggable','data-layer-draggable','draggable'];if(!watching&&removalObserver){removalObserver.observe(document,{childList:true,subtree:true});watching=true;}origins.set(node,{hadStyle:node.hasAttribute('style'),styles:properties.map(k=>[k,node.style.getPropertyValue(k),typeof node.style.getPropertyPriority==='function'?node.style.getPropertyPriority(k):'']),attrs:attrs.map(k=>[k,node.getAttribute(k)])});}
 function restore(node){const state=origins.get(node);if(!state)return;for(const [k,v,p]of state.styles){if(v)node.style.setProperty(k,v,p);else node.style.removeProperty(k);}for(const [k,v]of state.attrs){if(v===null)node.removeAttribute(k);else node.setAttribute(k,v);}if(!state.hadStyle&&!node.getAttribute('style'))node.removeAttribute('style');origins.delete(node);}
 function reset(){lastPicked=null;cancel();for(const node of origins.keys())restore(node);removalObserver?.disconnect();watching=false;}
 // Release only removed subtrees. A long session must not retain previous chats.
 const Observer=document.defaultView?.MutationObserver;
 const removalObserver=Observer?new Observer(records=>{for(const record of records)for(const root of record.removedNodes||[]){if(root.isConnected)continue;if(session&&(session.node===root||root.contains?.(session.node)))cancel();restore(root);for(const node of root.querySelectorAll?.('[data-preview-draggable]')||[])restore(node);}if(!origins.size){removalObserver.disconnect();watching=false;}}):null;
 const resolve=node=>{const state=getState();if(!state.active||state.mode!=='edit'||node.hidden)return null;if(resolveTarget)return resolveTarget(node,state);if(state.page!=='chat')return null;
  if(node.dataset.layerId){const item=state.layers.find(l=>l.id===node.dataset.layerId&&l.visible);return item?{item,image:true,selected:((state.kind==='image'&&state.object===item.id)||(state.kind==='avatar'&&item.anchor==='avatar'&&state.compositionSelectedId===item.id))&&state.regionFor(item)===state.region}:null;}
  return getTextTarget(node);
 };
 const valid=s=>{const target=resolve(s.node);return s.node.isConnected&&target?.item===s.target.item&&target.selected;};
 function refresh(roots=[document]){if(session&&!valid(session))cancel();if(session)return;for(const root of roots)for(const node of root.querySelectorAll(selector)){
  original(node);const target=resolve(node),chosen=!!target?.selected;node.dataset.previewDraggable=String(chosen);if(node.dataset.layerId)node.dataset.layerDraggable=String(chosen);
  node.style.touchAction=chosen?'none':'auto';node.style.setProperty('pointer-events',target?'auto':'none','important');node.draggable=false;node.style.userSelect=chosen?'none':'';
  if(chosen)node.style.setProperty('outline','2px dashed #678b70','important');else node.style.removeProperty('outline');
 }}
 function cancel(){guides?.clear();const s=session;session=null;if(!s)return;for(const [key,r]of s.writes)if(s.node.style.getPropertyValue(key)===r.last){if(r.old)s.node.style.setProperty(key,r.old,r.priority);else s.node.style.removeProperty(key);}if(s.oldStyle===null&&!s.node.getAttribute('style'))s.node.removeAttribute('style');for(const id of s.points.keys())try{s.node.releasePointerCapture?.(id);}catch{}if(s.changed)suppressUntil=Date.now()+400;}
 function position(s,dx,dy){return s.target.image?dragPosition(s.base,dx,dy,s.width,s.height,s.matrix):textDragPosition(s.base,dx,dy,s.width,s.matrix,s.target);}
 function displacement(s,next){
  let x=next.x-s.base.x,y=next.y-s.base.y;
  if(s.target.image){if(s.base.offsetUnit==='percent'){x*=s.width/100;y*=s.height/100;}x*=s.base.side==='right'?-1:1;y*=s.base.vertical==='bottom'?-1:1;}
  else if(s.target.percentX!==false)x*=s.width/100;
  return {x:s.matrix[0]*x+s.matrix[2]*y,y:s.matrix[1]*x+s.matrix[3]*y};
 }
 function exactPosition(s,dx,dy){const next=position(s,dx,dy);if(!next)return null;const actual=displacement(s,next);return Math.abs(actual.x-dx)<.01&&Math.abs(actual.y-dy)<.01?next:null;}
 function geometry(node,target,parent,matrix){
  if(!getAlignmentRegion||Math.abs(matrix[1])>1e-7||Math.abs(matrix[2])>1e-7)return null;
  // With axis-aligned ancestors the screen AABB is also the visual region AABB.
  // The object's own rotation remains in its measured box; do not inverse an AABB through a rotated parent.
  try{const own=matrixFor(node,document.defaultView);if(!own)return null;
   const value=getAlignmentRegion(node,target,parent),regionNode=value?.node||value;
   if(!regionNode)return null;const rm=matrixFor(regionNode,document.defaultView);if(!rm||Math.abs(rm[1])>1e-7||Math.abs(rm[2])>1e-7)return null;
   const region=value.rect||regionNode.getBoundingClientRect(),box=node.getBoundingClientRect();
   if(![region.left,region.right,region.top,region.bottom,box.left,box.right,box.top,box.bottom].every(Number.isFinite)||region.right<=region.left||region.bottom<=region.top||box.right<=box.left||box.bottom<=box.top)return null;
   return {region:{left:region.left,right:region.right,top:region.top,bottom:region.bottom},box:{left:box.left,right:box.right,top:box.top,bottom:box.bottom}};
  }catch{return null;}
 }
 function measure(node){
  if(!node?.isConnected||!alignmentCandidate(node))return null;
  const target=resolve(node);if(!target?.selected)return null;if(target.image)Object.assign(target,getLayerTarget(node,target.item));
  const parent=target.parent||node.offsetParent||node.parentElement;if(!parent)return null;
  let matrix;try{matrix=matrixFor(parent,document.defaultView);}catch{return null;}if(!matrix)return null;
  const canvasScale=target.canvasScale||1;matrix=matrix.map(v=>v*canvasScale);
  const geo=geometry(node,target,parent,matrix);if(!geo)return null;
  return {node,target,matrix,canvasScale,width:(target.width??parent.clientWidth)/canvasScale,height:(target.height??parent.clientHeight)/canvasScale,base:{...target.item,...(target.maxSize?{_canvasLimit:target.maxSize}:{})},geometry:geo};
 }
 function representative(){
  const visible=node=>{if(!node?.isConnected||!alignmentCandidate(node))return false;const r=node.getBoundingClientRect(),style=document.defaultView?.getComputedStyle?.(node)||{};return r.width>0&&r.height>0&&r.bottom>0&&r.right>0&&r.top<(document.defaultView.innerHeight||Infinity)&&r.left<(document.defaultView.innerWidth||Infinity)&&style.visibility!=='hidden'&&style.display!=='none';};
  if(visible(lastPicked)){const s=measure(lastPicked);if(s)return s;}
  for(const node of origins.keys())if(visible(node)){const s=measure(node);if(s)return s;}
  return null;
 }
 function selectedItem(){for(const node of [lastPicked,...origins.keys()])if(node?.isConnected&&alignmentCandidate(node)){const target=resolve(node);if(target?.selected)return target.item;}return null;}
 function overrideTarget(s,override){if(override?.item&&s?.target.item!==override.source)return null;if(s&&override?.item){s.target={...s.target,item:override.item};s.base={...s.base,...override.item};}return s;}
 function alignmentAvailability(override=null){const s=overrideTarget(representative(),override);return Object.fromEntries(ALIGNMENTS.map(([key])=>{const d=s&&alignmentDelta(s.geometry.box,s.geometry.region,key);return [key,!!(s&&exactPosition(s,d.x,d.y))];}));}
 function align(key,override=null){cancel();const s=overrideTarget(representative(),override);if(!s)return false;const d=alignmentDelta(s.geometry.box,s.geometry.region,key);if(!d)return false;const next=exactPosition(s,d.x,d.y);if(!next)return false;lastPicked=s.node;if(next.x!==s.target.item.x||next.y!==s.target.item.y)onCommit(s.target.item,next,override?.beforeCommit);return true;}
 function rememberStyle(s,key){if(!s.writes.has(key))s.writes.set(key,{old:s.node.style.getPropertyValue(key),priority:typeof s.node.style.getPropertyPriority==='function'?s.node.style.getPropertyPriority(key):'',last:null});return s.writes.get(key);}
 function write(s,key,value,priority=''){const r=rememberStyle(s,key);s.node.style.setProperty(key,value,priority);r.last=s.node.style.getPropertyValue(key);}
 function rebase(s){const values=[...s.points.values()];s.base={...s.target.item,...s.next,...(s.target.maxSize?{_canvasLimit:s.target.maxSize}:{})};if(s.target.parentHeightForWidth)s.height=s.target.parentHeightForWidth(s.base.width,s.base.imageSizing?.height??s.base.height,s.base.imageSizing);s.origin=values.length===2?{x:(values[0].x+values[1].x)/2,y:(values[0].y+values[1].y)/2,distance:Math.hypot(values[1].x-values[0].x,values[1].y-values[0].y)}:{...values[0]};if(s.base.imageSizing){const d=imageDimensions(s.base,{width:s.width,height:s.height});s.renderedWidth=d.width;s.renderedHeight=d.height;}else{s.renderedWidth=s.initialWidth*(s.base.width/s.target.item.width||1);s.renderedHeight=s.initialHeight*(s.base.width/s.target.item.width||1);}}
 function capture(s,id){try{s.node.setPointerCapture?.(id);return true;}catch{cancel();return false;}}
 function down(e){if(!session)suppressUntil=0;if(e.button!==undefined&&e.button!==0)return;const node=e.target.closest?.(selector);
  if(session){const s=session;if(s.points.has(e.pointerId))return;if(!s.target.image||s.points.size>=2||node!==s.node){cancel();return;}guides?.clear();s.geometry=null;s.points.set(e.pointerId,{x:e.clientX,y:e.clientY});if(capture(s,e.pointerId))rebase(s);return;}
  if(e.isPrimary===false||!node||node.dataset.previewDraggable!=='true')return;const target=resolve(node);if(!target?.selected)return;if(target.image)Object.assign(target,getLayerTarget(node,target.item));
  const parent=target.parent||node.offsetParent||node.parentElement;let matrix;try{matrix=matrixFor(parent,document.defaultView);}catch{return;}if(!matrix)return;const canvasScale=target.canvasScale||1;matrix=matrix.map(v=>v*canvasScale);
  lastPicked=node;const geo=geometry(node,target,parent,matrix);
  const oldStyle=node.getAttribute('style');
  session={node,target,geometry:geo,points:new Map([[e.pointerId,{x:e.clientX,y:e.clientY}]]),width:(target.width??parent.clientWidth)/canvasScale,height:(target.height??parent.clientHeight)/canvasScale,initialParentHeight:(target.height??parent.clientHeight)/canvasScale,canvasScale,matrix,oldStyle,writes:new Map(),next:null,changed:false,initialWidth:(node.offsetWidth||node.clientWidth||0)/canvasScale,initialHeight:(node.offsetHeight||node.clientHeight||0)/canvasScale};rebase(session);capture(session,e.pointerId);
 }
 function move(e){const s=session;if(!s||!s.points.has(e.pointerId))return;if(!valid(s)){cancel();return;}s.points.set(e.pointerId,{x:e.clientX,y:e.clientY});const values=[...s.points.values()];let next;
  if(values.length===2){const distance=Math.hypot(values[1].x-values[0].x,values[1].y-values[0].y);if(s.origin.distance<4)return;const dx=(values[0].x+values[1].x)/2-s.origin.x,dy=(values[0].y+values[1].y)/2-s.origin.y;if(Math.abs(distance-s.origin.distance)<4&&Math.hypot(dx,dy)<4&&!s.changed)return;next=pinchLayer(s.base,distance/s.origin.distance,dx,dy,s.width,s.height,s.renderedWidth,s.renderedHeight,s.matrix,s.target.parentHeightForWidth);}
  else {const dx=e.clientX-s.origin.x,dy=e.clientY-s.origin.y;if(Math.hypot(dx,dy)<4&&!s.changed)return;next=position(s,dx,dy);
   if(next&&s.geometry&&getSnapEnabled()){
    const moved=displacement(s,next),snap=regionSnap(translatedBox(s.geometry.box,moved.x,moved.y),s.geometry.region);
    const accepted=[];let nx=moved.x,ny=moved.y;
    for(const axis of ['x','y']){const line=snap.lines.find(key=>(['left','centerX','right'].includes(key)?'x':'y')===axis);if(!line)continue;const tx=nx+(axis==='x'?snap.x:0),ty=ny+(axis==='y'?snap.y:0),candidate=exactPosition(s,tx,ty);if(candidate){nx=tx;ny=ty;next=candidate;accepted.push(line);}}
    if(accepted.length)guides?.show(s.geometry.region,accepted);else guides?.clear();
   }else guides?.clear();
  }
  if(!next)return;e.preventDefault();s.changed=true;s.next={...s.next,...next};
  if(s.target.image){const unit=s.base.offsetUnit==='percent'?'%':'px',parentHeight=s.target.parentHeightForWidth?.(s.next.width??s.base.width,s.next.imageSizing?.height??s.next.height??s.base.imageSizing?.height??s.base.height,s.next.imageSizing??s.base.imageSizing);let y=next.y;
   if(parentHeight){const pixels=y*(unit==='%'?parentHeight/100:1)-(s.base.vertical==='bottom'?parentHeight-s.initialParentHeight:0);y=pixels*(unit==='%'?100/s.initialParentHeight:1);}
   write(s,s.base.side,next.x*(unit==='px'?s.canvasScale:1)+unit);write(s,s.base.vertical,y*(unit==='px'?s.canvasScale:1)+unit);if(next.width!==undefined)write(s,'width',next.width*(s.base.widthUnit==='percent'?1:s.canvasScale)+(s.base.widthUnit==='percent'?'%':'px'));if(s.base.kind==='shape'&&s.next.height!==undefined)write(s,'height',s.base.heightUnit==='percent'?(parentHeight?(parentHeight*s.next.height/100)+'px':s.next.height+'%'):(s.next.height*s.canvasScale)+'px');else if(s.next.heightPercent!==undefined)write(s,'height',parentHeight?(parentHeight*s.next.heightPercent/100)+'px':s.next.heightPercent+'%');if(s.next.imageSizing){const styles=imageSizeStyle({...s.base,...s.next,width:(s.next.width??s.base.width)*(s.base.widthUnit==='px'?s.canvasScale:1),imageSizing:{...s.next.imageSizing,height:s.next.imageSizing.height*(s.next.imageSizing.heightUnit==='px'?s.canvasScale:1)}});for(const [key,value]of Object.entries(styles))write(s,key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()),value);}if(s.target.onPreview){const clip=rememberStyle(s,'clip-path');s.target.onPreview();clip.last=s.node.style.getPropertyValue('clip-path');}}
  else {const dx=(next.x-s.target.item.x)*(s.target.percentX===false?1:s.width/100),dy=next.y-s.target.item.y;write(s,'translate',`${dx*s.canvasScale}px ${dy*s.canvasScale}px`,'important');write(s,'--sc-drag-x',(dx*s.canvasScale)+'px');write(s,'--sc-drag-y',(dy*s.canvasScale)+'px');}
 }
 function up(e){const s=session;if(!s||!s.points.has(e.pointerId))return;if(!valid(s)){cancel();return;}s.points.delete(e.pointerId);try{s.node.releasePointerCapture?.(e.pointerId);}catch{}
  if(s.points.size){rebase(s);return;}const next=s.next,item=s.target.item;cancel();if(next){e.preventDefault();if(Object.keys(next).some(key=>next[key]!==item[key]))onCommit(item,next);}
 }
 document.addEventListener('pointerdown',down,true);document.addEventListener('pointermove',move,{capture:true,passive:false});document.addEventListener('pointerup',up,true);
 document.addEventListener('pointercancel',e=>{if(session?.points.has(e.pointerId))cancel();},true);document.addEventListener('lostpointercapture',e=>{if(session?.points.has(e.pointerId))cancel();},true);
 document.addEventListener('click',e=>{if(Date.now()<suppressUntil&&e.target.closest?.(scopeSelector)){e.preventDefault();e.stopImmediatePropagation();}},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')cancel();},true);
 document.defaultView?.addEventListener?.('resize',cancel);document.addEventListener('scroll',()=>{if(session)cancel();},true);
 document.defaultView?.addEventListener?.('blur',cancel);document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
 return {refresh,cancel,reset,align,alignmentAvailability,selectedItem,get dragging(){return !!session;}};
}


