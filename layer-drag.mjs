// Editor fixtures only. A complete gesture is one change; cancellation writes no config.
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function localDelta(dx,dy,m=[1,0,0,1]){
 const [a,b,c,d]=m,det=a*d-b*c;if(!Number.isFinite(det)||Math.abs(det)<1e-8)return null;
 return {x:(d*dx-c*dy)/det,y:(-b*dx+a*dy)/det};
}
export function dragPosition(layer,dx,dy,width,height,m=[1,0,0,1]){
 const p=localDelta(dx,dy,m);if(!p)return null;let {x,y}=p;
 if(layer.offsetUnit==='percent'){if(!(width>0&&height>0))return null;x=x/width*100;y=y/height*100;}
 x=layer.x+x*(layer.side==='right'?-1:1);y=layer.y+y*(layer.vertical==='bottom'?-1:1);
 return Number.isFinite(x)&&Number.isFinite(y)?{x:clamp(x,-300,600),y:clamp(y,-300,600)}:null;
}
export function textDragPosition(item,dx,dy,width,m=[1,0,0,1],{percentX=true,minX=-100,maxX=200,minY=-400,maxY=1600}={}){
 const p=localDelta(dx,dy,m);if(!p||percentX&&!(width>0))return null;
 return {x:clamp(item.x+p.x*(percentX?100/width:1),minX,maxX),y:clamp(item.y+p.y,minY,maxY)};
}
export function pinchLayer(layer,ratio,dx,dy,width,height,renderedWidth,renderedHeight,m=[1,0,0,1],parentHeightForWidth=null){
 if(!(ratio>0&&layer.width>0&&renderedWidth>0&&renderedHeight>0))return null;
 let max=500/layer.width;
 if(layer.heightPercent>0){
  if(!parentHeightForWidth)max=Math.min(max,100/layer.heightPercent);
  else if(renderedHeight*max>parentHeightForWidth(layer.width*max)){let lo=1/layer.width,hi=max;for(let i=0;i<24;i++){const mid=(lo+hi)/2;if(renderedHeight*mid<=parentHeightForWidth(layer.width*mid))lo=mid;else hi=mid;}max=lo;}
 }
 const scale=clamp(ratio,1/layer.width,max),p=localDelta(dx,dy,m);if(!p)return null;
 const next=dragPosition(layer,p.x-(layer.side==='right'?-1:1)*renderedWidth*(scale-1)/2,p.y-(layer.vertical==='bottom'?-1:1)*renderedHeight*(scale-1)/2,width,height);if(!next)return null;
 const nextWidth=clamp(layer.width*scale,1,500),nextHeight=parentHeightForWidth?.(nextWidth)||height;
 if(parentHeightForWidth){const y=next.y*(layer.offsetUnit==='percent'?height/100:1)+(layer.vertical==='bottom'?nextHeight-height:0);next.y=clamp(y*(layer.offsetUnit==='percent'?100/nextHeight:1),-300,600);}
 return {...next,width:nextWidth,...(layer.heightPercent>0?{heightPercent:parentHeightForWidth?clamp(renderedHeight*scale/nextHeight*100,0,100):clamp(layer.heightPercent*scale,0,100)}:{})};
}
function matrixFor(node,win){
 let m=[1,0,0,1];for(let p=node;p&&p.nodeType===1;p=p.parentElement){const s=win.getComputedStyle(p),t=s.transform;let n=[1,0,0,1];if(t&&t!=='none'){const C=win.DOMMatrixReadOnly||win.DOMMatrix;if(!C)return null;const v=new C(t);if(!v.is2D)return null;n=[v.a,v.b,v.c,v.d];}const zoom=parseFloat(s.zoom)||1;n=n.map(v=>v*zoom);const [a,b,c,d]=n,[e,f,g,h]=m;m=[a*e+c*f,b*e+d*f,a*g+c*h,b*g+d*h];}return m;
}
export function createLayerDrag({document,getState,getTextTarget=()=>null,getLayerTarget=()=>({}),onCommit}){
 let session=null,suppressUntil=0;
 const selector='[data-orange-lab-fixture] :is([data-layer-id],[data-text-item],[data-caption-id],[data-footer-caption-id],.otl-reasoning-title)';
 const resolve=node=>{const state=getState();if(!state.active||state.page!=='chat'||state.mode!=='edit'||node.hidden)return null;
  if(node.dataset.layerId){const item=state.layers.find(l=>l.id===node.dataset.layerId&&l.visible);return item?{item,image:true,selected:state.kind==='image'&&state.object===item.id&&state.regionFor(item)===state.region}:null;}
  return getTextTarget(node);
 };
 const valid=s=>{const target=resolve(s.node);return s.node.isConnected&&target?.item===s.target.item&&target.selected;};
 function refresh(){if(session&&!valid(session))cancel();for(const node of document.querySelectorAll(selector)){
  const target=resolve(node),chosen=!!target?.selected;node.dataset.previewDraggable=String(chosen);if(node.dataset.layerId)node.dataset.layerDraggable=String(chosen);
  node.style.touchAction=chosen?'none':'auto';node.style.setProperty('pointer-events',target?'auto':'none','important');node.draggable=false;node.style.userSelect=chosen?'none':'';
  if(chosen)node.style.setProperty('outline','2px dashed #678b70','important');else node.style.removeProperty('outline');
 }}
 function cancel(){const s=session;session=null;if(!s)return;if(s.oldStyle===null)s.node.removeAttribute('style');else s.node.setAttribute('style',s.oldStyle);for(const id of s.points.keys())try{s.node.releasePointerCapture?.(id);}catch{}if(s.changed)suppressUntil=Date.now()+400;}
 function rebase(s){const values=[...s.points.values()];s.base={...s.target.item,...s.next};if(s.target.parentHeightForWidth)s.height=s.target.parentHeightForWidth(s.base.width);s.origin=values.length===2?{x:(values[0].x+values[1].x)/2,y:(values[0].y+values[1].y)/2,distance:Math.hypot(values[1].x-values[0].x,values[1].y-values[0].y)}:{...values[0]};s.renderedWidth=s.initialWidth*(s.base.width/s.target.item.width||1);s.renderedHeight=s.initialHeight*(s.base.width/s.target.item.width||1);}
 function capture(s,id){try{s.node.setPointerCapture?.(id);return true;}catch{cancel();return false;}}
 function down(e){if(!session)suppressUntil=0;if(e.button!==undefined&&e.button!==0)return;const node=e.target.closest?.(selector);
  if(session){const s=session;if(s.points.has(e.pointerId))return;if(!s.target.image||s.points.size>=2||node!==s.node){cancel();return;}s.points.set(e.pointerId,{x:e.clientX,y:e.clientY});if(capture(s,e.pointerId))rebase(s);return;}
  if(e.isPrimary===false||!node||node.dataset.previewDraggable!=='true')return;const target=resolve(node);if(!target?.selected)return;if(target.image)Object.assign(target,getLayerTarget(node,target.item));
  const parent=target.parent||node.offsetParent||node.parentElement;let matrix;try{matrix=matrixFor(parent,document.defaultView);}catch{return;}if(!matrix)return;
  const oldStyle=node.getAttribute('style');
  session={node,target,points:new Map([[e.pointerId,{x:e.clientX,y:e.clientY}]]),width:target.width??parent.clientWidth,height:target.height??parent.clientHeight,initialParentHeight:target.height??parent.clientHeight,matrix,oldStyle,next:null,changed:false,initialWidth:node.offsetWidth||node.clientWidth||0,initialHeight:node.offsetHeight||node.clientHeight||0};rebase(session);capture(session,e.pointerId);
 }
 function move(e){const s=session;if(!s||!s.points.has(e.pointerId))return;if(!valid(s)){cancel();return;}s.points.set(e.pointerId,{x:e.clientX,y:e.clientY});const values=[...s.points.values()];let next;
  if(values.length===2){const distance=Math.hypot(values[1].x-values[0].x,values[1].y-values[0].y);if(s.origin.distance<4)return;const dx=(values[0].x+values[1].x)/2-s.origin.x,dy=(values[0].y+values[1].y)/2-s.origin.y;if(Math.abs(distance-s.origin.distance)<4&&Math.hypot(dx,dy)<4&&!s.changed)return;next=pinchLayer(s.base,distance/s.origin.distance,dx,dy,s.width,s.height,s.renderedWidth,s.renderedHeight,s.matrix,s.target.parentHeightForWidth);}
  else {const dx=e.clientX-s.origin.x,dy=e.clientY-s.origin.y;if(Math.hypot(dx,dy)<4&&!s.changed)return;next=s.target.image?dragPosition(s.base,dx,dy,s.width,s.height,s.matrix):textDragPosition(s.base,dx,dy,s.width,s.matrix,s.target);}
  if(!next)return;e.preventDefault();s.changed=true;s.next={...s.next,...next};
  if(s.target.image){const unit=s.base.offsetUnit==='percent'?'%':'px',parentHeight=s.target.parentHeightForWidth?.(s.next.width??s.base.width);let y=next.y;
   if(parentHeight){const pixels=y*(unit==='%'?parentHeight/100:1)-(s.base.vertical==='bottom'?parentHeight-s.initialParentHeight:0);y=pixels*(unit==='%'?100/s.initialParentHeight:1);}
   s.node.style[s.base.side]=next.x+unit;s.node.style[s.base.vertical]=y+unit;if(next.width!==undefined)s.node.style.width=next.width+(s.base.widthUnit==='percent'?'%':'px');if(s.next.heightPercent!==undefined)s.node.style.height=parentHeight?(parentHeight*s.next.heightPercent/100)+'px':s.next.heightPercent+'%';s.target.onPreview?.();}
  else {const dx=(next.x-s.target.item.x)*(s.target.percentX===false?1:s.width/100),dy=next.y-s.target.item.y;s.node.style.setProperty('translate',`${dx}px ${dy}px`,'important');s.node.style.setProperty('--sc-drag-x',dx+'px');s.node.style.setProperty('--sc-drag-y',dy+'px');}
 }
 function up(e){const s=session;if(!s||!s.points.has(e.pointerId))return;if(!valid(s)){cancel();return;}s.points.delete(e.pointerId);try{s.node.releasePointerCapture?.(e.pointerId);}catch{}
  if(s.points.size){rebase(s);return;}const next=s.next,item=s.target.item;cancel();if(next){e.preventDefault();if(Object.keys(next).some(key=>next[key]!==item[key]))onCommit(item,next);}
 }
 document.addEventListener('pointerdown',down,true);document.addEventListener('pointermove',move,{capture:true,passive:false});document.addEventListener('pointerup',up,true);
 document.addEventListener('pointercancel',e=>{if(session?.points.has(e.pointerId))cancel();},true);document.addEventListener('lostpointercapture',e=>{if(session?.points.has(e.pointerId))cancel();},true);
 document.addEventListener('click',e=>{if(Date.now()<suppressUntil&&e.target.closest?.('[data-orange-lab-fixture]')){e.preventDefault();e.stopImmediatePropagation();}},true);
 document.defaultView?.addEventListener?.('blur',cancel);document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
 return {refresh,cancel,get dragging(){return !!session;}};
}
