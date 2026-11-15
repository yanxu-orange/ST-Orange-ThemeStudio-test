import {test} from 'node:test';import assert from 'node:assert/strict';
import {NATIVE_DEFAULTS,validateNativeStyle,nativeRules} from './native.mjs';
import {statValueStyle,nativeStatFontEntries} from './native-stat-style.mjs';
const style={size:9,color:'#998877',font:'serif',weight:400,fontLink:null};
test('old stats preserve public style, prefixes and every independent position',()=>{
 const original=structuredClone(NATIVE_DEFAULTS);original.stats.size=17;original.stats.floor.prefix='第 ';original.stats.floor.suffix=' 期';original.stats.time.x=32;
 const normalized=validateNativeStyle(original);assert.deepEqual(normalized,original);assert.equal(statValueStyle(normalized.stats,'time').size,17);assert.equal(normalized.stats.time.x,32);assert.equal(normalized.stats.time.label,undefined);
});
test('independent value and label styles validate 9px, reject invalid data and roundtrip',()=>{
 const raw=structuredClone(NATIVE_DEFAULTS);raw.stats.tokens.valueStyle={...style,size:11};raw.stats.tokens.label={text:'本期篇幅',style:{...style},gap:8};
 const normalized=validateNativeStyle(raw);assert.deepEqual(validateNativeStyle(JSON.parse(JSON.stringify(normalized))),normalized);assert.equal(statValueStyle(normalized.stats,'floor').size,11);
 for(const invalid of [{...style,size:7},{...style,size:29},{...style,weight:'400'},{...style,font:'serif;position:fixed'},{...style,fontLink:{url:'javascript:alert(1)'}}])assert.throws(()=>validateNativeStyle({...raw,stats:{...raw.stats,tokens:{...raw.stats.tokens,valueStyle:invalid}}}));
 assert.throws(()=>validateNativeStyle({...raw,stats:{...raw.stats,tokens:{...raw.stats.tokens,label:{text:'a\nb',style:null,gap:8}}}}));
 const config={nativeStyle:normalized,timeColor:'#112233',accent:'#000000',font:'serif'};const css=nativeRules('.mes',config);assert.match(css,/font-size:9px/);assert.match(css,/data-otl-stat-value=true/);assert.match(css,/content:attr\(data-otl-stat-label\)/);assert.match(css,/margin-right:8px/);assert.deepEqual(Object.keys(nativeStatFontEntries(config)),['native-tokens-value','native-tokens-label']);
 raw.stats.floor.prefix='第 ';raw.stats.floor.valueStyle={...style,size:20};assert.match(nativeRules('.mes',{...config,nativeStyle:validateNativeStyle(raw)}),/floor-custom=true\]\{font-size:0!important/);
});
