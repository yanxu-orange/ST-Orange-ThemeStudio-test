import {test} from 'node:test';import assert from 'node:assert/strict';import {parseHTML} from 'linkedom';
import {BODY_CARD_DEFAULTS,bodyCardSettings,borderWidths,borderColor,ordinaryParagraphSelector} from './body-card.mjs';
import {normalizeCaptionConfig} from './captions.mjs';
test('body/card defaults and explicit fields survive schema migration without changing captions or images',()=>{
 for(const version of [1,2,3,4]){
  const raw={version,...(version===4?{captions:[]}:{caption:'旧文案'}),layers:[{id:'image',image:'data:image/png;base64,AAAA'}]},before=structuredClone(raw);
  const canonical=normalizeCaptionConfig(raw),settings=bodyCardSettings(raw);assert.deepEqual(settings,BODY_CARD_DEFAULTS);assert.deepEqual(raw,before);
  const saved={...canonical,...settings,bodyWeight:350,bodyParagraphGap:22,bodyPaddingLeft:13,bodyPaddingRight:8,bodyIndent:true,cardBorderMode:'custom',cardBorderTop:true,cardBorderRight:false,cardBorderBottom:true,cardBorderLeft:false,cardBorderColor:'#123456',cardBorderStyle:'dashed',cardBorderWidth:3};
  const restored=JSON.parse(JSON.stringify(saved));assert.deepEqual(bodyCardSettings(restored),bodyCardSettings(saved));assert.deepEqual(normalizeCaptionConfig(restored).captions,canonical.captions);assert.deepEqual(restored.layers,raw.layers);
 }
 for(const key of Object.keys(BODY_CARD_DEFAULTS).filter(k=>k!=='bodyFontLink'))assert.throws(()=>bodyCardSettings({[key]:null}),key);
 for(const raw of [{bodyWeight:99},{bodyWeight:901},{bodyParagraphGap:81},{bodyPaddingLeft:-1},{bodyPaddingRight:101},{bodyIndent:'true'},{cardBorderWidth:13},{cardBorderMode:'around'},{cardBorderStyle:'double'},{cardBorderColor:'#fff'},{cardBorderTop:1}])assert.throws(()=>bodyCardSettings(raw));
});
test('border modes zero disabled sides while retaining color style and legacy alpha defaults',()=>{
 const saved={cardBorderMode:'custom',cardBorderWidth:3,cardBorderColor:'#123456',cardBorderStyle:'dotted',cardBorderTop:true,cardBorderRight:false,cardBorderBottom:true,cardBorderLeft:false},before=structuredClone(saved);
 assert.deepEqual(borderWidths(saved),[3,0,3,0]);assert.deepEqual(borderWidths({...saved,cardBorderMode:'none'}),[0,0,0,0]);assert.deepEqual(borderWidths({...saved,cardBorderMode:'all'}),[3,3,3,3]);assert.deepEqual(saved,before);
 assert.equal(borderColor({},'preview'),'#ffffffaa');assert.equal(borderColor({}),'#ffffff88');assert.equal(borderColor(saved,'preview'),borderColor(saved));
});
test('ordinary paragraph selector includes hard line breaks but excludes nested special and media paragraphs',()=>{
 const {document}=parseHTML(`<div id="body"><p id="plain">普通</p><p id="break">第一行<br>第二行</p><p id="empty"></p><p id="image"><img src="fake.png"></p><p id="video"><video></video></p><p id="audio"><audio></audio></p><p id="iframe"><iframe></iframe></p><p id="inline-code">正文<code>code</code></p><p id="control"><button>按钮</button></p><blockquote><p id="quote">引用</p></blockquote><details><summary>标题</summary><p id="fold">折叠正文</p></details><ul><li><p id="list">列表</p></li></ul><pre><code>code</code></pre><div class="text_segment"><p id="segment">片段普通</p><div><p id="wrapped">片段包裹普通</p></div><details><p id="segment-fold">折叠</p></details><blockquote><p id="segment-quote">引用</p></blockquote><ul><li><p id="segment-list">列表</p></li></ul><p id="segment-media"><svg></svg></p></div><div class="custom-text_segment"><p id="sanitized">宿主片段普通</p><p id="sanitized-break">第一行<br>第二行</p><blockquote><p id="sanitized-quote">引用</p></blockquote><details><p id="sanitized-fold">折叠</p></details><ul><li><p id="sanitized-list">列表</p></li></ul><p id="sanitized-media"><video></video></p><p id="sanitized-code"><code>代码</code></p></div><div><p id="unknown">未知包裹</p></div></div><div class="mes_reasoning"><p id="thought">思维</p></div>`);
 assert.deepEqual([...document.querySelectorAll(ordinaryParagraphSelector('#body'))].map(n=>n.id),['plain','break','segment','wrapped','sanitized','sanitized-break']);
});

test('body padding starts at card interior and wraps independently without moving other regions',async()=>{
 const {bodyCardRules}=await import('./body-card.mjs');
 for(const surface of ['live','preview'])for(const [left,right]of [[0,0],[13,0],[0,27],[13,27]]){
  const {document}=parseHTML('<html><head></head><body><div class="card"><div class="avatar"></div><div class="block"><div class="header"></div><div class="body"></div><div class="footer"></div></div></div></body></html>');
  const style=document.createElement('style');style.textContent=bodyCardRules('.card > .block > .body','.card',{bodyPaddingLeft:left,bodyPaddingRight:right},surface);document.head.append(style);
  const rules=[...style.sheet.cssRules],body=rules.find(r=>r.selectorText==='.card > .block > .body').style,card=rules.find(r=>r.selectorText==='.card').style;
  assert.equal(body.getPropertyValue('width'),'calc(100% + 48px)');assert.equal(body.getPropertyValue('box-sizing'),'border-box');assert.equal(body.getPropertyValue('max-width'),'none');
  assert.equal(body.getPropertyValue('margin-left'),'-24px');assert.equal(body.getPropertyValue('margin-right'),'-24px');assert.equal(body.getPropertyValue('padding-left'),left+'px');assert.equal(body.getPropertyValue('padding-right'),right+'px');
  assert.equal(card.getPropertyValue('padding'),'');for(const region of ['avatar','header','footer'])assert.equal(rules.some(r=>document.querySelector('.'+region).matches(r.selectorText)),false);
  // A 360px interior retains the avatar's inset but body content spans exactly the requested gutters.
  const interior=360,block=interior-48,bodyWidth=block+48;
  assert.equal(24+parseFloat(body.getPropertyValue('margin-left'))+left,left);
  assert.equal(bodyWidth-left-right,interior-left-right);
  assert.equal(body.getPropertyValue('transform'),'');assert.equal(body.getPropertyValue('position'),'');
 }
});
