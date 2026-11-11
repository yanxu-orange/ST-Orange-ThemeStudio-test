import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {createWorkbenchState,workbenchMarkup} from './workbench-ui.mjs';
import {createChromePreview,CHROME_PREVIEW_BASE} from './chrome-preview.mjs';
import {CHROME_DEFAULTS,chromeRules,PREVIEW_CHROME_SELECTORS} from './chrome.mjs';

test('chat preview has no state selector or state data',()=>{
 const {document}=parseHTML(workbenchMarkup());
 assert.equal(document.querySelector('#preview-state'),null);
 assert.doesNotMatch(workbenchMarkup(),/普通示例|未连接示例|生成中示例|附件示例/);
 assert.equal(Object.hasOwn(createWorkbenchState(),'demoState'),false);
 assert.ok(document.querySelector('#narrow'));
});

test('ordinary chat preview survives updates and reopening without state placeholders or native changes',()=>{
 for(const width of [390,1200]){
  const {document,window}=parseHTML('<html><head></head><body><div id="sheld"><div id="chat"></div><div id="form_sheld"><textarea id="send_textarea">真实当前草稿</textarea><div id="send_but"></div><div id="mes_stop">停止</div><div class="qr--bar">真实快捷回复</div></div></div></body></html>');
  window.innerWidth=width;
  const native=document.querySelector('#form_sheld'),before=native.outerHTML;
  const ui=createWorkbenchState(),c={font:'serif',layers:[],chromeStyle:structuredClone(CHROME_DEFAULTS)};
  c.chromeStyle.topbar.enabled=true;
  const themeBefore=JSON.stringify(c),p=createChromePreview({document,ui});
  for(let opening=0;opening<2;opening++){
   for(let update=0;update<2;update++){
    p.update(c);
    assert.equal(document.querySelectorAll('.otl-page-topbar').length,1);
    assert.equal(document.querySelectorAll('.otl-page-input').length,1);
    assert.equal(document.querySelector('.otl-page-input').hidden,false);
    assert.deepEqual([...document.querySelectorAll('.otl-page-input [data-chrome-pick]')].map(n=>n.dataset.chromePick),['options_button','extensionsMenuButton','send_but']);
    assert.equal(document.querySelector('.otl-page-file,.otl-page-qr,[data-demo-disconnected]'),null);
    assert.equal(document.querySelector('.otl-page-textarea').placeholder,'虚构输入，不会发送消息');
    assert.equal(native.outerHTML,before);
    assert.equal(JSON.stringify(c),themeBefore);
   }
   p.close();
   assert.equal(document.querySelector('[data-oc-preview]'),null);
   assert.equal(native.outerHTML,before);
  }
  assert.doesNotMatch(CHROME_PREVIEW_BASE,/otl-page-file|otl-page-qr/);
  assert.doesNotMatch(chromeRules(c,PREVIEW_CHROME_SELECTORS,{},'sans-serif',true),/data-demo-disconnected/);
  assert.match(chromeRules(c),/redOverlayGlow/,'real connection indicators are unchanged');
 }
});
