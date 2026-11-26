import {builtinDescriptors} from './engine/core/references.mjs';
const mimeByExt={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',svg:'image/svg+xml',woff2:'font/woff2',ttf:'font/ttf'};
export function createBrowserRegistry({baseUrl=new URL('../',import.meta.url).href,fetchResource=globalThis.fetch}={}){
 const base=new URL(baseUrl),registry={};
 const location=path=>{if(!path.startsWith('materials/')||path.split('/').some(v=>v==='..'||v==='.')||/[?#\\]/.test(path))throw Error('内置资源路径无效');const url=new URL(path,base);if(url.origin!==base.origin||!url.pathname.startsWith(base.pathname))throw Error('内置资源超出插件目录');return url.href;};
 for(const [key,d]of Object.entries(builtinDescriptors())){
  const url=location(d.path),licenseUrl=d.licensePath?location(d.licensePath):null;let pending;
  registry[key]={category:d.category,path:d.path,load(){return pending??=(async()=>{
   const response=await fetchResource(url);if(!response.ok)throw Error('无法读取内置资源：'+key);
   const bytes=new Uint8Array(await response.arrayBuffer()),licenses=[];
   if(licenseUrl){const license=await fetchResource(licenseUrl);if(!license.ok)throw Error('无法读取字体许可：'+key);licenses.push({id:d.licensePath,text:await license.text()});}
   return {bytes,mime:mimeByExt[d.path.split('.').at(-1)],licenses};
  })();}};
 }
 return registry;
}
export function bundledFontUrlBindings(baseUrl=new URL('../',import.meta.url).href){return Object.fromEntries([
 [new URL('materials/fonts/spring/bodoni-moda-24pt.woff2',baseUrl).href,'font:spring-title'],[new URL('materials/fonts/spring/poem-serif-light.ttf',baseUrl).href,'font:spring-poem']]);}
