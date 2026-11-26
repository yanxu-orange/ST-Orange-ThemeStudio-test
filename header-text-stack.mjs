import {captionMatchesScope} from './captions.mjs';
import {metadataItem,resolveMetadata} from './native-metadata.mjs';

export function validateHeaderTextStack(raw,captions){
  if(raw===undefined)return undefined;
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(key=>!['captionId','maxWidth'].includes(key))||typeof raw.captionId!=='string')throw Error('头像区文字排列无效');
  if(raw.maxWidth!==undefined&&(!Number.isFinite(raw.maxWidth)||raw.maxWidth<40||raw.maxWidth>1000))throw Error('纵排文字最大宽度超出范围');
  return {captionId:captions.some(c=>c.id===raw.captionId)?raw.captionId:'',...(raw.maxWidth!==undefined?{maxWidth:raw.maxWidth}:{})};
}

export function headerTextStack(c,user){
  if(!c.headerTextStack)return null;
  const custom=resolveMetadata(c,user), configured=c.captions.find(cap=>cap.id===c.headerTextStack.captionId);
  const caption=configured?.visible&&configured.content.trim()&&captionMatchesScope(configured,user)?configured:null;
  return {anchor:custom.name?.region==='header'?custom.name:metadataItem(c,'name'),maxWidth:c.headerTextStack.maxWidth,
    name:custom.name?.region!=='body-top',time:custom.time?.region!=='body-top',caption};
}

export const stackAnchorFactor={left:0,center:.5,right:1};
export function stackBoxGeometry(stack,cardWidth,padding){
  const inner=Math.max(1,cardWidth-padding*2),v=stack.anchor;
  const authored=v.width==='auto'?inner:inner*v.width/100;
  const width=Math.min(authored,stack.maxWidth??Infinity);
  const x=Math.max(0,padding+v.x*inner/100+(inner-width)*stackAnchorFactor[v.anchor]);
  const y=Math.max(0,padding+v.y);
  return {x,y,width:Math.max(0,Math.min(width,cardWidth-x))};
}

export const STACK_BOX={
  position:'relative',left:'var(--yj-stack-x)',top:'auto',right:'auto',bottom:'auto',
  display:'flex','box-sizing':'border-box','flex-direction':'column','flex-wrap':'nowrap','align-items':'stretch','justify-content':'flex-start',
  gap:'4px',width:'var(--yj-stack-width)',height:'auto','min-width':0,'max-width':'none',
  margin:0,padding:0,border:0,overflow:'visible','z-index':'auto',
};
export const STACK_MEMBER={
  position:'relative',left:'auto',top:'auto',right:'auto',bottom:'auto',flex:'none',width:'100%',
  'max-width':'100%','min-width':0,'min-height':0,margin:0,overflow:'clip','clip-path':'none',
};

export function stackCaptionClip(caption){
  return caption.scaleX>1?`inset(0 ${100*(1-1/caption.scaleX)}% 0 0)`:'none';
}
