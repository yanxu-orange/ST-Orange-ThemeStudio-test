import {test} from 'node:test';import assert from 'node:assert/strict';
import {parseSwipeCounter,SWIPE_COUNTER_DEFAULTS,swipeExtraRules} from './native-swipe-style.mjs';
import {validateNativeStyle,NATIVE_DEFAULTS} from './native.mjs';
test('swipe parsing tolerates native zero-width separators without guessing malformed counters',()=>{
 for(const [s,current,total]of [['1\u200b/\u200b1',1,1],['2/3',2,3],['100/120',100,120]])assert.deepEqual(parseSwipeCounter(s),{current,total});
 for(const s of ['', '?/?','2/?','0/3','4/3','1.5/3','garbage 1/2','1/2x'])assert.equal(parseSwipeCounter(s),null);
});
test('default swipe settings remain unchanged and custom settings reject invalid configurations',()=>{
 const defaults=structuredClone(NATIVE_DEFAULTS);assert.deepEqual(validateNativeStyle(defaults),defaults);
 const v=structuredClone(defaults);v.swipe.counter=structuredClone(SWIPE_COUNTER_DEFAULTS);assert.deepEqual(validateNativeStyle(v),v);
 for(const change of [{x:101},{y:161},{anchor:'around'},{mode:'all'},{pad:'yes'},{hideSingle:1},{extra:true}]){const bad=structuredClone(v);Object.assign(bad.swipe.counter,change);assert.throws(()=>validateNativeStyle(bad));}
 const c={nativeStyle:v,accent:'#ff0000',timeColor:'#000000'};v.swipe.counter={...SWIPE_COUNTER_DEFAULTS,position:'footer',mode:'current',pad:true};const css=swipeExtraRules('.mes',c);assert.match(css,/var\(--on-counter-x/);assert.match(css,/content:attr\(data-otl-counter-text\)/);assert.doesNotMatch(css,/visibility:visible|opacity:1|pointer-events:auto/);
});

test('custom arrow labels keep native source text at zero size',()=>{const s=structuredClone(NATIVE_DEFAULTS);s.swipe.left.valueStyle={size:10,color:'auto',font:'auto',weight:'auto',fontLink:null};s.swipe.left.mode='text';const css=swipeExtraRules('.mes',{nativeStyle:s,accent:'#ff0000'});assert.match(css,/\.swipe_left\[data-otl-native-mode=text\]\{font-size:0!important;/);assert.match(css,/\.swipe_left > \.otl-native-label\{font-size:10px/);});
