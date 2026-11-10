import {validImage} from './layers.mjs';
import {ASSETS,assetUrl} from './catalog.mjs';
const common={size:15,color:'auto',gap:6,x:0,y:0};
export const NATIVE_DEFAULTS={actions:{...common,position:'header',anchor:'top',edit:{mode:'default',text:'编辑',source:null}},stats:{...common,position:'header',size:11},swipe:{...common,position:'footer',left:{mode:'default',text:'上一页'},right:{mode:'default',text:'下一页'},hideHistory:true,hideLatest:false}};
function object(v,keys){if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!keys.includes(k)))throw Error('原生功能字段无效');}
function choice(v,values){if(!values.includes(v))throw Error('原生功能选项无效');}
function number(v,min,max){if(!Number.isFinite(v)||v<min||v>max)throw Error('原生功能数值超出范围');}
export function validateNativeStyle(raw){
 object(raw,['actions','stats','swipe']);
 for(const k of ['actions','stats','swipe']){const v=raw[k];object(v,[...Object.keys(common),'position',...(k==='actions'?['anchor','edit']:k==='swipe'?['left','right','hideHistory','hideLatest']:[])]);choice(v.position,['header','footer']);for(const [name,min,max]of [['size',10,28],['gap',0,40],['x',-100,100],['y',-160,160]])number(v[name],min,max);if(v.color!=='auto'&&(typeof v.color!=='string'||!/^#[a-f0-9]{6}$/i.test(v.color)))throw Error('原生功能颜色无效');}
 choice(raw.actions.anchor,['top','center','bottom']);
 for(const [v,image]of [[raw.actions.edit,true],[raw.swipe.left,false],[raw.swipe.right,false]]){object(v,image?['mode','text','source']:['mode','text']);choice(v.mode,image?['default','text','image']:['default','text']);if(typeof v.text!=='string'||v.text.length>40)throw Error('原生功能文字过长');if(image&&v.source!==null){object(v.source,['kind','asset','image']);if(v.source.kind==='asset'){if(!Object.hasOwn(ASSETS,v.source.asset)||v.source.image!=='')throw Error('编辑图标素材无效');}else if(v.source.kind!=='custom'||v.source.asset!==''||!validImage(v.source.image))throw Error('编辑图标图片无效');}}
 if(typeof raw.swipe.hideHistory!=='boolean'||typeof raw.swipe.hideLatest!=='boolean')throw Error('版本计数开关无效');return structuredClone(raw);
}
export function normalizeNativeConfig(raw){if(!raw||![1,2,3,4,5,6,7,8,9,10].includes(raw.version))throw Error('方案版本不支持');if(raw.version<7&&Object.hasOwn(raw,'nativeStyle'))throw Error('旧版本不能包含原生功能设置');return {...raw,version:Math.max(7,raw.version),nativeStyle:raw.version>=7?validateNativeStyle(raw.nativeStyle):structuredClone(NATIVE_DEFAULTS)};}
export function nativeImageUrl(source){return source?.kind==='asset'?assetUrl(source.asset):source?.kind==='custom'?source.image:'';}
export function effectiveNativeMode(v){return v.mode==='text'&&v.text.trim()?'text':v.mode==='image'&&nativeImageUrl(v.source)?'image':'default';}
export function latestAI(messages){return [...messages].reverse().find(m=>m.getAttribute('is_user')!=='true'&&m.getAttribute('is_system')!=='true'&&!m.classList.contains('smallSysMes'))||null;}
export function nativeRules(q,c,header='.ch_name'){
 const s=c.nativeStyle,actions=s.actions,stats=s.stats,swipe=s.swipe,ac=actions.color==='auto'?c.accent:actions.color,sc=stats.color==='auto'?c.timeColor:stats.color,wc=swipe.color==='auto'?c.accent:swipe.color;
 const role=k=>`${q} [data-otl-native-role="${k}"]`;
 return `${q} ${header}{height:var(--on-header-height,auto)!important;overflow:visible!important}
${q}[data-otl-native-stats-footer=true] > .mesAvatarWrapper,${q} > .mes_block:has(.otl-native-footer){overflow:visible!important}
${q} :is(.otl-native-head,.otl-native-footer){box-sizing:border-box!important;pointer-events:none!important;min-width:0!important;padding:0!important;border:0!important;margin:0!important;overflow:visible!important;}
${q} .otl-native-head{position:absolute!important;left:0!important;right:0!important;top:var(--on-head-top,0px)!important;width:100%!important;height:var(--on-head-height,0px)!important;}
${q} .otl-native-footer{position:relative!important;width:100%!important;height:var(--on-footer-height,0px)!important;}
${role('actions')}{position:absolute!important;box-sizing:border-box!important;left:var(--on-actions-x,0px)!important;top:var(--on-actions-y,0px)!important;right:auto!important;bottom:auto!important;max-width:var(--on-region-width,100%)!important;width:max-content!important;flex-wrap:wrap!important;gap:${actions.gap}px!important;overflow:visible!important;z-index:30!important;}
${role('actions')} :is(.mes_button,.menu_button){font-size:${actions.size}px!important;color:${ac}!important;}
${role('actions')} .extraMesButtons{gap:${actions.gap}px!important;flex-wrap:wrap!important;max-width:100%!important;}
${[0,1,2].map(i=>`${role('stat-'+i)}{position:absolute!important;left:var(--on-stat-${i}-x,0px)!important;top:var(--on-stat-${i}-y,0px)!important;right:auto!important;bottom:auto!important;width:max-content!important;max-width:none!important;white-space:nowrap!important;font-size:${stats.size}px!important;color:${sc}!important;z-index:30!important;}`).join('\n')}
${role('swipe-left')},${role('swipe-right')}{position:absolute!important;right:auto!important;bottom:auto!important;width:max-content!important;max-width:none!important;z-index:30!important;}
${role('swipe-left')}{left:var(--on-swipe-left-x,0px)!important;top:var(--on-swipe-left-y,0px)!important;}
${role('swipe-right')}{left:var(--on-swipe-right-x,0px)!important;top:var(--on-swipe-right-y,0px)!important;flex-direction:row!important;align-items:center!important;gap:${swipe.gap}px!important;}
${q} :is(.swipe_left,.swipe_right,.swipes-counter){font-size:${swipe.size}px!important;color:${wc}!important;}
${q} .swipes-counter{order:0;margin:0!important;}
${role('swipe-right')} > .swipe_right{order:1}
${q}[data-otl-native-hide-counter=true] .swipes-counter{display:none!important}
${q} [data-otl-native-mode=text]::before,${q} [data-otl-native-mode=image]::before{display:none!important}
${q} [data-otl-native-mode=text]{font-size:0!important;width:max-content!important;min-width:25px!important;}
${q} .otl-native-label{font-family:${c.font}!important;font-size:inherit;pointer-events:none!important;white-space:pre-wrap;overflow-wrap:anywhere;}
${q} .mes_edit > .otl-native-label{font-size:${actions.size}px!important;line-height:1.5}
${q} :is(.swipe_left,.swipe_right) > .otl-native-label{font-size:${swipe.size}px!important;line-height:1.5}
${q} .mes_edit[data-otl-native-mode=image]{font-size:0!important;background-image:url(${JSON.stringify(nativeImageUrl(actions.edit.source))})!important;background-size:contain!important;background-repeat:no-repeat!important;background-position:center!important;width:${actions.size+8}px!important;height:${actions.size+8}px!important;min-width:${actions.size+8}px!important;}
`;
}
function box(node){if(!node||node.hidden)return {width:0,height:0};const css=node.ownerDocument.defaultView?.getComputedStyle?.(node);if(css?.display==='none'||css?.visibility==='hidden')return {width:0,height:0};const r=node.getBoundingClientRect();return {width:r.width||0,height:r.height||0};}
const exists=d=>d.width>0&&d.height>0;
export function nativeControlNodes(msg){return [...msg.querySelectorAll('.mes_buttons,.mes_edit_buttons,.mesIDDisplay,.mes_timer,.tokenCounterDisplay,.swipe_left,.swipeRightBlock,.swipe_right,.swipes-counter,.extraMesButtonsHint,.extraMesButtons')];}
export function renderNative(msg,c,{createNode,removeNode,attribute,variable,latest=false,headerSelector='.ch_name',wrapperSelector=':scope > .mesAvatarWrapper'}={}){
 const block=msg.querySelector(':scope > .mes_block'),header=msg.querySelector(headerSelector),wrapper=msg.querySelector(wrapperSelector);if(!block||!header||!wrapper)return;
 const create=createNode||((tag,cls,parent)=>{const n=msg.ownerDocument.createElement(tag);n.className=cls;parent.append(n);return n;}),remove=removeNode||(n=>n.remove()),attr=attribute||((n,k,v)=>{if(n.getAttribute(k)!==String(v))n.setAttribute(k,String(v));}),set=(k,v)=>variable?variable(msg,k,String(v)):msg.style.setProperty(k,String(v));
 const s=c.nativeStyle,normal=header.querySelector('.mes_buttons'),editing=header.querySelector('.mes_edit_buttons'),stats=['.mesIDDisplay','.mes_timer','.tokenCounterDisplay'].map(x=>wrapper.querySelector(x)),left=msg.querySelector(':scope > .swipe_left'),right=msg.querySelector(':scope > .swipeRightBlock'),rightArrow=right?.querySelector('.swipe_right'),counter=right?.querySelector('.swipes-counter');
 attr(msg,'data-otl-native-latest-ai',latest?'true':'false');attr(msg,'data-otl-native-hide-counter',(latest?s.swipe.hideLatest:s.swipe.hideHistory)?'true':'false');attr(msg,'data-otl-native-stats-footer',s.stats.position==='footer'?'true':'false');
 for(const n of [normal,editing])if(n)attr(n,'data-otl-native-role','actions');for(const [i,n]of stats.entries())if(n)attr(n,'data-otl-native-role','stat-'+i);if(left)attr(left,'data-otl-native-role','swipe-left');if(right)attr(right,'data-otl-native-role','swipe-right');
 for(const [node,style]of [[normal?.querySelector('.mes_edit'),s.actions.edit],[left,s.swipe.left],[rightArrow,s.swipe.right]]){if(!node)continue;const mode=effectiveNativeMode(style);attr(node,'data-otl-native-mode',mode);let label=node.querySelector(':scope > .otl-native-label');if(mode==='text'){if(!label)label=create('span','otl-native-label',node);if(label.textContent!==style.text)label.textContent=style.text;label.setAttribute('aria-hidden','true');}else if(label)remove(label);}
 // Reset only private height variables: measure the base once, never feed the expanded dock back.
 set('--on-header-height','auto');set('--on-head-height','0px');set('--on-footer-height','0px');
 const headerRect=header.getBoundingClientRect(),regionWidth=headerRect.width||Math.max(1,c.cardWidth-48);set('--on-region-width',regionWidth+'px');
 const ns=[box(normal),box(editing)],sd=stats.map(n=>n?.textContent.trim()?box(n):{width:0,height:0}),ld=box(left),rd=box(rightArrow),cd=counter?.textContent.trim()?box(counter):{width:0,height:0};
 const dimensions={actions:{width:Math.max(...ns.map(d=>d.width)),height:Math.max(...ns.map(d=>d.height))},stats:{width:sd.filter(exists).reduce((v,d)=>v+d.width,0)+Math.max(0,sd.filter(exists).length-1)*s.stats.gap,height:Math.max(0,...sd.map(d=>d.height))},swipe:{width:[ld,rd,cd].filter(exists).reduce((v,d)=>v+d.width,0)+Math.max(0,[ld,rd,cd].filter(exists).length-1)*s.swipe.gap,height:Math.max(ld.height,rd.height,cd.height)}};
 const groups={head:[],footer:[]};for(const key of ['actions','stats','swipe'])if(exists(dimensions[key])&&!(key==='actions'&&s.actions.position==='header'))groups[s[key].position==='footer'?'footer':'head'].push(key);
 const slots={};for(const [area,keys]of Object.entries(groups)){let slot=(area==='head'?header:block).querySelector(':scope > .otl-native-'+area);if(!keys.length){if(slot)remove(slot);continue;}if(!slot)slot=create('div','otl-native-'+area,area==='head'?header:block);slot.setAttribute('aria-hidden','true');if(area==='footer'&&block.lastElementChild!==slot)block.append(slot);slots[area]=slot;}
 // Row stacking and offsets use stable group sizes; reserve union in each native dock.
 const placements={};for(const [area,keys]of Object.entries(groups)){let cursor=0,top=0,bottom=0;for(const key of keys){const v=s[key],d=dimensions[key],y=cursor+v.y;placements[key]={x:v.x*regionWidth/100,y};top=Math.min(top,y);bottom=Math.max(bottom,y+d.height);cursor+=d.height+v.gap;}const shift=Math.max(0,-top),height=keys.length?Math.ceil(bottom+shift+8):0;set('--on-'+(area==='head'?'head':'footer')+'-height',height+'px');for(const key of keys)placements[key].y+=shift;}
 const css=msg.ownerDocument.defaultView?.getComputedStyle?.(header),extra=css?.boxSizing==='border-box'?0:['paddingTop','paddingBottom','borderTopWidth','borderBottomWidth'].reduce((n,k)=>n+(parseFloat(css?.[k])||0),0);const headHeight=parseFloat(msg.style.getPropertyValue('--on-head-height'))||0;set('--on-head-top',headerRect.height+'px');if(headHeight)set('--on-header-height',Math.max(0,headerRect.height+headHeight-extra)+'px');
 const target=key=>{if(key==='actions'&&s.actions.position==='header')return {left:headerRect.right-dimensions.actions.width+s.actions.x*regionWidth/100,top:headerRect.top+Math.max(0,headerRect.height-dimensions.actions.height)*({top:0,center:.5,bottom:1}[s.actions.anchor])+s.actions.y};const area=s[key].position==='footer'?'footer':'head',r=slots[area]?.getBoundingClientRect()||headerRect,p=placements[key]||{x:0,y:0};return {left:r.left+p.x,top:r.top+p.y};};
 const position=(node,key,point,parent)=>{if(!node||!parent)return;const offset=node.offsetParent||parent,r=offset.getBoundingClientRect(),originX=r.left+(offset.clientLeft||0)-(offset.scrollLeft||0),originY=r.top+(offset.clientTop||0)-(offset.scrollTop||0);set('--on-'+key+'-x',(point.left-originX)+'px');set('--on-'+key+'-y',(point.top-originY)+'px');};
 const ap=target('actions');position(normal||editing,'actions',ap,header);
 let sx=0;const sp=target('stats');for(const [i,n]of stats.entries()){position(n,'stat-'+i,{left:sp.left+sx,top:sp.top},wrapper);if(exists(sd[i]))sx+=sd[i].width+s.stats.gap;}
 const wp=target('swipe');position(left,'swipe-left',wp,msg);position(right,'swipe-right',{left:wp.left+(exists(ld)?ld.width+s.swipe.gap:0),top:wp.top},msg);
}

