import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseHTML } from 'linkedom';
import { CHROME_DEFAULTS, newTopbarIsland, normalizeChromeConfig } from './chrome.mjs';
import { createTopbarIsland, TOPBAR_ISLAND_POSITION_KEY, topbarIslandGeometry,topbarIslandPlacement } from './topbar-island.mjs';

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

test('menu uses available space without reducing native click targets below44px', () => {
  for (const width of [60,120,200,260,412,720,1000]) {
    const result=topbarIslandGeometry(width,CHROME_DEFAULTS.topbar);
    assert.ok(result.columns>=1&&result.columns<=9);
    assert.ok(result.width<=width+.001);
    assert.ok(result.slot>=44);
    assert.ok(result.height>=result.slot);
  }
});

test('four corners and middle edges place the menu by the ball, with drawers inside safe bounds',()=>{
 for(const width of [320,360,1440])for(const left of [8,width-52])for(const top of [8,378,748]){
  const area={left:8,top:8,right:width-8,bottom:792},ball={left,top,width:44,height:44,area},g=topbarIslandPlacement(ball,CHROME_DEFAULTS.topbar);
  assert.ok(g.left>=area.left&&g.left+g.width<=area.right+.001);
  assert.ok(g.top>=area.top&&g.top+g.height<=area.bottom+.001);
  assert.ok(Math.abs((left===8?g.left-left-44:left-g.left-g.width)-8)<.001);
  assert.ok(g.drawerHeight>0);
  if(g.drawerBelow)assert.ok(g.drawerEdge+g.drawerHeight<=area.bottom+.001);
  else assert.ok(g.drawerEdge-g.drawerHeight>=area.top-.001);
 }
 const a={left:128,top:300,width:44,height:44,area:{left:100,top:200,right:460,bottom:700}},g=topbarIslandPlacement(a,CHROME_DEFAULTS.topbar);
 assert.ok(g.left>=100&&g.top>=200&&g.left+g.width<=460&&g.top+g.height<=700);
});

test('bottom anchor uses top pixels and self translation rather than viewport bottom on transformed hosts',()=>{
 const {document,config,island}=fixture();Object.assign(config.chromeStyle.topbar,{enabled:true,layout:'island',island:{...newTopbarIsland(),position:'bottom-right'}});
 island.update(config);const style=document.documentElement.style;
 assert.equal(style.getPropertyValue('--oc-island-drawer-bottom'),'auto');
 assert.equal(style.getPropertyValue('--oc-island-drawer-transform'),'translateY(-100%)');
 assert.ok(parseFloat(style.getPropertyValue('--oc-island-drawer-top'))>0);
 const css=document.querySelector('style[data-oc-owned]').textContent;
 assert.match(css,/transform: var\(--oc-island-drawer-transform\)/);
 assert.match(css,/@media \(max-width: 1000px\)[\s\S]*width: var\(--oc-island-area-width\)/);
 island.stop();assert.equal(style.getPropertyValue('--oc-island-drawer-transform'),'');
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
