import {createAvatarFxNode,syncAvatarFxParts} from './avatar-fx.mjs';

export function createAvatarFxRuntime({document,IntersectionObserver:Observe}={}){
 const records=new Map(),byNode=new Map();let observer=null,listening=false,dynamicCount=0;
 const Observer=Observe||document.defaultView?.IntersectionObserver;
 function attr(node,key,value){value=String(value);if(node.getAttribute(key)!==value)node.setAttribute(key,value);}
 function play(record){attr(record.node,'data-fx-play',!!record.motion&&record.visible&&!document.hidden);}
 function visibility(){for(const record of records.values())play(record);}
 function resources(){
  const dynamic=dynamicCount>0;
  if(dynamic&&Observer){
   if(!observer)observer=new Observer(entries=>{for(const entry of entries){const r=byNode.get(entry.target);if(r){r.visible=!!entry.isIntersecting;play(r);}}},{threshold:0});
   if(!listening){document.addEventListener('visibilitychange',visibility);listening=true;}
  }else{
   const wasActive=!!observer||listening;
   observer?.disconnect();observer=null;
   if(listening){document.removeEventListener('visibilitychange',visibility);listening=false;}
   if(wasActive)for(const r of records.values()){r.observing=false;r.visible=false;play(r);}
  }
 }
 function remove(message){
  const r=records.get(message);if(!r)return;
  if(r.observing)observer?.unobserve(r.node);if(r.motion)dynamicCount--;byNode.delete(r.node);records.delete(message);r.node.remove();resources();
 }
 function sync(message,parent,fx,hidden=false){
  if(!fx||hidden||!parent){remove(message);return null;}
  let r=records.get(message);
  if(r&&r.node.parentNode!==parent){remove(message);r=null;}
  if(!r){const node=createAvatarFxNode(document,fx);parent.append(node);r={node,motion:false,visible:false,observing:false};records.set(message,r);byNode.set(node,r);}
  const motion=fx.motion&&typeof Observer==='function';
  syncAvatarFxParts(r.node,document,fx);
  attr(r.node,'data-fx-kind',fx.kind);if(r.motion!==motion)dynamicCount+=motion?1:-1;r.motion=motion;attr(r.node,'data-fx-motion',motion);resources();
  if(observer&&r.motion&&!r.observing){observer.observe(r.node);r.observing=true;}
  if(!r.motion&&r.observing){observer?.unobserve(r.node);r.observing=false;r.visible=false;}
  play(r);return r.node;
 }
 function stop(){observer?.disconnect();observer=null;if(listening)document.removeEventListener('visibilitychange',visibility);listening=false;dynamicCount=0;for(const r of records.values())r.node.remove();records.clear();byNode.clear();}
 return {sync,remove,stop,get count(){return records.size;}};
}
