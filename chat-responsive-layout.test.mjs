import test from 'node:test';
import assert from 'node:assert/strict';
import {createSchemeModel} from './scheme-model.mjs';
import {enableHeaderCanvas,projectHeaderConfig} from './header-canvas.mjs';
import {metadataItem} from './native-metadata.mjs';
import {avatarClipPolygon,sceneGeometry} from './text-scene.mjs';
import {avatarArtworkFrameStyle} from './avatar-art.mjs';
import {avatarDesignRules} from './avatar-design.mjs';
import {avatarEffectRules,chooseAvatarFrame} from './avatar-effects.mjs';
import {cardPadding,sharedChatWidthRules} from './body-card.mjs';
import {headerTextStack,stackBoxGeometry} from './header-text-stack.mjs';
import {captureCombination,applyCombination} from './region-combinations.mjs';
import {compilePageHeaders} from './theme-export/engine/headers/compile-page-headers.mjs';

const model=createSchemeModel();
const old=model.validate(model.templates.blank);
function sample(){
  const c=enableHeaderCanvas(old,600);
  Object.assign(c,{chatMaxWidth:640,headerHeight:210,cardPadding:14});
  c.headerTextStack={captionId:'',maxWidth:126};
  c.metadata.unified.name={...metadataItem(c,'name'),x:12,y:32,width:240,anchor:'right'};
  Object.assign(c.photos.ai,{size:32,widthUnit:'percent',height:'auto',ratio:'1',rotation:-7,y:25,verticalAnchor:'bottom'});
  Object.assign(c.photos.user,{size:40,widthUnit:'percent',height:280,y:-30,verticalAnchor:'bottom'});
  return model.validate(c);
}

test('opt-in values survive scheme and region combination round trips with old defaults',()=>{
  const c=sample();
  assert.deepEqual(model.validate(JSON.parse(JSON.stringify(c))),c);
  assert.equal(old.chatMaxWidth,undefined);
  assert.equal(old.photos.ai.verticalAnchor,undefined);
  assert.equal(old.headerTextStack,undefined);
  const applied=model.validate(applyCombination(c,captureCombination(c,'header')));
  assert.equal(applied.headerTextStack.maxWidth,126);
  assert.equal(applied.photos.ai.verticalAnchor,'bottom');
  assert.equal(applied.photos.ai.y,25);
  const manual=model.validate(applyCombination(c,captureCombination(enableHeaderCanvas(old,600),'header')));
  assert.equal(manual.photos.ai.verticalAnchor,undefined);
  assert.equal(manual.chatMaxWidth,640);
  const invalid=structuredClone(c);
  invalid.photos.ai.verticalAnchor='outside';
  assert.throws(()=>model.validate(invalid),/头像纵向定位/);
  assert.throws(()=>model.validate({...c,chatMaxWidth:200}),/最大宽度/);
  assert.throws(()=>model.validate({...c,headerTextStack:{captionId:'',maxWidth:12}}),/最大宽度/);
});

test('portrait, attached material and rotated clip share bottom alignment at either size',()=>{
  const c=sample();
  for(const width of [378,630]){
    const frame=projectHeaderConfig(c,width),pad=cardPadding(frame),inner=width-pad*2;
    const photo=frame.photos.ai,g=sceneGeometry(frame,inner,photo),top=pad+g.photoShiftY;
    assert.ok(Math.abs(top+g.photoHeight-g.baseHeight)<1e-9);
    const art=avatarArtworkFrameStyle(frame,false,{...g,reserveTop:0},3);
    assert.match(art.transform,new RegExp(String(g.photoShiftY).replace('.','\\.')+'px'));
    const [x,y]=avatarClipPolygon(frame,g,photo).split(',')[0].split(' ').map(parseFloat);
    const radians=photo.rotation*Math.PI/180,ox=g.photoWidth*.5,oy=g.photoHeight;
    const px=pad+photo.x+ox+(x-ox)*Math.cos(radians)-(y-oy)*Math.sin(radians);
    const py=top+oy+(x-ox)*Math.sin(radians)+(y-oy)*Math.cos(radians);
    assert.ok(Math.abs(px)<.001&&Math.abs(py)<.001);
    const tall=sceneGeometry(frame,inner,frame.photos.user,false,true);
    assert.ok(tall.photoHeight>tall.baseHeight);
    assert.equal(pad+tall.photoShiftY,0);
    const filled={...frame,avatarFill:{...frame.avatarFill,ai:{...frame.avatarFill.ai,enabled:true}}};
    const fill=sceneGeometry(filled,inner,photo);
    assert.equal(fill.photoWidth,width);
    assert.equal(fill.photoHeight,frame.headerHeight);
    assert.equal(fill.photoShiftY,undefined);
  }
  assert.match(avatarDesignRules('.mes',c),/translate\([^;]*var\(--ol-photo-y\)\)/);
  chooseAvatarFrame(c,'ai','frame-double');
  const transforms=[...avatarEffectRules('.mes',c).matchAll(/transform:([^;]+)!important/g)].map(v=>v[1]);
  assert.ok(transforms.length>=2);
  assert.ok(transforms.every(v=>v.includes('var(--ol-photo-y)')));
});

test('stack maximum is fixed rendered width, applied before right-anchor positioning',()=>{
  const c=sample();
  for(const width of [280,600,900]){
    const frame=projectHeaderConfig(c,width),pad=cardPadding(frame),s=headerTextStack(frame,false);
    const box=stackBoxGeometry(s,width,pad);
    assert.equal(box.width,Math.min(c.metadata.unified.name.width*width/600,126));
    assert.ok(Math.abs(box.x+box.width-(width-pad+12*width/600))<1e-9);
  }
});

test('compiler scopes the common cap to both native panels and uses opted CSS only',async()=>{
  const c=sample(),target={name:'普通头像贴底'};
  const compiled=await compilePageHeaders(c,{target});
  assert.equal(compiled.ok,true,JSON.stringify(compiled.diagnostics));
  const header=compiled.sections.header;
  assert.ok(header.includes(sharedChatWidthRules(c)));
  assert.match(header,/#sheld > #chat,#sheld > #form_sheld\{[^}]*max-width:640px!important/);
  assert.match(header,/--yj-stack-width:max\(0px,min\(min\(calc\(240 \* var\(--yj-header-unit\)\),126px\)/);
  assert.match(header,/transform:translate\([^;]*calc\(max\(0px,/);
  const prior=await compilePageHeaders(old,{target});
  assert.equal(prior.ok,true);
  assert.doesNotMatch(prior.sections.header,/#sheld > #form_sheld/);
  assert.doesNotMatch(prior.sections.header,/transform:translate\([^;]*calc\(max\(0px,/);
});
