export function avatarArtworkFrameStyle(c,user,geometry,z){
 const p=c.photos[user?'user':'ai'],fill=c.avatarFill?.[user?'user':'ai']?.enabled;
 return {position:'absolute',left:fill?'0px':'24px',top:fill?'0px':(24+geometry.photoTop+geometry.reserveTop)+'px',width:geometry.photoWidth+'px',height:geometry.photoHeight+'px',transform:fill?'none':`translate(${p.x}px,${-p.y}px) rotate(${p.rotation}deg)`,transformOrigin:'50% 100%',clipPath:'polygon(var(--sc-avatar-clip))',pointerEvents:'none',zIndex:String(z)};
}
