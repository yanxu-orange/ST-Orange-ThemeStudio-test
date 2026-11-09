import {test} from 'node:test';import assert from 'node:assert/strict';
import {createWorkbenchState,layerRegion,matchingLayers,normalizeSelection,layoutWidths} from './workbench-ui.mjs';
test('workbench selection follows all three anchors without modifying layer data',()=>{
 const layers=[{id:'a',anchor:'header'},{id:'b',anchor:'avatar'},{id:'c',anchor:'message'}],before=structuredClone(layers),ui=createWorkbenchState();
 assert.equal(layerRegion(layers[1]),'header');assert.deepEqual(matchingLayers(layers,'header').map(l=>l.id),['a','b']);assert.deepEqual(matchingLayers(layers,'overall').map(l=>l.id),['c']);
 ui.region='overall';ui.kind='image';ui.object='missing';normalizeSelection(ui,layers);assert.equal(ui.object,'c');assert.deepEqual(layers,before);
 ui.region='header';ui.kind='text';ui.object='removed';normalizeSelection(ui,layers);assert.equal(ui.object,'caption');normalizeSelection(Object.assign(ui,{object:'removed'}),layers,[{id:'one'}]);assert.equal(ui.object,'caption:one');
});
test('resizable preview and panel share minimum width constraints at desktop widths',()=>{
 for(const viewport of [701,800,1000,1200,1700])for(const requested of [35,55,65]){const size=layoutWidths(viewport,requested);assert.ok(size.panel>=(viewport<=1000?330:360));assert.equal(size.previewRight,size.panel+34);assert.ok(size.share>=35&&size.share<=65);assert.ok(size.panel+(viewport-48)*size.share/100<=viewport-48+1);}
 assert.ok(layoutWidths(800,65).share<65);assert.equal(layoutWidths(1700,55).share,55);
});
