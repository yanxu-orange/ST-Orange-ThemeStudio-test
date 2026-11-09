import {fillSettings} from './avatar-fill.mjs';
import {clone} from './layers.mjs';
import {captionKey,newCaption,textEntries,textTokens} from './captions.mjs';
export const TITLE_SIZE_MIN=8,TITLE_SIZE_MAX=200;
export const HEAD_X_MIN=-100,HEAD_X_MAX=200,HEAD_Y_MIN=-400,HEAD_Y_MAX=1600;
export const CARD_PADDING=24;
export function seedTextPositions(c,{offsets=true}={}){
 const out=clone(c),layout=out.layout||'top',x=layout==='collage'?49:layout==='left'?25:0,top=layout==='top'?(out.avatarSize||88)+30:layout==='collage'?40:8;
 const above=out.captions.filter(v=>v.position==='above'),below=out.captions.filter(v=>v.position!=='above');const place=(v,bx,by)=>{v.x=bx+(offsets?v.x:0);v.y=by+(offsets?v.y:0);};
 above.forEach((v,i)=>place(v,x,top+i*32));const nameY=top+above.length*32;place(out.textItems.name,x,nameY);place(out.textItems.time,x+(out.timePosition==='beside'?25:0),nameY+(out.timePosition==='beside'?0:32));below.forEach((v,i)=>place(v,x,nameY+64+i*32));
 for(const v of out.captions)delete v.position;delete out.timePosition;return out;
}
export function normalizeTextScene(c){
 if(!c||![4,5,6,7,8,9,10].includes(c.version))throw Error('文字场景版本无效');
 if(c.version>=8){if(Object.hasOwn(c,'timePosition')||c.captions.some(v=>Object.hasOwn(v,'position')))throw Error('新版方案不能包含旧文字排布镜像');return clone(c);}
 const out=seedTextPositions(c);for(const v of Object.values(out.textItems))v.width='auto';out.version=8;return out;
}
export function newSceneCaption(c,overrides={}){const v=newCaption({font:c.font,color:c.accent,...overrides});delete v.position;const last=Math.max(0,c.textItems.name.y,c.textItems.time.y,...c.captions.map(v=>v.y));return {...v,x:c.layout==='collage'?49:c.layout==='left'?25:0,y:Math.min(HEAD_Y_MAX,last+32),...overrides};}
export function resetSceneLayout(c,layout){return seedTextPositions({...clone(c),layout,timePosition:'below'},{offsets:false});}
export function sceneWidth(msg,c){return Math.max(1,(msg.clientWidth||c.cardWidth)-CARD_PADDING*2);}
export function sceneGeometry(c,width,p,hidden=false,user=false){
 const fill=fillSettings(c,user);if(fill.enabled&&!hidden)return {width,baseHeight:c.headerHeight,photoWidth:width+CARD_PADDING*2,photoHeight:c.headerHeight+CARD_PADDING,photoTop:-CARD_PADDING};
 const photoWidth=hidden?0:p.enabled?Math.max(70,Math.min(width*p.widthPercent/100,p.maxSize)):c.avatarSize,photoHeight=p.enabled?photoWidth/Number(p.ratio):photoWidth;
 const normal=c.layout==='collage'?Math.min(c.headerHeight,Math.max(180,c.headerHeight*width/390)):c.headerHeight,baseHeight=hidden?Math.max(4,c.headerHeight):Math.max(normal,(c.layout==='collage'?photoHeight*(p.enabled?p.scale:1):photoHeight)+(c.layout==='top'?35:30));
 return {width,baseHeight,photoWidth,photoHeight,photoTop:c.layout==='collage'?baseHeight-photoHeight-30:c.layout==='left'?4:0};
}
export function itemPoint(c,item,width){return {x:width*(item.x+(c.textInset??0))/100,y:item.y+(c.textTop??0)};}
export function itemWidth(item,width){return item.width==='auto'?width:width*item.width/100;}
export function sceneBounds(c,g,measurements){
 let top=0,bottom=g.baseHeight;for(const {item,width,height,visible=true}of measurements){if(!visible||!width||!height)continue;const p=itemPoint(c,item,g.width);top=Math.min(top,p.y);bottom=Math.max(bottom,p.y+height);}
 const reserveTop=Math.max(0,Math.ceil(-top));return {reserveTop,height:reserveTop+Math.ceil(bottom)};
}
export function sceneTextRules(c,selectors){const items=textEntries(c),tokens=textTokens(c);return Object.entries(selectors).map(([key,selector])=>{const item=items[key],token=tokens[key];return `${selector}{font-weight:${item.weight==='auto'?400:item.weight}!important;letter-spacing:normal!important;position:absolute!important;left:var(--sc-left-${token},0px)!important;top:var(--sc-top-${token},0px)!important;box-sizing:border-box!important;width:${item.width==='auto'?'max-content':`var(--sc-width-${token})`}!important;min-width:0!important;max-width:var(--sc-width-${token})!important;flex:none!important;margin:0!important;white-space:pre-wrap!important;overflow-wrap:anywhere;text-align:${c.textAlign}!important;z-index:${item.z}!important;}`;}).join('\n');}
export function sceneFrameRules(q,header){return `${header}{position:relative!important;display:block!important;box-sizing:border-box!important;width:100%!important;padding:0!important;min-height:var(--sc-total-height,0px)!important;margin-top:0!important;overflow:visible!important;}
${q} .otl-scene-art{position:absolute!important;left:0!important;top:var(--sc-reserve-top,0px)!important;width:100%!important;height:var(--sc-base-height,0px)!important;pointer-events:none;}

`;}
/** Width first, then font-driven dimensions; position never becomes stored model data. */
export function prepareScene(msg,header,c,nodes,set,hidden=false){
 const g=sceneGeometry(c,sceneWidth(msg,c),c.photos[msg.getAttribute('is_user')==='true'?'user':'ai'],hidden,msg.getAttribute('is_user')==='true'),items=textEntries(c),tokens=textTokens(c);
 for(const [key,item]of Object.entries(items))set(msg,'--sc-width-'+tokens[key],itemWidth(item,g.width)+'px');
 const measurements=Object.entries(nodes).filter(([,node])=>node).map(([key,node])=>{const r=node.getBoundingClientRect(),css=node.ownerDocument.defaultView?.getComputedStyle?.(node);return {item:items[key],width:r.width,height:r.height,visible:!node.hidden&&css?.display!=='none'&&!(key.startsWith('caption:')&&!items[key].visible)};});
 const bounds=sceneBounds(c,g,measurements);for(const [key,value]of Object.entries({'fill-height':g.photoHeight,'base-height':g.baseHeight,'reserve-top':bounds.reserveTop,'total-height':bounds.height}))set(msg,'--sc-'+key,value+'px');return {...g,...bounds};
}
export function placeScene(msg,header,c,nodes,g,set){
 const r=header.getBoundingClientRect(),items=textEntries(c),tokens=textTokens(c);for(const [key,node]of Object.entries(nodes)){if(!node)continue;const p=itemPoint(c,items[key],g.width),parent=node.offsetParent||node.parentElement,rect=parent.getBoundingClientRect(),ox=rect.left+(parent.clientLeft||0)-(parent.scrollLeft||0),oy=rect.top+(parent.clientTop||0)-(parent.scrollTop||0);set(msg,'--sc-left-'+tokens[key],(r.left+(header.clientLeft||0)+p.x-ox)+'px');set(msg,'--sc-top-'+tokens[key],(r.top+(header.clientTop||0)+g.reserveTop+p.y-oy)+'px');}
}
export function sceneSelectors(prefix,meta,c){return {name:prefix+' .name_text',time:prefix+' .timestamp',...Object.fromEntries(c.captions.map(v=>[captionKey(v.id),meta+` [data-caption-id="${v.id}"]`]))};}
