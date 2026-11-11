import {test} from 'node:test';import assert from 'node:assert/strict';
import {mobileGeometry,workbenchMarkup} from './workbench-ui.mjs';import {shell} from './test-support/workbench-shell.mjs';
test('phone geometry fits keyboard and safe areas without dock reservation',()=>{for(const h of [160,300,500,844])for(const open of [true,false])for(const compact of [true,false]){const g=mobileGeometry(h,64,open,35,compact,34);assert.ok(g.height>=0&&g.sheet>=0);assert.ok(g.panelTop+g.sheet<=35+h-42+.01);if(!open)assert.equal(g.sheet,0);if(compact&&open)assert.equal(g.height,0);}assert.match(workbenchMarkup(),/textarea,select\{font-size:16px\}/);});
test('full view and property sheet work repeatedly at phone, tablet and desktop widths',()=>{for(const width of [390,768,1366]){const {bench,shadow,click,change}=shell(width);assert.equal(bench.ui.mobileView,'adjust');change('#region-select','body');for(let i=0;i<3;i++){click('#full-view');assert.equal(bench.ui.mobileView,'preview');assert.equal(shadow.host.dataset.fullView,'true');click('#full-view');assert.equal(bench.ui.mobileView,'adjust');assert.equal(bench.ui.region,'body');}assert.equal(shadow.querySelector('.wb-nav'),null);}});
test('layers and independent library keep selected scope while sharing one header navigation',()=>{const {bench,shadow,click,change}=shell();click('#mode-layers');assert.equal(bench.ui.mobileView,'layers');assert.equal(bench.ui.region,'header');bench.render({kinds:[['text','文字']],objects:[['name','名字']],title:'名字'});assert.equal(shadow.querySelector('.selection').classList.contains('hidden'),true);click('#mode-library');assert.equal(bench.ui.mode,'library');assert.equal(shadow.querySelector('.panel-head').hidden,true);click('#mode-edit');assert.equal(bench.ui.region,'header');change('#workspace-page','settings');assert.equal(shadow.querySelector('#mode-layers').disabled,true);assert.equal(shadow.querySelector('#mode-library').disabled,false);});
test('property navigation is two rows with one contextual layers action and global library',()=>{const {shadow,click,change}=shell();assert.equal(shadow.querySelector('.mode-tabs'),null);assert.ok(shadow.querySelector('.bar > #mode-library'));assert.ok(shadow.querySelector('.scope-controls > #mode-layers'));assert.equal(shadow.querySelector('#mode-layers').hidden,false);assert.equal(shadow.querySelector('#mode-edit').hidden,true);assert.equal(shadow.querySelector('.inspector-head').hidden,true);click('#mode-layers');assert.equal(shadow.querySelector('#mode-layers').hidden,true);assert.equal(shadow.querySelector('#mode-edit').hidden,false);click('#mode-edit');change('#region-select','body');assert.equal(shadow.querySelector('#mode-layers').hidden,true);assert.equal(shadow.querySelector('#mode-edit').hidden,true);assert.equal(shadow.querySelector('.scope-controls').dataset.layers,'false');});

test('collapsing only the toolbar preserves the property editor and restores exact selection',()=>{
 for(const width of [390,768,1366]){
  const {bench,shadow,click,change}=shell(width);change('#region-select','body');
  const launcher=shadow.querySelector('.launcher');launcher.classList.add('hidden');
  for(const view of ['adjust','layers','preview','library']){
   bench.ui.mode=view==='library'?'library':'edit';bench.ui.libraryExpanded=view==='library';bench.ui.mobileView=view;bench.render();const before={...bench.ui};
   for(let i=0;i<3;i++){
    click('#collapse-toolbar');assert.equal(shadow.host.dataset.toolbarCollapsed,'true');
    assert.equal(shadow.querySelector('.panel').dataset.mobileView,view);
    assert.equal(shadow.host.dataset.fullView,String(view==='preview'));
    assert.equal(launcher.getAttribute('aria-label'),'展开顶部工具栏，可拖动调整位置');
    bench.restoreWorkbench();assert.equal(shadow.host.dataset.toolbarCollapsed,'false');
    assert.deepEqual(bench.ui,before);
   }
  }
  click('#collapse-toolbar');bench.resetLayoutSession();assert.equal(shadow.host.dataset.toolbarCollapsed,'false');
  const css=shadow.querySelector('style').textContent;
  assert.match(css,/:host\(\[data-toolbar-collapsed=true\]\)>\.bar\{display:none\}/);
  assert.match(css,/:host\(\[data-toolbar-collapsed=true\]\)>\.launcher.hidden\{display:block!important;z-index:20040\}/);
  assert.doesNotMatch(css,/:host\(\[data-full-view=true\]\)>\.bar/);
  assert.doesNotMatch(css,/:host\(\[data-toolbar-collapsed=true\]\)>\.panel/);
 }
});
