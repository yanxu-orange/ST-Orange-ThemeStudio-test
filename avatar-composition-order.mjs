import {imageKey,regionOrder} from './region-layers.mjs';

/** UI reads front-to-back; the stored regional stack reads back-to-front. */
export function avatarCompositionEntries(config,scope){
 const layers=new Map(config.layers.filter(l=>l.anchor==='avatar'&&(l.scope==='both'||l.scope===scope)).map(l=>[imageKey(l.id),l]));
 return regionOrder(config,'header').toReversed().filter(key=>key==='avatar'||layers.has(key)).map(key=>({key,layer:layers.get(key)||null}));
}

/** Move only the requested artwork, retaining every other item's relative order. */
export function reorderAvatarComposition(config,scope,key,index){
 const visible=avatarCompositionEntries(config,scope),source=visible.find(item=>item.key===key);
 if(!source?.layer||!Number.isInteger(index))throw Error('头像组合排序对象无效');
 const rest=visible.filter(item=>item.key!==key);
 if(index<0||index>rest.length)throw Error('头像组合排序位置无效');
 if(visible.findIndex(item=>item.key===key)===index)return regionOrder(config,'header');
 const order=regionOrder(config,'header').filter(item=>item!==key);
 if(index<rest.length){const target=order.indexOf(rest[index].key);order.splice(target+1,0,key);}
 else{const target=order.indexOf(rest.at(-1).key);order.splice(target,0,key);}
 return order;
}
