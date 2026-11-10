import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {workbenchMarkup} from './workbench-ui.mjs';
import {installMobileFlow} from './mobile-flow.mjs';
function fixture(){
 const {document,window}=parseHTML('<html><body></body></html>');window.innerWidth=390;
 const host=document.createElement('div');document.body.append(host);const shadow=host.attachShadow({mode:'open'});shadow.innerHTML=workbenchMarkup();const apply=document.createElement('button');apply.id='apply-live';shadow.querySelector('#close').before(apply);
 const flow=installMobileFlow({shadow,onContinue:()=>flow.setEditorOpen(true),onTemplate:()=>true,onBlank:()=>true,onImport:()=>{}});
 const bar=shadow.querySelector('.bar'),toggle=shadow.querySelector('.mobile-toolbar-toggle'),more=shadow.querySelector('.mobile-more');
 return {document,window,shadow,flow,bar,toggle,more};
}
test('mobile toolbar starts as edge entrance and repeatedly expands all six actions without changing draft',()=>{
 const {shadow,flow,bar,toggle}=fixture();flow.setEditorOpen(true);
 assert.equal(flow.isToolbarExpanded(),false);assert.equal(bar.dataset.toolbarExpanded,'false');assert.equal(toggle.getAttribute('aria-label'),'展开工具栏');
 assert.deepEqual([...bar.children].filter(n=>n.matches('button:not(.mobile-toolbar-toggle),details.mobile-more')).map(n=>n.matches('details')?n.querySelector('summary').textContent:n.textContent),['作品','撤销','保存','应用','退出','更多']);
 for(let i=0;i<5;i++){toggle.click();assert.equal(flow.isToolbarExpanded(),true);assert.equal(toggle.getAttribute('aria-expanded'),'true');toggle.click();assert.equal(flow.isToolbarExpanded(),false);}
 const css=[...shadow.querySelectorAll('style')].at(-1).textContent;
 assert.match(css,/\.bar\[data-toolbar-expanded=false\]\{left:auto;width:54px/);
 assert.match(css,/\.bar\[data-toolbar-expanded=false\]>:not\(\.mobile-toolbar-toggle\)\{display:none!important\}/);
});
test('collapse dismisses More and nested menus; outside pointer and Escape dismiss without swallowing preview input',()=>{
 const {document,window,shadow,flow,toggle,more}=fixture();
 toggle.click();more.open=true;const nested=more.querySelector('details');nested.open=true;toggle.click();assert.equal(more.open,false);assert.equal(nested.open,false);
 toggle.click();more.open=true;more.dispatchEvent(new window.Event('pointerdown',{bubbles:true,composed:true}));assert.equal(flow.isToolbarExpanded(),true);
 const outside=new window.Event('pointerdown',{bubbles:true,cancelable:true});document.body.dispatchEvent(outside);assert.equal(flow.isToolbarExpanded(),false);assert.equal(more.open,false);assert.equal(outside.defaultPrevented,false);
 toggle.click();more.open=true;const escape=new window.Event('keydown',{bubbles:true,cancelable:true});escape.key='Escape';shadow.dispatchEvent(escape);assert.equal(flow.isToolbarExpanded(),false);assert.equal(more.open,false);
});
test('desktop stays expanded, restores menu controls, and returning to mobile resets collapse',()=>{
 const {window,shadow,flow,toggle,more,bar}=fixture();toggle.click();more.open=true;
 window.innerWidth=1200;window.dispatchEvent(new window.Event('resize'));
 assert.equal(flow.isToolbarExpanded(),true);assert.equal(bar.dataset.toolbarExpanded,'true');assert.equal(more.open,false);assert.equal(shadow.querySelector('#save').textContent,'保存方案');assert.ok(shadow.querySelector('.panel-head #page-scope'));assert.ok(bar.querySelector('[aria-label="基础模板"]'));
 window.innerWidth=390;window.dispatchEvent(new window.Event('resize'));assert.equal(flow.isToolbarExpanded(),false);assert.ok(more.querySelector('#page-scope'));assert.equal(shadow.querySelector('#save').textContent,'保存');
});
test('opening work settings, exit and reopen leave a clean collapsed toolbar',()=>{
 const {shadow,flow,toggle,more}=fixture();flow.setEditorOpen(true);toggle.click();more.open=true;shadow.querySelector('.mobile-work').click();assert.equal(flow.isToolbarExpanded(),false);assert.equal(more.open,false);assert.equal(shadow.querySelector('.flow-overlay').classList.contains('hidden'),false);
 shadow.querySelector('[data-flow=continue]').click();assert.equal(flow.isToolbarExpanded(),false);toggle.click();more.open=true;flow.setEditorOpen(false);assert.equal(more.open,false);flow.setEditorOpen(true);assert.equal(flow.isToolbarExpanded(),false);
});
