/** Wallpaper stays owned by SillyTavern (#bg1), never copied or observed. */
export function normalizeCanvasBackground(raw={}) {
  const mode=raw.canvasBackground ?? 'legacy-solid';
  if(!['tavern','legacy-solid'].includes(mode))throw Error('画布背景模式无效');
  const background=raw.background ?? '#e8ece6';
  if(typeof background!=='string'||!/^#[0-9a-f]{6}$/i.test(background))throw Error('旧画布颜色格式无效');
  return {canvasBackground:mode,background};
}
export function canvasBackgroundRules(config,root) {
  const {canvasBackground,background}=normalizeCanvasBackground(config);
  if(canvasBackground==='legacy-solid')return `${root} #chat{background:${background}!important}`;
  return `${root} #sheld,${root} #chat{background:transparent!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}`;
}
