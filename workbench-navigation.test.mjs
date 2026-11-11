import {test} from 'node:test';import assert from 'node:assert/strict';
import {shell} from './test-support/workbench-shell.mjs';
import {PAGE_NAMES} from './workbench-ui.mjs';
test('all editing scopes are independent from native Tavern navigation',()=>{
 let nativeRequests=0;const {bench,shadow,change}=shell(390,{onBeforePageChange:()=>nativeRequests++});
 assert.equal(shadow.querySelector('#page-scope'),null);assert.equal(shadow.querySelector('.preview-tools'),null);assert.equal(shadow.querySelectorAll('#workspace-page').length,1);assert.ok(shadow.querySelector('.panel-head #workspace-page'));assert.equal(shadow.querySelector('#workspace-page [value=home]').textContent,'首页和全局');
 for(const page of Object.keys(PAGE_NAMES)){change('#workspace-page',page);assert.equal(bench.ui.page,page);assert.equal(bench.ui.viewPage,'chat');bench.syncViewedPage('worldbook');assert.equal(bench.ui.page,page);bench.syncViewedPage('chat');}
 assert.equal(nativeRequests,0);
});
test('native page reports preserve active selection, upload session, library and split',()=>{
 const {bench,navigations}=shell();bench.choose('header','image','upload-in-progress');Object.assign(bench.ui,{mode:'library',mobileView:'library',libraryExpanded:true});bench.render();const before=structuredClone(bench.ui),count=navigations.length;
 for(const page of ['home','settings','worldbook','chat'])bench.syncViewedPage(page);assert.deepEqual(bench.ui,before);assert.equal(navigations.length,count);
});
test('scope switch restores chosen region and object without changing the visible Tavern page',()=>{
 const {bench,change}=shell();change('#region-select','body');bench.ui.kind='text';bench.ui.object='body';change('#workspace-page','home');change('#region-select','input');change('#workspace-page','settings');change('#workspace-page','chat');assert.equal(bench.ui.region,'body');assert.equal(bench.ui.object,'body');change('#workspace-page','home');assert.equal(bench.ui.region,'input');assert.equal(bench.ui.viewPage,'chat');assert.equal(bench.choosePage('unknown'),false);
});
