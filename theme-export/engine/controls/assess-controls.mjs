import {visualActions} from './action-display.mjs';
import {assessReading} from './assess-reading.mjs';
import {assessAuthoredActions} from './assess-authored-actions.mjs';
import {assessRightFooterActions,usesRightFooterActions} from './right-footer-actions.mjs';
import {NATIVE_DEFAULTS,validateNativeStyle,effectiveNativeMode,resolveNativeActions} from '../../../native.mjs';
import {resolveNativeStats} from '../../../native-stat-style.mjs';
const eq=(a,b)=>a===b||!!a&&!!b&&typeof a==='object'&&typeof b==='object'&&Object.keys(a).length===Object.keys(b).length&&Object.keys(a).every(k=>Object.hasOwn(b,k)&&eq(a[k],b[k]));
function actionPaint(a){return {size:a.size,color:a.color,...Object.fromEntries(['edit','more'].map(k=>{const v=a[k],mode=effectiveNativeMode(v);return[k,{position:v.position,anchor:v.anchor,x:v.x,y:v.y,mode,...(mode==='text'?{text:v.text}:mode==='image'?{source:v.source,imageSize:v.imageSize}:mode==='icon'?Object.fromEntries(['icon','tint','fillMode','color','color2','gradientAngle','size','imageSize','source'].map(key=>[key,v[key]])): {})}];}))};}
function statPaint(s){return {size:s.size,color:s.color,...Object.fromEntries(['floor','time','tokens'].map(k=>{const v=s[k];return[k,{position:v.position,anchor:v.anchor||'default',x:v.x,y:v.y,...(k==='floor'?{prefix:v.prefix,suffix:v.suffix}:{}),valueStyle:{size:s.size,color:s.color,font:'auto',weight:'auto',fontLink:null,...v.valueStyle},label:v.label?.text?v.label:null}];}))};}
function swipePaint(s){return {...s,hideHistoryControls:!!s.hideHistoryControls,counter:s.counter||null,left:{...s.left,valueStyle:s.left.valueStyle||null},right:{...s.right,valueStyle:s.right.valueStyle||null}};}
const defaults=validateNativeStyle(structuredClone(NATIVE_DEFAULTS));
export function assessControls(c){
 const ns=c.nativeStyle,diagnostics=[],fields=[];
 const defaultPaint=['ai','user'].every(role=>eq(actionPaint(resolveNativeActions(ns.actions,role==='user')),actionPaint(defaults.actions))&&eq(statPaint(resolveNativeStats(ns.stats,role==='user')),statPaint(defaults.stats)))&&eq(swipePaint(ns.swipe),swipePaint(defaults.swipe));
 if(defaultPaint)return {mode:'native-default',diagnostics,fieldCoverage:[{field:'nativeStyle',owner:'native-default',status:'preserved',reason:'Effective default appearance remains native; no footer controls grid'}]};
 if(ns.swipe.layout==='compact'){
  if(ns.actions.edit.position!==ns.actions.more.position)return assessAuthoredActions(c);
  if(usesRightFooterActions(ns.actions))return assessRightFooterActions(c);
  return assessReading(c,{allowModes:visualActions(ns.actions)});
 }
 const reject=(field,reason)=>diagnostics.push({severity:'error',code:'NATIVE_CONTROLS_UNSUPPORTED',field,reason});
 const fixed=(field,value,expected)=>{fields.push({field,owner:'finite-native-controls',status:value===expected?'consumed':'unsupported'});if(value!==expected)reject(field,`Finite native controls require ${JSON.stringify(expected)} at this field`);};
 if(c.font!=='serif')reject('font','Finite native controls currently require the verified serif label family');if(c.cardPadding>24)reject('cardPadding','Finite controls require padding<=24 with client width>=320');
 for(const group of ['actions','stats'])if(ns[group].design==='separate')reject('nativeStyle.'+group+'.design','Role-specific native controls are not implemented');
 fixed('nativeStyle.actions.size',ns.actions.size,12);fixed('nativeStyle.stats.size',ns.stats.size,11);
 for(const [key,x,text]of [['edit',60,'编辑'],['more',85,'更多']])for(const [field,value]of Object.entries({position:'footer',anchor:'top',x,y:20,mode:'text',text}))fixed(`nativeStyle.actions.${key}.${field}`,ns.actions[key][field],value);
 for(const [key,x]of [['floor',0],['time',47.5],['tokens',23]]){
  const v=ns.stats[key];for(const [field,value]of Object.entries({position:'footer',x,y:24}))fixed(`nativeStyle.stats.${key}.${field}`,v[field],value);
  if(v.anchor&&v.anchor!=='default')reject(`nativeStyle.stats.${key}.anchor`,'Only default stat anchors are implemented');if(v.valueStyle!=null||v.label!=null)reject(`nativeStyle.stats.${key}`,'Additional stat value/label styles are not implemented');
 }
 fixed('nativeStyle.stats.floor.prefix',ns.stats.floor.prefix,'第 ');fixed('nativeStyle.stats.floor.suffix',ns.stats.floor.suffix,' 封');
 for(const [field,value]of Object.entries({size:12,gap:6,x:0,y:58,position:'footer',layout:'ends',hideHistory:true,hideLatest:false}))fixed('nativeStyle.swipe.'+field,ns.swipe[field],value);
 for(const [key,text]of [['left','上一封'],['right','下一封']]){fixed(`nativeStyle.swipe.${key}.mode`,ns.swipe[key].mode,'text');fixed(`nativeStyle.swipe.${key}.text`,ns.swipe[key].text,text);if(ns.swipe[key].valueStyle!=null)reject(`nativeStyle.swipe.${key}.valueStyle`,'Custom swipe value styles are not implemented');}
 if(ns.swipe.counter!=null)reject('nativeStyle.swipe.counter','Advanced counter configuration is not implemented');if(ns.swipe.hideHistoryControls)reject('nativeStyle.swipe.hideHistoryControls','Hiding historical controls as a custom configuration is not implemented');
 for(const group of ['actions','stats','swipe'])fields.push({field:'nativeStyle.'+group+'.color',owner:'finite-native-controls',status:'consumed',reason:'Schema-validated auto/HEX color is rendered from original configuration'});
 fields.push({field:'nativeStyle.actions.*.imageSize/source/iconStyle',owner:'finite-native-controls',status:'inactive',reason:'Native text mode leaves image/icon-only fields inactive; resources preserve source mapping without loading inactive images'});
 for(const d of diagnostics)if(d.field.startsWith('nativeStyle')&&!fields.some(f=>f.field===d.field))fields.push({field:d.field,owner:'finite-native-controls',status:'unsupported',reason:d.reason});
 return {mode:diagnostics.length?'unsupported':'finite-footer',diagnostics,fieldCoverage:fields};
}
