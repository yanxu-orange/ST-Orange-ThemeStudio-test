import {assetUrl} from './catalog.mjs';
import {editImageSize,coverImage,imageDimensions,requireImageRegion,editImagePixels} from './image-sizing.mjs';
export function imageRegionForLayer(document,layer,{shadow,scope='ai'}={}){
 const role=layer.scope==='both'?scope:layer.scope;
 const candidates=[...document.querySelectorAll('[data-layer-id]'),...(shadow?.querySelectorAll('[data-layer-id]')||[])];
 const matches=n=>n.getAttribute('data-layer-id')===layer.id&&n.naturalWidth>0&&n.naturalHeight>0&&n.getClientRects?.().length&&n.offsetWidth>0&&n.offsetHeight>0&&(layer.anchor==='input'?Boolean(n.closest('#send_form')):Boolean(n.closest('.mes[data-otl-live], [data-orange-lab-fixture] .mes')));
 const sameRole=n=>layer.anchor==='input'||n.closest('.mes')?.getAttribute('is_user')===(role==='user'?'true':'false');
 const node=candidates.find(n=>matches(n)&&sameRole(n))||(layer.scope==='both'?candidates.find(matches):null);
 if(!node)throw Error('请先显示图片所在区域并等待图片加载，再调整尺寸。');
 const parent=node.offsetParent;if(!parent)throw Error('图片区域尚未准备好。');
 const cs=document.defaultView.getComputedStyle(parent);
 if(cs.display==='none'||cs.visibility==='hidden'||!(node.offsetWidth>0&&node.offsetHeight>0))throw Error('图片区域尚未显示。');
 return requireImageRegion({width:parent.clientWidth,height:parent.clientHeight,ratio:node.naturalWidth/node.naturalHeight,reference:layer.anchor==='input'?'输入区':node.closest('.mes')?.getAttribute('is_user')==='true'?'用户消息':'AI消息'});
}
export function renderImageSizing({container,layer,document,make,remember,apply,renderFields,notify,shadow,scope,isCurrent=()=>true}){
 const heading=make('h4','property-heading','尺寸与外观');container.append(heading);
 const hint=make('p','hint','百分比相对于图片所在区域。');try{const r=imageRegionForLayer(document,layer,{shadow,scope});if(layer.scope==='both'&&layer.anchor!=='input')hint.textContent+='以当前'+r.reference+'为换算参照。';}catch{}container.append(hint);
 let pending=0;
 const current=()=>isCurrent()&&heading.isConnected;
 const change=async(key,value,redraw=true)=>{
  const ticket=++pending;
  try{
   let next;
   try{const region=imageRegionForLayer(document,layer,{shadow,scope});next=key==='cover'?coverImage(layer,region):editImageSize(layer,key,value,region);}
   catch(error){
    if(!['width','height','lockRatio'].includes(key))throw error;
    const image=new Image(),src=layer.image||assetUrl(layer.asset);
    if(!src)throw error;image.src=src;await image.decode();
    if(ticket!==pending||!current()||src!==(layer.image||assetUrl(layer.asset)))return;
    next=editImagePixels(layer,key,value,image.naturalWidth/image.naturalHeight);
   }
   if(ticket!==pending||!current())return;
   remember();Object.assign(layer,next);apply();if(redraw)renderFields();
  }catch(error){if(current())notify(error.message);}
 };
 function select(label,value,options,key){const row=make('label','field'),title=make('span','field-title',label),input=make('select');input.setAttribute('aria-label',label);for(const [v,t]of options){const o=make('option','',t);o.value=v;input.append(o);}input.value=String(value);input.addEventListener('change',()=>change(key,key==='lockRatio'?input.value==='true':input.value));row.append(title,input);container.append(row);}
 function number(label,value,key,max=500){const row=make('label','field'),title=make('span','field-title',label),input=make('input');input.type='number';input.min=key.startsWith('focal')?'0':'1';input.max=String(max);input.step='0.01';input.value=String(value);input.setAttribute('aria-label',label);input.addEventListener('input',()=>{if(input.value!=='')change(key,Number(input.value),false);});input.addEventListener('change',()=>{if(input.value!=='')change(key,Number(input.value));});row.append(title,input);container.append(row);return input;}
 const s=layer.imageSizing;
 select('锁定图片比例',s?.lockRatio??true,[['true','锁定'],['false','自由变形']],'lockRatio');
 select('宽度单位',layer.widthUnit,[['px','像素'],['percent','区域百分比']],'widthUnit');
 let width=layer.width,height=s?.height??'';
 try{const region=imageRegionForLayer(document,layer,{shadow,scope}),d=imageDimensions(layer,region);width=d.width/(layer.widthUnit==='percent'?region.width/100:1);height=d.height/(s?.heightUnit==='percent'?region.height/100:1);}catch{}
 number('素材宽度',Math.round(width*100)/100,'width');
 select('图片高度单位',s?.heightUnit??'px',[['px','像素'],['percent','区域百分比']],'heightUnit');
 const heightInput=number('图片高度',height===''?'':Math.round(height*100)/100,'height');
 if(height===''&&typeof Image!=='undefined'){
  const probe=new Image(),source=layer.image||assetUrl(layer.asset);
  const clear=()=>{probe.onload=null;probe.onerror=null;};
  probe.onload=()=>{clear();if(!current()||source!==(layer.image||assetUrl(layer.asset))||heightInput.value!==''||document.activeElement===heightInput||shadow?.activeElement===heightInput)return;
   let value;try{const r=imageRegionForLayer(document,layer,{shadow,scope});value=imageDimensions(layer,r).height/(s?.heightUnit==='percent'?r.height/100:1);}catch{if(layer.widthUnit==='px'&&!layer.heightPercent&&!s&&probe.naturalWidth>0)value=layer.width*probe.naturalHeight/probe.naturalWidth;}
   if(Number.isFinite(value))heightInput.value=String(Math.round(value*100)/100);
  };probe.onerror=clear;if(source)probe.src=source;else clear();
 }

 const cover=make('button','','铺满区域');cover.type='button';cover.addEventListener('click',()=>change('cover'));container.append(cover);
 if(s?.fit==='cover'){container.append(make('p','hint','等比铺满并裁去超出部分；调整宽高将切回手动尺寸。'));number('取景横向位置',s.focalX,'focalX',100);number('取景纵向位置',s.focalY,'focalY',100);}
}
