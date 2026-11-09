// Editor fixtures only. Config is changed once on release, never on movement.
export function dragPosition(layer,dx,dy,width,height,m=[1,0,0,1]){
 const [a,b,c,d]=m,det=a*d-b*c;if(!Number.isFinite(det)||Math.abs(det)<1e-8)return null;
 let x=(d*dx-c*dy)/det,y=(-b*dx+a*dy)/det;
 if(layer.offsetUnit==='percent'){if(!(width>0&&height>0))return null;x=x/width*100;y=y/height*100;}
 x=layer.x+x*(layer.side==='right'?-1:1);y=layer.y+y*(layer.vertical==='bottom'?-1:1);
 return Number.isFinite(x)&&Number.isFinite(y)?{x:Math.max(-300,Math.min(600,x)),y:Math.max(-300,Math.min(600,y))}:null;
}
function matrixFor(node,win){
 let m=[1,0,0,1];for(let p=node;p&&p.nodeType===1;p=p.parentElement){const s=win.getComputedStyle(p),t=s.transform;let n=[1,0,0,1];if(t&&t!=='none'){const C=win.DOMMatrixReadOnly||win.DOMMatrix;if(!C)return null;const v=new C(t);if(!v.is2D)return null;n=[v.a,v.b,v.c,v.d];}const zoom=parseFloat(s.zoom)||1;n=n.map(v=>v*zoom);const [a,b,c,d]=n,[e,f,g,h]=m;m=[a*e+c*f,b*e+d*f,a*g+c*h,b*g+d*h];}return m;
}
export function createLayerDrag({document,getState,onCommit}){
 let session=null,suppressUntil=0;const selector='[data-orange-lab-fixture] [data-layer-id]';
 const layerFor=n=>{const s=getState();return s.active&&s.page==='chat'&&s.mode==='edit'?s.layers.find(l=>l.id===n.dataset.layerId&&l.visible&&s.regionFor(l)===s.region):null;};
 const valid=s=>{const state=getState();return s.node.isConnected&&layerFor(s.node)===s.layer&&state.kind==='image'&&state.object===s.layer.id;};
 function refresh(){for(const n of document.querySelectorAll(selector)){const s=getState(),l=layerFor(n),chosen=!!l&&s.kind==='image'&&s.object===l.id;n.dataset.layerDraggable=String(chosen);n.style.touchAction=chosen?'none':'auto';n.style.pointerEvents=l?'auto':'none';n.draggable=false;n.style.outline=chosen?'2px dashed #678b70':'';}}
 function cancel(){const s=session;session=null;if(s){s.node.style[s.layer.side]=s.oldX;s.node.style[s.layer.vertical]=s.oldY;try{s.node.releasePointerCapture?.(s.id);}catch{}}}
 function down(e){if(session){if(e.pointerId!==session.id)cancel();return;}if(e.button!==undefined&&e.button!==0||e.isPrimary===false)return;const n=e.target.closest?.(selector);if(!n||n.dataset.layerDraggable!=='true')return;const layer=layerFor(n);if(!layer)return;const parent=n.offsetParent||n.parentElement;let matrix;try{matrix=matrixFor(parent,document.defaultView);}catch{return;}if(!matrix)return;session={node:n,layer,id:e.pointerId,x:e.clientX,y:e.clientY,width:parent.clientWidth,height:parent.clientHeight,matrix,oldX:n.style[layer.side],oldY:n.style[layer.vertical],next:null};try{n.setPointerCapture?.(e.pointerId);}catch{cancel();}}
 function move(e){const s=session;if(!s||s.id!==e.pointerId)return;if(!valid(s)){cancel();return;}if(Math.hypot(e.clientX-s.x,e.clientY-s.y)<4&&!s.next)return;const p=dragPosition(s.layer,e.clientX-s.x,e.clientY-s.y,s.width,s.height,s.matrix);if(!p)return;e.preventDefault();s.next=p;const unit=s.layer.offsetUnit==='percent'?'%':'px';s.node.style[s.layer.side]=p.x+unit;s.node.style[s.layer.vertical]=p.y+unit;}
 function up(e){const s=session;if(!s||s.id!==e.pointerId)return;const next=valid(s)?s.next:null;cancel();if(next){suppressUntil=Date.now()+400;e.preventDefault();if(next.x!==s.layer.x||next.y!==s.layer.y)onCommit(s.layer,next);}}
 document.addEventListener('pointerdown',down,true);document.addEventListener('pointermove',move,{capture:true,passive:false});document.addEventListener('pointerup',up,true);document.addEventListener('pointercancel',cancel,true);document.addEventListener('lostpointercapture',e=>{if(session?.id===e.pointerId)cancel();},true);
 document.addEventListener('click',e=>{if(Date.now()<suppressUntil&&e.target.closest?.(selector)){e.preventDefault();e.stopImmediatePropagation();}},true);
 return {refresh,cancel,get dragging(){return !!session;}};
}
