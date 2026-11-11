import {test} from 'node:test';import assert from 'node:assert/strict';import {parseHTML} from 'linkedom';
import {CHROME_DEFAULTS,DRAWERS,INPUT_ICONS,normalizeChromeConfig,validateChromeStyle,chromeTopMetrics,chromeRules,PREVIEW_CHROME_SELECTORS} from './chrome.mjs';
import {createChromeAdapter,createInputFitBridge} from './chrome-adapter.mjs';import {createChromePreview,CHROME_PREVIEW_BASE} from './chrome-preview.mjs';import {newLayer,validateLayers} from './layers.mjs';
const data='data:image/png;base64,AAAA',source=()=>({mode:'image',asset:'',image:data}),config=()=>({version:9,font:'serif',layers:[newLayer('custom',{anchor:'input',image:data})],chromeStyle:structuredClone(CHROME_DEFAULTS)});
function dom(){return parseHTML(`<html><head></head><body><div id="top-bar"></div><div id="top-settings-holder">${DRAWERS.map(([id])=>`<div class="drawer" id="${id}"><div class="drawer-toggle" title="原提示"><div class="drawer-icon closedIcon${id==='sys-settings-button'?' redOverlayGlow':''}"></div></div><div class="drawer-content"></div></div>`).join('')}</div><div id="sheld"><div id="chat"></div><div id="form_sheld"><div id="send_form"><form id="file_form"></form><div id="nonQRFormItems"><div id="leftSendForm"><div id="options_button"></div></div><textarea id="send_textarea" style="height:73px">当前草稿</textarea><div id="rightSendForm"><div id="send_but" class="displayNone" style="width:0px;height:0px;visibility:hidden"></div><div id="mes_stop" style="display:none"><i>■</i></div></div></div><div class="qr--bar">原QR</div></div></div></div></body></html>`);}
test('schema9 regions default independently off, old source remains untouched, page layers and malformed values reject',()=>{
 for(let version=1;version<=8;version++){const old={version,layers:[],textItems:{name:{x:77,y:900,width:60}}},raw=JSON.stringify(old),next=normalizeChromeConfig(old);assert.equal(JSON.stringify(old),raw);assert.equal(next.version,9);assert.equal(next.chromeStyle.topbar.enabled,false);assert.equal(next.chromeStyle.input.enabled,false);assert.deepEqual(next.textItems,old.textItems);assert.throws(()=>normalizeChromeConfig({...old,chromeStyle:structuredClone(CHROME_DEFAULTS)}));assert.throws(()=>normalizeChromeConfig({...old,layers:[newLayer('custom',{anchor:'input'})]}));}
 const c=config();assert.deepEqual(normalizeChromeConfig(JSON.parse(JSON.stringify(c))),c);for(const bad of [()=>{c.chromeStyle.input.minHeight=160;c.chromeStyle.input.maxHeight=80;},()=>{c.chromeStyle.topbar.icons.bad={};},()=>{c.chromeStyle.input.fontLink={url:'javascript:x'};}]){const next=config();bad.call(null);assert.throws(()=>validateChromeStyle(c.chromeStyle));Object.assign(c,next);}
 assert.throws(()=>validateLayers([newLayer('custom',{anchor:'input',scope:'ai'})]));
});
test('top metrics use holder width and input rules keep host collapse ownership and per-form dimensions',()=>{
 const c=config();c.chromeStyle.topbar.enabled=c.chromeStyle.input.enabled=true;c.chromeStyle.topbar.gap=16;c.chromeStyle.topbar.iconSize=40;for(const width of [390,680]){const a=chromeTopMetrics(width,c.chromeStyle.topbar),b=chromeTopMetrics(width,c.chromeStyle.topbar);assert.deepEqual(a,b);assert.ok(a.icon<=a.slot-6);assert.ok(a.slot*9+a.gap*8+8<=width+.001);}
 const {document}=dom(),style=document.createElement('style');style.textContent=chromeRules(c);document.head.append(style);const rules=[...style.sheet.cssRules],slot=rules.find(r=>r.selectorText?.replaceAll(' ','').includes(':where(#leftSendForm,#rightSendForm)>div')),text=rules.find(r=>r.selectorText==='html[data-orange-live] #send_textarea');assert.ok(slot);for(const key of ['width','height'])assert.equal(slot.style.getPropertyPriority(key),'');for(const key of ['min-width','min-height','display','visibility'])assert.equal(slot.style.getPropertyValue(key),'');assert.equal(text.style.getPropertyValue('height'),'');assert.equal(text.style.getPropertyValue('font-weight'),'400');assert.equal(/\dvw/.test(style.textContent),false);
 document.documentElement.setAttribute('data-orange-lab','');const previewTop=document.createElement('div');previewTop.className='otl-page-topbar';const previewButton=document.createElement('button');previewTop.append(previewButton);document.body.append(previewTop);const previewStyle=document.createElement('style');previewStyle.textContent=chromeRules(c,PREVIEW_CHROME_SELECTORS,{},'sans-serif',true);document.head.append(previewStyle);const widths=[...previewStyle.sheet.cssRules].filter(r=>r.style?.getPropertyValue('width')&&!r.selectorText.includes('::')&&previewButton.matches(r.selectorText));assert.equal(widths.length,1);assert.equal(widths[0].style.getPropertyValue('width'),'var(--oc-top-slot,36px)');assert.equal(widths[0].style.getPropertyPriority('width'),'');

 const pageStyle=document.createElement('style');pageStyle.textContent=CHROME_PREVIEW_BASE;document.head.append(pageStyle);const narrow=[...pageStyle.sheet.cssRules].find(r=>r.selectorText?.includes('data-otl-narrow'));assert.equal(narrow.style.getPropertyValue('grid-template-columns'),'minmax(0,390px)');assert.equal([...pageStyle.sheet.cssRules].some(r=>r.selectorText?.includes(':is(.otl-page-topbar,.otl-page-input,#chat)')),false);
});
test('chrome adapter retains real controls, dynamic tools, current draft, per-zone cleanup and stale image fallback',async()=>{
 const {document,window}=dom(),body=document.body.outerHTML,c=config(),fitValues=[],adapter=createChromeAdapter({document,resolveArtwork:l=>l.image,fitInput:()=>fitValues.push(document.querySelector('#send_textarea').value)});c.chromeStyle.topbar.enabled=c.chromeStyle.input.enabled=true;for(const [id]of DRAWERS)c.chromeStyle.topbar.icons[id]=source();for(const [id]of INPUT_ICONS)c.chromeStyle.input.icons[id]=source();const textarea=document.querySelector('textarea'),originalArea=textarea.outerHTML,send=document.querySelector('#send_but'),originalSend=send.getAttribute('style'),holder=document.querySelector('#top-settings-holder');let width=390;Object.defineProperty(holder,'clientWidth',{get:()=>width});adapter.update(c);assert.equal(holder.querySelectorAll('img').length,9);assert.equal(document.querySelectorAll('.otl-input-art>img').length,1);assert.equal(textarea.outerHTML,originalArea);assert.equal(send.getAttribute('style'),originalSend);assert.equal(send.className,'displayNone');
 const icon=holder.querySelector('.drawer-icon'),oldImage=icon.querySelector('img'),oldError=oldImage.onerror;c.chromeStyle.topbar.icons[DRAWERS[0][0]].image='data:image/png;base64,BBBB';adapter.update(c);const current=icon.querySelector('img');assert.notEqual(current,oldImage);oldError();assert.equal(icon.querySelector('img'),current);current.onerror();assert.equal(icon.hasAttribute('data-oc-image'),false);adapter.render();assert.equal(icon.querySelector('img'),null);assert.equal(icon.hasAttribute('data-oc-image'),false);
 const wand=document.createElement('div');wand.id='extensionsMenuButton';wand.style.display='none';document.querySelector('#leftSendForm').append(wand);await new Promise(r=>setImmediate(r));assert.ok(wand.querySelector('img'));assert.equal(wand.style.display,'none');
 width=680;adapter.render();assert.equal(parseFloat(holder.style.getPropertyValue('--oc-top-slot')),chromeTopMetrics(680,c.chromeStyle.topbar).slot);c.chromeStyle.topbar.enabled=false;adapter.update(c);assert.equal(holder.querySelectorAll('img').length,0);assert.equal(holder.querySelector('[data-oc-image]'),null);assert.ok(document.querySelector('.otl-input-art'));c.chromeStyle.input.enabled=false;adapter.update(c);assert.equal(document.querySelector('[data-oc-image]'),null);assert.equal(document.querySelector('.otl-input-art'),null);
 textarea.value='用户后来修改的当前稿';adapter.stop();assert.equal(textarea.value,'用户后来修改的当前稿');assert.equal(textarea.getAttribute('style'),'height:73px');assert.equal(holder.getAttribute('style'),null);assert.equal(document.querySelector('[data-oc-owned]'),null);assert.ok(fitValues.length>=2);assert.equal(send.getAttribute('style'),originalSend);assert.equal(document.querySelector('.drawer-toggle').title,'原提示');
});
test('private full-page preview keeps state out of theme, isolates keyboard and failed replacement images',()=>{
 const {document,window}=dom(),c=config(),ui={page:'chat',previewMode:'page'},before=JSON.stringify(c),p=createChromePreview({document,ui,resolveArtwork:l=>l.image});c.chromeStyle.topbar.enabled=true;c.chromeStyle.topbar.icons[DRAWERS[0][0]]=source();p.update(c);const top=document.querySelector('.otl-page-topbar'),button=top.querySelector('button'),oldImage=button.querySelector('img'),late=oldImage.onerror;let width=390;Object.defineProperty(top,'clientWidth',{get:()=>width});p.update(c);assert.equal(parseFloat(top.style.getPropertyValue('--oc-top-slot')),chromeTopMetrics(390,c.chromeStyle.topbar).slot);width=680;p.update(c);assert.equal(parseFloat(top.style.getPropertyValue('--oc-top-slot')),chromeTopMetrics(680,c.chromeStyle.topbar).slot);
 c.chromeStyle.topbar.icons[DRAWERS[0][0]].image='data:image/png;base64,BBBB';p.update(c);const fresh=button.querySelector('img');late();assert.equal(button.querySelector('img'),fresh);fresh.onerror();p.update(c);assert.equal(button.hasAttribute('data-oc-image'),false);assert.equal(button.querySelector('img'),null);const fake=document.querySelector('.otl-page-textarea');fake.value='虚构编辑';for(const type of ['keydown','keyup']){const e=new window.Event(type,{bubbles:true,cancelable:true});fake.dispatchEvent(e);assert.equal(e.cancelBubble,true);assert.equal(e.defaultPrevented,false);}p.update(c);assert.equal(fake.value,'虚构编辑');assert.equal(document.querySelector('#send_textarea').value,'当前草稿');for(const n of document.querySelectorAll('[data-oc-preview] *'))assert.equal(n.id,'');p.close();assert.equal(document.querySelector('[data-oc-preview]'),null);assert.equal(document.querySelector('#send_textarea').value,'当前草稿');
});

test('native fit bridge skips the hidden editor and remeasures the current draft after final close',async()=>{
 const {document}=dom(),values=[];let resolve,loads=0;const bridge=createInputFitBridge({document,load:()=>{loads++;return new Promise(r=>resolve=r);}});document.documentElement.setAttribute('data-orange-lab','true');const pending=bridge();await Promise.resolve();resolve(()=>values.push(document.querySelector('#send_textarea').value));await pending;assert.deepEqual(values,[]);document.querySelector('#send_textarea').value='后来修改的长稿';document.documentElement.removeAttribute('data-orange-lab');await bridge();assert.deepEqual(values,['后来修改的长稿']);assert.equal(loads,1);assert.equal(document.querySelector('#send_textarea').getAttribute('style'),'height:73px');
});
test('input containers explicitly release native <=450px one-icon widths in both layouts',()=>{
 for(const layout of ['inline','stacked']){
  const c=config();c.chromeStyle.input.enabled=true;c.chromeStyle.input.layout=layout;const before=JSON.stringify(c);
  for(const [selectors,preview] of [[undefined,false],[PREVIEW_CHROME_SELECTORS,true]]){
   const {document}=parseHTML('<html><head></head><body></body></html>'),style=document.createElement('style');style.textContent=chromeRules(c,selectors,{},'sans-serif',preview);document.head.append(style);
   const selector=preview?'.otl-page-tools':'#leftSendForm',rule=[...style.sheet.cssRules].find(r=>r.selectorText?.includes(selector)&&r.selectorText.includes(','));
   assert.equal(rule.style.getPropertyValue('width'),'auto');assert.equal(rule.style.getPropertyPriority('width'),'important');assert.equal(rule.style.getPropertyValue('flex-wrap'),'wrap');
  }
  assert.equal(JSON.stringify(c),before);
 }
 const c=config();assert.equal(chromeRules(c).includes('width:auto!important'),false,'disabled input does not take over native layout');
});

test('inline text line and tools share a vertical center with symmetric padding on live and preview',()=>{
 for(const [minHeight,slot,size,lineHeight]of [[45,30,16,1.5],[44,36,16,1.5],[32,64,24,2],[100,28,12,1]])for(const layout of ['inline','stacked'])for(const preview of [false,true]){
  const c=config();Object.assign(c.chromeStyle.input,{enabled:true,layout,minHeight,slot,size,lineHeight,maxHeight:320});
  const {document}=dom(),style=document.createElement('style');style.textContent=chromeRules(c,preview?PREVIEW_CHROME_SELECTORS:undefined,{},'sans-serif',preview);document.head.append(style);const rules=[...style.sheet.cssRules];
  const area=rules.find(r=>r.selectorText===(preview?'html[data-orange-lab] .otl-page-textarea':'html[data-orange-live] #send_textarea')).style;
  const row=rules.find(r=>r.selectorText===(preview?'html[data-orange-lab] .otl-page-composer':'html[data-orange-live] #nonQRFormItems')).style;
  const pad=Math.max(6,(minHeight-size*lineHeight)/2),oneLineHeight=Math.max(minHeight,size*lineHeight+2*pad),rowHeight=Math.max(oneLineHeight,slot);
  assert.equal(row.getPropertyValue('align-items'),layout==='inline'?'center':'end');assert.equal(area.getPropertyValue('padding'),pad===6?'6px':`${pad}px 6px`);assert.equal(area.getPropertyValue('border'),'0');assert.equal(area.getPropertyValue('margin'),'0');
  if(layout==='inline')assert.equal((rowHeight-oneLineHeight)/2+pad+size*lineHeight/2,rowHeight/2);
  assert.equal(area.getPropertyValue('height'),'','host remains responsible for growth');assert.equal(area.getPropertyValue('max-height'),'min(320px,60vh)');assert.equal(area.getPropertyValue('overflow-y'),'auto');assert.equal(area.getPropertyValue('resize'),'vertical');
 }
});

test('preview textarea refits multiline content and shrinks again without rewriting the draft',()=>{
 const {document,window}=dom(),ui={page:'chat',previewMode:'page'},p=createChromePreview({document,ui}),c=config();c.layers=[];p.update(c);const area=document.querySelector('.otl-page-textarea');assert.equal(area.getAttribute('rows'),'1');
 let measured=45;Object.defineProperty(area,'scrollHeight',{get:()=>measured});
 for(const [value,height]of [['一行',45],['第一行\n第二行\n第三行',93],['短句',45]]){measured=height;area.value=value;area.dispatchEvent(new window.Event('input'));assert.equal(area.style.height,height+'px');assert.equal(ui.demoText,value);assert.equal(area.value,value);}
 p.close();
});
test('input following chat uses loaded body font and falls back without overriding custom font',()=>{
 const c=config();c.chromeStyle.input.enabled=true;c.chromeStyle.input.fontMode='chat';
 assert.match(chromeRules(c,PREVIEW_CHROME_SELECTORS,{body:'LoadedBody'}),/font-family:"LoadedBody",serif!important/);
 assert.match(chromeRules(c,PREVIEW_CHROME_SELECTORS,{}),/font-family:serif!important/);
 c.chromeStyle.input.fontMode='custom';c.chromeStyle.input.font='monospace';assert.match(chromeRules(c,PREVIEW_CHROME_SELECTORS,{body:'LoadedBody','chrome-input':'CustomInput'}),/font-family:"CustomInput",monospace!important/);
});

test('repeated multiline input measurements do not clamp restored chat scroll position',()=>{
 const {document}=dom(),ui={page:'chat',previewMode:'page',mobileView:'preview'},preview=createChromePreview({document,ui,resolveArtwork:()=>''}),c=config();preview.update(c);const chat=document.querySelector('#chat'),textarea=document.querySelector('.otl-page-textarea');let height='180px';
 Object.defineProperty(textarea.style,'height',{configurable:true,get:()=>height,set:value=>{height=value;if(value==='1px')chat.scrollTop=Math.min(chat.scrollTop,320);}});Object.defineProperty(textarea,'scrollHeight',{configurable:true,get:()=>180});
 chat.scrollTop=500;for(let n=0;n<4;n++){preview.fit();assert.equal(chat.scrollTop,500);assert.equal(height,'180px');preview.update(c);assert.equal(chat.scrollTop,500);}preview.close();
});

test('new icon modes share tinted rendering across preview/live and updates preserve fallback and stop cleanup',()=>{
 const {document}=dom(),c=config(),ui={page:'chat',previewMode:'page'},p=createChromePreview({document,ui}),adapter=createChromeAdapter({document});
 c.layers=[];c.chromeStyle.input.enabled=true;const source=c.chromeStyle.input.icons.send_but={mode:'icon',asset:'',image:data,tint:true,fillMode:'gradient',color:'#123456',color2:'#abcdef',gradientAngle:45,size:30};
 adapter.update(c);p.update(c);const live=document.querySelector('#send_but'),preview=document.querySelector('[data-chrome-pick=send_but]');
 for(const node of [live,preview]){const span=node.querySelector('.otl-chrome-icon');assert.equal(span.style.background,'linear-gradient(45deg,#123456,#abcdef)');assert.equal(span.style.width,'30px');assert.equal(span.querySelector('img').style.opacity,'0');}
 const first=live.querySelector('img');source.tint=false;source.size=0;adapter.update(c);p.update(c);assert.equal(live.querySelector('img'),first);for(const node of [live,preview]){assert.equal(node.querySelector('.otl-chrome-icon').style.maskImage,'');assert.equal(node.querySelector('img').style.opacity,'1');}
 source.tint=true;source.fillMode='solid';adapter.update(c);p.update(c);assert.equal(live.querySelector('.otl-chrome-icon').style.background,'#123456');
 const stale=first.onerror;source.image='data:image/png;base64,BBBB';adapter.update(c);p.update(c);const replacement=live.querySelector('img');stale();assert.equal(live.querySelector('img'),replacement);replacement.onerror();adapter.update(c);assert.equal(live.hasAttribute('data-oc-image'),false);assert.equal(live.querySelector('.otl-chrome-icon'),null);
 const late=preview.querySelector('img').onerror;p.close();adapter.stop();late();assert.equal(document.querySelector('.otl-chrome-icon'),null);assert.equal(live.hasAttribute('data-oc-image'),false);
});

test('switching back to legacy images does not retain invisible icon tint or size controls',()=>{
 const {document}=dom(),c=config(),ui={page:'chat',previewMode:'page'},p=createChromePreview({document,ui}),adapter=createChromeAdapter({document});c.layers=[];c.chromeStyle.input.enabled=true;
 c.chromeStyle.input.icons.send_but={mode:'image',asset:'',image:data,tint:true,color:'#123456',size:40};adapter.update(c);p.update(c);
 for(const node of [document.querySelector('#send_but'),document.querySelector('[data-chrome-pick=send_but]')]){const icon=node.querySelector('.otl-chrome-icon');assert.equal(icon.style.maskImage,'');assert.equal(icon.style.width,c.chromeStyle.input.iconSize+'px');assert.equal(icon.querySelector('img').style.opacity,'1');}
 adapter.stop();p.close();
});

test('icon wrapper changes never rewrite unchanged input artwork image sources',()=>{
 const {document}=dom(),c=config(),adapter=createChromeAdapter({document,resolveArtwork:l=>l.image});c.chromeStyle.input.enabled=true;adapter.update(c);
 const art=document.querySelector('.otl-input-art>img');let writes=0;Object.defineProperty(art,'src',{configurable:true,get:()=>art.getAttribute('src'),set:value=>{writes++;art.setAttribute('src',value);}});
 adapter.update(c);adapter.render();assert.equal(writes,0);assert.equal(document.querySelector('.otl-input-art>img'),art);
 c.layers[0].image='data:image/png;base64,BBBB';adapter.update(c);assert.equal(writes,1);assert.equal(art.getAttribute('src'),c.layers[0].image);adapter.render();assert.equal(writes,1);adapter.stop();
});
