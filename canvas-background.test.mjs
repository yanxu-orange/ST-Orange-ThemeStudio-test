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

test('scheme wallpaper validates, roundtrips and uses its own removable screen layer',async()=>{
 const {parseHTML}=await import('linkedom');
 const {createCanvasWallpaper}=await import('./canvas-background.mjs');
 const {document}=parseHTML('<html><body><div id="bg1" style="background-image:url(native.png)"></div><div id="chat"></div></body></html>');
 const native=document.querySelector('#bg1'),original=native.getAttribute('style');
 const image='data:image/png;base64,AAAA',config={canvasBackground:'image',canvasWallpaper:image};
 assert.equal(normalizeCanvasBackground(JSON.parse(JSON.stringify(config))).canvasWallpaper,image);
 assert.throws(()=>normalizeCanvasBackground({canvasBackground:'image'}));
 assert.throws(()=>normalizeCanvasBackground({...config,canvasWallpaper:'javascript:alert(1)'}));
 const wallpaper=createCanvasWallpaper(document);wallpaper.update(config);
 assert.ok(document.querySelector('#orange-theme-wallpaper').style.backgroundImage.includes(image));
 assert.equal(native.getAttribute('style'),original);
 wallpaper.update({...config,canvasWallpaper:'data:image/png;base64,BBBB'});
 assert.ok(document.querySelector('#orange-theme-wallpaper').style.backgroundImage.includes('BBBB'));
 wallpaper.update({canvasBackground:'tavern'});assert.equal(document.querySelector('#orange-theme-wallpaper'),null);
 wallpaper.update(config);wallpaper.stop();assert.equal(document.querySelector('#orange-theme-wallpaper'),null);
 assert.equal(native.getAttribute('style'),original);
});
