/** One bottom-to-top stack per editable region. Item z values are not ordering sources. */
export const ORDER_REGIONS=Object.freeze(['header','overall','reasoning','footer','input']);
export const imageKey=id=>'image:'+id;
export function regionForImage(layer){return layer?.anchor==='input'?'input':layer?.anchor==='footer'?'footer':layer?.anchor?.startsWith('reasoning-')?'reasoning':layer?.anchor==='message'?'overall':'header';}
const checkRegion=region=>{if(!ORDER_REGIONS.includes(region))throw Error('图层区域无效');};
const descriptor=(key,kind,id,label,item,scope='both')=>({key,kind,id,label,scope,visible:item?.visible!==false,item});
function candidates(c,region){
 checkRegion(region);
 const images=(c.layers||[]).filter(item=>regionForImage(item)===region).map(item=>descriptor(imageKey(item.id),'image',item.id,item.name||'图片',item,item.scope));
 if(region==='header')return [
  descriptor('avatar','avatar','avatar','头像',null),
  descriptor('name','text','name','名字',c.textItems?.name),
  descriptor('time','text','time','时间',c.textItems?.time),
  ...(c.captions||[]).map(item=>descriptor('caption:'+item.id,'text','caption:'+item.id,item.name||'文案',item,item.scope)),
  ...images,
 ];
 if(region==='footer')return [...(c.footerCaptions||[]).map(item=>descriptor('footer:'+item.id,'text','footer:'+item.id,item.name||'文案',item,item.scope)),...images];
 return images;
}
/** Retain surviving order, discard removed/moved IDs, and append new items on top. */
export function regionOrder(c,region){
 const keys=candidates(c,region).map(item=>item.key),allowed=new Set(keys),seen=new Set(),result=[];
 for(const key of [...(Array.isArray(c.regionOrder?.[region])?c.regionOrder[region]:[]),...keys])if(allowed.has(key)&&!seen.has(key)){seen.add(key);result.push(key);}
 return result;
}
/** Independent arrays make history/saved snapshots safe without mutating artwork or text. */
export function syncRegionOrder(c){return {...c,regionOrder:Object.fromEntries(ORDER_REGIONS.map(region=>[region,regionOrder(c,region)]))};}
export function regionEntries(c,region){const entries=new Map(candidates(c,region).map(item=>[item.key,item]));return regionOrder(c,region).map(key=>entries.get(key));}
export function regionZ(c,region,key){const index=regionOrder(c,region).indexOf(key);if(index===-1)throw Error('区域中找不到图层');return index+1;}
export function canMoveRegionItem(c,region,key,direction){
 if(!['up','down','top','bottom'].includes(direction))throw Error('图层移动方向无效');
 const order=regionOrder(c,region),index=order.indexOf(key);
 return index!==-1&&(['up','top'].includes(direction)?index<order.length-1:index>0);
}
export function moveRegionItem(c,region,key,direction){
 if(!['up','down','top','bottom'].includes(direction))throw Error('图层移动方向无效');
 const next=syncRegionOrder(c),order=next.regionOrder[region];checkRegion(region);
 const index=order.indexOf(key);if(index===-1)throw Error('区域中找不到图层');
 const target=direction==='top'?order.length-1:direction==='bottom'?0:Math.min(order.length-1,Math.max(0,index+(direction==='up'?1:-1)));
 order.splice(index,1);order.splice(target,0,key);return next;
}
/** Import validation is strict. Missing, stale, foreign and duplicate IDs are invalid. */
export function validateRegionOrder(raw,c){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).length!==ORDER_REGIONS.length||Object.keys(raw).some(key=>!ORDER_REGIONS.includes(key)))throw Error('区域图层顺序无效');
 return Object.fromEntries(ORDER_REGIONS.map(region=>{
  const keys=candidates(c,region).map(item=>item.key),list=raw[region];
  if(!Array.isArray(list)||list.length!==keys.length||new Set(list).size!==list.length||list.some(key=>typeof key!=='string'||!keys.includes(key)))throw Error('区域图层顺序无效：'+region);
  return [region,[...list]];
 }));
}
