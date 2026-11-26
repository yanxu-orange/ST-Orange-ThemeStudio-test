import {compositionScale} from '../../../../avatar-effects.mjs';
import {avatarClipPath,inverseRotate} from '../../header/regions/header-geometry.mjs';
import {headerArtBox} from './header-art-geometry.mjs';
import {rule} from '../../core/regions/shared.mjs';

export function avatarArtworkLeafCss(selector,c,layer,role,g,ctx,z){
 const field=ctx.firstField('layers.'+c.layers.indexOf(layer)+'.');
 const photo={...g,W:g.photoWidth,H:g.photoHeight,inner:g.photoWidth,P:'0px'};
 const box=headerArtBox(c,layer,photo,ctx.image(field));
 const scale=compositionScale(c,role==='user'),[ox,oy]=g.photoOrigin;
 const center=[`calc(${box.width} / 2)`,`calc(${box.height} / 2)`];
 const offset=[box.left,box.top];
 const intoPhoto=(value,index)=>`calc(${value} - ${offset[index]} - ${center[index]})`;
 const clip=avatarClipPath(g,corner=>inverseRotate(g.inversePhoto(corner,scale).map(intoPhoto),layer.rotation)
  .map((value,index)=>`calc(${center[index]} + ${value})`));

 // The independent slot uses the photo pivot first and the artwork's own centre second.
 const transforms=[
  `translate(${ox},${oy})`,
  `rotate(${g.photoAngle}deg)`,
  `scale(${scale})`,
  `translate(calc(${box.left} - ${ox}),calc(${box.top} - ${oy}))`,
 ];
 if(layer.rotation)transforms.push(
  `translate(${center[0]},${center[1]})`,
  `rotate(${layer.rotation}deg)`,
  `translate(calc(0px - ${center[0]}),calc(0px - ${center[1]}))`,
 );
 return rule(selector,{
  content:'""',position:'absolute',left:g.photoLeft,top:g.photoTop,
  width:box.width,height:box.height,background:`${ctx.source(field)} ${box.position} / ${box.fit} no-repeat`,
  opacity:layer.opacity,transform:transforms.join(' '),'transform-origin':'0 0',
  'clip-path':clip,'pointer-events':'none','z-index':z,
 });
}
