import {ASSETS,assetUrl} from './catalog.mjs';
import {validImage} from './image-sources.mjs';
export function normalizeCanvasBackground(raw={}) {
  const mode=raw.canvasBackground ?? 'legacy-solid';
  if(!['tavern','legacy-solid','image'].includes(mode))throw Error('画布背景模式无效');
  const background=raw.background ?? '#e8ece6';
  if(typeof background!=='string'||!/^#[0-9a-f]{6}$/i.test(background))throw Error('旧画布颜色格式无效');
  const canvasWallpaper=raw.canvasWallpaper ?? '';
  if(canvasWallpaper && !validImage(canvasWallpaper))throw Error('方案壁纸格式无效');
  const canvasWallpaperAsset=raw.canvasWallpaperAsset ?? '';
  if(canvasWallpaperAsset && !ASSETS[canvasWallpaperAsset])throw Error('方案壁纸素材无效');
  if(mode==='image' && !canvasWallpaper && !canvasWallpaperAsset)throw Error('请选择方案壁纸');
  return {canvasBackground:mode,background,...(canvasWallpaper?{canvasWallpaper}:{}),...(canvasWallpaperAsset?{canvasWallpaperAsset}:{})};
}
export function canvasBackgroundRules(config,root) {
  const {canvasBackground,background}=normalizeCanvasBackground(config);
  if(canvasBackground==='legacy-solid')return `${root} #chat{background:${background}!important}`;
  return `${root} #sheld,${root} #chat{background:transparent!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}`;
}

export function createCanvasWallpaper(document) {
  let node,lastSource;
  return {
    update(config) {
      if(config.canvasBackground !== 'image'){node?.remove();node=null;lastSource=null;return;}
      if(!node){node=document.createElement('div');node.id='orange-theme-wallpaper';node.setAttribute('aria-hidden','true');node.setAttribute('data-otl-live-owned','');node.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:-1;background-position:center;background-size:cover;background-repeat:no-repeat';document.body.append(node);}
      const source=config.canvasWallpaper || assetUrl(config.canvasWallpaperAsset);
      if(lastSource!==source){node.style.backgroundImage=`url(${JSON.stringify(source)})`;lastSource=source;}
    },
    stop(){node?.remove();node=null;lastSource=null;}
  };
}
