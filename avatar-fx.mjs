export const AVATAR_FX = Object.freeze({sparkle:'星芒闪烁',breathe:'呼吸光',sweep:'偶尔扫光',snow:'轻量飘雪',float:'漂浮光点'});
const PARTICLE_X = [12,72,34,88,51,23,63,42,80,8,57,95];
const PARTICLE_Y = [16,46,78,24,60,38,87,8,69,56,32,93];
const SNOWFLAKE = [[45,0],[55,0],[55,35],[85,15],[92,25],[62,45],[100,45],[100,55],[62,55],[92,75],[85,85],[55,65],[55,100],[45,100],[45,65],[15,85],[8,75],[38,55],[0,55],[0,45],[38,45],[8,25],[15,15],[45,35]];
const snowflakeClip = 'polygon('+SNOWFLAKE.map(([x,y])=>`${x}% ${y}%`).join(',')+')';
export const particleFx=fx=>fx?.kind==='snow'||fx?.kind==='float';
export const avatarFxParts=fx=>particleFx(fx)?fx.density??6:3;
export function syncAvatarFxParts(root,document,fx){
 const count=avatarFxParts(fx);while(root.children.length>count)root.lastElementChild.remove();
 while(root.children.length<count){const part=document.createElement('span'),i=root.children.length;part.style.cssText=`--otl-p-x:${PARTICLE_X[i]};--otl-p-y:${PARTICLE_Y[i]};--otl-p-duration:${11+(i%5)*1.7};--otl-p-delay:${-2.1-i*2.73};--otl-p-drift:${i%2?1:-1};`;root.append(part);}
}
export function validateAvatarFx(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==(3+['size','strength','density','speed'].filter(k=>Object.hasOwn(value,k)).length)||Object.keys(value).some(k=>!['kind','motion','color','size','strength','density','speed'].includes(k))||typeof value.kind!=='string'||!Object.hasOwn(AVATAR_FX,value.kind)||typeof value.motion!=='boolean'||typeof value.color!=='string'||!/^#[a-f0-9]{6}$/i.test(value.color))throw Error('头像特效无效');
 const out={kind:value.kind,motion:value.motion,color:value.color};
 for(const [key,min,max]of [['size',50,200],['strength',25,200]])if(Object.hasOwn(value,key)){if(!Number.isFinite(value[key])||value[key]<min||value[key]>max)throw Error('头像特效参数无效：'+key);out[key]=value[key];}
 for(const [key,min,max]of [['density',3,12],['speed',50,200]])if(Object.hasOwn(value,key)){if(!Number.isFinite(value[key])||value[key]<min||value[key]>max||(key==='density'&&!Number.isInteger(value[key])))throw Error('头像特效参数无效：'+key);out[key]=value[key];}
 return out;
}
export function avatarFxTuning(fx){return {size:(fx.size??100)/100,strength:(fx.strength??100)/100};}
// The same static tile is reused by all live avatars with this recipe.
export function avatarSnowTile(fx){
 const {size}=avatarFxTuning(fx);
 const flake=`<polygon points="${SNOWFLAKE.map(point=>point.join(',')).join(' ')}"/>`;
 const dot='<circle cx="50" cy="50" r="50"/>';
 const particles=Array.from({length:avatarFxParts(fx)},(_,i)=>{
  const isFlake=i%2===0,pct=Number(((isFlake?3.5:1.9)*size).toFixed(4));
  const limit=Number(((isFlake?10:5.5)*size).toFixed(4));
  const width=`clamp(${isFlake?3:2}px,${pct}%,${limit}px)`;
  return `<svg x="${PARTICLE_X[i]}%" y="${PARTICLE_Y[i]}%" width="${pct}%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMinYMin meet" style="width:${width}">${isFlake?flake:dot}</svg>`;
 });
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="${fx.color}">${particles.join('')}</svg>`;
 return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
const staticOpacity=(base,strength)=>Math.min(.95,base*strength);
// Shared once by the live stylesheet. Animation never changes layout or paint filters.
export const AVATAR_FX_CSS=`
.otl-avatar-fx{pointer-events:none!important;position:absolute!important;left:0!important;top:0!important;box-sizing:border-box!important;overflow:hidden!important;z-index:2!important;isolation:isolate;transition:none!important}
.otl-avatar-fx>span{position:absolute;display:none;pointer-events:none;animation-play-state:paused!important}
.otl-avatar-fx[data-fx-kind=sparkle]>span{display:block;width:calc(9% * var(--otl-fx-size,1));aspect-ratio:1;max-width:calc(20px * var(--otl-fx-size,1));min-width:calc(4px * var(--otl-fx-size,1));background:currentColor;clip-path:polygon(50% 0,60% 38%,100% 50%,60% 62%,50% 100%,40% 62%,0 50%,40% 38%);opacity:min(.95,calc(.55 * var(--otl-fx-strength,1)));transform:scale(.8);animation:otl-fx-star 5s ease-in-out infinite}
.otl-avatar-fx[data-fx-kind=sparkle]>span:nth-child(1){left:23%;top:17%}
.otl-avatar-fx[data-fx-kind=sparkle]>span:nth-child(2){left:70%;top:40%;animation-delay:-1.7s;width:calc(6% * var(--otl-fx-size,1))}
.otl-avatar-fx[data-fx-kind=sparkle]>span:nth-child(3){left:34%;top:77%;animation-delay:-3.4s;width:calc(5% * var(--otl-fx-size,1))}
.otl-avatar-fx[data-fx-kind=breathe]>span:first-child{display:block;inset:0;background:radial-gradient(ellipse at 50% 40%,currentColor,transparent calc(72% * var(--otl-fx-size,1)));opacity:min(.95,calc(.16 * var(--otl-fx-strength,1)));transform:scale(1);animation:otl-fx-breathe 6s ease-in-out infinite}
.otl-avatar-fx[data-fx-kind=sweep]>span:first-child{display:block;left:-65%;top:-30%;height:160%;width:calc(52% * var(--otl-fx-size,1));background:linear-gradient(105deg,transparent,currentColor,transparent);opacity:min(.95,calc(.12 * var(--otl-fx-strength,1)));transform:translateX(calc(190% / var(--otl-fx-size,1) - 50%));animation:otl-fx-sweep 9s ease-in-out infinite}
.otl-avatar-fx:is([data-fx-kind=snow],[data-fx-kind=float])>span{display:block;left:calc(var(--otl-p-x) * 1%);top:calc(var(--otl-p-y) * 1%);width:clamp(3px,calc(3.5% * var(--otl-fx-size,1)),calc(10px * var(--otl-fx-size,1)));aspect-ratio:1;background:currentColor;opacity:min(.95,calc(.7 * var(--otl-fx-strength,1)));animation:none;transform:none}
.otl-avatar-fx[data-fx-kind=snow]>span:nth-child(odd){clip-path:${snowflakeClip}}
.otl-avatar-fx[data-fx-kind=snow]>span:nth-child(even){border-radius:50%;width:clamp(2px,calc(1.9% * var(--otl-fx-size,1)),calc(5.5px * var(--otl-fx-size,1)))}
.otl-avatar-fx[data-fx-kind=float]>span{border-radius:50%;background:radial-gradient(circle,currentColor 0 15%,transparent 72%);width:clamp(4px,calc(5% * var(--otl-fx-size,1)),calc(16px * var(--otl-fx-size,1)))}
.otl-avatar-fx:is([data-fx-kind=snow],[data-fx-kind=float])[data-fx-motion=true]>span{top:0;animation:otl-fx-snow calc(var(--otl-p-duration) * 1s / var(--otl-fx-speed,1)) linear infinite;animation-delay:calc(var(--otl-p-delay) * 1s / var(--otl-fx-speed,1))}
.otl-avatar-fx[data-fx-kind=float][data-fx-motion=true]>span{top:100%;animation-name:otl-fx-float;animation-timing-function:ease-in-out}
.otl-avatar-fx[data-fx-play=true]>span{animation-play-state:running!important}
.otl-avatar-fx[data-fx-motion=false]>span{animation:none!important}
@keyframes otl-fx-star{0%,100%{opacity:min(.95,calc(.18 * var(--otl-fx-strength,1)));transform:scale(.65)}45%{opacity:min(.95,calc(.8 * var(--otl-fx-strength,1)));transform:scale(1)}}
@keyframes otl-fx-breathe{0%,100%{opacity:min(.95,calc(.08 * var(--otl-fx-strength,1)));transform:scale(.98)}50%{opacity:min(.95,calc(.24 * var(--otl-fx-strength,1)));transform:scale(1.04)}}
@keyframes otl-fx-sweep{0%,72%{opacity:0;transform:translateX(calc(-80% / var(--otl-fx-size,1)))}78%{opacity:min(.95,calc(.26 * var(--otl-fx-strength,1)))}94%,100%{opacity:0;transform:translateX(calc(390% / var(--otl-fx-size,1)))}}
@keyframes otl-fx-snow{0%{opacity:0;transform:translate3d(0,calc(var(--otl-fx-height) * -.12),0)}12%,85%{opacity:min(.95,calc(.7 * var(--otl-fx-strength,1)))}100%{opacity:0;transform:translate3d(calc(var(--otl-p-drift) * 15px),calc(var(--otl-fx-height) * 1.08),0)}}
@keyframes otl-fx-float{0%{opacity:0;transform:translate3d(0,0,0) scale(.7)}15%,70%{opacity:min(.9,calc(.6 * var(--otl-fx-strength,1)))}100%{opacity:0;transform:translate3d(calc(var(--otl-p-drift) * 18px),calc(var(--otl-fx-height) * -.9),0) scale(1.1)}}
@media(prefers-reduced-motion:no-preference){
.otl-avatar-fx[data-fx-kind=snow][data-fx-motion=true]>span{display:none;animation:none!important}
.otl-avatar-fx[data-fx-kind=snow][data-fx-motion=true]::after{content:"";position:absolute;inset:-100% 0 auto;height:200%;background:var(--otl-fx-snow-tile) 0 0/100% 50% repeat-y;opacity:min(.95,calc(.7 * var(--otl-fx-strength,1)));animation:otl-fx-snow-tile calc(14.4s / var(--otl-fx-speed,1)) linear infinite paused}
.otl-avatar-fx[data-fx-kind=snow][data-fx-motion=true][data-fx-play=true]::after{animation-play-state:running}
}
@keyframes otl-fx-snow-tile{to{transform:translateY(50%)}}
@media(prefers-reduced-motion:reduce){.otl-avatar-fx>span{animation:none!important}}
@media(prefers-reduced-motion:reduce){.otl-avatar-fx:is([data-fx-kind=snow],[data-fx-kind=float])>span{top:calc(var(--otl-p-y) * 1%)!important;transform:none!important}}
body.documentstyle .otl-avatar-fx,body.hideChatAvatars .otl-avatar-fx,[data-otl-live-avatar-hidden=true] .otl-avatar-fx{display:none!important}
`;
export function createAvatarFxNode(document,fx,{owned=true}={}){
 const root=document.createElement('div');root.className=owned?'otl-avatar-fx':'otl-avatar-fx-preview';root.setAttribute('aria-hidden','true');if(owned)root.setAttribute('data-otl-live-owned','');
 root.setAttribute('data-fx-kind',fx.kind);root.setAttribute('data-fx-motion','false');root.setAttribute('data-fx-play','false');
 syncAvatarFxParts(root,document,fx);
 return root;
}
// Small combination thumbnails intentionally show the static form only.
export function styleStaticAvatarFx(root,fx){
 const {size,strength}=avatarFxTuning(fx);root.style.color=fx.color;root.style.pointerEvents='none';root.style.overflow='hidden';
 const spans=[...root.children];
 for(const part of spans)part.style.cssText='position:absolute;display:none;pointer-events:none';
 if(fx.kind==='sparkle')spans.forEach((part,i)=>{part.style.cssText=`position:absolute;width:${[9,6,5][i]*size}%;max-width:${20*size}px;min-width:${4*size}px;aspect-ratio:1;background:${fx.color};clip-path:polygon(50% 0,60% 38%,100% 50%,60% 62%,50% 100%,40% 62%,0 50%,40% 38%);opacity:${staticOpacity(.55,strength)};transform:scale(.8);left:${[23,70,34][i]}%;top:${[17,40,77][i]}%`;});
 else if(fx.kind==='breathe')spans[0].style.cssText=`position:absolute;inset:0;background:radial-gradient(ellipse at 50% 40%,${fx.color},transparent ${72*size}%);opacity:${staticOpacity(.16,strength)}`;
 else if(fx.kind==='sweep')spans[0].style.cssText=`position:absolute;left:${33.8-26*size}%;top:-30%;width:${52*size}%;height:160%;background:linear-gradient(105deg,transparent,${fx.color},transparent);opacity:${staticOpacity(.12,strength)}`;
 else spans.forEach((part,i)=>{const snow=fx.kind==='snow',flake=snow&&i%2===0,percent=snow?(flake?3.5:1.9):5,min=snow?(flake?3:2):4,max=snow?(flake?10:5.5):16;part.style.cssText=`position:absolute;left:${PARTICLE_X[i]}%;top:${PARTICLE_Y[i]}%;width:clamp(${min}px,${percent*size}%,${max*size}px);aspect-ratio:1;${flake?`clip-path:${snowflakeClip};`:'border-radius:50%;'}background:${snow?fx.color:`radial-gradient(circle,${fx.color},transparent 72%)`};opacity:${staticOpacity(.7,strength)}`;});
}
