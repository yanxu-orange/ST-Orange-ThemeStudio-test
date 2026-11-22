import {NEUTRAL_DECOR} from './neutral-decor-catalog.mjs';
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
export const ASSET_CATEGORIES = ['通用装饰','贴纸','花饰','邮戳','边框'];
const springEntries = [
  [
    "spring-pageheaders-presets-scene-images-0",
    "预设头图",
    "spring/pageheaders-presets-scene-images-0.webp"
  ],
  [
    "spring-pageheaders-connection-scene-images-0",
    "API头图",
    "spring/pageheaders-connection-scene-images-0.webp"
  ],
  [
    "spring-pageheaders-worldbook-scene-images-0",
    "世界书头图",
    "spring/pageheaders-worldbook-scene-images-0.webp"
  ],
  [
    "spring-pageheaders-settings-scene-images-0",
    "设置头图",
    "spring/pageheaders-settings-scene-images-0.webp"
  ],
  [
    "spring-pageheaders-backgrounds-scene-images-0",
    "背景头图",
    "spring/pageheaders-backgrounds-scene-images-0.webp"
  ],
  [
    "spring-pageheaders-extensions-scene-images-0",
    "扩展头图",
    "spring/pageheaders-extensions-scene-images-0.webp"
  ],
  [
    "spring-pageheaders-personas-scene-images-0",
    "用户人设头图",
    "spring/pageheaders-personas-scene-images-0.webp"
  ],
  [
    "spring-pageheaders-characters-scene-images-0",
    "角色管理头图",
    "spring/pageheaders-characters-scene-images-0.webp"
  ],
  [
    "spring-pageheaders-formatting-scene-images-0",
    "格式头图",
    "spring/pageheaders-formatting-scene-images-0.webp"
  ],
  [
    "spring-layers-2",
    "发送按钮旁小花",
    "spring/layers-2.webp"
  ],
  [
    "spring-layers-3",
    "尾部叶片",
    "spring/layers-3.png"
  ],
  [
    "spring-chromestyle-topbar-icons-ai-config-button",
    "chromeStyle topbar icons ai-config-button",
    "spring/chromestyle-topbar-icons-ai-config-button.png"
  ],
  [
    "spring-chromestyle-topbar-icons-sys-settings-button",
    "chromeStyle topbar icons sys-settings-button",
    "spring/chromestyle-topbar-icons-sys-settings-button.png"
  ],
  [
    "spring-chromestyle-topbar-icons-advanced-formatting-button",
    "chromeStyle topbar icons advanced-formatting-button",
    "spring/chromestyle-topbar-icons-advanced-formatting-button.png"
  ],
  [
    "spring-chromestyle-topbar-icons-wi-sp-button",
    "chromeStyle topbar icons WI-SP-button",
    "spring/chromestyle-topbar-icons-wi-sp-button.png"
  ],
  [
    "spring-chromestyle-topbar-icons-user-settings-button",
    "chromeStyle topbar icons user-settings-button",
    "spring/chromestyle-topbar-icons-user-settings-button.png"
  ],
  [
    "spring-chromestyle-topbar-icons-backgrounds-button",
    "chromeStyle topbar icons backgrounds-button",
    "spring/chromestyle-topbar-icons-backgrounds-button.png"
  ],
  [
    "spring-chromestyle-topbar-icons-extensions-settings-button",
    "chromeStyle topbar icons extensions-settings-button",
    "spring/chromestyle-topbar-icons-extensions-settings-button.png"
  ],
  [
    "spring-chromestyle-topbar-icons-persona-management-button",
    "chromeStyle topbar icons persona-management-button",
    "spring/chromestyle-topbar-icons-persona-management-button.png"
  ],
  [
    "spring-chromestyle-topbar-icons-rightnavholder",
    "chromeStyle topbar icons rightNavHolder",
    "spring/chromestyle-topbar-icons-rightnavholder.png"
  ],
  [
    "spring-chromestyle-input-icons-options_button",
    "chromeStyle input icons options_button",
    "spring/chromestyle-input-icons-options_button.png"
  ],
  [
    "spring-chromestyle-input-icons-extensionsmenubutton",
    "chromeStyle input icons extensionsMenuButton",
    "spring/chromestyle-input-icons-extensionsmenubutton.png"
  ],
  [
    "spring-chromestyle-input-icons-send_but",
    "chromeStyle input icons send_but",
    "spring/chromestyle-input-icons-send_but.png"
  ],
  [
    "spring-chromestyle-input-icons-mes_stop",
    "chromeStyle input icons mes_stop",
    "spring/chromestyle-input-icons-mes_stop.png"
  ]
];
export const ASSETS = {...NEUTRAL_DECOR,...Object.fromEntries(kittyEntries.map(([id,name,path])=>[id,{id,name,path}])),...SHARED_ASSETS,...Object.fromEntries(springEntries.map(([id,name,path])=>[id,{id,name,path}]))};

// The current template-owned resource stays selected when editing an existing
// layer; merely opening this list must not replace or rewrite the layer.
export function builtinAssetGroups(currentId='') {
  const groups=ASSET_CATEGORIES.map(name=>({name,assets:Object.values({...NEUTRAL_DECOR,...SHARED_ASSETS}).filter(asset=>asset.category===name)}));
  if(currentId && ASSETS[currentId] && !SHARED_ASSETS[currentId]&&!NEUTRAL_DECOR[currentId])groups.unshift({name:currentId.startsWith('spring-')?'当前春日模板素材':'当前小猫模板素材',assets:[ASSETS[currentId]]});
  return groups;
}
export function assetUrl(id) {
  const asset=ASSETS[id];
  return asset ? new URL('./materials/'+asset.path, import.meta.url).href : '';
}
