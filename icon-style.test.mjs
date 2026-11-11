import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {ICONS,iconUrl} from './icon-catalog.mjs';
import {ICON_STYLE_DEFAULTS,validateIconStyle,iconStyle,iconFill,styleIconElement} from './icon-style.mjs';
import {validateChromeSource,chromeSourceUrl} from './chrome.mjs';
import {NATIVE_DEFAULTS,validateNativeStyle,effectiveNativeMode,nativeIconUrl} from './native.mjs';
const id=()=>Object.keys(ICONS)[0],data='data:image/png;base64,AAAA';
test('shared icon fields are optional, validated strictly and builtins default to tint',()=>{
 assert.deepEqual(validateIconStyle({}),{});assert.equal(iconStyle({icon:id()}).tint,true);assert.equal(iconStyle({image:data}).tint,false);assert.equal(iconStyle({icon:id(),tint:false}).tint,false);
 for(const bad of [{icon:'missing'},{icon:'toString'},{icon:null},{tint:1},{fillMode:'radial'},{color:'red'},{color2:'#fff'},{gradientAngle:361},{gradientAngle:NaN},{size:11},{size:41},{size:Infinity}])assert.throws(()=>validateIconStyle(bad));
 for(const size of [0,12,40])assert.equal(validateIconStyle({size}).size,size);
 assert.equal(iconFill({color:'#123456'}),'#123456');assert.equal(iconFill({fillMode:'gradient',color:'#123456',color2:'#abcdef',gradientAngle:270}),'linear-gradient(270deg,#123456,#abcdef)');
});
test('chrome and native support builtin and uploaded icon sources without changing legacy schemas',()=>{
 const old={mode:'native',asset:'',image:''};assert.deepEqual(validateChromeSource(old),old);
 const builtin={...old,...ICON_STYLE_DEFAULTS,mode:'icon',icon:id(),tint:true};assert.deepEqual(validateChromeSource(builtin),builtin);assert.equal(chromeSourceUrl(builtin),iconUrl(id()));
 assert.equal(chromeSourceUrl({...old,mode:'icon',image:data}),data);assert.equal(chromeSourceUrl({...old,mode:'icon'}),'');
 const n=structuredClone(NATIVE_DEFAULTS);assert.deepEqual(validateNativeStyle(n),n);Object.assign(n.actions.more,{mode:'icon',icon:id(),tint:true,fillMode:'gradient',color:'#123456',color2:'#abcdef',gradientAngle:360,size:0});assert.deepEqual(validateNativeStyle(n),n);assert.equal(effectiveNativeMode(n.actions.more),'icon');assert.equal(nativeIconUrl(n.actions.more),iconUrl(id()));
 n.actions.more.icon='';n.actions.more.source={kind:'custom',asset:'',image:data};assert.equal(nativeIconUrl(n.actions.more),data);assert.equal(effectiveNativeMode(n.actions.more),'icon');assert.deepEqual(validateNativeStyle(n),n);
 n.actions.more.color='url(javascript:bad)';assert.throws(()=>validateNativeStyle(n));
});
test('one helper switches exact alpha-mask colors, gradient, original pixels and dimensions in place',()=>{
 const {document}=parseHTML('<html><body><span><img></span></body></html>'),wrapper=document.querySelector('span'),image=wrapper.querySelector('img');
 styleIconElement(wrapper,image,data,{tint:true,fillMode:'gradient',color:'#123456',color2:'#abcdef',gradientAngle:135,size:32},22);
 assert.equal(wrapper.style.background,'linear-gradient(135deg,#123456,#abcdef)');assert.equal(wrapper.style.maskImage,`url("${data}")`);assert.equal(wrapper.style.maskMode,'alpha');assert.equal(wrapper.style.webkitMaskImage,wrapper.style.maskImage);assert.equal(image.style.opacity,'0');assert.equal(wrapper.style.width,'32px');assert.equal(wrapper.getAttribute('aria-hidden'),'true');
 styleIconElement(wrapper,image,data,{tint:false,size:0},28);assert.equal(wrapper.style.maskImage,'');assert.equal(wrapper.style.webkitMaskImage,'');assert.equal(wrapper.style.background,'transparent');assert.equal(image.style.opacity,'1');assert.equal(wrapper.style.width,'28px');assert.equal(wrapper.style.filter,'');
});

test('every catalog id resolves consistently for chrome and native, with explicit builtin precedence',()=>{
 for(const icon of Object.keys(ICONS)){
  const source={mode:'icon',asset:'',image:'',icon};assert.equal(chromeSourceUrl(validateChromeSource(source)),iconUrl(icon));
  const native=structuredClone(NATIVE_DEFAULTS);Object.assign(native.actions.more,{mode:'icon',icon});assert.equal(effectiveNativeMode(validateNativeStyle(native).actions.more),'icon');assert.equal(nativeIconUrl(native.actions.more),iconUrl(icon));
  assert.equal(chromeSourceUrl({...source,image:data}),iconUrl(icon));assert.equal(nativeIconUrl({...native.actions.more,source:{kind:'custom',asset:'',image:data}}),iconUrl(icon));
  assert.equal(chromeSourceUrl({...source,mode:'image',image:data}),data);
 }
});
