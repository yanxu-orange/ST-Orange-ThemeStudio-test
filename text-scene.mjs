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
 const fill=fillSettings(c,user),areaWidth=width+CARD_PADDING*2;
 if(fill.enabled&&!hidden)return {width,baseHeight:c.headerHeight,photoWidth:areaWidth,photoHeight:c.headerHeight,photoTop:-CARD_PADDING};
 const photoWidth=hidden?0:p.size,photoHeight=photoWidth/Number(p.ratio);
 return {width,baseHeight:c.headerHeight,photoWidth,photoHeight,photoTop:0};
}
export function itemPoint(c,item,width){return {x:width*(item.x+(c.textInset??0))/100,y:item.y+(c.textTop??0)};}
export function itemWidth(item,width){return item.width==='auto'?width:width*item.width/100;}
// Region height is the user's total height. Content never reserves extra space.
export function sceneBounds(c,g){return {reserveTop:0,height:c.headerHeight};}
/** Clip a transformed avatar to the fixed header without moving native DOM nodes. */
export function avatarClipPolygon(c,g,p,user=false){
 const fill=fillSettings(c,user).enabled,angle=(fill?0:p.rotation)*Math.PI/180,scale=fill?1:p.scale,cos=Math.cos(angle),sin=Math.sin(angle);
 const w=g.photoWidth,h=g.photoHeight,ox=w/2,oy=h,x=fill?0:CARD_PADDING+p.x,y=fill?0:CARD_PADDING-p.y;
 return [[0,0],[g.width+CARD_PADDING*2,0],[g.width+CARD_PADDING*2,c.headerHeight],[0,c.headerHeight]].map(([px,py])=>{
  const dx=px-x-ox,dy=py-y-oy;
  return `${Number((ox+(cos*dx+sin*dy)/scale).toFixed(4))}px ${Number((oy+(-sin*dx+cos*dy)/scale).toFixed(4))}px`;
 }).join(',');
}

export function sceneTextRules(c,selectors){const items=textEntries(c),tokens=textTokens(c);return Object.entries(selectors).map(([key,selector])=>{const item=items[key],token=tokens[key];return `${selector}{font-weight:${item.weight==='auto'?400:item.weight}!important;letter-spacing:normal!important;position:absolute!important;left:var(--sc-left-${token},0px)!important;top:var(--sc-top-${token},0px)!important;box-sizing:border-box!important;width:${item.width==='auto'?'max-content':`var(--sc-width-${token})`}!important;min-width:0!important;max-width:var(--sc-width-${token})!important;flex:none!important;margin:0!important;white-space:pre-wrap!important;overflow-wrap:anywhere;text-align:${c.textAlign}!important;z-index:${item.z}!important;clip-path:inset(calc(var(--sc-clip-top-${token}) - var(--sc-drag-y,0px)) calc(100% - var(--sc-clip-right-${token}) + var(--sc-drag-x,0px)) calc(100% - var(--sc-clip-bottom-${token}) + var(--sc-drag-y,0px)) calc(var(--sc-clip-left-${token}) - var(--sc-drag-x,0px)))!important;}`;}).join('\n');}
export function sceneFrameRules(q,header){return `${header}{position:relative!important;display:block!important;box-sizing:border-box!important;width:calc(100% + 48px)!important;padding:0!important;height:var(--sc-total-height)!important;min-height:var(--sc-total-height)!important;max-height:var(--sc-total-height)!important;margin-top:-24px!important;margin-bottom:14px!important;margin-left:-24px!important;margin-right:-24px!important;overflow:visible!important;}
${q} .otl-scene-art{position:absolute!important;left:24px!important;top:24px!important;width:calc(100% - 48px)!important;height:var(--sc-inner-height)!important;pointer-events:none;}
`;}
/** Assign shared geometry without measuring content or changing the saved positions. */
export function prepareScene(msg,header,c,nodes,set,hidden=false){
 const g=sceneGeometry(c,sceneWidth(msg,c),c.photos[msg.getAttribute('is_user')==='true'?'user':'ai'],hidden,msg.getAttribute('is_user')==='true'),items=textEntries(c),tokens=textTokens(c);
 for(const [key,item]of Object.entries(items))set(msg,'--sc-width-'+tokens[key],itemWidth(item,g.width)+'px');
 const bounds=sceneBounds(c,g);set(msg,'--sc-avatar-clip',avatarClipPolygon(c,g,c.photos[msg.getAttribute('is_user')==='true'?'user':'ai'],msg.getAttribute('is_user')==='true'));for(const [key,value]of Object.entries({'fill-height':g.photoHeight,'base-height':g.baseHeight,'inner-height':Math.max(0,g.baseHeight-CARD_PADDING),'reserve-top':bounds.reserveTop,'total-height':bounds.height}))set(msg,'--sc-'+key,value+'px');return {...g,...bounds};
}
export function placeScene(msg,header,c,nodes,g,set){
 const r=header.getBoundingClientRect(),items=textEntries(c),tokens=textTokens(c);for(const [key,node]of Object.entries(nodes)){if(!node)continue;const point=itemPoint(c,items[key],g.width),p={x:point.x+CARD_PADDING,y:point.y+CARD_PADDING},parent=node.offsetParent||node.parentElement,rect=parent.getBoundingClientRect(),ox=rect.left+(parent.clientLeft||0)-(parent.scrollLeft||0),oy=rect.top+(parent.clientTop||0)-(parent.scrollTop||0);for(const [edge,value]of Object.entries({left:-p.x,top:-p.y,right:g.width+CARD_PADDING*2-p.x,bottom:g.height-p.y}))set(msg,'--sc-clip-'+edge+'-'+tokens[key],value+'px');set(msg,'--sc-left-'+tokens[key],(r.left+(header.clientLeft||0)+p.x-ox)+'px');set(msg,'--sc-top-'+tokens[key],(r.top+(header.clientTop||0)+g.reserveTop+p.y-oy)+'px');}
}
export function sceneSelectors(prefix,meta,c){return {name:prefix+' .name_text',time:prefix+' .timestamp',...Object.fromEntries(c.captions.map(v=>[captionKey(v.id),meta+` [data-caption-id="${v.id}"]`]))};}
