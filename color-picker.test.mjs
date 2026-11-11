import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {validHex,hexToHsv,hsvToHex,createColorPicker} from './color-picker.mjs';
const setup=()=>{const {document,window}=parseHTML('<html><body><main></main></body></html>'),root=document.querySelector('main'),calls=[],picker=createColorPicker({document,root});const open=(extra={})=>picker.open({value:'#123456',onCommit:v=>calls.push(v),...extra});const edit=(q,v)=>{const n=root.querySelector(q);n.value=v;n.dispatchEvent(new window.Event('input'));};return {document,window,root,calls,picker,open,edit};};
test('RGB/HSV round trips colors including achromatic and hue wrap',()=>{for(const c of ['#000000','#ffffff','#808080','#ff0000','#00ff00','#0000ff','#123456','#ff83b2'])assert.equal(hsvToHex(hexToHsv(c)),c);assert.equal(hsvToHex({h:360,s:1,v:1}),'#ff0000');assert.equal(validHex('#abc'),false);assert.throws(()=>hexToHsv('red'));});
test('draft edits commit once; cancel and unchanged color never commit',()=>{const x=setup();x.open();for(const c of ['#ff0000','#00ff00','#112233'])x.edit('[aria-label="调色盘 HEX"]',c);assert.deepEqual(x.calls,[]);const yes=x.root.querySelector('.confirm');yes.click();yes.click();assert.deepEqual(x.calls,['#112233']);assert.equal(x.root.querySelector('dialog'),null);x.open();x.root.querySelector('.confirm').click();assert.equal(x.calls.length,1);x.open();x.edit('[aria-label="调色盘 HEX"]','#ffffff');x.picker.cancel();assert.equal(x.calls.length,1);});
test('invalid HEX blocks commit; stale context and replacement cancel',()=>{const x=setup();x.open();x.edit('[aria-label="调色盘 HEX"]','no');assert.equal(x.root.querySelector('.confirm').disabled,true);x.root.querySelector('.confirm').click();assert.deepEqual(x.calls,[]);let valid=true;x.open({isValid:()=>valid});x.edit('[aria-label="调色盘 HEX"]','#abcdef');valid=false;x.root.querySelector('.confirm').click();assert.deepEqual(x.calls,[]);x.open();x.open();assert.equal(x.root.querySelectorAll('dialog').length,1);x.picker.cancel();});
test('pointer and keyboard operate draft and Escape cancels',()=>{const x=setup();x.open({value:'#ff0000'});const sv=x.root.querySelector('.otl-color-sv');sv.getBoundingClientRect=()=>({left:0,top:0,width:100,height:100});const send=(type,props)=>{const e=new x.window.Event(type,{bubbles:true,cancelable:true});Object.assign(e,props);sv.dispatchEvent(e);};send('pointerdown',{pointerId:1,button:0,clientX:50,clientY:50});assert.equal(x.root.querySelector('[aria-label="调色盘 HEX"]').value,'#804040');send('pointermove',{pointerId:2,clientX:100,clientY:0});assert.equal(x.root.querySelector('[aria-label="调色盘 HEX"]').value,'#804040');send('pointerup',{pointerId:1,clientX:100,clientY:0});assert.equal(x.root.querySelector('[aria-label="调色盘 HEX"]').value,'#ff0000');send('keydown',{key:'ArrowDown',shiftKey:true});assert.equal(x.root.querySelector('[aria-label="调色盘 HEX"]').value,'#e60000');send('keydown',{key:'Escape'});assert.equal(x.root.querySelector('dialog'),null);assert.deepEqual(x.calls,[]);});
test('dialog isolates keyboard events without preventing ordinary text editing',()=>{const x=setup();x.open();let bubbled=0;x.root.addEventListener('keydown',()=>bubbled++);x.root.addEventListener('keyup',()=>bubbled++);for(const selector of ['.otl-color-sv','.otl-color-hue','[aria-label="调色盘 HEX"]'])for(const type of ['keydown','keyup']){const e=new x.window.Event(type,{bubbles:true,cancelable:true});e.key='a';x.root.querySelector(selector).dispatchEvent(e);assert.equal(e.defaultPrevented,false);}assert.equal(bubbled,0);});
test('showModal failure cancels draft and cleans viewport listener',()=>{const x=setup();let listeners=0;Object.defineProperty(x.document.defaultView,'visualViewport',{value:{height:600,addEventListener(){listeners++;},removeEventListener(){listeners--; }},configurable:true});const proto=Object.getPrototypeOf(x.document.createElement('dialog')),previous=proto.showModal;proto.showModal=()=>{throw Error('dialog unavailable');};try{assert.equal(x.open(),null);assert.equal(x.root.querySelector('dialog'),null);assert.equal(listeners,0);assert.deepEqual(x.calls,[]);x.picker.cancel();assert.equal(listeners,0);}finally{if(previous)proto.showModal=previous;else delete proto.showModal;delete x.document.defaultView.visualViewport;}});
test('fine saturation and brightness sliders synchronize with HEX, hue and SV',()=>{const x=setup();x.open({value:'#ff0000'});const read=()=>x.root.querySelector('[aria-label="调色盘 HEX"]').value;x.edit('[aria-label="饱和度微调"]','50');assert.equal(read(),'#ff8080');x.edit('[aria-label="明度微调"]','50');assert.equal(read(),'#804040');x.edit('[aria-label="色相"]','120');assert.equal(read(),'#408040');x.edit('[aria-label="调色盘 HEX"]','#0000ff');assert.equal(x.root.querySelector('[aria-label="饱和度微调"]').value,'100');assert.equal(x.root.querySelector('[aria-label="明度微调"]').value,'100');assert.equal(x.root.querySelector('[aria-label="色相"]').value,'240');const sv=x.root.querySelector('.otl-color-sv');sv.getBoundingClientRect=()=>({left:0,top:0,width:100,height:100});const e=new x.window.Event('pointerdown');Object.assign(e,{pointerId:1,button:0,clientX:20,clientY:25});sv.dispatchEvent(e);assert.equal(x.root.querySelector('[aria-label="饱和度微调"]').value,'20');assert.equal(x.root.querySelector('[aria-label="明度微调"]').value,'75');assert.deepEqual(x.calls,[]);x.root.querySelector('.confirm').click();assert.equal(x.calls.length,1);});
test('live previews cover HEX, hue, fine controls, pointer and keyboard without committing',()=>{
 const x=setup(),previews=[];x.open({value:'#ff0000',onPreview:v=>previews.push(v)});
 assert.deepEqual(previews,[]);assert.match(x.root.querySelector('.otl-color-help').textContent,/实时预览/);
 x.edit('[aria-label="饱和度微调"]','50');x.edit('[aria-label="明度微调"]','50');x.edit('[aria-label="色相"]','120');x.edit('[aria-label="调色盘 HEX"]','#0000FF');
 assert.deepEqual(previews,['#ff8080','#804040','#408040','#0000ff']);
 x.edit('[aria-label="调色盘 HEX"]','invalid');x.edit('[aria-label="调色盘 HEX"]','#0000ff');assert.equal(previews.length,4);
 const sv=x.root.querySelector('.otl-color-sv');sv.getBoundingClientRect=()=>({left:0,top:0,width:100,height:100});
 const send=(type,props)=>{const event=new x.window.Event(type,{bubbles:true,cancelable:true});Object.assign(event,props);sv.dispatchEvent(event);};
 send('pointerdown',{pointerId:1,button:0,clientX:50,clientY:50});send('pointerup',{pointerId:1,clientX:50,clientY:50});send('keydown',{key:'ArrowDown',shiftKey:true});
 assert.deepEqual(previews.slice(4),['#404080','#333366']);assert.deepEqual(x.calls,[]);
});
test('all cancellation paths roll back the exact original once, including stale contexts',()=>{
 for(const mode of ['button','escape','native cancel','close','external','handle','replacement','stale confirm','stale input']){
  const x=setup(),rollbacks=[],previews=[];let valid=true;
  const handle=x.open({value:'#AbCdEf',onPreview:v=>previews.push(v),onCancel:v=>rollbacks.push(v),isValid:()=>valid});
  x.edit('[aria-label="调色盘 HEX"]','#112233');const dialog=x.root.querySelector('dialog'),yes=dialog.querySelector('.confirm');
  valid=false;
  if(mode==='button')dialog.querySelector('.otl-color-actions button').click();
  else if(mode==='escape'){const e=new x.window.Event('keydown');e.key='Escape';dialog.dispatchEvent(e);}
  else if(mode==='native cancel')dialog.dispatchEvent(new x.window.Event('cancel'));
  else if(mode==='close')dialog.dispatchEvent(new x.window.Event('close'));
  else if(mode==='external')x.picker.cancel();
  else if(mode==='handle')handle.cancel();
  else if(mode==='replacement')x.open();
  else if(mode==='stale confirm')yes.click();
  else x.edit('[aria-label="调色盘 HEX"]','#445566');
  handle.cancel();yes.click();dialog.dispatchEvent(new x.window.Event('close'));
  assert.deepEqual(rollbacks,['#AbCdEf'],mode);assert.deepEqual(previews,['#112233'],mode);assert.deepEqual(x.calls,[],mode);
 }
});
test('accepted previews commit once and never roll back, including unchanged acceptance',()=>{
 for(const changed of [true,false]){
  const x=setup(),rollbacks=[];const handle=x.open({onPreview:()=>{},onCancel:v=>rollbacks.push(v)});
  x.edit('[aria-label="调色盘 HEX"]','#abcdef');if(!changed)x.edit('[aria-label="调色盘 HEX"]','#123456');
  const dialog=x.root.querySelector('dialog'),yes=dialog.querySelector('.confirm');yes.click();yes.click();handle.cancel();x.picker.cancel();dialog.dispatchEvent(new x.window.Event('close'));
  assert.deepEqual(x.calls,changed?['#abcdef']:[]);assert.deepEqual(rollbacks,[]);
 }
});
