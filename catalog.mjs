const entries = [
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
export const ASSETS = Object.fromEntries(entries.map(([id,name,path])=>[id,{id,name,path}]));
export function assetUrl(id) {
  const asset=ASSETS[id];
  return asset ? new URL('./materials/'+asset.path, import.meta.url).href : '';
}
