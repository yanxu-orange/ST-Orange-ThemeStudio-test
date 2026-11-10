// Upload limits are provisional test-version bounds, not device memory guarantees.
export const MAX_UPLOAD_BYTES = 16 * 1024 * 1024;
export const MAX_UPLOAD_PIXELS = 16000000;
export const OPTIMIZE_MIN_BYTES = 64 * 1024;
const MIN_SAVING_BYTES = 16 * 1024;
const fail = message => Object.assign(new Error(message), {code:'IMAGE_INPUT'});
const text = (b,start,length) => String.fromCharCode(...b.subarray(start,start+length));

// JPEG dimensions used for display must follow the browser's EXIF orientation.
function exifOrientation(b,start,end) {
  if(text(b,start,6)!=='Exif\0\0')return null;
  const t=start+6;if(t+8>end)return null;const v=new DataView(b.buffer,b.byteOffset,b.byteLength),little=text(b,t,2)==='II';
  if(!little&&text(b,t,2)!=='MM')return null;
  if(v.getUint16(t+2,little)!==42)return null;
  const directory=t+v.getUint32(t+4,little);if(directory<t||directory+2>end)return null;
  const count=v.getUint16(directory,little);
  for(let i=0;i<count;i++){const p=directory+2+i*12;if(p+12>end)break;if(v.getUint16(p,little)===0x112&&v.getUint16(p+2,little)===3&&v.getUint32(p+4,little)===1)return v.getUint16(p+8,little);}
  return null;
}

/** Read raster headers before decoding. Never run an animated image through Canvas. */
export function inspectImageBytes(bytes) {
  const b=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes),v=new DataView(b.buffer,b.byteOffset,b.byteLength);
  let mime='',width=0,height=0,animated=false;
  if(b.length>=24&&text(b,0,8)==='\x89PNG\r\n\x1a\n'){
    mime='image/png';width=v.getUint32(16);height=v.getUint32(20);
    for(let p=8;p+12<=b.length;){const size=v.getUint32(p),kind=text(b,p+4,4);if(size>b.length-p-12)throw fail('PNG 文件不完整，请重新选择。');if(kind==='acTL')animated=true;p+=12+size;if(kind==='IEND')break;}
  }else if(b.length>=10&&/^GIF8[79]a$/.test(text(b,0,6))){
    mime='image/gif';width=v.getUint16(6,true);height=v.getUint16(8,true);animated=true;
  }else if(b.length>=12&&text(b,0,4)==='RIFF'&&text(b,8,4)==='WEBP'){
    mime='image/webp';
    if(v.getUint32(4,true)+8>b.length)throw fail('WebP 文件不完整，请重新选择。');
    for(let p=12;p+8<=b.length;){const kind=text(b,p,4),size=v.getUint32(p+4,true),d=p+8;if(size>b.length-d)throw fail('WebP 文件不完整，请重新选择。');
      if(kind==='VP8X'&&size>=10){animated=!!(b[d]&2);width=1+b[d+4]+(b[d+5]<<8)+(b[d+6]<<16);height=1+b[d+7]+(b[d+8]<<8)+(b[d+9]<<16);}
      if(kind==='ANIM'||kind==='ANMF')animated=true;
      if(!width&&kind==='VP8 '&&size>=10&&b[d+3]===0x9d&&b[d+4]===1&&b[d+5]===0x2a){width=v.getUint16(d+6,true)&0x3fff;height=v.getUint16(d+8,true)&0x3fff;}
      if(!width&&kind==='VP8L'&&size>=5&&b[d]===0x2f){width=1+b[d+1]+((b[d+2]&0x3f)<<8);height=1+(b[d+2]>>6)+(b[d+3]<<2)+((b[d+4]&15)<<10);}
      p=d+size+(size&1);
    }
  }else if(b.length>=4&&b[0]===255&&b[1]===216){
    mime='image/jpeg';let orientation=1;
    for(let p=2;p+3<b.length;){if(b[p++]!==255)throw fail('JPEG 文件结构无效。');while(b[p]===255)p++;const marker=b[p++];if(marker===0xd9||marker===0xda)break;if(marker===0x01||(marker>=0xd0&&marker<=0xd7))continue;const size=v.getUint16(p);if(size<2||p+size>b.length)throw fail('JPEG 文件不完整，请重新选择。');if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)&&size>=7){height=v.getUint16(p+3);width=v.getUint16(p+5);}if(marker===0xe1)orientation=exifOrientation(b,p+2,p+size)??orientation;p+=size;}
    if(orientation>=5&&orientation<=8)[width,height]=[height,width];
  }
  if(!mime||!width||!height)throw fail('无法识别图片尺寸，请选择完整的 PNG、JPG、WebP 或 GIF。');
  return {mime,width,height,animated};
}
export async function inspectImageBlob(blob){return inspectImageBytes(await blob.arrayBuffer());}
export function dataUrlToBlob(source){const [head,data]=source.split(',',2),binary=atob(data),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));return new Blob([bytes],{type:head.slice(5).split(';')[0]});}
export function blobToDataUrl(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(fail('图片读取失败，请重新选择。'));reader.readAsDataURL(blob);});}
export async function decodeImageBlob(blob){
  if(typeof createImageBitmap==='function')return createImageBitmap(blob);
  const url=URL.createObjectURL(blob),image=new Image();try{image.src=url;await image.decode();return image;}finally{URL.revokeObjectURL(url);}
}
export async function encodeOnCurrentThread(blob,{width,height}={}){
  const image=await decodeImageBlob(blob);let canvas;
  try{const w=width||image.width||image.naturalWidth,h=height||image.height||image.naturalHeight;
    if(typeof OffscreenCanvas==='function')canvas=new OffscreenCanvas(w,h);else{canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;}
    const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(image,0,0,w,h);
    const output=canvas.convertToBlob?await canvas.convertToBlob({type:'image/webp',quality:.9}):await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Image encode failed')),'image/webp',.9));
    if(output.type!=='image/webp')throw Error('WebP encoder unavailable');
    const check=await inspectImageBlob(output);if(check.width!==w||check.height!==h||check.animated)throw Error('Image output mismatch');return output;
  }finally{image.close?.();if(canvas){canvas.width=1;canvas.height=1;}}
}
let queue=Promise.resolve(),workerUnavailable=false;
const aborted = () => new DOMException('图片处理已取消','AbortError');
function encodeInWorker(blob,options,signal){return new Promise((resolve,reject)=>{
  let worker;const finish=(error,value)=>{signal?.removeEventListener('abort',cancel);worker?.terminate();error?reject(error):resolve(value);},cancel=()=>finish(aborted());
  if(signal?.aborted){reject(aborted());return;}
  try{worker=new Worker(new URL('./image-worker.mjs',import.meta.url),{type:'module'});}catch(error){workerUnavailable=true;reject(error);return;}
  signal?.addEventListener('abort',cancel,{once:true});
  worker.onmessage=({data})=>{if(data.unsupported)workerUnavailable=true;finish(data.error?Error(data.error):null,data.blob);};
  worker.onerror=()=>{workerUnavailable=true;finish(Error('Image worker unavailable'));};worker.postMessage({blob,options});
});}
/** Shared serial queue; cancelled uploads are skipped before decoding the next file. */
export function encodeImageBlob(blob,{valid=()=>true,signal,...options}={}){
  const run=async()=>{if(signal?.aborted||!valid())throw aborted();
    if(typeof Worker==='function'&&!workerUnavailable){try{return await encodeInWorker(blob,options,signal);}catch(error){if(error.name==='AbortError'||!valid())throw aborted();if(!workerUnavailable)throw error;}}
    if(signal?.aborted||!valid())throw aborted();return encodeOnCurrentThread(blob,options);
  };const next=queue.then(run,run);queue=next.catch(()=>{});return next;
}
export function worthwhileImage(originalBytes,outputBytes){return outputBytes<=originalBytes*.9&&originalBytes-outputBytes>=MIN_SAVING_BYTES;}
export async function prepareImageUpload(file,{valid=()=>true,signal}={}){
  if(!Number.isFinite(file.size)||file.size<=0)throw fail('图片文件为空，请重新选择。');
  if(file.size>MAX_UPLOAD_BYTES)throw fail('超过测试版单张 16 MiB 上限，尚未添加。');
  const info=await inspectImageBlob(file);if(!valid())return null;
  if(info.width*info.height>MAX_UPLOAD_PIXELS)throw fail('超过测试版 1600 万像素上限，尚未添加。');
  // Content headers, not a missing/incorrect OS MIME label, determine the format.
  let source=file.type===info.mime?file:new Blob([file],{type:info.mime}),optimized=false;
  if(!info.animated&&file.size>=OPTIMIZE_MIN_BYTES){try{const candidate=await encodeImageBlob(source,{valid,signal});if(!valid())return null;if(worthwhileImage(file.size,candidate.size)){source=candidate;optimized=true;}}catch(error){if(error.name==='AbortError'||signal?.aborted||!valid())return null;/* Preserve the source when this browser cannot encode WebP. */}}
  if(!valid())return null;
  const decoded=await decodeImageBlob(source);try{if(!(decoded.width||decoded.naturalWidth)||!(decoded.height||decoded.naturalHeight))throw fail('图片读取失败，请重新选择。');}finally{decoded.close?.();}
  if(!valid())return null;const image=await blobToDataUrl(source);if(!valid())return null;
  return {image,bytes:source.size,originalBytes:file.size,optimized,...info};
}
