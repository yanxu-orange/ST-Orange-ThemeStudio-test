import {test} from 'node:test';import assert from 'node:assert/strict';
import {shell} from './test-support/workbench-shell.mjs';import {installMobileFlow} from './mobile-flow.mjs';
function fixture(){const context=shell(),{shadow,document}=context;const apply=document.createElement('button');apply.id='apply-live';shadow.querySelector('#save').after(apply);const flow=installMobileFlow({shadow,onContinue(){},onImport(){},onTemplate:()=>true,onBlank:()=>true});return {...context,flow};}
test('one persistent compact command bar, no five-button dock or second view selector',()=>{const {shadow,flow}=fixture();assert.equal(flow.isToolbarExpanded(),true);assert.equal(shadow.querySelector('.mobile-dock'),null);assert.equal(shadow.querySelector('.mobile-toolbar-toggle'),null);assert.equal(shadow.querySelector('#page-scope'),null);assert.ok(shadow.querySelector('.bar #full-view'));for(const id of ['undo','save','apply-live','close'])assert.ok(shadow.querySelector('.bar #'+id));for(const id of ['export','import','layout-adjust','narrow'])assert.ok(shadow.querySelector('.desktop-scheme .menu #'+id));});
test('resize keeps controls and their listeners stable, with native input untouched',()=>{const {window,shadow}=fixture();const button=shadow.querySelector('#export');let count=0;button.addEventListener('click',()=>count++);for(const width of [1366,390,768,390]){window.innerWidth=width;window.dispatchEvent(new window.Event('resize'));assert.equal(shadow.querySelector('#export'),button);assert.equal(shadow.querySelectorAll('#workspace-page').length,1);button.click();}assert.equal(count,4);assert.equal(shadow.querySelector('#save').textContent,'保存草稿');});
test('undo and collapse stay on the toolbar across mobile and desktop widths',()=>{
 const {window,shadow}=fixture();
 const bar=shadow.querySelector('.bar');
 const undo=shadow.querySelector('#undo'), collapse=shadow.querySelector('#collapse-toolbar');
 let clicks=0;
 undo.disabled=true;undo.addEventListener('click',()=>clicks++);
 for(const width of [320,352,353,360,390,430,650,1200,390]){
  window.innerWidth=width;window.dispatchEvent(new window.Event('resize'));
  assert.equal(undo.parentElement,bar);
  assert.equal(collapse.parentElement,bar);
  assert.equal(collapse.textContent,'收起');
  assert.equal(undo.disabled,true);
  undo.disabled=false;undo.click();undo.disabled=true;
 }
 assert.equal(clicks,9);
});
test('the smallest phone toolbar allocates four controls on the first row and three on the second',()=>{
 const {shadow}=fixture();
 const rules=[...shadow.querySelector('style').sheet.cssRules];
 const compact=rules.find(rule=>rule.conditionText==='(max-width:352px)'||rule.media?.mediaText==='(max-width:352px)');
 assert.ok(compact);
 const rulesFor=node=>[...compact.cssRules].filter(rule=>node.matches(rule.selectorText));
 assert.equal(rulesFor(shadow.querySelector('.bar'))[0].style.getPropertyValue('grid-template-columns'),'repeat(12,minmax(0,1fr))');
 for(const id of ['#collapse-toolbar','#full-view','#undo','#mode-library','#save','#apply-live','.desktop-scheme']){
  const span=rulesFor(shadow.querySelector(id)).at(-1).style.getPropertyValue('grid-column');
  assert.equal(span,['#save','#apply-live','.desktop-scheme'].includes(id)?'span 4':'span 3',id);
 }
 const menuHeight=rulesFor(shadow.querySelector('.menu'))[0].style.getPropertyValue('max-height');
 assert.match(menuHeight,/var\(--wb-vv-height,100dvh\) \+ var\(--wb-vv-top,0px\) - var\(--wb-mobile-tools-top,110px\) - var\(--wb-safe-bottom\) - 10px/);
});
test('outside and Escape dismiss More without consuming native pointer input',()=>{const {window,document,shadow}=fixture();const menu=shadow.querySelector('.desktop-scheme');menu.open=true;const e=new window.Event('pointerdown',{bubbles:true,cancelable:true});document.body.dispatchEvent(e);assert.equal(menu.open,false);assert.equal(e.defaultPrevented,false);menu.open=true;const esc=new window.Event('keydown',{bubbles:true,cancelable:true});esc.key='Escape';shadow.dispatchEvent(esc);assert.equal(menu.open,false);});
test('work setup can return without replacement and closes open menus',()=>{const {shadow,flow}=fixture();const menu=shadow.querySelector('.desktop-scheme');menu.open=true;shadow.querySelector('.mobile-work').click();assert.equal(menu.open,false);assert.equal(shadow.querySelector('.flow-overlay').classList.contains('hidden'),false);shadow.querySelector('[data-flow=back]').click();assert.equal(shadow.querySelector('.flow-overlay').classList.contains('hidden'),true);flow.setEditorOpen();assert.equal(menu.open,false);});

test('workshop home uses the browser viewport and resets scroll after focusing its heading',()=>{
 const {shadow,flow}=fixture();
 const css=[...shadow.querySelectorAll('style')].find(style=>style.textContent.startsWith('.flow-overlay')).textContent;
 const overlay=shadow.querySelector('.flow-overlay'),title=overlay.querySelector('h2');
 assert.match(css,/\.flow-overlay\{[^}]*top:0;height:100vh;height:100dvh;/);
 assert.doesNotMatch(css,/--wb-vv-(?:top|height)/);
 assert.equal(title.getAttribute('tabindex'),'-1');
 let focusOptions;
 title.focus=options=>{focusOptions=options;overlay.scrollTop=100;};
 flow.show();
 assert.deepEqual(focusOptions,{preventScroll:true});
 assert.equal(overlay.scrollTop,0);
});

test('phone More aligns to the right and primary labels get intrinsic width and a 44px touch target',()=>{const {shadow}=fixture();const css=shadow.querySelector('style').textContent;assert.match(css,/\.bar \.menu\{right:0;width:min\(280px,calc\(100vw - 24px\)\)/);assert.doesNotMatch(css,/right:-48px/);const labels=['full-view','undo','mode-library','save','apply-live'].map(id=>shadow.querySelector('#'+id).textContent);assert.deepEqual(labels,['预览','撤销','素材库','保存草稿','应用']);assert.ok(css.includes('.bar>button,.bar>details{flex:1 0 max-content;min-width:44px}'));assert.match(css,/button,summary\{min-height:44px\}select\{min-height:40px\}/);assert.ok(css.includes('.bar summary{display:flex;align-items:center;justify-content:center;min-height:44px}'));assert.match(css,/\.bar>\.desktop-scheme\{order:6\}/);});

test('selected and primary command hover retains readable dark contrast',()=>{const {shadow}=fixture();const css=shadow.querySelector('style').textContent;assert.ok(css.includes('button[aria-pressed=true]:hover:not(:disabled),button.primary:hover:not(:disabled){background:#425b4b;border-color:#425b4b;color:white}'));});

test('More uses paired short actions, full-width controls and aligned touch-sized checks',()=>{
 const {shadow}=fixture(),css=shadow.querySelector('style').textContent;
 assert.equal(shadow.querySelector('.mobile-work').textContent,'工坊首页');
 assert.equal(shadow.querySelector('.mobile-work').getAttribute('aria-label'),'打开工坊首页');
 assert.equal(shadow.querySelector('.flow-overlay').getAttribute('aria-label'),'工坊首页');
 assert.equal(shadow.querySelector('#layout-adjust').textContent,'调整工作台高度');
 assert.equal(shadow.querySelector('.mobile-layout-toolbar span').textContent,'调整工作台高度');
 assert.equal(shadow.querySelector('#wb-mobile-splitter').getAttribute('aria-label'),'调整工作台高度');
 assert.ok(shadow.querySelector('#layout-adjust').classList.contains('menu-wide'));
 assert.match(css,/\.bar \.menu\{[^}]*overflow:auto;overscroll-behavior:contain;[^}]*grid-template-columns:minmax\(0,1fr\)/);
 assert.match(css,/\.bar \.menu>label,\.bar \.menu>section,\.bar \.menu>\.menu-wide\{grid-column:1\/-1\}/);
 assert.match(css,/\.bar \.menu label:has\(>input\[type=checkbox\]\)\{display:flex;flex-direction:row;align-items:center;gap:8px;min-height:44px\}/);
 assert.match(css,/input\[type=checkbox\]\{width:20px;height:20px;min-height:20px/);
 assert.equal(shadow.querySelector('#restore').nextElementSibling.id,'stop-and-close');
 assert.equal(shadow.querySelector('#stop-and-close').nextElementSibling.id,'close');
 assert.equal(shadow.querySelector('#import').nextElementSibling.id,'export');
});


test('phone hides only the desktop narrow-canvas preview command',()=>{
 const {shadow}=fixture();
 const rules=[...shadow.querySelector('style').sheet.cssRules];
 const phone=rules.find(rule=>rule.conditionText==='(max-width:700px)'||rule.media?.mediaText==='(max-width:700px)');
 assert.ok(phone);
 const hidden=[...phone.cssRules].filter(rule=>rule.style?.getPropertyValue('display')==='none'&&!rule.selectorText.includes(':host')&&!rule.selectorText.includes('::'));
 const narrow=shadow.querySelector('#narrow');
 assert.ok(hidden.some(rule=>narrow.matches(rule.selectorText)));
 for(const id of ['full-view','undo','mode-library','save','apply-live','layout-adjust','restore','close','import','export']){
  assert.ok(!hidden.some(rule=>shadow.querySelector('#'+id).matches(rule.selectorText)),id);
 }
 assert.ok(!rules.some(rule=>rule.style?.getPropertyValue('display')==='none'&&!rule.selectorText.includes(':host')&&!rule.selectorText.includes('::')&&narrow.matches(rule.selectorText)));
 assert.ok(hidden.some(rule=>shadow.querySelector('.wb-bottom').matches(rule.selectorText)));
 assert.ok(hidden.some(rule=>shadow.querySelector('#wb-splitter').matches(rule.selectorText)));
});
