import {mutationObserverFor} from './test-support/mutation-observer.mjs';
import {normalizeCaptionConfig,newCaption} from './captions.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {createLiveAdapter} from './live-adapter.mjs';
import {defaultPhoto,kittyLayers} from './photos.mjs';
import {newLayer} from './layers.mjs';

function config(layout='left') {return {version:3,layout,background:'#edf1f8',surface:'#ffffff',surfaceOpacity:1,text:'#28365e',accent:'#7985b6',radius:9,font:'serif',fontSize:15,lineHeight:1.95,nameFont:'serif',nameColor:'#26365f',nameSize:22,timeColor:'#61769c',timeSize:12,caption:'虚构自定义\n第二行',captionFont:'serif',captionSize:11,captionColor:'#5d70a0',captionPosition:'below',timePosition:'below',reasoning:'自定义思维',reasoningFont:'serif',reasoningSize:14,glass:0,cardWidth:680,headerHeight:240,avatarSize:56,avatarRadius:8,layers:layout==='collage'?kittyLayers():[newLayer('flower')],photos:{ai:defaultPhoto({enabled:layout==='collage'}),user:defaultPhoto({enabled:layout==='collage'})}};}
function markup(id=0,user=false){return `<div class="mes" mesid="${id}" is_user="${user}" is_system="false"><div class="mesAvatarWrapper"><div class="avatar"><img src="/real-${id}.png"></div><div class="mesIDDisplay">#${id}</div></div><div class="mes_block"><div class="ch_name"><div class="flex1"><div class="alignItemsBaseline"><span class="name_text">原生名字${id}</span><small class="timestamp">原生时间</small></div></div><div class="mes_buttons"><button class="mes_edit">编辑</button></div><div class="mes_edit_buttons" style="display:none"><button>取消</button></div></div><details class="mes_reasoning_details" data-state="done"><summary class="mes_reasoning_summary"><div class="mes_reasoning_header"><span class="mes_reasoning_header_title" data-duration="2.5">真实耗时标题</span><span class="arrow">⌄</span></div><button class="mes_reasoning_copy">复制</button></summary><div class="mes_reasoning">虚构思维</div></details><div class="mes_text"><p>虚构正文${id}</p></div></div><div class="swipeRightBlock"><button class="swipe_right">翻页</button></div></div>`;}
function environment(options={}){
  const {document,window}=parseHTML(`<!doctype html><html><head><style id="custom-style">.original{color:red}</style></head><body><div id="chat">${markup()}${markup(1,true)}</div></body></html>`);
  document.getElementById('custom-style').disabled=false;
  let next=0;const queue=new Map();
  const adapter=createLiveAdapter({document,MutationObserver:mutationObserverFor(document),requestFrame:fn=>{const id=++next;queue.set(id,fn);return id;},cancelFrame:id=>queue.delete(id),resolveArtwork:l=>l.kind==='asset'?'/local/'+l.asset+'.webp':'data:image/svg+xml,test',...options});
  const settle=async()=>{await new Promise(r=>setImmediate(r));for(const [id,fn]of [...queue]){queue.delete(id);fn();}await new Promise(r=>setImmediate(r));};
  return {document,window,adapter,queue,settle};
}

test('page appearance and art updates are CSS-only and do not relayout chat messages',async()=>{
 const renders=[],{document,adapter,settle}=environment({onRender:r=>renders.push(r)});
 const c=config();adapter.start(c);await settle();renders.length=0;
 c.pageStyle={settings:{field:{background:'#123456'},art:{page:{image:'https://example.com/page.png'}}},worldbook:{entry:{radius:21}}};
 adapter.update(c);await settle();
 assert.equal(renders.at(-1).updated,0);const css=document.getElementById('orange-theme-live-style').textContent;
 assert.ok(css.includes('#user-settings-block'));assert.ok(css.includes('background-image:url("https://example.com/page.png")'));
 assert.ok(css.includes('#world_popup_entries_list .wi-card-entry'));
 c.pageStyle={};adapter.update(c);await settle();assert.equal(renders.at(-1).updated,0);assert.ok(!document.getElementById('orange-theme-live-style').textContent.includes('https://example.com/page.png'));
 adapter.stop();
});

test('applies snapshot while preserving real avatar, native nodes and listeners; restores precisely',async()=>{
  const {document,adapter,settle,queue}=environment(),msg=document.querySelector('.mes'),before=msg.outerHTML;
  const image=msg.querySelector('.avatar>img'),name=msg.querySelector('.name_text'),button=msg.querySelector('.mes_edit');let clicks=0;button.addEventListener('click',()=>clicks++);
  const input=config();adapter.start(input);input.caption='later mutation';await settle();
  assert.equal(msg.querySelector('.avatar>img'),image);assert.equal(image.getAttribute('src'),'/real-0.png');assert.equal(msg.querySelector('.name_text'),name);
  assert.equal(msg.querySelector('.otl-live-caption').textContent,'虚构自定义\n第二行');assert.match(msg.querySelector('.otl-live-reasoning').textContent,/2\.5 s$/);
  button.click();assert.equal(clicks,1);assert.equal(document.getElementById('custom-style').disabled,true);
  assert.equal(queue.size,0,'own decorations must not create an observer loop');
  adapter.stop();assert.equal(msg.outerHTML,before);assert.equal(document.querySelectorAll('[data-otl-live-owned]').length,0);assert.equal(document.getElementById('custom-style').disabled,false);button.click();assert.equal(clicks,2);
});
test('repeat apply switches layouts and never duplicates decoration or caption',async()=>{
  const {document,adapter,settle}=environment();adapter.start(config('collage'));await settle();
  assert.equal(document.querySelectorAll('#chat>.mes')[0].querySelectorAll('.otl-live-art img').length,4);
  assert.equal(document.querySelectorAll('#chat>.mes')[1].querySelectorAll('.otl-live-art img').length,5);
  adapter.start(config('left'));await settle();assert.equal(document.querySelectorAll('.otl-live-caption').length,2);assert.equal(document.querySelectorAll('.otl-live-art img').length,2);
  adapter.stop();
});
test('preserves initially disabled theme and original private attribute value',()=>{
  const {document,adapter}=environment();document.querySelector('#custom-style').disabled=true;document.documentElement.setAttribute('data-orange-live','prior');
  adapter.start(config());adapter.stop();assert.equal(document.querySelector('#custom-style').disabled,true);assert.equal(document.documentElement.getAttribute('data-orange-live'),'prior');
});
test('new messages and changed native identity are reconciled without retained old decorations',async()=>{
  const {document,adapter,settle,queue}=environment();adapter.start(config('collage'));await settle();
  const chat=document.querySelector('#chat');chat.insertAdjacentHTML('beforeend',markup(2));await settle();assert.equal(adapter.messageCount,3);assert.equal(chat.lastElementChild.querySelectorAll('.otl-live-art img').length,4);
  chat.lastElementChild.setAttribute('is_user','true');await settle();assert.equal(chat.lastElementChild.querySelectorAll('.otl-live-art img').length,5);assert.equal(queue.size,0);adapter.stop();
});
test('chat replacement cleans detached messages and observes the new chat',async()=>{
  const {document,adapter,settle}=environment();adapter.start(config());await settle();const old=document.querySelector('#chat'),oldMessage=old.firstElementChild;
  const next=document.createElement('div');next.id='chat';next.innerHTML=markup(7);old.replaceWith(next);await settle();
  assert.equal(oldMessage.hasAttribute('data-otl-live'),false);assert.equal(oldMessage.querySelector('.otl-live-caption'),null);assert.equal(next.firstElementChild.hasAttribute('data-otl-live'),true);assert.equal(adapter.messageCount,1);adapter.stop();
});
test('host rerender keeps existing new content and refreshes custom caption and reasoning duration',async()=>{
  const {document,adapter,settle}=environment();adapter.start(config());await settle();const msg=document.querySelector('.mes');
  const text=msg.querySelector('.mes_text');text.innerHTML='<p>新版虚构正文</p><textarea>编辑草稿</textarea>';
  const title=msg.querySelector('.mes_reasoning_header_title');title.setAttribute('data-duration','4.25');await settle();assert.match(msg.querySelector('.otl-live-reasoning').textContent,/4\.25 s$/);
  const names=msg.querySelector('.alignItemsBaseline');names.innerHTML='<span class="name_text">宿主更新名字</span><small class="timestamp">新时间</small>';await settle();assert.equal(names.querySelectorAll('.otl-live-caption').length,1);
  adapter.stop();assert.equal(msg.querySelector('.name_text').textContent,'宿主更新名字');assert.equal(text.querySelector('textarea').textContent,'编辑草稿');assert.equal(title.getAttribute('data-duration'),'4.25');
});
test('excludes fixtures and system messages; stop cancels pending refresh',async()=>{
  const {document,adapter,settle,queue}=environment();const chat=document.querySelector('#chat');chat.insertAdjacentHTML('beforeend',markup(8)+markup(9));chat.children[2].setAttribute('is_system','true');chat.children[3].setAttribute('data-orange-lab-fixture','message');
  adapter.start(config());await settle();assert.equal(adapter.messageCount,2);chat.insertAdjacentHTML('beforeend',markup(10));await new Promise(r=>setImmediate(r));assert.ok(queue.size>0);adapter.stop();assert.equal(queue.size,0);assert.equal(adapter.active,false);assert.equal(document.querySelectorAll('[data-otl-live]').length,0);
});
test('restore leaves concurrent host inline style and external children intact',()=>{
  const {document,adapter}=environment();const msg=document.querySelector('.mes');adapter.start(config());msg.style.setProperty('outline','2px solid blue');const extra=document.createElement('span');extra.textContent='宿主新增';msg.append(extra);adapter.stop();assert.equal(msg.style.getPropertyValue('outline'),'2px solid blue');assert.equal(extra.parentNode,msg);
});
test('native hide-avatar and document modes are inherited, and changing body mode reconciles',async()=>{
  const {document,adapter,settle}=environment();document.body.classList.add('hideChatAvatars');adapter.start(config('collage'));await settle();
  const msg=document.querySelector('.mes');assert.equal(msg.getAttribute('data-otl-live-avatar-hidden'),'true');assert.equal(msg.querySelector('[data-otl-live-role=avatar]').children.length,0);
  document.body.classList.remove('hideChatAvatars');await settle();assert.equal(msg.getAttribute('data-otl-live-avatar-hidden'),'false');assert.ok(msg.querySelector('[data-otl-live-role=avatar]').children.length>0);
  document.body.classList.add('documentstyle');await settle();assert.equal(msg.getAttribute('data-otl-live-avatar-hidden'),'true');assert.ok(parseFloat(msg.style.getPropertyValue('--sc-base-height'))>0);
  const buttons=msg.querySelector('.mes_edit_buttons');assert.equal(buttons.style.display,'none');adapter.stop();assert.ok(document.body.classList.contains('documentstyle'));assert.equal(buttons.style.display,'none');
});
test('text width is assigned without measuring content to grow the fixed region',()=>{
  const {document,adapter}=environment(),msg=document.querySelector('.mes'),name=msg.querySelector('.name_text'),measured=[];
  name.getBoundingClientRect=()=>{measured.push(msg.style.getPropertyValue('--sc-width-name'));return {left:0,top:0,width:200,height:240};};
  adapter.start(config('collage'));assert.equal(measured.length,0);assert.equal(msg.style.getPropertyValue('--sc-width-name'),'632px');const base=msg.style.getPropertyValue('--sc-base-height');adapter.reconcile();assert.equal(msg.style.getPropertyValue('--sc-base-height'),base);assert.equal(msg.style.getPropertyValue('--ol-meta-width'),'');adapter.stop();
});
test('font ready and loading events schedule only for the active session',async()=>{
  const {document,adapter,settle,queue}=environment();let resolveReady;const listeners=new Set();Object.defineProperty(document,'fonts',{value:{ready:new Promise(resolve=>{resolveReady=resolve;}),addEventListener:(name,fn)=>listeners.add(fn),removeEventListener:(name,fn)=>listeners.delete(fn)}});
  adapter.start(config());await settle();assert.equal(listeners.size,1);for(const fn of listeners)fn();assert.equal(queue.size,1);await settle();adapter.stop();assert.equal(listeners.size,0);resolveReady();await new Promise(r=>setImmediate(r));assert.equal(queue.size,0);assert.equal(adapter.active,false);
});
test('resize observer rebinds after chat replacement and releases old metadata',async()=>{
  const instances=[];class Resize{constructor(fn){this.fn=fn;this.nodes=new Set();this.disconnected=false;instances.push(this);}observe(node){this.nodes.add(node);}unobserve(node){this.nodes.delete(node);}disconnect(){this.disconnected=true;this.nodes.clear();}}
  const {document,adapter,settle}=environment({ResizeObserver:Resize});adapter.start(config());await settle();const old=document.querySelector('#chat'),oldNames=old.querySelector('.alignItemsBaseline'),next=document.createElement('div');next.id='chat';next.innerHTML=markup(4);old.replaceWith(next);await settle();assert.ok(instances[0].nodes.has(next));assert.ok(!instances[0].nodes.has(old));assert.ok(!instances[0].nodes.has(oldNames));adapter.stop();assert.equal(instances[0].disconnected,true);
});
test('native metadata replacement releases private markers on detached child nodes',async()=>{
  const {document,adapter,settle}=environment();adapter.start(config());await settle();const names=document.querySelector('.alignItemsBaseline'),parent=names.parentElement;
  parent.innerHTML='<div class="alignItemsBaseline"><span class="name_text">重建名字</span><small class="timestamp">重建时间</small></div>';await settle();assert.equal(names.hasAttribute('data-otl-live-meta'),false);assert.equal(names.querySelector('.otl-live-caption'),null);assert.equal(parent.querySelectorAll('.otl-live-caption').length,1);adapter.stop();
});

test('common offsets use full scene and leaves while native time and full DOM restore exactly',()=>{
  for(const layout of ['top','left','collage']){
    const {document,adapter}=environment(),msg=document.querySelector('.mes'),names=msg.querySelector('.alignItemsBaseline'),before=msg.outerHTML;
    const name=names.querySelector('.name_text');name.getBoundingClientRect=()=>({left:0,top:0,width:100,height:60});
    adapter.start({...config(layout),headerHeight:60,textAlign:'end',textInset:20,textTop:80,timeFont:'monospace',timePosition:'beside',captionPosition:'hidden'});
    const expectedX=24+(layout==='collage'?.69:layout==='left'?.45:.2)*632;
    assert.ok(Math.abs(parseFloat(msg.style.getPropertyValue('--sc-left-name'))-expectedX)<.001);
    assert.equal(msg.style.getPropertyValue('--sc-total-height'),'60px');
    assert.equal(names.querySelector('.timestamp').textContent,'原生时间');assert.equal(names.querySelector('.timestamp').getAttribute('style'),null);
    adapter.stop();assert.equal(msg.outerHTML,before);
  }
});

test('independent scene movement clips both directions without height growth and restores native DOM',async()=>{
  const {document,adapter,settle,queue}=environment(),msg=document.querySelector('.mes'),before=msg.outerHTML;
  msg.querySelector('.name_text').getBoundingClientRect=()=>({left:0,top:0,width:100,height:40});msg.querySelector('.timestamp').getBoundingClientRect=()=>({left:0,top:0,width:100,height:70});
  adapter.start({...config('collage'),textItems:{name:{x:-20,y:-100,weight:900,z:0},time:{x:30,y:200,z:8}}});await settle();
  assert.equal(msg.style.getPropertyValue('--sc-reserve-top'),'0px');assert.equal(msg.style.getPropertyValue('--sc-total-height'),'240px');
  assert.equal(parseFloat(msg.style.getPropertyValue('--sc-left-name')),24+.29*632);const base=msg.style.getPropertyValue('--sc-base-height');
  adapter.reconcile();assert.equal(msg.style.getPropertyValue('--sc-reserve-top'),'0px');assert.equal(msg.style.getPropertyValue('--sc-total-height'),'240px');assert.equal(msg.style.getPropertyValue('--sc-base-height'),base);await settle();assert.equal(queue.size,0);
  adapter.stop();assert.equal(msg.outerHTML,before);
});
test('live font callbacks cannot register after stop or change native text',async()=>{
  const {document,window,adapter,settle}=environment(),faces=[],added=new Set();
  class Face{constructor(){faces.push(this);}load(){return new Promise(resolve=>this.resolve=()=>resolve(this));}}
  window.FontFace=Face;Object.defineProperty(document,'fonts',{value:{add:f=>added.add(f),delete:f=>added.delete(f)}});
  const before=document.querySelector('.mes').outerHTML,c={...config(),textItems:{name:{fontLink:{url:'https://example.com/font.woff2',faceWeight:'400'}}}};
  adapter.start(c);faces[0].resolve();await settle();assert.equal(added.size,1);assert.equal(document.querySelector('.name_text').textContent,'原生名字0');adapter.stop();assert.equal(added.size,0);assert.equal(document.querySelector('.mes').outerHTML,before);
  adapter.start(c);adapter.stop();faces[1].resolve();await settle();assert.equal(added.size,0);assert.equal(adapter.active,false);
});

test('custom caption wraps only owned nodes, measures after width, follows new messages and restores',async()=>{
  for(const layout of ['left','collage'])for(const timePosition of ['below','beside']){
    const {document,adapter,settle,queue}=environment(),msg=document.querySelector('.mes'),names=msg.querySelector('.alignItemsBaseline'),before=msg.outerHTML,name=names.querySelector('.name_text'),time=names.querySelector('.timestamp');
    const reads=[];Object.defineProperty(names,'offsetHeight',{get(){throw Error('stable scene must not measure flowing metadata');}});
    const c={...config(layout),captionWidth:75,timePosition,captionPosition:'below',textItems:{caption:{x:-20,y:50,weight:700,z:21}}};
    adapter.start(c);await settle();
    assert.equal(msg.style.getPropertyValue('--sc-width-cap-caption-legacy'),'474px');
    assert.equal(name.parentNode,names);assert.equal(time.parentNode,names);assert.equal(names.querySelector('.otl-live-caption').parentElement.className,'otl-live-caption-slot');
    assert.equal(names.querySelectorAll('.otl-live-caption-slot').length,1);adapter.reconcile();assert.equal(names.querySelectorAll('.otl-live-caption').length,1);assert.equal(names.querySelector('.otl-live-caption').textContent,c.caption);
    document.querySelector('#chat').insertAdjacentHTML('beforeend',markup(7));await settle();assert.equal(document.querySelectorAll('.mes[mesid="7"] .otl-live-caption-slot').length,1);assert.equal(queue.size,0);
    adapter.stop();assert.equal(msg.outerHTML,before);assert.equal(document.querySelector('.otl-live-caption-slot'),null);
    adapter.start({...c,captionWidth:'auto',textItems:{}});assert.equal(names.querySelector('.otl-live-caption').parentNode,names);assert.equal(msg.style.getPropertyValue('--ol-caption-width-caption-legacy'),'');adapter.stop();
  }
});


test('multiple captions constrain every width without growing region and keep one node per ID',async()=>{
 const {document,window,adapter,settle,queue}=environment(),msg=document.querySelector('.mes'),before=msg.outerHTML,names=msg.querySelector('.alignItemsBaseline'),reads=[];
 const rect=(top,bottom)=>({top,bottom,width:100,height:bottom-top});window.HTMLElement.prototype.getBoundingClientRect=function(){if(this.classList.contains('ch_name'))return rect(100,300);if(this.classList.contains('otl-live-caption'))return this.dataset.captionId==='a'?rect(400,500):this.dataset.captionId==='b'?rect(20,60):rect(-1000,1000);return rect(0,0);};
 Object.defineProperty(names,'offsetHeight',{get(){reads.push([msg.style.getPropertyValue('--ol-caption-width-a'),msg.style.getPropertyValue('--ol-caption-width-c')]);return msg.style.getPropertyValue('--ol-meta-width')==='23%'?200:80;}});
 const c=normalizeCaptionConfig(config('collage'));c.captions=[newCaption({id:'a',width:50,y:140}),newCaption({id:'b',position:'above',y:-60}),newCaption({id:'c',width:80,visible:false,y:-400})];adapter.start(c);await settle();
 assert.ok(reads.every(([a,c])=>parseFloat(a)===(680-48)*.5&&parseFloat(c)===(680-48)*.8));assert.equal(msg.style.getPropertyValue('--sc-width-cap-a'),'316px');assert.equal(msg.style.getPropertyValue('--sc-width-cap-c'),'505.6px');assert.equal(msg.style.getPropertyValue('--sc-reserve-top'),'0px');assert.equal(msg.style.getPropertyValue('--sc-total-height'),'240px');
 adapter.reconcile();await settle();assert.equal(msg.querySelectorAll('.otl-live-caption').length,3);assert.equal(msg.querySelectorAll('.otl-live-caption-slot').length,2);assert.equal(queue.size,0);
 document.querySelector('#chat').insertAdjacentHTML('beforeend',markup(9));await settle();assert.equal(document.querySelectorAll('.otl-live-caption').length,9);for(const node of document.querySelectorAll('.mes'))for(const id of ['a','b','c'])assert.equal(node.querySelectorAll('.otl-live-caption[data-caption-id="'+id+'"]').length,1);
 adapter.stop();assert.equal(msg.outerHTML,before);adapter.start({...c,captions:[]});assert.equal(document.querySelectorAll('.otl-live-caption,.otl-live-caption-slot').length,0);adapter.stop();assert.equal(msg.outerHTML,before);
});
test('rebuilding native metadata removes old owned captions and zero captions never return',async()=>{
 const {document,adapter,settle}=environment(),c=normalizeCaptionConfig(config());c.captions=[newCaption({id:'first'}),newCaption({id:'second',width:60})];adapter.start(c);await settle();const old=document.querySelector('.alignItemsBaseline'),replacement=document.createElement('div');replacement.className='alignItemsBaseline';replacement.innerHTML='<span class="name_text">新宿主名字</span><small class="timestamp">新宿主时间</small>';old.replaceWith(replacement);await settle();
 assert.equal(old.hasAttribute('data-otl-live-meta'),false);assert.equal(old.querySelector('.otl-live-caption'),null);assert.equal(replacement.querySelectorAll('.otl-live-caption').length,2);adapter.stop();assert.equal(replacement.querySelector('.name_text').textContent,'新宿主名字');assert.equal(replacement.querySelector('.otl-live-caption'),null);
});

test('body/card application keeps native special nodes, listeners and snapshot until exact restoration',async()=>{
 const {document,adapter,settle}=environment(),msg=document.querySelector('.mes'),body=msg.querySelector('.mes_text');body.insertAdjacentHTML('beforeend','<ul><li>原列表</li></ul><pre><code>original()</code></pre><blockquote><p>原引用</p></blockquote><details class="native-fold"><summary>原折叠</summary><p>原内容</p></details><p><img src="/fictional.png"></p>');
 const before=msg.outerHTML,code=body.querySelector('code'),fold=body.querySelector('.native-fold'),summary=fold.querySelector('summary');let clicks=0;summary.addEventListener('click',()=>clicks++);
 const c={...config(),bodyWeight:350,bodyParagraphGap:24,bodyPaddingLeft:13,bodyPaddingRight:8,bodyIndent:true,cardBorderMode:'custom',cardBorderColor:'#123456',cardBorderWidth:3,cardBorderStyle:'dashed',cardBorderTop:true,cardBorderRight:false,cardBorderBottom:true,cardBorderLeft:false};adapter.start(c);await settle();const style=document.querySelector('#orange-theme-live-style').textContent;c.bodyParagraphGap=0;c.cardBorderColor='#ffffff';await settle();assert.equal(document.querySelector('#orange-theme-live-style').textContent,style);assert.equal(body.querySelector('code'),code);assert.equal(body.querySelector('.native-fold'),fold);summary.click();assert.equal(clicks,1);
 assert.throws(()=>adapter.start({...config(),bodyParagraphGap:null}));assert.equal(adapter.active,true);assert.equal(document.querySelector('#orange-theme-live-style').textContent,style);adapter.stop();assert.equal(msg.outerHTML,before);summary.click();assert.equal(clicks,2);
});

test('reasoning anchors track real content, scope, native open state and remount without duplicate nodes',async()=>{
 const {normalizeReasoningConfig}=await import('./reasoning.mjs');const {document,adapter,settle,queue}=environment();const c=normalizeReasoningConfig(normalizeCaptionConfig(config())),entry=newLayer('flower',{anchor:'reasoning-entry',scope:'ai'}),body=newLayer('star',{anchor:'reasoning-body',scope:'both'});c.layers=[entry,body];c.reasoningStyle.entry.content='独立入口';c.reasoningStyle.entry.background.mode='color';c.reasoningStyle.entry.background.opacity=.4;
 const msg=document.querySelector('.mes'),details=msg.querySelector('details'),summary=details.querySelector('summary'),title=details.querySelector('.mes_reasoning_header_title'),originalTitle=title.textContent,bodyNode=details.querySelector('.mes_reasoning'),originalBody=bodyNode.textContent,before=msg.outerHTML;let clicks=0;summary.addEventListener('click',()=>clicks++);
 adapter.start(c);await settle();const realArrow=summary.querySelector('.arrow');realArrow.classList.add('mes_reasoning_arrow');const arrowRules=[...document.querySelector('#orange-theme-live-style').sheet.cssRules].filter(r=>r.selectorText?.includes('.mes_reasoning_arrow:is('));assert.equal(arrowRules.length,1);assert.equal(realArrow.matches(arrowRules[0].selectorText),true);details.setAttribute('open','');assert.equal(realArrow.matches(arrowRules[0].selectorText),false);details.removeAttribute('open');realArrow.classList.remove('mes_reasoning_arrow');assert.equal(details.hasAttribute('open'),false);assert.equal(summary.querySelectorAll('.otl-live-reasoning').length,1);assert.equal(summary.querySelectorAll('.otl-live-art img').length,1);assert.equal(bodyNode.querySelectorAll('.otl-live-art img').length,1);assert.equal(document.querySelectorAll('.mes')[1].querySelector('.mes_reasoning_header .otl-live-art img'),null);assert.equal(bodyNode.textContent,originalBody);assert.equal(title.textContent,originalTitle);summary.click();assert.equal(clicks,1);
 details.setAttribute('open','');await settle();assert.equal(details.hasAttribute('open'),true);details.removeAttribute('open');await settle();assert.equal(details.hasAttribute('open'),false);adapter.reconcile();await settle();assert.equal(summary.querySelectorAll('.otl-live-reasoning').length,1);assert.equal(queue.size,0);
 details.dataset.state='none';bodyNode.textContent='';await settle();assert.equal(details.querySelectorAll('[data-otl-reason-owned]').length,0);assert.equal(title.hasAttribute('data-otl-live-reasoning'),false);assert.equal(details.hasAttribute('open'),false);
 bodyNode.textContent='新增虚构思维';details.dataset.state='done';title.dataset.duration='unknown';await settle();assert.equal(details.querySelector('.otl-live-reasoning').textContent,'独立入口');assert.equal(bodyNode.querySelectorAll('.otl-live-art img').length,1);
 const replacement=details.cloneNode(true);replacement.querySelectorAll('[data-otl-live-owned]').forEach(n=>n.remove());replacement.querySelector('.mes_reasoning_header_title').removeAttribute('data-otl-live-reasoning');details.replaceWith(replacement);await settle();assert.equal(details.querySelectorAll('[data-otl-live-owned]').length,0);assert.equal(replacement.querySelectorAll('.otl-live-reasoning').length,1);assert.equal(replacement.querySelectorAll('.otl-live-art img').length,2);
 adapter.stop();assert.equal(replacement.querySelectorAll('[data-otl-live-owned]').length,0);assert.equal(replacement.querySelector('.mes_reasoning').textContent,'新增虚构思维');assert.equal(replacement.querySelector('.mes_reasoning_header_title').textContent,originalTitle);assert.equal(replacement.hasAttribute('open'),false);assert.equal(document.querySelectorAll('[data-otl-live-owned]').length,0);assert.notEqual(msg.outerHTML,before,'host content changed legitimately');
});

test('reasoning family responds to actual interface updates without affecting body typography or retaining observers',async()=>{
 const {normalizeReasoningConfig}=await import('./reasoning.mjs');const {document,window,adapter,settle,queue}=environment();let family='Lato, sans-serif';window.getComputedStyle=()=>({display:'block',fontFamily:family});const c=normalizeReasoningConfig(normalizeCaptionConfig(config()));c.reasoningStyle.entry.fontSource='interface';c.reasoningStyle.body.fontSource='body';c.reasoningStyle.entry.size=25;c.reasoningStyle.body.size=18;adapter.start(c);await settle();
 const style=document.querySelector('#orange-theme-live-style'),find=selector=>[...style.sheet.cssRules].find(r=>r.selectorText===selector),q='#chat > .mes[data-otl-live]';assert.equal(find(q+' .mes_reasoning_header').style.getPropertyValue('font-family'),'Lato, sans-serif');assert.equal(find(q+' .mes_reasoning').style.getPropertyValue('font-size'),'18px');family='Other UI';document.body.classList.add('different-family');await settle();assert.equal(find(q+' .mes_reasoning_header').style.getPropertyValue('font-family'),'Other UI');assert.equal(find(q+' .mes_reasoning').style.getPropertyValue('font-family'),c.font);assert.equal(queue.size,0);adapter.stop();document.body.classList.add('after-stop');await settle();assert.equal(queue.size,0);assert.equal(style.isConnected,false);
});

test('footer adds only owned content after attachments, separates scope and reconciles native rebuilds precisely',async()=>{
 const {normalizeFooterConfig,newFooterCaption}=await import('./footer.mjs'),{normalizeReasoningConfig}=await import('./reasoning.mjs');const {document,window,adapter,settle,queue}=environment();const c=normalizeFooterConfig(normalizeReasoningConfig(normalizeCaptionConfig(config())));c.footerCaptions=[newFooterCaption({id:c.captions[0].id,content:'尾部第一\n换行',width:70,x:-20,y:-35}),newFooterCaption({content:'尾部第二',y:70})];c.layers.push(newLayer('custom',{anchor:'footer',scope:'ai',image:'data:image/png;base64,AAAA'}));const msg=document.querySelector('.mes'),block=msg.querySelector('.mes_block');block.insertAdjacentHTML('beforeend','<div class="mes_media_wrapper"><img src="/native-media.png"></div><div class="mes_file_wrapper">原生附件</div><div class="mes_bias">原生bias</div>');const before=msg.outerHTML,nativeText=msg.querySelector('.mes_text'),nativeDetails=msg.querySelector('details');adapter.start(c);await settle();const root=msg.querySelector('.otl-footer'),image=root.querySelector('img');assert.equal(root.parentElement,block);assert.equal(root.previousElementSibling.className,'mes_bias');assert.equal(root.querySelectorAll('.otl-footer-caption').length,2);assert.equal(root.querySelectorAll('img').length,1);assert.equal(document.querySelectorAll('.mes')[1].querySelector('.otl-footer img'),null);assert.equal(msg.querySelector('.otl-live-caption').textContent,c.captions[0].content);assert.equal(msg.querySelector('.mes_text'),nativeText);assert.equal(msg.querySelector('details'),nativeDetails);image.dispatchEvent(new window.Event('load'));await settle();assert.equal(queue.size,0);
 const hostNativeSlot=document.createElement('div');hostNativeSlot.className='future-native-footer-slot';block.append(hostNativeSlot);await settle();assert.equal(block.lastElementChild,root);assert.ok(hostNativeSlot.isConnected);const detached=root;root.remove();const redraw=document.createElement('span');redraw.textContent='原生重绘触发';nativeText.append(redraw);await settle();assert.equal(msg.querySelectorAll('.otl-footer').length,1);assert.equal(detached.querySelectorAll('[data-otl-live-owned]').length,0);
 redraw.remove();const chat=document.querySelector('#chat');chat.insertAdjacentHTML('beforeend',markup(4));await settle();assert.equal(chat.lastElementChild.querySelectorAll('.otl-footer-caption').length,2);assert.equal(queue.size,0);adapter.stop();assert.equal(document.querySelectorAll('.otl-footer').length,0);assert.equal(msg.querySelector('.mes_text'),nativeText);assert.equal(hostNativeSlot.isConnected,true);hostNativeSlot.remove();assert.equal(msg.outerHTML,before);image.dispatchEvent(new window.Event('load'));await settle();assert.equal(queue.size,0);
});

test('empty footer and unresolved images do not consume space or interfere with independent native footer slot',async()=>{
 const {normalizeFooterConfig}=await import('./footer.mjs'),{normalizeReasoningConfig}=await import('./reasoning.mjs');const {document,adapter,settle}=environment({resolveArtwork:l=>l.image||''});const c=normalizeFooterConfig(normalizeReasoningConfig(normalizeCaptionConfig(config())));c.layers=[newLayer('custom',{anchor:'footer',image:''})];const block=document.querySelector('.mes_block'),slot=document.createElement('div');slot.className='future-native-footer-slot';block.append(slot);adapter.start(c);await settle();assert.equal(document.querySelector('.otl-footer'),null);assert.ok(slot.isConnected);assert.equal(slot.style.height,'');adapter.stop();assert.ok(slot.isConnected);
});

test('native visual references keep true action siblings and edit states, refresh replaced controls and restore all owned data',async()=>{
 const {normalizeNativeConfig}=await import('./native.mjs'),{normalizeFooterConfig}=await import('./footer.mjs'),{normalizeReasoningConfig}=await import('./reasoning.mjs');const {document,window,adapter,settle,queue}=environment(),msg=document.querySelector('.mes'),header=msg.querySelector('.ch_name'),buttons=msg.querySelector('.mes_buttons'),editing=msg.querySelector('.mes_edit_buttons'),edit=buttons.querySelector('.mes_edit');buttons.insertAdjacentHTML('afterbegin','<span class="extraMesButtonsHint">更多</span><div class="extraMesButtons"></div>');const hint=buttons.querySelector('.extraMesButtonsHint'),extra=buttons.querySelector('.extraMesButtons');let edits=0,more=0;edit.addEventListener('click',()=>edits++);hint.addEventListener('click',()=>{assert.equal(hint.nextElementSibling,extra);more++;});const c=normalizeNativeConfig(normalizeFooterConfig(normalizeReasoningConfig(normalizeCaptionConfig(config()))));Object.assign(c.nativeStyle.actions.edit,{position:'footer',mode:'text',text:'修改原消息',source:null});const originalParent=edit.parentNode;adapter.start(c);await settle();assert.equal(buttons.parentNode,header);assert.equal(edit.parentNode,originalParent);assert.equal(hint.nextElementSibling,extra);assert.equal(edit.querySelector('.otl-native-label').textContent,'修改原消息');edit.click();hint.click();assert.equal(edits,1);assert.equal(more,1);
 buttons.style.display='none';editing.style.display='inline-flex';extra.classList.add('visible');await settle();assert.equal(editing.parentNode,header);assert.equal(editing.getAttribute('data-otl-native-role'),'editing');assert.equal(queue.size,0,'native style changes settle without private-variable observer loops');const replacement=document.createElement('button');replacement.className='mes_edit';replacement.textContent='原生重建编辑';edit.replaceWith(replacement);await settle();assert.equal(replacement.querySelector('.otl-native-label').textContent,'修改原消息');assert.equal(edit.querySelector('.otl-native-label'),null);assert.equal(edit.hasAttribute('data-otl-native-mode'),false);adapter.stop();assert.equal(replacement.parentNode,buttons);assert.equal(replacement.textContent,'原生重建编辑');assert.equal(replacement.hasAttribute('data-otl-native-mode'),false);assert.equal(document.querySelectorAll('.otl-native-label,.otl-native-footer,.otl-native-head').length,0);assert.equal(buttons.style.display,'none');assert.equal(editing.style.display,'inline-flex');assert.equal(hint.nextElementSibling,extra);assert.equal(queue.size,0);
});

test('native latest-AI markers and counter-only hiding update after user AI deletion without rewriting host hidden states',async()=>{
 const {normalizeNativeConfig}=await import('./native.mjs'),{normalizeFooterConfig}=await import('./footer.mjs'),{normalizeReasoningConfig}=await import('./reasoning.mjs');const {document,adapter,settle,queue}=environment(),chat=document.querySelector('#chat'),ai=chat.firstElementChild,user=chat.lastElementChild;ai.querySelector('.swipeRightBlock').insertAdjacentHTML('beforeend','<div class="swipes-counter" hidden>2/2</div>');const counter=ai.querySelector('.swipes-counter');const c=normalizeNativeConfig(normalizeFooterConfig(normalizeReasoningConfig(normalizeCaptionConfig(config()))));adapter.start(c);await settle();assert.equal(ai.getAttribute('data-otl-native-latest-ai'),'true');assert.equal(user.getAttribute('data-otl-native-latest-ai'),'false');assert.equal(ai.getAttribute('data-otl-native-hide-counter'),'false');assert.equal(counter.hidden,true);assert.equal(counter.textContent,'2/2');chat.insertAdjacentHTML('beforeend',markup(9));await settle();const next=chat.lastElementChild;assert.equal(ai.getAttribute('data-otl-native-hide-counter'),'true');assert.equal(next.getAttribute('data-otl-native-latest-ai'),'true');chat.insertAdjacentHTML('beforeend',markup(10,true));await settle();assert.equal(next.getAttribute('data-otl-native-latest-ai'),'true');assert.equal(next.classList.contains('last_mes'),false,'theme must not manufacture host swipe availability');next.remove();await settle();assert.equal(ai.getAttribute('data-otl-native-latest-ai'),'true');assert.equal(ai.getAttribute('data-otl-native-hide-counter'),'false');assert.equal(counter.hidden,true);adapter.stop();assert.equal(counter.hidden,true);assert.equal(counter.textContent,'2/2');assert.equal(ai.hasAttribute('data-otl-native-latest-ai'),false);assert.equal(queue.size,0);
});

test('native role styles exclusively own important action font/color and statistics position without force-show',async()=>{
 const {normalizeNativeConfig}=await import('./native.mjs'),{normalizeFooterConfig}=await import('./footer.mjs'),{normalizeReasoningConfig}=await import('./reasoning.mjs');const {document,adapter,settle}=environment(),msg=document.querySelector('.mes'),wrapper=msg.querySelector('.mesAvatarWrapper'),edit=msg.querySelector('.mes_edit');edit.classList.add('mes_button');wrapper.insertAdjacentHTML('beforeend','<div class="mes_timer" style="display:none">2s</div><div class="tokenCounterDisplay" style="display:none">120t</div>');msg.querySelector('.mesIDDisplay').style.display='none';const before=msg.outerHTML,parents=[...wrapper.querySelectorAll('.mesIDDisplay,.mes_timer,.tokenCounterDisplay')].map(n=>[n,n.parentNode]),c=normalizeNativeConfig(normalizeFooterConfig(normalizeReasoningConfig(normalizeCaptionConfig(config()))));c.nativeStyle.actions.size=23;c.nativeStyle.actions.color='#123456';adapter.start(c);await settle();const rules=[...document.querySelector('#orange-theme-live-style').sheet.cssRules].filter(r=>r.selectorText&&!r.selectorText.includes('::')),important=(node,key)=>rules.filter(r=>r.selectorText&&r.style.getPropertyPriority(key)==='important'&&node.matches(r.selectorText)).map(r=>r.style.getPropertyValue(key));assert.deepEqual(important(edit,'font-size'),['23px']);assert.deepEqual(important(edit,'color'),['#123456']);for(const [stat,parent]of parents){assert.deepEqual(important(stat,'position'),['absolute']);assert.equal(stat.parentNode,parent);assert.equal(stat.style.display,'none');assert.equal(important(stat,'display').length,0);}assert.ok(rules.some(r=>r.selectorText&&r.style.getPropertyValue('min-width')==='24px'&&edit.matches(r.selectorText)));adapter.stop();assert.equal(msg.outerHTML,before);
});

test('full-header avatar preserves real source, reserves content, respects hidden avatars and exits cleanly',async()=>{
 const {normalizeAvatarFill}=await import('./avatar-fill.mjs');
 const {normalizeTextScene}=await import('./text-scene.mjs');
 const {normalizeNativeConfig}=await import('./native.mjs');
 const {normalizeFooterConfig}=await import('./footer.mjs');
 const {normalizeReasoningConfig}=await import('./reasoning.mjs');
 const {normalizeChromeConfig}=await import('./chrome.mjs');
 const {document,adapter,settle}=environment(),msg=document.querySelector('.mes'),before=msg.outerHTML;
 const c=normalizeAvatarFill(normalizeChromeConfig(normalizeTextScene(normalizeNativeConfig(normalizeFooterConfig(normalizeReasoningConfig(normalizeCaptionConfig(config('collage'))))))));
 c.avatarFill.ai.enabled=true;c.avatarFill.ai.gradient=true;c.headerHeight=420;
 adapter.start(c);await settle();
 assert.equal(msg.querySelector('.avatar>img').getAttribute('src'),'/real-0.png');
 const fillRules=[...document.querySelector('#orange-theme-live-style').sheet.cssRules].filter(r=>r.style?.getPropertyValue('object-position'));assert.ok(fillRules.some(r=>msg.querySelector('.avatar>img').matches(r.selectorText)));assert.ok(fillRules.every(r=>!msg.querySelector('.name_text').matches(r.selectorText)));
 assert.equal(msg.style.getPropertyValue('--ol-photo-width'),'680px');
 assert.equal(msg.style.getPropertyValue('--sc-fill-height'),'420px');
 assert.equal(msg.style.getPropertyValue('--sc-total-height'),'420px');
 assert.equal(msg.querySelector('.mes_text').textContent,'虚构正文0');
 const style=[...document.querySelectorAll('style')].find(s=>s.textContent.includes('linear-gradient(to bottom'));assert.ok(style);
 adapter.stop();assert.equal(msg.outerHTML,before);
 document.body.classList.add('hideChatAvatars');adapter.start(c);await settle();assert.equal(msg.getAttribute('data-otl-live-avatar-hidden'),'true');const hiddenRules=[...document.querySelector('#orange-theme-live-style').sheet.cssRules].filter(r=>r.style?.getPropertyValue('object-position'));assert.ok(hiddenRules.every(r=>!msg.querySelector('.avatar>img').matches(r.selectorText)));adapter.stop();
});

test('fixed avatar area shrink/enlarge restores clipping and never rewrites native content or model positions',async()=>{
 const {normalizeAvatarFill}=await import('./avatar-fill.mjs'),{normalizeChromeConfig}=await import('./chrome.mjs'),{normalizeTextScene}=await import('./text-scene.mjs'),{normalizeNativeConfig}=await import('./native.mjs'),{normalizeFooterConfig}=await import('./footer.mjs'),{normalizeReasoningConfig}=await import('./reasoning.mjs');
 for(const fill of [false,true]){
  const {document,adapter}=environment(),msg=document.querySelector('.mes'),before=msg.outerHTML,body=msg.querySelector('.mes_text'),source=msg.querySelector('.avatar>img').getAttribute('src'),bodyBefore=body.innerHTML;
  const c=normalizeAvatarFill(normalizeChromeConfig(normalizeTextScene(normalizeNativeConfig(normalizeFooterConfig(normalizeReasoningConfig(normalizeCaptionConfig(config('collage'))))))));c.avatarFill.ai.enabled=fill;c.headerHeight=600;c.photos.ai={...c.photos.ai,size:300,ratio:'0.75',rotation:20};c.textItems.name.y=-200;c.textItems.time.y=700;const original=JSON.stringify(c),clips=[];
  for(const height of [600,60,600]){c.headerHeight=height;adapter.start(c);assert.equal(msg.style.getPropertyValue('--sc-total-height'),height+'px');assert.equal(msg.style.getPropertyValue('--sc-reserve-top'),'0px');assert.equal(body.innerHTML,bodyBefore);assert.equal(msg.querySelector('.avatar>img').getAttribute('src'),source);clips.push(msg.style.getPropertyValue('--sc-avatar-clip'));}
  assert.equal(clips[0],clips[2]);assert.notEqual(clips[0],clips[1]);assert.equal(JSON.stringify(c),original);adapter.stop();assert.equal(msg.outerHTML,before);
 }
});

test('independent edit observes its dimensions and restores roles on host replacement and stop',async()=>{
 const observed=new Set(),unobserved=new Set();class Resize{observe(n){observed.add(n);}unobserve(n){observed.delete(n);unobserved.add(n);}disconnect(){observed.clear();}}
 const {document,adapter,settle,queue}=environment({ResizeObserver:Resize}),msg=document.querySelector('.mes'),buttons=msg.querySelector('.mes_buttons'),edit=buttons.querySelector('.mes_edit');
 edit.setAttribute('data-otl-native-role','host-original');let clicks=0;buttons.addEventListener('click',()=>clicks++);
 adapter.start(config());await settle();assert.equal(edit.getAttribute('data-otl-native-role'),'edit');assert.ok(observed.has(edit),'absolute edit dimensions must be observed independently of more');edit.click();assert.equal(clicks,1);
 const replacement=document.createElement('button');replacement.className='mes_edit';replacement.textContent='宿主重建按钮';edit.replaceWith(replacement);await settle();
 assert.equal(edit.getAttribute('data-otl-native-role'),'host-original');assert.equal(edit.hasAttribute('data-otl-native-mode'),false);assert.ok(unobserved.has(edit));assert.ok(observed.has(replacement));assert.equal(replacement.getAttribute('data-otl-native-role'),'edit');replacement.click();assert.equal(clicks,2);
 adapter.stop();assert.equal(replacement.hasAttribute('data-otl-native-role'),false);assert.equal(replacement.hasAttribute('data-otl-native-mode'),false);assert.equal(replacement.parentNode,buttons);assert.equal(replacement.textContent,'宿主重建按钮');replacement.click();assert.equal(clicks,3);assert.equal(observed.size,0);assert.equal(queue.size,0);
});

test('single-message and batched native changes never measure untouched messages',async()=>{
 const {document,adapter,settle,queue}=environment(),chat=document.querySelector('#chat');
 for(let i=2;i<60;i++)chat.insertAdjacentHTML('beforeend',markup(i,Boolean(i%2)));
 const measured=new Set();for(const msg of chat.children)for(const node of [msg,...msg.querySelectorAll('*')]){node.getBoundingClientRect=()=>{measured.add(msg.getAttribute('mesid'));return {left:0,top:0,width:120,height:20};};}
 adapter.start(config());await settle();measured.clear();
 chat.children[30].querySelector('.mes_text p').textContent+=' 流式片段';await settle();assert.deepEqual([...measured],['30']);assert.equal(queue.size,0);
 measured.clear();chat.children[12].querySelector('.mes_reasoning_header_title').dataset.duration='8';chat.children[30].querySelector('.name_text').textContent='新名字';await settle();assert.deepEqual(new Set(measured),new Set(['12','30']));
 measured.clear();document.body.classList.add('documentstyle');await settle();assert.equal(measured.size,60,'global host mode changes update every message');adapter.stop();
});

test('structure updates refresh only added messages and previous/next latest AI',async()=>{
 const {document,adapter,settle}=environment(),chat=document.querySelector('#chat'),measured=new Set();
 const watch=msg=>{for(const node of [msg,...msg.querySelectorAll('*')])node.getBoundingClientRect=()=>{measured.add(msg.getAttribute('mesid'));return {left:0,top:0,width:120,height:20};};};
 [...chat.children].forEach(watch);adapter.start(config());await settle();measured.clear();
 chat.insertAdjacentHTML('beforeend',markup(2));watch(chat.lastElementChild);await settle();assert.deepEqual(measured,new Set(['0','2']));
 measured.clear();chat.insertAdjacentHTML('beforeend',markup(3,true));watch(chat.lastElementChild);await settle();assert.deepEqual(measured,new Set(['3']));
 measured.clear();chat.children[2].setAttribute('is_user','true');await settle();assert.deepEqual(measured,new Set(['0','2']));assert.equal(chat.firstElementChild.dataset.otlNativeLatestAi,'true');
 measured.clear();chat.children[2].setAttribute('is_system','true');await settle();assert.equal(measured.size,0);assert.equal(chat.children[2].hasAttribute('data-otl-live'),false);
 measured.clear();chat.children[3].remove();await settle();assert.equal(measured.size,0);adapter.stop();
});

test('resize entries target one message, ignore chat-height-only changes and apply chat-width changes globally',async()=>{
 const instances=[];class Resize{constructor(fn){this.fn=fn;instances.push(this);}observe(){}unobserve(){}disconnect(){}}
 const {document,adapter,settle,queue}=environment({ResizeObserver:Resize}),chat=document.querySelector('#chat'),measured=new Set();
 for(const msg of chat.children)for(const node of [msg,...msg.querySelectorAll('*')])node.getBoundingClientRect=()=>{measured.add(msg.getAttribute('mesid'));return {left:0,top:0,width:120,height:20};};
 adapter.start(config());await settle();const resize=instances[0],msg=chat.firstElementChild,entry=(target,width,height)=>({target,contentRect:{width,height}});
 measured.clear();resize.fn([entry(msg,360,300)]);await settle();assert.deepEqual(measured,new Set(['0']),'initial size delivery includes late media layout');resize.fn([entry(chat,390,844)]);await settle();measured.clear();resize.fn([entry(msg,360,340)]);await settle();assert.deepEqual(measured,new Set(['0']));
 measured.clear();resize.fn([entry(chat,390,900)]);await settle();assert.equal(measured.size,0);assert.equal(queue.size,0);
 resize.fn([entry(chat,600,900)]);await settle();assert.equal(measured.size,2);adapter.stop();
});

test('streaming ignored system/fixture messages stays ignored and nested host markup targets its real message',async()=>{
 const {document,adapter,settle}=environment(),chat=document.querySelector('#chat');chat.insertAdjacentHTML('beforeend',markup(2)+markup(3));chat.children[2].setAttribute('is_system','true');chat.children[3].setAttribute('data-orange-lab-fixture','message');
 adapter.start(config());await settle();chat.children[2].querySelector('.mes_text').textContent='系统更新';chat.children[3].querySelector('.mes_text').textContent='预览更新';await settle();assert.equal(adapter.messageCount,2);assert.equal(chat.children[2].hasAttribute('data-otl-live'),false);assert.equal(chat.children[3].hasAttribute('data-otl-live'),false);
 const msg=chat.firstElementChild,body=msg.querySelector('.mes_text');body.innerHTML='<div class="mes"><span>宿主嵌套内容</span></div>';await settle();msg.querySelector('.otl-live-caption').remove();body.querySelector('span').textContent='新内容';await settle();assert.equal(msg.querySelectorAll('.otl-live-caption').length,1);adapter.stop();
});

test('removing and restoring the host message class releases and rebuilds its state and size observations',async()=>{
 const observed=new Set();class Resize{observe(node){observed.add(node);}unobserve(node){observed.delete(node);}disconnect(){observed.clear();}}
 const {document,adapter,settle,queue}=environment({ResizeObserver:Resize}),msg=document.querySelector('.mes'),names=msg.querySelector('.alignItemsBaseline');
 adapter.start(config());await settle();assert.equal(adapter.messageCount,2);assert.ok(observed.has(msg));
 msg.classList.remove('mes');await settle();assert.equal(adapter.messageCount,1);assert.equal(msg.hasAttribute('data-otl-live'),false);assert.equal(msg.querySelector('[data-otl-live-owned]'),null);assert.equal(observed.has(msg),false);assert.equal(observed.has(names),false);assert.equal(queue.size,0);
 msg.classList.add('mes');await settle();assert.equal(adapter.messageCount,2);assert.equal(msg.hasAttribute('data-otl-live'),true);assert.equal(msg.querySelectorAll('.otl-live-caption').length,1);assert.ok(observed.has(msg));assert.equal(msg.dataset.otlNativeLatestAi,'true');adapter.stop();
});

test('first apply prepares every message before measuring width and positions text after all native layouts',()=>{
 const {document,adapter}=environment(),messages=[...document.querySelectorAll('#chat > .mes')];let widths=0,headerReads=0;
 for(const msg of messages){
  Object.defineProperty(msg,'clientWidth',{get(){widths++;assert.ok(messages.every(node=>node.hasAttribute('data-otl-live')));return 680;}});
  const header=msg.querySelector('.ch_name');header.getBoundingClientRect=()=>{headerReads++;assert.ok(messages.every(node=>node.style.getPropertyValue('--sc-total-height')==='240px'));return {left:0,top:0,width:680,height:240};};
 }
 assert.deepEqual(adapter.start(config()),{messages:2});assert.equal(widths,2);assert.ok(headerReads>=4);adapter.stop();
});

test('native icon ownership restores DOM and listeners after repeat apply, failed load and stop',async()=>{
 const {normalizeNativeConfig}=await import('./native.mjs'),{normalizeFooterConfig}=await import('./footer.mjs'),{normalizeReasoningConfig}=await import('./reasoning.mjs');
 const {document,adapter,settle,queue}=environment(),msg=document.querySelector('.mes'),edit=msg.querySelector('.mes_edit'),before=msg.outerHTML;let clicks=0;edit.addEventListener('click',()=>clicks++);
 const c=normalizeNativeConfig(normalizeFooterConfig(normalizeReasoningConfig(normalizeCaptionConfig(config()))));Object.assign(c.nativeStyle.actions.edit,{mode:'icon',source:{kind:'custom',asset:'',image:'data:image/png;base64,AAAA'},tint:true,color:'#123456'});
 adapter.start(c);await settle();assert.equal(edit.querySelectorAll('.otl-native-icon').length,1);assert.equal(edit.querySelector('.otl-native-icon').style.background,'#123456');edit.click();assert.equal(clicks,1);assert.equal(queue.size,0);
 adapter.start(c);await settle();assert.equal(edit.querySelectorAll('.otl-native-icon').length,1);const late=edit.querySelector('img').onerror;edit.querySelector('img').onerror();await settle();assert.equal(edit.dataset.otlNativeMode,'default');assert.equal(edit.querySelector('.otl-native-icon'),null);
 adapter.stop();late();assert.equal(msg.outerHTML,before);edit.click();assert.equal(clicks,2);assert.equal(document.querySelectorAll('.otl-native-icon').length,0);assert.equal(queue.size,0);
 adapter.start(c);await settle();assert.equal(edit.querySelectorAll('.otl-native-icon').length,1,'stop/start retries the same failed image');edit.querySelector('img').onerror();await settle();assert.equal(edit.dataset.otlNativeMode,'default');adapter.start(c);await settle();assert.equal(edit.querySelectorAll('.otl-native-icon').length,1,'repeat apply retries the same failed image');adapter.stop();assert.equal(msg.outerHTML,before);
});

test('geometry-observed hosts ignore unrelated global mutations but retain native host modes',async()=>{
 class Resize{observe(){}unobserve(){}disconnect(){}}
 const renders=[];const {document,adapter,settle,queue}=environment({ResizeObserver:Resize,onRender:r=>renders.push(r.updated)}),chat=document.querySelector('#chat');
 adapter.start(config());await settle();renders.length=0;
 for(let i=0;i<20;i++){document.body.classList.toggle('unrelated-host-state');document.body.style.setProperty('--unrelated-host-token',String(i));chat.classList.toggle('unrelated-chat-state');}
 await settle();assert.deepEqual(renders,[]);assert.equal(queue.size,0);
 for(const mode of ['documentstyle','hideChatAvatars']){
  document.body.classList.add(mode);await settle();assert.equal(renders.at(-1),2);for(const msg of chat.children)assert.equal(msg.dataset.otlLiveAvatarHidden,'true');
  document.body.classList.remove(mode);await settle();assert.equal(renders.at(-1),2);for(const msg of chat.children)assert.equal(msg.dataset.otlLiveAvatarHidden,'false');
 }
 renders.length=0;chat.firstElementChild.querySelector('.mes_buttons').style.display='none';await settle();assert.deepEqual(renders,[1],'native control styling remains targeted');adapter.stop();
});

test('without geometry observers global mutations keep conservative refresh fallback',async()=>{
 const renders=[];const {document,adapter,settle}=environment({onRender:r=>renders.push(r.updated)});adapter.start(config());await settle();renders.length=0;
 document.body.classList.add('unrelated-fallback');await settle();assert.deepEqual(renders,[2]);renders.length=0;
 document.querySelector('#chat').classList.add('unrelated-fallback');await settle();assert.deepEqual(renders,[2]);adapter.stop();
});
