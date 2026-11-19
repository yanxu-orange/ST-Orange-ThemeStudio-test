import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {createSchemeModel} from './scheme-model.mjs';
import {enableHeaderCanvas} from './header-canvas.mjs';
import {transferHeaderLayer} from './header-layer-transfer.mjs';
import {newLayer} from './layers.mjs';
function fixture(){
 const {document}=parseHTML('<div class="mes" data-otl-live is_user="false"><div class="art"><img data-layer-id="transfer"></div><div class="otl-footer-scene"></div></div>');
 const msg=document.querySelector('.mes'),art=document.querySelector('.art'),image=document.querySelector('img'),footer=document.querySelector('.otl-footer-scene');
 let parent=art;const dims=(n,w,h)=>{Object.defineProperty(n,'clientWidth',{value:w,configurable:true});Object.defineProperty(n,'clientHeight',{value:h,configurable:true});};dims(msg,1000,800);dims(art,920,450);dims(footer,900,300);
 Object.defineProperty(image,'offsetParent',{get:()=>parent});Object.defineProperty(image,'offsetWidth',{value:1000,configurable:true});Object.defineProperty(image,'offsetHeight',{value:300,configurable:true});
 const config=enableHeaderCanvas(createSchemeModel().templates.blank,600),layer=newLayer('asset',{id:'transfer',asset:'shared-spring-flower-stem',width:600,anchor:'header',x:80,y:20});
 return {document,config,layer,image,footer,setParent:n=>parent=n};
}
test('600 design-pixel image crosses to legacy region via percent without violating 500 limit',()=>{
 const f=fixture(),n=transferHeaderLayer(f.document,f.config,f.layer,'footer');assert.equal(n.widthUnit,'percent');assert.ok(Math.abs(n.width/100*900-1000)<1e-8);assert.ok(Math.abs(n.x-80*1000/600)<1e-8);assert.equal(n.imageSizing.height,300);assert.equal(f.layer.anchor,'header');
 f.setParent(f.footer);const back=transferHeaderLayer(f.document,f.config,n,'header');assert.equal(back.widthUnit,'px');assert.equal(back.width,600);assert.ok(Math.abs(back.x-80)<1e-8);assert.equal(back.imageSizing.height,180);
});
test('missing destination fails visibly without modifying the source',()=>{
 const f=fixture(),before=structuredClone(f.layer);assert.throws(()=>transferHeaderLayer(f.document,f.config,f.layer,'reasoning-body'),/目标区域/);assert.deepEqual(f.layer,before);
});
