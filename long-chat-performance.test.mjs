import {normalizePageConfig} from './page-style.mjs';
import {normalizePageHeaders} from './page-headers.mjs';
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
function markup(id=0,user=false){return `<div class="mes" mesid="${id}" is_user="${user}" is_system="false"><div class="mesAvatarWrapper"><div class="avatar"><img src="/thumbnail?type=${user?'persona':'avatar'}&amp;file=avatar-${id}.png"></div><div class="mesIDDisplay">#${id}</div></div><div class="mes_block"><div class="ch_name"><div class="flex1"><div class="alignItemsBaseline"><span class="name_text">原生名字${id}</span><small class="timestamp">原生时间</small></div></div><div class="mes_buttons"><button class="mes_edit">编辑</button></div><div class="mes_edit_buttons" style="display:none"><button>取消</button></div></div><details class="mes_reasoning_details" data-state="done"><summary class="mes_reasoning_summary"><div class="mes_reasoning_header"><span class="mes_reasoning_header_title" data-duration="2.5">真实耗时标题</span><span class="arrow">⌄</span></div><button class="mes_reasoning_copy">复制</button></summary><div class="mes_reasoning">虚构思维</div></details><div class="mes_text"><p>虚构正文${id}</p></div></div><div class="swipeRightBlock"><button class="swipe_right">翻页</button></div></div>`;}
function environment(options={},count=2){
  const {document,window}=parseHTML(`<!doctype html><html><head><style id="custom-style">.original{color:red}</style></head><body><div id="chat">${Array.from({length:count},(_,i)=>markup(i,i%2===1)).join('')}</div></body></html>`);
  Object.defineProperty(document,'baseURI',{value:'http://localhost:8019/'});
  document.getElementById('custom-style').disabled=false;
  let next=0;const queue=new Map();
  const adapter=createLiveAdapter({document,MutationObserver:mutationObserverFor(document),requestFrame:fn=>{const id=++next;queue.set(id,fn);return id;},cancelFrame:id=>queue.delete(id),resolveArtwork:l=>l.kind==='asset'?'/local/'+l.asset+'.webp':'data:image/svg+xml,test',...options});
  const settle=async()=>{await new Promise(r=>setImmediate(r));for(const [id,fn]of [...queue]){queue.delete(id);fn();}await new Promise(r=>setImmediate(r));};
  return {document,window,adapter,queue,settle};
}

import fs from 'node:fs';
const report=[];
for(const count of [500,1000])test(`${count} messages: source ownership, incremental stream, coalesced color and repeated src`,async t=>{
 let visits=0,reads=0,writes=0,scans=0;const renders=[];
 const {document,adapter,settle,queue}=environment({resolveArtwork:()=>{visits++;return '/art.webp';},onRender:r=>renders.push(r.updated)},count);
 const chat=document.querySelector('#chat'),images=[...chat.querySelectorAll('.avatar>img')];
 for(const img of images){const get=img.getAttribute.bind(img),set=img.setAttribute.bind(img);img.getAttribute=k=>{if(k==='src')reads++;return get(k);};img.setAttribute=(k,v)=>{if(k==='src')writes++;return set(k,v);};}
 const c=normalizeAvatarFill(normalizeChromeConfig(normalizeTextScene(normalizeNativeConfig(normalizeFooterConfig(normalizeReasoningConfig(normalizeCaptionConfig(config())))))));
 Object.assign(c,bodyCardSettings(c),{commonStyle:normalizeCommonConfig(c).commonStyle,pageStyle:normalizePageConfig(c).pageStyle,pageHeaders:normalizePageHeaders(c).pageHeaders,hideScrollbars:true});
 c.avatarFill.ai.enabled=true;c.avatarFill.user.enabled=true;
 const drain=async()=>{let i=0;do{await settle();assert.ok(++i<10,'observer work must settle without a loop');}while(queue.size);};
 const start=performance.now();adapter.start(c);await drain();const startup={ms:performance.now()-start,visits,reads,writes,updated:renders.reduce((a,b)=>a+b,0)};
 assert.equal(writes,count,'exactly one promotion per avatar');
 let proto=chat,descriptor;while(proto&&!descriptor){descriptor=Object.getOwnPropertyDescriptor(proto,'children');proto=Object.getPrototypeOf(proto);}
 Object.defineProperty(chat,'children',{configurable:true,get(){scans++;return descriptor.get.call(this);}});
 const reset=()=>{visits=reads=writes=scans=0;renders.length=0;};
 const snapshot=ms=>({ms,visits,reads,writes,scans,frames:renders.length,updated:renders.reduce((a,b)=>a+b,0)});
 reset();let at=performance.now();const p=chat.lastElementChild.querySelector('.mes_text p');
 for(let i=0;i<30;i++){p.textContent+=' token';await drain();}
 const streaming=snapshot(performance.now()-at);assert.equal(visits,30);assert.equal(scans,0);assert.equal(writes,0);assert.equal(streaming.updated,30);
 reset();at=performance.now();for(let i=0;i<30;i++)adapter.update({...c,text:i===29?'#456789':'#345678'},{validated:true});assert.equal(queue.size,1);await drain();
 const colors=snapshot(performance.now()-at);assert.equal(colors.updated,0);assert.equal(colors.frames,1);assert.equal(scans,0);assert.equal(reads,0);assert.equal(writes,0);assert.equal(visits,0);
 reset();const img=images.at(-1),current=img.getAttribute('src');reads=0;at=performance.now();for(let i=0;i<30;i++)img.setAttribute('src',current);writes=0;await drain();
 const repeated=snapshot(performance.now()-at);assert.equal(scans,0);assert.equal(writes,0);assert.ok(repeated.updated<=1);assert.ok(visits<=1);
 reset();await new Promise(resolve=>setTimeout(resolve,80));await drain();const idle=snapshot(80);assert.equal(idle.updated,0);assert.equal(writes,0);assert.equal(reads,0);assert.equal(queue.size,0);
 delete chat.children;reset();at=performance.now();adapter.stop();const stop=snapshot(performance.now()-at);assert.equal(writes,count,'each owned source restored on stop');
 const row={count,startup,streaming,colors,repeated,idle,stop};report.push(row);t.diagnostic(JSON.stringify(row));
 fs.writeFileSync(new URL('../long-chat-performance.json',import.meta.url),JSON.stringify({environment:'Node + linkedom; no rasterization, decoding, network or browser layout. Timings are simulated DOM work, not mobile framerate.',results:report},null,2));
});
