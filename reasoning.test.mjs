import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {normalizeReasoningConfig,validateReasoningStyle,reasoningFontEntries,reasoningRules,reasoningLabel,watchInterfaceFont,interfaceFont} from './reasoning.mjs';
import {normalizeCaptionConfig} from './captions.mjs';
import {newLayer,validateLayers} from './layers.mjs';
import {layerRegion,matchingLayers} from './workbench-ui.mjs';
import {createFontSession} from './font-sources.mjs';
const legacy=()=>({version:3,reasoning:'旧入口',reasoningFont:'monospace',reasoningSize:20,font:'serif',accent:'#123456',text:'#654321',layers:[newLayer('flower')],photos:{ai:{image:'preserved'}}});
const current=()=>normalizeReasoningConfig(normalizeCaptionConfig(legacy()));
const tick=()=>new Promise(r=>setImmediate(r));
test('reasoning schema5 migrates actual v1-v4 without mutation and preserves explicit caption zero',()=>{
 for(const version of [1,2,3,4]){let raw={...legacy(),version};if(version===4)raw={...normalizeCaptionConfig({...raw,version:3}),captions:[]};const original=structuredClone(raw),c=normalizeReasoningConfig(raw);assert.equal(c.version,5);assert.equal(c.reasoningStyle.entry.content,'旧入口');assert.equal(c.reasoningStyle.entry.font,'monospace');assert.equal(c.reasoningStyle.entry.size,20);assert.equal(c.reasoningStyle.body.font,'monospace');assert.equal(c.reasoningStyle.body.size,15);assert.equal(c.reasoningStyle.entry.background.mode,'none');assert.deepEqual(c.reasoningStyle.entry.geometry,{width:'auto',minHeight:0,radius:0,paddingX:0,paddingY:8});assert.equal(c.reasoningStyle.body.container.borderWidth,0);assert.equal(c.reasoningStyle.body.container.paddingY,12);assert.deepEqual(c.layers,raw.layers);assert.deepEqual(c.photos,raw.photos);assert.equal(Object.hasOwn(c,'reasoning'),false);assert.deepEqual(raw,original);if(version===4)assert.deepEqual(c.captions,[]);}
 const c=current();assert.deepEqual(normalizeReasoningConfig(c),c);assert.deepEqual(normalizeCaptionConfig(c).reasoningStyle,c.reasoningStyle);
});
test('reasoning rejects null, version mirrors, unsafe sources and malformed bounded styles',()=>{
 for(const key of ['reasoning','reasoningFont','reasoningSize'])assert.throws(()=>normalizeReasoningConfig({...legacy(),[key]:null}));
 const c=current();for(const v of [null,undefined])assert.throws(()=>normalizeReasoningConfig({...c,reasoningStyle:v}));assert.throws(()=>normalizeReasoningConfig({...c,reasoning:'mirror'}));assert.throws(()=>normalizeReasoningConfig({...legacy(),reasoningStyle:c.reasoningStyle}));
 for(const mutate of [s=>s.entry.fontSource='all',s=>s.entry.font='evil;',s=>s.body.size=29,s=>s.entry.geometry.width=19,s=>s.entry.background.opacity=2,s=>s.body.container.borderWidth=9,s=>s.entry.background.source={kind:'custom',asset:'',image:'https://example.com'},s=>s.entry.fontLink={url:'javascript:alert(1)'},s=>s.body.container=null]){const s=structuredClone(c.reasoningStyle);mutate(s);assert.throws(()=>validateReasoningStyle(s));}
});
test('reasoning font following changes family only and rules match only chosen reasoning nodes',()=>{
 const c=current();c.reasoningStyle.entry.fontSource='interface';c.reasoningStyle.body.fontSource='body';c.reasoningStyle.entry.size=27;c.reasoningStyle.entry.weight=700;c.reasoningStyle.entry.color='#abcdef';c.reasoningStyle.body.size=18;
 const {document}=parseHTML('<html><head></head><body><div class="entry"><span class="otl-live-reasoning">入口</span><div class="otl-reasoning-bg"></div></div><div class="thought"><p>思维</p></div><div class="mes_text"><p>正文</p></div></body></html>');const style=document.createElement('style');style.textContent=reasoningRules('.entry','.thought','.otl-reasoning-bg',c,{},'Lato, sans-serif');document.head.append(style);
 const rules=[...style.sheet.cssRules],entry=rules.find(r=>r.selectorText==='.entry'),body=rules.find(r=>r.selectorText==='.thought');assert.equal(entry.style.getPropertyValue('font-family'),'Lato, sans-serif');assert.equal(entry.style.getPropertyValue('font-size'),'27px');assert.equal(entry.style.getPropertyValue('font-weight'),'700');assert.equal(entry.style.getPropertyValue('color'),'#abcdef');assert.equal(body.style.getPropertyValue('font-family'),'serif');assert.equal(body.style.getPropertyValue('font-size'),'18px');assert.equal(body.style.getPropertyValue('padding'),'12px');for(const r of rules)assert.equal(document.querySelector('.mes_text').matches(r.selectorText),false);assert.equal(rules.find(r=>r.selectorText==='.otl-reasoning-bg').style.opacity,'1');assert.equal(entry.style.opacity,'');
 assert.equal(reasoningLabel('入口','unknown'),'入口');assert.equal(reasoningLabel('入口','2.5'),'入口 · 2.5 s');
});
test('reasoning links normalize before sharing and following releases only unused own faces',async()=>{
 const c=current(),source={url:'https://FONT.example:443/a.woff2',faceWeight:'400'};c.reasoningStyle.entry.fontLink={url:source.url};c.reasoningStyle.body.fontLink=source;const checked=validateReasoningStyle(c.reasoningStyle);assert.equal(checked.entry.fontLink.url,'https://font.example/a.woff2');assert.equal(checked.entry.fontLink.faceWeight,'400');assert.equal(c.reasoningStyle.entry.fontLink.faceWeight,undefined);c.reasoningStyle=checked;
 const faces=[],added=new Set();class Face{constructor(){faces.push(this);}load(){return Promise.resolve(this);}}
 const session=createFontSession({document:{fonts:{add:f=>added.add(f),delete:f=>added.delete(f)}},FontFace:Face});session.update(reasoningFontEntries(c));await tick();assert.equal(faces.length,1);assert.equal(added.size,1);assert.equal(session.families()['reasoning:entry'],session.families()['reasoning:body']);c.reasoningStyle.entry.fontSource='interface';session.update(reasoningFontEntries(c));assert.equal(added.size,1);assert.equal(session.status('reasoning:entry'),'idle');c.reasoningStyle.body.fontSource='body';session.update(reasoningFontEntries(c));assert.equal(added.size,0);session.dispose();
});
test('reasoning image anchors and background survive serialization with their own regions',()=>{
 const c=current();c.layers=['reasoning-entry','reasoning-body'].map(anchor=>newLayer('custom',{anchor,image:'data:image/png;base64,AAAA',widthUnit:'percent',offsetUnit:'percent',scope:'ai',z:20}));c.reasoningStyle.entry.background={...c.reasoningStyle.entry.background,mode:'image',source:{kind:'custom',asset:'',image:'data:image/png;base64,BBBB'},opacity:.4,fit:'contain',x:80,y:20};const parsed=JSON.parse(JSON.stringify(c));assert.deepEqual(validateLayers(parsed.layers),c.layers);assert.deepEqual(normalizeReasoningConfig(parsed),c);assert.equal(layerRegion(c.layers[0]),'reasoning');assert.equal(matchingLayers(c.layers,'header').length,0);assert.equal(matchingLayers(c.layers,'reasoning').length,2);
});
test('interface font watcher reads body and releases events and late ready safely',async()=>{
 const {document,window}=parseHTML('<html><head></head><body></body></html>');let family='Lato',calls=0,ready;const handlers=new Set();window.getComputedStyle=()=>({fontFamily:family});Object.defineProperty(document,'fonts',{value:{ready:new Promise(r=>ready=r),addEventListener:(k,fn)=>handlers.add(fn),removeEventListener:(k,fn)=>handlers.delete(fn)}});assert.equal(interfaceFont(document),'Lato');const stop=watchInterfaceFont(document,()=>calls++);family='body updated';document.body.className='changed';await tick();assert.equal(calls,1);document.body.style.setProperty('color','red');await tick();assert.equal(calls,1);stop();assert.equal(handlers.size,0);family='late';ready();await tick();assert.equal(calls,1);
});
test('preview/live share a block width reference regardless of native flex-container class',async()=>{
 const {reasoningShellRules}=await import('./reasoning.mjs'),c=current(),before=JSON.stringify(c);
 for(const root of ['html[data-orange-live] #chat > .mes','html[data-orange-lab] #chat > .mes[data-orange-lab-fixture]']){
  const {document}=parseHTML('<html><head></head><body></body></html>'),style=document.createElement('style');style.textContent=reasoningShellRules(root)+reasoningRules(root+' .mes_reasoning_header',root+' .mes_reasoning',root+' .otl-reasoning-bg',c);document.head.append(style);
  const rules=[...style.sheet.cssRules],block=rules.find(r=>r.selectorText===root+' .mes_reasoning_header_block'),entry=rules.find(r=>r.selectorText===root+' .mes_reasoning_header');
  assert.equal(block.style.getPropertyValue('display'),'block');assert.equal(block.style.getPropertyPriority('display'),'important');assert.equal(entry.style.getPropertyValue('width'),'auto');assert.equal(entry.style.getPropertyValue('flex-wrap'),'nowrap');
  const title=rules.find(r=>r.selectorText?.endsWith('.mes_reasoning_header_title[data-otl-live-reasoning]'));assert.equal(title.style.getPropertyValue('position'),'absolute');assert.equal(title.style.getPropertyValue('display'),'','native accessible title remains present without consuming layout space');
 }
 assert.equal(JSON.stringify(c),before);
});

test('entry arrow defaults hidden and label offsets default to zero with strict required fields',()=>{
 const c=current(),s=c.reasoningStyle;
 assert.equal(s.entry.showArrow,false);assert.deepEqual(s.entry.labelPosition,{x:0,y:0});
 for(const mutate of [
  s=>delete s.entry.showArrow,s=>s.entry.showArrow=0,s=>s.entry.showArrow='false',s=>s.entry.showArrow=null,
  s=>delete s.entry.labelPosition,s=>s.entry.labelPosition=null,s=>s.entry.labelPosition=[],
  s=>delete s.entry.labelPosition.x,s=>delete s.entry.labelPosition.y,s=>s.entry.labelPosition.extra=0,
  ...['x','y'].flatMap(key=>[-501,501,NaN,Infinity,-Infinity,'0',null].map(value=>s=>s.entry.labelPosition[key]=value)),
 ]){const bad=structuredClone(s);mutate(bad);assert.throws(()=>validateReasoningStyle(bad));}
 for(const [x,y]of [[-500,500],[500,-500],[12.5,-30.25]]){const valid=structuredClone(s);valid.entry.showArrow=true;valid.entry.labelPosition={x,y};assert.deepEqual(validateReasoningStyle(valid),valid);assert.deepEqual(normalizeReasoningConfig({...c,reasoningStyle:valid}).reasoningStyle,valid);}
 const missing=structuredClone(c);delete missing.reasoningStyle.entry.showArrow;delete missing.reasoningStyle.entry.labelPosition;
 assert.throws(()=>normalizeReasoningConfig(missing),'current schemas do not silently migrate missing fields');
});
test('preview/live arrow switching and label-only positioning share CSS without moving the entry frame',()=>{
 const c=current();
 const styles=(entry,body,bg)=>{
  const {document}=parseHTML('<html><head></head><body></body></html>'),style=document.createElement('style');
  style.textContent=reasoningRules(entry,body,bg,c);document.head.append(style);
  return [...style.sheet.cssRules];
 };
 for(const root of ['html[data-orange-live] #chat > .mes','html[data-orange-lab] #chat > .mes[data-orange-lab-fixture]']){
  c.reasoningStyle.entry.showArrow=false;c.reasoningStyle.entry.labelPosition={x:0,y:0};
  const entry=root+' .mes_reasoning_header',body=root+' .mes_reasoning',bg=root+' .otl-reasoning-bg';
  const before=styles(entry,body,bg),arrowSelector=entry+' .mes_reasoning_arrow',labelSelector=entry+' :is(.otl-live-reasoning, .otl-reasoning-title)';
  const arrow=before.find(r=>r.selectorText===arrowSelector),label=before.find(r=>r.selectorText===labelSelector);
  assert.equal(arrow.style.display,'none');assert.equal(arrow.style.getPropertyPriority('display'),'important');assert.equal(label.style.transform,'translate(0px,0px)');
  c.reasoningStyle.entry.showArrow=true;
  const visible=styles(entry,body,bg);
  assert.equal(visible.find(r=>r.selectorText===arrowSelector).style.display,'inline-block');
  for(let i=0;i<before.length;i++)if(before[i].selectorText!==arrowSelector)assert.equal(visible[i].cssText,before[i].cssText,'arrow toggle changes only the arrow rule');
  c.reasoningStyle.entry.labelPosition={x:-137,y:49};
  const moved=styles(entry,body,bg);
  assert.equal(moved.find(r=>r.selectorText===labelSelector).style.transform,'translate(-137px,49px)');
  assert.equal(moved.find(r=>r.selectorText===labelSelector).style.getPropertyPriority('transform'),'important');
  for(let i=0;i<visible.length;i++)if(visible[i].selectorText!==labelSelector)assert.equal(moved[i].cssText,visible[i].cssText,'label offsets leave arrow, background, body, and entry frame untouched');
  assert.equal(moved.find(r=>r.selectorText===entry).style.transform,'');
  assert.equal(moved.find(r=>r.selectorText===bg).style.transform,'');
  assert.equal(moved.find(r=>r.selectorText===arrowSelector).style.transform,'none');
  assert.equal(moved.filter(r=>r.selectorText.includes('.mes_reasoning_arrow:is(')).length,1,'native open-state arrow rule is retained');
 }
});
