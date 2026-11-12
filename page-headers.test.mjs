import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {mutationObserverFor} from './test-support/mutation-observer.mjs';
import {normalizePageHeaders,PAGE_HEADER_PAGES,PAGE_HEADER_DEFAULTS,createPageHeaderAdapter} from './page-headers.mjs';
const art={enabled:true,image:'https://example.com/header.webp'};
const field='[data-otl-page-header]';
function env(markup=''){
 const {document}=parseHTML(`<html><head></head><body><div id="chat"></div>${markup}</body></html>`),queue=new Map();let id=0;
 const adapter=createPageHeaderAdapter({document,MutationObserver:mutationObserverFor(document),requestFrame:fn=>{queue.set(++id,fn);return id;},cancelFrame:id=>queue.delete(id)});
 async function settle(){await new Promise(r=>setImmediate(r));for(const [key,fn]of [...queue]){queue.delete(key);fn();}await new Promise(r=>setImmediate(r));}
 return {document,adapter,settle,queue};
}
test('page header defaults complete old schemes and independently clone every page',()=>{
 const source={other:{keep:1},pageHeaders:{settings:{...art}}},a=normalizePageHeaders(source),b=normalizePageHeaders({});
 assert.deepEqual(Object.keys(a.pageHeaders),Object.keys(PAGE_HEADER_PAGES));assert.equal(a.other,source.other);
 assert.deepEqual(b.pageHeaders.home,PAGE_HEADER_DEFAULTS);a.pageHeaders.settings.height=250;
 assert.equal(source.pageHeaders.settings.height,undefined);assert.equal(a.pageHeaders.home.height,160);assert.equal(b.pageHeaders.settings.height,160);
});
test('page header validation rejects malformed shape, keys, image sources and numbers',()=>{
 for(const raw of [null,[],1,{pageHeaders:null},{pageHeaders:[]},{pageHeaders:{chat:{}}},{pageHeaders:{settings:null}},{pageHeaders:{settings:[]}}])assert.throws(()=>normalizePageHeaders(raw));
 for(const bad of [{enabled:'true'},{extra:1},{asset:'missing'},{asset:'kitty-header-cat',image:art.image},{image:'javascript:alert(1)'},{image:'data:image/svg+xml,test'},{image:1},{sizing:'stretch'},{fit:'fill'},{height:39},{height:601},{height:'160'},{height:NaN},{x:-1},{y:101},{x:Infinity},{topGap:-1},{sideGap:161},{topGap:NaN},{sideGap:'10'}])assert.throws(()=>normalizePageHeaders({pageHeaders:{home:bad}}));
 for(const good of [{height:40,x:0,y:100},{height:600,sizing:'ratio',fit:'contain'},{asset:'kitty-header-cat'}])assert.doesNotThrow(()=>normalizePageHeaders({pageHeaders:{home:good}}));
});
test('disabled or empty art adds no nodes and no observer; active pages are independent',()=>{
 const {document}=env('<div id="user-settings-block"><button>native</button></div><div id="WorldInfo"></div>');let observes=0,disconnects=0;
 class Observer{observe(){observes++;}disconnect(){disconnects++;}}
 const adapter=createPageHeaderAdapter({document,MutationObserver:Observer});
 adapter.update({});adapter.update({pageHeaders:{home:{enabled:true},settings:{image:art.image}}});assert.equal(observes,0);assert.equal(document.querySelector(field),null);
 adapter.update({pageHeaders:{settings:art}});assert.equal(observes,1);assert.equal(document.querySelector('#WorldInfo '+field),null);assert.equal(document.querySelector('#user-settings-block').firstElementChild.dataset.otlPageHeader,'settings');
 adapter.update({});assert.equal(document.querySelector(field),null);assert.equal(disconnects,1);adapter.stop();
});
test('all native mounts preserve content, background tabs share one header, sizing preserves natural ratio',()=>{
 const markup='<div id="left-nav-panel"><div class="scrollableInner"><button>A</button></div></div><div id="right-nav-panel"><div class="scrollableInner"><button>B</button></div></div>'+['rm_api_block','WorldInfo','user-settings-block','Backgrounds','rm_extensions_block','PersonaManagement','AdvancedFormatting'].map(id=>`<div id="${id}"><button>${id}</button></div>`).join('');
 const {document,adapter}=env(markup),before=document.body.innerHTML;
 document.querySelector('#chat').innerHTML='<div class="welcomePanel"><h1>Recent</h1></div>';
 const native=[...document.querySelectorAll('button')];const c={pageHeaders:Object.fromEntries(Object.keys(PAGE_HEADER_PAGES).map(key=>[key,{...art}]))};adapter.update(c);
 assert.equal(document.querySelectorAll(field).length,10);assert.deepEqual([...document.querySelectorAll('button')],native);
 const settings=document.querySelector('#user-settings-block '+field),img=settings.firstElementChild;
 assert.equal(settings.style.height,'160px');assert.equal(img.style.objectFit,'cover');assert.equal(settings.style.flex,'0 0 auto');assert.equal(img.getAttribute('aria-hidden'),'true');
 c.pageHeaders.settings={...art,sizing:'ratio',fit:'contain',x:20,y:80};adapter.update(c);assert.equal(settings.firstElementChild,img);assert.equal(img.style.height,'auto');assert.equal(img.style.width,'100%');assert.equal(img.style.objectPosition,'20% 80%');assert.equal(settings.style.height,'auto');
 adapter.update(c);assert.equal(document.querySelectorAll(field).length,10);adapter.stop();document.querySelector('#chat').innerHTML='';assert.equal(document.body.innerHTML,before);
});
test('home only decorates the direct native welcome panel, never real chats or system messages',async()=>{
 const {document,adapter,settle}=env(),chat=document.querySelector('#chat');
 chat.innerHTML='<div class="mes" is_system="true"><div class="welcomePanel">system text</div></div><div class="mes"><div class="mes_text"><div class="welcomePanel">chat text</div></div></div>';
 adapter.update({pageHeaders:{home:art}});assert.equal(document.querySelector(field),null);
 const welcome=document.createElement('div');welcome.className='welcomePanel';welcome.innerHTML='<button>Recent chats</button>';chat.append(welcome);await settle();assert.equal(welcome.querySelectorAll(field).length,1);
 welcome.remove();await settle();assert.equal(welcome.querySelector(field),null);assert.equal(document.querySelector(field),null);adapter.stop();
});
test('dynamic rebuilds recover once, ignore irrelevant updates and cancel pending work on stop',async()=>{
 const {document,adapter,settle,queue}=env('<div id="user-settings-block"><button>native</button></div>');adapter.update({pageHeaders:{settings:art}});await settle();assert.equal(queue.size,0);
 const host=document.querySelector('#user-settings-block');host.innerHTML='<button>rebuilt</button>';await settle();assert.equal(host.querySelectorAll(field).length,1);await settle();assert.equal(queue.size,0);
 host.outerHTML='<div id="user-settings-block"><input></div>';await settle();assert.equal(document.querySelectorAll(field).length,1);assert.equal(host.querySelector(field),null);
 const chat=document.querySelector('#chat');chat.innerHTML='<div class="mes"><div class="mes_text">text</div></div>';await settle();assert.equal(queue.size,0);
 for(let i=0;i<20;i++)chat.querySelector('.mes_text').textContent+='token';await new Promise(r=>setImmediate(r));assert.equal(queue.size,0);
 const next=document.createElement('div');next.id='WorldInfo';document.body.append(next);await new Promise(r=>setImmediate(r));assert.equal(queue.size,0);document.querySelector('#user-settings-block').remove();await new Promise(r=>setImmediate(r));assert.equal(queue.size,1);adapter.stop();assert.equal(queue.size,0);await settle();assert.equal(document.querySelector(field),null);
 next.id='user-settings-block';adapter.update({pageHeaders:{settings:art}});await settle();assert.equal(document.querySelectorAll(field).length,1);adapter.stop();
});

test('unchanged headers skip all mount scans while observer rebuilds and actual edits still work',async()=>{
 const {document,adapter,settle}=env('<div id="WorldInfo"><button>native</button></div>');
 const c=normalizePageHeaders({pageHeaders:{worldbook:art}});adapter.update(c,{validated:true});await settle();
 const query=document.querySelectorAll.bind(document);let scans=0;document.querySelectorAll=selector=>{scans++;return query(selector);};
 for(let i=0;i<30;i++)adapter.update({...c,text:i%2?'#fff':'#000'},{validated:true});
 assert.equal(scans,0);adapter.update({...c,fontSize:20});assert.equal(scans,0);
 c.pageHeaders.worldbook.height=300;adapter.update(c,{validated:true});assert.equal(scans,1);assert.equal(document.querySelector('[data-otl-page-header] img').style.height,'300px');
 c.pageHeaders.worldbook.image='https://example.com/changed.png';adapter.update(c,{validated:true});assert.equal(scans,2);assert.equal(document.querySelector('[data-otl-page-header] img').getAttribute('src'),c.pageHeaders.worldbook.image);
 document.querySelector('#WorldInfo').innerHTML='<input>';adapter.update(c,{validated:true});assert.equal(scans,2);await settle();assert.equal(scans,3);assert.equal(query('[data-otl-page-header]').length,1);adapter.stop();
});

test('page header gaps compensate native padding without changing content or other pages',()=>{
 const {document,adapter}=env('<div id="user-settings-block"><p>native hint</p><button>native</button></div><div id="WorldInfo"><input value="keep"></div>');
 document.defaultView.getComputedStyle=()=>({paddingLeft:'5px',paddingRight:'7px',paddingTop:'9px'});
 const host=document.querySelector('#user-settings-block'),before=host.innerHTML;
 adapter.update({pageHeaders:{settings:art}});
 const node=host.firstElementChild;assert.equal(node.getAttribute('data-otl-page-header'),'settings');assert.equal(node.nextElementSibling.textContent,'native hint');
 assert.equal(node.style.width,'max(0px, calc(100% + 12px))');assert.equal(node.style.marginLeft,'-5px');assert.equal(node.style.marginTop,'-9px');assert.equal(node.style.paddingTop,'0px');
 assert.equal(document.querySelector('#WorldInfo '+field),null);
 adapter.update({pageHeaders:{settings:{...art,topGap:23,sideGap:17}}});
 assert.equal(host.firstElementChild,node);assert.equal(node.style.width,'max(0px, calc(100% + -22px))');assert.equal(node.style.marginLeft,'12px');assert.equal(node.style.marginRight,'10px');assert.equal(node.style.paddingTop,'23px');assert.equal(node.style.height,'183px');assert.equal(node.firstElementChild.style.height,'160px');
 document.defaultView.getComputedStyle=()=>({paddingLeft:'12px',paddingRight:'12px',paddingTop:'8px'});document.defaultView.dispatchEvent(new document.defaultView.Event('resize'));assert.equal(node.style.marginLeft,'5px');assert.equal(node.style.marginTop,'-8px');
 adapter.stop();assert.equal(host.innerHTML,before);assert.equal(document.querySelector('#WorldInfo input').value,'keep');
});

test('presets, characters and backgrounds place one header before original controls without moving native nodes',()=>{
 const {document,adapter}=env('<div id="left-nav-panel"><p>native hint</p><div class="scrollableInner">presets</div></div><div id="right-nav-panel"><div id="rm_PinAndTabs">tabs</div><div class="scrollableInner">characters</div></div><div id="Backgrounds"><div id="bg-header-fixed">controls</div><div id="bg_tabs"><div id="bg_global_tab">global</div><div id="bg_chat_tab">chat</div></div></div>');
 const before=document.body.innerHTML,native=[...document.querySelectorAll('#left-nav-panel > *,#right-nav-panel > *,#Backgrounds > *')],parents=native.map(n=>n.parentNode);
 adapter.update({pageHeaders:{presets:art,characters:art,backgrounds:art}});
 for(const [id,page]of [['left-nav-panel','presets'],['right-nav-panel','characters'],['Backgrounds','backgrounds']])assert.equal(document.getElementById(id).firstElementChild.getAttribute('data-otl-page-header'),page);
 assert.equal(document.querySelectorAll('#Backgrounds '+field).length,1);for(const [i,n]of native.entries())assert.equal(n.parentNode,parents[i]);
 adapter.stop();assert.equal(document.body.innerHTML,before);
});

test('native content prepended later stays below the header without an observer loop',async()=>{
 const {document,adapter,settle,queue}=env('<div id="user-settings-block"><input></div>');adapter.update({pageHeaders:{settings:art}});await settle();
 const host=document.querySelector('#user-settings-block'),banner=host.firstElementChild,heading=document.createElement('h4');heading.textContent='native heading';host.prepend(heading);
 await settle();assert.equal(host.firstElementChild,banner);assert.equal(banner.nextElementSibling,heading);await settle();assert.equal(queue.size,0);adapter.stop();
});

test('unchanged header layout avoids writes, reads all hosts first, and detects padding changes without a resize',()=>{
 const {document,adapter}=env('<div id="user-settings-block"></div><div id="WorldInfo"></div>');
 let padding={paddingLeft:'5px',paddingRight:'7px',paddingTop:'9px'};const calls=[];
 document.defaultView.getComputedStyle=host=>{calls.push('read:'+host.id);return padding;};
 const c=normalizePageHeaders({pageHeaders:{settings:art,worldbook:art}});adapter.update(c,{validated:true});
 for(const node of document.querySelectorAll(field)){
  const style=node.style;Object.defineProperty(node,'style',{value:new Proxy(style,{get(target,key){return key==='width'?'browser-normalized-width':target[key];},set(target,key,value){calls.push('write:'+key);target[key]=value;return true;}})});
 }
 calls.length=0;
 for(let i=0;i<100;i++)adapter.update({...c,text:i%2?'#fff':'#000'},{validated:true});
 assert.equal(calls.filter(call=>call.startsWith('read:')).length,200);
 assert.equal(calls.filter(call=>call.startsWith('write:')).length,0);
 // Same total horizontal padding: a size-only invalidation would miss this.
 padding={paddingLeft:'8px',paddingRight:'4px',paddingTop:'9px'};calls.length=0;
 adapter.update(c,{validated:true});
 assert.deepEqual(calls.slice(0,2),['read:WorldInfo','read:user-settings-block']);
 assert.deepEqual(calls.slice(2),['write:marginLeft','write:marginRight','write:marginLeft','write:marginRight']);
 for(const node of document.querySelectorAll(field)){assert.equal(node.style.marginLeft,'-8px');assert.equal(node.style.marginRight,'-4px');}
 calls.length=0;document.defaultView.dispatchEvent(new document.defaultView.Event('resize'));
 assert.equal(calls.length,2);assert.ok(calls.every(call=>call.startsWith('read:')));
 adapter.stop();
});
