import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseHTML} from 'linkedom';
import {workbenchMarkup} from './workbench-ui.mjs';
import {createColorPicker} from './color-picker.mjs';

const parse=source=>parseHTML(`<style>${source}</style>`).document.querySelector('style').sheet;
const css=()=>parseHTML(workbenchMarkup()).document.querySelector('style').textContent;
const allRules=sheet=>[...sheet.cssRules].flatMap(rule=>rule.cssRules?.length?allRules(rule):[rule]);
const rule=(sheet,selector)=>allRules(sheet).find(r=>r.selectorText?.replace(/,\s*/g,',')===selector)?.style;
test('workbench surfaces are square and mobile selectors use compact readable controls',()=>{
 const sheet=parse(css()),rules=allRules(sheet),mobile=[...sheet.cssRules].find(r=>r.conditionText?.replace(/\s/g,'')==='(max-width:700px)');
 assert.ok(mobile);
 for(const r of rules)if(r.selectorText!==':host'&&r.style?.getPropertyValue('border-radius'))assert.equal(r.style.getPropertyValue('border-radius'),r.selectorText==='.launcher'?'22px':'0',r.selectorText);
 assert.equal(rule(sheet,':host').getPropertyValue('--wb-font-body'),'14px');
 assert.equal(rule(sheet,':host').getPropertyValue('--wb-font-label'),'12px');
 assert.equal(rule(sheet,':host').getPropertyValue('--wb-font-title'),'16px');
 assert.equal(rule(mobile,'select').minHeight,'40px');
 assert.equal(rule(mobile,'button,summary').minHeight,'44px');
 assert.equal(rule(mobile,'.scope-controls label').fontSize,'var(--wb-font-label)');
 assert.equal(rule(sheet,'.field').paddingTop,'10px');
 assert.equal(rule(sheet,'.field').gap,'4px');
 assert.equal(rule(sheet,'input,select,textarea').fontSize,'var(--wb-font-body)');
});
test('color editor uses square controls while retaining its circular color-position indicator',()=>{
 const {document}=parseHTML('<html><body></body></html>');createColorPicker({document,root:document.body});
 const sheet=parse(document.querySelector('style').textContent);
 for(const r of allRules(sheet)){
  const radius=r.style?.getPropertyValue('border-radius');
  if(radius)assert.equal(radius,r.selectorText==='.otl-color-dot'?'50%':'0',r.selectorText);
 }
 assert.equal(rule(sheet,'.otl-color-dialog h3').fontSize,'16px');
 assert.equal(rule(sheet,'.otl-color-values input').fontSize,'14px');
});
test('library and image-crop styles stay square without changing artwork preview geometry',()=>{
 for(const file of ['work-library.mjs','combination-library.mjs','index.js']){
  const text=readFileSync(new URL(file,import.meta.url),'utf8');
  const declarations=[...text.matchAll(/border-radius:([^;}]+)/g)].map(m=>m[1]);
  assert.ok(declarations.length,file);assert.ok(declarations.every(value=>value==='0'),file);
 }
 const preview=readFileSync(new URL('combination-preview.mjs',import.meta.url),'utf8');
 assert.ok(preview.includes('border-radius:${p.radius}px'));
});
