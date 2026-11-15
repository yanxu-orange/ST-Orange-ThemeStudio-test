import {test} from 'node:test';import assert from 'node:assert/strict';
import {NATIVE_DEFAULTS,validateNativeStyle,nativeRules} from './native.mjs';
import {resolveNativeStats,nativeStatFontEntries} from './native-stat-style.mjs';
const style=size=>({size,color:'#112233',font:'serif',weight:400,fontLink:null});
const separate=()=>{const s=structuredClone(NATIVE_DEFAULTS),items=Object.fromEntries(['floor','time','tokens'].map(k=>[k,structuredClone(s.stats[k])]));s.stats.design='separate';s.stats.roles={ai:structuredClone(items),user:structuredClone(items)};return s;};
test('role selections retain unified and both role designs and validate anchors',()=>{
 const s=separate();s.stats.roles.ai.floor.prefix='第';s.stats.roles.user.floor.suffix='号';s.stats.roles.user.floor.position='footer';s.stats.roles.user.time.anchor='right';const valid=validateNativeStyle(s);assert.equal(resolveNativeStats(valid.stats,false).floor.prefix,'第');assert.equal(resolveNativeStats(valid.stats,true).floor.suffix,'号');
 valid.stats.design='unified';assert.equal(resolveNativeStats(valid.stats,true).floor.prefix,'#');valid.stats.design='separate';assert.equal(resolveNativeStats(valid.stats,true).floor.suffix,'号');assert.deepEqual(validateNativeStyle(JSON.parse(JSON.stringify(valid))),valid);
 for(const bad of ['around',null,3]){const t=separate();t.stats.roles.ai.time.anchor=bad;assert.throws(()=>validateNativeStyle(t));}const missing=separate();delete missing.stats.roles.user;assert.throws(()=>validateNativeStyle(missing));
});
test('scoped CSS and font sessions isolate AI and user values and labels',()=>{
 const s=separate();s.stats.roles.ai.floor.valueStyle=style(18);s.stats.roles.user.floor.valueStyle=style(9);s.stats.roles.user.tokens.label={text:'字数',style:style(9),gap:4};const c={nativeStyle:s,font:'serif',timeColor:'#222222',accent:'#ff0000'};const css=nativeRules('.mes',c);assert.match(css,/\.mes:not\(\[is_user="true"\]\).*stat-0.*font-size:18px/);assert.match(css,/\.mes\[is_user="true"\].*stat-0.*font-size:9px/);assert.deepEqual(Object.keys(nativeStatFontEntries(c)),['native-ai-floor-value','native-user-floor-value','native-user-tokens-label']);
});
