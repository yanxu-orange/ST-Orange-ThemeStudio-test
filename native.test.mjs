import {runLayoutPass} from './layout-pass.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import {parseHTML} from 'linkedom';
import {normalizeNativeConfig,validateNativeStyle,NATIVE_DEFAULTS,nativeRules,renderNative,nativeLayout,effectiveNativeMode,latestAI} from './native.mjs';import {normalizeFooterConfig} from './footer.mjs';import {normalizeReasoningConfig} from './reasoning.mjs';import {normalizeCaptionConfig} from './captions.mjs';
const current=()=>normalizeNativeConfig(normalizeFooterConfig(normalizeReasoningConfig(normalizeCaptionConfig({version:3,font:'serif',accent:'#123456',timeColor:'#654321',cardWidth:448,layers:[]}))));
const html='<html><head></head><body><div class="mes" is_user="false"><div class="mesAvatarWrapper"><div class="mesIDDisplay">#1</div><div class="mes_timer">2s</div><div class="tokenCounterDisplay">120t</div></div><div class="swipe_left"></div><div class="mes_block"><div class="ch_name"><div class="mes_buttons"><span class="extraMesButtonsHint">more</span><div class="extraMesButtons"></div><div class="mes_edit"></div></div><div class="mes_edit_buttons" style="display:none"><button class="mes_edit_cancel">cancel</button></div></div><div class="mes_text">虚构正文</div></div><div class="swipeRightBlock"><div class="swipe_right"></div><div class="swipes-counter">2/2</div></div></div></body></html>';
test('native schema7 defaults migrate real1-6 only in memory and strictly reject invalid fields and sources',()=>{
 for(const version of [1,2,3,4,5,6]){let raw={version:Math.min(version,3),layers:[]};if(version>=4)raw=normalizeCaptionConfig(raw);if(version>=5)raw=normalizeReasoningConfig(raw);if(version>=6)raw=normalizeFooterConfig(raw);const before=structuredClone(raw),c=normalizeNativeConfig(raw);assert.equal(c.version,7);assert.deepEqual(c.nativeStyle,NATIVE_DEFAULTS);assert.deepEqual(raw,before);assert.throws(()=>normalizeNativeConfig({...raw,nativeStyle:{}}));}
 const c=current();assert.deepEqual(normalizeNativeConfig(c),c);assert.deepEqual(normalizeFooterConfig(c).nativeStyle,c.nativeStyle);for(const v of [null,undefined])assert.throws(()=>normalizeNativeConfig({...c,nativeStyle:v}));
 for(const mutate of [s=>s.actions.size=9,s=>s.actions.edit.anchor='middle',s=>s.actions.more.position='middle',s=>s.stats.floor.x=101,s=>s.swipe.y=-161,s=>s.swipe.gap=41,s=>s.swipe.hideHistory='true',s=>s.actions.edit.source={kind:'custom',asset:'',image:'javascript:bad'},s=>s.swipe.left.mode='image',s=>s.stats.floor.position='reasoning',s=>s.actions.edit.text='x'.repeat(41)]){const s=structuredClone(c.nativeStyle);mutate(s);assert.throws(()=>validateNativeStyle(s));}
 assert.equal(effectiveNativeMode({mode:'text',text:'  '}),'default');assert.equal(effectiveNativeMode({mode:'image',source:null}),'default');assert.equal(effectiveNativeMode({mode:'text',text:'编辑'}),'text');
});
test('native replacement labels have no pointer events, counters hide independently and empty modes keep native icons',()=>{
 const {document}=parseHTML(html),msg=document.querySelector('.mes'),c=current();Object.assign(c.nativeStyle.actions.edit,{mode:'text',text:'编辑内容',source:null});c.nativeStyle.swipe.left={mode:'text',text:'上一条'};renderNative(msg,c,{latest:false});const edit=msg.querySelector('.mes_edit'),left=msg.querySelector('.swipe_left'),hint=msg.querySelector('.extraMesButtonsHint');assert.equal(edit.querySelector('.otl-native-label').textContent,'编辑内容');assert.equal(hint.nextElementSibling.className,'extraMesButtons');assert.equal(msg.querySelector('.swipes-counter').hidden,false);assert.equal(msg.querySelector('.swipes-counter').textContent,'2/2');assert.equal(msg.getAttribute('data-otl-native-hide-counter'),'true');const style=document.createElement('style');style.textContent=nativeRules('.mes',c);document.head.append(style);const rules=[...style.sheet.cssRules];assert.equal(rules.find(r=>r.selectorText==='.mes .otl-native-label').style.getPropertyValue('pointer-events'),'none');for(const stat of msg.querySelectorAll('.mesIDDisplay,.mes_timer,.tokenCounterDisplay')){const rule=rules.find(r=>r.selectorText?.includes('data-otl-native-role')&&stat.matches(r.selectorText));assert.ok(rule);assert.equal(rule.style.getPropertyValue('width'),'max-content');assert.equal(rule.style.getPropertyValue('white-space'),'nowrap');assert.equal(rule.style.getPropertyPriority('width'),'important');assert.equal(rule.style.getPropertyPriority('white-space'),'important');assert.equal(msg.querySelector('.mes_text').matches(rule.selectorText),false);}const hide=rules.find(r=>r.selectorText.includes('data-otl-native-hide-counter'));assert.equal(msg.querySelector('.swipes-counter').matches(hide.selectorText),true);assert.equal(left.matches(hide.selectorText),false);c.nativeStyle.actions.edit.text='';renderNative(msg,c,{latest:true});assert.equal(edit.dataset.otlNativeMode,'default');assert.equal(edit.querySelector('.otl-native-label'),null);assert.equal(msg.getAttribute('data-otl-native-hide-counter'),'false');
});
test('latest AI classification remains after a user, advances on AI and excludes system messages',()=>{
 const {document}=parseHTML('<html><body><div id="chat"></div></body></html>'),chat=document.querySelector('#chat');const add=(id,user=false,system=false)=>{const n=document.createElement('div');n.id=id;n.className='mes';n.setAttribute('is_user',String(user));n.setAttribute('is_system',String(system));chat.append(n);return n;};const a=add('a'),u=add('u',true);assert.equal(latestAI(chat.children),a);const b=add('b');assert.equal(latestAI(chat.children),b);add('system',false,true);assert.equal(latestAI(chat.children),b);b.remove();assert.equal(latestAI(chat.children),a);assert.ok(u.isConnected);
});



function fixture(){
 const {document,window}=parseHTML(html),msg=document.querySelector('.mes'),c=current(),header=msg.querySelector('.ch_name'),wrapper=msg.querySelector('.mesAvatarWrapper');
 const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
 header.getBoundingClientRect=()=>rect(24,50,400,100);wrapper.getBoundingClientRect=()=>rect(24,50,60,60);msg.getBoundingClientRect=()=>rect(0,0,448,500);
 const dims={mes_buttons:[30,25],mes_edit:[25,25],mes_edit_buttons:[80,30],mesIDDisplay:[40,15],mes_timer:[20,15],tokenCounterDisplay:[30,15],swipe_left:[25,25],swipeRightBlock:[40,45],swipe_right:[25,25],'swipes-counter':[40,18]};
 for(const n of msg.querySelectorAll(Object.keys(dims).map(k=>'.'+k).join(',')))n.getBoundingClientRect=()=>rect(0,0,...dims[n.className]);
 window.getComputedStyle=n=>({display:n.style.display||'flex',visibility:'visible'});
 const createNode=(tag,cls,parent)=>{const n=document.createElement(tag);n.className=cls;parent.append(n);n.getBoundingClientRect=()=>rect(24,400,400,parseFloat(msg.style.getPropertyValue('--on-footer-height'))||0);return n;};
 const render=()=>renderNative(msg,c,{createNode,latest:true}),value=k=>parseFloat(msg.style.getPropertyValue('--on-'+k));return {document,msg,c,header,wrapper,rect,render,value};
}
test('existing saved theme seeds independent controls without mutating supplied JSON',()=>{
 const old={actions:{size:19,color:'auto',gap:12,position:'footer',anchor:'bottom',x:25,y:-35,edit:{mode:'text',text:'修改',source:null}},stats:{size:13,color:'auto',gap:8,position:'footer',x:10,y:20},swipe:{...NATIVE_DEFAULTS.swipe}};delete old.swipe.layout;
 const before=structuredClone(old),v=validateNativeStyle(old);assert.deepEqual(old,before);assert.equal(v.actions.edit.position,'footer');assert.equal(v.actions.more.x,25);assert.equal(v.actions.edit.y,-35);assert.equal(v.actions.edit.imageSize,27);for(const key of ['floor','time','tokens'])assert.equal(v.stats[key].y,20);assert.equal(v.swipe.layout,'compact');assert.deepEqual(validateNativeStyle(v),v);
 for(const mutate of [v=>v.actions.edit.imageSize=121,v=>v.swipe.layout='custom',v=>v.stats.tokens.x=101,v=>v.actions.more.y=-161]){const bad=structuredClone(v);mutate(bad);assert.throws(()=>validateNativeStyle(bad));}
});
test('edit, more and each statistic have independent literal positions and retain native parents',()=>{
 const {msg,c,header,render,value}=fixture(),parents=[...msg.querySelectorAll('.mes_buttons,.mes_edit,.mes_edit_buttons,.extraMesButtonsHint,.extraMesButtons,.mesIDDisplay,.mes_timer,.tokenCounterDisplay')].map(n=>[n,n.parentNode]);
 Object.assign(c.nativeStyle.actions.edit,{position:'footer',x:20,y:-50});Object.assign(c.nativeStyle.actions.more,{position:'footer',x:60,y:-20});
 Object.assign(c.nativeStyle.stats.floor,{position:'footer',x:10,y:-30});Object.assign(c.nativeStyle.stats.time,{position:'footer',x:20,y:10});Object.assign(c.nativeStyle.stats.tokens,{position:'header',x:-10,y:-7});render();
 assert.equal(value('edit-x'),140);assert.equal(value('edit-y'),350);assert.equal(value('actions-x'),240);assert.equal(value('actions-y'),330);assert.equal(value('stat-0-x'),40);assert.equal(value('stat-0-y'),320);assert.equal(value('stat-1-x'),124);assert.equal(value('stat-1-y'),360);assert.equal(value('stat-2-y'),70);assert.equal(value('footer-height'),53);
 const horizontalBefore=['actions-x','actions-y','footer-height','stat-0-x','stat-1-y'].map(value);c.nativeStyle.actions.edit.x=45;render();assert.deepEqual(['actions-x','actions-y','footer-height','stat-0-x','stat-1-y'].map(value),horizontalBefore,'moving edit horizontally cannot move more or change tail height');const unchanged=['actions-x','actions-y','stat-0-x','stat-0-y','stat-2-y'].map(value);c.nativeStyle.actions.edit.x=-5;c.nativeStyle.actions.edit.y=-80;c.nativeStyle.stats.time.y=-100;render();assert.deepEqual(['actions-x','actions-y','stat-0-x','stat-0-y','stat-2-y'].map(value),unchanged);assert.equal(value('edit-y'),320);assert.equal(value('footer-height'),53);render();assert.equal(value('edit-y'),320);for(const [n,p]of parents)assert.equal(n.parentNode,p);
 const normal=msg.querySelector('.mes_buttons'),editing=msg.querySelector('.mes_edit_buttons');normal.style.display='none';editing.style.display='flex';render();assert.equal(value('editing-y'),270);assert.equal(editing.parentNode,header);
});
test('negative footer positions do not rebound or inflate reserved tail and captions share the origin',()=>{
 const {document,msg,c,rect,render,value}=fixture();c.nativeStyle.swipe.y=-60;c.nativeStyle.actions.more.position='footer';c.nativeStyle.actions.more.y=-50;c.nativeStyle.actions.edit.position='footer';c.nativeStyle.actions.edit.y=-40;
 render();assert.equal(value('footer-height'),0);assert.equal(value('actions-y'),300);assert.equal(value('swipe-left-y'),340);render();assert.equal(value('footer-height'),0);
 const caption=document.createElement('div');caption.className='otl-footer';caption.getBoundingClientRect=()=>rect(24,300,400,100);msg.querySelector('.mes_block').insertBefore(caption,msg.querySelector('.otl-native-footer'));
 c.nativeStyle.actions.edit.y=8;render();assert.equal(value('edit-y'),308);assert.equal(value('footer-height'),0);c.nativeStyle.actions.edit.y=130;render();assert.equal(value('footer-height'),63);render();assert.equal(value('footer-height'),63);
});
test('compact and ends arrows retain native counter block and react to counter text changes',()=>{
 const {msg,c,render,value}=fixture(),counter=msg.querySelector('.swipes-counter'),right=msg.querySelector('.swipeRightBlock');render();assert.equal(value('swipe-right-x')-value('swipe-left-x'),31);
 c.nativeStyle.swipe.layout='ends';render();assert.equal(value('swipe-right-x'),384);assert.equal(counter.parentNode,right);counter.textContent='100/100';counter.getBoundingClientRect=()=>({width:70,height:18});right.getBoundingClientRect=()=>({width:70,height:45});render();assert.equal(value('swipe-right-x'),354);assert.equal(counter.textContent,'100/100');assert.equal(counter.nextElementSibling,null);
});
test('header anchors, offset parent borders and image size remain independent of other settings',()=>{
 const {document,msg,c,rect,render,value}=fixture(),edit=msg.querySelector('.mes_edit'),offset=document.createElement('div');offset.getBoundingClientRect=()=>rect(10,20,1,1);Object.defineProperties(offset,{clientLeft:{value:5},clientTop:{value:6},scrollLeft:{value:2},scrollTop:{value:3}});Object.defineProperty(edit,'offsetParent',{value:offset});
 c.nativeStyle.actions.edit.anchor='bottom';c.nativeStyle.actions.edit.y=7;render();assert.equal(value('edit-y'),109);assert.equal(value('edit-x'),386);assert.equal(value('actions-y'),0);
 c.nativeStyle.actions.edit.imageSize=64;const css=nativeRules('.mes',c);assert.match(css,/background-size:contain!important/);assert.match(css,/width:64px!important;height:64px!important/);assert.doesNotMatch(css,/display:flex!important/);assert.ok(!msg.querySelector('.otl-native-head'));
});

test('footer edit and more have distinct natural positions without sharing user offsets',()=>{
 const {c,render,value}=fixture();c.nativeStyle.actions.edit.position='footer';c.nativeStyle.actions.more.position='footer';render();
 const moreX=value('actions-x'),editX=value('edit-x'),height=value('footer-height');assert.equal(editX,60);assert.equal(moreX,0);
 c.nativeStyle.actions.more.x=30;c.nativeStyle.actions.more.y=-15;render();assert.equal(value('edit-x'),editX);assert.equal(value('edit-y'),400);assert.equal(value('footer-height'),height);
 c.nativeStyle.actions.edit.x=-10;render();assert.equal(value('edit-x'),editX-40);assert.equal(value('actions-x'),moreX+120);assert.equal(value('actions-y'),335);assert.equal(value('footer-height'),height);
});
test('existing image themes seed independent icon size from their actual prior size',()=>{
 for(const size of [10,15,28]){const raw=structuredClone(NATIVE_DEFAULTS);raw.actions.size=size;delete raw.actions.edit.imageSize;assert.equal(validateNativeStyle(raw).actions.edit.imageSize,size+8);raw.actions.edit.imageSize=57;assert.equal(validateNativeStyle(raw).actions.edit.imageSize,57);}
});

test('opening native more tools does not move either action baseline',()=>{
 for(const area of ['header','footer']){
  const {msg,c,rect,render,value}=fixture(),buttons=msg.querySelector('.mes_buttons'),hint=msg.querySelector('.extraMesButtonsHint');hint.getBoundingClientRect=()=>rect(0,0,30,25);
  c.nativeStyle.actions.edit.position=area;c.nativeStyle.actions.more.position=area;c.nativeStyle.actions.more.anchor='bottom';render();const before=['actions-x','actions-y','edit-x','edit-y'].map(value);
  buttons.getBoundingClientRect=()=>rect(0,0,240,75);msg.querySelector('.extraMesButtons').classList.add('visible');render();assert.deepEqual(['actions-x','actions-y','edit-x','edit-y'].map(value),before);
 }
});

test('footer arrows and percent offsets use footer width rather than the wider header',()=>{
 const {msg,c,rect,render,value}=fixture(),header=msg.querySelector('.ch_name');header.getBoundingClientRect=()=>rect(12,50,448,100);
 c.nativeStyle.swipe.layout='ends';c.nativeStyle.actions.edit.position='footer';c.nativeStyle.actions.edit.x=50;c.nativeStyle.stats.floor.position='footer';c.nativeStyle.stats.floor.x=50;render();
 assert.equal(value('swipe-left-x'),24);assert.equal(value('swipe-right-x'),384,'right edge is footer left 24 + width 400');assert.equal(value('edit-x'),224);assert.equal(value('stat-0-x'),200);
 c.nativeStyle.swipe.x=10;render();assert.equal(value('swipe-left-x'),64);assert.equal(value('swipe-right-x'),424,'explicit user offset shifts the pair by 10% of footer width');
});

test('expanded More tools wrap below their unchanged anchor inside the selected region',()=>{
 const {msg,c,rect,render,value}=fixture(),extra=msg.querySelector('.extraMesButtons'),hint=msg.querySelector('.extraMesButtonsHint');hint.getBoundingClientRect=()=>rect(0,0,30,25);extra.getBoundingClientRect=()=>rect(0,0,200,60);extra.style.display='none';
 c.nativeStyle.actions.more.x=5;render();const before=['actions-x','actions-y','edit-x','edit-y','footer-height'].map(value);let clicks=0;extra.addEventListener('click',()=>clicks++);extra.style.display='flex';render();
 assert.deepEqual(['actions-x','actions-y','edit-x','edit-y','footer-height'].map(value),before);assert.equal(value('tools-x'),224);assert.equal(value('tools-y'),81);assert.equal(value('tools-max-width'),400);extra.click();assert.equal(clicks,1);render();assert.equal(value('tools-x'),224);extra.style.display='none';render();assert.deepEqual(['actions-x','actions-y','edit-x','edit-y','footer-height'].map(value),before);
 assert.equal(hint.nextElementSibling,extra);const css=nativeRules('.mes',c);assert.match(css,/flex-wrap:wrap!important;width:max-content!important;max-width:var\(--on-tools-max-width,100%\)!important/);assert.doesNotMatch(css,/extraMesButtons\{[^}]*display:/);
});

test('statistic positions do not depend on sibling text, width, visibility or region',()=>{
 const {msg,c,rect,render,value}=fixture(),floor=msg.querySelector('.mesIDDisplay'),timer=msg.querySelector('.mes_timer');
 c.nativeStyle.stats.floor.position='footer';c.nativeStyle.stats.time.position='header';c.nativeStyle.stats.tokens.position='footer';c.nativeStyle.stats.time.x=5;c.nativeStyle.stats.tokens.y=-20;render();
 const own=['stat-1-x','stat-1-y','stat-2-x','stat-2-y'],before=own.map(value);assert.equal(value('stat-1-x'),64);assert.equal(value('stat-2-x'),88);
 floor.textContent='#100000';floor.getBoundingClientRect=()=>rect(0,0,100,15);render();assert.deepEqual(own.map(value),before);
 floor.style.display='none';render();assert.deepEqual(own.map(value),before);floor.textContent='';render();assert.deepEqual(own.map(value),before);
 timer.textContent='10000 seconds';timer.getBoundingClientRect=()=>rect(0,0,180,15);render();assert.deepEqual(own.map(value),before);timer.style.display='none';render();assert.deepEqual(['stat-2-x','stat-2-y'].map(value),before.slice(2));timer.style.display='';render();
 c.nativeStyle.stats.floor.position='header';c.nativeStyle.stats.floor.x=80;render();assert.deepEqual(own.map(value),before);
});


test('batched native placement reads origins after preceding message footer heights settle',()=>{
 const fixtures=[fixture(),fixture()];
 const jobs=fixtures.map((f,i)=>{
  const offset=()=>i?500+(fixtures[0].value('footer-height')||0):0;
  let headerReads=0;f.header.getBoundingClientRect=()=>{if(++headerReads===2)assert.ok(fixtures.every(node=>node.value('footer-height')===53),'all flow reservations precede viewport origins');return f.rect(24,offset()+50,400,100);};
  f.wrapper.getBoundingClientRect=()=>f.rect(24,offset()+50,60,60);
  f.msg.getBoundingClientRect=()=>f.rect(0,offset(),448,500);
  const createNode=(tag,cls,parent)=>{const node=f.document.createElement(tag);node.className=cls;parent.append(node);node.getBoundingClientRect=()=>f.rect(24,offset()+400,400,f.value('footer-height')||0);return node;};
  return nativeLayout(f.msg,f.c,{createNode,latest:true});
 });
 runLayoutPass(jobs);
 for(const f of fixtures){assert.equal(f.value('footer-height'),53);assert.equal(f.value('actions-y'),0);assert.equal(f.value('stat-0-y'),77);assert.equal(f.value('swipe-left-y'),400);}
});
test('nested edit and tray use the newly positioned actions parent',()=>{
 const {msg,c,header,rect,render,value}=fixture(),actions=msg.querySelector('.mes_buttons'),edit=msg.querySelector('.mes_edit'),extra=msg.querySelector('.extraMesButtons'),hint=msg.querySelector('.extraMesButtonsHint');
 actions.getBoundingClientRect=()=>{const r=header.getBoundingClientRect();return rect(r.left+(value('actions-x')||0),r.top+(value('actions-y')||0),30,25);};
 for(const node of [edit,extra])Object.defineProperty(node,'offsetParent',{value:actions});
 hint.getBoundingClientRect=()=>rect(0,0,30,25);extra.getBoundingClientRect=()=>rect(0,0,200,60);
 c.nativeStyle.actions.more.x=5;render();
 assert.equal(value('actions-x'),359);assert.equal(value('edit-x'),16);assert.equal(value('edit-y'),0);assert.equal(value('tools-x'),-159);assert.equal(value('tools-y'),31);
});

test('native icons keep action placement, use shared tint, recover safely from errors and remove on mode switch',()=>{
 const {msg,c,render}=fixture(),edit=msg.querySelector('.mes_edit'),parent=edit.parentNode,action=c.nativeStyle.actions.edit;
 Object.assign(action,{mode:'icon',source:{kind:'custom',asset:'',image:'data:image/png;base64,AAAA'},tint:true,fillMode:'gradient',color:'#123456',color2:'#abcdef',gradientAngle:180,size:0,imageSize:60});render();
 let span=edit.querySelector('.otl-native-icon'),picture=span.querySelector('img');assert.equal(edit.dataset.otlNativeMode,'icon');assert.equal(span.style.width,'60px');assert.equal(span.style.background,'linear-gradient(180deg,#123456,#abcdef)');assert.equal(picture.style.opacity,'0');assert.equal(edit.parentNode,parent);
 action.tint=false;render();assert.equal(edit.querySelector('img'),picture);assert.equal(span.style.maskImage,'');assert.equal(picture.style.opacity,'1');const stale=picture.onerror;
 action.source.image='data:image/png;base64,BBBB';render();const replacement=edit.querySelector('img');stale();assert.equal(edit.querySelector('img'),replacement);replacement.onerror();render();assert.equal(edit.querySelector('.otl-native-icon'),null);assert.equal(edit.dataset.otlNativeMode,'default');
 action.mode='default';render();action.mode='icon';render();assert.ok(edit.querySelector('.otl-native-icon'),'returning from native explicitly retries a failed source');const late=edit.querySelector('img').onerror;action.mode='text';action.text='修改';render();late();assert.equal(edit.dataset.otlNativeMode,'text');assert.equal(edit.querySelector('.otl-native-icon'),null);assert.equal(edit.querySelector('.otl-native-label').textContent,'修改');
});
