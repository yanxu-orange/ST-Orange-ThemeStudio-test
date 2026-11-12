export function originalAvatarUrl(source,baseURL){
 if(!source||!baseURL)return null;
 let url,base;try{base=new URL(baseURL);url=new URL(source,base);}catch{return null;}
 if(url.origin!==base.origin||url.pathname!=='/thumbnail')return null;
 const type=url.searchParams.get('type'),file=url.searchParams.get('file');
 const folder=type==='avatar'?'characters':type==='persona'?'User%20Avatars':null;
 if(!folder||!file||/[\\/\u0000]/.test(file)||file==='.'||file==='..')return null;
 const result=new URL('/'+folder+'/'+encodeURIComponent(file),base);
 if(url.searchParams.has('t'))result.searchParams.set('t',url.searchParams.get('t'));
 return result.href;
}
export function releaseAvatarSource(record){
 if(!record)return;
 record.node.removeEventListener('error',record.onError);
 if(record.node.getAttribute('src')===record.applied)record.node.setAttribute('src',record.original);
}
export function updateAvatarSource(record,node,enabled,baseURL){
 if(record&&(record.node!==node||!enabled)){releaseAvatarSource(record);record=null;}
 if(!node||!enabled)return null;
 const current=node.getAttribute('src');
 if(record&&(current===record.applied||(record.failed&&current===record.original)))return record;
 if(record){releaseAvatarSource(record);record=null;}
 const original=current,applied=originalAvatarUrl(original,baseURL);
 if(!applied||applied===original)return null;
 record={node,original,applied,failed:false,onError:null};
 record.onError=()=>{if(node.getAttribute('src')!==applied)return;record.failed=true;node.setAttribute('src',original);};
 node.addEventListener('error',record.onError);node.setAttribute('src',applied);
 return record;
}
