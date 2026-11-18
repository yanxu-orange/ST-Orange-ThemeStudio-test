import test from 'node:test';import assert from 'node:assert/strict';
import {normalizeCommonConfig,commonStyleRules,COMMON_BUTTON_SELECTOR} from './common-style.mjs';
import {normalizePageConfig,resolvePageGroup,pageStyleRules} from './page-style.mjs';
test('button alpha defaults preserve old solid output and validate both independent values',()=>{
 const c=normalizeCommonConfig({commonStyle:{button:{background:'#abcdef',hover:'#123456'}}});assert.equal(c.commonStyle.button.opacity,1);assert.equal(c.commonStyle.button.hoverOpacity,1);assert.match(commonStyleRules(c),/background:#abcdef!important/);
 for(const key of ['opacity','hoverOpacity'])for(const v of [-.01,1.01,'0.5',null,NaN])assert.throws(()=>normalizeCommonConfig({commonStyle:{button:{[key]:v}}}));
});
test('button transparency affects background only; native focus disabled and danger protections remain',()=>{
 const c={commonStyle:{button:{background:'#103948',opacity:.22,hover:'#103948',hoverOpacity:.4}}},css=commonStyleRules(c);
 assert.match(css,/background:rgba\(16,57,72,0.22\)!important/);assert.match(css,/background:rgba\(16,57,72,0.4\)!important/);assert.doesNotMatch(css,/backdrop-filter|opacity:0.22/);
 assert.match(css,/:focus-visible\{outline:2px/);assert.match(css,/opacity:.5!important;cursor:not-allowed/);
 assert.match(COMMON_BUTTON_SELECTOR,/:not\(\.red_button\):not\(\.redWarningBG\):not\(\.delete_entry_button\)/);
 assert.match(css,/:not\(:is\(:disabled,\[disabled\],\.disabled,\[aria-disabled=true\]\)\):is\(:hover/);
});
test('page null inherits alpha, existing local groups stay opaque, local edit roundtrips',()=>{
 const c=normalizePageConfig({commonStyle:{button:{opacity:.22,hoverOpacity:.4}},pageStyle:{settings:{button:{color:'#ffffff'}},worldbook:{button:{opacity:.3,hoverOpacity:.6}}}});
 assert.equal(resolvePageGroup(c,'presets','button').opacity,.22);assert.equal(resolvePageGroup(c,'settings','button').opacity,1);assert.equal(resolvePageGroup(c,'worldbook','button').hoverOpacity,.6);
 assert.deepEqual(normalizePageConfig(JSON.parse(JSON.stringify(c))),c);c.pageStyle.worldbook.button=null;assert.equal(resolvePageGroup(c,'worldbook','button').opacity,.22);assert.match(pageStyleRules(c),/#user-settings-block/);
});
