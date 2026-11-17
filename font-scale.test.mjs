import {test} from 'node:test';
import assert from 'node:assert/strict';
import {commonStyleRules} from './common-style.mjs';
import {pageStyleRules} from './page-style.mjs';
import {baiPresetRules} from './bai-preset-style.mjs';
import {CHROME_DEFAULTS,chromeRules} from './chrome.mjs';

test('interface and reading sizes use Tavern scale in live and isolated preview without changing configuration',()=>{
 const c={commonStyle:{text:{size:18},heading:{size:22}},pageStyle:{worldbook:{entryHeading:{size:20}}}};
 const before=structuredClone(c);
 for(const preview of [false,true]){
  const css=commonStyleRules(c,{preview})+pageStyleRules(c,{preview});
  for(const size of [18,20,22])assert.ok(css.includes(`font-size:calc(${size}px * var(--fontScale, 1))!important`));
  assert.ok(css.includes('--mainFontSize:calc(18px * var(--fontScale, 1))'));
  assert.ok(!css.includes('--fontScale:'));
 }
 assert.deepEqual(c,before);
});

test('input copy and preset group headings scale while icons and region geometry stay fixed',()=>{
 const c={font:'serif',chromeStyle:structuredClone(CHROME_DEFAULTS)};
 Object.assign(c.chromeStyle.input,{enabled:true,size:18});c.chromeStyle.input.emptyText.size=14;
 const css=chromeRules(c);
 for(const size of [18,14])assert.ok(css.includes(`font-size:calc(${size}px * var(--fontScale, 1))!important`));
 assert.ok(css.includes('width:36px;height:36px;font-size:22px'));
 assert.ok(css.includes('min-height:44px!important;max-height:min(320px,60vh)'));
 const style={panel:{border:'#cccccc'},heading:{size:21,color:'#123456',background:'#ffffff',weight:600},field:{background:'#ffffff'},text:{muted:'#777777',accent:'#123456'}};
 assert.ok(baiPresetRules('#presets',{promptList:true},style).includes('font-size:calc(21px * var(--fontScale, 1))!important'));
});
