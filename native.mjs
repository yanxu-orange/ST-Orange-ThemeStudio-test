import {ICON_STYLE_FIELDS,validateIconStyle,builtinIconUrl,styleIconElement} from './icon-style.mjs';
import {runLayoutPass} from './layout-pass.mjs';
import {validImage} from './layers.mjs';
import {ASSETS,assetUrl} from './catalog.mjs';
const point={position:'header',x:0,y:0};
const actionPoint={...point,anchor:'top'};
const statKeys=['floor','time','tokens'];
export const NATIVE_DEFAULTS={actions:{size:15,color:'auto',edit:{...actionPoint,mode:'default',text:'编辑',source:null,imageSize:23},more:{...actionPoint,mode:'default',text:'更多',source:null,imageSize:23}},stats:{size:11,color:'auto',floor:{...point,prefix:'#',suffix:''},time:{...point},tokens:{...point}},swipe:{size:15,color:'auto',gap:6,x:0,y:0,position:'footer',layout:'compact',left:{mode:'default',text:'上一页'},right:{mode:'default',text:'下一页'},hideHistory:true,hideLatest:false}};
function object(v,keys){if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!keys.includes(k)))throw Error('原生功能字段无效');}
function choice(v,values){if(!values.includes(v))throw Error('原生功能选项无效');}
function number(v,min,max){if(!Number.isFinite(v)||v<min||v>max)throw Error('原生功能数值超出范围');}
function placement(v,anchor=false){choice(v.position,['header','footer']);number(v.x,-100,100);number(v.y,-160,160);if(anchor)choice(v.anchor,['top','center','bottom']);}
export function validateNativeStyle(raw){
 object(raw,['actions','stats','swipe']);
 // New independent settings are optional on existing saved themes. Seed them once
 // from that theme's current group settings; never rewrite supplied positions.
 raw=structuredClone(raw);
 const groupFields=['position','anchor','gap','x','y'];
 for(const key of ['actions','stats'])if(raw[key])for(const name of groupFields)if(Object.hasOwn(raw[key],name)){const v=raw[key][name];if(name==='position')choice(v,['header','footer']);else if(name==='anchor')choice(v,['top','center','bottom']);else number(v,name==='gap'?0:name==='x'?-100:-160,name==='gap'?40:name==='x'?100:160);}
 if(raw.actions){const base={...actionPoint,...Object.fromEntries(['position','anchor','x','y'].filter(k=>Object.hasOwn(raw.actions,k)).map(k=>[k,raw.actions[k]]))};raw.actions.more={...base,mode:'default',text:'更多',source:null,imageSize:(raw.actions.size??15)+8,...raw.actions.more};if(raw.actions.edit)raw.actions.edit={...base,imageSize:(raw.actions.size??15)+8,...raw.actions.edit};}
 if(raw.stats){const base={...point,...Object.fromEntries(['position','x','y'].filter(k=>Object.hasOwn(raw.stats,k)).map(k=>[k,raw.stats[k]]))};for(const key of statKeys)raw.stats[key]??={...base};raw.stats.floor={prefix:'#',suffix:'',...raw.stats.floor};}
 if(raw.swipe)raw.swipe.layout??='compact';
 object(raw.actions,['size','color','edit','more',...groupFields]);object(raw.stats,['size','color',...statKeys,...groupFields]);object(raw.swipe,['size','color','gap','x','y','position','layout','left','right','hideHistory','hideLatest']);
 for(const v of [raw.actions,raw.stats,raw.swipe]){number(v.size,10,28);if(v.color!=='auto'&&(typeof v.color!=='string'||!/^#[a-f0-9]{6}$/i.test(v.color)))throw Error('原生功能颜色无效');}
 for(const key of ['edit','more']){placement(raw.actions[key],true);number(raw.actions[key].imageSize,8,120);}
 for(const key of statKeys){object(raw.stats[key],['position','x','y',...(key==='floor'?['prefix','suffix']:[])]);placement(raw.stats[key]);}
 for(const key of ['prefix','suffix'])if(typeof raw.stats.floor[key]!=='string'||raw.stats.floor[key].length>40)throw Error('楼层号文字过长');
 placement(raw.swipe);number(raw.swipe.gap,0,40);choice(raw.swipe.layout,['compact','ends']);
 for(const [v,image]of [[raw.actions.edit,true],[raw.actions.more,true],[raw.swipe.left,false],[raw.swipe.right,false]]){object(v,image?['position','anchor','x','y','imageSize','mode','text','source',...ICON_STYLE_FIELDS]:['mode','text']);choice(v.mode,image?['default','text','image','icon']:['default','text']);if(typeof v.text!=='string'||v.text.length>40)throw Error('原生功能文字过长');if(image)validateIconStyle(v);if(image&&v.source!==null){object(v.source,['kind','asset','image']);if(v.source.kind==='asset'){if(!Object.hasOwn(ASSETS,v.source.asset)||v.source.image!=='')throw Error('原生图标素材无效');}else if(v.source.kind!=='custom'||v.source.asset!==''||!validImage(v.source.image))throw Error('原生图标图片无效');}}
 if(typeof raw.swipe.hideHistory!=='boolean'||typeof raw.swipe.hideLatest!=='boolean')throw Error('版本计数开关无效');return structuredClone(raw);
}
export function normalizeNativeConfig(raw){if(!raw||![1,2,3,4,5,6,7,8,9,10].includes(raw.version))throw Error('方案版本不支持');if(raw.version<7&&Object.hasOwn(raw,'nativeStyle'))throw Error('旧版本不能包含原生功能设置');return {...raw,version:Math.max(7,raw.version),nativeStyle:raw.version>=7?validateNativeStyle(raw.nativeStyle):structuredClone(NATIVE_DEFAULTS)};}
export function nativeImageUrl(source){return source?.kind==='asset'?assetUrl(source.asset):source?.kind==='custom'?source.image:'';}
export const nativeIconUrl=v=>builtinIconUrl(v)||nativeImageUrl(v.source);
export function effectiveNativeMode(v){return v.mode==='icon'&&nativeIconUrl(v)?'icon': v.mode==='text'&&v.text.trim()?'text':v.mode==='image'&&nativeImageUrl(v.source)?'image':'default';}
export function latestAI(messages){return [...messages].reverse().find(m=>m.getAttribute('is_user')!=='true'&&m.getAttribute('is_system')!=='true'&&!m.classList.contains('smallSysMes'))||null;}
export function nativeRules(q,c,header='.ch_name'){
 const s=c.nativeStyle,actions=s.actions,stats=s.stats,swipe=s.swipe,ac=actions.color==='auto'?c.accent:actions.color,sc=stats.color==='auto'?c.timeColor:stats.color,wc=swipe.color==='auto'?c.accent:swipe.color;
 const role=k=>`${q} [data-otl-native-role="${k}"]`;
 return `${q} ${header}{overflow:visible!important}
${q}[data-otl-native-stats-footer=true] > .mesAvatarWrapper,${q} > .mes_block:has(.otl-native-footer){overflow:visible!important}
${q} :is(.otl-native-head,.otl-native-footer){box-sizing:border-box!important;pointer-events:none!important;min-width:0!important;padding:0!important;border:0!important;margin:0!important;overflow:visible!important;}
${q} .otl-native-head{position:absolute!important;left:0!important;right:0!important;top:var(--on-head-top,0px)!important;width:100%!important;height:var(--on-head-height,0px)!important;}
${q} .otl-native-footer{position:relative!important;width:100%!important;height:var(--on-footer-height,0px)!important;}
${role('actions')}{position:absolute!important;box-sizing:border-box!important;left:var(--on-actions-x,0px)!important;top:var(--on-actions-y,0px)!important;right:auto!important;bottom:auto!important;max-width:var(--on-region-width,100%)!important;width:max-content!important;flex-wrap:wrap!important;gap:6px!important;overflow:visible!important;z-index:30!important;}
${role('actions')} :is(.mes_button,.menu_button),${role('editing')} :is(.mes_button,.menu_button){font-size:${actions.size}px!important;color:${ac}!important;}
${['edit','editing'].map(key=>`${role(key)}{position:absolute!important;left:var(--on-${key}-x,0px)!important;top:var(--on-${key}-y,0px)!important;right:auto!important;bottom:auto!important;z-index:31!important;}`).join('\n')}
${role('actions')} .extraMesButtons{position:absolute!important;left:var(--on-tools-x,0px)!important;top:var(--on-tools-y,0px)!important;right:auto!important;bottom:auto!important;gap:6px!important;flex-wrap:wrap!important;width:max-content!important;max-width:var(--on-tools-max-width,100%)!important;}
${[0,1,2].map(i=>`${role('stat-'+i)}{position:absolute!important;left:var(--on-stat-${i}-x,0px)!important;top:var(--on-stat-${i}-y,0px)!important;right:auto!important;bottom:auto!important;width:max-content!important;max-width:none!important;white-space:nowrap!important;font-size:${stats.size}px!important;color:${sc}!important;z-index:30!important;}`).join('\n')}
${role('swipe-left')},${role('swipe-right')}{position:absolute!important;right:auto!important;bottom:auto!important;width:max-content!important;max-width:none!important;z-index:30!important;}
${role('swipe-left')}{left:var(--on-swipe-left-x,0px)!important;top:var(--on-swipe-left-y,0px)!important;}
${role('swipe-right')}{left:var(--on-swipe-right-x,0px)!important;top:var(--on-swipe-right-y,0px)!important;}
${q} :is(.swipe_left,.swipe_right,.swipes-counter){font-size:${swipe.size}px!important;color:${wc}!important;}
${q}[data-otl-native-hide-counter=true] .swipes-counter{display:none!important}
${q} [data-otl-native-mode=text]::before,${q} [data-otl-native-mode=image]::before,${q} [data-otl-native-mode=icon]::before{display:none!important}
${q} :is(.mes_edit,.extraMesButtonsHint)[data-otl-native-mode=text],${q} [data-otl-native-mode=text]{font-size:0!important;width:max-content!important;min-width:25px!important;}
${q} .otl-native-label{font-family:${c.font}!important;font-size:inherit;pointer-events:none!important;white-space:pre-wrap;overflow-wrap:anywhere;}
${q} :is(.mes_edit,.extraMesButtonsHint) > .otl-native-label{font-size:${actions.size}px!important;line-height:1.5}
${q} :is(.swipe_left,.swipe_right) > .otl-native-label{font-size:${swipe.size}px!important;line-height:1.5}
${[['.mes_edit',actions.edit],['.extraMesButtonsHint',actions.more]].map(([selector,v])=>`${q} ${selector}[data-otl-native-mode=image]{font-size:0!important;background-image:url(${JSON.stringify(nativeImageUrl(v.source))})!important;background-size:contain!important;background-repeat:no-repeat!important;background-position:center!important;width:${v.imageSize}px!important;height:${v.imageSize}px!important;min-width:${v.imageSize}px!important;}`).join('\n')}
${[['.mes_edit',actions.edit],['.extraMesButtonsHint',actions.more]].map(([selector,v])=>`${q} ${selector}[data-otl-native-mode=icon]{font-size:0!important;position:relative;width:${v.size||v.imageSize}px!important;height:${v.size||v.imageSize}px!important;min-width:${v.size||v.imageSize}px!important;background-image:none!important;}`).join('\n')}
${q} .otl-native-icon{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none!important;}
${q} .mesIDDisplay[data-otl-native-floor-custom=true]{font-size:0!important;}
${q} .mesIDDisplay[data-otl-native-floor-custom=true]::before{display:none!important;}
${q} .mesIDDisplay[data-otl-native-floor-custom=true]::after{content:attr(data-otl-native-floor-label)!important;font-size:${stats.size}px!important;}
`;
}
function box(node){if(!node||node.hidden)return {width:0,height:0};const css=node.ownerDocument.defaultView?.getComputedStyle?.(node);if(css?.display==='none'||css?.visibility==='hidden')return {width:0,height:0};const r=node.getBoundingClientRect();return {width:r.width||0,height:r.height||0};}
const exists=d=>d.width>0&&d.height>0;
export function nativeControlNodes(msg){return [...msg.querySelectorAll('.mes_buttons,.mes_edit,.mes_edit_buttons,.mesIDDisplay,.mes_timer,.tokenCounterDisplay,.swipe_left,.swipeRightBlock,.swipe_right,.swipes-counter,.extraMesButtonsHint,.extraMesButtons')];}
export function renderNative(...args){return runLayoutPass([nativeLayout(...args)])[0];}
const failedIcons=new WeakMap();
export function clearNativeIconFailures(nodes){for(const node of nodes)failedIcons.delete(node);}
export function* nativeLayout(msg,c,{createNode,removeNode,attribute,variable,latest=false,headerSelector='.ch_name',wrapperSelector=':scope > .mesAvatarWrapper'}={}){
 const block=msg.querySelector(':scope > .mes_block'),header=msg.querySelector(headerSelector),wrapper=msg.querySelector(wrapperSelector);if(!block||!header||!wrapper)return;
 const create=createNode||((tag,cls,parent)=>{const n=msg.ownerDocument.createElement(tag);n.className=cls;parent.append(n);return n;}),remove=removeNode||(n=>n.remove()),attr=attribute||((n,k,v)=>{if(n.getAttribute(k)!==String(v))n.setAttribute(k,String(v));}),set=(k,v)=>variable?variable(msg,k,String(v)):msg.style.setProperty(k,String(v));
 const s=c.nativeStyle,normal=header.querySelector('.mes_buttons'),editing=header.querySelector('.mes_edit_buttons'),stats=['.mesIDDisplay','.mes_timer','.tokenCounterDisplay'].map(x=>wrapper.querySelector(x)),left=msg.querySelector(':scope > .swipe_left'),right=msg.querySelector(':scope > .swipeRightBlock'),edit=normal?.querySelector('.mes_edit'),extra=normal?.querySelector('.extraMesButtons'),rightArrow=right?.querySelector('.swipe_right');
 attr(msg,'data-otl-native-latest-ai',latest?'true':'false');attr(msg,'data-otl-native-hide-counter',(latest?s.swipe.hideLatest:s.swipe.hideHistory)?'true':'false');attr(msg,'data-otl-native-stats-footer',statKeys.some(k=>s.stats[k].position==='footer')?'true':'false');
 if(normal)attr(normal,'data-otl-native-role','actions');if(editing)attr(editing,'data-otl-native-role','editing');if(edit)attr(edit,'data-otl-native-role','edit');for(const [i,n]of stats.entries())if(n)attr(n,'data-otl-native-role','stat-'+i);if(left)attr(left,'data-otl-native-role','swipe-left');if(right)attr(right,'data-otl-native-role','swipe-right');
 for(const [node,style]of [[edit,s.actions.edit],[normal?.querySelector('.extraMesButtonsHint'),s.actions.more],[left,s.swipe.left],[rightArrow,s.swipe.right]]){if(!node)continue;let mode=effectiveNativeMode(style);const src=mode==='icon'?nativeIconUrl(style):'';let icon=node.querySelector(':scope > .otl-native-icon');
 if(icon&&icon.querySelector('img')?.getAttribute('src')!==src){remove(icon);icon=null;}
 if(!src)failedIcons.delete(node);
 if(mode==='icon'&&failedIcons.get(node)===src)mode='default';
 if(mode==='icon'){
  if(!icon){icon=create('span','otl-native-icon',node);const picture=create('img','',icon),current=icon;picture.onerror=()=>{if(current.isConnected&&current.parentNode===node&&node.querySelector(':scope > .otl-native-icon')===current&&picture.getAttribute('src')===src){failedIcons.set(node,src);remove(current);attr(node,'data-otl-native-mode','default');}};picture.src=src;}
  styleIconElement(icon,icon.querySelector('img'),src,style,style.imageSize);
 }else if(icon)remove(icon);
 attr(node,'data-otl-native-mode',mode);let label=node.querySelector(':scope > .otl-native-label');if(mode==='text'){if(!label)label=create('span','otl-native-label',node);if(label.textContent!==style.text)label.textContent=style.text;label.setAttribute('aria-hidden','true');}else if(label)remove(label);}
 const floor=stats[0],mesid=msg.getAttribute('mesid');if(floor){const custom=/^\d+$/.test(mesid||'')&&(s.stats.floor.prefix!=='#'||s.stats.floor.suffix!=='');attr(floor,'data-otl-native-floor-custom',String(custom));attr(floor,'data-otl-native-floor-label',custom?s.stats.floor.prefix+mesid+s.stats.floor.suffix:'');}
 // Docks never change the fixed header height. Only the footer reserves flow space.
 set('--on-head-height','0px');
 const widths=yield()=>({header:header.getBoundingClientRect().width,tools:s.actions.more.position==='footer'?block.getBoundingClientRect().width:null});
 const regionWidth=widths.header||Math.max(1,c.cardWidth-48);set('--on-region-width',regionWidth+'px');set('--on-tools-max-width',((widths.tools??widths.header)||regionWidth)+'px');
 const {moreD,moreHintD,editD,editingD,sd,ld,rightD}=yield()=>({moreD:box(normal),moreHintD:box(normal?.querySelector('.extraMesButtonsHint')),editD:box(edit),editingD:box(editing),sd:stats.map(n=>n?.textContent.trim()?box(n):{width:0,height:0}),ld:box(left),rightD:box(right)});
 const ed=exists(editingD)?editingD:editD;
 const controls=[{key:'more',style:s.actions.more,d:moreD},{key:'edit',style:s.actions.edit,d:ed},...statKeys.map((key,i)=>({key,style:s.stats[key],d:sd[i]})),{key:'swipe',style:s.swipe,d:{width:ld.width+rightD.width+(exists(ld)&&exists(rightD)?s.swipe.gap:0),height:Math.max(ld.height,rightD.height)}}];
 // All controls share a stable area origin, never stacked group cursors. Negative
 // offsets remain literal: reserve only the occupied space below the footer origin.
 const footerControls=controls.filter(v=>v.style.position==='footer'&&exists(v.d));
 let footer=block.querySelector(':scope > .otl-native-footer');
 if(footerControls.length){if(!footer)footer=create('div','otl-native-footer',block);footer.setAttribute('aria-hidden','true');if(block.lastElementChild!==footer)block.append(footer);}else if(footer){remove(footer);footer=null;}
 const oldHead=header.querySelector(':scope > .otl-native-head');if(oldHead)remove(oldHead);
 set('--on-head-top','0px');
 const captionFooter=block.querySelector(':scope > .otl-footer');
 const footerHeight=yield()=>{if(!footerControls.length)return 0;const slotRect=footer.getBoundingClientRect(),footerRect=captionFooter?.getBoundingClientRect()||slotRect;return Math.max(0,...footerControls.map(v=>footerRect.top+v.style.y+v.d.height-slotRect.top));};
 set('--on-footer-height',(footerHeight>0?Math.ceil(footerHeight+8):0)+'px');
 // Footer heights can move later messages. Read all viewport origins after every
 // message has reserved its flow space, then write only absolute positions.
 const {placements,mp,ep,moreRegion}=yield()=>{
 const headerRect=header.getBoundingClientRect(),slotRect=footer?.getBoundingClientRect()||headerRect,footerRect=captionFooter?.getBoundingClientRect()||slotRect;
 const target=(key,baseline=0)=>{const {style:v,d}=controls.find(v=>v.key===key),isAction=key==='more'||key==='edit',r=v.position==='footer'?footerRect:headerRect;
  let x=baseline,y=0;
  if(key==='edit'&&v.position==='footer'&&s.actions.more.position==='footer'&&exists(moreD))x=(exists(moreHintD)?moreHintD.width:moreD.width)+6;
  if(isAction&&v.position==='header'){x=regionWidth-(key==='more'&&exists(moreHintD)?moreHintD.width:d.width)-(key==='more'&&s.actions.edit.position==='header'&&exists(ed)?ed.width+6:0);y=Math.max(0,headerRect.height-(key==='more'&&exists(moreHintD)?moreHintD.height:d.height))*({top:0,center:.5,bottom:1}[v.anchor]);}
  else if(v.position==='header')y=Math.max(0,headerRect.height-d.height-8);
  return {left:r.left+x+v.x*(r.width||regionWidth)/100,top:r.top+y+v.y};};
 const origins=new Map([[header,headerRect]]),placements=[];
 const position=(node,key,point,parent)=>{if(!node||!parent)return;const offset=node.offsetParent||parent;let r=origins.get(offset);if(!r){r=offset.getBoundingClientRect();origins.set(offset,r);}placements.push({key,x:point.left-r.left-(offset.clientLeft||0)+(offset.scrollLeft||0),y:point.top-r.top-(offset.clientTop||0)+(offset.scrollTop||0)});};
 const mp=target('more'),ep=target('edit');position(normal,'actions',mp,header);position(editing,'editing',ep,header);
 for(const [i,n]of stats.entries())position(n,'stat-'+i,target(statKeys[i],i*s.stats.size*4),wrapper);
 const wp=target('swipe');position(left,'swipe-left',wp,msg);position(right,'swipe-right',{left:wp.left+(s.swipe.layout==='ends'?Math.max(0,(s.swipe.position==='footer'?footerRect.width||regionWidth:regionWidth)-rightD.width):(exists(ld)?ld.width+s.swipe.gap:0)),top:wp.top},msg);
 return {placements,mp,ep,moreRegion:s.actions.more.position==='footer'?footerRect:headerRect};
 };
 const write=placements=>{for(const {key,x,y}of placements){set('--on-'+key+'-x',x+'px');set('--on-'+key+'-y',y+'px');}};
 write(placements);
 // Edit and More's tray retain their native parent, whose position just changed.
 const nested=yield()=>{
   const toolsD=box(extra),toolsWidth=moreRegion.width||regionWidth,points=[[extra,'tools',{left:Math.max(moreRegion.left,Math.min(mp.left,moreRegion.left+toolsWidth-toolsD.width)),top:mp.top+(exists(moreHintD)?moreHintD.height:moreD.height)+6}],[edit,'edit',ep]],origins=new Map(),placements=[];
   for(const [node,key,point]of points){if(!node)continue;const offset=node.offsetParent||normal||header;let r=origins.get(offset);if(!r){r=offset.getBoundingClientRect();origins.set(offset,r);}placements.push({key,x:point.left-r.left-(offset.clientLeft||0)+(offset.scrollLeft||0),y:point.top-r.top-(offset.clientTop||0)+(offset.scrollTop||0)});}
   return placements;
 };
 write(nested);
}
