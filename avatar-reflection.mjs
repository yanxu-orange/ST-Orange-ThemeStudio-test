import {cardPadding} from './body-card.mjs';

export const REFLECTION_DEFAULTS=Object.freeze({height:35,gap:6,strength:30});
const polygonArea=points=>Math.abs(points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p.x*q.y-q.x*p.y;},0))/2;
function clipPolygon(points,bounds){
 for(const [axis,bound,sign]of bounds){const next=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],insideA=(a[axis]-bound)*sign>=0,insideB=(b[axis]-bound)*sign>=0;if(insideA)next.push(a);if(insideA!==insideB){const t=(bound-a[axis])/(b[axis]-a[axis]);next.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}}points=next;}return points;
}
export function validateReflection(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==3||Object.keys(value).some(k=>!Object.hasOwn(REFLECTION_DEFAULTS,k)))throw Error('头像倒影字段无效');
 for(const [key,min,max]of [['height',10,60],['gap',0,40],['strength',0,80]])if(!Number.isFinite(value[key])||value[key]<min||value[key]>max)throw Error('头像倒影参数无效：'+key);
 return {height:value.height,gap:value.gap,strength:value.strength};
}
export function reflectionGeometry(c,p,fill,g,effects){
 const r=effects?.reflection;if(!r||!g.photoWidth||!g.photoHeight)return {reserve:0,clip:'',bottom:0};
 const w=g.photoWidth,h=g.photoHeight,scale=effects.scale/100,angle=(fill.enabled?0:p.rotation)*Math.PI/180,co=Math.cos(angle),si=Math.sin(angle),ox=w/2,oy=h;
 const x=fill.enabled?0:cardPadding(c)+p.x,y=fill.enabled?0:cardPadding(c)+g.photoTop-p.y,right=g.width+cardPadding(c)*2;
 const forward=([px,py])=>({x:x+ox+scale*(co*(px-ox)-si*(py-oy)),y:y+oy+scale*(si*(px-ox)+co*(py-oy))});
 const visible=clipPolygon([[0,0],[w,0],[w,h],[0,h]].map(forward),[['x',0,1],['x',right,-1],['y',0,1],['y',g.baseHeight,-1]]);
 if(polygonArea(visible)<1e-6)return {reserve:0,clip:'',bottom:0,extent:0,top:0,offset:0};
 const localY=visible.map(point=>oy+(-si*(point.x-x-ox)+co*(point.y-y-oy))/scale),sourceBottom=Math.min(h,Math.max(...localY)),sourceTop=Math.max(0,Math.min(...localY)),extent=Math.max(0,sourceBottom-sourceTop)*r.height/100,top=sourceBottom+r.gap,offset=h-sourceBottom;
 const corners=clipPolygon([[0,top],[w,top],[w,top+extent],[0,top+extent]].map(forward),[['x',0,1],['x',right,-1]]);
 if(polygonArea(corners)<1e-6)return {reserve:0,clip:'',bottom:0,extent:0,top:0,offset:0};
 const bottom=Math.max(...corners.map(p=>p.y)),reserve=Math.ceil(Math.max(0,bottom-g.baseHeight));
 const clip=[[0,0],[right,0],[right,g.baseHeight+reserve],[0,g.baseHeight+reserve]].map(([px,py])=>{const dx=px-x-ox,dy=py-y-oy;return `${Number((ox+(co*dx+si*dy)/scale).toFixed(4))}px ${Number((oy+(-si*dx+co*dy)/scale).toFixed(4))}px`;}).join(',');
 return {reserve,clip,bottom,extent,top,offset};
}
export function createAvatarReflectionNode(document,{owned=true,source='',placeholder=false}={}){
 const root=document.createElement('div');root.className=owned?'otl-avatar-reflection':'otl-avatar-reflection-preview';root.setAttribute('aria-hidden','true');
 const window=document.createElement('div'),mirror=document.createElement('div'),image=document.createElement(placeholder?'div':'img');window.className='otl-reflection-window';mirror.className='otl-reflection-source';
 for(const node of [root,window,mirror,image]){if(owned)node.setAttribute('data-otl-live-owned','');node.style.pointerEvents='none';}
 if(placeholder){image.textContent='头像';image.style.cssText='display:grid;place-items:center;background:#e1e3e6;color:#696d73;width:100%;height:100%;font:13px sans-serif';}
 else{image.alt='';image.setAttribute('aria-hidden','true');image.draggable=false;if(source)image.setAttribute('src',source);}
 mirror.append(image);window.append(mirror);root.append(window);return root;
}
export function createAvatarReflectionRuntime({document}){
 const records=new Map();
 function remove(msg){records.get(msg)?.remove();records.delete(msg);}
 function sync(msg,parent,image,enabled,hidden){
  const source=image?.getAttribute('src');if(!enabled||hidden||!parent||!source){remove(msg);return null;}
  let root=records.get(msg);if(root&&root.parentNode!==parent){remove(msg);root=null;}
  if(!root){root=createAvatarReflectionNode(document);parent.append(root);records.set(msg,root);}
  const copy=root.querySelector('img');if(copy.getAttribute('src')!==source)copy.setAttribute('src',source);return root;
 }
 function stop(){for(const root of records.values())root.remove();records.clear();}
 return {sync,remove,stop,get count(){return records.size;}};
}
export function styleStaticAvatarReflection(root,{avatarStyle,c,p,fill,g,effects,mask,sourceClip}){
 const r=reflectionGeometry(c,p,fill,g,effects);root.style.cssText=avatarStyle;
 Object.assign(root.style,{background:'transparent',border:'0',borderRadius:'0',maskImage:'none',webkitMaskImage:'none',overflow:'visible',clipPath:`polygon(${r.clip})`,pointerEvents:'none'});
 const window=root.firstElementChild,source=window.firstElementChild,image=source.firstElementChild;
 window.style.cssText=`position:absolute;left:0;top:${r.top||0}px;width:100%;height:${r.extent||0}px;overflow:hidden;pointer-events:none;mask-image:linear-gradient(#000,transparent);-webkit-mask-image:linear-gradient(#000,transparent);opacity:${effects.reflection.strength/100}`;
 source.style.cssText=`position:relative;top:${-(r.offset||0)}px;width:100%;height:${g.photoHeight}px;transform:scaleY(-1);transform-origin:50% 50%;overflow:hidden;clip-path:polygon(${sourceClip});mask-image:${mask};-webkit-mask-image:${mask};mask-composite:intersect;-webkit-mask-composite:source-in;mask-mode:alpha;mask-size:contain;mask-position:center;mask-repeat:no-repeat;-webkit-mask-size:contain;-webkit-mask-position:center;-webkit-mask-repeat:no-repeat;border-radius:${effects.frame?0:p.radius}px;pointer-events:none`;
 if(fill.enabled&&!effects.frame)source.style.borderRadius=`${c.radius}px ${c.radius}px 0 0`;
 image.style.transform=`scale(${effects.zoom/100})`;image.style.transformOrigin=`${fill.x}% ${fill.y}%`;image.style.filter=`brightness(${effects.brightness/100}) saturate(${effects.saturation/100})`;
 return r;
}
export const REFLECTION_CSS=`
.otl-avatar-reflection{position:absolute!important;left:0!important;top:0!important;pointer-events:none!important;box-sizing:border-box!important;transform-origin:50% 100%!important;transition:none!important;z-index:1!important}
.otl-avatar-reflection .otl-reflection-window{position:absolute!important;left:0!important;width:100%!important;overflow:hidden!important;pointer-events:none!important;mask-image:linear-gradient(#000,transparent)!important;-webkit-mask-image:linear-gradient(#000,transparent)!important;mask-size:100% 100%!important;mask-repeat:no-repeat!important;opacity:var(--otl-reflection-opacity)!important}
.otl-avatar-reflection .otl-reflection-source{position:relative!important;top:calc(0px - var(--otl-reflection-source-offset,0px))!important;width:100%!important;height:var(--ol-photo-height)!important;transform:scaleY(-1)!important;transform-origin:50% 50%!important;overflow:hidden!important;clip-path:polygon(var(--sc-avatar-clip))!important;pointer-events:none!important}
.otl-avatar-reflection img{position:relative!important;display:block!important;box-sizing:border-box!important;width:100%!important;height:100%!important;min-width:0!important;max-width:none!important;object-fit:cover!important;border:0!important;box-shadow:none!important;outline:0!important;pointer-events:none!important;transform-origin:var(--otl-reflection-origin)!important;transform:scale(var(--otl-reflection-zoom))!important;filter:brightness(var(--otl-reflection-brightness)) saturate(var(--otl-reflection-saturation))!important;object-position:var(--otl-reflection-object)!important}
body.documentstyle .otl-avatar-reflection,body.hideChatAvatars .otl-avatar-reflection,[data-otl-live-avatar-hidden=true] .otl-avatar-reflection{display:none!important}
`;
