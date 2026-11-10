import {test} from 'node:test';import assert from 'node:assert/strict';import {parseHTML} from 'linkedom';
import {normalizeNativeConfig,validateNativeStyle,NATIVE_DEFAULTS,nativeRules,renderNative,effectiveNativeMode,latestAI} from './native.mjs';import {normalizeFooterConfig} from './footer.mjs';import {normalizeReasoningConfig} from './reasoning.mjs';import {normalizeCaptionConfig} from './captions.mjs';
const current=()=>normalizeNativeConfig(normalizeFooterConfig(normalizeReasoningConfig(normalizeCaptionConfig({version:3,font:'serif',accent:'#123456',timeColor:'#654321',cardWidth:448,layers:[]}))));
const html='<html><head></head><body><div class="mes" is_user="false"><div class="mesAvatarWrapper"><div class="mesIDDisplay">#1</div><div class="mes_timer">2s</div><div class="tokenCounterDisplay">120t</div></div><div class="swipe_left"></div><div class="mes_block"><div class="ch_name"><div class="mes_buttons"><span class="extraMesButtonsHint">more</span><div class="extraMesButtons"></div><div class="mes_edit"></div></div><div class="mes_edit_buttons" style="display:none"><button class="mes_edit_cancel">cancel</button></div></div><div class="mes_text">虚构正文</div></div><div class="swipeRightBlock"><div class="swipe_right"></div><div class="swipes-counter">2/2</div></div></div></body></html>';
test('native schema7 defaults migrate real1-6 only in memory and strictly reject invalid fields and sources',()=>{
 for(const version of [1,2,3,4,5,6]){let raw={version:Math.min(version,3),layers:[]};if(version>=4)raw=normalizeCaptionConfig(raw);if(version>=5)raw=normalizeReasoningConfig(raw);if(version>=6)raw=normalizeFooterConfig(raw);const before=structuredClone(raw),c=normalizeNativeConfig(raw);assert.equal(c.version,7);assert.deepEqual(c.nativeStyle,NATIVE_DEFAULTS);assert.deepEqual(raw,before);assert.throws(()=>normalizeNativeConfig({...raw,nativeStyle:{}}));}
 const c=current();assert.deepEqual(normalizeNativeConfig(c),c);assert.deepEqual(normalizeFooterConfig(c).nativeStyle,c.nativeStyle);for(const v of [null,undefined])assert.throws(()=>normalizeNativeConfig({...c,nativeStyle:v}));
 for(const mutate of [s=>s.actions.size=9,s=>s.actions.anchor='middle',s=>delete s.actions.anchor,s=>s.stats.x=101,s=>s.swipe.y=-161,s=>s.swipe.gap=41,s=>s.swipe.hideHistory='true',s=>s.actions.edit.source={kind:'custom',asset:'',image:'javascript:bad'},s=>s.swipe.left.mode='image',s=>s.stats.position='reasoning',s=>s.actions.edit.text='x'.repeat(41)]){const s=structuredClone(c.nativeStyle);mutate(s);assert.throws(()=>validateNativeStyle(s));}
 assert.equal(effectiveNativeMode({mode:'text',text:'  '}),'default');assert.equal(effectiveNativeMode({mode:'image',source:null}),'default');assert.equal(effectiveNativeMode({mode:'text',text:'编辑'}),'text');
});
test('native slots keep true parents, measure stable rows and convert actual offsetParent borders and scroll',()=>{
 const {document,window}=parseHTML(html),msg=document.querySelector('.mes'),c=current();c.nativeStyle.actions.position='footer';c.nativeStyle.actions.y=-20;c.nativeStyle.swipe.y=10;
 const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});const header=msg.querySelector('.ch_name'),wrapper=msg.querySelector('.mesAvatarWrapper'),left=msg.querySelector('.swipe_left'),buttons=msg.querySelector('.mes_buttons');msg.getBoundingClientRect=()=>rect(100,50,448,500);Object.defineProperties(msg,{clientLeft:{value:12},clientTop:{value:12},scrollLeft:{value:3},scrollTop:{value:4}});header.getBoundingClientRect=()=>rect(124,74,400,100);wrapper.getBoundingClientRect=()=>rect(124,74,60,60);
 const dimensions={mes_buttons:[80,25],mes_edit_buttons:[100,30],mesIDDisplay:[40,15],mes_timer:[20,15],tokenCounterDisplay:[30,15],swipe_left:[25,25],swipe_right:[25,25],'swipes-counter':[40,18]};for(const n of msg.querySelectorAll('.mes_buttons,.mes_edit_buttons,.mesIDDisplay,.mes_timer,.tokenCounterDisplay,.swipe_left,.swipe_right,.swipes-counter'))n.getBoundingClientRect=()=>rect(0,0,...dimensions[n.className]);
 window.getComputedStyle=n=>({display:n.style.display||'flex',visibility:'visible',boxSizing:'border-box'});const create=(tag,cls,parent)=>{const n=document.createElement(tag);n.className=cls;parent.append(n);if(cls==='otl-native-footer')n.getBoundingClientRect=()=>rect(124,400,400,parseFloat(msg.style.getPropertyValue('--on-footer-height'))||0);else if(cls==='otl-native-head')n.getBoundingClientRect=()=>rect(124,74+(parseFloat(msg.style.getPropertyValue('--on-head-top'))||0),400,parseFloat(msg.style.getPropertyValue('--on-head-height'))||0);return n;};
 const off=document.createElement('div');off.getBoundingClientRect=()=>rect(50,20,1,1);Object.defineProperties(off,{clientLeft:{value:5},clientTop:{value:6},scrollLeft:{value:2},scrollTop:{value:3}});Object.defineProperty(buttons,'offsetParent',{value:off});Object.defineProperty(left,'offsetParent',{value:msg});const parents=[...msg.querySelectorAll('.mes_buttons,.mes_edit_buttons,.mesIDDisplay,.swipe_left,.swipeRightBlock')].map(n=>[n,n.parentNode]);
 renderNative(msg,c,{createNode:create,latest:true});assert.ok(!msg.style.getPropertyValue('--on-header-height'));assert.equal(msg.style.getPropertyValue('--on-footer-height'),'94px');assert.equal(msg.style.getPropertyValue('--on-actions-x'),'71px');assert.equal(msg.style.getPropertyValue('--on-actions-y'),'377px');assert.equal(msg.style.getPropertyValue('--on-swipe-left-x'),'15px');assert.equal(msg.style.getPropertyValue('--on-swipe-left-y'),'403px');for(const [n,p]of parents)assert.equal(n.parentNode,p);renderNative(msg,c,{createNode:create,latest:true});assert.equal(msg.style.getPropertyValue('--on-footer-height'),'94px');assert.ok(!msg.style.getPropertyValue('--on-header-height'));assert.equal(msg.querySelectorAll('.otl-native-footer').length,1);
 buttons.style.display='none';msg.querySelector('.mes_edit_buttons').style.display='inline-flex';renderNative(msg,c,{createNode:create,latest:true});assert.equal(msg.style.getPropertyValue('--on-footer-height'),'99px');assert.equal(msg.querySelector('.mes_edit_buttons').parentNode,header);
});
test('native replacement labels have no pointer events, counters hide independently and empty modes keep native icons',()=>{
 const {document}=parseHTML(html),msg=document.querySelector('.mes'),c=current();c.nativeStyle.actions.edit={mode:'text',text:'编辑内容',source:null};c.nativeStyle.swipe.left={mode:'text',text:'上一条'};renderNative(msg,c,{latest:false});const edit=msg.querySelector('.mes_edit'),left=msg.querySelector('.swipe_left'),hint=msg.querySelector('.extraMesButtonsHint');assert.equal(edit.querySelector('.otl-native-label').textContent,'编辑内容');assert.equal(hint.nextElementSibling.className,'extraMesButtons');assert.equal(msg.querySelector('.swipes-counter').hidden,false);assert.equal(msg.querySelector('.swipes-counter').textContent,'2/2');assert.equal(msg.getAttribute('data-otl-native-hide-counter'),'true');const style=document.createElement('style');style.textContent=nativeRules('.mes',c);document.head.append(style);const rules=[...style.sheet.cssRules];assert.equal(rules.find(r=>r.selectorText==='.mes .otl-native-label').style.getPropertyValue('pointer-events'),'none');for(const stat of msg.querySelectorAll('.mesIDDisplay,.mes_timer,.tokenCounterDisplay')){const rule=rules.find(r=>r.selectorText?.includes('data-otl-native-role')&&stat.matches(r.selectorText));assert.ok(rule);assert.equal(rule.style.getPropertyValue('width'),'max-content');assert.equal(rule.style.getPropertyValue('white-space'),'nowrap');assert.equal(rule.style.getPropertyPriority('width'),'important');assert.equal(rule.style.getPropertyPriority('white-space'),'important');assert.equal(msg.querySelector('.mes_text').matches(rule.selectorText),false);}const hide=rules.find(r=>r.selectorText.includes('data-otl-native-hide-counter'));assert.equal(msg.querySelector('.swipes-counter').matches(hide.selectorText),true);assert.equal(left.matches(hide.selectorText),false);c.nativeStyle.actions.edit.text='';renderNative(msg,c,{latest:true});assert.equal(edit.dataset.otlNativeMode,'default');assert.equal(edit.querySelector('.otl-native-label'),null);assert.equal(msg.getAttribute('data-otl-native-hide-counter'),'false');
});
test('latest AI classification remains after a user, advances on AI and excludes system messages',()=>{
 const {document}=parseHTML('<html><body><div id="chat"></div></body></html>'),chat=document.querySelector('#chat');const add=(id,user=false,system=false)=>{const n=document.createElement('div');n.id=id;n.className='mes';n.setAttribute('is_user',String(user));n.setAttribute('is_system',String(system));chat.append(n);return n;};const a=add('a'),u=add('u',true);assert.equal(latestAI(chat.children),a);const b=add('b');assert.equal(latestAI(chat.children),b);add('system',false,true);assert.equal(latestAI(chat.children),b);b.remove();assert.equal(latestAI(chat.children),a);assert.ok(u.isConnected);
});


test('header action anchors follow tall measured headers and visible action height without moving native controls',()=>{
 const {document,window}=parseHTML(html),msg=document.querySelector('.mes'),c=current(),header=msg.querySelector('.ch_name'),buttons=header.querySelector('.mes_buttons'),editing=header.querySelector('.mes_edit_buttons');
 const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});let height=1000;
 header.getBoundingClientRect=()=>rect(24,50,400,height);buttons.getBoundingClientRect=()=>rect(0,0,80,24);editing.getBoundingClientRect=()=>rect(0,0,90,40);
 window.getComputedStyle=n=>({display:n.style.display||'flex',visibility:'visible',boxSizing:'border-box'});
 c.nativeStyle.actions.y=7;assert.equal(c.nativeStyle.actions.anchor,'top');
 const y=()=>parseFloat(msg.style.getPropertyValue('--on-actions-y'));
 for(const [anchor,expected]of [['top',7],['center',495],['bottom',983]]){c.nativeStyle.actions.anchor=anchor;renderNative(msg,c);assert.equal(y(),expected);assert.equal(buttons.parentNode,header);assert.equal(editing.parentNode,header);assert.equal(msg.querySelector('.otl-native-head'),null);}
 height=600;renderNative(msg,c);assert.equal(y(),583);renderNative(msg,c);assert.equal(y(),583,'measurements do not accumulate');
 buttons.style.display='none';editing.style.display='flex';renderNative(msg,c);assert.equal(y(),567,'visible edit-state controls determine group height');
 height=20;renderNative(msg,c);assert.equal(y(),7,'oversized controls do not gain a negative anchor offset');
});
test('footer action placement uses the current footer slot regardless of header anchor',()=>{
 const {document,window}=parseHTML(html),msg=document.querySelector('.mes'),c=current(),header=msg.querySelector('.ch_name'),buttons=header.querySelector('.mes_buttons');
 const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});let footerTop=1200;
 header.getBoundingClientRect=()=>rect(24,50,400,1000);buttons.getBoundingClientRect=()=>rect(0,0,80,24);window.getComputedStyle=n=>({display:n.style.display||'flex',visibility:'visible',boxSizing:'border-box'});
 const create=(tag,cls,parent)=>{const n=document.createElement(tag);n.className=cls;parent.append(n);n.getBoundingClientRect=()=>rect(24,footerTop,400,32);return n;};
 c.nativeStyle.actions.position='footer';c.nativeStyle.actions.y=5;
 for(const anchor of ['top','center','bottom']){c.nativeStyle.actions.anchor=anchor;renderNative(msg,c,{createNode:create});assert.equal(msg.style.getPropertyValue('--on-actions-y'),'1155px');assert.equal(buttons.parentNode,header);}
 footerTop=1500;renderNative(msg,c,{createNode:create});assert.equal(msg.style.getPropertyValue('--on-actions-y'),'1455px');assert.equal(msg.querySelectorAll('.otl-native-footer').length,1);
});

test('fixed header docks bottom-align in actual and preview layouts without growing or normalizing offsets',()=>{
 for(const selector of ['.ch_name','.otl-header']){
  const {document,window}=parseHTML(selector==='.ch_name'?html:html.replace('class="ch_name"','class="otl-header"')),msg=document.querySelector('.mes'),header=msg.querySelector(selector),c=current();
  const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});let height=100;
  header.getBoundingClientRect=()=>rect(24,50,400,height);
  window.getComputedStyle=n=>({display:n.style.display||'flex',visibility:'visible',boxSizing:'border-box'});
  for(const n of msg.querySelectorAll('.mesIDDisplay,.mes_timer,.tokenCounterDisplay'))n.getBoundingClientRect=()=>rect(0,0,30,15);
  for(const n of msg.querySelectorAll('.swipe_left,.swipe_right'))n.getBoundingClientRect=()=>rect(0,0,25,25);
  const create=(tag,cls,parent)=>{const n=document.createElement(tag);n.className=cls;parent.append(n);n.getBoundingClientRect=()=>rect(24,50+(parseFloat(msg.style.getPropertyValue('--on-head-top'))||0),400,parseFloat(msg.style.getPropertyValue('--on-head-height'))||0);return n;};
  const wrapper=msg.querySelector('.mesAvatarWrapper');wrapper.getBoundingClientRect=()=>rect(24,50,60,60);msg.getBoundingClientRect=()=>rect(0,0,448,500);
  c.nativeStyle.swipe.position='header';c.nativeStyle.stats.y=-7;c.nativeStyle.swipe.y=11;const before=structuredClone(c);
  for(height of [100,20,1000,100]){
   for(let repeat=0;repeat<2;repeat++){
    renderNative(msg,c,{headerSelector:selector,createNode:create});
    const dockTop=Math.max(0,height-54);
    assert.equal(msg.style.getPropertyValue('--on-head-height'),'54px');assert.equal(msg.style.getPropertyValue('--on-head-top'),dockTop+'px');
    assert.equal(msg.style.getPropertyValue('--on-stat-0-y'),(dockTop-7)+'px');assert.equal(msg.style.getPropertyValue('--on-swipe-left-y'),(50+dockTop+21+11)+'px');
    assert.ok(!msg.style.getPropertyValue('--on-header-height'));assert.equal(msg.style.getPropertyValue('--on-footer-height'),'0px');assert.equal(header.getBoundingClientRect().height,height);assert.equal(msg.querySelectorAll('.otl-native-head').length,1);
   }
  }
  assert.deepEqual(c,before,'native offsets and styles are never silently changed');
  const style=document.createElement('style');style.textContent=nativeRules('.mes',c,selector);document.head.append(style);const rules=[...style.sheet.cssRules],headerRule=rules.find(r=>r.selectorText==='.mes '+selector),actionsRule=rules.find(r=>r.selectorText==='.mes [data-otl-native-role="actions"]');
  assert.ok(!headerRule.style.getPropertyValue('height'),'native CSS cannot override the shared fixed header height');assert.equal(headerRule.style.getPropertyValue('overflow'),'visible');assert.equal(actionsRule.style.getPropertyValue('overflow'),'visible','native action menus may extend past the fixed header');
 }
});
