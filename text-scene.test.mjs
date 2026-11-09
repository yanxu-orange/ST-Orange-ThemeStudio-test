import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {normalizeCaptionConfig,newCaption,textEntries} from './captions.mjs';
import {normalizeReasoningConfig} from './reasoning.mjs';
import {normalizeFooterConfig,validateFooterCaptions,newFooterCaption} from './footer.mjs';
import {normalizeNativeConfig} from './native.mjs';
import {validateTextItems} from './text-layout.mjs';
import {defaultPhoto} from './photos.mjs';
import {normalizeTextScene,resetSceneLayout,newSceneCaption,sceneGeometry,sceneWidth,itemWidth,itemPoint,sceneBounds,prepareScene,placeScene,sceneTextRules} from './text-scene.mjs';
const old=()=>({version:3,layout:'collage',cardWidth:680,avatarSize:88,headerHeight:240,font:'serif',accent:'#123456',nameSize:22,timeSize:12,timePosition:'beside',caption:'旧文案',captionPosition:'below',textItems:{name:{x:10,y:-20},time:{x:-4,y:2},caption:{x:10,y:-20}},photos:{ai:defaultPhoto({enabled:true}),user:defaultPhoto({enabled:true,widthPercent:35})}});
const normalize=c=>normalizeTextScene(normalizeNativeConfig(normalizeFooterConfig(normalizeReasoningConfig(normalizeCaptionConfig(c)))));
test('schema8 seeds old layouts once without writes and serialized coordinates are sole source',()=>{
 for(let version=1;version<=7;version++){
  let input=old();if(version>=4)input=normalizeCaptionConfig(input);if(version>=5)input=normalizeReasoningConfig(input);if(version>=6)input=normalizeFooterConfig(input);if(version>=7)input=normalizeNativeConfig(input);input.version=version;
  const raw=JSON.stringify(input),value=normalize(input);assert.equal(JSON.stringify(input),raw);assert.equal(value.version,8);assert.equal(value.textItems.name.x,59);assert.equal(value.textItems.name.y,20);assert.equal(value.textItems.time.x,70);assert.equal(value.textItems.time.y,42);assert.equal(value.textItems.name.width,'auto');assert.equal(value.captions[0].y,84);assert.equal(Object.hasOwn(value,'timePosition'),false);assert.equal(Object.hasOwn(value.captions[0],'position'),false);
  assert.deepEqual(normalize(JSON.parse(JSON.stringify(value))),value);
 }
 const c=normalize(old());assert.throws(()=>normalize({...c,timePosition:'below'}));assert.throws(()=>normalize({...c,captions:[{...c.captions[0],position:'above'}]}));assert.throws(()=>normalize({...c,textItems:{name:{...c.textItems.name,width:9},time:c.textItems.time}}));
 for(const [key,min,max]of [['x',-100,200],['y',-400,1600]]){const value=structuredClone(c);value.textItems.name[key]=max;assert.equal(normalize(value).textItems.name[key],max);value.textItems.name[key]=max+1;assert.throws(()=>normalize(value));value.textItems.name[key]=min-1;assert.throws(()=>normalize(value));}
});
test('auto and custom widths use full scene independently from x, layout content and target scope',()=>{
 const c=normalize(old()),a=c.captions[0];for(const width of [630,340])for(const x of [-100,0,49,200]){a.x=x;assert.equal(itemWidth(a,width),width);a.width=60;assert.equal(itemWidth(a,width),width*.6);a.width='auto';}
 const before=structuredClone(c.textItems);a.content='TO\nYOU\nWITH\nLOVE';a.size=116;a.width=100;a.font='monospace';c.captions.push(newSceneCaption(c));assert.deepEqual(c.textItems,before);
 for(const width of [630,340])for(const scope of ['ai','user']){const base=sceneGeometry(c,width,c.photos[scope]);a.size=200;a.content+='\n';assert.deepEqual(sceneGeometry(c,width,c.photos[scope]),base);}
 const points=Object.fromEntries(Object.entries(textEntries(c)).map(([key,v])=>[key,itemPoint(c,v,630)]));const addedKey='caption:'+c.captions[1].id;c.captions.splice(1);assert.deepEqual(Object.fromEntries(Object.entries(textEntries(c)).map(([key,v])=>[key,itemPoint(c,v,630)])),Object.fromEntries(Object.entries(points).filter(([key])=>key!==addedKey)));
 const switched=resetSceneLayout(c,'left');assert.equal(switched.textItems.name.x,25);assert.equal(switched.textItems.name.y,8);assert.equal(switched.captions[0].content,a.content);assert.deepEqual(c.textItems,before);
});
test('large header/footer captions share size range while footer retains sequential position limits',()=>{
 const c=normalize(old());for(const size of [8,116,200]){c.captions[0].size=size;assert.equal(normalize(c).captions[0].size,size);assert.equal(validateFooterCaptions([newFooterCaption({size})],{large:true})[0].size,size);}
 for(const size of [7,201]){c.captions[0].size=size;assert.throws(()=>normalize(c));assert.throws(()=>validateFooterCaptions([newFooterCaption({size})],{large:true}));}
 assert.throws(()=>validateFooterCaptions([newFooterCaption({y:401})],{large:true}));assert.equal(validateTextItems({name:{x:200,y:1600,width:100}},{stable:true}).name.width,100);assert.throws(()=>validateTextItems({name:{x:101}}));
});
test('measurement constrains width before reading and mapping uses final real offset parent without feeding bounds to base',()=>{
 const {document,window}=parseHTML('<html><body><div class="mes" is_user="false"><header><div id="parent"><span id="name" class="name_text">虚构名字</span><small id="time" class="timestamp">时间</small></div></header></div></body></html>'),msg=document.querySelector('.mes'),header=msg.querySelector('header'),parent=msg.querySelector('#parent'),name=msg.querySelector('#name'),time=msg.querySelector('#time'),c=normalize(old());
 c.textItems.name={...c.textItems.name,x:10,y:-30,width:50};c.textItems.time={...c.textItems.time,x:70,y:40,weight:700};c.captions=[];Object.defineProperty(msg,'clientWidth',{value:678});assert.equal(sceneWidth(msg,c),630);
 let height=120,reads=0;name.getBoundingClientRect=()=>{reads++;assert.equal(msg.style.getPropertyValue('--sc-width-name'),'315px');return {width:315,height};};time.getBoundingClientRect=()=>({width:200,height:18});header.getBoundingClientRect=()=>({left:100,top:200});parent.getBoundingClientRect=()=>({left:120,top:220});Object.defineProperties(parent,{clientLeft:{value:5},clientTop:{value:6},scrollLeft:{value:7},scrollTop:{value:8}});Object.defineProperty(name,'offsetParent',{value:parent});
 const set=(node,k,v)=>node.style.setProperty(k,v),nodes={name,time},g=prepareScene(msg,header,c,nodes,set);assert.equal(g.reserveTop,30);assert.equal(g.width,630);placeScene(msg,header,c,nodes,g,set);assert.equal(msg.style.getPropertyValue('--sc-left-name'),'45px');assert.equal(msg.style.getPropertyValue('--sc-top-name'),'-18px');
 height=600;const larger=prepareScene(msg,header,c,nodes,set);assert.equal(larger.baseHeight,g.baseHeight);assert.equal(larger.reserveTop,g.reserveTop);assert.ok(larger.height>g.height);placeScene(msg,header,c,nodes,larger,set);assert.equal(msg.style.getPropertyValue('--sc-top-name'),'-18px');assert.equal(reads,2);
 const css=sceneTextRules(c,{name:'.name_text',time:'.timestamp'});const style=document.createElement('style');style.textContent=css;document.head.append(style);const rule=[...style.sheet.cssRules].find(r=>r.selectorText==='.name_text');assert.ok(name.matches(rule.selectorText));assert.equal(rule.style.getPropertyValue('position'),'absolute');assert.equal(rule.style.getPropertyValue('width'),'var(--sc-width-name)');assert.equal(rule.style.getPropertyValue('font-weight'),'400');assert.equal(rule.style.getPropertyPriority('font-weight'),'important');assert.equal(rule.style.getPropertyValue('letter-spacing'),'normal');const timeRule=[...style.sheet.cssRules].find(r=>r.selectorText==='.timestamp');assert.equal(timeRule.style.getPropertyValue('font-weight'),'700');assert.equal(timeRule.style.getPropertyValue('letter-spacing'),'normal');
});

test('avatar geometry has a fixed origin independent of local layout presets',()=>{
 const c={...normalize(old()),headerHeight:60},p=defaultPhoto({enabled:true,scale:1.5,maxSize:300,widthPercent:65});
 const geometries=['top','left','collage'].map(layout=>sceneGeometry({...c,layout},630,p));assert.deepEqual(geometries[0],geometries[1]);assert.deepEqual(geometries[1],geometries[2]);assert.equal(geometries[0].photoTop,0);assert.equal(geometries[0].baseHeight,330);
});
