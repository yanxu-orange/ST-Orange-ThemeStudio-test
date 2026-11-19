import {inspectImageBlob,decodeImageBlob,blobToDataUrl,MAX_UPLOAD_BYTES} from './image-processing.mjs';

export function normalizeMaskPixels(data){
 let alpha=false;for(let i=3;i<data.length;i+=4)if(data[i]<255){alpha=true;break;}
 let visible=false;
 for(let i=0;i<data.length;i+=4){const a=alpha?data[i+3]:Math.round((.2126*data[i]+.7152*data[i+1]+.0722*data[i+2])*data[i+3]/255);data[i]=data[i+1]=data[i+2]=255;data[i+3]=a;visible ||=a>0;}
 if(!visible)throw Error('遮罩没有可显示区域，请选择有不透明轮廓或白色区域的图片。');
 return alpha?'alpha':'luminance';
}
export async function prepareAvatarMask(file,{valid=()=>true}={}){
 if(!file||!file.size||file.size>MAX_UPLOAD_BYTES)throw Error('请选择不超过16 MiB的遮罩图片。');
 const info=await inspectImageBlob(file);if(!valid())return null;
 if(info.animated)throw Error('遮罩请使用静态PNG、JPG或WebP图片。');
 if(info.width*info.height>16000000)throw Error('遮罩超过1600万像素，请缩小后再上传。');
 const image=await decodeImageBlob(file);let canvas;
 try{
  if(!valid())return null;
  const scale=Math.min(1,2048/Math.max(info.width,info.height)),width=Math.max(1,Math.round(info.width*scale)),height=Math.max(1,Math.round(info.height*scale));
  canvas=typeof OffscreenCanvas==='function'?new OffscreenCanvas(width,height):Object.assign(document.createElement('canvas'),{width,height});
  const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('当前浏览器无法读取遮罩图片。');
  ctx.drawImage(image,0,0,width,height);const pixels=ctx.getImageData(0,0,width,height),mode=normalizeMaskPixels(pixels.data);ctx.putImageData(pixels,0,0);
  const blob=canvas.convertToBlob?await canvas.convertToBlob({type:'image/png'}):await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('遮罩转换失败。')),'image/png'));
  if(!valid())return null;const imageUrl=await blobToDataUrl(blob);if(!valid())return null;return{image:imageUrl,width,height,mode};
 }finally{image.close?.();if(canvas){canvas.width=canvas.height=1;}}
}
