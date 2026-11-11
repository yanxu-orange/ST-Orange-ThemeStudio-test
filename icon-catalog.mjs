/** Curated original theme icons. Sources: materials/icons/SOURCES.json. */
export const ICONS=Object.freeze({
  "kitty-top-presets": {
    "name": "小猫 · 生成参数",
    "group": "小猫顶栏",
    "file": "materials/icons/kitty-top-presets.svg"
  },
  "kitty-top-api": {
    "name": "小猫 · API连接",
    "group": "小猫顶栏",
    "file": "materials/icons/kitty-top-api.svg"
  },
  "kitty-top-format": {
    "name": "小猫 · 回复格式",
    "group": "小猫顶栏",
    "file": "materials/icons/kitty-top-format.svg"
  },
  "kitty-top-worldbook": {
    "name": "小猫 · 世界书",
    "group": "小猫顶栏",
    "file": "materials/icons/kitty-top-worldbook.svg"
  },
  "kitty-top-settings": {
    "name": "小猫 · 用户设置",
    "group": "小猫顶栏",
    "file": "materials/icons/kitty-top-settings.svg"
  },
  "kitty-top-backgrounds": {
    "name": "小猫 · 背景",
    "group": "小猫顶栏",
    "file": "materials/icons/kitty-top-backgrounds.svg"
  },
  "kitty-top-extensions": {
    "name": "小猫 · 扩展",
    "group": "小猫顶栏",
    "file": "materials/icons/kitty-top-extensions.svg"
  },
  "kitty-top-personas": {
    "name": "小猫 · 用户人设",
    "group": "小猫顶栏",
    "file": "materials/icons/kitty-top-personas.svg"
  },
  "kitty-top-characters": {
    "name": "小猫 · 角色卡",
    "group": "小猫顶栏",
    "file": "materials/icons/kitty-top-characters.svg"
  },
  "snow-top-presets": {
    "name": "雪间 · 生成参数",
    "group": "雪间顶栏",
    "file": "materials/icons/snow-top-presets.svg"
  },
  "snow-top-api": {
    "name": "雪间 · API连接",
    "group": "雪间顶栏",
    "file": "materials/icons/snow-top-api.svg"
  },
  "snow-top-format": {
    "name": "雪间 · 回复格式",
    "group": "雪间顶栏",
    "file": "materials/icons/snow-top-format.svg"
  },
  "snow-top-worldbook": {
    "name": "雪间 · 世界书",
    "group": "雪间顶栏",
    "file": "materials/icons/snow-top-worldbook.svg"
  },
  "snow-top-settings": {
    "name": "雪间 · 用户设置",
    "group": "雪间顶栏",
    "file": "materials/icons/snow-top-settings.svg"
  },
  "snow-top-backgrounds": {
    "name": "雪间 · 背景",
    "group": "雪间顶栏",
    "file": "materials/icons/snow-top-backgrounds.svg"
  },
  "snow-top-extensions": {
    "name": "雪间 · 扩展",
    "group": "雪间顶栏",
    "file": "materials/icons/snow-top-extensions.svg"
  },
  "snow-top-personas": {
    "name": "雪间 · 用户人设",
    "group": "雪间顶栏",
    "file": "materials/icons/snow-top-personas.svg"
  },
  "snow-top-characters": {
    "name": "雪间 · 角色卡",
    "group": "雪间顶栏",
    "file": "materials/icons/snow-top-characters.svg"
  },
  "kitty-more": {
    "name": "猫爪 · 更多",
    "group": "更多与魔棒",
    "file": "materials/icons/kitty-more.svg"
  },
  "snow-more": {
    "name": "圆点 · 更多",
    "group": "更多与魔棒",
    "file": "materials/icons/snow-more.svg"
  },
  "kitty-wand": {
    "name": "星芒魔棒",
    "group": "更多与魔棒",
    "file": "materials/icons/kitty-wand.svg"
  },
  "mucha-wand": {
    "name": "慕夏魔棒",
    "group": "更多与魔棒",
    "file": "materials/icons/mucha-wand.svg"
  },
  "kitty-send": {
    "name": "小猫 · 实心星发送",
    "group": "发送与停止",
    "file": "materials/icons/kitty-send.svg"
  },
  "kitty-stop": {
    "name": "小猫 · 空心星停止",
    "group": "发送与停止",
    "file": "materials/icons/kitty-stop.svg"
  },
  "snow-send": {
    "name": "雪间 · 线框信封发送",
    "group": "发送与停止",
    "file": "materials/icons/snow-send.svg"
  },
  "pink-send": {
    "name": "黑粉紫 · 实心蝶发送",
    "group": "发送与停止",
    "file": "materials/icons/pink-send.svg"
  },
  "pink-stop": {
    "name": "黑粉紫 · 空心蝶停止",
    "group": "发送与停止",
    "file": "materials/icons/pink-stop.svg"
  },
  "spring-send": {
    "name": "春日 · 实心信封发送",
    "group": "发送与停止",
    "file": "materials/icons/spring-send.svg"
  },
  "spring-stop": {
    "name": "春日 · 空心信封停止",
    "group": "发送与停止",
    "file": "materials/icons/spring-stop.svg"
  },
  "mucha-send": {
    "name": "慕夏 · 实心八芒星发送",
    "group": "发送与停止",
    "file": "materials/icons/mucha-send.svg"
  },
  "mucha-stop": {
    "name": "慕夏 · 空心八芒星停止",
    "group": "发送与停止",
    "file": "materials/icons/mucha-stop.svg"
  }
});
export const iconUrl=id=>Object.hasOwn(ICONS,id)?new URL(ICONS[id].file,import.meta.url).href:"";
export function iconGroups(){return [...new Set(Object.values(ICONS).map(item=>item.group))].map(name=>({name,icons:Object.entries(ICONS).filter(([,item])=>item.group===name).map(([id,item])=>({id,...item}))}));}
