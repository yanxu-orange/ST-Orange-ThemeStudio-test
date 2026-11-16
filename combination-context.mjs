export const COMBINATION_NAMES = Object.freeze({header:'头像区',footer:'尾部区',home:'首页头部',page:'页面头部',input:'输入区',topbar:'顶栏'});
export function combinationContext(ui) {
  if (ui.mode !== 'edit') return null;
  if (ui.region === 'page-header') return {region:ui.page === 'home'?'home':'page',pageId:ui.page,label:ui.page === 'home'?'首页头部':'当前页面头部'};
  if (['input','topbar'].includes(ui.region) || ui.page === 'chat' && ['header','footer'].includes(ui.region)) return {region:ui.region,label:COMBINATION_NAMES[ui.region]};
  return null;
}
