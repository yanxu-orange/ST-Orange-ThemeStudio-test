import {compositionScale} from './avatar-effects.mjs';
import {cardPadding} from './body-card.mjs';
export function avatarArtworkFrameStyle(c,user,geometry,z){
 const p=c.photos[user?'user':'ai'],fill=c.avatarFill?.[user?'user':'ai']?.enabled,scale=compositionScale(c,user),suffix=scale===1?'':` scale(${scale})`;
 return {position:'absolute',left:fill?'0px':cardPadding(c)+'px',top:fill?'0px':(cardPadding(c)+geometry.photoTop+geometry.reserveTop)+'px',width:geometry.photoWidth+'px',height:geometry.photoHeight+'px',transform:fill?(scale===1?'none':`scale(${scale})`):`translate(${p.x}px,${geometry.photoShiftY??-p.y}px) rotate(${p.rotation}deg)${suffix}`,transformOrigin:'50% 100%',clipPath:'polygon(var(--sc-avatar-clip))',pointerEvents:'none',zIndex:String(z)};
}

