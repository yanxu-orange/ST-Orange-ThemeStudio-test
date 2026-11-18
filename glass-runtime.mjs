import {liquidGlassProfiles,glassFilterId} from './glass-style.mjs';
const NS='http://www.w3.org/2000/svg';
export function createGlassRuntime(document,{preview=false}={}){
 let svg=null,last='';const namespace=preview?'preview':'live';
 function stop(){svg?.remove();svg=null;last='';}
 function update(config){
  const profiles=liquidGlassProfiles(config),key=profiles.map(m=>`${m.refraction}/${m.blur}`).sort().join('|');
  if(!key){stop();return;}if(key===last&&svg?.isConnected)return;
  if(!svg){svg=document.createElementNS(NS,'svg');svg.setAttribute('data-otl-glass',namespace);svg.setAttribute('data-otl-live-owned','');svg.setAttribute('aria-hidden','true');svg.setAttribute('width','0');svg.setAttribute('height','0');svg.style.cssText='position:absolute;width:0;height:0;pointer-events:none;overflow:hidden';document.body.append(svg);}
  const defs=document.createElementNS(NS,'defs');
  for(const m of profiles){const f=document.createElementNS(NS,'filter');f.setAttribute('id',glassFilterId(m,namespace));f.setAttribute('x','-20%');f.setAttribute('y','-20%');f.setAttribute('width','140%');f.setAttribute('height','140%');f.setAttribute('color-interpolation-filters','sRGB');
   const noise=document.createElementNS(NS,'feTurbulence');for(const [k,v]of Object.entries({type:'fractalNoise',baseFrequency:'.012 .018',numOctaves:'1',seed:'8',result:'noise'}))noise.setAttribute(k,v);f.append(noise);
   const displacement=document.createElementNS(NS,'feDisplacementMap');for(const [k,v]of Object.entries({in:'SourceGraphic',in2:'noise',scale:String(m.refraction),xChannelSelector:'R',yChannelSelector:'G',result:'refracted'}))displacement.setAttribute(k,v);f.append(displacement);
   if(m.blur){const blur=document.createElementNS(NS,'feGaussianBlur');blur.setAttribute('in','refracted');blur.setAttribute('stdDeviation',String(m.blur));f.append(blur);}defs.append(f);
  }
  svg.replaceChildren(defs);last=key;
 }
 return {update,stop};
}
