import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {createWorkbench,workbenchMarkup} from './workbench-ui.mjs';

function setup(onBeforePageChange){
 const {document,window}=parseHTML('<html><body></body></html>');
 const desc=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:desc.get,set(value){for(const option of this.options)option.toggleAttribute('selected',option.value===String(value));},configurable:true});
 const host=document.createElement('div');document.body.append(host);const shadow=host.attachShadow({mode:'open'});shadow.innerHTML=workbenchMarkup();
 const navigations=[];let layouts=0;
 const bench=createWorkbench(shadow,{onBeforePageChange,onNavigate:event=>{navigations.push(event);bench.render();},onLayout:()=>layouts++});bench.render();
 return {bench,shadow,navigations,get layouts(){return layouts;}};
}
const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done;});return {promise,resolve};};
function labels(shadow,editing,view){assert.equal(shadow.querySelector('#workspace-page').value,editing);assert.equal(shadow.querySelector('#page-scope').value,view);assert.equal(shadow.querySelector('#workspace-page').getAttribute('aria-busy'),'false');}

test('chat selection from actual home preserves confirmed home view rather than inventing a conversation',async()=>{
 const gate=deferred(),{bench,shadow}=setup(()=>gate.promise);
 bench.syncViewedPage('home');labels(shadow,'home','home');
 const request=bench.choosePage('chat');assert.equal(shadow.querySelector('#workspace-page').getAttribute('aria-busy'),'true');
 gate.resolve({ok:true,viewPage:'home'});assert.equal(await request,true);
 assert.equal(bench.ui.page,'chat');assert.equal(bench.ui.viewPage,'home');labels(shadow,'chat','home');
});

test('failed pending navigation reconciles latest native view outside global editing',async()=>{
 const gate=deferred(),{bench,shadow,navigations}=setup(()=>gate.promise);
 bench.choose('body','text','body');bench.render();const request=bench.choosePage('settings');
 bench.syncViewedPage('worldbook');assert.equal(bench.ui.page,'chat');assert.equal(bench.ui.viewPage,'worldbook');
 gate.resolve({ok:false,viewPage:'worldbook'});assert.equal(await request,false);
 labels(shadow,'worldbook','worldbook');assert.deepEqual(navigations.at(-1),{pageChanged:true,native:true});
});

test('failed view navigation preserves global editing while updating actual view',async()=>{
 const gate=deferred(),{bench,shadow}=setup(()=>gate.promise);
 bench.choosePage('home');bench.choose('input','region','region');bench.render();
 const request=bench.choosePage('settings',{viewOnly:true});bench.syncViewedPage('connection');
 gate.resolve({ok:false,viewPage:'connection'});assert.equal(await request,false);
 labels(shadow,'home','connection');assert.equal(bench.ui.region,'input');assert.equal(bench.ui.kind,'region');
});

test('same-page initial native report leaves editor/upload state and navigation callbacks untouched',()=>{
 const context=setup(()=>true),{bench,shadow,navigations}=context;
 bench.choose('header','image','upload-in-progress');Object.assign(bench.ui,{mode:'library',mobileView:'library',libraryExpanded:true});bench.render();
 const before=structuredClone(bench.ui),layoutCount=context.layouts;
 bench.syncViewedPage('chat');bench.syncViewedPage('chat');
 assert.deepEqual(bench.ui,before);assert.equal(navigations.length,0,'no editor invalidation callback');assert.equal(context.layouts,layoutCount);labels(shadow,'chat','chat');
});

test('stale older navigation result cannot override a newer global selection or actual view',async()=>{
 const gate=deferred(),{bench,shadow,navigations}=setup(()=>gate.promise);
 const older=bench.choosePage('settings');bench.choosePage('home');bench.choose('input','region','region');bench.render();
 bench.syncViewedPage('connection');const before=structuredClone(bench.ui),count=navigations.length;
 gate.resolve({ok:true,viewPage:'settings'});assert.equal(await older,false);
 assert.deepEqual(bench.ui,before);assert.equal(navigations.length,count);labels(shadow,'home','connection');
});
