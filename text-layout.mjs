// Shared, bounded metadata settings. Percentages refer to the assigned text corridor.
export const TEXT_DEFAULTS=Object.freeze({timeFont:'auto',textAlign:'start',textInset:0,textTop:0,captionWidth:'auto'});
export const TIME_FONTS=['serif','sans-serif','Georgia, serif','monospace','"LabSongti",serif'];
export function textSettings(raw={}) {
  const value={...TEXT_DEFAULTS};
  for(const key of Object.keys(value))if(raw[key]!==undefined)value[key]=raw[key];
  if(!['auto',...TIME_FONTS].includes(value.timeFont))throw Error('时间字体无效');
  if(!['start','center','end'].includes(value.textAlign))throw Error('文字对齐无效');
  for(const [key,max]of [['textInset',20],['textTop',80]])if(!Number.isFinite(value[key])||value[key]<0||value[key]>max)throw Error('文字留白超出范围');
  if(value.captionWidth!=='auto'&&(!Number.isFinite(value.captionWidth)||value.captionWidth<10||value.captionWidth>100))throw Error('文案宽度超出范围');
  return value;
}
export function metadataPadding(corridor,settings) {
  return Math.max(0,corridor)*settings.textInset/100;
}
export function customTextLayout(settings) {return settings.textAlign!=='start'||settings.textInset!==0||settings.textTop!==0;}

export const TEXT_Z_MAX=21;
export const TEXT_KEYS=['name','time','caption'];
export function validateTextItems(raw={}, {stable=false}={}) {
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>!TEXT_KEYS.includes(k)))throw Error('文字项无效');
  return Object.fromEntries(TEXT_KEYS.map(key=>{
    const input=raw[key]??{};
    if(typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['x','y','weight','z','fontLink',...(stable&&key!=='caption'?['width']:[])].includes(k)))throw Error('文字设置无效');
    const item={x:0,y:0,weight:'auto',z:3,fontLink:null,...(stable&&key!=='caption'?{width:'auto'}:{}),...input};if(stable&&key!=='caption'&&item.width!=='auto'&&(!Number.isFinite(item.width)||item.width<10||item.width>100))throw Error('文字宽度无效');
    for(const [k,min,max]of [['x',-100,stable?200:100],['y',-400,stable?1600:400],['z',0,TEXT_Z_MAX]])if(!Number.isFinite(item[k])||item[k]<min||item[k]>max||(k==='z'&&!Number.isInteger(item[k])))throw Error('文字位置超出范围');
    if(item.weight!=='auto'&&(!Number.isInteger(item.weight)||item.weight<100||item.weight>900||item.weight%100))throw Error('文字字重无效');
    if(item.fontLink!==null){
      const link=item.fontLink;
      if(!link||typeof link!=='object'||Array.isArray(link)||Object.keys(link).some(k=>!['url','faceWeight'].includes(k)))throw Error('字体链接无效');
      if(typeof link.url!=='string'||link.url.length>2048||/[\u0000-\u0020\u007f]/.test(link.url))throw Error('字体链接无效');
      let url;try{url=new URL(link.url);}catch{throw Error('请输入完整字体文件直链');}
      if(url.href.length>2048||!['http:','https:'].includes(url.protocol)||url.username||url.password||url.hash)throw Error('只支持HTTP或HTTPS字体文件直链');
      const weight=link.faceWeight??'400';
      if(!['100 900',...Array.from({length:9},(_,i)=>String((i+1)*100))].includes(weight))throw Error('字体文件类型无效');
      item.fontLink={url:url.href,faceWeight:weight};
    }
    return [key,item];
  }));
}
export function freeText(items) {return Object.values(items).some(item=>item.x!==0||item.y!==0||item.z!==3);}
export function sceneReserves(scene,nodes) {
  let top=scene.top,bottom=scene.bottom;
  for(const node of nodes.filter(Boolean)){
    const rect=node.getBoundingClientRect();
    if(!rect.width||!rect.height)continue;
    top=Math.min(top,rect.top);bottom=Math.max(bottom,rect.bottom);
  }
  return {top:Math.max(0,Math.ceil(scene.top-top)),bottom:Math.max(0,Math.ceil(bottom-scene.bottom))};
}
// All values are validated; family names come exclusively from the font session.
export function textItemRules(items,selectors,families={},tokens={},fallbacks={},{position=true,zIndices={}}={}) {
  const moving=freeText(items);
  return Object.keys(selectors).map(key=>{
    const item=items[key],token=tokens[key]||key,z=zIndices[key]??item.z;let rules='';
    if(moving&&position)rules+=`position:relative!important;left:var(--otx-${token},0px)!important;top:${item.y}px!important;z-index:${z}!important;`;
    if((!moving||!position)&&zIndices[key]!==undefined)rules+=`z-index:${z}!important;`;
    if(item.weight!=='auto')rules+=`font-weight:${item.weight}!important;`;
    if(families[key])rules+=`font-family:"${families[key]}",${fallbacks[key]||`var(--otfallback-${token})`}!important;`;
    return rules?`${selectors[key]}{${rules}}`:'';
  }).join('\n');
}

export function captionWidthPixels(value,headerWidth) {
  const width=textSettings({captionWidth:value}).captionWidth;
  return width==='auto'?null:Math.max(0,headerWidth)*width/100;
}
