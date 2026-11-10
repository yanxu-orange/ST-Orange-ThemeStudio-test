// Active resources used by the kitty template and existing placed layers.
// They are not offered as the general-purpose built-in library.
const kittyEntries = [
  ['kitty-ai-cat','AI 翅膀小猫','图片/01-AI翅膀小猫.webp'],
  ['kitty-ai-window','AI 夜色窗景','图片/02-AI窗景.webp'],
  ['kitty-user-window','用户窗桌与小猫','图片/03-用户窗桌猫与星纹丝带.webp'],
  ['kitty-input-cat','输入框深蓝小猫','图片/04-输入框深蓝小猫.webp'],
  ['kitty-input-books','书本与花朵','图片/05-输入框书本花朵.webp'],
  ['kitty-header-cat','页头小猫剪影','图片/06-页头小猫剪影.webp'],
  ['kitty-header-garden','魔法花园','图片/07-页头混合魔法花园.webp'],
  ['kitty-paper','水彩纸带','图片/08-水彩纸带素材.webp'],
  ['kitty-ai-paper','浅蓝侧纸','图片/09-AI头像右侧浅蓝纸.webp'],
  ['kitty-user-tape','用户松胶带','图片/10-用户头像右侧松胶带.webp'],
  ['kitty-user-sprig','用户花枝','图片/11-用户头像右侧花枝.webp'],
  ['kitty-user-cream','淡黄竖胶带','图片/12-用户桌边淡黄竖胶带.webp'],
];
const sharedEntries = [
  ['shared-black-rose-butterfly','黑粉紫 · 黑玫撕裂蝶','black-rose-butterfly.webp','贴纸','黑粉紫'],
  ['shared-lavender-butterfly','黑粉紫 · 薰衣草撕裂蝶','lavender-butterfly.webp','贴纸','黑粉紫'],
  ['shared-spring-flower-stem','春日来信 · 长花枝','spring-flower-stem.webp','花饰','春日来信'],
  ['shared-spring-pink-flowers','春日来信 · 粉花','spring-pink-flowers.webp','花饰','春日来信'],
  ['shared-cream-wing-cat','魔法小猫咪 · 奶油翅膀猫','cream-wing-cat.webp','贴纸','魔法小猫咪'],
  ['shared-navy-cat','魔法小猫咪 · 深蓝趴猫','navy-cat.webp','贴纸','魔法小猫咪'],
  ['shared-snow-postmark','雪间来信 · 圆形波纹邮戳','snow-postmark.webp','邮戳','雪间来信'],
  ['shared-mucha-iris','月与星·慕夏 · 鸢尾花饰','mucha-iris.webp','花饰','月与星·慕夏'],
  ['shared-mucha-gold-frame','月与星·慕夏 · 金线底饰','mucha-gold-frame.webp','边框','月与星·慕夏'],
];
export const SHARED_ASSETS = Object.fromEntries(sharedEntries.map(([id,name,path,category,theme])=>[id,{id,name,path:'shared/'+path,category,theme}]));
export const ASSET_CATEGORIES = ['贴纸','花饰','邮戳','边框'];
export const ASSETS = {...Object.fromEntries(kittyEntries.map(([id,name,path])=>[id,{id,name,path}])),...SHARED_ASSETS};

// The current template-owned resource stays selected when editing an existing
// layer; merely opening this list must not replace or rewrite the layer.
export function builtinAssetGroups(currentId='') {
  const groups=ASSET_CATEGORIES.map(name=>({name,assets:Object.values(SHARED_ASSETS).filter(asset=>asset.category===name)}));
  if(currentId && ASSETS[currentId] && !SHARED_ASSETS[currentId])groups.unshift({name:'当前小猫模板素材',assets:[ASSETS[currentId]]});
  return groups;
}
export function assetUrl(id) {
  const asset=ASSETS[id];
  return asset ? new URL('./materials/'+asset.path, import.meta.url).href : '';
}
