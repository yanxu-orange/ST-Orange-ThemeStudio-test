import {snapshotDraft} from '../draft-snapshot.mjs';
import {exportFilename} from '../export-name.mjs';
import {compilePageHeaders} from './engine/headers/compile-page-headers.mjs';
import {collectReferences} from './engine/core/references.mjs';
import {createBrowserRegistry,bundledFontUrlBindings} from './browser-registry.mjs';
export function createThemeExportSession(source,{compile=compilePageHeaders,registry=createBrowserRegistry(),bundledUrls=bundledFontUrlBindings()}={}){
 const snapshot=snapshotDraft(source);let closed=false,prepared=null,filename=null;
 return {
  cancel(){closed=true;prepared=null;},
  async prepare(value){
   if(closed)return null;
   try{filename=exportFilename(value);}catch(error){throw Error(error.message.replaceAll('方案','主题'));}
   const result=await compile(snapshot,{registry,bundledUrls,target:{name:filename.slice(0,-5)}});if(closed)return null;
   prepared=result;
   const refs=collectReferences(result.resourceManifest?.snapshot.config||snapshot).references;
   const userFields=new Set(refs.filter(r=>r.active&&r.kind==='inline-or-url'&&!Object.hasOwn(bundledUrls,r.value||'')).map(r=>r.field));
   return {result,resources:result.resourceManifest?.resources.filter(r=>r.active&&r.status!=='error'&&r.fieldRefs.some(f=>userFields.has(f)))||[],totals:result.resourceManifest?.totals||null,builtinCount:result.resourceManifest?.resources.filter(r=>r.active&&r.status!=='error'&&r.category==='image'&&r.sourceKeys?.length).length||0,embeddedBytes:result.resourceManifest?.resources.filter(r=>r.active&&r.status!=='error'&&r.exportUrl?.startsWith('data:')).reduce((n,r)=>n+(r.bytes||0),0)||0};
  },
  async finish(replacements={}){
   if(closed||!prepared?.ok)return null;
   let result=prepared;
   if(Object.keys(replacements).length)result=await compile(snapshot,{registry,bundledUrls,replacements,target:{name:filename.slice(0,-5)}});
   if(closed)return null;
   if(!result.ok)return {result,artifact:null};
   return {result,artifact:{filename,theme:result.theme}};
  }
 };
}
