import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {createWorkbenchState,workbenchMarkup} from './workbench-ui.mjs';

test('real canvas controls have no simulated preview state',()=>{
 const {document}=parseHTML(workbenchMarkup());
 assert.equal(document.querySelector('#preview-state'),null);
 assert.doesNotMatch(workbenchMarkup(),/普通示例|未连接示例|生成中示例|附件示例/);
 for(const key of ['demoState','demoDrawer','demoText','previewMode'])assert.equal(Object.hasOwn(createWorkbenchState(),key),false);
 assert.ok(document.querySelector('#narrow'));
});
