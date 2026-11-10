import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {chatFrameRules} from './body-card.mjs';
import {workbenchMarkup} from './workbench-ui.mjs';
test('mobile card fills the available chat width on preview and live while retaining desktop limits',()=>{
 for(const card of ['html[data-orange-lab] #chat>.mes[data-orange-lab-fixture]','html[data-orange-live] .mes']){
  const config={cardWidth:320,cardGutter:0,cardFullWidth:false},before=structuredClone(config),css=chatFrameRules('#chat',card,config),{document}=parseHTML(`<style>${css}</style>`),rules=[...document.querySelector('style').sheet.cssRules];
  assert.equal(rules[1].style.getPropertyValue('max-width'),'320px');assert.equal(rules[2].conditionText,'(max-width:700px)');assert.equal(rules[2].cssRules[0].selectorText.replace(/\s*>\s*/g,'>'),card);assert.equal(rules[2].cssRules[0].style.getPropertyValue('max-width'),'none');assert.equal(rules[2].cssRules[0].style.getPropertyPriority('max-width'),'important');assert.deepEqual(config,before);
 }
 const {document}=parseHTML(workbenchMarkup()),mobile=[...document.querySelector('style').sheet.cssRules].find(rule=>rule.conditionText==='(max-width:700px)');assert.equal([...mobile.cssRules].find(rule=>rule.selectorText==='.desktop-card-width').style.getPropertyValue('display'),'none');
});
