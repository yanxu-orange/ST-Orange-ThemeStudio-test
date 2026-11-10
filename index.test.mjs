import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';

test('editor independent controls validate links and preserve settings through save and undo',async()=>{
  const {document,window}=parseHTML('<html><head><style id="custom-style"></style></head><body><div id="sheld"><div id="chat"></div></div></body></html>');
  // linkedom implements the select getter only; supply the browser setter in this harness.
  const selectValue=Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value');
  Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get:selectValue.get,set(value){for(const option of this.options)option.toggleAttribute('selected',option.value===String(value));},configurable:true});
  const values=new Map();Object.assign(globalThis,{document,window,localStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{},ResizeObserver:class{observe(){}disconnect(){}}});
  await import('./index.js');
  const shadow=document.querySelector('#orange-theme-lab').shadowRoot;shadow.querySelector('.launcher').click();
  shadow.querySelector('[data-region="header"]').click();shadow.querySelector('[data-kind="name"]').click();
  const input=(label,value)=>{const node=shadow.querySelector(`[aria-label="${label}"]`);assert.ok(node,label);node.value=String(value);node.dispatchEvent(new window.Event(node.tagName==='SELECT'?'change':'input'));return node;};
  for(let i=3;i<21;i++)[...shadow.querySelectorAll('button')].find(b=>b.textContent==='上移一层').click();
  assert.equal([...shadow.querySelectorAll('button')].find(b=>b.textContent==='上移一层').disabled,true);
  input('名字 水平位置 数值',-25);input('名字 纵向位置 数值',140);input('名字 字重','700');
  const url=shadow.querySelector('[aria-label="名字 字体直链"]');url.value='javascript:alert(1)';url.dispatchEvent(new window.Event('change'));assert.equal(url.getAttribute('aria-invalid'),'true');
  url.value='https://example.com/font.woff2';url.dispatchEvent(new window.Event('change'));assert.equal(url.hasAttribute('aria-invalid'),false);
  shadow.querySelector('#save').click();const saved=JSON.parse(values.get('orange.theme-lab.mobile-test.v1'));assert.equal(saved.textItems.name.z,21);assert.equal(saved.textItems.name.x,-25);assert.equal(saved.textItems.name.y,140);assert.equal(saved.textItems.name.weight,700);assert.equal(saved.textItems.name.fontLink.url,'https://example.com/font.woff2');assert.equal(saved.textItems.time.x,0);
  shadow.querySelector('#undo').click();shadow.querySelector('#save').click();assert.equal(JSON.parse(values.get('orange.theme-lab.mobile-test.v1')).textItems.name.fontLink,null);
  shadow.querySelector('[data-kind="text"]').click();shadow.querySelector('[data-object="caption:caption-legacy"]').click();input('文案宽度模式','custom');
  assert.equal(shadow.querySelector('[aria-label="文案宽度占比 数值"]').value,'60');input('文案宽度占比 数值',75);
  shadow.querySelector('#save').click();assert.equal(JSON.parse(values.get('orange.theme-lab.mobile-test.v1')).captions[0].width,75);
  shadow.querySelector('#undo').click();shadow.querySelector('#save').click();assert.equal(JSON.parse(values.get('orange.theme-lab.mobile-test.v1')).captions[0].width,60);
  input('文案宽度模式','auto');shadow.querySelector('#save').click();assert.equal(JSON.parse(values.get('orange.theme-lab.mobile-test.v1')).captions[0].width,'auto');
  const importInput=shadow.querySelector('#import-file');
  const imported={...saved,captions:[{...saved.captions[0],width:80,x:45,y:-60,z:8,weight:300,fontLink:null}]};
  Object.defineProperty(importInput,'files',{value:[{size:1000,text:async()=>JSON.stringify(imported)}],configurable:true});
  const importEvent=new window.Event('change');importInput.dispatchEvent(importEvent);
  // linkedom clears target after dispatch; browsers keep it available to async listeners.
  Object.defineProperty(importEvent,'target',{value:importInput});await new Promise(r=>setImmediate(r));shadow.querySelector('#save').click();
  assert.equal(JSON.parse(values.get('orange.theme-lab.mobile-test.v1')).captions[0].y,-60);assert.equal(JSON.parse(values.get('orange.theme-lab.mobile-test.v1')).captions[0].width,80);
  let exported;const createURL=URL.createObjectURL,revokeURL=URL.revokeObjectURL;
  URL.createObjectURL=blob=>{exported=blob;return 'blob:fake-export';};URL.revokeObjectURL=()=>{};
  shadow.querySelector('#export').click();const exportedConfig=JSON.parse(await exported.text());assert.deepEqual(exportedConfig.textItems,JSON.parse(values.get('orange.theme-lab.mobile-test.v1')).textItems);assert.equal(exportedConfig.captions[0].width,80);assert.equal(Object.hasOwn(exportedConfig,'caption'),false);assert.equal(Object.hasOwn(exportedConfig.textItems,'caption'),false);URL.createObjectURL=createURL;URL.revokeObjectURL=revokeURL;
  // UI navigation/sizing is independent of persisted theme data.
  const beforeNavigation=JSON.parse(values.get('orange.theme-lab.mobile-test.v1'));
  const scope=shadow.querySelector('#page-scope');scope.value='global';scope.dispatchEvent(new window.Event('change'));assert.equal(shadow.querySelector('#save').disabled,true);assert.equal(shadow.querySelector('#apply-live').disabled,true);assert.ok(document.querySelector('#otl-workbench-placeholder'));
  scope.value='chat';scope.dispatchEvent(new window.Event('change'));shadow.querySelector('#wb-split').value='65';shadow.querySelector('#wb-split').dispatchEvent(new window.Event('input'));shadow.querySelector('#narrow').click();assert.equal(document.documentElement.dataset.otlNarrow,'true');shadow.querySelector('#save').click();assert.deepEqual(JSON.parse(values.get('orange.theme-lab.mobile-test.v1')),beforeNavigation);
  const setControl=(label,value)=>{const node=shadow.querySelector(`[aria-label="${label}"]`);assert.ok(node,label);node.value=String(value);node.dispatchEvent(new window.Event('input'));node.dispatchEvent(new window.Event('change'));};
  shadow.querySelector('[data-kind="avatar"]').click();assert.ok(shadow.querySelector('[aria-label="头像大小 数值"]'));
  setControl('设计对象','separate');setControl('正在设计','ai');
  setControl('头像边框','true');for(const label of ['头像大小','头像圆角','头像比例','边框宽度','边框颜色','头像阴影','头像横向移动','头像纵向移动','头像缩放','头像旋转'])assert.ok(shadow.querySelector(`[aria-label="${label}"]`),label);
  setControl('头像横向移动 数值',13);setControl('头像缩放 数值',1.2);shadow.querySelector('#save').click();let moved=JSON.parse(values.get('orange.theme-lab.mobile-test.v1'));assert.equal(moved.photos.ai.x,13);assert.equal(moved.photos.ai.scale,1.2);assert.equal(moved.photos.user.x,0);
  setControl('正在设计','user');assert.equal(shadow.querySelector('[aria-label="头像横向移动 数值"]').value,'0');setControl('头像边框','true');setControl('头像大小 数值',220);
  setControl('正在设计','ai');shadow.querySelector('[data-kind="image"]').click();shadow.querySelector('#add-current-image').click();[...shadow.querySelectorAll('button')].find(b=>b.textContent==='添加所选素材').click();setControl('应用于','ai');setControl('定位区域','avatar');setControl('大小单位','percent');setControl('偏移单位','percent');
  const selectedId=shadow.querySelector('[data-object][aria-pressed="true"]').dataset.object;const nameInput=shadow.querySelector('[aria-label="素材名称"]');nameInput.value='保构图胶带';nameInput.dispatchEvent(new window.Event('input'));assert.equal(shadow.querySelector('.selected-title').textContent,'保构图胶带');assert.equal(shadow.querySelector(`[data-object="${selectedId}"]`).textContent,'保构图胶带');assert.equal(shadow.querySelector('[aria-label="素材名称"]'),nameInput);
  setControl('定位区域','message');assert.equal(shadow.querySelector('[data-region="overall"]').getAttribute('aria-pressed'),'true');assert.equal(shadow.querySelector('[data-object][aria-pressed="true"]').dataset.object,selectedId);setControl('距右边距离 数值',-12);setControl('定位区域','avatar');shadow.querySelector('#save').click();moved=JSON.parse(values.get('orange.theme-lab.mobile-test.v1'));const layer=moved.layers.find(l=>l.id===selectedId);assert.equal(layer.anchor,'avatar');assert.equal(layer.scope,'ai');assert.equal(layer.widthUnit,'percent');assert.equal(layer.offsetUnit,'percent');assert.equal(layer.x,-12);assert.equal(moved.photos.user.size,220);
  shadow.querySelector('[data-region="input"]').click();assert.equal(shadow.querySelector('#apply-live').disabled,false);assert.equal(shadow.querySelector('[aria-label="启用输入区美化"]').value,'false');
  shadow.querySelector('[data-region="body"]').click();setControl('正文字重模式','custom');setControl('正文字重 数值',350);setControl('段距（含末段下方） 数值',24);setControl('正文左侧留白 数值',13);setControl('正文右侧留白 数值',8);setControl('首行缩进','true');assert.equal(shadow.querySelector('[aria-label="正文左侧留白"]').value,'13');shadow.querySelector('#save').click();const bodySaved=JSON.parse(values.get('orange.theme-lab.mobile-test.v1'));assert.equal(bodySaved.bodyWeight,350);assert.equal(bodySaved.bodyIndent,true);assert.equal(bodySaved.bodyPaddingLeft,13);assert.equal(bodySaved.bodyPaddingRight,8);assert.equal(bodySaved.bodyParagraphGap,24);assert.deepEqual(bodySaved.captions,moved.captions);assert.deepEqual(bodySaved.layers,moved.layers);
  shadow.querySelector('[data-region="overall"]').click();setControl('边框范围','custom');const rightEdge=shadow.querySelector('[aria-label="卡片右边"]'),leftEdge=shadow.querySelector('[aria-label="卡片左边"]');rightEdge.checked=false;rightEdge.dispatchEvent(new window.Event('change'));leftEdge.checked=false;leftEdge.dispatchEvent(new window.Event('change'));setControl('卡片边框颜色来源','custom');setControl('卡片边框颜色 HEX','#123456');setControl('卡片边框粗细 数值',3);setControl('卡片边框线型','dashed');shadow.querySelector('#save').click();const borderSaved=JSON.parse(values.get('orange.theme-lab.mobile-test.v1'));assert.equal(borderSaved.cardBorderRight,false);assert.equal(borderSaved.cardBorderLeft,false);assert.equal(borderSaved.cardBorderColor,'#123456');assert.equal(borderSaved.cardBorderWidth,3);assert.equal(borderSaved.cardBorderStyle,'dashed');assert.equal(borderSaved.bodyWeight,350);
  setControl('边框范围','none');shadow.querySelector('#undo').click();shadow.querySelector('#save').click();assert.equal(JSON.parse(values.get('orange.theme-lab.mobile-test.v1')).cardBorderMode,'custom');assert.equal(JSON.parse(values.get('orange.theme-lab.mobile-test.v1')).cardBorderColor,'#123456');
  // A decoded upload from a closed editor cannot commit into the reopened draft.
  const pending=[];globalThis.FileReader=class{readAsDataURL(){this.result='data:image/png;base64,AAAA';this.onload();}};globalThis.Image=class{constructor(){this.naturalWidth=10;this.naturalHeight=10;}decode(){return new Promise(resolve=>pending.push(resolve));}};
  shadow.querySelector('[data-region="header"]').click();shadow.querySelector('#mode-library').click();const upload=shadow.querySelector('[aria-label="上传装饰图片"]');Object.defineProperty(upload,'files',{value:[{type:'image/png',size:4,name:'fake.png'}]});upload.dispatchEvent(new window.Event('change'));await new Promise(r=>setImmediate(r));assert.equal(pending.length,1);shadow.querySelector('#close').click();pending[0]();await new Promise(r=>setImmediate(r));assert.equal(shadow.querySelector('.crop-dialog'),null);shadow.querySelector('.launcher').click();shadow.querySelector('#save').click();assert.equal(JSON.parse(values.get('orange.theme-lab.mobile-test.v1')).layers.length,moved.layers.length);
  const close=[...shadow.querySelectorAll('button')].find(b=>b.textContent==='退出编辑');close.click();assert.equal(document.querySelectorAll('[data-orange-lab-fixture]').length,0);
});
