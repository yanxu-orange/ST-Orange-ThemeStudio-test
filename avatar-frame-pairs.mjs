export const AVATAR_FRAME_PAIRS=Object.freeze({
  "frame-circle": {
    "id": "frame-circle",
    "name": "细圆框",
    "width": 240,
    "height": 240,
    "frame": "materials/avatar-frames/frame-circle.png",
    "mask": "materials/avatar-frames/frame-circle-mask.png"
  },
  "frame-oval": {
    "id": "frame-oval",
    "name": "椭圆框",
    "width": 240,
    "height": 280,
    "frame": "materials/avatar-frames/frame-oval.png",
    "mask": "materials/avatar-frames/frame-oval-mask.png"
  },
  "frame-rounded": {
    "id": "frame-rounded",
    "name": "圆角方框",
    "width": 240,
    "height": 280,
    "frame": "materials/avatar-frames/frame-rounded.png",
    "mask": "materials/avatar-frames/frame-rounded-mask.png"
  },
  "frame-double": {
    "id": "frame-double",
    "name": "双层框",
    "width": 240,
    "height": 280,
    "frame": "materials/avatar-frames/frame-double.png",
    "mask": "materials/avatar-frames/frame-double-mask.png"
  },
  "frame-arch": {
    "id": "frame-arch",
    "name": "拱窗框",
    "width": 240,
    "height": 280,
    "frame": "materials/avatar-frames/frame-arch.png",
    "mask": "materials/avatar-frames/frame-arch-mask.png"
  },
  "frame-organic": {
    "id": "frame-organic",
    "name": "柔曲框",
    "width": 240,
    "height": 280,
    "frame": "materials/avatar-frames/frame-organic.png",
    "mask": "materials/avatar-frames/frame-organic-mask.png"
  }
});
export const framePair=id=>typeof id==='string'&&Object.hasOwn(AVATAR_FRAME_PAIRS,id)?AVATAR_FRAME_PAIRS[id]:null;
export const frameAssetUrl=(id,kind='frame')=>framePair(id)&&['frame','mask'].includes(kind)?new URL(framePair(id)[kind],import.meta.url).href:'';
