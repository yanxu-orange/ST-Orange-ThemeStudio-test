import {test} from 'node:test';
import assert from 'node:assert/strict';
import {prepareCropSource,cropOutputSize} from './crop-source.mjs';
test('crop output preserves source dimensions beyond 1200 and bounds pixel area',()=>{assert.deepEqual(cropOutputSize({width:2400,height:1800}),{width:2400,height:1800});assert.throws(()=>cropOutputSize({width:5000,height:5000}));});
test('CORS failures explicitly retain original; external animation inspected from blob',async()=>{
 await assert.rejects(prepareCropSource('https://example.com/x',{fetcher:async()=>{throw Error('cors');}}),/原图未改变/);
 const gif=new Uint8Array([71,73,70,56,57,97,2,0,3,0,0,0,0]);let options;
 const r=await prepareCropSource('https://example.com/not-an-extension',{fetcher:async(url,o)=>{options=o;return {ok:true,headers:{get:()=>null},blob:async()=>new Blob([gif])};}});assert.equal(r.animated,true);assert.equal(r.width,2);assert.equal(options.credentials,'omit');
});
