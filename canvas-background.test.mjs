import {test} from 'node:test';import assert from 'node:assert/strict';
import {normalizeCanvasBackground,canvasBackgroundRules} from './canvas-background.mjs';
test('old plans retain solid colour while new explicit tavern plans roundtrip',()=>{
 assert.deepEqual(normalizeCanvasBackground({background:'#abcdef'}),{background:'#abcdef',canvasBackground:'legacy-solid'});
 assert.equal(normalizeCanvasBackground({}).canvasBackground,'legacy-solid');
 const next={canvasBackground:'tavern',background:'#123456'};
 assert.deepEqual(normalizeCanvasBackground(JSON.parse(JSON.stringify(next))),next);
 assert.throws(()=>normalizeCanvasBackground({canvasBackground:'url'}));
 assert.throws(()=>normalizeCanvasBackground({background:'red;display:none'}));
});
test('preview and live expose native wallpaper without URL copies or observers',()=>{
 for(const root of ['html[data-orange-lab]','html[data-orange-live]']){
  const css=canvasBackgroundRules({canvasBackground:'tavern'},root);
  assert.ok(css.includes(`${root} #sheld,${root} #chat`));assert.match(css,/background:transparent!important/);assert.match(css,/-webkit-backdrop-filter:none/);
  assert.doesNotMatch(css,/#bg1|url\(|\.mes/);
  assert.equal(canvasBackgroundRules({background:'#aabbcc'},root),`${root} #chat{background:#aabbcc!important}`);
 }
});
