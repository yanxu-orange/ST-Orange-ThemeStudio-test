// Geometry stays in screen pixels; storage conversion belongs to the drag adapter.
export const ALIGNMENTS = [['left','靠左'],['centerX','水平居中'],['right','靠右'],['top','靠上'],['centerY','垂直居中'],['bottom','靠下']];
export function alignmentDelta(box,region,key){
 const x={left:region.left-box.left,centerX:(region.left+region.right-box.left-box.right)/2,right:region.right-box.right};
 const y={top:region.top-box.top,centerY:(region.top+region.bottom-box.top-box.bottom)/2,bottom:region.bottom-box.bottom};
 return Object.hasOwn(x,key)?{x:x[key],y:0}:Object.hasOwn(y,key)?{x:0,y:y[key]}:null;
}
export function translatedBox(box,x,y){return {left:box.left+x,right:box.right+x,top:box.top+y,bottom:box.bottom+y};}
export function regionSnap(box,region,threshold=6){
 const result={x:0,y:0,lines:[]};
 for(const [axis,keys] of [['x',['left','centerX','right']],['y',['top','centerY','bottom']]]){
  const values=keys.map(key=>({key,delta:alignmentDelta(box,region,key)[axis]})).filter(v=>Math.abs(v.delta)<=threshold).sort((a,b)=>Math.abs(a.delta)-Math.abs(b.delta));
  if(values.length){result[axis]=values[0].delta;result.lines.push(values[0].key);}
 }
 return result;
}
