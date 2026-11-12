import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCommonConfig,commonStyleRules,commonFontEntries,COMMON_STYLE_DEFAULTS} from './common-style.mjs';
test('common appearance normalizes independent groups and initial theme colors',()=>{
 const c=normalizeCommonConfig({text:'#123456',surface:'#abcdef',accent:'#654321'});
 assert.equal(c.commonStyle.text.color,'#123456');assert.equal(c.commonStyle.panel.background,'#abcdef');assert.equal(c.commonStyle.text.accent,'#654321');
 for(const group of ['heading','button','field'])assert.equal(c.commonStyle[group].color,'#123456');
 assert.equal(c.commonStyle.field.focus,'#654321');
 c.commonStyle.heading.radius=2;assert.equal(COMMON_STYLE_DEFAULTS.heading.radius,8);
 assert.deepEqual(normalizeCommonConfig(c),c);
 assert.deepEqual(JSON.parse(JSON.stringify(c)).commonStyle,c.commonStyle);
});
test('rejects malformed groups, unknown keys, values and hostile CSS',()=>{
 for(const commonStyle of [null,[],true,{enabled:false},{field:null},{text:[]},{text:{size:'14'}},{text:{size:11}},{heading:{size:33}},{heading:{weight:650}},{panel:{opacity:2}},{panel:{width:-1}},{button:{radius:33}},{text:{font:'serif;display:none'}},{field:{color:'red'}},{field:{focus:'#fff'}},{text:{fontLink:{url:'javascript:alert(1)',faceWeight:'400'}}}])assert.throws(()=>normalizeCommonConfig({commonStyle}),JSON.stringify(commonStyle));
});
test('loaded shared font participates in existing font session and CSS stays escaped',()=>{
 const c=normalizeCommonConfig({commonStyle:{text:{fontLink:{url:'https://example.com/font.woff2',faceWeight:'400'}}}});
 assert.deepEqual(commonFontEntries(c),{common:{fontLink:{url:'https://example.com/font.woff2',faceWeight:'400'}}});
 assert.match(commonStyleRules(c,{family:'OrangeTextFont4'}),/font-family:"OrangeTextFont4"!important/);
 assert.match(commonStyleRules({}),/font-family:var\(--mainFontFamily, sans-serif\)/);
});
test('same renderer provides appearance parity without host geometry or global token leaks',()=>{
 const c={commonStyle:{text:{color:'#112233'},panel:{background:'#abcdef',opacity:.4},field:{focus:'#778899'}}};
 const live=commonStyleRules(c),preview=commonStyleRules(c,{preview:true});
 assert.ok(live.includes('html[data-orange-live]'));assert.ok(preview.includes('html[data-orange-lab] #chat>.otl-native-page'));
 const declarations=css=>css.split('\n').filter(row=>!row.startsWith('@media')&&!row.startsWith('@container')).map(row=>row.slice(row.indexOf('{')));
 assert.deepEqual(declarations(live),declarations(preview));
 for(const css of [live,preview]){assert.match(css,/rgba\(171,205,239,0.4\)/);assert.match(css,/#778899/);assert.doesNotMatch(css,/display:|position:|pointer-events:|height:|z-index:|:root\{/);}
 assert.ok(live.includes('#chat *,#send_form *,#form_sheld *,#orange-theme-lab'));
});
test('native states, glyphs and detached Select2 are covered without changing behavior',()=>{
 const css=commonStyleRules({});
 for(const token of [':checked','::-webkit-slider-thumb','::-moz-range-thumb','[readonly]',':focus-visible','[aria-disabled=true]','.select2-container--disabled','.select2-results__option--disabled','.select2-results__option--selected::before','body>.select2-container--open .select2-dropdown','.inline-drawer-icon.up'])assert.ok(css.includes(token),token);
 assert.ok(css.includes(':not(.red_button):not(.redWarningBG):not(.delete_entry_button)'));
 assert.doesNotMatch(css,/::(?:before|placeholder|-(?:webkit|moz)[\w-]+):not\(/);
 const buttonRule=css.split('\n').find(row=>row.includes('input[type=submit]')&&row.includes('box-shadow:none'));
 assert.ok(buttonRule);assert.ok(!buttonRule.includes('font-family'));
});

test('mobile fields use the same minimum 16px in live and preview without reducing larger text',()=>{
 for(const preview of [false,true])for(const size of [12,14,16,24]){
  const css=commonStyleRules({commonStyle:{text:{size}}},{preview});
  const mobile=css.split('\n').find(row=>row.startsWith('@media'));
  assert.ok(mobile.startsWith('@media(max-width:700px)'));
  assert.ok(mobile.endsWith(`font-size:${Math.max(16,size)}px!important}}`));
  assert.ok(mobile.includes('.select2-search__field'));
 }
});

test('worldbook h4 field labels are not painted as section headings',()=>{
 assert.ok(commonStyleRules({}).includes(':where(#user-settings-block) h4'));
 assert.ok(!commonStyleRules({},{preview:true}).includes(':is(h3,h4,'));
});

test('native text buttons follow interface fonts while Font Awesome keeps its glyph family',()=>{
 const css=commonStyleRules({commonStyle:{text:{font:'Georgia, serif',size:24}}});
 assert.match(css,/--mainFontSize:24px;--mainFontFamily:Georgia, serif;/);
 const rule=css.split('\n').find(row=>row.includes(':not(:is(.fa,.fas,.far,.fab,.fa-solid'));
 assert.ok(rule);assert.match(rule,/font-family:Georgia, serif!important;font-size:24px!important/);
 assert.ok(!commonStyleRules({}).includes('--mainFontFamily:var(--mainFontFamily'));
});

test('readonly state extends the base input selector so it wins native appearance specificity',()=>{
 const rows=commonStyleRules({}).split('\n'),normal=rows.find(row=>row.includes('input[type=password]')&&row.includes('box-shadow:none!important'));
 const readonly=rows.find(row=>row.includes('border-style:dashed!important'));
 const selector=normal.slice(0,normal.indexOf('{'));
 assert.equal(readonly.slice(0,readonly.indexOf('{')).replace('[readonly]:not(:disabled)',''),selector);
});

test('desktop narrow preview uses its container width for phone input sizing',()=>{
 const css=commonStyleRules({},{preview:true});assert.match(css,/@container\(max-width:700px\).*font-size:16px!important/);
 assert.ok(!commonStyleRules({}).includes('@container'));
});

test('settings h4 scope adds no ID specificity to other heading hover and expanded states',()=>{
 const css=commonStyleRules({});assert.ok(css.includes(':is(h3,:where(#user-settings-block) h4,'));assert.ok(!css.includes(':is(h3,#user-settings-block h4,'));
});

test('Select2 option buttons in isolated preview do not acquire generic button backgrounds',()=>{
 const css=commonStyleRules({},{preview:true});assert.ok(css.includes(':not(.delete_entry_button):not(.select2-results__option)'));
});


test('selected character heading is covered without promoting native field labels or persona names',()=>{
 const css=commonStyleRules({});
 assert.ok(css.includes(':where(#rm_button_selected_ch) h2'));
 assert.ok(!css.includes(':is(h2,h3,h4'));assert.ok(!css.includes('h5'));
});
