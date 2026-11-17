import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSchemeModel } from './scheme-model.mjs';
import { avatarCombinationScheme } from './default-layout.mjs';
import { captureCombination, applyCombination } from './region-combinations.mjs';
const { templates, validate } = createSchemeModel();
test('default puts metadata in header and every native control in footer', () => {
 const c = templates.blank;
 assert.equal(c.metadata.unified.time, null);
 for (const v of [c.nativeStyle.actions.edit,c.nativeStyle.actions.more,c.nativeStyle.stats.floor,c.nativeStyle.stats.time,c.nativeStyle.stats.tokens,c.nativeStyle.swipe]) assert.equal(v.position,'footer');
 assert.equal(c.nativeStyle.swipe.left.text,'上一版');
 assert.equal(c.nativeStyle.swipe.right.text,'下一版');
 assert.equal(c.footerCaptions.length,0);
 assert.equal(c.nativeStyle.swipe.hideHistory,false);
 assert.deepEqual(validate(c),c);
});
test('both header combinations preserve user images, body and footer', () => {
 for (const variant of ['flat','rectangle']) {
  const source=structuredClone(templates.spring);
  source.photos.ai.image='https://example.com/my-avatar.png';
  source.fontSize=23;
  const combination=captureCombination(validate(avatarCombinationScheme(templates.blank,variant)),'header');
  const result=validate(applyCombination(source,combination,undefined,{moveNative:true}));
  assert.equal(result.photos.ai.image,source.photos.ai.image);
  assert.equal(result.fontSize,23);
  assert.deepEqual(result.footerCaptions,source.footerCaptions);
  assert.deepEqual(result.nativeStyle.swipe,source.nativeStyle.swipe);
  assert.equal(result.photos.ai.widthUnit,'percent');
  assert.equal(result.photos.ai.radius,0);
  assert.equal(result.avatarFill.ai.enabled,false);
  assert.deepEqual(validate(result),result);
 }
});

test('header presets contain no body or footer native settings', () => {
 for (const variant of ['flat','rectangle']) {
  const combo=captureCombination(validate(avatarCombinationScheme(templates.blank,variant)),'header');
  assert.equal(combo.settings.fontSize,undefined);
  assert.equal(combo.native?.swipe,null);
 }
});

test('390px host geometry keeps the footer in two rows without overlapping controls', async () => {
 const { parseHTML } = await import('linkedom');
 const { renderNative } = await import('./native.mjs');
 const {document,window}=parseHTML('<html><body><div class="mes" is_user="false"><div class="mesAvatarWrapper"><div class="mesIDDisplay">#2</div><div class="mes_timer">8.6s</div><div class="tokenCounterDisplay">1248</div></div><div class="swipe_left"></div><div class="mes_block"><div class="ch_name"><div class="mes_buttons"><span class="extraMesButtonsHint">更多</span><div class="extraMesButtons"></div><div class="mes_edit">编辑</div></div><div class="mes_edit_buttons" style="display:none">取消</div></div><div class="mes_text">正文</div></div><div class="swipeRightBlock"><div class="swipe_right">下一版</div><div class="swipes-counter">1/3</div></div></div></body></html>');
 const msg=document.querySelector('.mes'),rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
 msg.getBoundingClientRect=()=>rect(10,0,370,600);
 msg.querySelector('.ch_name').getBoundingClientRect=()=>rect(10,16,370,150);
 msg.querySelector('.mesAvatarWrapper').getBoundingClientRect=()=>rect(26,16,88,117);
 window.getComputedStyle=n=>({display:n.style.display||'flex',visibility:'visible'});
 const dims={mes_buttons:[56,18],extraMesButtonsHint:[25,18],mes_edit:[25,18],mes_edit_buttons:[60,18],mesIDDisplay:[24,16],mes_timer:[58,16],tokenCounterDisplay:[65,16],swipe_left:[36,18],swipeRightBlock:[66,18],swipe_right:[36,18],'swipes-counter':[24,18]};
 for(const [cls,d]of Object.entries(dims))msg.querySelector('.'+cls).getBoundingClientRect=()=>rect(0,0,...d);
 renderNative(msg,templates.blank,{latest:true,createNode:(tag,cls,parent)=>{
  const n=document.createElement(tag);n.className=cls;parent.append(n);
  n.getBoundingClientRect=()=>rect(26,450,338,parseFloat(msg.style.getPropertyValue('--on-footer-height'))||0);return n;
 }});
 const value=k=>parseFloat(msg.style.getPropertyValue('--on-'+k));
 assert.ok(value('edit-x')>=26);
 assert.ok(value('edit-x')+25<10+value('actions-x'));
 assert.ok(10+value('actions-x')+25<10+value('swipe-left-x'));
 assert.ok(10+value('swipe-right-x')+66<=364);
 assert.equal(value('stat-0-y'),value('stat-1-y'));
 assert.equal(value('stat-1-y'),value('stat-2-y'));
 assert.equal(value('swipe-left-y'),482);
 assert.equal(value('edit-y'),482);
 assert.equal(value('footer-height'),58);
});
