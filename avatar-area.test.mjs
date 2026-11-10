import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {defaultPhoto} from './photos.mjs';
import {FILL_DEFAULT} from './avatar-fill.mjs';
import {sceneGeometry,sceneBounds,avatarClipPolygon,prepareScene,placeScene,sceneFrameRules,sceneTextRules} from './text-scene.mjs';
const config=()=>({headerHeight:420,cardWidth:680,textAlign:'start',textItems:{name:{x:20,y:-80,width:'auto',z:3,weight:'auto'},time:{x:0,y:600,width:70,z:3,weight:'auto'}},captions:[],photos:{ai:defaultPhoto({size:270,ratio:'0.75',radius:50,x:-70,y:70,rotation:20,scale:1.5}),user:defaultPhoto({size:120,ratio:'1.3333333333333333'})},avatarFill:{ai:{...FILL_DEFAULT},user:{...FILL_DEFAULT}}});
test('total header height stays exact for narrow/wide, ordinary/fill, hidden/visible, and large content',()=>{
 for(const width of [240,320,632,1200])for(const fill of [false,true])for(const hidden of [false,true]){
  const c=config();c.avatarFill.ai.enabled=fill;const original=structuredClone(c),p=c.photos.ai;
  const states=[420,60,1000,420].map(height=>{c.headerHeight=height;const g=sceneGeometry(c,width,p,hidden);assert.equal(g.baseHeight,height);assert.deepEqual(sceneBounds(c,g,[{item:{x:0,y:-500},width:200,height:4000}]),{reserveTop:0,height});if(fill&&!hidden)assert.equal(g.photoHeight,height);else assert.equal(g.photoHeight,hidden?0:360);return g;});
  assert.deepEqual(states[0],states[3]);assert.deepEqual(c,original);
 }
});
test('avatar clipping inverse transform maps exactly to region corners without modifying dimensions',()=>{
 for(const size of [40,120,300])for(const ratio of ['1','0.75','1.3333333333333333'])for(const rotation of [-20,0,20])for(const scale of [.5,1,1.5]){
  const c=config(),p=defaultPhoto({size,ratio,rotation,scale,x:-70,y:80}),g=sceneGeometry(c,342,p),points=avatarClipPolygon(c,g,p).split(',').map(s=>s.split(' ').map(parseFloat)),rad=rotation*Math.PI/180,ox=size/2,oy=size/Number(ratio);
  points.forEach(([x,y],i)=>{const px=24+p.x+ox+scale*((x-ox)*Math.cos(rad)-(y-oy)*Math.sin(rad)),py=24-p.y+oy+scale*((x-ox)*Math.sin(rad)+(y-oy)*Math.cos(rad));assert.ok(Math.abs(px-[0,390,390,0][i])<.001);assert.ok(Math.abs(py-[0,0,420,420][i])<.001);});
 }
});
test('preview and host use same fixed scene, clipping restores after enlarging and long names are not measured',()=>{
 const results=[];for(const tag of ['otl-header','ch_name']){
  const {document}=parseHTML(`<div class="mes" is_user="false"><div class="${tag}"><div><span class="name_text">${'很长的名字'.repeat(100)}</span><small>时间</small></div></div><div class="mes_text">不可改动的正文</div></div>`),msg=document.querySelector('.mes'),header=msg.firstElementChild,name=msg.querySelector('.name_text'),time=msg.querySelector('small'),c=config(),nodes={name,time},set=(n,k,v)=>n.style.setProperty(k,v),body=msg.lastElementChild.innerHTML,before=JSON.stringify(c);
  name.getBoundingClientRect=()=>{throw Error('content must not resize area');};header.getBoundingClientRect=()=>({left:0,top:0});name.parentElement.getBoundingClientRect=()=>({left:0,top:0});
  const snapshots=[];for(const h of [420,60,420]){c.headerHeight=h;const g=prepareScene(msg,header,c,nodes,set);placeScene(msg,header,c,nodes,g,set);assert.equal(msg.style.getPropertyValue('--sc-total-height'),h+'px');assert.equal(msg.style.getPropertyValue('--sc-top-name'),'-56px');snapshots.push(msg.style.getPropertyValue('--sc-clip-bottom-name'));}
  assert.equal(snapshots[0],snapshots[2]);assert.notEqual(snapshots[0],snapshots[1]);assert.equal(msg.lastElementChild.innerHTML,body);assert.equal(JSON.stringify(c),before);results.push(msg.getAttribute('style'));
 }assert.equal(results[0],results[1]);
});
test('shared frame fixes total including top padding and does not clip action menus',()=>{
 const css=sceneFrameRules('.mes','.header');assert.match(css,/height:var\(--sc-total-height\)!important/);assert.match(css,/max-height:var\(--sc-total-height\)!important/);assert.match(css,/margin-top:-24px!important/);assert.match(css,/margin-bottom:14px!important/);assert.match(css,/overflow:visible!important/);assert.doesNotMatch(css,/clip-path/);
 const text=sceneTextRules(config(),{name:'.name_text',time:'.timestamp'});assert.match(text,/clip-path:inset/);assert.match(text,/var\(--sc-drag-y,0px\)/);assert.doesNotMatch(text,/mes_buttons|mes_edit_buttons|extraMesButtons/);
});
