import {validImageUrl} from '../../../image-sources.mjs';
import {collectReferences} from './references.mjs';
import {parseDataUrl,bytesBase64,inspectResourceBytes} from './content-validation.mjs';
export const cssString=value=>'"'+String(value).replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/[\u0000-\u001f\u007f]/g,c=>'\\'+c.charCodeAt(0).toString(16)+' ')+'"';
const hash=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',typeof value==='string'?new TextEncoder().encode(value):value))].map(b=>b.toString(16).padStart(2,'0')).join('');
const diagnostic=(field,region,code,reason)=>({severity:'error',field,region,code,reason});
function privateHost(host){
 host=host.toLowerCase().replace(/^\[|\]$/g,'').replace(/\.$/,'');if(host==='localhost'||host.endsWith('.localhost')||host.endsWith('.local')||host.endsWith('.internal')||host==='::'||host==='::1'||/^(?:fc|fd|fe8|fe9|fea|feb)/.test(host)&&host.includes(':'))return true;
 if(host.startsWith('::ffff:')){const n=host.slice(7).split(':');if(n.length!==2)return true;const a=parseInt(n[0],16),b=parseInt(n[1],16);return privateHost([a>>>8,a&255,b>>>8,b&255].join('.'));}
 const p=host.split('.');if(p.length===4&&p.every(x=>/^\d+$/.test(x))){const [a,b]=p.map(Number);return a===0||a===10||a===127||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&b===168;}
 return false;
}
export function validatePublicUrl(value){if(!validImageUrl(value))throw Error('A valid HTTP(S) URL without credentials is required');const u=new URL(value);if(privateHost(u.hostname)||u.pathname.startsWith('/scripts/extensions/'))throw Error('Private host/runtime resource URLs are not portable');return value;}
function totals(items){
 const result={};
 for(const category of ['image','font']){
  const list=items.filter(x=>x.category===category&&x.active&&x.status!=='error');
  result[category]={uniqueResources:list.length,failedReferences:items.filter(x=>x.category===category&&x.status==='error').length,knownBytes:list.reduce((n,x)=>n+(x.bytes||0),0),unknownSizeCount:list.filter(x=>x.bytes==null).length,estimatedEmbeddedCharacters:list.reduce((n,x)=>n+(x.estimatedEmbeddedCharacters||0),0),originalKnownBytes:list.reduce((n,x)=>n+(x.sourceBytes||0),0)};
 }
 result.licenseBytes=[...new Map(items.flatMap(x=>(x.licenses||[]).map(l=>[l.id,l.bytes]))).values()].reduce((n,x)=>n+x,0);
 return result;
}
/** No filesystem or network access. Registry and exact known bundled URL bindings are injected. */
export async function resolveExportResources(config,{registry={},bundledUrls={}}={}){
 const {references,diagnostics}=collectReferences(config),snapshot={config:structuredClone(config),sources:{}},items=[],dedup=new Map(),loadedKeys=new Map();
 for(const ref of references){
  if(!ref.active){items.push({id:'inactive-'+await hash(ref.field),category:ref.category,fieldRefs:[ref.field],region:ref.region,active:false,status:'inactive',reason:ref.reason,sourceType:ref.kind,bytes:null,estimatedEmbeddedCharacters:0});continue;}
  try{
   let key=ref.key,value=ref.value,sourceType=ref.kind,record;
   if(!key&&Object.hasOwn(bundledUrls,value||'')){key=bundledUrls[value];sourceType='builtin';}
   let bytes,mime='',licenses=[],meta={},url,sourceUrl=null;
   if(key){record=registry instanceof Map?registry.get(key):registry[key];if(!record)throw Error('Referenced builtin resource is missing from the approved registry');if(record.category&&record.category!==ref.category)throw Error('Builtin resource category mismatch');let loaded;try{if(!loadedKeys.has(key))loadedKeys.set(key,record.load?Promise.resolve().then(()=>record.load()):Promise.resolve(record));loaded=await loadedKeys.get(key);}catch{throw Error('Approved builtin resource could not be loaded');}bytes=loaded.bytes;if(!(bytes instanceof Uint8Array))throw Error('Builtin loader returned no bytes');mime=loaded.mime||record.mime||'';licenses=loaded.licenses||record.licenses||[];if(ref.category==='font'&&!licenses.length)throw Error('Bundled font license is missing');sourceType='builtin';}
   else if(value?.startsWith('data:')){({bytes,mime}=parseDataUrl(value));sourceType=ref.kind==='generated'?'generated':'embedded';}
   else{url=validatePublicUrl(value);sourceUrl=url;sourceType='external';}
   if(ref.category==='font'&&!/^[1-9]00(?: [1-9]00)?$/.test(String(ref.faceWeight)))throw Error('Invalid font face weight');
   for(const license of licenses)if(!license.id||typeof license.text!=='string'||!license.text.trim())throw Error('Invalid font license record');
   let digest;
   if(bytes){meta=inspectResourceBytes(bytes,mime,ref.category);mime=meta.mime;digest=await hash(bytes);url='data:'+mime+';base64,'+bytesBase64(bytes);}
   else digest=await hash(url);
   const id=(ref.category==='font'?'font-':'image-')+digest;
   let item=dedup.get(id);
   if(!item){item={id,category:ref.category,fieldRefs:[],regions:[],active:true,status:'resolved',sourceType,sourceUrl,sourceKeys:[],bytes:bytes?.length??null,sourceBytes:bytes?.length??null,estimatedEmbeddedCharacters:bytes?url.length:0,previewSource:ref.category==='image'?url:null,exportUrl:url,mime:mime||null,...meta,licenses:[],faceWeights:[],fontFamily:ref.category==='font'?'YJExport_'+digest.slice(0,16):null,networkChecked:false};items.push(item);dedup.set(id,item);}
   item.fieldRefs.push(ref.field);if(!item.regions.includes(ref.region))item.regions.push(ref.region);if(key&&!item.sourceKeys.includes(key))item.sourceKeys.push(key);
   for(const license of licenses){if(!license.id||typeof license.text!=='string'||!license.text.trim())throw Error('Invalid font license record');if(!item.licenses.some(x=>x.id===license.id))item.licenses.push({...license,bytes:new TextEncoder().encode(license.text).length});}
   if(ref.category==='font'&&!item.faceWeights.includes(ref.faceWeight))item.faceWeights.push(ref.faceWeight);
   snapshot.sources[ref.field]=url;
  }catch(error){diagnostics.push(diagnostic(ref.field,ref.region,'RESOURCE_RESOLUTION',error.message));items.push({id:'error-'+await hash(ref.field),category:ref.category,fieldRefs:[ref.field],region:ref.region,active:true,status:'error',sourceType:ref.kind,bytes:null,estimatedEmbeddedCharacters:0});}
 }
 for(const item of items){item.fieldRefs.sort();item.regions?.sort();item.sourceKeys?.sort();item.faceWeights?.sort();}
 items.sort((a,b)=>a.id.localeCompare(b.id));return {ok:!diagnostics.some(x=>x.severity==='error'),snapshot,resources:items,diagnostics,totals:totals(items),contract:{version:1,sourceRule:'All generated output must resolve a referenced field from snapshot.sources. No fallback to config private paths.',network:'No fetch or upload performed',validation:'Structural/container validation only; no full image/font decode or glyph coverage claim'}};
}
/** Atomic replacement by stable manifest ID, affecting every field reference to that resource. */
export function replaceExportResourceUrls(previous,replacements){
 const diagnostics=[];if(!replacements||typeof replacements!=='object'||Array.isArray(replacements))return {ok:false,result:previous,diagnostics:[diagnostic('replacements','resources','REPLACEMENT','Expected an ID-to-URL map')]};
 for(const [id,url]of Object.entries(replacements)){const item=previous.resources.find(x=>x.id===id&&x.active&&x.status!=='error');if(!item){diagnostics.push(diagnostic('replacements','resources','REPLACEMENT','Unknown or unresolved resource ID'));continue;}try{validatePublicUrl(url);}catch(error){diagnostics.push(diagnostic(item.fieldRefs[0],item.regions?.[0]||'resources','REPLACEMENT',error.message));}}
 if(diagnostics.length)return {ok:false,result:previous,diagnostics};
 const result=structuredClone(previous);
 for(const [id,url]of Object.entries(replacements)){const item=result.resources.find(x=>x.id===id);item.replacementUrl=url;item.exportUrl=url;item.previewSource=item.category==='image'?url:null;item.bytes=null;item.estimatedEmbeddedCharacters=0;item.status='replaced';item.networkChecked=false;for(const field of item.fieldRefs)result.snapshot.sources[field]=url;}
 result.totals=totals(result.resources);return {ok:true,result,diagnostics:[]};
}
export function fontFaceCss(manifest){return manifest.resources.filter(x=>x.active&&x.status!=='error'&&x.category==='font').map(x=>{
 const licenses=x.licenses.map(l=>'/* '+l.text.replace(/\*\//g,'* /')+' */').join('\n');return licenses+'\n'+x.faceWeights.map(weight=>`@font-face{font-family:${cssString(x.fontFamily)};src:url(${cssString(x.exportUrl)});font-weight:${weight};font-style:normal;font-display:swap}`).join('\n');}).join('\n');}
export function manifestSummary(result){return {...result,snapshot:{configVersion:result.snapshot.config.version,fieldCount:Object.keys(result.snapshot.sources).length},resources:result.resources.map(({exportUrl,previewSource,...x})=>({...x,embedded:exportUrl?.startsWith('data:')||false,...(exportUrl&&!exportUrl.startsWith('data:')?{exportUrl}:{}),licenses:x.licenses?.map(l=>({id:l.id,bytes:l.bytes}))}))};}

/** Logging view deliberately contains no URLs or inline payloads, including signed query strings. */
export function safeLogSummary(result){return {ok:result.ok,totals:result.totals,diagnostics:result.diagnostics,resources:result.resources.map(({id,category,fieldRefs,status,sourceType,bytes})=>({id,category,fieldRefs,status,sourceType,bytes}))};}
