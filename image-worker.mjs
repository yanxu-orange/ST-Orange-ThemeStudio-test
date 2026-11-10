import {encodeOnCurrentThread} from './image-processing.mjs';
self.onmessage=async({data})=>{try{if(typeof OffscreenCanvas!=='function'||typeof createImageBitmap!=='function'){self.postMessage({unsupported:true,error:'Worker image encoder unavailable'});return;}self.postMessage({blob:await encodeOnCurrentThread(data.blob,data.options)});}catch(error){self.postMessage({error:error.message});}};
