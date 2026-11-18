import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {createGlassRuntime} from './glass-runtime.mjs';
import {newGlassStyle,setGlassSource} from './glass-model.mjs';
import {glassPageRules} from './glass-targets.mjs';
test('liquid definitions deduplicate, remain stable on color edits and clean up',()=>{
 const {document}=parseHTML('<html><body></body></html>');const runtime=createGlassRuntime(document),c={glassStyle:newGlassStyle()};
 runtime.update(c);assert.equal(document.querySelector('svg'),null);
 c.glassStyle.global.mode='liquid';runtime.update(c);const svg=document.querySelector('svg'),filter=svg.querySelector('filter');assert.equal(svg.querySelectorAll('filter').length,1);
 c.glassStyle.global.color='#ffffff';runtime.update(c);assert.equal(svg.querySelector('filter'),filter);
 setGlassSource(c,'input','custom');c.glassStyle.regions.input.material.refraction=9;runtime.update(c);assert.equal(svg.querySelectorAll('filter').length,2);
 runtime.stop();assert.equal(document.querySelector('svg'),null);runtime.update(c);assert.equal(document.querySelectorAll('svg').length,1);
 c.glassStyle.global.mode='none';c.glassStyle.regions.input={source:'inherit'};runtime.update(c);assert.equal(document.querySelector('svg'),null);
});
test('outer page glass never filters chat ancestor or nested worldbook entries',()=>{const c={glassStyle:newGlassStyle()};c.glassStyle.global.mode='liquid';const css=glassPageRules(c);assert.doesNotMatch(css,/#sheld|\.wi-card-entry/);assert.match(css,/backdrop-filter/);assert.match(css,/recentChat/);});
import {createSchemeModel} from './scheme-model.mjs';
import {captureCombination,applyCombination} from './region-combinations.mjs';
test('full scheme validation and local combinations preserve glass without changing other surfaces',()=>{
 const model=createSchemeModel(),c=structuredClone(model.templates.blank);c.glassStyle.global.mode='liquid';
 const restored=model.validate(JSON.parse(JSON.stringify(c)));assert.deepEqual(restored.glassStyle,c.glassStyle);
 const old=structuredClone(c);delete old.glassStyle;assert.equal(model.validate(old).glassStyle,undefined);
 const combo=captureCombination(c,'topbar');assert.equal(combo.glass.mode,'liquid');
 const target=structuredClone(model.templates.blank),before=structuredClone(target.glassStyle.global),out=applyCombination(target,combo);
 assert.deepEqual(out.glassStyle.global,before);assert.equal(out.glassStyle.regions.topbar.source,'custom');assert.equal(out.glassStyle.regions.topbar.material.mode,'liquid');assert.equal(out.glassStyle.regions.input.source,'inherit');
});
