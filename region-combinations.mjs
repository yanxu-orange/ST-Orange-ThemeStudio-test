import { regionForImage, regionOrder, syncRegionOrder } from './region-layers.mjs';
import { resolveMetadata, metadataItem } from './native-metadata.mjs';
import { resolveNativeActions } from './native.mjs';
import { resolveNativeStats, statValueStyle } from './native-stat-style.mjs';
import { PAGE_HEADER_PAGES } from './page-headers.mjs';
import { PAGE_TITLE_SUBTITLE_TARGETS } from './page-title-subtitle.mjs';
import { uniqueId } from './unique-id.mjs';

export const COMBINATION_REGIONS = Object.freeze({header:'头像区',footer:'尾部区',home:'首页头部',page:'子页面头部',input:'输入区',topbar:'顶栏'});
const clone = value => structuredClone(value);
const roles = ['ai','user'];
const headerKeys = ['layout','avatarDesign','avatarSize','avatarRadius','headerHeight','avatarFill','nameFont','nameColor','nameSize','timeFont','timeColor','timeSize','textAlign','textInset','textTop'];
const pick = (value, keys) => Object.fromEntries(keys.filter(key => Object.hasOwn(value,key)).map(key => [key,clone(value[key])]));
function checkRegion(region,pageId) {
  if (!Object.hasOwn(COMBINATION_REGIONS,region)) throw Error('组合区域无效');
  if (region === 'page' && (!Object.hasOwn(PAGE_HEADER_PAGES,pageId)||pageId === 'home')) throw Error('请选择子页面');
}
function resolvedInput(config) {
  const input = clone(config.chromeStyle.input);
  if (input.fontMode !== 'custom') {
    const chat = input.fontMode === 'chat';
    const text = config.commonStyle.text;
    input.font = chat ? config.font : text.font === 'auto' ? 'sans-serif' : text.font;
    input.fontLink = clone(chat ? config.bodyFontLink : text.fontLink);
    input.fontMode = 'custom';
  }
  return input;
}
function captureNative(config,region) {
  const native = {actions:{},stats:{},swipe:null};
  for (const role of roles) {
    const action = resolveNativeActions(config.nativeStyle.actions,role==='user');
    native.actions[role] = {size:action.size,color:action.color==='auto'?config.accent:action.color,items:{}};
    for (const key of ['edit','more']) if (action[key].position===region) native.actions[role].items[key]=clone(action[key]);
    const stats = resolveNativeStats(config.nativeStyle.stats,role==='user');
    native.stats[role] = {};
    for (const key of ['floor','time','tokens']) if (stats[key].position===region) {
      const item = clone(stats[key]);
      item.valueStyle=statValueStyle(stats,key);
      if (item.valueStyle.color==='auto') item.valueStyle.color=config.timeColor;
      if (item.valueStyle.font==='auto') item.valueStyle.font=config.font;
      if(item.label?.style?.color==='auto')item.label.style.color=config.timeColor;
      if(item.label?.style?.font==='auto')item.label.style.font=config.font;
      native.stats[role][key]=item;
    }
  }
  if (config.nativeStyle.swipe.position===region) {
    native.swipe=clone(config.nativeStyle.swipe);
    if (native.swipe.color==='auto') native.swipe.color=config.accent;
  }
  return native;
}
export function captureCombination(config,region,pageId) {
  checkRegion(region,pageId);
  const result={version:1,region};
  if (['header','footer','input'].includes(region)) {
    result.layers=clone(config.layers.filter(item=>regionForImage(item)===region));
    result.order=regionOrder(config,region);
  }
  if (region==='header') {
    result.settings=pick(config,headerKeys);
    if (result.settings.timeFont==='auto') result.settings.timeFont=config.font;
    result.photos=Object.fromEntries(roles.map(role=>[role,pick(config.photos[role],Object.keys(config.photos[role]).filter(key=>!['asset','image'].includes(key)))]));
    result.textItems=clone(config.textItems);
    result.captions=clone(config.captions);
    result.metadata={};
    for (const role of roles) {
      result.metadata[role]={};
      const items=resolveMetadata(config,role==='user');
      for (const key of ['name','time']) {
        const item=items[key]??metadataItem(config,key);
        if(item.region==='header')result.metadata[role][key]=clone(item);
      }
    }
  }
  if (region==='footer') result.captions=clone(config.footerCaptions);
  if (['header','footer'].includes(region)) result.native=captureNative(config,region);
  if (['home','page'].includes(region)) {
    const page=region==='home'?'home':pageId;
    result.pageId=page;
    result.header=clone(config.pageHeaders[page]);
    if(region==='page'&&PAGE_TITLE_SUBTITLE_TARGETS[page]&&!result.header.titleStyle&&result.header.layout==='standard'&&!result.header.title&&!result.header.image&&!result.header.asset){
      const text=config.pageStyle[page].text||config.commonStyle.text,heading=config.pageStyle[page].heading||config.commonStyle.heading;
      result.header.titleStyle={font:text.font,fontLink:clone(text.fontLink),lineHeight:1.35,letterSpacing:1};
      result.header.titleSize=24;result.header.titleWeight=heading.weight;result.header.titleColor=heading.color;
    }
  }
  if(region==='input')result.chrome=resolvedInput(config);
  if(region==='topbar')result.chrome=clone(config.chromeStyle.topbar);
  return clone(result);
}
function checked(combination) {
  if(!combination||combination.version!==1)throw Error('组合格式无效');
  checkRegion(combination.region,combination.region==='page'?combination.pageId:undefined);
  return combination;
}
const nativeNames={edit:'编辑按钮',more:'更多按钮',floor:'楼层号',time:'时间统计',tokens:'Token 统计',name:'名字'};
export function inspectCombinationConflicts(config,combination) {
  const combo=checked(combination),region=combo.region,conflicts=new Set();
  if (!['header','footer'].includes(region)) return [];
  const mark=(name,from)=>conflicts.add(`${name}将从${COMBINATION_REGIONS[from]||'正文区'}移到${COMBINATION_REGIONS[region]}`);
  for(const role of roles){
    const who=role==='ai'?'AI ':'用户 ',a=resolveNativeActions(config.nativeStyle.actions,role==='user'),s=resolveNativeStats(config.nativeStyle.stats,role==='user');
    const saved=combo.native.actions[role],keys=Object.keys(saved.items);
    for(const key of keys)if(a[key].position!==region)mark(who+nativeNames[key],a[key].position);
    if(keys.length&&['edit','more'].some(key=>!keys.includes(key)&&a[key].position!==region)&& (saved.size!==a.size||saved.color!==(a.color==='auto'?config.accent:a.color)))conflicts.add(`${who}另一分区的操作按钮也会使用这组字号与颜色`);
    for(const key of Object.keys(combo.native.stats[role]))if(s[key].position!==region)mark(who+nativeNames[key],s[key].position);
    if(region==='header')for(const key of Object.keys(combo.metadata[role])){
      const item=resolveMetadata(config,role==='user')[key];
      if(item&&item.region!=='header')mark(who+(key==='name'?'名字':'时间'),item.region);
    }
  }
  if(combo.native.swipe&&config.nativeStyle.swipe.position!==region)mark('回复翻页',config.nativeStyle.swipe.position);
  return [...conflicts];
}
function applyNative(config,combo,original){
  const target=config.nativeStyle;
  const actionRoles={},statRoles={};
  for(const role of roles){
    const currentAction=clone(resolveNativeActions(target.actions,role==='user'));
    delete currentAction.roles;delete currentAction.design;
    const saved=combo.native.actions[role];
    actionRoles[role]=pick(currentAction,['size','color','edit','more']);
    if(Object.keys(saved.items).length)Object.assign(actionRoles[role],{size:saved.size,color:saved.color},clone(saved.items));
    const currentStats=resolveNativeStats(target.stats,role==='user');
    statRoles[role]=pick(currentStats,['floor','time','tokens']);
    if(config.timeColor!==original.timeColor)for(const key of ['floor','time','tokens']){
      if(Object.hasOwn(combo.native.stats[role],key))continue;
      const style=statValueStyle(currentStats,key);
      if(style.color==='auto')statRoles[role][key].valueStyle={...style,color:original.timeColor};
      const label=statRoles[role][key].label;
      if(label?.style?.color==='auto')label.style.color=original.timeColor;
    }
    Object.assign(statRoles[role],clone(combo.native.stats[role]));
  }
  target.actions={...target.actions,design:'separate',roles:actionRoles};
  target.stats={...target.stats,design:'separate',roles:statRoles};
  if(combo.native.swipe)target.swipe=clone(combo.native.swipe);
}
function applyLayers(config,combo){
  const region=combo.region,retained=config.layers.filter(item=>regionForImage(item)!==region),used=new Set(retained.map(item=>item.id)),mapping=new Map();
  const layers=clone(combo.layers);
  for(const item of layers){const old=item.id;if(used.has(item.id))item.id=uniqueId();used.add(item.id);mapping.set('image:'+old,'image:'+item.id);}
  config.layers=[...retained,...layers];
  config.regionOrder={...config.regionOrder,[region]:combo.order.map(key=>mapping.get(key)||key)};
}
function pageHeaderForTarget(config,combo,pageId){
  const header=clone(combo.header);
  if(combo.region==='page'&&pageId!==combo.pageId){
    header.title=config.pageHeaders[pageId].title;
    const targets=PAGE_TITLE_SUBTITLE_TARGETS[pageId];
    if(!targets){header.titleSubtitle=null;header.titleDecoration=null;header.titleStyle=null;}
    else if(header.titleSubtitle){
      const old=config.pageHeaders[pageId].titleSubtitle;
      header.titleSubtitle.texts=Object.fromEntries(Object.keys(targets).map(key=>[key,old?.texts[key]||'']));
    }
  }
  return header;
}
export function applyCombination(config,combination,pageId,{moveNative=false}={}) {
  const combo=checked(combination),region=combo.region;
  checkRegion(region,pageId??combo.pageId);
  const conflicts=inspectCombinationConflicts(config,combo);
  if(conflicts.length&&!moveNative)throw Error(conflicts.join('；'));
  const out=clone(config);
  if(['header','footer','input'].includes(region))applyLayers(out,combo);
  if(region==='header'){
    const existingMetadata=Object.fromEntries(roles.map(role=>[role,Object.fromEntries(['name','time'].map(key=>[key,clone(resolveMetadata(config,role==='user')[key]??metadataItem(config,key))]))]));
    Object.assign(out,pick(combo.settings,headerKeys));
    out.photos=Object.fromEntries(roles.map(role=>[role,{...clone(combo.photos[role]),asset:config.photos[role].asset,image:config.photos[role].image}]));
    out.textItems=clone(combo.textItems);out.captions=clone(combo.captions);
    for(const role of roles)Object.assign(existingMetadata[role],clone(combo.metadata[role]));
    out.metadata={design:'separate',unified:clone(config.metadata.unified),roles:existingMetadata};
  }
  if(region==='footer')out.footerCaptions=clone(combo.captions);
  if(['header','footer'].includes(region))applyNative(out,combo,config);
  if(['home','page'].includes(region)){const page=region==='home'?'home':pageId??combo.pageId;out.pageHeaders[page]=pageHeaderForTarget(out,combo,page);}
  if(['input','topbar'].includes(region))out.chromeStyle[region]=clone(combo.chrome);
  return syncRegionOrder(out);
}
