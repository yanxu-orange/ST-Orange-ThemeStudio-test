import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseHTML } from 'linkedom';
import { CHROME_DEFAULTS, newTopbarIsland, normalizeChromeConfig } from './chrome.mjs';
import { createTopbarIsland, TOPBAR_ISLAND_POSITION_KEY, topbarIslandGeometry } from './topbar-island.mjs';

function fixture() {
  const { document, window } = parseHTML('<html data-orange-live><head></head><body><div id="top-bar"></div><div id="top-settings-holder"><div class="drawer"><button class="drawer-toggle">世界书</button><div class="drawer-content">世界书内容</div></div></div></body></html>');
  window.innerWidth = 360;
  window.innerHeight = 800;
  const store = new Map();
  window.localStorage = { getItem: key => store.get(key), setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) };
  Object.defineProperty(document.querySelector('#top-settings-holder'), 'clientWidth', { value:360 });
  const config = { version:9, chromeStyle:structuredClone(CHROME_DEFAULTS) };
  return { document, window, store, config, island:createTopbarIsland(document) };
}

test('legacy topbar stays portable and invalid island fields are rejected', () => {
  const { config } = fixture();
  assert.deepEqual(normalizeChromeConfig(config), config);
  const topbar = config.chromeStyle.topbar;
  topbar.layout = 'island';
  assert.deepEqual(normalizeChromeConfig(config).chromeStyle.topbar.island, newTopbarIsland());
  topbar.island = { ...newTopbarIsland(), icon:'spring-send', colorMode:'custom', color:'#a2b3c4', position:'bottom-left' };
  assert.deepEqual(normalizeChromeConfig(config), config);
  for (const bad of [{position:'center'},{color:'red'},{icon:'missing'},{x:50}]) {
    const next=structuredClone(config);
    Object.assign(next.chromeStyle.topbar.island,bad);
    assert.throws(()=>normalizeChromeConfig(next));
  }
});

test('island width leaves a side lane and chooses two rows at phone widths', () => {
  for (const width of [320,360,412,720,1000]) {
    const result=topbarIslandGeometry(width,CHROME_DEFAULTS.topbar);
    assert.equal(result.columns,width<520?5:9);
    assert.ok(result.width<=width-112+.001);
    assert.ok(result.height>=result.slot);
  }
});

test('layout owns only its added control, preserves native drawers and remembers drag independently', () => {
  const {document,window,store,config,island}=fixture(),root=document.documentElement;
  const topbar=config.chromeStyle.topbar;
  island.update(config);
  assert.equal(document.querySelector('[data-topbar-island-toggle]'),null);
  Object.assign(topbar,{enabled:true,layout:'island',island:{...newTopbarIsland(),colorMode:'custom',color:'#d9a1b5',icon:'spring-send'}});
  const native=document.querySelector('.drawer-toggle'),panel=document.querySelector('.drawer-content');
  native.addEventListener('click',()=>panel.classList.toggle('openDrawer'));
  island.update(config);
  const ball=document.querySelector('[data-topbar-island-toggle]');
  assert.equal(ball.getAttribute('aria-expanded'),'false');
  assert.equal(ball.style.backgroundColor,'#d9a1b5ff');
  assert.match(ball.querySelector('img').getAttribute('src'),/spring-send\.svg$/);
  ball.click();
  assert.ok(root.hasAttribute('data-oc-island-open'));
  native.click();
  ball.click();
  assert.ok(panel.classList.contains('openDrawer'));
  assert.equal(ball.textContent,'');
  assert.ok(ball.querySelector('img'));
  function pointer(target,type,x,y){
    const event=new window.Event(type,{bubbles:true,cancelable:true});
    Object.assign(event,{clientX:x,clientY:y,pointerId:1,button:0});
    target.dispatchEvent(event);
  }
  pointer(ball,'pointerdown',300,10);
  pointer(document,'pointermove',40,160);
  const draggedLeft=ball.style.left;
  island.sync();
  assert.equal(ball.style.left,draggedLeft);
  pointer(document,'pointerup',40,160);
  assert.equal(JSON.parse(store.get(TOPBAR_ISLAND_POSITION_KEY)).side,'left');
  assert.equal(ball.getAttribute('aria-expanded'),'false');
  island.stop();
  assert.ok(panel.classList.contains('openDrawer'));
  assert.equal(document.querySelector('[data-topbar-island-toggle]'),null);
  assert.equal(root.hasAttribute('data-oc-island'),false);
  assert.equal(root.style.getPropertyValue('--oc-island-width')||'','');
  island.update(config);
  const remounted=document.querySelector('[data-topbar-island-toggle]');
  assert.equal(remounted.style.left,'8px');
  island.resetPosition();
  assert.equal(store.has(TOPBAR_ISLAND_POSITION_KEY),false);
  assert.notEqual(remounted.style.left,'8px');
  island.stop();
});
