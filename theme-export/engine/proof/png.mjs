// Synchronous structure and CRC checks for embedded PNG used by this bounded proof.
const signature=[137,80,78,71,13,10,26,10];
const table=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function crc32(bytes){let c=0xffffffff;for(const n of bytes)c=table[(c^n)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
export function embeddedPngMeta(image){
 if(typeof image!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(image))throw Error('Only embedded PNG resources are supported in this proof');
 let b;try{b=Uint8Array.from(atob(image.slice(22)),c=>c.charCodeAt(0));}catch{throw Error('Invalid PNG base64');}
 if(b.length<45||!signature.every((n,i)=>b[i]===n))throw Error('Invalid or truncated PNG signature/structure');
 const d=new DataView(b.buffer);let offset=8,header=null,palette=false,idat=false,ended=false,idatEnded=false;
 while(offset<b.length){
  if(b.length-offset<12)throw Error('Truncated PNG chunk');
  const length=d.getUint32(offset),end=offset+12+length;if(length>0x7fffffff||end>b.length)throw Error('Truncated PNG chunk payload');
  const name=String.fromCharCode(...b.slice(offset+4,offset+8));if(!/^[A-Za-z]{4}$/.test(name))throw Error('Invalid PNG chunk name');
  const data=b.slice(offset+8,offset+8+length),expected=d.getUint32(offset+8+length);if(crc32(b.slice(offset+4,offset+8+length))!==expected)throw Error('PNG CRC mismatch: '+name);
  if(!header&&name!=='IHDR')throw Error('PNG IHDR must be first');
  if(name==='IHDR'){
   if(header||length!==13||offset!==8)throw Error('Invalid PNG IHDR');
   const width=d.getUint32(offset+8),height=d.getUint32(offset+12),depth=data[8],color=data[9];
   const depths={0:[1,2,4,8,16],2:[8,16],3:[1,2,4,8],4:[8,16],6:[8,16]};
   if(!width||!height||width>0x7fffffff||height>0x7fffffff||!depths[color]?.includes(depth)||data[10]!==0||data[11]!==0||data[12]>1)throw Error('Invalid PNG IHDR values');
   header={width,height,color};
  }else if(name==='PLTE'){
   if(palette||idat||!length||length>768||length%3!==0||[0,4].includes(header.color))throw Error('Invalid PNG palette');palette=true;
  }else if(name==='IDAT'){
   if(idatEnded||!length)throw Error('Invalid PNG IDAT sequence');if(header.color===3&&!palette)throw Error('Indexed PNG needs palette');idat=true;
  }else if(name==='IEND'){
   if(length!==0||!idat||end!==b.length)throw Error('Invalid PNG IEND');ended=true;
  }else{
   if(name[0]===name[0].toUpperCase())throw Error('Unsupported critical PNG chunk: '+name);
   if(idat)idatEnded=true;
  }
  offset=end;
 }
 if(!header||!idat||!ended)throw Error('PNG must contain complete IHDR, IDAT and IEND');
 return {width:header.width,height:header.height,bytes:b.length};
}
