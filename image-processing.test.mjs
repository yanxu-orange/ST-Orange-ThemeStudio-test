import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inspectImageBytes,prepareImageUpload,MAX_UPLOAD_BYTES,MAX_UPLOAD_PIXELS,worthwhileImage,dataUrlToBlob,encodeImageBlob} from './image-processing.mjs';
import {validEmbeddedImage,MAX_IMAGE_DATA_LENGTH} from './image-sources.mjs';
import {PNG_DATA} from './test-support/image-file.mjs';
const png=()=>new Uint8Array(Buffer.from(PNG_DATA.split(',')[1],'base64'));
const chunk=(name,data)=>{const out=new Uint8Array(12+data.length);new DataView(out.buffer).setUint32(0,data.length);out.set(Buffer.from(name),4);out.set(data,8);return out;};
test('headers identify static PNG and APNG before image decode',()=>{
 assert.deepEqual(inspectImageBytes(png()),{mime:'image/png',width:1,height:1,animated:false});
 const base=png(),ac=chunk('acTL',new Uint8Array(8)),apng=new Uint8Array(base.length+ac.length);apng.set(base.subarray(0,33));apng.set(ac,33);apng.set(base.subarray(33),33+ac.length);assert.equal(inspectImageBytes(apng).animated,true);
 const huge=png();new DataView(huge.buffer).setUint32(16,MAX_UPLOAD_PIXELS+1);assert.equal(inspectImageBytes(huge).width,MAX_UPLOAD_PIXELS+1);
});
test('GIF and VP8X animated WebP preserve their format intent; static lossy/lossless WebP dimensions parse',()=>{
 const gif=Uint8Array.from([...Buffer.from('GIF89a'),8,0,9,0]);assert.deepEqual(inspectImageBytes(gif),{mime:'image/gif',width:8,height:9,animated:true});
 const webp=(kind,data)=>{const b=new Uint8Array(20+data.length);b.set(Buffer.from('RIFF'));new DataView(b.buffer).setUint32(4,b.length-8,true);b.set(Buffer.from('WEBP'+kind),8);new DataView(b.buffer).setUint32(16,data.length,true);b.set(data,20);return b;};
 assert.deepEqual(inspectImageBytes(webp('VP8X',[2,0,0,0,7,0,0,8,0,0])),{mime:'image/webp',width:8,height:9,animated:true});
 assert.deepEqual(inspectImageBytes(webp('VP8 ',[0,0,0,0x9d,1,0x2a,8,0,9,0])),{mime:'image/webp',width:8,height:9,animated:false});
 assert.deepEqual(inspectImageBytes(webp('VP8L',[0x2f,7,0,2,0])),{mime:'image/webp',width:8,height:9,animated:false});
});
test('JPEG SOF dimensions and malformed input are checked without decoding',()=>{
 assert.deepEqual(inspectImageBytes(new Uint8Array([255,216,255,192,0,8,8,0,9,0,8,0])),{mime:'image/jpeg',width:8,height:9,animated:false});
 for(const bytes of [new Uint8Array(),new Uint8Array([255,216,255,192,255,255]),new Uint8Array(24)])assert.throws(()=>inspectImageBytes(bytes));
});
test('byte and pixel caps reject before decode, and cancellation does not encode or write',async()=>{
 let reads=0;await assert.rejects(prepareImageUpload({size:MAX_UPLOAD_BYTES+1,arrayBuffer(){reads++;}}),/16 MiB/);assert.equal(reads,0);
 const huge=png();new DataView(huge.buffer).setUint32(16,MAX_UPLOAD_PIXELS+1);await assert.rejects(prepareImageUpload(new Blob([huge],{type:'image/png'})),/1600 万/);
 assert.equal(await prepareImageUpload(new Blob([png()],{type:'image/png'}),{valid:()=>false}),null);
});
test('optimization requires meaningful savings, storage validates expanded limit consistently',()=>{
 assert.equal(worthwhileImage(100000,89999),false);assert.equal(worthwhileImage(100000,80000),true);assert.equal(worthwhileImage(1000000,950000),false);assert.equal(worthwhileImage(1000,100),false);
 const image='data:image/png;base64,'+'A'.repeat(4*Math.ceil(MAX_UPLOAD_BYTES/3));assert.equal(validEmbeddedImage(image),true);assert.equal(validEmbeddedImage(image+'A'.repeat(25)),false);assert.ok(MAX_IMAGE_DATA_LENGTH>2800000);assert.equal(dataUrlToBlob(PNG_DATA).type,'image/png');
});
test('JPEG EXIF rotation normalizes display dimensions without decoding or stretching',()=>{
 const jpeg=orientation=>{const exif=Buffer.from([69,120,105,102,0,0,73,73,42,0,8,0,0,0,1,0,18,1,3,0,1,0,0,0,orientation,0,0,0,0,0,0,0]);return new Uint8Array([255,216,255,225,0,exif.length+2,...exif,255,192,0,8,8,0,90,0,80,0]);};
 for(const o of [5,6,7,8])assert.deepEqual(inspectImageBytes(jpeg(o)),{mime:'image/jpeg',width:90,height:80,animated:false});
 const rotated=jpeg(6),xmp=new Uint8Array([255,225,0,5,88,77,80]),mixed=new Uint8Array(rotated.length+xmp.length);mixed.set(rotated.subarray(0,38));mixed.set(xmp,38);mixed.set(rotated.subarray(38),38+xmp.length);assert.equal(inspectImageBytes(mixed).width,90);
 for(const o of [1,2,3,4])assert.deepEqual(inspectImageBytes(jpeg(o)),{mime:'image/jpeg',width:80,height:90,animated:false});
});
test('cancelled worker and queued jobs release execution; missing worker codec uses native canvas',async()=>{
 const original={Worker:globalThis.Worker,createImageBitmap:globalThis.createImageBitmap,OffscreenCanvas:globalThis.OffscreenCanvas};
 const workers=[];let closed=0;
 globalThis.Worker=class{constructor(){workers.push(this);}postMessage(value){this.value=value;}terminate(){this.terminated=true;}};
 try{
  const blob=new Blob([png()],{type:'image/png'}),controller=new AbortController();let valid=true;
  const first=encodeImageBlob(blob,{signal:controller.signal}),firstCheck=assert.rejects(first,{name:'AbortError'});
  const stale=encodeImageBlob(blob,{valid:()=>valid}),staleCheck=assert.rejects(stale,{name:'AbortError'}),latest=encodeImageBlob(blob);
  await new Promise(r=>setImmediate(r));assert.equal(workers.length,1);valid=false;controller.abort();await firstCheck;await staleCheck;await new Promise(r=>setImmediate(r));assert.equal(workers.length,2);assert.equal(workers[0].terminated,true);workers[1].onmessage({data:{blob}});assert.equal(await latest,blob);
  const webp=new Uint8Array(30);webp.set(Buffer.from('RIFF'));new DataView(webp.buffer).setUint32(4,22,true);webp.set(Buffer.from('WEBPVP8X'),8);new DataView(webp.buffer).setUint32(16,10,true);
  globalThis.createImageBitmap=async()=>({width:1,height:1,close(){closed++;}});globalThis.OffscreenCanvas=class{getContext(){return {drawImage(){}};}convertToBlob(){return Promise.resolve(new Blob([webp],{type:'image/webp'}));}};
  const fallback=encodeImageBlob(blob);await new Promise(r=>setImmediate(r));workers.at(-1).onmessage({data:{unsupported:true,error:'Worker image encoder unavailable'}});assert.equal((await fallback).type,'image/webp');assert.equal(closed,1);
 }finally{for(const [key,value]of Object.entries(original)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
});
