import {maskSource} from '../../../avatar-mask-style.mjs';
import {ASSETS} from '../../../catalog.mjs';
import {ICONS} from '../../../icon-catalog.mjs';
import {AVATAR_FRAME_PAIRS} from '../../../avatar-frame-pairs.mjs';
import {shapeSvg} from '../../../shape-assets.mjs';
import {legacyDecorationSvg} from '../../../legacy-decorations.mjs';
const imageChoice=v=>v?.kind==='asset'?{kind:'builtin',key:'asset:'+v.asset}:v?.kind==='custom'?{kind:'inline-or-url',value:v.image}:null;
/** Enumerate authored references without fetching, resolving, or discarding inactive data. */
export function collectReferences(config){
 const refs=[],diagnostics=[];const add=(field,region,source,active=true,reason='configured',extra={})=>{if(!source||!(source.value||source.key)||source.key==='asset:'||source.key==='asset:undefined')return;refs.push({field,region,category:'image',active:!!active,reason,...source,...extra});};
 const font=(field,region,link,active=true,reason='configured')=>{if(link?.url)add(field+'.url',region,{kind:'inline-or-url',value:link.url},active,reason,{category:'font',faceWeight:link.faceWeight||'400'});};
 const artwork=(v,field,region,active=true,reason='configured')=>{
  if(!v)return;active=active&&v.visible!==false;
  if(v.kind==='shape'){try{add(field+'.@generated',region,{kind:'generated',value:'data:image/svg+xml,'+encodeURIComponent(shapeSvg(v))},active,reason);}catch{diagnostics.push({severity:active?'error':'info',code:'SHAPE_SOURCE',field,region,reason:'Unsupported generated shape source'});}return;}
  if(v.kind==='asset'||v.kind==='custom'){add(field+(v.kind==='asset'?'.asset':'.image'),region,imageChoice(v),active,reason);if(v.kind==='custom'&&v.asset)add(field+'.asset',region,{kind:'builtin',key:'asset:'+v.asset},false,'not consumed by custom image kind');if(v.kind==='asset'&&v.image)add(field+'.image',region,{kind:'inline-or-url',value:v.image},false,'shadowed by asset kind');return;}
  const stock=v.anchor==='avatar'&&legacyDecorationSvg(v.kind);
  if(stock){add(field+'.@generated',region,{kind:'generated',value:'data:image/svg+xml,'+encodeURIComponent(stock)},active,reason);return;}
  if(v.image||v.asset){add(field+(v.image?'.image':'.asset'),region,v.image?{kind:'inline-or-url',value:v.image}:{kind:'builtin',key:'asset:'+v.asset},active,reason);if(v.image&&v.asset)add(field+'.asset',region,{kind:'builtin',key:'asset:'+v.asset},false,'shadowed by explicit image');}
 };
 const chromeSource=(v,field,region,active)=>{
  if(!v)return;const enabled=active&&['image','icon'].includes(v.mode);
  if(v.mode==='icon'&&v.icon){add(field+'.icon',region,{kind:'builtin',key:'icon:'+v.icon},enabled);if(v.image)add(field+'.image',region,{kind:'inline-or-url',value:v.image},false,'shadowed by selected icon');if(v.asset)add(field+'.asset',region,{kind:'builtin',key:'asset:'+v.asset},false,'not consumed by icon mode');}
  else{add(field+(v.image?'.image':'.asset'),region,v.image?{kind:'inline-or-url',value:v.image}:{kind:'builtin',key:'asset:'+v.asset},enabled&&v.mode==='image'||enabled&&v.mode==='icon'&&!!v.image);if(v.image&&v.asset)add(field+'.asset',region,{kind:'builtin',key:'asset:'+v.asset},false,'shadowed by image');if(v.icon)add(field+'.icon',region,{kind:'builtin',key:'icon:'+v.icon},false,'not consumed by selected mode');}
 };
 const nativeSource=(v,field,active)=>{if(!v)return;const mode=v.mode;
  if(mode==='icon'&&v.icon){add(field+'.icon','native',{kind:'builtin',key:'icon:'+v.icon},active);if(v.source)artwork(v.source,field+'.source','native',false,'shadowed by selected icon');}
  else{artwork(v.source,field+'.source','native',active&&['icon','image'].includes(mode),mode==='text'||mode==='default'?'not consumed by native display mode':'configured');if(v.icon)add(field+'.icon','native',{kind:'builtin',key:'icon:'+v.icon},false,'not consumed by selected mode');}
 };
 for(const [i,l]of (config.layers||[]).entries()){const region=l.anchor==='message'?'overall':l.anchor?.startsWith('reasoning')?'reasoning':l.anchor==='avatar'?'header':l.anchor||'header';const active=l.visible!==false&&(region!=='input'||config.chromeStyle?.input?.enabled===true);artwork(l,'layers.'+i,region,active,active?'configured':'hidden or disabled owning region');}
 for(const role of ['ai','user']){
  // The live adapter always owns native portrait sources; photos.image is not consumed there.
  artwork(config.photos?.[role],'photos.'+role,'header',false,'native portrait source is owned by SillyTavern');
  const fx=config.avatarEffects?.[role];if(fx?.frame)add('avatarEffects.'+role+'.frame.id','avatar',{kind:'builtin',key:'frame:'+fx.frame.id},true,'runtime avatar effects remain active independently of photos.enabled border switch');
  if(fx?.mask?.kind==='frame')add('avatarEffects.'+role+'.mask.image','avatar',{kind:'builtin',key:'mask:'+fx.mask.image},true);
  else{
   if(['circle','ellipse','diamond'].includes(fx?.mask?.kind))add('avatarEffects.'+role+'.mask.@generated','avatar',{kind:'generated',value:maskSource(fx.mask)},true,'static geometric alpha mask');
   if(fx?.mask?.image)add('avatarEffects.'+role+'.mask.image','avatar',{kind:'inline-or-url',value:fx.mask.image},fx.mask.kind==='custom','custom mask only');
  }
 }
 if(config.canvasWallpaper||config.canvasWallpaperAsset){add(config.canvasWallpaper?'canvasWallpaper':'canvasWallpaperAsset','canvas',config.canvasWallpaper?{kind:'inline-or-url',value:config.canvasWallpaper}:{kind:'builtin',key:'asset:'+config.canvasWallpaperAsset},false,'scheme canvas wallpaper is excluded from standalone theme; share separately');if(config.canvasWallpaper&&config.canvasWallpaperAsset)add('canvasWallpaperAsset','canvas',{kind:'builtin',key:'asset:'+config.canvasWallpaperAsset},false,'shadowed by explicit wallpaper');}
 const bg=config.reasoningStyle?.entry?.background;artwork(bg?.source,'reasoningStyle.entry.background.source','reasoning',bg?.mode==='image','only image background is consumed');
 for(const [page,v]of Object.entries(config.pageHeaders||{})){
  const base='pageHeaders.'+page;artwork(v,base,'page:'+page,v.enabled===true,'page header enabled');
  for(const [i,img]of (v.scene?.images||[]).entries())artwork(img,base+'.scene.images.'+i,'page:'+page,v.enabled===true,'page header enabled');
 }
 for(const [page,v]of Object.entries(config.pageStyle||{}))for(const [surface,art]of Object.entries(v.art||{}))artwork(art,'pageStyle.'+page+'.art.'+surface,'page:'+page,true,'page surface background');
 for(const zone of ['topbar','input']){const v=config.chromeStyle?.[zone];for(const [id,src]of Object.entries(v?.icons||{}))chromeSource(src,'chromeStyle.'+zone+'.icons.'+id,zone,v.enabled===true);}
 const island=config.chromeStyle?.topbar?.island;if(island?.icon)add('chromeStyle.topbar.island.icon','topbar',{kind:'builtin',key:'icon:'+island.icon},config.chromeStyle.topbar.enabled&&config.chromeStyle.topbar.layout==='island');
 const actions=config.nativeStyle?.actions;for(const [key,group]of [['',actions],...Object.entries(actions?.roles||{}).map(([r,v])=>['.roles.'+r,v])])for(const name of ['edit','more'])nativeSource(group?.[name],'nativeStyle.actions'+key+'.'+name,key?actions.design==='separate':actions?.design!=='separate');
 // Font references are explicit but owner activation gates ignored/dormant values.
 function fonts(v,path='',active=true,reason='configured'){
  if(!v||typeof v!=='object')return;
  if(v.fontLink)font(path+'.fontLink',fontRegion(path),v.fontLink,active,reason);
  for(const [key,child]of Object.entries(v)){if(key==='fontLink'||!child||typeof child!=='object')continue;let on=active,why=reason,next=path?path+'.'+key:key;
   if(path==='captions'||path==='footerCaptions'){on=on&&child.visible!==false&&!!child.content?.trim();why='visible nonempty caption';}
   if(path==='pageHeaders'){on=on&&child.enabled===true;why='page header enabled';}
   if(/^pageHeaders\.[^.]+$/.test(path)&&['titleStyle','titleSubtitle'].includes(key)){on=on&&v.layout==='standard'&&(key!=='titleSubtitle'||Object.values(child.texts||{}).some(t=>t.trim()));why='standard native title mode';}
   if(path==='pageHeaders.home'&&key==='native'){on=on&&v.placement==='native';why='native home header placement';}
   if(/\.scene\.texts$/.test(path)){on=on&&child.visible!==false&&!!child.content?.trim();why='visible page text';}
   if(path==='chromeStyle'&&key==='input'){on=on&&child.enabled===true&&child.fontMode==='custom';why='enabled custom input font';}
   if(path==='reasoningStyle'&&['entry','body'].includes(key)){on=on&&child.fontSource==='custom';why='custom reasoning font';}
   if(path==='metadata'){if(key==='unified')on=on&&v.design!=='separate';if(key==='roles')on=on&&v.design==='separate';}
   if(path==='nativeStyle.actions'||path==='nativeStyle.stats'){if(key==='roles')on=on&&v.design==='separate';else if(['edit','more','floor','time','tokens'].includes(key))on=on&&v.design!=='separate';}
   if(key==='label'&&child.style){on=on&&!!child.text?.trim();why='nonempty native label';}
   fonts(child,next,on,why);
  }
 }
 fonts(config);
 if(config.bodyFontLink)font('bodyFontLink','body',config.bodyFontLink);
 return {references:refs.sort((a,b)=>a.field.localeCompare(b.field)),diagnostics};
}
function fontRegion(path){return path.startsWith('page')?'pages':path.startsWith('reasoning')?'reasoning':path.startsWith('chrome')?'input':path.startsWith('common')?'global':path.startsWith('native')?'native':path.startsWith('footer')?'footer':'header';}
/** Registry paths are catalogued data only, never computed from arbitrary file or URL input. */
export function builtinDescriptors(){return Object.fromEntries([
 ...Object.entries(ASSETS).map(([id,v])=>['asset:'+id,{path:'materials/'+v.path,category:'image'}]),
 ...Object.entries(ICONS).map(([id,v])=>['icon:'+id,{path:v.file,category:'image'}]),
 ...Object.entries(AVATAR_FRAME_PAIRS).flatMap(([id,v])=>[['frame:'+id,{path:v.frame,category:'image'}],['mask:'+id,{path:v.mask,category:'image'}]]),
 ['font:spring-title',{path:'materials/fonts/spring/bodoni-moda-24pt.woff2',category:'font',licensePath:'materials/fonts/spring/LICENSE-Bodoni-Moda.txt'}],
 ['font:spring-poem',{path:'materials/fonts/spring/poem-serif-light.ttf',category:'font',licensePath:'materials/fonts/spring/LICENSE-Poem-Serif-Light.txt'}]
 ]);}
