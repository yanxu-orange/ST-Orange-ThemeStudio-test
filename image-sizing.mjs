// Optional image-only contract. Missing settings retain legacy fitting boxes.
const units=['px','percent'];
export function validateImageSizing(v,{limit=500}={}){
 if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!['mode','fit','height','heightUnit','lockRatio','ratio','driver','focalX','focalY','footerBase'].includes(k)))throw Error('图片尺寸字段无效');
 if(!['contain','cover','fill'].includes(v.fit)||!['manual','cover'].includes(v.mode)||!units.includes(v.heightUnit)||!['width','height'].includes(v.driver)||typeof v.lockRatio!=='boolean')throw Error('图片尺寸选项无效');
 if(!Number.isFinite(v.height)||v.height<1||v.height>limit||!Number.isFinite(v.ratio)||v.ratio<=0||v.ratio>10000)throw Error('图片尺寸或比例无效');
 for(const k of ['focalX','focalY'])if(!Number.isFinite(v[k])||v[k]<0||v[k]>100)throw Error('图片取景位置无效');
 if(v.footerBase!==undefined&&(!Number.isFinite(v.footerBase)||v.footerBase<=0||v.footerBase>100000))throw Error('尾部图片区域高度无效');
 return {...v};
}
export function imageSizeStyle(layer){
 const s=layer.imageSizing;if(!s)return null;
 const width=layer.width+(layer.widthUnit==='percent'?'%':'px'),height=s.height+(s.heightUnit==='percent'?'%':'px');
 return {width:s.mode==='cover'?'100%':s.lockRatio&&s.driver==='height'?'auto':width,height:s.mode==='cover'?'100%':s.lockRatio&&s.driver==='width'?'auto':height,aspectRatio:s.mode==='manual'&&s.lockRatio?String(s.ratio):'auto',objectFit:s.mode==='cover'?'cover':s.fit,objectPosition:`${s.focalX}% ${s.focalY}%`};
}
export function imageDimensions(layer,region){
 const s=layer.imageSizing,w=layer.width*(layer.widthUnit==='percent'?region.width/100:1);
 if(!s)return {width:w,height:layer.heightPercent?region.height*layer.heightPercent/100:w/(region.ratio||1)};
 if(s.mode==='cover')return {width:region.width,height:region.height};
 const h=s.height*(s.heightUnit==='percent'?region.height/100:1);
 return s.lockRatio?s.driver==='width'?{width:w,height:w/s.ratio}:{width:h*s.ratio,height:h}:{width:w,height:h};
}
export function requireImageRegion(r){if(!r||![r.width,r.height,r.ratio].every(n=>Number.isFinite(n)&&n>0))throw Error('请先显示图片所在区域并等待图片加载，再调整尺寸。');return r;}
export function enableImageSizing(layer,region){
 const limit=region.limit||500;
 if(layer.imageSizing)return;
 requireImageRegion(region);
 const box=imageDimensions(layer,region);
 layer.imageSizing={mode:'manual',fit:'contain',height:box.height<=limit?box.height:box.height/region.height*100,heightUnit:box.height<=limit?'px':'percent',lockRatio:true,ratio:box.width/box.height,driver:'width',focalX:layer.side==='left'?0:100,focalY:layer.vertical==='top'?0:100};
 validateImageSizing(layer.imageSizing,{limit});
}
const rounded=n=>Math.round(n*10000)/10000;
export function editImageSize(layer,key,value,region){
 requireImageRegion(region);const limit=region.limit||500;
 const next=structuredClone(layer);enableImageSizing(next,region);const s=next.imageSizing;if(layer.anchor==='footer'&&s.footerBase===undefined)s.footerBase=region.height;
 // Leaving cover takes its visible box, not stale dimensions from before cover.
 if(s.mode==='cover'&&!['focalX','focalY'].includes(key)){
  next.width=100;next.widthUnit='percent';s.height=100;s.heightUnit='percent';s.mode='manual';s.fit='cover';s.ratio=region.width/region.height;
 }
 const dimensions=imageDimensions(next,region);
 if(key==='widthUnit'||key==='heightUnit'){
  if(!units.includes(value))throw Error('图片单位无效');
  const axis=key==='widthUnit'?'width':'height',n=rounded(dimensions[axis]/(value==='percent'?region[axis]/100:1));
  if(n<1||n>limit)throw Error(`换算后尺寸超出 1–${limit} 范围，请保留原单位。`);
  if(axis==='width'){next.width=n;next.widthUnit=value;}else {s.height=n;s.heightUnit=value;}
 }else if(key==='width'||key==='height'){
  if(!Number.isFinite(value)||value<1||value>limit)throw Error(`图片尺寸须为 1–${limit}`);
  if(key==='width')next.width=value;else s.height=value;s.driver=key;
 }else if(key==='lockRatio'){
  s.lockRatio=value;
  // Capture current box when locking; retain both axes when unlocking.
  if(value){s.ratio=dimensions.width/dimensions.height;s.driver='width';}
  else {s.fit='fill';next.width=rounded(dimensions.width/(next.widthUnit==='percent'?region.width/100:1));s.height=rounded(dimensions.height/(s.heightUnit==='percent'?region.height/100:1));}
 }else if(['focalX','focalY'].includes(key))s[key]=value;
 validateImageSizing(s,{limit});if(!Number.isFinite(next.width)||next.width<1||next.width>limit)throw Error('换算后宽度超出范围，请保留当前设置。');return next;
}
export function coverImage(layer,region){requireImageRegion(region);const next=structuredClone(layer);enableImageSizing(next,region);next.width=100;next.widthUnit='percent';next.imageSizing={...next.imageSizing,mode:'cover',fit:'cover',lockRatio:true,ratio:region.width/region.height,driver:'width',height:100,heightUnit:'percent',focalX:50,focalY:50,...(layer.anchor==='footer'?{footerBase:region.height}:{})};next.side='left';next.vertical='top';next.x=0;next.y=0;return next;}
// Absolute pixel edits do not need an on-screen region. Percent conversions do.
export function editImagePixels(layer,key,value,ratio,limit=500){
 if(!['width','height','lockRatio'].includes(key)||layer.widthUnit!=='px'||layer.heightPercent>0&&!layer.imageSizing||layer.imageSizing&&(layer.imageSizing.mode==='cover'||layer.imageSizing.heightUnit!=='px'))throw Error('请先显示图片所在区域，再换算百分比或铺满尺寸。');
 if(!(ratio>0&&Number.isFinite(ratio)))throw Error('请等待图片加载。');
 const n=structuredClone(layer);if(!n.imageSizing)n.imageSizing={mode:'manual',fit:'contain',height:n.width/ratio,heightUnit:'px',lockRatio:true,ratio,driver:'width',focalX:n.side==='left'?0:100,focalY:n.vertical==='top'?0:100};
 const s=n.imageSizing,w=s.lockRatio&&s.driver==='height'?s.height*s.ratio:n.width,h=s.lockRatio&&s.driver==='width'?n.width/s.ratio:s.height;
 if(key==='lockRatio'){s.lockRatio=value;n.width=w;s.height=h;s.ratio=w/h;s.driver='width';if(!value)s.fit='fill';}
 else {if(!Number.isFinite(value)||value<1||value>limit)throw Error(`图片尺寸须为 1–${limit}`);if(key==='width')n.width=value;else s.height=value;s.driver=key;}
 validateImageSizing(s,{limit});if(n.width<1||n.width>limit)throw Error('图片宽度超出范围');return n;
}
