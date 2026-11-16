import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {createSchemeModel} from './scheme-model.mjs';
import {bodyCardSettings,bodyCardRules} from './body-card.mjs';
import {createBodyCardEditors} from './body-card-editor.mjs';

test('body left border is optional, validated and survives scheme roundtrip',()=>{
 const model=createSchemeModel();const base=model.validate(model.templates.blank);
 assert.equal(base.bodyLeftBorderWidth,0);
 assert.doesNotMatch(bodyCardRules('.body','.card',base),/border-left:/);
 const c=model.validate({...base,bodyLeftBorderWidth:2,bodyLeftBorderColor:'#e48fa6'});
 const restored=model.validate(JSON.parse(JSON.stringify(c)));
 assert.equal(restored.bodyLeftBorderWidth,2);assert.equal(restored.bodyLeftBorderColor,'#e48fa6');
 for(const bad of [{bodyLeftBorderWidth:-1},{bodyLeftBorderWidth:13},{bodyLeftBorderWidth:'2'},{bodyLeftBorderColor:'#fff'},{bodyLeftBorderColor:null}])assert.throws(()=>bodyCardSettings(bad));
 for(const surface of ['live','preview']){
  const {document}=parseHTML('<html><head></head><body></body></html>');const s=document.createElement('style');s.textContent=bodyCardRules('.body','.card',restored,surface);document.head.append(s);
  const rules=[...s.sheet.cssRules];assert.equal(rules.find(r=>r.selectorText==='.body').style.getPropertyValue('border-left'),'2px solid #e48fa6');
  assert.equal(rules.find(r=>r.selectorText==='.card').style.getPropertyValue('border-left'),'1px solid #dfe2e5');
 }
});
test('body editor exposes independently editable width and color',()=>{
 const {document}=parseHTML('<html><body></body></html>');const config=bodyCardSettings();const controls=[];
 const make=(tag,cls,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(tag==='select')Object.defineProperty(n,'value',{value:'',writable:true});return n;};
 const editor=createBodyCardEditors({getConfig:()=>config,make,field:(label,key,type,options)=>({label,key,type,...options}),propertyHeading:()=>{},pairedFields:()=>document.createElement('div'),editorControl:(container,definition,value)=>controls.push({definition,value}),renderConfigFields:()=>{},renderFontLinkFields:()=>{},remember:()=>{},apply:()=>{},renderFields:()=>{}});
 editor.renderBodySettings(document.body);
 for(const key of ['bodyLeftBorderWidth','bodyLeftBorderColor'])assert.equal(controls.find(c=>c.definition.key===key).value,config);
 assert.equal(controls.find(c=>c.definition.key==='bodyLeftBorderWidth').definition.min,0);
});
