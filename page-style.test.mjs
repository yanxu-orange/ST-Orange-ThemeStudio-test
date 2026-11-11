import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {normalizePageConfig,resolvePageGroup,pageStyleRules,pageFontEntries,createPageDropdownBridge} from './page-style.mjs';
import {COMMON_STYLE_DEFAULTS} from './common-style.mjs';
import {mutationObserverFor} from './test-support/mutation-observer.mjs';

test('missing page config is an explicit inheritance model with no visual delta',()=>{
 const c=normalizePageConfig({text:'#123456'});
 assert.equal(c.pageStyle.settings.text,null);assert.equal(c.pageStyle.settings.section,null);
 assert.deepEqual(c.pageStyle.worldbook.art,{page:null,entry:null});
 assert.deepEqual(normalizePageConfig(c),c);assert.equal(pageStyleRules(c),'');
 assert.deepEqual(pageFontEntries(c),{});assert.equal(resolvePageGroup(c,'settings','text').color,'#123456');
});
test('whole local groups override and other groups follow the current global values',()=>{
 const c=normalizePageConfig({commonStyle:{field:{focus:'#123456'}},pageStyle:{settings:{panel:{background:'#112233'}},worldbook:{heading:{size:22},entryHeading:{size:25}}}});
 assert.equal(resolvePageGroup(c,'settings','section').background,'#112233');
 assert.equal(resolvePageGroup(c,'worldbook','entryHeading').size,25);
 assert.equal(resolvePageGroup(c,'worldbook','heading').size,22);
 c.commonStyle.field.focus='#654321';assert.equal(resolvePageGroup(c,'settings','field').focus,'#654321');
 c.pageStyle.settings.panel.radius=1;assert.equal(COMMON_STYLE_DEFAULTS.panel.radius,12);
 c.pageStyle.settings.panel=null;assert.equal(resolvePageGroup(c,'settings','section').background,'#fffdf8');
});
test('rejects malformed groups, unsupported fields and unsafe images',()=>{
 for(const pageStyle of [null,[],{chat:{}},{settings:[]},{settings:{extra:1}},{settings:{text:{font:'x;display:none'}}},{worldbook:{entry:{opacity:2}}},{worldbook:{entryHeading:{weight:650}}},{settings:{art:null}},{settings:{art:{entry:null}}},{settings:{art:{page:{image:'javascript:alert(1)'}}}},{settings:{art:{page:{asset:'missing'}}}},{settings:{art:{page:{fit:'repeat'}}}},{settings:{art:{page:{x:101}}}},{settings:{art:{page:{opacity:1}}}}])assert.throws(()=>normalizePageConfig({pageStyle}),JSON.stringify(pageStyle));
});
test('page rules reuse common controls, scope dropdowns and keep native states and mobile sizing',()=>{
 const css=pageStyleRules({pageStyle:{settings:{field:{color:'#123456'}},worldbook:{text:{size:18}}}});
 for(const token of ['html[data-orange-live] #user-settings-block','html[data-orange-live] #WorldInfo','[data-otl-page-owner="settings"]','[data-otl-page-owner="worldbook"]',':not(.red_button):not(.redWarningBG):not(.delete_entry_button)','[aria-disabled=true]','font-size:18px!important','font-size:16px!important'])assert.ok(css.includes(token),token);
 assert.ok(!css.includes('body>.select2-container--open .select2-dropdown'));
 assert.doesNotMatch(css,/display:|position:|pointer-events:|overflow:|z-index:/);
});
test('art targets real native surfaces and local fonts use the shared font session',()=>{
 const c={pageStyle:{worldbook:{text:{fontLink:{url:'https://example.com/font.woff2',faceWeight:'400'}},entryHeading:{size:24},art:{entry:{image:'https://example.com/art.png',fit:'contain',x:20,y:80}}}}};
 assert.deepEqual(pageFontEntries(c),{'page-worldbook':{fontLink:{url:'https://example.com/font.woff2',faceWeight:'400'}}});
 const css=pageStyleRules(c,{families:{'page-worldbook':'PageFont'}});
 assert.ok(css.includes('font-family:"PageFont"!important'));
 assert.ok(css.includes('#world_popup_entries_list .wi-card-entry{background-image:url("https://example.com/art.png")!important;background-size:contain!important;background-position:20% 80%'));
 assert.ok(css.includes('.world_entry_form > .inline-drawer > .inline-drawer-header'));
 assert.ok(!css.includes('.world_entry_edit'));
});
test('entry heading styles the editable title only and retains field chrome and mobile minimum',()=>{
 const title='html[data-orange-live] #WorldInfo #world_popup_entries_list .world_entry_form > .inline-drawer > .inline-drawer-header textarea[name=comment]';
 for(const size of [12,16,24]){
  const config={pageStyle:{worldbook:{entryHeading:{color:'#123456',size,weight:700}}}},css=pageStyleRules(config);
  assert.ok(css.includes(`${title}{color:#123456!important;font-size:${size}px!important;font-weight:700!important}`));
  assert.ok(css.includes(`@media(max-width:700px){${title}{font-size:${Math.max(16,size)}px!important}}`));
  const rule=css.split('\n').find(line=>line.startsWith(title));
  assert.doesNotMatch(rule,/background:|border:|outline:|font-family:|button/);
  config.pageStyle.worldbook.entryHeading=null;assert.ok(!pageStyleRules(config).includes('textarea[name=comment]'));
 }
 assert.ok(!pageStyleRules({}).includes('textarea[name=comment]'));
 const inherited={pageStyle:{worldbook:{heading:{color:'#456789',size:22,weight:500},entryHeading:null}}};
 assert.ok(pageStyleRules(inherited).includes(`${title}{color:#456789!important;font-size:22px!important;font-weight:500!important}`));
 inherited.pageStyle.worldbook.entryHeading={size:26};assert.ok(pageStyleRules(inherited).includes(`${title}{color:#354b42!important;font-size:26px!important;font-weight:600!important}`));
 inherited.pageStyle.worldbook.heading=null;inherited.pageStyle.worldbook.entryHeading=null;assert.ok(!pageStyleRules(inherited).includes('textarea[name=comment]'));
 assert.ok(!pageStyleRules({pageStyle:{settings:{heading:{size:22}}}}).includes('textarea[name=comment]'));
 assert.ok(pageStyleRules({pageStyle:{worldbook:{entryHeading:{size:12}}}},{preview:true}).includes('@container(max-width:700px)'));
});
test('Select2 ownership follows exact results IDs, handles reuse and restores original markers',async()=>{
 const {document}=parseHTML('<html><body><div id="user-settings-block"><span class="select2-container--open"><span aria-controls="settings-results"></span></span></div><div id="WorldInfo"><span class="select2-container--open"><span aria-owns="world-results"></span></span></div><span id="settings-dropdown" class="select2-container--open"><ul id="settings-results"></ul></span><span id="world-dropdown" class="select2-container--open" data-otl-page-owner="original"><ul id="world-results"></ul></span><span id="other-dropdown" class="select2-container--open"><ul id="other-results"></ul></span></body></html>');
 const bridge=createPageDropdownBridge({document,MutationObserver:mutationObserverFor(document)}),get=id=>document.getElementById(id),settle=()=>new Promise(r=>setImmediate(r));
 bridge.start();assert.equal(get('settings-dropdown').getAttribute('data-otl-page-owner'),'settings');assert.equal(get('world-dropdown').getAttribute('data-otl-page-owner'),'worldbook');assert.equal(get('other-dropdown').getAttribute('data-otl-page-owner'),null);
 let scans=0;const query=document.querySelectorAll.bind(document);document.querySelectorAll=selector=>{scans++;return query(selector);};
 const chat=document.createElement('div');chat.id='chat';document.body.append(chat);chat.className='streaming';chat.innerHTML='<div class="mes"><p>text</p></div>';document.body.classList.add('documentstyle');await settle();assert.equal(scans,0,'unrelated mutations must not rescan page roots');
 get('settings-results').id='unrelated-results';await settle();assert.equal(get('settings-dropdown').getAttribute('data-otl-page-owner'),null);
 get('world-results').remove();await settle();assert.equal(get('world-dropdown').getAttribute('data-otl-page-owner'),'original');
 document.querySelector('#user-settings-block [aria-controls]').setAttribute('aria-controls','unrelated-results');await settle();assert.equal(get('settings-dropdown').getAttribute('data-otl-page-owner'),'settings');
 bridge.stop();assert.equal(get('settings-dropdown').getAttribute('data-otl-page-owner'),null);assert.equal(get('world-dropdown').getAttribute('data-otl-page-owner'),'original');
 document.querySelector('#user-settings-block [aria-controls]').setAttribute('aria-controls','unrelated-results');await settle();assert.equal(get('settings-dropdown').getAttribute('data-otl-page-owner'),null);
});
