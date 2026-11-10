import {regionZ,imageKey} from './region-layers.mjs';
import {layerSizeStyle} from './shape-assets.mjs';
import {DRAWERS,INPUT_ICONS,chromeSourceUrl,chromeTopMetrics} from './chrome.mjs';
export function createChromePreview({document,ui,onPick,resolveArtwork}={}){
 let top=null,input=null;const nodes=[];const make=(tag,cls,parent,text)=>{const n=document.createElement(tag);n.className=cls;if(text)n.textContent=text;parent?.append(n);return n;};
 function build(){
  if(top?.isConnected)return;const sheld=document.querySelector('#sheld');if(!sheld)return;
  top=make('div','otl-page-topbar');input=make('div','otl-page-input');for(const node of [top,input]){node.dataset.orangeLabFixture='chrome';node.setAttribute('data-oc-preview','');node.addEventListener('keydown',e=>{e.stopPropagation();const art=e.target.closest('[data-layer-id]');if(art&&ui.region==='input'&&['Enter',' '].includes(e.key)){e.preventDefault();onPick?.('input','image',art.dataset.layerId);}});node.addEventListener('keyup',e=>e.stopPropagation());node.addEventListener('click',e=>{e.stopPropagation();const art=e.target.closest('[data-layer-id]');if(art){e.preventDefault();onPick?.('input','image',art.dataset.layerId);return;}const b=e.target.closest('[data-chrome-pick]');if(b){e.preventDefault();onPick?.(b.dataset.chromeZone,b.dataset.chromeKind,b.dataset.chromePick);}});nodes.push(node);}
  sheld.prepend(top);sheld.append(input);
  DRAWERS.forEach(([id,name],i)=>{const button=make('button','',top,['☷','⚡','A','▣','⚙','▧','◇','☺','▤'][i]);button.type='button';button.title=name+' · 虚构预览';button.dataset.chromeZone='topbar';button.dataset.chromeKind='icons';button.dataset.chromePick=id;});
  make('div','otl-page-file',input,'示例附件 · 随行占位');const composer=make('div','otl-page-composer',input),left=make('div','otl-page-tools',composer),textarea=make('textarea','otl-page-textarea',composer),right=make('div','otl-page-send',composer);textarea.setAttribute('rows','1');textarea.setAttribute('aria-label','虚构输入预览');textarea.placeholder='虚构输入，不会发送消息';textarea.value='想把今天的心情，写成一封信。';textarea.addEventListener('input',()=>{ui.demoText=textarea.value;fit();});textarea.addEventListener('focus',()=>onPick?.('input','text','text'));
  for(const [id,name]of INPUT_ICONS){const button=make('button','',id==='options_button'||id==='extensionsMenuButton'?left:right,({options_button:'☰',extensionsMenuButton:'✧',send_but:'➤',mes_stop:'■'})[id]);button.type='button';button.title=name+' · 虚构预览';button.dataset.chromeZone='input';button.dataset.chromeKind='tools';button.dataset.chromePick=id;}
  make('div','otl-page-qr',input,'示例快捷回复　 晚安　 继续故事');
 }
 function fit(){const textarea=input?.querySelector('textarea');if(!textarea)return;textarea.style.height='1px';textarea.style.height=textarea.scrollHeight+'px';}
 function update(c){
  build();if(!top)return;const metrics=chromeTopMetrics(top.clientWidth||top.getBoundingClientRect().width||390,c.chromeStyle.topbar);for(const [key,value]of Object.entries(metrics))top.style.setProperty('--oc-top-'+key,value+'px');
  const visible=ui.page==='chat'&&ui.previewMode==='page';const focused=(document.defaultView?.innerWidth||1200)<=700&&ui.mobileView!=='preview';top.hidden=!visible||(focused&&ui.region!=='topbar');input.hidden=!visible||(focused&&!['input','qr'].includes(ui.region));
  for(const [zone,node]of [['topbar',top],['input',input]])for(const button of node.querySelectorAll('[data-chrome-pick]')){
   const src=chromeSourceUrl(c.chromeStyle[zone].icons[button.dataset.chromePick]);let image=button.querySelector('.otl-chrome-icon');
   if(image&&image.getAttribute('src')!==src){image.remove();image=null;}
   if(c.chromeStyle[zone].enabled&&src&&button.dataset.ocFailed!==src){if(!image){image=make('img','otl-chrome-icon',button);image.alt='';const current=image;image.onerror=()=>{if(current.isConnected&&button.querySelector('.otl-chrome-icon')===current&&current.getAttribute('src')===src){button.dataset.ocFailed=src;delete button.dataset.ocImage;current.remove();}};image.src=src;}button.dataset.ocImage='true';image.style.setProperty('--oc-icon-size',(zone==='topbar'?metrics.icon:c.chromeStyle[zone].iconSize)+'px');}else{image?.remove();delete button.dataset.ocImage;if(!c.chromeStyle[zone].enabled||!src)delete button.dataset.ocFailed;}
   if(zone==='topbar'){button.dataset.demoOpen=String(button.dataset.chromePick===ui.demoDrawer);button.dataset.demoDisconnected=String(button.dataset.chromePick==='sys-settings-button'&&ui.demoState==='disconnected');}
  }
  input.querySelector('.otl-page-file').hidden=ui.demoState!=='attachment';input.querySelector('.otl-page-qr').hidden=ui.demoState!=='qr';input.querySelector('[data-chrome-pick=send_but]').hidden=['disconnected','generating'].includes(ui.demoState);input.querySelector('[data-chrome-pick=mes_stop]').hidden=ui.demoState!=='generating';input.querySelector('textarea').placeholder=ui.demoState==='disconnected'?'未连接 · 虚构状态':'虚构输入，不会发送消息';
  let art=input.querySelector('.otl-input-art');if(!art)art=make('div','otl-input-art',input);art.replaceChildren();if(c.chromeStyle.input.enabled)for(const layer of c.layers.filter(l=>l.anchor==='input'&&l.visible)){const src=resolveArtwork(layer);if(!src)continue;const image=make('img','',art);image.dataset.layerId=layer.id;image.dataset.pick='decoration';image.src=src;image.alt=layer.name;image.tabIndex=0;image.setAttribute('role','button');Object.assign(image.style,{...layerSizeStyle(layer),[layer.side]:layer.x+(layer.offsetUnit==='percent'?'%':'px'),[layer.vertical]:layer.y+(layer.offsetUnit==='percent'?'%':'px'),opacity:layer.opacity,transform:`rotate(${layer.rotation}deg)`,zIndex:regionZ(c,'input',imageKey(layer.id))});}
  fit();
 }
 function close(){for(const node of nodes)node.remove();nodes.length=0;top=input=null;}
 return {update,fit,close};
}
export const CHROME_PREVIEW_BASE=`
html[data-orange-lab] [data-oc-preview][hidden],html[data-orange-lab] [data-oc-preview] [hidden]{display:none!important}
html[data-orange-lab] [data-oc-preview]{box-sizing:border-box;color:#354b42;font:16px/1.5 sans-serif;background:#fffdf8;border:1px solid #dce5dc}
html[data-orange-lab] .otl-page-topbar{display:grid;grid-template-columns:repeat(9,minmax(0,1fr));padding:4px;gap:2px;min-height:44px}
html[data-orange-lab] [data-oc-preview] button{position:relative;display:grid;place-items:center;box-sizing:border-box;min-width:0;border:0;background:transparent;color:inherit;font:22px sans-serif;cursor:pointer;width:36px;height:36px;padding:0;margin:auto}
html[data-orange-lab] [data-oc-preview] [data-oc-image]{font-size:0!important}
html[data-orange-lab] .otl-page-input{padding:8px;position:relative}
html[data-orange-lab] .otl-page-composer{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:6px}
html[data-orange-lab] .otl-page-tools,html[data-orange-lab] .otl-page-send{display:flex;flex-wrap:wrap;gap:6px}
html[data-orange-lab] .otl-page-textarea{display:block;width:100%;box-sizing:border-box;min-width:0;min-height:44px;max-height:320px;margin:0;padding:10px 6px;border:0;resize:vertical;font:16px/1.5 sans-serif;color:inherit;background:transparent;overflow:auto}
html[data-orange-lab] .otl-page-file,html[data-orange-lab] .otl-page-qr{font:12px/1.5 sans-serif;padding:6px;background:#edf1e8;border-radius:5px;margin:4px 0}
html[data-orange-lab][data-otl-preview-mode=page] #sheld{display:grid!important;grid-template-rows:auto minmax(0,1fr) auto;grid-template-columns:minmax(0,1fr);justify-content:center;gap:0!important}
html[data-orange-lab][data-otl-preview-mode=page] #sheld>.otl-page-topbar{grid-row:1}html[data-orange-lab][data-otl-preview-mode=page] #sheld>#chat{grid-row:2;min-height:0}html[data-orange-lab][data-otl-preview-mode=page] #sheld>.otl-page-input{grid-row:3}
html[data-orange-lab][data-otl-preview-mode=page] #sheld>:is(.otl-page-topbar,#chat){width:100%;max-width:100%;min-width:0}
html[data-orange-lab][data-otl-preview-mode=page] #sheld>.otl-page-input{justify-self:start;min-width:0}
html[data-orange-lab][data-otl-preview-mode=page][data-otl-narrow=true] #sheld{grid-template-columns:minmax(0,390px)!important}
html[data-orange-lab][data-otl-preview-mode=page] #sheld>:not(#chat):not([data-oc-preview]){display:none!important}
html[data-orange-lab][data-otl-preview-mode=page] #chat{height:100%!important;min-height:0!important;border-radius:0!important;box-sizing:border-box!important}
html[data-orange-lab][data-otl-preview-mode=page] #chat>.mes[data-orange-lab-fixture]{width:100%!important;min-width:0!important}
html[data-orange-lab][data-otl-preview-mode=page] #form_sheld{display:none!important}
`;

