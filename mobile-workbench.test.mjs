import {test} from 'node:test';import assert from 'node:assert/strict';import {parseHTML} from 'linkedom';
import {mobileGeometry,workbenchMarkup,createWorkbench} from './workbench-ui.mjs';
test('mobile geometry fits normal, keyboard and short viewport without negative dimensions',()=>{
 for(const h of [160,300,500,844])for(const open of [true,false])for(const compact of [true,false]){const g=mobileGeometry(h,180,open,35,compact);assert.ok(g.height>=0&&g.sheet>=0);assert.ok(g.top+g.height+g.sheet<=35+h);if(!open)assert.equal(g.sheet,0);if(compact&&open)assert.equal(g.height,0);}
 assert.ok(mobileGeometry(844,180,false).height>mobileGeometry(844,180,true).height);
});
test('mobile navigation changes transient UI only and can return from library to preview',()=>{
 const {document,window}=parseHTML('<html><body></body></html>');const desc=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:desc.get,set(v){for(const o of this.options)o.toggleAttribute('selected',o.value===String(v));},configurable:true});
 const host=document.createElement('div');document.body.append(host);const sh=host.attachShadow({mode:'open'});sh.innerHTML=workbenchMarkup();let nav=0,layout=0;const wb=createWorkbench(sh,{onNavigate:()=>{nav++;wb.render();},onLayout:()=>layout++});wb.render();
 assert.equal(wb.ui.mobileView,'preview');assert.equal(sh.querySelector('.panel').dataset.mobileView,'preview');
 sh.querySelector('.mobile-dock [data-mobile-view=regions]').click();assert.equal(sh.querySelector('.panel').dataset.mobileView,'regions');
 sh.querySelector('[data-region=body]').click();assert.equal(wb.ui.region,'body');assert.equal(sh.querySelector('.panel').dataset.mobileView,'adjust');
 sh.querySelector('.mobile-dock [data-mobile-view=library]').click();assert.equal(wb.ui.mode,'library');
 sh.querySelector('.mobile-dock [data-mobile-view=preview]').click();assert.equal(wb.ui.mode,'edit');assert.equal(wb.ui.mobileView,'preview');
 wb.choose('header','avatar','ai');wb.render();assert.equal(wb.ui.mobileView,'adjust');assert.ok(nav>=4);assert.ok(layout>=3);
 sh.querySelector('[data-region=topbar]').click();assert.equal(sh.querySelector('.mobile-dock [data-mobile-view=library]').disabled,true);
});

test('safe-area is reserved in preview geometry and mobile crop rule outranks later base dialog rule',()=>{
 const normal=mobileGeometry(844,180,true,0,false,0),safe=mobileGeometry(844,180,true,0,false,34);
 assert.ok(Math.abs(normal.height+normal.sheet-safe.height-safe.sheet-34)<1e-8);
 const panelTop=844-64-34-safe.sheet;assert.ok(safe.top+safe.height<=panelTop);
 assert.match(workbenchMarkup(),/:host textarea,select\{font-size:16px\}/);
 assert.match(workbenchMarkup(),/:host \.crop-dialog\{max-height:calc\(var\(--wb-vv-height,100dvh\) - 16px\)/);
});
