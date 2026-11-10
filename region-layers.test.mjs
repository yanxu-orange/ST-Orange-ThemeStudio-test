import {test} from 'node:test';
import {parseHTML} from 'linkedom';
import assert from 'node:assert/strict';
import {newCaption,validateCaptions,captionMatchesScope,visibleCaptions,normalizeCaptionConfig} from './captions.mjs';
import {newFooterCaption,validateFooterCaptions,visibleFooterCaptions,renderFooter,footerRules,footerBaseHeight} from './footer.mjs';
import {sceneTextRules} from './text-scene.mjs';
import {newLayer} from './layers.mjs';
import {validateTextItems} from './text-layout.mjs';
import {ORDER_REGIONS,imageKey,regionForImage,regionOrder,regionEntries,regionZ,syncRegionOrder,moveRegionItem,canMoveRegionItem,validateRegionOrder} from './region-layers.mjs';
const config=()=>({textItems:validateTextItems(),captions:[newCaption({id:'one',name:'第一句'}),newCaption({id:'two',scope:'user'})],footerCaptions:[newFooterCaption({id:'one'})],layers:[newLayer('star',{id:'front',anchor:'header'}),newLayer('tape',{id:'photo',anchor:'avatar'}),newLayer('leaf',{id:'footer',anchor:'footer'}),newLayer('flower',{id:'overall',anchor:'message'}),newLayer('star',{id:'entry',anchor:'reasoning-entry'}),newLayer('star',{id:'body',anchor:'reasoning-body'}),newLayer('star',{id:'input',anchor:'input'})]});
test('a regional stack contains each local native text, caption and image exactly once',()=>{
 const c=config(),before=structuredClone(c),next=syncRegionOrder(c);
 assert.deepEqual(c,before);assert.deepEqual(Object.keys(next.regionOrder),ORDER_REGIONS);
 assert.deepEqual(regionOrder(next,'header'),['avatar','name','time','caption:one','caption:two','image:front','image:photo']);
 assert.deepEqual(regionOrder(next,'footer'),['footer:one','image:footer']);
 assert.deepEqual(regionOrder(next,'overall'),['image:overall']);
 assert.deepEqual(regionOrder(next,'reasoning'),['image:entry','image:body']);
 assert.deepEqual(regionOrder(next,'input'),['image:input']);
 assert.equal(regionForImage(c.layers[1]),'header');assert.equal(imageKey('front'),'image:front');
 const entries=regionEntries(next,'header');assert.deepEqual(entries.map(v=>v.key),regionOrder(next,'header'));
 assert.equal(entries[3].label,'第一句');assert.equal(entries[3].id,'caption:one');assert.equal(entries[4].scope,'user');assert.equal(entries[6].id,'photo');assert.equal(entries[6].kind,'image');
 assert.deepEqual(validateRegionOrder(JSON.parse(JSON.stringify(next.regionOrder)),next),next.regionOrder);
});
test('up/down swap neighbors while top/bottom relocate without duplicate ranks or coordinate changes',()=>{
 const original=syncRegionOrder(config()),before=structuredClone(original),key='caption:one',order=regionOrder(original,'header');
 let c=moveRegionItem(original,'header',key,'up');assert.deepEqual(regionOrder(c,'header'),['avatar','name','time','caption:two',key,'image:front','image:photo']);
 c=moveRegionItem(c,'header',key,'down');assert.deepEqual(regionOrder(c,'header'),order);
 c=moveRegionItem(c,'header',key,'top');assert.equal(regionOrder(c,'header').at(-1),key);assert.equal(canMoveRegionItem(c,'header',key,'up'),false);assert.equal(canMoveRegionItem(c,'header',key,'top'),false);
 c=moveRegionItem(c,'header',key,'bottom');assert.equal(regionOrder(c,'header')[0],key);assert.equal(canMoveRegionItem(c,'header',key,'down'),false);assert.equal(canMoveRegionItem(c,'header',key,'bottom'),false);
 assert.deepEqual(moveRegionItem(c,'header',key,'down'),c);assert.deepEqual(moveRegionItem(c,'header',key,'bottom'),c);
 assert.deepEqual(original,before);assert.deepEqual(c.layers,original.layers);assert.deepEqual(c.captions,original.captions);assert.deepEqual(c.textItems,original.textItems);
 assert.notEqual(c.regionOrder.footer,original.regionOrder.footer);assert.deepEqual(c.regionOrder.footer,original.regionOrder.footer);
 assert.deepEqual(regionOrder(c,'header').map(key=>regionZ(c,'header',key)),[1,2,3,4,5,6,7]);
 for(let i=0;i<100;i++){c=moveRegionItem(c,'header',order[i%order.length],['up','down','top','bottom'][i%4]);assert.equal(new Set(regionOrder(c,'header')).size,order.length);}
 assert.throws(()=>moveRegionItem(c,'header','missing','up'));assert.throws(()=>moveRegionItem(c,'header',key,'sideways'));assert.throws(()=>regionZ(c,'header','missing'));assert.throws(()=>regionOrder(c,'unknown'));
});
test('add/remove/reanchor reconcile only affected membership and never reuse stale or duplicate ranks',()=>{
 let c=moveRegionItem(syncRegionOrder(config()),'header','image:photo','bottom');const first=regionOrder(c,'header');
 c.layers.push(newLayer('star',{id:'added',anchor:'header',z:0}));assert.equal(regionOrder(c,'header').at(-1),'image:added');
 c.layers.find(v=>v.id==='photo').anchor='footer';c.captions=c.captions.filter(v=>v.id!=='one');
 c=syncRegionOrder(c);assert.deepEqual(regionOrder(c,'header'),first.filter(v=>!['image:photo','caption:one'].includes(v)).concat('image:added'));assert.equal(regionOrder(c,'footer').at(-1),'image:photo');
 const expected=regionOrder(c,'header');c.layers.forEach(v=>v.z=20);c.captions.forEach(v=>v.z=0);c.textItems.name.z=21;assert.deepEqual(regionOrder(c,'header'),expected);
 c.regionOrder.header.push('image:added','missing');assert.deepEqual(regionOrder(c,'header'),expected);
});
test('saved ordering rejects omissions, duplicates, foreign IDs and extra regions',()=>{
 const c=syncRegionOrder(config()),raw=c.regionOrder;
 for(const invalid of [undefined,null,[],{}, {...raw,other:[]},{...raw,header:raw.header.slice(1)},{...raw,header:raw.header.map((v,i)=>i===1?'avatar':v)},{...raw,header:raw.header.map((v,i)=>i===1?'image:footer':v)},{...raw,header:raw.header.map((v,i)=>i===1?null:v)}])assert.throws(()=>validateRegionOrder(invalid,c));
 const checked=validateRegionOrder(raw,c);checked.header.reverse();assert.notDeepEqual(checked.header,raw.header);
});
test('caption scope is explicit, validated and preserved for header and footer serialization',()=>{
 for(const scope of ['both','ai','user']){
  const cap=newCaption({id:scope,scope}),checked=validateCaptions(JSON.parse(JSON.stringify([cap])))[0];assert.equal(checked.scope,scope);
  const footer=newFooterCaption({id:scope,scope});assert.equal(validateFooterCaptions(JSON.parse(JSON.stringify([footer])))[0].scope,scope);
  const c=normalizeCaptionConfig({version:4,captions:[cap]});assert.equal(normalizeCaptionConfig(JSON.parse(JSON.stringify(c))).captions[0].scope,scope);
  assert.equal(captionMatchesScope(cap,false),scope!=='user');assert.equal(captionMatchesScope(cap,true),scope!=='ai');
 }
 assert.equal(newCaption().scope,'both');assert.equal(newFooterCaption().scope,'both');
 for(const scope of [undefined,null,'all','AI',true,0,[]])assert.throws(()=>validateCaptions([newCaption({scope})]));
 const c={captions:[newCaption({id:'both'}),newCaption({id:'ai',scope:'ai'}),newCaption({id:'user',scope:'user'}),newCaption({id:'hidden',visible:false}),newCaption({id:'empty',content:'  \n'})]};
 assert.deepEqual(visibleCaptions(c,false).map(v=>v.id),['both','ai']);assert.deepEqual(visibleCaptions(c,true).map(v=>v.id),['both','user']);
});

test('header and footer render ranks share the stored order and role-scoped captions reconcile cleanly',()=>{
 const {document}=parseHTML('<html><head></head><body><div class="mes" is_user="false"><div class="mes_block"></div></div></body></html>'),msg=document.querySelector('.mes');
 let c=config();c.footerCaptions=[newFooterCaption({id:'both'}),newFooterCaption({id:'ai',scope:'ai'}),newFooterCaption({id:'user',scope:'user'})];c=syncRegionOrder(c);
 c=moveRegionItem(c,'header','caption:one','top');c=moveRegionItem(c,'footer','image:footer','bottom');
 const css=sceneTextRules(c,{'caption:one':'.caption-one',name:'.name'}),style=document.createElement('style');style.textContent=css+'\n'+footerRules('.mes',c);document.head.append(style);
 const rules=[...style.sheet.cssRules];assert.equal(rules.find(r=>r.selectorText==='.caption-one').style.getPropertyValue('z-index'),String(regionZ(c,'header','caption:one')));
 const rankRule=rules.filter(r=>r.selectorText?.includes('[data-footer-caption-id="ai"]')).at(-1);assert.equal(rankRule.style.getPropertyValue('z-index'),String(regionZ(c,'footer','footer:ai')));
 assert.deepEqual(visibleFooterCaptions(c,false).map(v=>v.id),['both','ai']);assert.deepEqual(visibleFooterCaptions(c,true).map(v=>v.id),['both','user']);
 let root=renderFooter(msg,c,{resolveArtwork:()=> 'data:image/png;base64,AAAA'});const ids=()=>[...root.querySelectorAll('.otl-footer-caption')].map(v=>v.dataset.footerCaptionId);
 assert.deepEqual(ids(),['both','ai']);assert.equal(root.querySelector('.otl-footer-image').style.zIndex,regionZ(c,'footer','image:footer'));
 msg.setAttribute('is_user','true');renderFooter(msg,c,{resolveArtwork:()=> 'data:image/png;base64,AAAA'});assert.deepEqual(ids(),['both','user']);
 c.footerCaptions.forEach(v=>v.scope='ai');c.layers=[];assert.equal(renderFooter(msg,c,{resolveArtwork:()=>''}),null);assert.equal(msg.querySelector('.otl-footer'),null);
});
test('footer shape dimensions and stable percent height do not depend on intrinsic SVG ratio',()=>{
 const {document}=parseHTML('<html><body><div class="mes" is_user="false"><div class="mes_block"></div></div></body></html>'),msg=document.querySelector('.mes');
 const shape=newLayer('shape',{id:'shape',anchor:'footer',width:80,height:30,heightUnit:'px'}),c={...config(),footerCaptions:[],layers:[shape]};
 const root=renderFooter(msg,c,{resolveArtwork:()=> 'data:image/svg+xml,shape'}),node=root.querySelector('img');
 assert.equal(node.style.width,'80px');assert.equal(node.style.height,'30px');assert.equal(node.style.objectFit,'fill');assert.equal(footerBaseHeight(0,200,[shape],[node]),30);
 shape.heightUnit='percent';shape.height=50;shape.widthUnit='percent';renderFooter(msg,c,{resolveArtwork:()=> 'data:image/svg+xml,shape'});
 assert.equal(node.style.height,'50%');assert.equal(footerBaseHeight(0,200,[shape],[node]),160);
});
