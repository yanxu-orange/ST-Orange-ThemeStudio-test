import {newPageHeaderImage, pageHeaderImageKey} from './page-header-scene.mjs';
import {normalizeAvatarFill} from './avatar-fill.mjs';
import {normalizeChromeConfig} from './chrome.mjs';
import {normalizeTextScene} from './text-scene.mjs';
import {normalizeNativeConfig} from './native.mjs';
import {normalizeFooterConfig} from './footer.mjs';
import {normalizeReasoningConfig} from './reasoning.mjs';
import {bodyCardSettings} from './body-card.mjs';
import {normalizeCommonConfig} from './common-style.mjs';
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

test('color updates coalesce without visiting message artwork or replacing nodes',async()=>{
  let visits=0;const {document,adapter,settle,queue}=environment({resolveArtwork:()=>{visits++;return '/art.webp';}});
  const c=config();adapter.start(c);await settle();visits=0;
  const msg=document.querySelector('.mes'),caption=msg.querySelector('.otl-live-caption'),art=msg.querySelector('[data-layer-id]'),native=msg.querySelector('.name_text'),style=document.getElementById('orange-theme-live-style');
  for(let i=0;i<30;i++)adapter.update({...c,text:i===29?'#123456':'#abcdef'});
  assert.equal(queue.size,1);await settle();
  assert.equal(visits,0);assert.equal(msg.querySelector('.otl-live-caption'),caption);assert.equal(msg.querySelector('[data-layer-id]'),art);assert.equal(msg.querySelector('.name_text'),native);assert.equal(document.getElementById('orange-theme-live-style'),style);assert.match(style.textContent,/#123456/);adapter.stop();
});
test('native colors update CSS without reading any of 20 message layouts', async t => {
  const measured = new Set(), rendered = [];
  const {document, adapter, settle, queue} = environment({
    onRender: result => rendered.push(result.updated),
  });
  const chat = document.querySelector('#chat');
  chat.innerHTML = Array.from({length: 20}, (_, i) => markup(i, i % 2 === 1)).join('');
  for (const [i, msg] of [...chat.children].entries()) {
    const header = msg.querySelector('.ch_name');
    const original = header.getBoundingClientRect.bind(header);
    header.getBoundingClientRect = () => { measured.add(i); return original(); };
  }
  const c = normalizeNativeConfig(normalizeFooterConfig(normalizeReasoningConfig(normalizeCaptionConfig(config()))));
  const {actions, stats, swipe} = c.nativeStyle;
  const valueStyle = {size: 15, color: '#123456', font: 'auto', weight: 'auto', fontLink: null};
  const label = {text: '示例：', gap: 2, style: {...valueStyle}};
  actions.design = 'separate';
  actions.roles = Object.fromEntries(['ai', 'user'].map(role => [role, {
    size: actions.size, color: '#123456', edit: structuredClone(actions.edit), more: structuredClone(actions.more),
  }]));
  for (const key of ['floor', 'time', 'tokens']) {
    stats[key].valueStyle = {...valueStyle};
    stats[key].label = structuredClone(label);
  }
  stats.roles = Object.fromEntries(['ai', 'user'].map(role => [role, Object.fromEntries(
    ['floor', 'time', 'tokens'].map(key => [key, structuredClone(stats[key])]),
  )]));
  for (const key of ['left', 'right']) swipe[key].valueStyle = {...valueStyle};
  swipe.counter = {position:'group', anchor:'left', x:0, y:0, mode:'native', pad:false,
    hideSingle:false, italic:false, valueStyle:{...valueStyle}, label:structuredClone(label)};
  adapter.start(c);
  await settle();
  assert.equal(measured.size, 20);
  const results = [];
  async function update(label, expected, edit, changeCount = 1) {
    measured.clear();
    rendered.length = 0;
    for (let i = 0; i < changeCount; i++) {
      edit(i);
      adapter.update(c);
    }
    assert.equal(queue.size, 1);
    await settle();
    results.push({label, updated:rendered[0], measured:measured.size, expected});
    assert.equal(rendered.length, 1);
  }
  const style = document.getElementById('orange-theme-live-style');
  let colorNumber = 0xa1b2c2;
  const nextColor = () => '#' + (++colorNumber).toString(16);
  async function recolor(label, item, color = nextColor()) {
    assert.ok(!style.textContent.includes(color));
    await update(label, 0, () => { item.color = color; });
    assert.ok(style.textContent.includes('color:' + color + '!important'), label);
  }
  const changed = nextColor();
  await update('action role color, four updates in one frame', 0, index => {
    actions.roles.ai.color = index === 3 ? changed : '#374859';
  }, 4);
  assert.match(style.textContent, /color:#a1b2c3!important/);

  await recolor('user action color', actions.roles.user);
  for (const key of ['floor', 'time', 'tokens']) {
    await recolor('unified '+key+' value', stats[key].valueStyle);
    await recolor('unified '+key+' label', stats[key].label.style);
  }
  await update('statistics design switch', 20, () => { stats.design = 'separate'; });
  for (const role of ['ai', 'user']) {
    for (const key of ['floor', 'time', 'tokens']) {
      await recolor(role+' '+key+' value', stats.roles[role][key].valueStyle);
      await recolor(role+' '+key+' label', stats.roles[role][key].label.style);
    }
  }
  for (const key of ['left', 'right', 'counter']) {
    await recolor('swipe '+key+' value', swipe[key].valueStyle);
  }
  await recolor('swipe counter label', swipe.counter.label.style);
  await update('color plus size', 20, () => {
    stats.roles.user.floor.valueStyle.color = '#345678';
    stats.roles.user.floor.valueStyle.size = 18;
  });
  await update('font family', 20, () => { swipe.counter.label.style.font = 'monospace'; });
  await update('label text', 20, () => { swipe.counter.label.text = '改用版本'; });
  await update('action position', 20, () => { actions.roles.user.edit.y = 10; });
  measured.clear();
  rendered.length = 0;
  chat.lastElementChild.querySelector('.mes_text p').textContent += ' streamed token';
  await settle();
  results.push({label:'one streaming message', updated:rendered[0], measured:measured.size, expected:1});
  t.diagnostic(JSON.stringify(results));
  adapter.stop();
  for (const {label, measured, updated, expected} of results) {
    assert.equal(updated, expected, label);
    assert.equal(measured, expected, label);
  }
});

test('geometry updates retain keyed caption and artwork; removed captions and slots are cleaned',async()=>{
  const {document,adapter,settle}=environment();let c=normalizeCaptionConfig(config());c.captions=[newCaption({id:'a',content:'A',width:50}),newCaption({id:'b',content:'B'})];
  const before=document.querySelector('#chat').innerHTML;adapter.start(c);await settle();const msg=document.querySelector('.mes'),caption=msg.querySelector('[data-caption-id=a].otl-live-caption'),art=msg.querySelector('[data-layer-id]');
  c={...c,cardWidth:720,captions:[{...c.captions[0],width:'auto',content:'Changed'},newCaption({id:'c',content:'C',width:25})]};adapter.update(c);await settle();
  assert.equal(msg.querySelector('[data-caption-id=a].otl-live-caption'),caption);assert.equal(caption.textContent,'Changed');assert.equal(msg.querySelector('[data-layer-id]'),art);assert.equal(msg.querySelectorAll('[data-caption-id=b]').length,0);assert.equal(msg.querySelectorAll('.otl-live-caption-slot').length,1);
  adapter.update({...c,captions:[]});await settle();assert.equal(document.querySelectorAll('.otl-live-caption,.otl-live-caption-slot').length,0);
  adapter.stop();assert.equal(document.querySelector('#chat').innerHTML,before);
});
test('latest queued config wins, is isolated from caller mutation and cannot survive stop/restart',async()=>{
  const {document,adapter,settle,queue}=environment();const before=document.querySelector('#chat').innerHTML;
  adapter.start(config());await settle();adapter.update({...config(),cardWidth:900});const last={...config(),cardWidth:700,text:'#234567'};adapter.update(last);last.cardWidth=300;await settle();assert.match(document.getElementById('orange-theme-live-style').textContent,/--ol-cardWidth:700px/);
  adapter.update({...config(),text:'#fedcba'});adapter.stop();assert.equal(queue.size,0);assert.equal(document.querySelector('#chat').innerHTML,before);adapter.start({...config(),text:'#654321'});await settle();assert.match(document.getElementById('orange-theme-live-style').textContent,/#654321/);assert.doesNotMatch(document.getElementById('orange-theme-live-style').textContent,/#fedcba/);adapter.stop();
});
test('one streaming message in a long chat does not scan or reconcile the full message list',async()=>{
  let visits=0;const {document,adapter,settle}=environment({resolveArtwork:()=>{visits++;return '/art.webp';}});const chat=document.querySelector('#chat');chat.innerHTML=Array.from({length:100},(_,i)=>markup(i)).join('');adapter.start(config());await settle();visits=0;
  // Trap list enumeration independently of layout work, while leaving DOM parent checks intact.
  let scans=0;let proto=chat,descriptor;while(proto&&!descriptor){descriptor=Object.getOwnPropertyDescriptor(proto,'children');proto=Object.getPrototypeOf(proto);}Object.defineProperty(chat,'children',{configurable:true,get(){scans++;return descriptor.get.call(this);}});
  chat.lastElementChild.querySelector('.mes_text p').textContent+=' streamed token';await settle();assert.equal(visits,1);assert.equal(scans,0);delete chat.children;adapter.stop();
});
test('render callbacks run after initial layout and coalesced updates, font helpers tolerate stopped sessions',async()=>{
  const rendered=[],c=config();const {document,adapter,settle}=environment({onRender:result=>rendered.push(result)});assert.equal(adapter.fontStatus('body'),'idle');adapter.retryFonts();adapter.start(c);assert.equal(rendered[0].messages,2);assert.equal(rendered[0].updated,2);await settle();rendered.length=0;adapter.update({...c,accent:'#123456'});await settle();assert.equal(rendered.length,1);assert.equal(rendered[0].messages,2);assert.equal(rendered[0].updated,0);assert.deepEqual(rendered[0].nodes,[]);assert.equal(rendered[0].chromeChanged,true);adapter.stop();assert.equal(adapter.fontStatus('body'),'idle');adapter.retryFonts();
});

test('validated large-image drafts share immutable strings, isolate edits and stay incremental across 100 messages',async t=>{
  const c=normalizeAvatarFill(normalizeChromeConfig(normalizeTextScene(normalizeNativeConfig(normalizeFooterConfig(normalizeReasoningConfig(normalizeCaptionConfig(config())))))));
  Object.assign(c,bodyCardSettings(c),{commonStyle:normalizeCommonConfig(c).commonStyle,hideScrollbars:true});
  const large='data:image/png;base64,'+'A'.repeat(8*1024*1024);
  c.layers[0].image=large;c.layers[0].kind='custom';
  let visits=0;const {document,adapter,settle,queue}=environment({resolveArtwork:layer=>{visits++;return layer.image;}});
  const chat=document.querySelector('#chat');chat.innerHTML=Array.from({length:100},(_,i)=>markup(i)).join('');
  adapter.start(c);await settle();visits=0;
  const originalClone=globalThis.structuredClone,originalStringify=JSON.stringify;let copiedImages=0,serializedImages=0;
  globalThis.structuredClone=(value,...args)=>{if(value?.layers?.some(layer=>layer.image===large))copiedImages++;return originalClone(value,...args);};
  JSON.stringify=(value,...args)=>{if(value===large||value?.layers?.some(layer=>layer.image===large))serializedImages++;return originalStringify(value,...args);};
  const start=performance.now();
  try{
    for(let frame=0;frame<30;frame++){
      for(let event=0;event<4;event++){c.text=(frame+event)%2?'#123456':'#654321';adapter.update(c,{validated:true});}
      assert.equal(queue.size,1);await settle();
    }
  }finally{globalThis.structuredClone=originalClone;JSON.stringify=originalStringify;}
  const elapsed=performance.now()-start;
  assert.equal(copiedImages,0);assert.equal(serializedImages,0);assert.equal(visits,0);
  assert.equal(document.querySelector('[data-layer-id]').getAttribute('src'),large);
  // Deep object edits after update must not alter its queued snapshot.
  const expected=c.captions[0].content;adapter.update(c,{validated:true});c.captions[0].content='mutated after update';await settle();assert.equal(document.querySelector('.otl-live-caption').textContent,expected);c.captions[0].content=expected;
  let proto=chat,descriptor;while(proto&&!descriptor){descriptor=Object.getOwnPropertyDescriptor(proto,'children');proto=Object.getPrototypeOf(proto);}let scans=0;
  Object.defineProperty(chat,'children',{configurable:true,get(){scans++;return descriptor.get.call(this);}});
  chat.lastElementChild.querySelector('.mes_text p').textContent+=' token';await settle();assert.equal(scans,0);assert.equal(visits,1);delete chat.children;
  const validationStart=performance.now();for(let i=0;i<3;i++)adapter.update(c);const validationMs=performance.now()-validationStart;await settle();
  assert.throws(()=>adapter.update({...c,version:999}),/版本/);
  adapter.stop();
  t.diagnostic(`8 MiB source / 100 native messages: 120 trusted updates + 30 frame flushes = ${elapsed.toFixed(1)} ms; 3 validated-default updates = ${validationMs.toFixed(1)} ms. Trusted path: zero full-image clones/serializations, zero color message visits; stream: 1 visit, 0 list scans.`);
});

test('host-cached native nodes restore layout variables before reuse and again on stop',async()=>{
  const {document,adapter,settle}=environment();const original=document.querySelector('.mes');
  original.style.setProperty('--sc-width-name','7px');original.style.setProperty('color','red');const before=original.outerHTML;
  adapter.start(config());await settle();assert.notEqual(original.style.getPropertyValue('--sc-width-name'),'7px');
  const holder=document.createElement('div');holder.innerHTML=markup(9);const replacement=holder.firstElementChild;original.replaceWith(replacement);await settle();
  assert.equal(original.outerHTML,before,'cached node must be restored as soon as it is detached');
  replacement.replaceWith(original);await settle();assert.notEqual(original.style.getPropertyValue('--sc-width-name'),'7px');
  adapter.stop();assert.equal(original.outerHTML,before,'reusing the same cached node must not capture adapter variables as its native baseline');
});
test('detached native cleanup removes newly added empty style but preserves concurrent host variable writes',async()=>{
  const {document,adapter,settle}=environment();const [name,time]=document.querySelectorAll('.mes');
  assert.equal(name.hasAttribute('style'),false);adapter.start(config());await settle();time.style.setProperty('--sc-width-time','333px');
  document.querySelector('#chat').innerHTML=markup(9);await settle();
  assert.equal(name.hasAttribute('style'),false);assert.equal(time.style.getPropertyValue('--sc-width-time'),'333px');
  assert.equal(time.style.getPropertyValue('--sc-left-time'),'');adapter.stop();assert.equal(time.style.getPropertyValue('--sc-width-time'),'333px');
});

test('page header updates do not scan or lay out formal messages and stop restores native pages',async()=>{
 let visits=0;const rendered=[];const {document,adapter,settle}=environment({resolveArtwork:()=>{visits++;return '/art.webp';},onRender:r=>rendered.push(r)});
 const host=document.createElement('div');host.id='user-settings-block';host.innerHTML='<button>native</button>';document.body.append(host);
 const c=config();adapter.start(c);await settle();visits=0;rendered.length=0;
 adapter.update({...c,pageHeaders:{settings:{enabled:true,image:'https://example.com/header.png'}}});await settle();
 assert.equal(visits,0);assert.equal(rendered.at(-1).updated,0);assert.equal(host.querySelectorAll('[data-otl-page-header]').length,1);
 assert.equal(document.querySelector('#chat [data-otl-page-header]'),null);
 adapter.update({...c,pageHeaders:{settings:{enabled:true,image:'https://example.com/header.png',height:300}}});await settle();assert.equal(visits,0);assert.equal(rendered.at(-1).updated,0);
 adapter.stop();assert.equal(host.innerHTML,'<button>native</button>');
});

test('ordinary theme color and text changes perform zero page-header mount scans',async()=>{
 const {document,adapter,settle}=environment();const host=document.createElement('div');host.id='WorldInfo';document.body.append(host);
 const c={...config(),pageHeaders:{worldbook:{enabled:true,image:'https://example.com/header.png'}}};adapter.start(c);await settle();
 const query=document.querySelectorAll.bind(document);let scans=0;document.querySelectorAll=selector=>{if(selector==='#WorldInfo')scans++;return query(selector);};
 adapter.update({...c,text:'#abcdef'});await settle();adapter.update({...c,caption:'Changed text'});await settle();assert.equal(scans,0);
 adapter.update({...c,pageHeaders:{worldbook:{...c.pageHeaders.worldbook,height:250}}});await settle();assert.equal(scans,1);assert.equal(host.querySelector('[data-otl-page-header]').style.height,'250px');adapter.stop();
});

test('mounted page headers skip comparison serialization and reads during chat-only colors', async t => {
  const renders = [];
  const {document, window, adapter, settle} = environment({onRender: result => renders.push(result), resolveArtwork: layer => layer.image});
  document.querySelector('#chat').innerHTML = Array.from({length:20}, (_, i) => markup(i, i % 2 === 1)).join('');
  for (const id of ['WorldInfo', 'user-settings-block']) {
    const host = document.createElement('div');
    host.id = id;
    document.body.append(host);
  }
  const banner = 'data:image/png;base64,' + 'A'.repeat(1024 * 1024);
  const sticker = 'data:image/png;base64,' + 'B'.repeat(1024 * 1024);
  const image = newPageHeaderImage('custom', {id:'header-sticker', image:sticker});
  const c = {
    ...config(),
    commonStyle:normalizeCommonConfig(config()).commonStyle,
    pageHeaders:{
      worldbook:{enabled:true, image:banner, scene:{images:[image], texts:[], order:[pageHeaderImageKey(image.id)]}},
      settings:{enabled:true, title:'设置'},
    },
  };
  let reads = 0, left = '5px', right = '7px';
  const cssAtRead = [];
  const initialStyleAtRead = [];
  window.getComputedStyle = node => {
    if (node.id === 'WorldInfo' || node.id === 'user-settings-block') {
      reads++;
      const css = document.getElementById('orange-theme-live-style')?.textContent || '';
      initialStyleAtRead.push(css.includes('--ol-size:calc(15px * var(--fontScale, 1))') && document.documentElement.hasAttribute('data-orange-live'));
      if (css.includes('font-size:23px!important')) cssAtRead.push('common');
      if (css.includes('font-size:21px!important')) cssAtRead.push('page');
      return {paddingLeft:left, paddingRight:right, paddingTop:'4px'};
    }
    return {};
  };
  adapter.start(c);
  await settle();
  assert.deepEqual(initialStyleAtRead, [true, true], 'initial style and scope exist before either host read');
  const host = document.getElementById('WorldInfo');
  const node = host.querySelector('[data-otl-page-header]');
  const liveStyle = document.getElementById('orange-theme-live-style');
  let serializations = 0;
  const stringify = JSON.stringify;
  JSON.stringify = (value, ...args) => {
    if (value === banner || value?.images?.some(layer => layer.image === sticker)) serializations++;
    return stringify(value, ...args);
  };
  try {
    reads = 0;
    renders.length = 0;
    adapter.update({...c, text:'#215364', nameColor:'#394857', timeColor:'#566778'});
    await settle();
  } finally {
    JSON.stringify = stringify;
  }
  const colorReads = reads;
  assert.match(liveStyle.textContent, /#215364/);
  assert.equal(renders.at(-1).updated, 0);
  assert.equal(host.querySelector('[data-otl-page-header]'), node);
  assert.equal(node.querySelector('[data-otl-header-base-image]').getAttribute('src'), banner);
  assert.ok(node.querySelector('[data-otl-header-layer]').getAttribute('src') === sticker, 'scene image retains its source');
  t.diagnostic(`20 chat floors, 2 mounted page headers: ${colorReads} header reads, ${serializations} large-image/scene serializations.`);

  left = '8px'; right = '4px'; reads = 0;
  const colorConfig = {...c, text:'#215364', nameColor:'#394857', timeColor:'#566778'};
  adapter.update(colorConfig);
  await settle();
  assert.equal(reads, 2, 'an unchanged manual update still checks host padding');
  assert.equal(node.style.marginLeft, '-8px');
  left = '7px'; right = '5px'; reads = 0;
  window.dispatchEvent(new window.Event('resize'));
  assert.equal(reads, 2);
  assert.equal(node.style.marginLeft, '-7px');

  const commonStyle = {...c.commonStyle, text:{...c.commonStyle.text, size:23}};
  reads = 0;
  cssAtRead.length = 0;
  const commonConfig = {...colorConfig, text:'#193857', commonStyle};
  adapter.update(commonConfig);
  await settle();
  assert.equal(reads, 2, 'mixed common style changes check the header');
  assert.ok(cssAtRead.includes('common'), 'new common CSS is active before the read');

  reads = 0;
  cssAtRead.length = 0;
  const pageConfig = {...commonConfig, nameColor:'#333333', pageStyle:{settings:{text:{size:21}}}};
  adapter.update(pageConfig);
  await settle();
  assert.equal(reads, 2, 'mixed page style changes check the header');
  assert.ok(cssAtRead.includes('page'), 'new page CSS is active before the read');

  reads = 0;
  const changedHeader = {...c.pageHeaders.worldbook, image:'https://example.com/changed.png', height:245,
    scene:{...c.pageHeaders.worldbook.scene, images:[{...image, x:12}]}};
  adapter.update({...pageConfig, pageHeaders:{...c.pageHeaders, worldbook:changedHeader}});
  await settle();
  assert.equal(reads, 2);
  assert.equal(node.style.height, '245px');
  assert.equal(node.querySelector('[data-otl-header-base-image]').getAttribute('src'), changedHeader.image);
  assert.equal(node.querySelector('[data-otl-header-layer]').style.right, '12px');
  reads = 0;
  const withNativeStyle = normalizeNativeConfig(normalizeFooterConfig(normalizeReasoningConfig(normalizeCaptionConfig(pageConfig))));
  withNativeStyle.nativeStyle.swipe.left.valueStyle = {size:15, color:'#223344', font:'auto', weight:'auto', fontLink:null};
  adapter.update(withNativeStyle);
  await settle();
  assert.equal(reads, 2, 'adding a new style block still checks layout');
  reads = 0;
  withNativeStyle.nativeStyle.swipe.left.valueStyle.color = '#224455';
  adapter.update(withNativeStyle);
  await settle();
  assert.equal(reads, 0, 'a scoped native color keeps headers unchanged');
  assert.match(liveStyle.textContent, /color:#224455!important/);

  // Without explicit common styles, a root text change supplies page colors too.
  const inherited = {...pageConfig, commonStyle:undefined};
  adapter.update(inherited);
  await settle();
  reads = 0;
  adapter.update({...inherited, text:'#c2beb7'});
  await settle();
  assert.equal(reads, 2);
  adapter.stop();

  assert.equal(colorReads, 0);
  assert.equal(serializations, 0);
});
