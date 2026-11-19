import {canvasEnabled,headerCanvasScale,designInnerWidth} from './header-canvas.mjs';
import {validateLayers} from './layers.mjs';
import {photoDimensions} from './photos.mjs';
// Crossing the design/display boundary is an explicit edit, never a resize side effect.
export function transferHeaderLayer(document,config,layer,anchor,scope='ai'){
 const oldDesign=canvasEnabled(config)&&['header','avatar'].includes(layer.anchor),newDesign=canvasEnabled(config)&&['header','avatar'].includes(anchor);
 if(oldDesign===newDesign)return {...layer,anchor};
 const role=layer.scope==='both'?scope:layer.scope;
 const image=[...document.querySelectorAll('[data-layer-id]')].find(n=>n.dataset.layerId===layer.id&&(layer.anchor==='input'||n.closest('.mes')?.getAttribute('is_user')===String(role==='user')));
 const msg=image?.closest('.mes')||document.querySelector(`.mes[data-otl-live][is_user="${role==='user'}"]`),parent=image?.offsetParent;
 if(!image||!parent||!(image.offsetWidth>0&&image.offsetHeight>0&&parent.clientWidth>0&&parent.clientHeight>0))throw Error('请先显示这张图片，再切换定位区域。');
 const css=document.defaultView?.getComputedStyle?.(image),renderedWidth=parseFloat(css?.width)||image.offsetWidth,renderedHeight=parseFloat(css?.height)||image.offsetHeight;
 const actualScale=msg?headerCanvasScale(config,msg.clientWidth):1,oldScale=oldDesign?actualScale:1,newScale=newDesign?actualScale:1;
 let region;
 if(newDesign){if(!msg)throw Error('请先显示目标头像区。');const width=designInnerWidth(config),height=(role==='user'?config.userHeaderHeight??config.headerHeight:config.headerHeight)-(config.cardPadding??24);region=anchor==='header'?{width,height}:config.avatarFill[role].enabled?{width:config.headerCanvas.width,height:role==='user'?config.userHeaderHeight??config.headerHeight:config.headerHeight}:photoDimensions(config.photos[role],width);}
 else {const target=anchor==='input'?document.querySelector('#send_form'):anchor==='message'?msg:anchor==='footer'?msg?.querySelector('.otl-footer-scene'):anchor==='reasoning-entry'?msg?.querySelector('.mes_reasoning_header'):anchor==='reasoning-body'?msg?.querySelector('.mes_reasoning'):null;region=target&&{width:target.clientWidth,height:target.clientHeight};}
 if(!region||!(region.width>0&&region.height>0))throw Error('请先显示目标区域，再切换图片位置。');
 if(newDesign&&(renderedWidth/newScale>4000||renderedHeight/newScale>4000))throw Error('换算后的图片超出制作画布支持的范围，已保留原位置。');
 const next=structuredClone(layer),dimension=(value,basis,limit)=>value<=limit?{value,unit:'px'}:{value:value/basis*100,unit:'percent'};
 const size=dimension(renderedWidth/newScale,region.width,newDesign?4000:500),high=dimension(renderedHeight/newScale,region.height,newDesign?4000:500);
 next.anchor=anchor;next.width=size.value;next.widthUnit=size.unit;
 const x=layer.x*(layer.offsetUnit==='percent'?parent.clientWidth/100:oldScale)/newScale,y=layer.y*(layer.offsetUnit==='percent'?parent.clientHeight/100:oldScale)/newScale;
 if(newDesign||x>=-300&&x<=600&&y>=-300&&y<=600){next.offsetUnit='px';next.x=x;next.y=y;}else{next.offsetUnit='percent';next.x=x/region.width*100;next.y=y/region.height*100;}
 if(layer.kind==='shape'){next.height=high.value;next.heightUnit=high.unit;next.cornerRadius=layer.cornerRadius*oldScale/newScale;}
 else {next.heightPercent=0;next.imageSizing={mode:'manual',fit:layer.imageSizing?.fit??'contain',height:high.value,heightUnit:high.unit,lockRatio:layer.imageSizing?.lockRatio??true,ratio:renderedWidth/renderedHeight,driver:'width',focalX:layer.imageSizing?.focalX??50,focalY:layer.imageSizing?.focalY??50};}
 if(anchor==='input')next.scope='both';
 try{return validateLayers([next],{pixels:config.version===11||(config.version===12&&!!config.headerCanvas)})[0];}catch{throw Error('换算后的图片超出目标区域支持的范围，已保留原位置。');}
}
