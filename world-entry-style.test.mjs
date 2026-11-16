import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePageConfig,pageStyleRules} from './page-style.mjs';
import {createSpringTemplate} from './spring-template.mjs';

test('entry layout is opt in and survives export without changing old works',()=>{
 assert.equal(normalizePageConfig({}).pageStyle.worldbook.entryDetails,null);
 assert.equal(pageStyleRules({}),'');
 const c=normalizePageConfig(createSpringTemplate());
 assert.deepEqual(normalizePageConfig(JSON.parse(JSON.stringify(c))),c);
 for(const entryDetails of [{borderMode:'x'},{gap:-1},{fieldTypography:'x'},{deleteColor:'red'},{plainIcons:1},{extra:1}])assert.throws(()=>normalizePageConfig({pageStyle:{worldbook:{entryDetails}}}));
});
test('Spring world entries preserve v28 separators, whitespace, icon and disabled styling',()=>{
 const css=pageStyleRules(createSpringTemplate(),{page:'worldbook'});
 for(const expected of ['border-bottom:1px solid #cbd2c7!important','padding:8px 3px 12px!important;margin-bottom:10px','linear-gradient(90deg,#fff7f9,#ffffff)','min-width:36px','calc(var(--mainFontSize) * 1.5)','opacity:1!important;filter:none!important;color:#788572','color:#934855!important;background:#f8e8eb','--mainFontFamily:inherit!important','font-size:var(--mainFontSize)!important'])assert.ok(css.includes(expected),expected);
 assert.ok(!pageStyleRules(createSpringTemplate(),{page:'presets'}).includes('.disabledWIEntry'));
 const preview=pageStyleRules(createSpringTemplate(),{preview:true,page:'worldbook'});
 assert.ok(preview.includes('#chat>.otl-native-page[data-otl-page="worldbook"]'));
});

test('native field typography and plain icons outrank their shared control styles',async()=>{
 const {COMMON_FIELD_SELECTOR,COMMON_BUTTON_SELECTOR}=await import('./common-style.mjs');
 const css=pageStyleRules(createSpringTemplate(),{page:'worldbook'});
 assert.ok(css.includes(`${COMMON_FIELD_SELECTOR}:is(input,textarea,select,.text_pole){font-family:var(--mainFontFamily),sans-serif!important`));
 assert.ok(css.includes(`${COMMON_BUTTON_SELECTOR}:is(.fa-solid,.fa-regular,.fa-fw,.menu_button_icon){background:transparent!important;border-color:transparent!important`));
});
