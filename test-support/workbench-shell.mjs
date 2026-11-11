import {parseHTML} from 'linkedom';
import {createWorkbench,workbenchMarkup} from '../workbench-ui.mjs';
export function shell(width=390,options={}){
 const {document,window}=parseHTML('<html><body></body></html>');const desc=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:desc.get,set(value){for(const option of this.options)option.toggleAttribute('selected',option.value===String(value));},configurable:true});window.innerWidth=width;window.innerHeight=844;
 const host=document.createElement('div');document.body.append(host);const shadow=host.attachShadow({mode:'open'});shadow.innerHTML=workbenchMarkup();const navigations=[];const bench=createWorkbench(shadow,{...options,onNavigate:event=>{navigations.push(event);bench.render();options.onNavigate?.(event);}});bench.render();
 const change=(selector,value)=>{const element=shadow.querySelector(selector);element.value=value;element.dispatchEvent(new window.Event('change',{bubbles:true}));};return {document,window,shadow,bench,navigations,change,click:selector=>shadow.querySelector(selector).click()};
}
export function selectRegion(shadow,window,region){const scope=['common','topbar','input','home-design'].includes(region)?'home':'chat';for(const [selector,value] of [['#workspace-page',scope],['#region-select',region]]){const node=shadow.querySelector(selector);node.value=value;node.dispatchEvent(new window.Event('change',{bubbles:true}));}}
