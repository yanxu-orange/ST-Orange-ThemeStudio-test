import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseHTML} from 'linkedom';
import {installWorkshopEventBoundary} from './workshop-events.mjs';

function fixture() {
  // A host descendant models the bubbling leg after shadow event retargeting.
  // linkedom does not implement composed bubbling across a shadow boundary.
  const {document,window} = parseHTML('<html><body><div id="workshop"><input><button>Edit</button></div><button id="native">Native</button></body></html>');
  const host = document.querySelector('#workshop');
  const dispose = installWorkshopEventBoundary(host);
  const press = (target,type) => {
    const event = new window.Event(type,{bubbles:true,cancelable:true,composed:true});
    target.dispatchEvent(event);
    return event;
  };
  return {document,host,dispose,press};
}

test('workshop presses leave native drawers open without cancelling control defaults', () => {
  const {document,host,press} = fixture();
  for (const type of ['mousedown','touchstart']) {
    let drawerOpen = true, local = 0;
    document.documentElement.addEventListener(type,()=>drawerOpen=false);
    host.querySelector('input').addEventListener(type,()=>local++);
    for (let i=0;i<3;i++) {
      const event = press(host.querySelector('input'),type);
      assert.equal(drawerOpen,true);
      assert.equal(event.defaultPrevented,false);
    }
    assert.equal(local,3);
    press(document.querySelector('#native'),type);
    assert.equal(drawerOpen,false,'native outside presses still close drawers');
  }
});

test('pointer drags, scrolling, clicks and typing still reach normal listeners', () => {
  const {document,host,press} = fixture();
  for (const type of ['pointerdown','pointermove','pointerup','pointercancel','wheel','touchmove','touchend','click','input','change','keydown']) {
    let seen = 0;
    document.addEventListener(type,()=>seen++);
    const event = press(host.querySelector('input'),type);
    assert.equal(seen,1,type);
    assert.equal(event.defaultPrevented,false,type);
  }
});

test('boundary is local to the host and can be removed', () => {
  const {document,host,dispose,press} = fixture();
  let seen = 0;
  document.documentElement.addEventListener('mousedown',()=>seen++);
  press(host,'mousedown');
  assert.equal(seen,0,'retargeted host press stays inside workshop');
  dispose();
  press(host,'mousedown');
  assert.equal(seen,1);
});

test('editor installs the boundary and keeps explanatory copy without defensive disclaimers', () => {
  const source = readFileSync(new URL('./index.js',import.meta.url),'utf8');
  assert.match(source,/installWorkshopEventBoundary\(host\)/);
  for (const text of ['只调整原生用户设置页','只调整原生世界书','不拦截按钮、输入或滚动','内容由酒馆提供','这里不执行按钮业务','只换图形，保留原抽屉']) assert.equal(source.includes(text),false,text);
  assert.ok(source.includes('最大高度需不小于最小高度，且不超过当前可视区域高度的60%。'));
  assert.ok(source.includes('字体链接须允许跨域'));
});
