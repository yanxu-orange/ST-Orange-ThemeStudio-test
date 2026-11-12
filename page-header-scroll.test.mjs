import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {createPageHeaderScrollAdapter,PAGE_HEADER_SCROLL_CSS} from './page-header-scroll.mjs';

const markup=`<div id="left-nav-panel"><div data-otl-page-header="presets"></div><div class="scrollableInner"></div></div>
<div id="right-nav-panel"><div data-otl-page-header="characters"></div><div class="scrollableInner"><div id="rm_characters_block"><div id="rm_print_characters_block"><div class="entity">character</div><div class="entity">group</div></div></div><div id="rm_ch_create_block"><form id="form_create"></form></div><div id="rm_group_chats_block"></div></div></div>
<div id="Backgrounds"><div data-otl-page-header="backgrounds"></div><div id="bg_tabs"><div id="bg_global_tab"></div><div id="bg_chat_tab" style="display:none"></div></div><button id="bg-scroll-top"></button></div><div id="unrelated"></div>`;
function env(){
 const {document,window}=parseHTML(`<html><body>${markup}</body></html>`);
 const get=id=>document.getElementById(id),root=get('right-nav-panel'),list=get('rm_print_characters_block');
 // linkedom has no layout/scroll implementation. Model actual inherited DOM
 // scroll accessors so tests can distinguish physical offsets from the bridge.
 const positions=new WeakMap(),proto=Object.create(Object.getPrototypeOf(root));
 Object.defineProperty(proto,'scrollTop',{configurable:true,get(){return positions.get(this)||0;},set(value){positions.set(this,Math.max(0,Number(value)||0));}});
 for(const element of document.querySelectorAll('*'))Object.setPrototypeOf(element,proto);
 root.getBoundingClientRect=()=>({top:20});root.clientTop=2;
 let origin=250,visible=true;
 list.getBoundingClientRect=()=>({top:22+origin-root.scrollTop});list.getClientRects=()=>visible?[{}]:[];
 const nativeStyle=get('Backgrounds').style;
 Object.defineProperty(get('Backgrounds'),'style',{value:{getPropertyValue:nativeStyle.getPropertyValue.bind(nativeStyle),setProperty:nativeStyle.setProperty.bind(nativeStyle),removeProperty:nativeStyle.removeProperty.bind(nativeStyle),getPropertyPriority:()=>''}});
 const calls=[];get('Backgrounds').scrollTo=(...args)=>{calls.push(args);get('Backgrounds').scrollTop=typeof args[0]==='object'?args[0].top:args[1];};
 const adapter=createPageHeaderScrollAdapter({document});
 return {document,window,get,root,list,adapter,calls,positions,proto,setOrigin:v=>origin=v,setVisible:v=>visible=v,roots:[get('left-nav-panel'),root,get('Backgrounds')]};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('CSS changes only marked roots, flattens the known surfaces without changing native display',()=>{
 assert.match(PAGE_HEADER_SCROLL_CSS,/data-otl-header-scroll/);
 for(const id of ['left-nav-panel','right-nav-panel','Backgrounds','rm_characters_block','rm_print_characters_block','rm_ch_create_block','form_create','rm_group_chats_block','bg_tabs','bg_global_tab','bg_chat_tab'])assert.ok(PAGE_HEADER_SCROLL_CSS.includes(`#${id}`));
 assert.match(PAGE_HEADER_SCROLL_CSS,/overflow:visible!important/);
 assert.doesNotMatch(PAGE_HEADER_SCROLL_CSS,/display:|position:|:has/);
});

test('native character/group/import offset calls land correctly beneath header and list controls',()=>{
 const e=env();e.adapter.sync([e.root]);
 for(const rowOffset of [0,97,410]){
  // Native element.offset().top - element.parent().offset().top.
  const parentTop=e.list.getBoundingClientRect().top,rowTop=parentTop+rowOffset;
  e.list.scrollTop=rowTop-parentTop;
  assert.equal(e.root.scrollTop,250+rowOffset);
  assert.equal(e.list.scrollTop,rowOffset);
 }
 e.setOrigin(400);e.list.scrollTop=80;assert.equal(e.root.scrollTop,480);
 e.adapter.stop();
});

test('native list refresh preserves scroll at header, controls, and lower rows; full refresh reaches list top',()=>{
 const e=env();e.adapter.sync([e.root]);
 for(const rootTop of [0,50,249,250,900]){
  e.root.scrollTop=rootTop;const currentScrollTop=e.list.scrollTop;
  assert.equal(currentScrollTop,rootTop-250);
  e.list.innerHTML='<div class="entity">replacement</div>';
  e.list.scrollTop=currentScrollTop;assert.equal(e.root.scrollTop,rootTop);
 }
 e.list.scrollTop=0;assert.equal(e.root.scrollTop,250);e.adapter.stop();
});

test('hidden character list refresh does not move a visible edit/group page',()=>{
 const e=env();e.adapter.sync([e.root]);e.root.scrollTop=680;e.setVisible(false);
 const saved=e.list.scrollTop;assert.equal(saved,0);e.list.scrollTop=saved;assert.equal(e.root.scrollTop,680);
 e.list.scrollTop=200;assert.equal(e.root.scrollTop,680);
 e.setVisible(true);e.list.scrollTop=200;assert.equal(e.root.scrollTop,450);e.adapter.stop();
});

test('native background button listeners share root scroll, including hidden tab, and preserve smooth/auto scrollTo',()=>{
 const e=env(),root=e.get('Backgrounds'),button=e.get('bg-scroll-top');let events=0;
 const tabs=['bg_global_tab','bg_chat_tab'].map(e.get);
 // Equivalent to the native setupScrollToTop listeners, registered beforehand.
 for(const tab of tabs){
  tab.addEventListener('scroll',()=>{events++;button.classList.toggle('visible',tab.scrollTop>300);});
  button.addEventListener('click',()=>tab.scrollTo({top:0,behavior:'smooth'}));
 }
 e.adapter.sync([root]);e.adapter.sync([root]);root.scrollTop=701;root.dispatchEvent(new e.window.Event('scroll'));
 assert.equal(events,2);assert.equal(button.classList.contains('visible'),true);
 button.dispatchEvent(new e.window.Event('click'));assert.equal(root.scrollTop,0);
 assert.deepEqual(e.calls,[[{top:0,behavior:'smooth'}],[{top:0,behavior:'smooth'}]]);
 root.dispatchEvent(new e.window.Event('scroll'));assert.equal(events,4);assert.equal(button.classList.contains('visible'),false);
 tabs[1].scrollTo({top:0,behavior:'auto'});assert.deepEqual(e.calls.at(-1),[{top:0,behavior:'auto'}]);
 tabs[0].scrollTo(0,120);assert.equal(root.scrollTop,120);tabs[1].scrollTop=77;assert.equal(root.scrollTop,77);
 e.adapter.stop();assert.equal(events,5);root.dispatchEvent(new e.window.Event('scroll'));assert.equal(events,5);
});

test('snapshot/reset precedes marker; stop restores physical inner offsets, root offset and marker',()=>{
 const e=env(),inner=e.root.querySelector('.scrollableInner');
 e.root.scrollTop=15;e.list.scrollTop=89;inner.scrollTop=45;e.root.setAttribute('data-otl-header-scroll','previous');
 const set=e.root.setAttribute.bind(e.root);
 e.root.setAttribute=(name,value)=>{if(name==='data-otl-header-scroll'){assert.equal(e.positions.get(e.list),0);assert.equal(e.positions.get(inner),0);}return set(name,value);};
 e.adapter.sync([e.root]);e.root.setAttribute=set;
 assert.equal(e.root.getAttribute('data-otl-header-scroll'),'');
 e.root.scrollTop=600;e.adapter.stop();
 assert.equal(e.list.scrollTop,89);assert.equal(inner.scrollTop,45);assert.equal(e.root.scrollTop,15);
 assert.equal(e.root.getAttribute('data-otl-header-scroll'),'previous');assert.equal(Object.hasOwn(e.list,'scrollTop'),false);
});

test('own descriptors restore exactly; unrelated nodes and prototype are untouched',()=>{
 const e=env(),tab=e.get('bg_global_tab'),root=e.get('Backgrounds');
 const descriptors={scrollTop:{configurable:true,enumerable:true,writable:true,value:91},scrollTo:{configurable:true,enumerable:true,writable:false,value(){}}};
 Object.defineProperties(tab,descriptors);const prototypeDescriptor=Object.getOwnPropertyDescriptor(e.proto,'scrollTop');
 e.adapter.sync([root]);assert.equal(e.get('unrelated').hasAttribute('data-otl-header-scroll'),false);
 e.adapter.stop();
 for(const key of Object.keys(descriptors))assert.deepEqual(Object.getOwnPropertyDescriptor(tab,key),descriptors[key]);
 assert.deepEqual(Object.getOwnPropertyDescriptor(e.proto,'scrollTop'),prototypeDescriptor);
 assert.equal(Object.hasOwn(e.get('bg_chat_tab'),'scrollTo'),false);
});

test('activation requires actual mounted root header and pages disable independently',()=>{
 const e=env();e.root.querySelector('[data-otl-page-header]').remove();e.adapter.sync([...e.roots,e.get('unrelated')]);
 assert.equal(Object.hasOwn(e.list,'scrollTop'),false);assert.equal(e.root.hasAttribute('data-otl-header-scroll'),false);
 assert.equal(e.get('Backgrounds').hasAttribute('data-otl-header-scroll'),true);
 e.adapter.sync([e.get('left-nav-panel')]);assert.equal(e.get('Backgrounds').hasAttribute('data-otl-header-scroll'),false);
 e.adapter.stop();e.adapter.stop();assert.equal(e.get('left-nav-panel').hasAttribute('data-otl-header-scroll'),false);
});

test('dynamic target remount restores detached nodes, bridges replacements once, and stop cancels observer',async()=>{
 const e=env(),root=e.get('Backgrounds'),old=e.get('bg_global_tab');e.adapter.sync([root]);
 old.outerHTML='<div id="bg_global_tab"></div>';const replacement=e.get('bg_global_tab');Object.setPrototypeOf(replacement,e.proto);
 await tick();assert.equal(Object.hasOwn(old,'scrollTo'),false);assert.equal(Object.hasOwn(replacement,'scrollTo'),true);
 let count=0;replacement.addEventListener('scroll',()=>count++);root.dispatchEvent(new e.window.Event('scroll'));assert.equal(count,1);
 e.adapter.sync([root]);root.dispatchEvent(new e.window.Event('scroll'));assert.equal(count,2);
 replacement.outerHTML='<div id="bg_global_tab"></div>';e.adapter.stop();await tick();assert.equal(Object.hasOwn(e.get('bg_global_tab'),'scrollTo'),false);
 e.adapter.sync([root]);assert.equal(Object.hasOwn(e.get('bg_global_tab'),'scrollTo'),true);e.adapter.stop();
});

test('root replacement/disconnection is cleaned up on sync without leaving live listeners',()=>{
 const e=env(),old=e.get('Backgrounds');e.adapter.sync([old]);const tab=e.get('bg_global_tab');let count=0;tab.addEventListener('scroll',()=>count++);
 old.remove();e.adapter.sync([old]);old.dispatchEvent(new e.window.Event('scroll'));
 assert.equal(count,0);assert.equal(Object.hasOwn(tab,'scrollTo'),false);assert.equal(old.hasAttribute('data-otl-header-scroll'),false);
 e.adapter.stop();
});

test('own accessor descriptors and their underlying native offsets both restore',()=>{
 const e=env();let value=75;
 const descriptor={configurable:true,enumerable:true,get(){return value;},set(next){value=next;}};
 Object.defineProperty(e.list,'scrollTop',descriptor);e.adapter.sync([e.root]);assert.equal(value,0);
 e.list.scrollTop=10;e.adapter.stop();assert.equal(value,75);assert.deepEqual(Object.getOwnPropertyDescriptor(e.list,'scrollTop'),descriptor);
});

test('native DOM classes and content survive activation; root scroll dispatch needs no document queries',()=>{
 const e=env(),before=[...e.document.querySelectorAll('*')].map(node=>[node,node.className]),root=e.get('Backgrounds');
 e.adapter.sync(e.roots);const query=e.document.querySelectorAll;
 e.document.querySelectorAll=()=>{throw Error('unexpected document query');};
 root.scrollTop=350;root.dispatchEvent(new e.window.Event('scroll'));
 e.document.querySelectorAll=query;e.adapter.stop();
 for(const [node,className]of before){assert.equal(node.isConnected,true);assert.equal(node.className,className);}
 assert.equal(e.list.children.length,2);assert.equal(e.get('bg_chat_tab').style.display,'none');
});

test('background native back-to-top button follows the viewport and its offset property restores',()=>{
 const e=env(),root=e.get('Backgrounds'),key='--otl-header-scroll-top';
 assert.match(PAGE_HEADER_SCROLL_CSS,/#Backgrounds\[data-otl-header-scroll\]>#bg-scroll-top\{transform:translateY\(var\(--otl-header-scroll-top,0px\)\)!important\}/);
 root.scrollTop=25;e.adapter.sync([root]);assert.equal(root.style.getPropertyValue(key),'25px');
 root.scrollTop=450;root.dispatchEvent(new e.window.Event('scroll'));assert.equal(root.style.getPropertyValue(key),'450px');
 e.adapter.stop();assert.ok(!root.style.getPropertyValue(key));
 root.style.setProperty(key,'7px');e.adapter.sync([root]);e.adapter.stop();assert.equal(root.style.getPropertyValue(key),'7px');
 // linkedom doesn't model declaration priority; inject it to verify exact forwarding.
 const set=root.style.setProperty.bind(root.style);let restoredPriority;
 root.style.getPropertyPriority=()=>'important';root.style.setProperty=(name,value,priority)=>{if(name===key&&value==='7px')restoredPriority=priority;return set(name,value);};
 e.adapter.sync([root]);e.adapter.stop();assert.equal(restoredPriority,'important');
});

test('cleanup removes only an originally absent empty style attribute and preserves concurrent styles',()=>{
 const e=env(),root=e.get('Backgrounds');assert.equal(root.hasAttribute('style'),false);
 e.adapter.sync([root]);e.adapter.stop();assert.equal(root.hasAttribute('style'),false);
 e.adapter.sync([root]);root.style.setProperty('color','red');e.adapter.stop();
 assert.equal(root.style.getPropertyValue('color'),'red');assert.equal(root.hasAttribute('style'),true);
 root.removeAttribute('style');root.setAttribute('style','');e.adapter.sync([root]);e.adapter.stop();assert.equal(root.hasAttribute('style'),true);
});

test('cleanup refreshes shared background button once using restored visible native tab',()=>{
 const e=env(),root=e.get('Backgrounds'),button=e.get('bg-scroll-top'),global=e.get('bg_global_tab'),chat=e.get('bg_chat_tab');
 global.getClientRects=()=>[];chat.getClientRects=()=>[{}];global.scrollTop=0;chat.scrollTop=640;let events=0;
 for(const tab of [global,chat])tab.addEventListener('scroll',()=>{events++;button.classList.toggle('visible',tab.scrollTop>300);});
 e.adapter.sync([root]);root.scrollTop=0;root.dispatchEvent(new e.window.Event('scroll'));assert.equal(button.classList.contains('visible'),false);
 e.adapter.stop();assert.equal(events,3);assert.equal(button.classList.contains('visible'),true);assert.equal(chat.scrollTop,640);
 root.dispatchEvent(new e.window.Event('scroll'));assert.equal(events,3);
});
