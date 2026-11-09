import {validImage, newLayer} from './layers.mjs';
import {ASSETS} from './catalog.mjs';

export function defaultPhoto(overrides={}) {
  return {enabled:false,size:88,radius:16,widthPercent:44,maxSize:190,ratio:'1',frameWidth:3,frameColor:'#fffdf4',outlineColor:'#e1d8c8',shadow:true,photoRotation:0,x:0,y:0,scale:1,rotation:0,image:'',asset:'',...overrides};
}
export function validatePhotos(raw) {
  if(raw===undefined)return {ai:defaultPhoto(),user:defaultPhoto()};
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('头像设置格式无效');
  const result={};
  for(const scope of ['ai','user']) {
    const p=raw[scope];if(!p||typeof p!=='object'||Array.isArray(p))throw Error('头像设置无效：'+scope);
    const out=defaultPhoto();
    for(const [key,min,max] of [['size',40,300],['radius',0,150],['widthPercent',20,65],['maxSize',80,300],['frameWidth',0,15],['photoRotation',-20,20],['x',-80,80],['y',-80,80],['scale',.5,1.5],['rotation',-20,20]]) {
      if(['size','radius'].includes(key)&&p[key]===undefined)continue;
      if(!Number.isFinite(p[key])||p[key]<min||p[key]>max)throw Error('头像参数超出范围：'+key);out[key]=p[key];
    }
    for(const key of ['frameColor','outlineColor']) {if(typeof p[key]!=='string'||!/^#[a-f0-9]{6}$/i.test(p[key]))throw Error('头像颜色无效');out[key]=p[key];}
    for(const key of ['enabled','shadow']) {if(typeof p[key]!=='boolean')throw Error('头像开关无效');out[key]=p[key];}
    if(!['1','0.8','0.75','1.3333333333333333'].includes(p.ratio))throw Error('头像比例无效');out.ratio=p.ratio;
    if(p.image&&!validImage(p.image))throw Error('头像图片格式无效');out.image=p.image||'';
    if(p.asset&&!Object.hasOwn(ASSETS,p.asset))throw Error('头像素材无效');out.asset=p.asset||'';
    result[scope]=out;
  }
  return result;
}

export function collageMetrics(width, headerHeight, metaHeight, photoHeight) {
  const normal=Math.min(headerHeight, Math.max(180,headerHeight*width/390));
  const stacked=metaHeight>normal*.65;
  return {stacked,height:stacked?Math.max(normal,metaHeight+photoHeight+46):Math.max(normal,photoHeight+30)};
}

export function kittyLayers() {
  const asset=(id,scope,options)=>newLayer('asset',{name:ASSETS[id].name,asset:id,scope,opacity:1,...options});
  return [
    asset('kitty-ai-window','ai',{width:31,widthUnit:'percent',heightPercent:88,anchor:'header',vertical:'bottom',x:0,y:22,z:0}),
    asset('kitty-user-window','user',{width:34,widthUnit:'percent',heightPercent:92,anchor:'header',vertical:'bottom',x:0,y:15,z:0}),
    asset('kitty-ai-cat','ai',{anchor:'avatar',side:'right',width:58,widthUnit:'percent',x:-14,y:-16,offsetUnit:'percent',z:4}),
    newLayer('tape',{name:'AI 照片顶部纸胶带',scope:'ai',anchor:'avatar',side:'left',width:22,widthUnit:'percent',x:10,y:-6,offsetUnit:'percent',rotation:11,opacity:.55,z:3}),
    newLayer('tape',{name:'用户照片顶部纸胶带',scope:'user',anchor:'avatar',side:'left',width:22,widthUnit:'percent',x:10,y:-6,offsetUnit:'percent',rotation:11,opacity:.55,z:3}),
    asset('kitty-ai-paper','ai',{anchor:'avatar',width:8,widthUnit:'percent',side:'right',x:-13,y:0,vertical:'bottom',z:0,opacity:.7}),
    asset('kitty-user-tape','user',{anchor:'avatar',side:'right',width:13,widthUnit:'percent',x:-20,y:12,offsetUnit:'percent',z:3,opacity:.85}),
    asset('kitty-user-sprig','user',{anchor:'avatar',side:'right',width:33,widthUnit:'percent',x:-32,y:0,vertical:'bottom',offsetUnit:'percent',z:3}),
    asset('kitty-user-cream','user',{anchor:'avatar',side:'right',width:10,widthUnit:'percent',x:-50,y:-3,vertical:'bottom',offsetUnit:'percent',z:1,opacity:.5}),
  ];
}
