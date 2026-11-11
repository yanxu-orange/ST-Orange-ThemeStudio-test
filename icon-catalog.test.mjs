import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ICONS,iconUrl,iconGroups} from './icon-catalog.mjs';

test('31 curated icons retain local transparent SVG assets and source attribution',async()=>{
 const sources=JSON.parse(await readFile(new URL('./materials/icons/SOURCES.json',import.meta.url),'utf8'));
 assert.equal(Object.keys(ICONS).length,31);assert.equal(sources.length,31);assert.equal(iconUrl('unknown'),'');
 assert.deepEqual(iconGroups().map(g=>g.icons.length),[9,9,4,9]);
 for(const [id,entry]of Object.entries(ICONS)){
  assert.match(entry.file,/^materials\/icons\/[a-z-]+\.svg$/);const svg=await readFile(new URL(iconUrl(id)),'utf8');
  assert.match(svg,/<svg\b/);assert.match(svg,/viewBox=/);assert.doesNotMatch(svg,/<(?:script|foreignObject|image|style)\b|\bon\w+=|(?:href|src)\s*=/i);
  const source=sources.find(s=>s.id===id);assert.ok(source);assert.equal(source.file,entry.file);assert.ok(source.sourceFile);assert.ok(source.variable);
 }
 assert.equal(Object.hasOwn(ICONS,'snow-stop'),false,'do not invent an unverified snow stop image');
});
