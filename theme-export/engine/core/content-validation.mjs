import {inspectImageBytes,MAX_UPLOAD_BYTES,MAX_UPLOAD_PIXELS} from '../../../image-processing.mjs';
import {embeddedPngMeta} from '../proof/png.mjs';
const decode=b=>new TextDecoder('utf-8',{fatal:true}).decode(b),ascii=(b,p,n)=>String.fromCharCode(...b.subarray(p,p+n));
export function base64Bytes(value){if(!/^[A-Za-z0-9+/]*={0,2}$/.test(value)||value.length%4===1)throw Error('Invalid embedded base64');return Uint8Array.from(atob(value),c=>c.charCodeAt(0));}
export function bytesBase64(b){let out='';for(let p=0;p<b.length;p+=8192)out+=String.fromCharCode(...b.subarray(p,p+8192));return btoa(out);}
export function parseDataUrl(value){const m=/^data:([a-z0-9.+/-]+)(;base64)?,(.*)$/is.exec(value);if(!m)throw Error('Invalid data URL');return {mime:m[1].toLowerCase(),bytes:m[2]?base64Bytes(m[3]):new TextEncoder().encode(decodeURIComponent(m[3]))};}
/** Conservative passive XML grammar: unsupported syntax rejects rather than being sanitized silently. */
export function inspectPassiveSvg(bytes){
 const s=decode(bytes).replace(/^\uFEFF/,'').trim();if(!s||s.length>1024*1024||/<!|<\?|&|[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s))throw Error('SVG contains unsupported declarations/entities/content');
 const tags=new Set(['svg','g','path','rect','circle','ellipse','line','polyline','polygon','defs','linearGradient','radialGradient','stop','clipPath','mask']);
 const attrs=new Set(['xmlns','viewBox','width','height','fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','stroke-miterlimit','stroke-dasharray','stroke-dashoffset','fill-rule','clip-rule','opacity','fill-opacity','stroke-opacity','d','x','y','x1','x2','y1','y2','cx','cy','r','rx','ry','points','transform','id','offset','stop-color','stop-opacity','gradientUnits','gradientTransform','spreadMethod','fx','fy','clip-path','mask','maskUnits','maskContentUnits','preserveAspectRatio','role','aria-label']);
 const stack=[];let cursor=0,roots=0,rootAttrs={};
 for(const m of s.matchAll(/<[^>]*>/g)){
  if(s.slice(cursor,m.index).trim())throw Error('SVG text content is outside passive contract');cursor=m.index+m[0].length;
  const close=/^<\//.test(m[0]),empty=/\/>$/.test(m[0]),n=/^<\/?([A-Za-z][\w-]*)/.exec(m[0]);if(!n||!tags.has(n[1]))throw Error('SVG element is not permitted');const name=n[1];
  if(close){if(m[0]!==`</${name}>`||stack.pop()!==name)throw Error('SVG tag nesting mismatch');continue;}
  if(stack.length===0){if(name!=='svg'||roots++)throw Error('SVG must have one root');}
  let rest=m[0].slice(n[0].length,empty?-2:-1),values={};
  while(rest.trim()){
   const a=/^\s+([A-Za-z][\w:-]*)\s*=\s*("[^"]*"|'[^']*')/.exec(rest);if(!a||Object.hasOwn(values,a[1]))throw Error('SVG attribute is not permitted');
   const value=a[2].slice(1,-1);
   const nestedViewportOverflow=a[1]==='overflow'&&name==='svg'&&stack.length>0&&value==='visible';
   if(!attrs.has(a[1])&&!nestedViewportOverflow)throw Error('SVG attribute is not permitted');
   if(/[<>\\]/.test(value)||/javascript:|data:|https?:|\/\//i.test(value)&&!(a[1]==='xmlns'&&value==='http://www.w3.org/2000/svg'))throw Error('SVG external or active attribute rejected');
   if(/url\(/i.test(value)&&!/^url\(#[A-Za-z_][\w.-]*\)$/.test(value))throw Error('SVG permits local references only');values[a[1]]=value;rest=rest.slice(a[0].length);
  }
  if(!stack.length)rootAttrs=values;if(!empty)stack.push(name);if(stack.length>64)throw Error('SVG nesting exceeds passive contract');
 }
 if(stack.length||cursor!==s.length||roots!==1||rootAttrs.xmlns!=='http://www.w3.org/2000/svg')throw Error('Incomplete SVG document');
 const box=rootAttrs.viewBox?.trim().split(/[\s,]+/).map(Number),w=parseFloat(rootAttrs.width)||box?.[2],h=parseFloat(rootAttrs.height)||box?.[3];if(!(Number.isFinite(w)&&Number.isFinite(h)&&w>0&&h>0&&w<=1000000&&h<=1000000)||box&&(!box.every(Number.isFinite)||box.length!==4))throw Error('SVG needs positive dimensions/viewBox');
 return {mime:'image/svg+xml',width:w,height:h,validation:'passive XML whitelist; vector intrinsic dimensions <= 1e6 each; not a browser image decode'};
}
function jpegStructure(b){
 if(b[0]!==255||b[1]!==216||b.at(-2)!==255||b.at(-1)!==217)throw Error('Incomplete JPEG bounds');let p=2,sof=false,sos=false;
 while(p<b.length){if(b[p++]!==255)throw Error('Invalid JPEG marker');while(b[p]===255)p++;const k=b[p++];if(k===217)break;if(k===0||k===1||k>=208&&k<=215)continue;if(p+2>b.length)throw Error('Truncated JPEG');const n=b[p]*256+b[p+1];if(n<2||p+n>b.length)throw Error('Truncated JPEG segment');if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(k))sof=true;if(k===218){sos=true;p+=n;while(p<b.length-1){if(b[p]===255&&b[p+1]!==0&&!(b[p+1]>=208&&b[p+1]<=215))break;p+=b[p]===255?2:1;}continue;}p+=n;}
 if(!sof||!sos||p!==b.length)throw Error('JPEG requires complete frame and scan');
}
function gifStructure(b){
 if(b.length<14||!/^GIF8[79]a$/.test(ascii(b,0,6)))throw Error('Invalid GIF');let p=13,images=0;if(b[10]&128)p+=3*(2**((b[10]&7)+1));
 const blocks=()=>{while(p<b.length){const n=b[p++];if(!n)return;if(p+n>b.length)throw Error('Truncated GIF subblock');p+=n;}throw Error('Missing GIF block terminator');};
 while(p<b.length){const k=b[p++];if(k===59){if(!images||p!==b.length)throw Error('Invalid GIF trailer');return;}if(k===33){if(p>=b.length)throw Error('Truncated GIF extension');p++;blocks();}else if(k===44){if(p+9>b.length)throw Error('Truncated GIF frame');const packed=b[p+8];p+=9;if(packed&128)p+=3*(2**((packed&7)+1));if(p>=b.length||b[p]<2||b[p]>8)throw Error('Invalid GIF code size');p++;blocks();images++;}else throw Error('Invalid GIF record');}throw Error('Missing GIF trailer');
}
function webpStructure(b){const v=new DataView(b.buffer,b.byteOffset,b.byteLength);if(b.length<20||ascii(b,0,4)!=='RIFF'||ascii(b,8,4)!=='WEBP'||v.getUint32(4,true)+8!==b.length)throw Error('Invalid WebP RIFF bounds');let p=12,image=false;while(p<b.length){if(p+8>b.length)throw Error('Truncated WebP chunk');const type=ascii(b,p,4),n=v.getUint32(p+4,true);if(p+8+n+(n&1)>b.length)throw Error('Truncated WebP payload');if(['VP8 ','VP8L','ANMF'].includes(type)){if(n<5)throw Error('Empty WebP image payload');image=true;}p+=8+n+(n&1);}if(!image)throw Error('WebP has no image payload');}
export function inspectResourceBytes(bytes,mimeHint='',category='image'){
 const b=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);if(!b.length||b.length>MAX_UPLOAD_BYTES)throw Error('Resource is empty or exceeds 16 MiB export limit');
 if(category==='font'){
  if(b.length<28)throw Error('Truncated font');const v=new DataView(b.buffer,b.byteOffset,b.byteLength),sig=ascii(b,0,4);let mime;
  if(sig==='wOF2'||sig==='wOFF'){const min=sig==='wOF2'?48:44;if(b.length<min||v.getUint32(8)!==b.length||v.getUint16(12)===0)throw Error('Invalid WOFF bounds');mime=sig==='wOF2'?'font/woff2':'font/woff';}
  else if(sig==='OTTO'||v.getUint32(0)===0x00010000){const n=v.getUint16(4);if(!n||12+n*16>b.length)throw Error('Invalid SFNT directory');for(let i=0;i<n;i++){const p=12+i*16,o=v.getUint32(p+8),l=v.getUint32(p+12);if(o+l>b.length)throw Error('Truncated font table');}mime=sig==='OTTO'?'font/otf':'font/ttf';}
  else throw Error('Unsupported font signature');if(mimeHint&&mimeHint!==mime)throw Error('Font MIME does not match content');return {mime,validation:'font signature/directory bounds; glyph coverage and rendering unverified'};
 }
 if(mimeHint==='image/svg+xml'||decodeSafeStart(b).startsWith('<svg')){const meta=inspectPassiveSvg(b);if(mimeHint&&mimeHint!==meta.mime)throw Error('SVG MIME does not match content');return meta;}
 const info=inspectImageBytes(b);if(info.width*info.height>MAX_UPLOAD_PIXELS)throw Error('Image exceeds 16 million pixels');
 if(info.mime==='image/png')embeddedPngMeta('data:image/png;base64,'+bytesBase64(b));
 else if(info.mime==='image/jpeg')jpegStructure(b);else if(info.mime==='image/gif')gifStructure(b);else if(info.mime==='image/webp')webpStructure(b);
 if(mimeHint&&mimeHint!==info.mime)throw Error('Resource MIME does not match content');return {...info,validation:info.mime==='image/png'?'PNG structure and CRC; not pixel decode':'container/frame bounds and terminator; not pixel decode'};
}
function decodeSafeStart(b){try{return decode(b.subarray(0,Math.min(b.length,100))).trim();}catch{return '';}}
