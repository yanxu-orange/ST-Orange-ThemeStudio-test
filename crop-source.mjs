import {inspectImageBlob,dataUrlToBlob,MAX_UPLOAD_BYTES,MAX_UPLOAD_PIXELS} from './image-processing.mjs';
export async function prepareCropSource(source,{fetcher=globalThis.fetch}={}){
 let blob;
 if(source.startsWith('data:'))blob=dataUrlToBlob(source);
 else {
  let response;try{response=await fetcher(source,{mode:'cors',credentials:'omit'});}catch{throw Error('外链不允许读取图片数据，原图未改变；可下载后上传再裁剪。');}
  if(!response.ok)throw Error('外链图片读取失败，原图未改变。');
  if(Number(response.headers?.get('content-length'))>MAX_UPLOAD_BYTES)throw Error('图片文件过大，原图未改变。');
  blob=await response.blob();
 }
 if(blob.size>MAX_UPLOAD_BYTES)throw Error('图片文件过大，原图未改变。');
 const info=await inspectImageBlob(blob);
 if(info.width*info.height>MAX_UPLOAD_PIXELS)throw Error('图片超过裁剪像素上限，原图未改变。');
 return {blob,...info};
}
export function cropOutputSize(rect){
 const width=Math.max(1,Math.round(rect.width)),height=Math.max(1,Math.round(rect.height));
 if(width*height>MAX_UPLOAD_PIXELS)throw Error('裁剪图片超过像素上限，请缩小取景。');
 return {width,height};
}
