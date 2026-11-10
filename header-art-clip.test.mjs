import {runLayoutPass} from './layout-pass.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {headerArtworkClipPolygon,updateHeaderArtworkClip,headerArtworkClipLayout} from './header-art-clip.mjs';
const points=s=>s.split(',').map(v=>v.split(' ').map(parseFloat));
function roundTrip(polygon,geometry,rw,rh){const {width:w,height:h,x,y,rotation}=geometry,a=rotation*Math.PI/180,expected=[[-24,-24],[rw+24,-24],[rw+24,rh],[-24,rh]];points(polygon).forEach(([u,v],i)=>{const dx=u-w/2,dy=v-h/2;for(const [actual,want]of [[x+w/2+Math.cos(a)*dx-Math.sin(a)*dy,expected[i][0]],[y+h/2+Math.sin(a)*dx+Math.cos(a)*dy,expected[i][1]]])assert.ok(Math.abs(actual-want)<.00002,`${actual} != ${want}`);});}
test('individual artwork clip inverse maps fixed header corners for rotations, sizes and positions',()=>{
 for(const rw of [222,292,712])for(const rh of [36,126,976])for(const width of [1,80,500])for(const height of [2,120,650])for(const rotation of [-180,-65,0,25,180])for(const x of [-350,0,600]){const g={width,height,x,y:x/2,rotation};roundTrip(headerArtworkClipPolygon(g,rw,rh),g,rw,rh);}
});
function image(){const {document}=parseHTML('<img style="z-index:19">');return document.querySelector('img');}
const layer={anchor:'header',side:'left',vertical:'top',x:0,y:0,offsetUnit:'px',rotation:30};
test('current inline styles drive percent right/bottom anchors during drag and pinch',()=>{
 const node=image(),l={...layer,side:'right',vertical:'bottom',offsetUnit:'percent',x:5,y:10};
 Object.assign(node.style,{width:'25%',height:'50%',right:'10%',bottom:'20%'});
 let polygon=updateHeaderArtworkClip(node,l,400,200);roundTrip(polygon,{width:100,height:100,x:260,y:60,rotation:30},400,200);
 Object.assign(node.style,{width:'50%',height:'80%',right:'-20%',bottom:'-30%'});
 polygon=updateHeaderArtworkClip(node,l,400,200);roundTrip(polygon,{width:200,height:160,x:280,y:100,rotation:30},400,200);
 Object.assign(node.style,{width:'10%',height:'10%',right:'0%',bottom:'0%'});
 polygon=updateHeaderArtworkClip(node,l,400,200);roundTrip(polygon,{width:40,height:20,x:360,y:180,rotation:30},400,200);
 assert.equal(node.style.zIndex,'19');assert.match(node.style.getPropertyValue('clip-path'),/^polygon\(/);assert.equal(l.x,5);
});
test('auto height uses actual loaded dimensions, then natural aspect ratio on load',()=>{
 const node=image();Object.assign(node.style,{width:'120px',height:'auto',left:'-12.5px',top:'37px'});
 assert.equal(updateHeaderArtworkClip(node,layer,300,100),null);assert.equal(node.style.getPropertyValue('clip-path'),'inset(50%)');
 Object.defineProperties(node,{naturalWidth:{value:80},naturalHeight:{value:120}});
 roundTrip(updateHeaderArtworkClip(node,layer,300,100),{width:120,height:180,x:-12.5,y:37,rotation:30},300,100);
 Object.defineProperty(node,'offsetHeight',{value:160});
 roundTrip(updateHeaderArtworkClip(node,layer,300,100),{width:120,height:160,x:-12.5,y:37,rotation:30},300,100);
});
test('non-header artwork remains untouched and invalid geometry never emits NaN',()=>{
 const node=image();node.style.setProperty('clip-path','inset(3px)');assert.equal(updateHeaderArtworkClip(node,{...layer,anchor:'avatar'},300,100),null);assert.equal(node.style.getPropertyValue('clip-path'),'inset(3px)');
 assert.equal(headerArtworkClipPolygon({width:0,height:10,x:0,y:0},300,100),null);assert.equal(headerArtworkClipPolygon({width:10,height:10,x:NaN,y:0},300,100),null);
});


test('header artwork batches computed dimensions before assigning any clip paths',()=>{
 const {document,window}=parseHTML('<img><img>'),nodes=[...document.querySelectorAll('img')];let reads=0;
 window.getComputedStyle=()=>{reads++;assert.ok(nodes.every(node=>!node.style.getPropertyValue('clip-path')));return {width:'120px',height:'80px'};};
 const polygons=runLayoutPass(nodes.map(node=>headerArtworkClipLayout(node,layer,300,100)));
 assert.equal(reads,2);assert.equal(polygons[0],polygons[1]);assert.ok(nodes.every(node=>node.style.getPropertyValue('clip-path')==='polygon('+polygons[0]+')'));
});
