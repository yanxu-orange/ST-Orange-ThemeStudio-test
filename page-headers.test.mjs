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
 for(const bad of [{enabled:'true'},{extra:1},{asset:'missing'},{asset:'kitty-header-cat',image:art.image},{image:'javascript:alert(1)'},{image:'data:image/svg+xml,test'},{image:1},{sizing:'stretch'},{fit:'fill'},{height:39},{height:601},{height:'160'},{height:NaN},{x:-1},{y:101},{x:Infinity}])assert.throws(()=>normalizePageHeaders({pageHeaders:{home:bad}}));
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
test('all native mounts preserve content, background tabs share config, sizing preserves natural ratio',()=>{
 const markup='<div id="left-nav-panel"><div class="scrollableInner"><button>A</button></div></div><div id="right-nav-panel"><div class="scrollableInner"><button>B</button></div></div>'+['rm_api_block','WorldInfo','user-settings-block','bg_global_tab','bg_chat_tab','rm_extensions_block','PersonaManagement','AdvancedFormatting'].map(id=>`<div id="${id}"><button>${id}</button></div>`).join('');
 const {document,adapter}=env(markup),before=document.body.innerHTML;
 document.querySelector('#chat').innerHTML='<div class="welcomePanel"><h1>Recent</h1></div>';
 const native=[...document.querySelectorAll('button')];const c={pageHeaders:Object.fromEntries(Object.keys(PAGE_HEADER_PAGES).map(key=>[key,{...art}]))};adapter.update(c);
 assert.equal(document.querySelectorAll(field).length,11);assert.deepEqual([...document.querySelectorAll('button')],native);
 const settings=document.querySelector('#user-settings-block '+field),img=settings.firstElementChild;
 assert.equal(settings.style.height,'160px');assert.equal(img.style.objectFit,'cover');assert.equal(settings.style.flex,'0 0 auto');assert.equal(img.getAttribute('aria-hidden'),'true');
 c.pageHeaders.settings={...art,sizing:'ratio',fit:'contain',x:20,y:80};adapter.update(c);assert.equal(settings.firstElementChild,img);assert.equal(img.style.height,'auto');assert.equal(img.style.width,'100%');assert.equal(img.style.objectPosition,'20% 80%');assert.equal(settings.style.height,'auto');
 adapter.update(c);assert.equal(document.querySelectorAll(field).length,11);adapter.stop();document.querySelector('#chat').innerHTML='';assert.equal(document.body.innerHTML,before);
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
