import {createImageDisplay} from './image-display.mjs';
import {createSchemeStorage} from './scheme-storage.mjs';
import {createFontLibrary,renderFontLibrary} from './font-library.mjs';
import {createAssetLibrary} from './asset-library.mjs';
import {prepareImageUpload,inspectImageBlob,dataUrlToBlob} from './image-processing.mjs';
import {normalizeImageUrl,validEmbeddedImage,MAX_IMAGE_DATA_LENGTH} from './image-sources.mjs';
import {installLauncherDrag} from './launcher-drag.mjs';
import {avatarArtworkFrameStyle} from './avatar-art.mjs';
import {regionEntries,regionZ,regionForImage,imageKey,moveRegionItem,canMoveRegionItem,syncRegionOrder,validateRegionOrder} from './region-layers.mjs';
import {shapeDataUrl,layerSizeStyle,SHAPE_NAMES} from './shape-assets.mjs';
import {captionMatchesScope} from './captions.mjs';
import {updateHeaderArtworkClip} from './header-art-clip.mjs';
import {previewFrameGeometry} from './preview-layout.mjs';
import {avatarDesignRules,readPreviewAvatars} from './avatar-design.mjs';
import {addNumericStepper,NUMERIC_STEPPER_CSS} from './numeric-stepper.mjs';
import {normalizeCanvasBackground,canvasBackgroundRules} from './canvas-background.mjs';
import {createColorPicker} from './color-picker.mjs';
import {createScrollbarVisibility,normalizeScrollbars} from './scrollbars.mjs';
import {installMobileFlow} from './mobile-flow.mjs';
import {createLayerDrag} from './layer-drag.mjs';
import {normalizeAvatarFill,avatarFillRules} from './avatar-fill.mjs';
import {createInputFitBridge} from './chrome-adapter.mjs';
import {normalizeChromeConfig,DRAWERS,INPUT_ICONS,chromeFontEntries,chromeRules,PREVIEW_CHROME_SELECTORS} from './chrome.mjs';
import {createChromePreview,CHROME_PREVIEW_BASE} from './chrome-preview.mjs';
import {createPagePreview,PAGE_PREVIEW_CSS,PREVIEW_PAGES} from './page-preview.mjs';
import {sceneWidth,normalizeTextScene,newSceneCaption,prepareScene,placeScene,sceneTextRules,sceneFrameRules} from './text-scene.mjs';
import {normalizeNativeConfig,nativeRules,renderNative,latestAI} from './native.mjs';
import {footerBaseHeight,FOOTER_LIMIT,footerKey,newFooterCaption,normalizeFooterConfig,footerTextEntries,footerRules,renderFooter,measureFooter} from './footer.mjs';
import {normalizeReasoningConfig,reasoningFontEntries,reasoningRules,reasoningShellRules,reasoningImageUrl,interfaceFont,watchInterfaceFont} from './reasoning.mjs';
import {BODY_CARD_DEFAULTS,bodyCardSettings,bodyCardRules,chatFrameRules} from './body-card.mjs';
import {CAPTION_LIMIT,captionKey,captionToken,newCaption,normalizeCaptionConfig,stripLegacyCaptions,validateCaptionStyle,textEntries,textTokens,textFallbacks} from './captions.mjs';
import {workbenchMarkup,createWorkbench,matchingLayers,normalizeSelection,layerRegion,layoutWidths,mobileGeometry} from './workbench-ui.mjs';
import {newLayer, migrateLayers, clone, cropRect, LAYER_LIMIT} from './layers.mjs';
import {ASSETS,SHARED_ASSETS,assetUrl,builtinAssetGroups} from './catalog.mjs';
import {defaultPhoto,validatePhotos,kittyLayers} from './photos.mjs';
import {createLiveAdapter} from './live-adapter.mjs';
import {createFontSession} from './font-sources.mjs';
import {TEXT_DEFAULTS,textSettings,captionWidthPixels,metadataPadding,customTextLayout,TEXT_Z_MAX,validateTextItems,freeText,sceneReserves,textItemRules} from './text-layout.mjs';

await (async () => {
  'use strict';
  if (document.getElementById('orange-theme-lab')) return;
  const schemeStorage=createSchemeStorage();let loadError=null;
  const fonts = [['serif','宋体风格'],['sans-serif','黑体风格'],['Georgia, serif','英文衬线'],['monospace','等宽字体']];
  const base = { ...TEXT_DEFAULTS, ...BODY_CARD_DEFAULTS, textItems:validateTextItems(), version:1, template:'letter', avatarDesign:'unified', canvasBackground:'tavern', background:'#e8ece6', surface:'#fffdf8', text:'#354b42', accent:'#6f8973', radius:20, font:'serif', fontSize:17, lineHeight:1.9, layout:'top', avatarSize:88, headerHeight:240, avatarRadius:16, nameColor:'#354b42', nameSize:23, nameFont:'serif', timeColor:'#89958b', timeSize:12, timePosition:'below', caption:'今日也有一封来信', captionColor:'#7e9477', captionSize:14, captionFont:'serif', captionPosition:'above', reasoning:'展开这页思绪', reasoningSize:14, reasoningFont:'serif', decoration:'flower', decorationWidth:90, decorationX:8, decorationY:8, decorationOpacity:0.8, glass:0, image:'' };
  const templates = {
    letter:{...base},
    clear:{...base,template:'clear',background:'#eaf0f6',surface:'#ffffff',text:'#344963',accent:'#7893b3',radius:8,font:'sans-serif',layout:'left',avatarSize:56,headerHeight:140,nameSize:18,caption:'一个普通而清新的日子',decoration:'none'},
    scrapbook:{...base,template:'scrapbook',background:'#f0e9e0',surface:'#fffaf0',text:'#645243',accent:'#aa8562',radius:3,avatarSize:112,headerHeight:265,caption:'把今天收进这一页',captionColor:'#a07d60',decoration:'star',decorationWidth:110}
  };
  base.surfaceOpacity=1;
  for(const theme of Object.values(templates))theme.surfaceOpacity=1;
  base.cardWidth=760;
  for(const theme of Object.values(templates))theme.cardWidth=760;
  templates.kitty={...base,template:'kitty',avatarDesign:'separate',background:'#edf1f8',surface:'#ffffff',text:'#28365e',accent:'#7985b6',radius:9,font:'"LabSongti",serif',fontSize:15,lineHeight:1.95,layout:'collage',headerHeight:240,nameFont:'serif',nameColor:'#26365f',nameSize:22,timeColor:'#61769c',caption:'今夜有一点魔法',captionColor:'#5d70a0',captionSize:11,captionPosition:'below',reasoning:'Kitty Gets to Work',reasoningFont:'Georgia, serif',cardWidth:680,layers:kittyLayers(),photos:{ai:defaultPhoto({enabled:true,size:190,rotation:-.6,asset:'kitty-header-garden'}),user:defaultPhoto({enabled:true,size:190,rotation:.45,asset:'kitty-user-window'})}};
  templates.blank={...templates.clear,template:'blank',caption:'',decoration:'none',layers:[]};
  for(const theme of Object.values(templates))if(!theme.photos)theme.photos={ai:defaultPhoto({size:theme.avatarSize,radius:theme.avatarRadius}),user:defaultPhoto({size:theme.avatarSize,radius:theme.avatarRadius})};
  fonts.push(['"LabSongti",serif','随包思源宋体']);
  templates.scrapbook.layers=[newLayer('tape',{name:'照片上方胶带',side:'left',width:135,x:-9,y:-7,rotation:-12,z:4}),newLayer('leaf',{name:'右侧叶枝',width:105,x:5,y:14,rotation:14,z:0,opacity:.5}),newLayer('flower',{name:'角落小花',width:64,x:8,y:95,rotation:-15,z:3}),newLayer('star',{name:'小星星',width:38,x:100,y:10,rotation:12,z:2})];
  let config=normalizeAvatarFill(normalizeChromeConfig(normalizeTextScene(normalizeNativeConfig(normalizeFooterConfig(normalizeReasoningConfig(normalizeCaptionConfig({...base,textItems:validateTextItems(),layers:migrateLayers(base),photos:validatePhotos()}))))))), saved=null, history=[], active=false, disabledStyle=null, wasDisabled=false, panel, selected='global', selectedLayerId=config.layers[0]?.id, photoScope='ai', layoutObserver=null, fitFrame=0, fontSession=null, textItemKey='name', editEpoch=0, cancelCrop=null, imageUploadAbort=null, uploadFeedback=null, stopInterfaceWatch=null, libraryPurpose='layer', reasoningAnchor='reasoning-entry', previewFooterSizes=new Set(),previewChatWidth=0;
  const assetLibrary=createAssetLibrary();
  const fontLibrary=createFontLibrary();
  const host=document.createElement('div'); host.id='orange-theme-lab'; document.body.append(host);
  const shadow=host.attachShadow({mode:'open'});
  const imageDisplay=createImageDisplay({document,selector:'[data-orange-lab-fixture] img, img[data-layer-id], [data-library-asset] img'});
  const scrollbarVisibility=createScrollbarVisibility({document,ownShadow:shadow});
  const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
  const field=(label,key,type='text',extra={})=>({label,key,type,...extra});
  const groups={
    global:[field('卡片底色','surface','color'),field('文字颜色','text','color'),field('强调颜色','accent','color'),field('公共圆角','radius','range',{min:0,max:40,unit:'px'}),field('正文字体','font','select',{options:fonts}),field('正文字号','fontSize','range',{min:12,max:28,unit:'px'}),field('正文行高','lineHeight','range',{min:1.2,max:2.6,step:.05}),field('玻璃模糊','glass','range',{min:0,max:20,unit:'px'})],
    avatar:[field('头像大小','avatarSize','range',{min:40,max:150,unit:'px'}),field('头像圆角','avatarRadius','range',{min:0,max:80,unit:'px'}),field('头像区总高度','headerHeight','range',{min:60,max:240,unit:'px'}),field('名字字体','nameFont','select',{options:fonts}),field('名字颜色','nameColor','color'),field('名字字号','nameSize','range',{min:8,max:200,unit:'px'}),field('时间颜色','timeColor','color'),field('时间字号','timeSize','range',{min:8,max:200,unit:'px'}),field('时间位置','timePosition','select',{options:[['below','名字下面'],['beside','名字旁边']]} )],
    caption:[field('自定义文案','caption','textarea'),field('文案位置','captionPosition','select',{options:[['above','名字上方'],['below','名字下方'],['hidden','隐藏']]}),field('文案字体','captionFont','select',{options:fonts}),field('文案颜色','captionColor','color'),field('文案字号','captionSize','range',{min:10,max:26,unit:'px'})],
    reasoning:[field('入口文字','reasoning'),field('思维字体','reasoningFont','select',{options:fonts}),field('入口字号','reasoningSize','range',{min:12,max:24,unit:'px'})],
    decoration:[field('装饰图案','decoration','select',{options:[['flower','花朵'],['star','星星'],['custom','我的图片'],['none','不显示']]}),field('装饰大小','decorationWidth','range',{min:20,max:180,unit:'px'}),field('距右边','decorationX','range',{min:0,max:100,unit:'px'}),field('距顶部','decorationY','range',{min:0,max:160,unit:'px'}),field('装饰透明度','decorationOpacity','range',{min:0,max:1,step:.05})]
  };
  groups.global.push(field('卡片不透明度','surfaceOpacity','range',{min:0,max:1,step:.05}));
  groups.global.push(field('卡片最大宽度','cardWidth','range',{min:320,max:900,unit:'px'}));
  groups.avatar.push(field('时间字体','timeFont','select',{options:[['auto','沿用当前字体'],...fonts]}),field('文字区对齐','textAlign','select',{options:[['start','左对齐'],['center','居中'],['end','右对齐']]}),field('文字区两侧内缩','textInset','range',{min:0,max:20,unit:'%'}),field('文字区上方留白','textTop','range',{min:0,max:80,unit:'px'}));

  groups.avatar.find(f=>f.key==='headerHeight').max=1000;
  function validate(raw){
    if(!raw || ![1,2,3,4,5,6,7,8,9,10].includes(raw.version)) throw Error('方案版本不支持');
    if(raw.version<10&&raw.headerHeight!==undefined&&raw.headerHeight>360)throw Error('旧头像区高度超出范围');
    if(raw.version<8){for(const [key,min,max]of [['nameSize',14,34],['timeSize',10,18]])if(raw[key]!==undefined&&(!Number.isFinite(raw[key])||raw[key]<min||raw[key]>max))throw Error('旧字号超出范围');}
    if(raw.version>=8&&Object.hasOwn(raw,'timePosition'))throw Error('新版方案不能包含旧时间位置');
    if(raw.avatarDesign!==undefined&&!['unified','separate'].includes(raw.avatarDesign))throw Error('头像设计对象无效');
    const hideScrollbars=normalizeScrollbars(raw.hideScrollbars);
    const canonical=normalizeCaptionConfig(raw),reasoning=normalizeReasoningConfig(raw),footer=normalizeFooterConfig(raw),native=normalizeNativeConfig(raw),result={...base,...textSettings(raw),...bodyCardSettings(raw)};
    for(const f of Object.values(groups).flat()){
      const v=raw[f.key]; if(v===undefined)continue;
      if(f.type==='range') {if(!Number.isFinite(v)||v<f.min||v>f.max)throw Error('数值超出范围：'+f.label);}
      else if(f.type==='color') {if(typeof v!=='string'||!/^#[0-9a-f]{6}$/i.test(v))throw Error('颜色格式无效');}
      else if(f.type==='select') {if(!f.options.some(o=>o[0]===v))throw Error('选项无效：'+f.label);}
      else if(typeof v!=='string'||v.length>300)throw Error('文案过长');
      result[f.key]=v;
    }
    if(raw.image){if(!validEmbeddedImage(raw.image))throw Error('图片格式不支持');result.image=raw.image;}
    if(Object.hasOwn(templates,raw.template))result.template=raw.template;if(raw.layout!==undefined){if(!['top','left','collage'].includes(raw.layout))throw Error('排版值无效');result.layout=raw.layout;}
    result.avatarDesign=raw.avatarDesign||'separate';Object.assign(result,normalizeCanvasBackground(raw));result.hideScrollbars=hideScrollbars;result.textItems=canonical.textItems;result.captions=canonical.captions;result.layers=migrateLayers(raw);result.photos=validatePhotos(raw.photos);result.reasoningStyle=reasoning.reasoningStyle;result.footerCaptions=footer.footerCaptions;result.nativeStyle=native.nativeStyle;result.version=raw.version>=8?raw.version:7;if(raw.version>=8)delete result.timePosition;result.image='';
    if(raw.surfaceOpacity===undefined&&raw.glass>0)result.surfaceOpacity=.81;
    for(const key of ['reasoning','reasoningFont','reasoningSize'])delete result[key];const scene=normalizeTextScene(stripLegacyCaptions(result));if(raw.regionOrder)scene.regionOrder=validateRegionOrder(raw.regionOrder,scene);return syncRegionOrder(normalizeAvatarFill(normalizeChromeConfig({...scene,version:raw.version,...(Object.hasOwn(raw,'chromeStyle')?{chromeStyle:raw.chromeStyle}:{}),...(Object.hasOwn(raw,'avatarFill')?{avatarFill:raw.avatarFill}:{})})));
  }
  try{const raw=await schemeStorage.load();if(raw!==null){saved=validate(JSON.parse(raw));config=clone(saved);selectedLayerId=config.layers[0]?.id;}}catch(error){loadError=error;console.warn('[主题编辑实验] 保存方案未载入',error.message);}
  const decorations={
    flower:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><g fill="#e5b3b1"><ellipse cx="60" cy="35" rx="15" ry="27"/><ellipse cx="60" cy="35" rx="15" ry="27" transform="rotate(72 60 60)"/><ellipse cx="60" cy="35" rx="15" ry="27" transform="rotate(144 60 60)"/><ellipse cx="60" cy="35" rx="15" ry="27" transform="rotate(216 60 60)"/><ellipse cx="60" cy="35" rx="15" ry="27" transform="rotate(288 60 60)"/></g><circle cx="60" cy="60" r="13" fill="#e9ca81"/></svg>',
    star:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><path d="m60 8 14 34 37 3-28 24 9 36-32-19-32 19 9-36L9 45l37-3z" fill="#e6c480" stroke="#b89355" stroke-width="2"/><path d="m22 8 3 9 9 3-9 3-3 9-3-9-9-3 9-3z" fill="#acb8a0"/></svg>',
    tape:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 48"><path d="m5 3 8 4 6-4 9 4 7-4h126l-3 8 7 8-5 9 5 9-8 8H15l4-7-8-7 6-10-8-7z" fill="#d6c1a1" fill-opacity=".85"/><path d="M20 16h130M20 30h130" stroke="#fff" stroke-opacity=".3" stroke-width="2" stroke-dasharray="3 6"/></svg>',
    leaf:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 180"><path d="M43 172Q22 100 69 10" fill="none" stroke="#718d70" stroke-width="2"/><g fill="#8fa284"><ellipse cx="42" cy="131" rx="11" ry="27" transform="rotate(-40 42 131)"/><ellipse cx="56" cy="104" rx="11" ry="26" transform="rotate(40 56 104)"/><ellipse cx="40" cy="79" rx="10" ry="25" transform="rotate(-35 40 79)"/><ellipse cx="64" cy="52" rx="9" ry="24" transform="rotate(35 64 52)"/><ellipse cx="65" cy="22" rx="8" ry="19" transform="rotate(15 65 22)"/></g></svg>'
  };
  const svgUrl=svg=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  let previewAvatars={};
  const avatarUrl=(user)=>svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140"><rect width="120" height="140" fill="${user?'#d9d4c4':'#cddbcf'}"/><circle cx="60" cy="51" r="23" fill="#fffaf0"/><path d="M15 140v-18c0-44 90-44 90 0v18" fill="#fffaf0"/><path d="M18 14h84" stroke="#ffffff" opacity=".5"/></svg>`);
  let noticeTimer;
  function notify(text,duration=4500){const n=shadow.querySelector('#notice');n.textContent=text;clearTimeout(noticeTimer);if(duration){noticeTimer=setTimeout(()=>{n.textContent='';},duration);noticeTimer.unref?.();}}
  function remember(){shadow.querySelector('#save-state').textContent='未保存的草稿';history.push(clone(config));if(history.length>40)history.shift();}
  function fixture(user,long=false){
    const msg=make('div','mes');msg.dataset.orangeLabFixture='message';msg.setAttribute('is_user',String(user));msg.setAttribute('is_system','false');msg.setAttribute('mesid',user?'2':'1');
    const header=make('div','otl-header');header.dataset.pick='avatar';header.tabIndex=0;header.setAttribute('role','button');header.setAttribute('aria-label',user?'选择用户头像区':'选择 AI 头像区');
    const photoGroup=make('div','otl-photo-group');photoGroup.dataset.pick='photo';photoGroup.dataset.scope=user?'user':'ai';photoGroup.tabIndex=0;photoGroup.setAttribute('role','button');photoGroup.setAttribute('aria-label',user?'选择用户头像':'选择 AI 头像');
    const av=make('div','mesAvatarWrapper');const image=make('img');image.src=avatarUrl(user);image.alt=user?'实验用户头像':'实验角色头像';av.append(image);photoGroup.append(av);
    const meta=make('div','otl-meta');const caption=make('div','otl-caption');caption.dataset.pick='caption';
    const row=make('div','otl-name-row');row.append(make('span','name_text',user?'旅人':'小砚 · 雨天邮局'),make('small','timestamp','2026/11/08 16:30'));for(const [selector,key]of [['.name_text','name'],['.timestamp','time']]){row.querySelector(selector).dataset.pick='avatar';row.querySelector(selector).dataset.textItem=key;}
    meta.append(row);header.append(photoGroup,meta);
    const block=make('div','mes_block');
    if(!user){const details=make('details','mes_reasoning_details');details.dataset.state='done';const summary=make('summary','mes_reasoning_summary');summary.dataset.pick='reasoning';const hb=make('div','mes_reasoning_header_block'),rh=make('div','mes_reasoning_header');rh.append(make('span','otl-reasoning-title'),make('span','mes_reasoning_arrow','⌄'));rh.querySelector('.otl-reasoning-title').dataset.pick='reasoning';hb.append(rh);summary.append(hb);const body=make('div','mes_reasoning','这里是虚构的思维内容，用来检查展开后的字体、换行和间距。');body.dataset.pick='reasoning-body';details.append(summary,body);block.append(details);}
    const demo=make('div','otl-native-demo mes_buttons');demo.dataset.demoNative='actions';const more=make('div','extraMesButtonsHint mes_button','⋯'),extra=make('div','extraMesButtons','复制 · 翻译'),edit=make('div','mes_edit mes_button','✎');extra.style.display='none';demo.append(more,extra,edit);const editState=make('div','mes_edit_buttons');editState.dataset.demoNative='actions';editState.style.display='none';editState.append(make('span','mes_edit_done','✓'),make('span','mes_edit_cancel','×'));header.append(demo,editState);
    const statHome=make('div','otl-demo-stat-home');Object.assign(statHome.style,{position:'absolute',left:'0',top:'0'});msg.append(statHome);for(const [cls,value]of [['mesIDDisplay','#1'],['mes_timer','2.0s'],['tokenCounterDisplay','120t']]){const n=make('div',cls,value);n.dataset.demoNative='info';statHome.append(n);}const left=make('div','swipe_left','‹'),right=make('div','swipeRightBlock'),arrow=make('div','swipe_right','›'),count=make('div','swipes-counter','1\u200b/\u200b2');left.dataset.demoNative='swipe';right.dataset.demoNative='swipe';right.append(arrow,count);if(user){left.style.display='none';right.style.display='none';}msg.append(left,right);
    msg.addEventListener('click',event=>{const n=event.target.closest('[data-demo-native]');if(!n)return;event.preventDefault();event.stopPropagation();invalidateEditing();workbench.choose('native',n.dataset.demoNative,n.dataset.demoNative);renderFields();});
    const text=make('div','mes_text');text.dataset.pick='body';
    const content=user?['想把雨滴和今天的心情，一起收进这一页。']:long?['这是一段较长的实验消息，用来查看文字变多之后，卡片是否能够自然撑开。你可以调整行高、字号和头像区布局，不需要改变消息内容。','窗外的雨还没有停，桌上摊着一封没有写完的信。我们留出一点空白，让文案和图片都能呼吸。','这是第三段文字。继续向下滚动，检查不同消息长度是否会挤压头像和装饰。']:['午后下了一场雨，我替你留了一张靠窗的座位。','你可以点头像区、文案、思维入口或花朵，切换右边正在编辑的内容。'];
    for(const p of content)text.append(make('p','',p));block.append(text);msg.append(header,block);return msg;
  }
  const liveStyle=document.createElement('style');liveStyle.id='orange-theme-lab-preview-style';
  liveStyle.textContent=`
html[data-orange-lab]{transform:none!important;perspective:none!important}
html[data-orange-lab] #sheld{position:fixed!important;left:24px!important;right:400px!important;top:96px!important;bottom:24px!important;width:auto!important;height:auto!important;max-width:none!important;max-height:none!important;transform:none!important;margin:0!important;z-index:10020!important;background:none!important;border:0!important;box-shadow:none!important}
html[data-orange-lab] #chat{display:block!important;width:100%!important;height:100%!important;max-height:none!important;padding:24px!important;margin:0!important;overflow:auto!important;background:var(--otl-background)!important;border-radius:20px!important;border:1px solid #ffffff88!important;backdrop-filter:none!important}
html[data-orange-lab] #chat>:not([data-orange-lab-fixture]),html[data-orange-lab] #send_form{display:none!important}
html[data-orange-lab] #chat>.mes[data-orange-lab-fixture]{position:relative!important;display:block!important;box-sizing:border-box!important;max-width:760px!important;width:100%!important;margin:0 auto 18px!important;padding:24px!important;border:1px solid #ffffffaa!important;border-radius:var(--otl-radius)!important;background:var(--otl-surface)!important;color:var(--otl-text)!important;box-shadow:0 5px 28px #344b4210!important;backdrop-filter:blur(var(--otl-glass))!important;text-shadow:none!important;font-family:var(--otl-font)!important;font-size:var(--otl-fontSize)!important}
html[data-orange-lab] .otl-header{display:flex;flex-direction:column;align-items:flex-start;position:relative;gap:12px;min-height:var(--otl-headerHeight);padding:8px 0 18px;border-bottom:1px solid color-mix(in srgb,var(--otl-accent) 25%,transparent);cursor:pointer}
html[data-orange-lab][data-otl-layout=left] .otl-header{flex-direction:row;align-items:center;padding-right:60px}
html[data-orange-lab] .otl-header .mesAvatarWrapper{display:block!important;width:var(--otl-avatarSize)!important;flex:0 0 var(--otl-avatarSize);margin:0!important;position:static!important}
html[data-orange-lab] .otl-header .mesAvatarWrapper img{display:block!important;width:var(--otl-avatarSize)!important;height:var(--otl-avatarSize)!important;object-fit:cover;border-radius:var(--otl-avatarRadius)!important}
html[data-orange-lab] .otl-meta{display:flex;flex-direction:column;gap:7px;min-width:0;position:relative;z-index:1}
html[data-orange-lab] .otl-name-row{display:flex;flex-direction:column;gap:5px;align-items:flex-start}
html[data-orange-lab][data-otl-time=beside] .otl-name-row{flex-direction:row;flex-wrap:wrap;align-items:baseline;gap:10px}
html[data-orange-lab] .otl-name-row .name_text{font-family:var(--otl-nameFont)!important;font-size:var(--otl-nameSize)!important;color:var(--otl-nameColor)!important;line-height:1.4!important;overflow-wrap:anywhere}
html[data-orange-lab] .otl-name-row .timestamp{display:inline!important;line-height:1.5!important;font-size:var(--otl-timeSize)!important;color:var(--otl-timeColor)!important;white-space:normal}
html[data-orange-lab] .otl-caption{font-family:var(--otl-captionFont)!important;font-size:var(--otl-captionSize)!important;color:var(--otl-captionColor)!important;line-height:1.6!important;white-space:pre-wrap;overflow-wrap:anywhere;cursor:pointer}
html[data-orange-lab][data-otl-caption=below] .otl-caption{order:2}
html[data-orange-lab][data-otl-caption=hidden] .otl-caption{display:none}
html[data-orange-lab] .otl-decoration{position:absolute;height:auto;max-width:none;cursor:pointer;transform-origin:center;isolation:isolate}
html[data-orange-lab] .mes[data-orange-lab-fixture] .mes_block{display:block!important;width:100%!important;max-width:none!important;min-width:0!important;margin:0!important;padding:0!important;overflow:visible!important}
html[data-orange-lab] .mes[data-orange-lab-fixture] .mes_text{padding:0!important;margin:0!important;line-height:var(--otl-lineHeight)!important;font-family:var(--otl-font)!important;font-size:var(--otl-fontSize)!important;color:var(--otl-text)!important;overflow-wrap:anywhere}
html[data-orange-lab] .mes[data-orange-lab-fixture] .mes_text p{margin:0 0 12px!important;line-height:inherit!important;color:inherit!important}
html[data-orange-lab] .mes[data-orange-lab-fixture] .mes_reasoning_details{display:block!important;margin:14px 0 0!important;padding:0!important;border:0!important;background:none!important}
html[data-orange-lab] .mes[data-orange-lab-fixture] .mes_reasoning_summary{display:flex!important;cursor:pointer;box-sizing:border-box!important;min-width:0!important;max-width:100%!important;margin:0!important;padding:0!important;gap:8px}
html[data-orange-lab] .mes[data-orange-lab-fixture] .mes_reasoning_header_block{flex:1;min-width:0}
html[data-orange-lab] .mes[data-orange-lab-fixture] .mes_reasoning_header{display:flex;align-items:baseline;gap:8px}

html[data-orange-lab] .otl-foot{font:11px/1.6 sans-serif;color:#8d968d;margin-top:18px}
html[data-orange-lab] .otl-selected{outline:2px dashed var(--otl-accent);outline-offset:5px}
@media(max-width:900px){html[data-orange-lab] #sheld{left:8px!important;right:340px!important;top:84px!important;bottom:12px!important}html[data-orange-lab] #chat{padding:12px!important}html[data-orange-lab] #chat>.mes[data-orange-lab-fixture]{padding:24px!important}}
@media(max-width:620px){html[data-orange-lab] #sheld{left:8px!important;right:8px!important;top:84px!important;bottom:47vh!important}}
`;
  liveStyle.textContent+=`
@font-face{font-family:LabSongti;src:url("${new URL('./materials/字体/SourceHanSerifCN-VF.ttf.woff2',import.meta.url).href}") format("woff2");font-style:normal;font-weight:250 900;font-display:swap}
html[data-orange-lab] #chat>.mes[data-orange-lab-fixture]{max-width:var(--otl-cardWidth)!important;container-type:inline-size}
html[data-orange-lab] .otl-photo-group{position:relative;width:var(--otl-avatarSize);aspect-ratio:1;flex-shrink:0;transform-origin:50% 100%;cursor:pointer;z-index:2}
html[data-orange-lab] .mes[data-orange-lab-fixture] .otl-photo-group>.mesAvatarWrapper{position:relative!important;width:100%!important;height:100%!important;box-sizing:border-box!important;z-index:2;flex-basis:auto!important}
html[data-orange-lab] .mes[data-orange-lab-fixture] .otl-photo-group>.mesAvatarWrapper>img{width:100%!important;height:100%!important;object-fit:cover}
html[data-orange-lab][data-otl-layout=collage] .otl-header{display:block;min-height:230px;isolation:isolate;border-bottom:1px solid #d9e1f0;padding:0 0 24px;margin-bottom:6px}
html[data-orange-lab][data-otl-layout=collage] .otl-header>.otl-photo-group{position:absolute;left:0;bottom:24px}
html[data-orange-lab][data-otl-layout=collage] .otl-header>.otl-meta{position:absolute;left:49%;top:20%;width:23%;padding:0;z-index:3;gap:6px}
html[data-orange-lab][data-otl-layout=collage] .otl-meta .name_text{font-weight:400!important;line-height:1.4}
html[data-orange-lab][data-otl-layout=collage] .otl-header[data-stacked=true]>.otl-meta{left:0;top:4px;width:72%}
`;
  shadow.innerHTML=workbenchMarkup();
  installLauncherDrag({launcher:shadow.querySelector('.launcher')});
  const colorPicker=createColorPicker({document,root:shadow});
  const numericStyle=make('style');numericStyle.textContent=NUMERIC_STEPPER_CSS;shadow.append(numericStyle);
  const workbench=createWorkbench(shadow,{onBeforePageChange:()=>pagePreview.capture(),onNavigate:({pageChanged=false}={})=>{invalidateEditing();if(!pageChanged)libraryPurpose='layer';renderFields();},onLayout:()=>{if(!active)return;updateWorkbenchLayout();chromePreview.update(config);scheduleFit();}}),ui=workbench.ui;
  panel=shadow.querySelector('.panel');
  const extraStyle=make('style');
  extraStyle.textContent=`textarea{font:inherit;width:100%;min-height:100px;resize:vertical;border:1px solid #dce3d6;border-radius:9px;padding:10px;background:white;color:#344d3e;line-height:1.6}input[aria-invalid=true]{border-color:#b86b63}.layer-list{display:grid;gap:5px;max-height:180px;overflow:auto;margin:12px 0}.layer-list button{display:flex;align-items:center;gap:9px;text-align:left;padding:7px}.layer-list button[aria-pressed=true]{background:#edf3e9;border-color:#7d9a78}.layer-list img{width:34px;height:34px;object-fit:contain;background:#f1eee5;border-radius:5px}.layer-list span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.number-input{width:80px;padding:5px;border:1px solid #dce3d6;border-radius:6px}.crop-dialog{border:1px solid #dce3d6;border-radius:18px;width:min(560px,94vw);max-height:92vh;overflow:auto;padding:22px;color:#31493e;background:#fffdf8;font:14px/1.5 system-ui,sans-serif}.crop-dialog::backdrop{background:#1e302666}.crop-dialog canvas{display:block;max-width:100%;max-height:40vh;object-fit:contain;margin:14px auto;background:repeating-conic-gradient(#eee 0% 25%,white 0% 50%) 50% / 16px 16px}.crop-dialog h3{margin:0 0 6px}.crop-dialog .actions{margin-top:16px}.layer-count{font-size:12px;color:#7c8975;margin-top:12px}`;
  shadow.append(extraStyle);
  const nativeFit=createInputFitBridge({document,load:()=>import(new URL('../../../RossAscends-mods.js',import.meta.url).href).then(m=>m.autoFitSendTextAreaDebounced)});const fitInput=()=>{if(!document.defaultView?.location?.protocol?.startsWith('http'))return;return nativeFit();};
  const liveAdapter=createLiveAdapter({document,resolveArtwork:artworkUrl,fitInput});
  function previewTextTarget(node){
    const id=node.dataset.captionId,footerId=node.dataset.footerCaptionId,key=node.dataset.textItem;
    if(node.classList.contains('otl-reasoning-title'))return {item:config.reasoningStyle.entry.labelPosition,selected:ui.region==='reasoning'&&ui.kind==='entry',percentX:false,minX:-500,maxX:500,minY:-500,maxY:500};
    const item=footerId?config.footerCaptions.find(c=>c.id===footerId&&c.visible):id?config.captions.find(c=>c.id===id&&c.visible):config.textItems[key];if(!item)return null;
    const region=footerId?'footer':'header',object=footerId?footerKey(footerId):id?captionKey(id):key;
    const parent=node.closest(footerId?'.otl-footer':'.otl-header');
    return {item,selected:ui.region===region&&ui.kind==='text'&&ui.object===object,maxX:footerId?100:200,maxY:footerId?400:1600,parent,width:footerId?(parent.clientWidth||parent.getBoundingClientRect().width||Math.max(1,config.cardWidth-48)):sceneWidth(node.closest('[data-orange-lab-fixture=message]'),config)};
  }
  function previewLayerTarget(node,item){
    if(item.anchor==='header')return {onPreview:()=>updateHeaderArtworkClip(node,item,sceneWidth(node.closest('[data-orange-lab-fixture=message]'),config),Math.max(0,config.headerHeight-24))};
    if(item.anchor!=='footer')return {};
    const root=node.closest('.otl-footer'),scene=root.querySelector('.otl-footer-scene'),flow=root.querySelector('.otl-footer-flow'),width=root.clientWidth||root.getBoundingClientRect().width||Math.max(1,config.cardWidth-48);
    const images=[...scene.querySelectorAll('.otl-footer-image')],others=config.layers.filter(l=>l.id!==item.id),fixed=footerBaseHeight(flow.getBoundingClientRect().height,width,others,images),ratio=node.naturalWidth>0&&node.naturalHeight>0?node.naturalHeight/node.naturalWidth:1;
    const parentHeightForWidth=(nextWidth,nextHeight)=>Math.max(fixed,item.kind==='shape'?(item.heightUnit==='px'?(nextHeight??item.height):(item.widthUnit==='percent'?width*nextWidth/100:nextWidth)):(item.widthUnit==='percent'?width*nextWidth/100:nextWidth)*ratio);
    return {parent:scene,height:parentHeightForWidth(item.width),parentHeightForWidth};
  }
  const layerDrag=createLayerDrag({document,getState:()=>({active,...ui,layers:config.layers,regionFor:layerRegion}),getTextTarget:previewTextTarget,getLayerTarget:previewLayerTarget,onCommit:(item,next)=>{remember();Object.assign(item,next);apply();renderFields();notify('位置或大小已更新，尚未保存');}});
  const chromePreview=createChromePreview({document,ui,resolveArtwork:artworkUrl,onPick:(region,kind,id)=>{invalidateEditing();ui.demoDrawer=region==='topbar'?id:ui.demoDrawer;workbench.choose(region,kind,id);renderFields(undefined,{fromPreview:kind==='image'});}});
  const pagePreview=createPagePreview({document,ui});
  const applyButton=make('button','primary','应用到真实聊天');applyButton.type='button';applyButton.id='apply-live';shadow.querySelector('#close').before(applyButton);
  const liveBar=make('section','live-bar hidden');const liveStatus=make('span','','当前方案已应用到消息区');liveStatus.setAttribute('role','status');
  const editLive=make('button','','返回编辑');editLive.type='button';const stopLive=make('button','','退出应用');stopLive.type='button';liveBar.append(liveStatus,editLive,stopLive);shadow.append(liveBar);
  const liveBarStyle=make('style');liveBarStyle.textContent='.live-bar{position:fixed;right:24px;top:66px;z-index:20020;display:flex;align-items:center;gap:8px;max-width:calc(100vw - 24px);padding:9px 12px;border:1px solid #dce5dc;border-radius:12px;background:#fffdf8;box-shadow:0 5px 20px #0002}.live-bar span{font-size:12px;color:#63765e}.live-bar button{white-space:nowrap}.bar #apply-live{white-space:nowrap}@media(max-width:900px){.bar small{display:none}.bar select{max-width:180px}.live-bar{right:12px}}';shadow.append(liveBarStyle);
  applyButton.addEventListener('click',()=>{try{const snapshot=validate(config);close();const result=liveAdapter.start(snapshot);shadow.querySelector('.launcher').classList.add('hidden');liveBar.classList.remove('hidden');liveStatus.textContent=result.messages?'当前方案已应用到消息区':'已应用，进入聊天后生效';}catch(error){liveAdapter.stop();liveBar.classList.add('hidden');open();notify('应用失败：'+error.message);}});
  editLive.addEventListener('click',()=>{liveAdapter.stop();liveBar.classList.add('hidden');open();});
  stopLive.addEventListener('click',()=>{liveAdapter.stop();liveBar.classList.add('hidden');shadow.querySelector('.launcher').classList.remove('hidden');});
  window.addEventListener('pagehide',()=>{invalidateEditing();scrollbarVisibility.stop();liveAdapter.stop();});
  const kittyOption=make('option','','小猫咪 · 照片与窗景');kittyOption.value='kitty';shadow.querySelector('[aria-label="基础模板"]').append(kittyOption);const blankOption=make('option','','无装饰起稿 · 工具基础布局');blankOption.value='blank';shadow.querySelector('[aria-label="基础模板"]').append(blankOption);
  function updateWorkbenchLayout(){
    layerDrag.cancel();
    document.documentElement.dataset.otlPreviewMode=ui.previewMode;
    const win=document.defaultView,vv=win?.visualViewport,mobile=(win?.innerWidth||1200)<=700,compact=mobile&&!!vv&&vv.height<(win?.innerHeight||800)*.75;shadow.host.dataset.wbCompact=String(compact);workbench.syncSizing();
    const barTop=mobile?parseFloat(win?.getComputedStyle?.(shadow.querySelector('.bar'))?.top)||vv?.offsetTop||0:0;
    const barBottom=mobile?barTop+8:shadow.querySelector('.bar').getBoundingClientRect?.().bottom||104;shadow.host.style.setProperty('--wb-mobile-tools-top',(barBottom+4)+'px');
    const toolsBottom=mobile?barBottom:shadow.querySelector('.preview-tools').getBoundingClientRect?.().bottom||barBottom+48;
    const dockPadding=win?.getComputedStyle?.(shadow.querySelector('.mobile-dock'))?.paddingBottom,safeBottom=Math.max(0,(parseFloat(dockPadding)||6)-6);
    const geom=mobileGeometry(vv?.height||win?.innerHeight||800,(compact?barBottom+6:Math.max(barBottom+(mobile?6:52),toolsBottom+6))-(vv?.offsetTop||0),ui.mode==='library'||ui.mobileView!=='preview',vv?.offsetTop||0,compact,safeBottom);shadow.host.style.setProperty('--wb-mobile-sheet',geom.sheet+'px');
    const right=layoutWidths(document.defaultView?.innerWidth||1200,ui.split).previewRight+'px';
    let style=document.getElementById('orange-workbench-layout');
    if(!active){style?.remove();return;}
    if(!style){style=make('style');style.id='orange-workbench-layout';document.head.append(style);}
    const frame=previewFrameGeometry(previewChatWidth,win?.innerWidth||1200,parseFloat(right),ui.narrow);
    style.textContent=`html[data-orange-lab] #sheld{left:${frame.left}px!important;right:auto!important;width:${frame.width}px!important;top:136px!important;bottom:18px!important}html[data-orange-lab] #chat{overflow:auto!important}@media(max-width:700px){html[data-orange-lab] #sheld{top:${geom.top}px!important;bottom:auto!important;height:${geom.height}px!important;min-height:0!important}}`;
    pagePreview.update({deferRestore:true});chromePreview.update(config);pagePreview.restore();layerDrag.refresh();
  }
  function beginUploadFeedback(source,target,files){
    uploadFeedback={source,target,rows:files.map(f=>({name:f.name,size:f.size,status:'等待处理',busy:true})),added:[]};refreshUploadFeedback();return uploadFeedback;
  }
  function feedbackStatus(report,index,status,busy=false){if(uploadFeedback!==report)return;Object.assign(report.rows[index],{status,busy});refreshUploadFeedback();}
  function attachUploadFeedback(container,context){const status=make('div','upload-feedback');status.dataset.uploadFeedback=context;status.setAttribute('role','status');status.setAttribute('aria-live','polite');container.append(status);refreshUploadFeedback();}
  function refreshUploadFeedback(){
    for(const node of shadow.querySelectorAll('[data-upload-feedback]')){
      node.replaceChildren();const report=uploadFeedback;if(!report)continue;const context=node.dataset.uploadFeedback;
      if(context.startsWith('result:')){if(report.source==='library'&&report.added.includes(context.slice(7)))node.append(make('p','',`本次已添加 ${report.added.length} 张图片；完整结果见素材库上传处。`));}
      else if(context===report.source+':'+report.target){for(const row of report.rows){const size=Number.isFinite(row.size)?`（${(row.size/1048576).toFixed(2)} MiB）`:'';node.append(make('p','',row.name+size+'：'+row.status));}}
      if(node.childNodes.length&&node.isConnected){const fields=node.closest('.fields'),box=fields?.getBoundingClientRect(),rect=node.getBoundingClientRect();if(box&&rect.bottom>box.bottom)fields.scrollTop+=rect.bottom-box.bottom+8;}
    }
  }
  function uploadFailure(error){return error?.code==='IMAGE_INPUT'?error.message:error?.message==='图片像素过大'?'图片超过 4000 万像素，请选择较小图片。':'读取或裁剪失败，原图未改变，请重新选择。';}
  function addReselect(container,input){const button=make('button','','重新选择文件');button.type='button';button.addEventListener('click',()=>input.click());container.append(button);}
  function invalidateEditing(){imageUploadAbort?.abort();imageUploadAbort=null;colorPicker.cancel();layerDrag?.cancel();editEpoch++;if(uploadFeedback)for(const row of uploadFeedback.rows)if(row.busy){row.status='已取消，编辑对象或会话已改变。';row.busy=false;}refreshUploadFeedback();cancelCrop?.();cancelCrop=null;}
  function currentTargetValid(epoch,original,target){return active&&editEpoch===epoch&&config===original&&(config.layers.includes(target)||Object.values(config.photos).includes(target));}
  function renderPreviewNative(){const messages=[...document.querySelectorAll('[data-orange-lab-fixture=message]')],last=latestAI(messages);for(const msg of messages)renderNative(msg,config,{headerSelector:'.otl-header',wrapperSelector:'.otl-demo-stat-home',latest:msg===last});}
  function scheduleFit(){if(!active||fitFrame)return;fitFrame=requestAnimationFrame(()=>{fitFrame=0;if(layerDrag.dragging)return;chromePreview.update(config);fitCollage();for(const msg of document.querySelectorAll('[data-orange-lab-fixture=message]'))measureFooter(msg,config);renderPreviewNative();placePreviewScenes();layerDrag.refresh();});}
  function renderCaptionNodes(){
    for(const msg of document.querySelectorAll('[data-orange-lab-fixture=message]')){
      const meta=msg.querySelector('.otl-meta'),old=new Map([...meta.querySelectorAll('.otl-caption')].map(n=>[n.dataset.captionId,n]));
      for(const cap of config.captions){let node=old.get(cap.id);if(!node){node=make('div','otl-caption');node.dataset.pick='caption';node.dataset.captionId=cap.id;}old.delete(cap.id);node.textContent=cap.content;node.hidden=!cap.visible||!captionMatchesScope(cap,msg.getAttribute('is_user')==='true');meta.append(node);}
      for(const node of old.values())node.remove();
    }
  }
  function previewSceneNodes(msg){return {name:msg.querySelector('.name_text'),time:msg.querySelector('.timestamp'),...Object.fromEntries(config.captions.map(c=>[captionKey(c.id),msg.querySelector(`[data-caption-id="${c.id}"]`)]))};}
  const previewSet=(msg,key,value)=>msg.style.setProperty(key,value);
  function fitCollage(){
    for(const msg of document.querySelectorAll('[data-orange-lab-fixture=message]')){
      const header=msg.querySelector('.otl-header'),nodes=previewSceneNodes(msg),g=prepareScene(msg,header,config,nodes,previewSet);
      for(const image of header.querySelectorAll('.otl-scene-art > [data-layer-id]')){const layer=config.layers.find(l=>l.id===image.dataset.layerId);if(layer)updateHeaderArtworkClip(image,layer,g.width,Math.max(0,g.height-24));}
      for(const frame of header.querySelectorAll('.otl-avatar-art-frame')){const id=frame.querySelector('[data-layer-id]')?.dataset.layerId;if(id)Object.assign(frame.style,avatarArtworkFrameStyle(config,msg.getAttribute('is_user')==='true',g,regionZ(config,'header',imageKey(id))));}
      msg._otlScene=g;msg.style.setProperty('--sc-photo-top',(g.reserveTop+g.photoTop)+'px');
      const photo=header.querySelector('.otl-photo-group');photo.style.setProperty('width',g.photoWidth+'px','important');photo.style.setProperty('max-width','none','important');
    }
  }
  function placePreviewScenes(){for(const msg of document.querySelectorAll('[data-orange-lab-fixture=message]'))if(msg._otlScene)placeScene(msg,msg.querySelector('.otl-header'),config,previewSceneNodes(msg),msg._otlScene,previewSet);}
  function renderPhotos(){
    for(const msg of document.querySelectorAll('[data-orange-lab-fixture=message]')){
      const user=msg.getAttribute('is_user')==='true',scope=user?'user':'ai',group=msg.querySelector('.otl-photo-group');
      const image=group.querySelector('.mesAvatarWrapper>img');image.src=previewAvatars[scope]||avatarUrl(user);image.onerror=()=>{image.onerror=null;image.src=avatarUrl(user);};
    }
  }
  function numericRow(label,range,number,unit='',nudge=false){
    const row=make('span','control-row numeric-row'),shortUnit=unit.includes('（')?unit.split('（')[0]:unit;row.append(number,make('span','control-unit',shortUnit));
    if(nudge){
      row.classList.add('position-nudge');const buttons=[];
      const refresh=()=>{const value=Number(number.value),valid=number.value!==''&&Number.isFinite(value)&&value>=Number(number.min)&&value<=Number(number.max);buttons.forEach(([button,delta])=>button.disabled=!valid||(delta<0?value<=Number(number.min):value>=Number(number.max)));};
      for(const [symbol,delta]of [['−',-1],['+',1]]){const button=make('button','nudge-button',symbol);button.type='button';button.setAttribute('aria-label',range.getAttribute('aria-label')+(delta<0?' 减少':' 增加'));button.addEventListener('click',event=>{event.preventDefault();if(button.disabled)return;number.dispatchEvent(new window.Event('change',{bubbles:true}));number.value=String(Math.min(Number(number.max),Math.max(Number(number.min),Number((Number(number.value)+delta*Number(number.step||1)).toFixed(6)))));number.dispatchEvent(new window.Event('input',{bubbles:true}));number.dispatchEvent(new window.Event('change',{bubbles:true}));refresh();});buttons.push([button,delta]);row.append(button);}
      for(const node of [range,number])node.addEventListener('input',refresh);refresh();
    }
    row.append(range);label.append(row);addNumericStepper(row,range,number);if(unit.includes('（'))label.append(make('span','hint',unit.slice(unit.indexOf('（'))));return row;
  }
  function colorRow(label,swatch,hex){const row=make('span','control-row color-row');row.append(hex,swatch);label.append(row);return row;}
  function pairedFields(container){const row=make('div','paired-fields');container.append(row);return row;}
  function editorControl(container,f,target,onUpdate){
    const label=make('label','field');label.append(make('span','field-title',f.label));
    const input=make(f.type==='select'?'select':'input');input.setAttribute('aria-label',f.label);
    if(f.type==='select'){for(const [value,name]of f.options){const option=make('option','',name);option.value=value;input.append(option);}}
    else{input.type=f.type;if(f.type==='range'){input.min=f.min;input.max=f.max;input.step=f.step||1;}}
    if(f.type==='text')input.maxLength=f.maxLength||(f.key==='name'?80:300);input.value=String(target[f.key]);let tracking=false,number=null,hex=null,colorChip=null;
    const update=value=>{if(f.type==='range'&&(!Number.isFinite(value)||value<f.min||value>f.max))return false;if(!tracking){remember();tracking=true;}target[f.key]=value;if(ui.region==='header'&&ui.kind==='avatar'&&config.avatarDesign==='unified'){const other=photoScope==='ai'?'user':'ai';if(target===config.photos[photoScope])config.photos[other]=clone(target);if(target===config.avatarFill[photoScope])config.avatarFill[other]=clone(target);}input.value=String(value);if(number)number.value=value;if(hex)hex.value=value;if(colorChip)colorChip.style.background=value;apply();onUpdate?.();notify(f.notice||'设置已更新');return true;};
    input.addEventListener('input',()=>update(f.type==='range'?Number(input.value):['cardFullWidth','showArrow','enabled','gradient','borderEnabled','shadow','visible','bodyIndent','hideHistory','hideLatest'].includes(f.key)?input.value==='true':input.value));input.addEventListener('change',()=>{tracking=false;});if(!['range','color'].includes(f.type))label.append(input);
    if(f.type==='range'){number=make('input','number-input');number.type='number';number.min=f.min;number.max=f.max;number.step=f.step||1;number.value=target[f.key];number.setAttribute('aria-label',f.label+' 数值');number.addEventListener('input',()=>{if(number.value==='')return;number.setAttribute('aria-invalid',String(!update(Number(number.value))));});number.addEventListener('change',()=>{tracking=false;});numericRow(label,input,number,f.unit||'',['x','y'].includes(f.key));}
    if(f.type==='color'){hex=make('input','hex-input');hex.type='text';hex.maxLength=7;hex.value=target[f.key];hex.setAttribute('aria-label',f.label+' HEX');hex.addEventListener('input',()=>{const valid=/^#[a-f0-9]{6}$/i.test(hex.value);hex.setAttribute('aria-invalid',String(!valid));if(valid)update(hex.value);});hex.addEventListener('change',()=>{tracking=false;});input.type='hidden';label.append(input);
      const trigger=make('button','otl-color-launch');trigger.type='button';trigger.setAttribute('aria-label','选择'+f.label+'颜色');trigger.setAttribute('aria-haspopup','dialog');colorChip=make('span');colorChip.style.background=target[f.key];trigger.append(colorChip);
      trigger.addEventListener('click',event=>{event.preventDefault();const epoch=editEpoch,originalConfig=config;colorPicker.open({value:target[f.key],label:f.label,trigger,isValid:()=>active&&epoch===editEpoch&&config===originalConfig&&trigger.isConnected,onCommit:value=>{tracking=false;update(value);tracking=false;}});});
      colorRow(label,trigger,hex);}
    container.append(label);
  }
  function renderPhotoFields(container){
    const mode=make('label','field','设计对象'),select=make('select');select.setAttribute('aria-label','设计对象');
    for(const [value,label]of [['unified','统一设计'],['separate','分别设计']]){const o=make('option','',label);o.value=value;select.append(o);}select.value=config.avatarDesign;mode.append(select);container.append(mode);
    select.addEventListener('change',()=>{remember();config.avatarDesign=select.value;if(select.value==='unified'){const other=photoScope==='ai'?'user':'ai';config.photos[other]=clone(config.photos[photoScope]);config.avatarFill[other]=clone(config.avatarFill[photoScope]);}apply();renderFields();});
    if(config.avatarDesign==='separate'){const label=make('label','field','正在设计'),scope=make('select');scope.setAttribute('aria-label','正在设计');for(const [value,text]of [['ai','AI'],['user','用户']]){const o=make('option','',text);o.value=value;scope.append(o);}scope.value=photoScope;label.append(scope);container.append(label);scope.addEventListener('change',()=>{photoScope=scope.value;ui.object='photo-'+photoScope;renderFields();});}
    const p=config.photos[photoScope],fill=config.avatarFill[photoScope];
    const previewSection=make('details','avatar-preview');previewSection.open=false;previewSection.append(make('summary','','预览图片（仅本次）'),make('p','hint','不保存或导出。应用时使用酒馆头像。'));container.prepend(previewSection);
    for(const [scope,text]of (config.avatarDesign==='unified'?[['ai','AI'],['user','用户']]:[[photoScope,photoScope==='ai'?'AI':'用户']])){
      const label=make('label','field',text+' 预览图片'),upload=make('input');upload.type='file';upload.accept='image/png,image/apng,image/jpeg,image/webp,image/gif';upload.setAttribute('aria-label',text+' 预览图片');label.append(upload);previewSection.append(label);
      upload.addEventListener('change',async()=>{const file=upload.files[0];if(!file)return;upload.value='';invalidateEditing();imageUploadAbort=new AbortController();const signal=imageUploadAbort.signal,epoch=editEpoch,valid=()=>active&&epoch===editEpoch;notify('正在处理预览图片…');try{const result=await prepareImageUpload(file,{valid,signal});if(!result||!valid())return;previewAvatars[scope]=result.image;apply();notify('预览图片已显示，可调整取景');}catch(error){if(valid())notify(uploadFailure(error));}});
    }
    propertyHeading(container,'显示方式');editorControl(container,field('铺满卡片顶部','enabled','select',{options:[['false','普通显示'],['true','铺满卡片顶部']]}),fill,()=>renderFields());
    if(fill.enabled){
      editorControl(container,field('渐变遮罩','gradient','select',{options:[['false','关闭'],['true','开启']]}),fill,()=>renderFields());if(fill.gradient)for(const f of [field('渐变颜色','color','color'),field('渐变强度','opacity','range',{min:0,max:1,step:.05}),field('渐变开始位置','start','range',{min:0,max:100,unit:'%'})])editorControl(container,f,fill);
    }else{
      propertyHeading(container,'形状与尺寸');
      for(const f of [field('头像比例','ratio','select',{options:[['1','方形 1:1'],['0.8','竖幅 4:5'],['0.75','竖幅 3:4'],['1.3333333333333333','横幅 4:3']]}),field('头像大小','size','range',{min:40,max:300,unit:'px'}),field('头像圆角','radius','range',{min:0,max:150,unit:'px'})])editorControl(container,f,p);
      editorControl(container,field('头像边框','enabled','select',{options:[['false','关闭'],['true','开启']]}),p,()=>renderFields());
      if(p.enabled)for(const f of [field('边框宽度','frameWidth','range',{min:0,max:15,step:.25,unit:'px'}),field('边框颜色','frameColor','color')])editorControl(container,f,p);
      editorControl(container,field('头像阴影','shadow','select',{options:[['true','显示'],['false','隐藏']]}),p);
      propertyHeading(container,'位置与旋转');for(const f of [field('头像横向移动','x','range',{min:-80,max:80,unit:'px'}),field('头像纵向移动','y','range',{min:-80,max:80,unit:'px'}),field('头像旋转','rotation','range',{min:-20,max:20,step:.1,unit:'°'})])editorControl(container,f,p);
    }
    propertyHeading(container,'取景');for(const f of [field('头像取景水平位置','x','range',{min:0,max:100,unit:'%'}),field('头像取景垂直位置','y','range',{min:0,max:100,unit:'%'})])editorControl(container,f,fill);
  }
  function artworkUrl(layer){return layer.kind==='shape'?shapeDataUrl(layer):layer.kind==='asset'?assetUrl(layer.asset):layer.kind==='custom'?layer.image:decorations[layer.kind]?svgUrl(decorations[layer.kind]):'';}
  function renderArtwork(){
    document.querySelectorAll('[data-orange-lab-fixture] .otl-avatar-art-frame,[data-orange-lab-fixture] .otl-decoration').forEach(e=>e.remove());
    for(const msg of document.querySelectorAll('[data-orange-lab-fixture=message]')){
      const isUser=msg.getAttribute('is_user')==='true';
      for(const layer of config.layers){
        if(['footer','input'].includes(layer.anchor)||!layer.visible||(layer.scope==='ai'&&isUser)||(layer.scope==='user'&&!isUser))continue;
        const src=artworkUrl(layer);if(!src)continue;
        const art=make('img','otl-decoration');art.dataset.pick='decoration';art.dataset.layerId=layer.id;art.src=src;art.alt=layer.name;art.tabIndex=0;art.setAttribute('role','button');art.setAttribute('aria-label','选择素材：'+layer.name);
        Object.assign(art.style,{...layerSizeStyle(layer),objectPosition:layer.side+' '+layer.vertical,[layer.side]:layer.x+(layer.offsetUnit==='percent'?'%':'px'),[layer.vertical]:layer.y+(layer.offsetUnit==='percent'?'%':'px'),opacity:layer.opacity,transform:`rotate(${layer.rotation}deg)`,zIndex:regionZ(config,regionForImage(layer),imageKey(layer.id))});
        if(selected==='decoration'&&selectedLayerId===layer.id)art.classList.add('otl-selected');
        let frame=msg.querySelector('.otl-scene-art');if(layer.anchor==='header'&&!frame){frame=make('div','otl-scene-art');msg.querySelector('.otl-header').append(frame);}
        let parent=layer.anchor==='reasoning-entry'?msg.querySelector('.mes_reasoning_header'):layer.anchor==='reasoning-body'?msg.querySelector('.mes_reasoning'):layer.anchor==='avatar'?msg.querySelector('.otl-photo-group'):layer.anchor==='header'?frame:msg;if(layer.anchor==='avatar'){parent=make('div','otl-avatar-art-frame');const g=msg._otlScene||prepareScene(msg,msg.querySelector('.otl-header'),config,previewSceneNodes(msg),previewSet);Object.assign(parent.style,avatarArtworkFrameStyle(config,isUser,g,regionZ(config,'header',imageKey(layer.id))));msg.querySelector('.otl-header').append(parent);}if(parent)parent.append(art);if(layer.anchor==='header'){art.onload=()=>{if(active&&art.isConnected)scheduleFit();};updateHeaderArtworkClip(art,layer,sceneWidth(msg,config),Math.max(0,config.headerHeight-24));}
      }
    }
  }
  function renderSourceLibrary(container,chromeTarget=null){
    if(!chromeTarget&&libraryPurpose.startsWith('chrome:'))return renderChromeSourceLibrary(container);
    const isBackground=libraryPurpose==='reasoning-background',isMoreIcon=libraryPurpose==='native-more-icon',isEditIcon=libraryPurpose==='native-edit-icon'||isMoreIcon,isSourceTarget=!!chromeTarget||isBackground||isEditIcon,backgroundTarget=isEditIcon?config.nativeStyle.actions[isMoreIcon?'more':'edit']:config.reasoningStyle.entry.background,targetGroup=isEditIcon?'native':'reasoning',purpose=libraryPurpose;
    const fontBox=make('details'),fontTitle=make('summary','','字体库');fontBox.append(fontTitle);const fontURL=make('input');fontURL.type='url';fontURL.placeholder='字体文件直链';fontURL.setAttribute('aria-label','字体库直链');const fontWeight=make('select');fontWeight.setAttribute('aria-label','字体库文件类型');for(const [v,t]of [['400','常规字体'],['700','粗体字体'],['100 900','可变字体'],['100','极细字体'],['200','纤细字体'],['300','细体字体'],['500','中等字体'],['600','半粗字体'],['800','特粗字体'],['900','重体字体']]){const o=make('option','',t);o.value=v;fontWeight.append(o);}fontBox.append(fontURL,fontWeight);renderFontLibrary(fontBox,{library:fontLibrary,link:fontURL,face:fontWeight,onError:notify});container.append(fontBox);
    propertyHeading(container,'添加目标');
    if(isSourceTarget){
      container.append(make('p','hint',chromeTarget?'选择图片作为当前按钮图形，不新增装饰素材。':isEditIcon?`选择图片作为${isMoreIcon?'更多':'编辑'}按钮图标。`:'选择图片作为思维入口背景，不新增装饰素材。'));
      const cancel=make('button','','取消选图');if(!chromeTarget)cancel.id=isEditIcon?(isMoreIcon?'native-more-cancel':'native-edit-cancel'):'reasoning-bg-cancel';cancel.addEventListener('click',()=>{invalidateEditing();libraryPurpose='layer';ui.mode='edit';renderFields(chromeTarget?undefined:targetGroup);});container.append(cancel);
    }else if(ui.region==='reasoning'){
      const target=make('select'),label=make('label','field','添加到');target.setAttribute('aria-label','思维图片添加到');for(const [v,t]of [['reasoning-entry','思维入口'],['reasoning-body','思维正文']]){const o=make('option','',t);o.value=v;target.append(o);}target.value=reasoningAnchor;target.addEventListener('change',()=>{invalidateEditing();reasoningAnchor=target.value;});label.append(target);container.append(label);
    }
    const anchor=()=>ui.region==='input'?'input':ui.region==='footer'?'footer':ui.region==='reasoning'?reasoningAnchor:ui.region==='overall'?'message':'header';
    function useSource(source){
      if(!active||libraryPurpose!==purpose)return;
      if(!isSourceTarget&&config.layers.length>=LAYER_LIMIT){notify(`最多放置 ${LAYER_LIMIT} 层素材；素材库可继续保存图片。`);return;}
      invalidateEditing();remember();
      if(chromeTarget){Object.assign(chromeTarget,{mode:'image',asset:source.asset||'',image:source.image||''});libraryPurpose='layer';ui.mode='edit';apply();renderFields();}
      else if(isSourceTarget){backgroundTarget.source={kind:source.asset?'asset':'custom',asset:source.asset||'',image:source.image||''};backgroundTarget.mode='image';libraryPurpose='layer';apply();renderFields(targetGroup);}
      else {const layer=newLayer(source.shape?'shape':source.asset?'asset':'custom',{name:source.name,asset:source.asset||'',image:source.image||'',...(source.shape?{shape:source.shape}:{}),opacity:1,anchor:anchor()});config.layers.push(layer);selectedLayerId=layer.id;apply();renderFields('decoration');}
      notify('素材已放入当前目标，可撤销；保存方案后记住。');
    }
    container.append(make('p','hint','我的素材保存在本浏览器，独立于当前方案。先存入素材库，再点击“使用素材”放入目标；导出只包含已经使用的图片。'));
    propertyHeading(container,'内置素材');
    const libraryLabel=make('label','field','内置素材库'),library=make('select');library.setAttribute('aria-label','内置素材库');for(const group of builtinAssetGroups()){const options=make('optgroup');options.label=group.name;for(const asset of group.assets){const option=make('option','',asset.name);option.value=asset.id;options.append(option);}library.append(options);}library.value=Object.keys(SHARED_ASSETS)[0];
    const addAsset=make('button','',chromeTarget?'使用所选按钮图片':isSourceTarget?(isEditIcon?(isMoreIcon?'使用所选更多图标':'使用所选编辑图标'):'使用所选背景'):'添加所选素材');addAsset.type='button';addAsset.disabled=!isSourceTarget&&config.layers.length>=LAYER_LIMIT;addAsset.addEventListener('click',()=>useSource({asset:library.value,name:ASSETS[library.value].name}));libraryLabel.append(library,addAsset);container.append(libraryLabel);
    if(!isSourceTarget){propertyHeading(container,'可调色形状');const shapes=make('div','actions');for(const [shape,name]of Object.entries(SHAPE_NAMES)){const button=make('button','','添加'+name);button.type='button';button.dataset.addShape=shape;button.disabled=config.layers.length>=LAYER_LIMIT;button.addEventListener('click',()=>useSource({shape,name}));shapes.append(button);}container.append(shapes);}
    propertyHeading(container,'上传到我的素材');
    const uploadLabel=make('label','field','上传图片到素材库'),upload=make('input');upload.type='file';upload.multiple=true;upload.accept='image/png,image/apng,image/jpeg,image/webp,image/gif';upload.setAttribute('aria-label',chromeTarget?'上传按钮图片':'上传装饰图片');
    uploadLabel.append(make('p','hint','PNG、JPG、WebP、GIF（含动画）；自动优化较大的静态图，收益小则保留原素材，不另存一份原图。测试版单张最多 16 MiB、1600 万像素；上传不会改变当前方案。'),upload);container.append(uploadLabel);addReselect(uploadLabel,upload);
    const feedbackSource=chromeTarget?'chrome':'library',feedbackTarget=chromeTarget?purpose.slice(7):'';attachUploadFeedback(uploadLabel,feedbackSource+':'+feedbackTarget);
    propertyHeading(container,'图片链接');
    const urlLabel=make('label','field','HTTP(S) 图片链接'),urlInput=make('input');urlInput.type='url';urlInput.placeholder='https://example.com/image.png';urlInput.setAttribute('aria-label','图片链接');urlInput.autocomplete='off';const saveUrl=make('button','','保存链接到素材库');saveUrl.type='button';urlLabel.append(urlInput,saveUrl);container.append(urlLabel,make('p','hint','建议使用 HTTPS。链接会原样保存，依赖来源网站可用；不下载或嵌入远程图片。HTTP 图片可能被浏览器拦截。'));
    const status=make('p','hint');status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.dataset.assetLibraryStatus='';container.append(status);
    propertyHeading(container,'我的素材');const list=make('div','asset-library-list');list.dataset.assetLibraryList='';container.append(list);let listVersion=0;
    const visible=()=>active&&list.isConnected&&ui.mode==='library'&&libraryPurpose===purpose;
    async function refreshLibrary(){
      const version=++listVersion;list.textContent='正在读取素材库…';
      try{const records=await assetLibrary.list();if(!visible()||version!==listVersion)return;list.replaceChildren();if(!records.length)list.append(make('p','hint','还没有自定义素材。上传图片或保存图片链接后，可在所有选图入口复用。'));
        for(const record of records){const card=make('div','asset-library-card');card.dataset.libraryAsset=record.id;Object.assign(card.style,{display:'grid',gridTemplateColumns:'52px minmax(0,1fr)',gap:'8px',padding:'10px',border:'1px solid #d5ded7',borderRadius:'10px',marginBottom:'8px'});const preview=make('img');preview.src=record.image;preview.alt=record.name;preview.loading='lazy';preview.referrerPolicy='no-referrer';Object.assign(preview.style,{width:'52px',height:'52px',objectFit:'contain'});const detail=make('div'),name=make('p','',record.name),source=make('small','',record.kind==='url'?'链接素材':'已保存在本浏览器');Object.assign(name.style,{margin:'0 0 4px',overflowWrap:'anywhere'});const use=make('button','','使用素材');use.type='button';use.setAttribute('aria-label','使用素材：'+record.name);use.disabled=!isSourceTarget&&config.layers.length>=LAYER_LIMIT;use.addEventListener('click',()=>useSource(record));preview.addEventListener('error',()=>{source.textContent=record.kind==='url'?'图片加载失败，请检查链接或来源网站限制。':'图片无法预览，请重新上传。';});const remove=make('button','','从素材库删除');remove.type='button';remove.setAttribute('aria-label','从素材库删除：'+record.name);
          remove.addEventListener('click',async()=>{
            if(remove.disabled||!visible()||!card.isConnected)return;
            if(!window.confirm(`从素材库删除“${record.name}”？已放入方案的图片不受影响；库中原图删除后无法撤销。`))return;
            remove.disabled=true;status.textContent='正在删除素材…';
            try{await assetLibrary.remove(record.id);if(visible()){status.textContent=`已从素材库删除“${record.name}”，方案中的图片未改变。`;await refreshLibrary();}}
            catch(error){if(visible())status.textContent=`未删除“${record.name}”：素材库删除失败，请重试。`;}
            finally{remove.disabled=false;}
          });
          const actions=make('div','actions');actions.append(use,remove);detail.append(name,source,actions);card.append(preview,detail);list.append(card);}
      }catch(error){if(visible()&&version===listVersion){list.replaceChildren(make('p','hint',error.message));const retry=make('button','','重试读取素材库');retry.type='button';retry.addEventListener('click',refreshLibrary);list.append(retry);}}
    }
    saveUrl.addEventListener('click',async()=>{
      if(saveUrl.disabled)return;let image;try{image=normalizeImageUrl(urlInput.value);urlInput.removeAttribute('aria-invalid');}catch(error){urlInput.setAttribute('aria-invalid','true');status.textContent=error.message;return;}
      saveUrl.disabled=true;status.textContent='正在保存链接…';
      try{const parsed=new URL(image),last=parsed.pathname.split('/').filter(Boolean).pop();await assetLibrary.add({name:(last||parsed.hostname).slice(0,80),image});if(visible()){status.textContent='链接已存入素材库。点击“使用素材”放入当前目标。';urlInput.value='';await refreshLibrary();}}
      catch(error){if(visible())status.textContent=error.message;}finally{saveUrl.disabled=false;}
    });
    upload.addEventListener('change',async()=>{
      const files=[...upload.files];if(!files.length)return;upload.value='';invalidateEditing();imageUploadAbort=new AbortController();const signal=imageUploadAbort.signal,epoch=editEpoch,report=beginUploadFeedback(feedbackSource,feedbackTarget,files),valid=()=>visible()&&epoch===editEpoch&&uploadFeedback===report;
      for(let index=0;index<files.length;index++){
        const file=files[index];if(!valid())break;
        try{feedbackStatus(report,index,'读取与自动优化中…',true);const result=await prepareImageUpload(file,{valid,signal});if(!result||!valid())break;feedbackStatus(report,index,'正在存入素材库…',true);const record=await assetLibrary.add({name:file.name.slice(0,80)||'我的图片',image:result.image});if(!valid())break;report.added.push(record.id);const detail=result.optimized?`已优化为 ${(result.bytes/1024).toFixed(0)} KiB，尺寸不变；`:result.animated?'已保留动画原素材；':'已保留原素材；';feedbackStatus(report,index,detail+'已存入素材库；点击“使用素材”放入当前目标。');}
        catch(error){if(valid())feedbackStatus(report,index,error.code?error.message:uploadFailure(error));}
      }
      if(valid()&&report.added.length){await refreshLibrary();if(valid())notify(`已存入 ${report.added.length} 张图片，当前方案尚未改变。`);}
    });
    refreshLibrary();
  }
  function renderLayers(container){
    container.append(make('p','hint','点选画面中的素材后，单指拖动、双指缩放；空白处和未选中的内容仍可滚动。重叠时从列表选择，数值可精调，保存方案后记住。'));
    const layer=config.layers.find(l=>l.id===selectedLayerId);if(!layer){container.append(make('p','hint','这里还没有图片。点击“添加图片”选择来源。'));return;}
    propertyHeading(container,'基本信息');const commands=make('div','actions');
    const duplicate=make('button','','复制素材');duplicate.type='button';duplicate.disabled=config.layers.length>=LAYER_LIMIT;duplicate.addEventListener('click',()=>{remember();const copy=newLayer(layer.kind,{...clone(layer),id:crypto.randomUUID(),name:(layer.name+' 副本').slice(0,80),x:Math.min(600,layer.x+15),y:Math.min(600,layer.y+15)});config.layers.push(copy);selectedLayerId=copy.id;apply();renderFields('decoration');});
    const remove=make('button','','移除素材');remove.type='button';remove.addEventListener('click',()=>{invalidateEditing();remember();const region=ui.region;config.layers=config.layers.filter(l=>l.id!==layer.id);selectedLayerId=matchingLayers(config.layers,region)[0]?.id;workbench.choose(region,'image',selectedLayerId||'');apply();renderFields();notify('已移除素材，可撤销。');});commands.append(duplicate,remove);
    if(layer.kind==='custom'&&layer.image){const crop=make('button','','裁剪此图片');crop.type='button';crop.addEventListener('click',async()=>{invalidateEditing();const epoch=editEpoch,originalConfig=config,report=beginUploadFeedback('crop',layer.id,[{name:layer.name}]),valid=()=>currentTargetValid(epoch,originalConfig,layer)&&uploadFeedback===report;try{feedbackStatus(report,0,'准备裁剪…',true);const output=await cropImage(layer.image,layer.image.startsWith('data:image/gif')?'image/gif':'image/png',valid);if(!valid())return;if(!output){feedbackStatus(report,0,'已取消裁剪，原图未改变。');return;}remember();layer.image=output;apply();feedbackStatus(report,0,'裁剪已应用，尚未保存方案。');renderFields('decoration');notify('裁剪已应用，可撤销；保存后记住。');}catch(error){if(valid())feedbackStatus(report,0,uploadFailure(error));}});commands.append(crop);}container.append(commands);attachUploadFeedback(container,'crop:'+layer.id);attachUploadFeedback(container,'result:'+layer.id);
    if(layer.kind==='asset'){const replacementLabel=make('label','field','替换内置素材'),replacement=make('select');replacement.setAttribute('aria-label','替换内置素材');for(const group of builtinAssetGroups(layer.asset)){const options=make('optgroup');options.label=group.name;for(const asset of group.assets){const option=make('option','',asset.name);option.value=asset.id;options.append(option);}replacement.append(options);}replacement.value=layer.asset;replacement.addEventListener('change',()=>{remember();layer.asset=replacement.value;layer.name=ASSETS[layer.asset].name;apply();renderFields('decoration');notify('已换素材，位置与层级保持。');});replacementLabel.append(replacement);container.append(replacementLabel);}
    if(layer.kind==='shape'){
      propertyHeading(container,'形状与尺寸');
      editorControl(container,field('宽度单位','widthUnit','select',{options:[['px','像素'],['percent','相对区域百分比']]}),layer,()=>renderFields());
      const dimensions=pairedFields(container);
      editorControl(dimensions,field('宽度','width','range',{min:1,max:500,unit:layer.widthUnit==='percent'?'%':'px'}),layer);
      editorControl(dimensions,field('高度','height','range',{min:1,max:500,unit:'px'}),layer);
      editorControl(container,field('旋转','rotation','range',{min:-180,max:180,unit:'°'}),layer);
      propertyHeading(container,'外观');
      for(const f of [field('填色','fillMode','select',{options:[['solid','纯色'],['gradient','双色渐变']]}),field('颜色','color','color'),...(layer.fillMode==='gradient'?[field('第二种颜色','color2','color'),field('渐变方向','gradientAngle','range',{min:0,max:360,unit:'°'})]:[]),...(layer.shape==='rectangle'?[field('圆角','cornerRadius','range',{min:0,max:250,unit:'px'})]:[])])editorControl(container,f,layer,f.key==='fillMode'?()=>renderFields():undefined);editorControl(container,field('透明度','opacity','range',{min:0,max:1,step:.05}),layer);}
    const fields=[field('素材名称','name'),field('显示素材','visible','select',{options:[['true','显示'],['false','隐藏']]}),field('应用于','scope','select',{options:[['both','AI 和用户'],['ai','仅 AI'],['user','仅用户']]}),field('定位区域','anchor','select',{options:[['header','头像区'],['avatar','头像'],['message','整张消息卡片'],['reasoning-entry','思维入口'],['reasoning-body','思维正文'],['footer','尾部区'],['input','输入区']]}),field('从哪侧定位','side','select',{options:[['right','右侧'],['left','左侧']]}),field('垂直锚点','vertical','select',{options:[['top','顶部'],['bottom','底部']]}),field('大小单位','widthUnit','select',{options:[['px','像素'],['percent','相对区域百分比']]}),field('素材大小','width','range',{min:1,max:500,unit:layer.widthUnit==='percent'?'%':'px'}),field('素材区域高度','heightPercent','range',{min:0,max:100,unit:'%（0 为原比例）'}),field('偏移单位','offsetUnit','select',{options:[['px','像素'],['percent','相对区域百分比']]}),field('侧边偏移','x','range',{min:-300,max:600,unit:layer.offsetUnit==='percent'?'%':'px'}),field('垂直偏移','y','range',{min:-300,max:600,unit:layer.offsetUnit==='percent'?'%':'px'}),field('旋转角度','rotation','range',{min:-180,max:180,unit:'°'}),field('透明度','opacity','range',{min:0,max:1,step:.05}),field('叠放层级','z','range',{min:0,max:20})];
    const order=['name','visible','scope','anchor','side','x','vertical','y','offsetUnit','z','widthUnit','width','heightPercent','rotation','opacity'];fields.sort((a,b)=>order.indexOf(a.key)-order.indexOf(b.key));let availability;
    for(const f of fields){
      if(f.key==='z'||(layer.kind==='shape'&&['heightPercent','widthUnit','width','rotation','opacity'].includes(f.key)))continue;
      if(f.key==='scope'&&layer.anchor==='input')continue;
      if(f.key==='anchor')propertyHeading(container,'位置与叠放');if(f.key==='widthUnit')propertyHeading(container,'尺寸与外观');if(f.key==='visible')availability=pairedFields(container);
      if(f.key==='side'){f.label='水平定位边';f.options=[['left','左边'],['right','右边']];}if(f.key==='vertical'){f.label='垂直定位边';f.options=[['top','顶部'],['bottom','底部']];}if(f.key==='x')f.label=layer.side==='left'?'距左边距离':'距右边距离';if(f.key==='y')f.label=layer.vertical==='top'?'距顶部距离':'距底部距离';
      const label=make('label','field');label.append(make('span','field-title',f.label));const input=make(f.type==='select'?'select':'input');input.setAttribute('aria-label',f.label);
      if(f.type==='select'){for(const [value,name]of f.options){const option=make('option','',name);option.value=value;input.append(option);}}
      else{input.type=f.type;if(f.type==='range'){input.min=f.min;input.max=f.max;input.step=f.step||1;}else input.maxLength=80;}
      input.value=String(layer[f.key]);let number=null,tracking=false;
      const update=(value)=>{if(f.type==='range'&&(!Number.isFinite(value)||value<f.min||value>f.max))return false;if(!tracking){remember();tracking=true;}layer[f.key]=value;if(layer.anchor==='input')layer.scope='both';if(number)number.value=value;input.value=String(value);apply();notify('素材已更新，尚未保存');return true;};
      input.addEventListener('input',()=>update(f.type==='range'?Number(input.value):f.key==='visible'?input.value==='true':input.value));input.addEventListener('change',()=>{tracking=false;if(['widthUnit','offsetUnit','anchor','side','vertical'].includes(f.key))renderFields('decoration');});if(f.type!=='range')label.append(input);
      if(f.type==='range'){number=make('input','number-input');number.type='number';number.min=f.min;number.max=f.max;number.step=f.step||1;number.value=layer[f.key];number.setAttribute('aria-label',f.label+' 数值');number.addEventListener('input',()=>{if(number.value==='')return;const ok=update(Number(number.value));number.setAttribute('aria-invalid',String(!ok));});number.addEventListener('change',()=>{tracking=false;});numericRow(label,input,number,f.unit||'',['x','y'].includes(f.key));}(['visible','scope'].includes(f.key)?availability:container).append(label);
    }
  }
  async function cropImage(source,mime,valid=()=>active){
    let animated=mime==='image/gif';if(source.startsWith('data:')){animated=(await inspectImageBlob(dataUrlToBlob(source))).animated;}if(animated){notify('动画素材保持原样，暂不支持动画裁剪。');return null;}
    const image=new Image();image.src=source;await image.decode();if(!valid())return null;if(image.naturalWidth*image.naturalHeight>40000000)throw Error('图片像素过大');
    return new Promise(resolve=>{
      const dialog=make('dialog','crop-dialog');const canvas=make('canvas');let zoom=1,panX=50,panY=50,ratio=image.naturalWidth/image.naturalHeight,done=false;
      dialog.append(make('h3','','裁剪这张素材'),make('p','hint','选择比例，再移动取景。也可以保持原图，保留完整透明边缘。'),canvas);
      const ratioLabel=make('label','field','裁剪比例');const ratioSelect=make('select');ratioSelect.setAttribute('aria-label','裁剪比例');for(const [value,name]of [['original','原比例'],['1','方形 1:1'],['0.75','竖幅 3:4'],['1.3333333333333333','横幅 4:3'],['1.7777777777777777','横幅 16:9']]){const option=make('option','',name);option.value=value;ratioSelect.append(option);}ratioLabel.append(ratioSelect);dialog.append(ratioLabel);
      const draw=()=>{const rect=cropRect(image.naturalWidth,image.naturalHeight,ratio,zoom,panX,panY);const scale=Math.min(1,1200/Math.max(rect.width,rect.height));canvas.width=Math.max(1,Math.round(rect.width*scale));canvas.height=Math.max(1,Math.round(rect.height*scale));canvas.style.width='100%';canvas.style.aspectRatio=String(ratio);canvas.getContext('2d').drawImage(image,rect.x,rect.y,rect.width,rect.height,0,0,canvas.width,canvas.height);};
      ratioSelect.addEventListener('change',()=>{ratio=ratioSelect.value==='original'?image.naturalWidth/image.naturalHeight:Number(ratioSelect.value);draw();});
      for(const [key,name,min,max,step,initial]of [['zoom','放大取景',1,4,.05,1],['panX','横向取景',0,100,1,50],['panY','纵向取景',0,100,1,50]]){const label=make('label','field',name),input=make('input'),number=make('input','number-input');input.type='range';number.type='number';for(const node of [input,number]){node.min=min;node.max=max;node.step=step;node.value=initial;}input.setAttribute('aria-label',name);number.setAttribute('aria-label',name+' 数值');const update=value=>{if(!Number.isFinite(value)||value<min||value>max)return false;input.value=number.value=value;if(key==='zoom')zoom=value;else if(key==='panX')panX=value;else panY=value;draw();return true;};input.addEventListener('input',()=>update(Number(input.value)));number.addEventListener('input',()=>{if(number.value==='')return;number.setAttribute('aria-invalid',String(!update(Number(number.value))));});numericRow(label,input,number,key==='zoom'?'×':'%');dialog.append(label);}
      if(mime==='image/gif')dialog.append(make('p','hint','裁剪 GIF 后会成为静态图片；保持原图可保留动画。'));
      const cancel=()=>finish(null);const finish=value=>{if(done)return;done=true;if(cancelCrop===cancel)cancelCrop=null;dialog.close();dialog.remove();resolve(valid()?value:null);};cancelCrop=cancel;
      const actions=make('div','actions');for(const [name,action]of [['取消',()=>finish(null)],['保持原图',()=>finish(source)],['使用裁剪图',()=>{const output=canvas.toDataURL('image/png');if(output.length>MAX_IMAGE_DATA_LENGTH){notice.textContent='裁剪图片过大，请缩小取景或保持原图。';return;}finish(output);}]]){const button=make('button',name==='使用裁剪图'?'primary':'',name);button.type='button';button.addEventListener('click',action);actions.append(button);}const notice=make('p','hint');dialog.append(actions,notice);dialog.addEventListener('cancel',event=>{event.preventDefault();finish(null);});shadow.append(dialog);draw();dialog.showModal();
    });
  }
  function selectedCaption(){return ui.region==='footer'?config.footerCaptions.find(c=>footerKey(c.id)===ui.object):config.captions.find(c=>captionKey(c.id)===ui.object);}
  function currentCaptions(){return ui.region==='footer'?config.footerCaptions:config.captions;}
  function currentCaptionKey(id){return ui.region==='footer'?footerKey(id):captionKey(id);}
  function currentNewCaption(overrides){return ui.region==='footer'?newFooterCaption(overrides):newSceneCaption(config,overrides);}
  function renderCaptionWidth(container,cap,labelName='文案'){
    const label=make('label','field',labelName+'宽度'),mode=make('select');mode.setAttribute('aria-label',labelName+'宽度模式');for(const [value,name]of [['auto',ui.region==='footer'?'完整尾部宽度':'自动宽度'],['custom','自定义']]){const option=make('option','',name);option.value=value;mode.append(option);}mode.value=cap.width==='auto'?'auto':'custom';mode.addEventListener('change',()=>{remember();cap.width=mode.value==='auto'?'auto':60;apply();renderFields();});label.append(mode);container.append(label);
    if(cap.width!=='auto')editorControl(container,field(labelName+'宽度占比','width','range',{min:10,max:100,unit:'%',notice:'文案宽度已更新，尚未保存'}),cap);
  }
  function renderFontLinkFields(container,key,item,labelName){
    const linkRow=pairedFields(container);linkRow.classList.add('font-link-row');const linkLabel=make('label','field','字体文件直链（留空用预设）'),link=make('input');link.type='url';link.maxLength=2048;link.value=item.fontLink?.url||'';link.setAttribute('aria-label',labelName+' 字体直链');linkLabel.append(link);
    const faceLabel=make('label','field','链接文件类型'),face=make('select');face.setAttribute('aria-label',labelName+' 链接文件类型');
    for(const [value,title]of [['100','极细字体'],['200','纤细字体'],['300','细体字体'],['400','常规字体'],['500','中等字体'],['600','半粗字体'],['700','粗体字体'],['800','特粗字体'],['900','重体字体'],['100 900','可变字体']]){const option=make('option','',title);option.value=value;face.append(option);}face.value=item.fontLink?.faceWeight||'400';faceLabel.append(face);linkRow.append(faceLabel,linkLabel);
    const commit=()=>{try{const next=validateCaptionStyle({fontLink:link.value.trim()?{url:link.value.trim(),faceWeight:face.value}:null},{stable:ui.region==='header'});remember();item.fontLink=next.fontLink;link.removeAttribute('aria-invalid');apply();}catch(error){link.setAttribute('aria-invalid','true');notify(error.message);}};
    renderFontLibrary(container,{library:fontLibrary,link,face,onSelect:commit,onError:notify});
    link.addEventListener('change',commit);face.addEventListener('change',()=>{if(link.value.trim())commit();});
    const status=make('p','hint');status.dataset.fontStatus=key;container.append(status);updateFontStatuses();
    const retry=make('button','','重新加载链接字体');retry.type='button';retry.addEventListener('click',()=>fontSession?.retry());container.append(retry,make('p','hint','链接须直接返回字体文件并允许跨域。失败沿用预设；导出只携带引用，字重效果取决于字体文件。'));
  }
  function renderTextFields(container){
    const key=textItemKey,cap=selectedCaption(),item=cap||config.textItems[key],labelName=cap?'文案':({name:'名字',time:'时间'})[key];
    propertyHeading(container,cap?'内容与位置':'位置');
    if(cap){
      editorControl(container,field('应用于','scope','select',{options:[['both','AI 和用户'],['ai','仅 AI'],['user','仅用户']]}),cap);
      const contentRow=pairedFields(container);editorControl(contentRow,field('文案标题','name','text',{notice:'文案标题已更新，尚未保存'}),cap);editorControl(contentRow,field('显示文案','visible','select',{options:[['true','显示'],['false','隐藏']],notice:'文案显隐已更新，尚未保存'}),cap);
      const label=make('label','field','文案内容'),input=make('textarea');input.maxLength=300;input.rows=4;input.setAttribute('aria-label','文案内容');input.value=cap.content;let tracking=false;input.addEventListener('input',()=>{if(!tracking){remember();tracking=true;}cap.content=input.value;apply();});for(const event of ['blur','change'])input.addEventListener(event,()=>tracking=false);label.append(input);container.append(label);renderCaptionWidth(container,cap);
    }else {container.append(make('p','hint','内容由酒馆提供，这里只调整显示样式。'));renderCaptionWidth(container,item,labelName);}
    for(const f of [field(labelName+(ui.region==='footer'?' 左右移动':' 水平位置'),'x','range',{min:-100,max:ui.region==='footer'?100:200,unit:'%'}),field(labelName+(ui.region==='footer'?' 上下移动':' 纵向位置'),'y','range',{min:-400,max:ui.region==='footer'?400:1600,unit:'px'})])editorControl(container,{...f,notice:'文字位置已更新，尚未保存'},item);
    propertyHeading(container,'字体设计');const fontRow=pairedFields(container);
    if(cap)editorControl(fontRow,field('文案字体','font','select',{options:fonts,notice:'字体已更新，尚未保存'}),cap);else renderConfigFields(fontRow,[key==='name'?'nameFont':'timeFont']);
    const weightLabel=make('label','field','字重'),weight=make('select');weight.setAttribute('aria-label',labelName+' 字重');
    for(const [value,title]of [['auto','沿用'],...Array.from({length:9},(_,i)=>[String((i+1)*100),String((i+1)*100)])]){const option=make('option','',title);option.value=value;weight.append(option);}weight.value=String(item.weight);
    weight.addEventListener('change',()=>{remember();item.weight=weight.value==='auto'?'auto':Number(weight.value);apply();});weightLabel.append(weight);fontRow.append(weightLabel);

    if(cap){editorControl(container,field('文案字号','size','range',{min:8,max:200,unit:'px',notice:'字号已更新，尚未保存'}),cap);editorControl(container,field('文案颜色','color','color',{notice:'颜色已更新，尚未保存'}),cap);}else renderConfigFields(container,key==='name'?['nameSize','nameColor']:['timeSize','timeColor']);
    propertyHeading(container,'外链字体');renderFontLinkFields(container,key,item,labelName);
    if(cap){
    const actions=make('div','actions'),copy=make('button','','复制文案'),remove=make('button','','删除文案');copy.disabled=currentCaptions().length>=CAPTION_LIMIT;
    copy.addEventListener('click',()=>{remember();const value=currentNewCaption({...clone(cap),id:crypto.randomUUID(),name:(cap.name+' 副本').slice(0,80)});currentCaptions().push(value);ui.object=currentCaptionKey(value.id);textItemKey=ui.object;apply();renderFields();});
    remove.addEventListener('click',()=>{invalidateEditing();remember();const list=currentCaptions(),index=list.indexOf(cap);list.splice(index,1);ui.object=list[Math.min(index,list.length-1)]?currentCaptionKey(list[Math.min(index,list.length-1)].id):ui.region==='footer'?'':'caption';apply();renderFields();});actions.append(copy,remove);container.append(actions);
    }
  }
  function updateFontStatuses(){for(const node of shadow.querySelectorAll('[data-font-status]'))node.textContent=({idle:'使用预设字体',loading:'链接字体加载中，暂用预设',loaded:'链接字体已加载',error:'链接字体未加载，继续使用预设；可重试'})[fontSession?.status(node.dataset.fontStatus)||'idle'];}
  function renderConfigFields(container,keys){
    for(const key of keys){const f=Object.values(groups).flat().find(f=>f.key===key);if(!f)continue;
      if(f.type==='textarea'){
        const label=make('label','field',f.label),input=make('textarea');input.setAttribute('aria-label',f.label);input.maxLength=300;input.rows=4;input.value=config[f.key];let tracking=false;
        input.addEventListener('input',()=>{if(!tracking){remember();tracking=true;}config[f.key]=input.value;apply();notify('尚未保存 · 预览已更新');});for(const event of ['change','blur'])input.addEventListener(event,()=>tracking=false);label.append(input);container.append(label);
      }else editorControl(container,{...f,notice:'尚未保存 · 预览已更新'},config);
    }
  }
  function propertyHeading(container,title){const heading=make('h3','property-heading',title);container.append(heading);}
  function reasoningControl(container,target,f,onUpdate){editorControl(container,{...f,notice:'思维样式已更新，尚未保存'},target,onUpdate);}
  function renderReasoningColor(container,target,key,label){
    const mode=make('select'),row=make('label','field',label+'来源');mode.setAttribute('aria-label',label+'来源');for(const [v,t]of [['auto','沿用主题颜色'],['custom','自定义']]){const o=make('option','',t);o.value=v;mode.append(o);}mode.value=target[key]==='auto'?'auto':'custom';mode.addEventListener('change',()=>{remember();target[key]=mode.value==='auto'?'auto':config.accent;apply();renderFields();});row.append(mode);container.append(row);if(target[key]!=='auto')reasoningControl(container,target,field(label,key,'color'));
  }
  function renderReasoningFields(container,part){
    const item=config.reasoningStyle[part],prefix=part==='entry'?'入口':'思维正文';
    if(part==='entry'){propertyHeading(container,'入口内容');reasoningControl(container,item,field('入口文字','content'));reasoningControl(container,item,field('显示入口箭头','showArrow','select',{options:[['false','隐藏'],['true','显示']]}));propertyHeading(container,'入口文字位置');for(const [key,label]of [['x','入口文字水平位置'],['y','入口文字纵向位置']])reasoningControl(container,item.labelPosition,field(label,key,'range',{min:-500,max:500,unit:'px'}));}propertyHeading(container,'字体设计');
    reasoningControl(container,item,field('字体来源','fontSource','select',{options:[['body','跟随聊天正文'],['interface','跟随界面'],['custom','自定义']]}),()=>renderFields());
    container.append(make('p','hint','跟随只影响字体，字号、字重和颜色单独设置。'));
    const fontRow=pairedFields(container);if(item.fontSource==='custom')reasoningControl(fontRow,item,field(prefix+'字体','font','select',{options:fonts}));
    const weightLabel=make('label','field',prefix+'字重'),weight=make('select');weight.setAttribute('aria-label',prefix+'字重');for(const [v,t]of [['auto','常规（沿用）'],...Array.from({length:9},(_,i)=>[String((i+1)*100),String((i+1)*100)])]){const o=make('option','',t);o.value=v;weight.append(o);}weight.value=String(item.weight);weight.addEventListener('change',()=>{remember();item.weight=weight.value==='auto'?'auto':Number(weight.value);apply();});weightLabel.append(weight);fontRow.append(weightLabel);
    reasoningControl(container,item,field(prefix+'字号','size','range',{min:10,max:part==='entry'?34:28,unit:'px'}));
    renderReasoningColor(container,item,'color',prefix+'颜色');
    if(item.fontSource==='custom'){propertyHeading(container,'外链字体');const linkRow=pairedFields(container);linkRow.classList.add('font-link-row');
      const label=make('label','field','字体文件直链（留空用预设）'),link=make('input');link.type='url';link.maxLength=2048;link.value=item.fontLink?.url||'';link.setAttribute('aria-label',prefix+' 字体直链');label.append(link);
      const faceLabel=make('label','field','链接文件类型'),face=make('select');face.setAttribute('aria-label',prefix+' 链接文件类型');for(const [v,t]of [['400','常规字体'],['700','粗体字体'],['100 900','可变字体'],['100','极细字体'],['200','纤细字体'],['300','细体字体'],['500','中等字体'],['600','半粗字体'],['800','特粗字体'],['900','重体字体']]){const o=make('option','',t);o.value=v;face.append(o);}face.value=item.fontLink?.faceWeight||'400';faceLabel.append(face);linkRow.append(faceLabel,label);
      const commit=()=>{try{const value=validateCaptionStyle({fontLink:link.value.trim()?{url:link.value.trim(),faceWeight:face.value}:null});remember();item.fontLink=value.fontLink;link.removeAttribute('aria-invalid');apply();}catch(error){link.setAttribute('aria-invalid','true');notify(error.message);}};renderFontLibrary(container,{library:fontLibrary,link,face,onSelect:commit,onError:notify});
    link.addEventListener('change',commit);face.addEventListener('change',()=>{if(link.value.trim())commit();});const status=make('p','hint');status.dataset.fontStatus='reasoning:'+part;container.append(status);const retry=make('button','','重新加载链接字体');retry.addEventListener('click',()=>fontSession?.retry());container.append(retry,make('p','hint','链接须直接返回字体文件并允许跨域；失败使用预设。导出携带链接，不包含字体文件。'));updateFontStatuses();
    }

    if(part==='entry'){
      propertyHeading(container,'入口背景');const bg=item.background,g=item.geometry;
      reasoningControl(container,bg,field('入口背景','mode','select',{options:[['none','无背景'],['color','颜色'],['image','自选图片']]}),()=>renderFields());
      if(bg.mode==='color')reasoningControl(container,bg,field('入口背景颜色','color','color'));
      if(bg.mode==='image'){
        const pick=make('button','','选择或替换背景图片');pick.id='reasoning-bg-pick';pick.addEventListener('click',()=>{invalidateEditing();libraryPurpose='reasoning-background';ui.mode='library';renderFields();});container.append(pick,make('p','hint',bg.source?(bg.source.kind==='asset'?ASSETS[bg.source.asset].name:'已选择上传图片'):'尚未选择图片'));
        reasoningControl(container,bg,field('背景填充','fit','select',{options:[['cover','铺满（可能裁边）'],['contain','完整显示']]}));for(const [key,label]of [['x','背景横向取景'],['y','背景纵向取景']])reasoningControl(container,bg,field(label,key,'range',{min:0,max:100,unit:'%'}));
      }
      if(bg.mode!=='none')reasoningControl(container,bg,field('背景透明度','opacity','range',{min:0,max:1,step:.05}));
      propertyHeading(container,'入口尺寸与留白');
      const mode=make('select'),label=make('label','field','入口宽度');mode.setAttribute('aria-label','入口宽度模式');for(const [v,t]of [['auto','自动'],['custom','自定义']]){const o=make('option','',t);o.value=v;mode.append(o);}mode.value=g.width==='auto'?'auto':'custom';mode.addEventListener('change',()=>{remember();g.width=mode.value==='auto'?'auto':60;apply();renderFields();});label.append(mode);container.append(label);
      if(g.width!=='auto')reasoningControl(container,g,field('入口宽度占比','width','range',{min:20,max:100,unit:'%'}));
      for(const [key,label,max]of [['minHeight','入口最小高度',160],['radius','入口圆角',40],['paddingX','入口左右留白',40],['paddingY','入口上下留白',40]])reasoningControl(container,g,field(label,key,'range',{min:0,max,unit:'px'}));
    }else{
      propertyHeading(container,'容器底色与边框');const c=item.container;
      reasoningControl(container,c,field('思维正文背景','background','select',{options:[['none','无背景'],['color','颜色']]}),()=>renderFields());if(c.background==='color')reasoningControl(container,c,field('思维正文背景颜色','color','color'));
      for(const [key,label,max]of [['radius','正文容器圆角',40],['borderWidth','正文容器边框粗细',8]])reasoningControl(container,c,field(label,key,'range',{min:0,max,step:key==='borderWidth'?.25:1,unit:'px'}));
      reasoningControl(container,c,field('正文容器边框颜色','borderColor','color'));reasoningControl(container,c,field('正文容器边框线型','borderStyle','select',{options:[['solid','实线'],['dashed','虚线'],['dotted','点线']]}));propertyHeading(container,'容器留白');for(const [key,label]of [['paddingX','思维正文左右留白'],['paddingY','思维正文上下留白']])reasoningControl(container,c,field(label,key,'range',{min:0,max:40,unit:'px'}));
    }
  }
  function nativeControl(container,target,f,onUpdate){editorControl(container,{...f,notice:'原生功能样式已更新，尚未保存'},target,onUpdate);}
  function nativePositionFields(container,v){
    nativeControl(container,v,field('所在区域','position','select',{options:[['header','头像区'],['footer','尾部区']]}),()=>renderFields());
    if(v.anchor&&v.position==='header')nativeControl(container,v,field('垂直定位','anchor','select',{options:[['top','顶部'],['center','居中'],['bottom','底部']]}));
    nativeControl(container,v,field('左右移动','x','range',{min:-100,max:100,unit:'%'}));
    nativeControl(container,v,field('上下移动','y','range',{min:-160,max:160,unit:'px'}));
  }
  function nativeAppearanceFields(container,v,isStats=false){
    nativeControl(container,v,field('字号','size','range',{min:10,max:28,unit:'px'}));
    const label=make('label','field','颜色来源'),mode=make('select');mode.setAttribute('aria-label','颜色来源');
    for(const [id,text]of [['auto','沿用主题颜色'],['custom','自定义']]){const o=make('option','',text);o.value=id;mode.append(o);}mode.value=v.color==='auto'?'auto':'custom';
    mode.addEventListener('change',()=>{remember();v.color=mode.value==='auto'?'auto':isStats?config.timeColor:config.accent;apply();renderFields();});label.append(mode);container.append(label);
    if(v.color!=='auto')nativeControl(container,v,field('颜色','color','color'));
  }
  function renderNativeFields(container){
    if(ui.kind==='actions'){
      const actions=config.nativeStyle.actions,edit=actions.edit;
      propertyHeading(container,'编辑');nativePositionFields(container,edit);
      nativeControl(container,edit,field('显示方式','mode','select',{options:[['default','原生图标'],['text','自定义文字'],['image','自定义图片']]}),()=>renderFields());
      if(edit.mode==='text')nativeControl(container,edit,field('文字','text','text',{maxLength:40}));
      if(edit.mode==='image'){
        const pick=make('button','','选择或替换编辑图标');pick.id='native-edit-pick';pick.addEventListener('click',()=>{invalidateEditing();libraryPurpose='native-edit-icon';ui.mode='library';renderFields();});container.append(pick);
        nativeControl(container,edit,field('图标大小','imageSize','range',{min:8,max:120,unit:'px'}));
      }
      propertyHeading(container,'更多');nativePositionFields(container,actions.more);
      nativeControl(container,actions.more,field('更多显示方式','mode','select',{options:[['default','原生图标'],['text','自定义文字'],['image','自定义图片']]}),()=>renderFields());
      if(actions.more.mode==='text')nativeControl(container,actions.more,field('更多文字','text','text',{maxLength:40}));
      if(actions.more.mode==='image'){const pick=make('button','','选择或替换更多图标');pick.id='native-more-pick';pick.addEventListener('click',()=>{invalidateEditing();libraryPurpose='native-more-icon';ui.mode='library';renderFields();});container.append(pick);nativeControl(container,actions.more,field('更多图标大小','imageSize','range',{min:8,max:120,unit:'px'}));}
      propertyHeading(container,'外观');nativeAppearanceFields(container,actions);
    }else if(ui.kind==='info'){
      const stats=config.nativeStyle.stats;
      for(const [key,title]of [['floor','楼层号'],['time','生成时长'],['tokens','Token 统计']]){propertyHeading(container,title);nativePositionFields(container,stats[key]);if(key==='floor'){nativeControl(container,stats.floor,field('前缀','prefix','text',{maxLength:40}));nativeControl(container,stats.floor,field('后缀','suffix','text',{maxLength:40}));}}
      propertyHeading(container,'外观');nativeAppearanceFields(container,stats,true);
    }else{
      const swipe=config.nativeStyle.swipe;
      propertyHeading(container,'排列');nativeControl(container,swipe,field('箭头排列','layout','select',{options:[['compact','紧凑'],['ends','左右两端']]}),()=>renderFields());
      if(swipe.layout==='compact')nativeControl(container,swipe,field('中间间距','gap','range',{min:0,max:40,unit:'px'}));
      propertyHeading(container,'位置');nativePositionFields(container,swipe);
      propertyHeading(container,'外观');nativeAppearanceFields(container,swipe);
      propertyHeading(container,'箭头文字');for(const [key,name]of [['left','左箭头'],['right','右箭头']]){const arrow=swipe[key];nativeControl(container,arrow,field(name+'显示','mode','select',{options:[['default','原生箭头'],['text','自定义文字']]}),()=>renderFields());if(arrow.mode==='text')nativeControl(container,arrow,field(name+'文字','text','text',{maxLength:40}));}
      propertyHeading(container,'版本计数');for(const [key,label]of [['hideHistory','隐藏历史版本页数'],['hideLatest','隐藏最新AI版本页数']])nativeControl(container,swipe,field(label,key,'select',{options:[['true','隐藏'],['false','不额外隐藏']]}));
    }
  }
  function renderBodySettings(container){
    propertyHeading(container,'字体设计');const fontRow=pairedFields(container);renderConfigFields(fontRow,['font']);
    const label=make('label','field','正文字重'),mode=make('select');mode.setAttribute('aria-label','正文字重模式');for(const [value,name]of [['auto','沿用当前'],['custom','自定义']]){const option=make('option','',name);option.value=value;mode.append(option);}mode.value=config.bodyWeight==='auto'?'auto':'custom';mode.addEventListener('change',()=>{remember();config.bodyWeight=mode.value==='auto'?'auto':400;apply();renderFields();});label.append(mode);fontRow.append(label);
    if(config.bodyWeight!=='auto')editorControl(container,field('正文字重','bodyWeight','range',{min:100,max:900,step:50,notice:'正文排版已更新，尚未保存'}),config);renderConfigFields(container,['fontSize','text']);
    renderFontLinkFields(container,'body',{get fontLink(){return config.bodyFontLink;},set fontLink(v){config.bodyFontLink=v;}},'正文');
    propertyHeading(container,'段落排版');renderConfigFields(container,['lineHeight']);
    for(const f of [field('段距（含末段下方）','bodyParagraphGap','range',{min:0,max:80,unit:'px'}),field('首行缩进','bodyIndent','select',{options:[['false','关闭'],['true','两个字']]})])editorControl(container,{...f,notice:'正文排版已更新，尚未保存'},config);
    propertyHeading(container,'左右留白');for(const f of [field('正文左侧留白','bodyPaddingLeft','range',{min:0,max:100,unit:'px'}),field('正文右侧留白','bodyPaddingRight','range',{min:0,max:100,unit:'px'})])editorControl(container,{...f,notice:'正文排版已更新，尚未保存'},config);
  }
  function renderCardBorderSettings(container){
    propertyHeading(container,'消息卡片边框');editorControl(container,field('边框范围','cardBorderMode','select',{options:[['none','关闭'],['all','四周'],['custom','指定边']],notice:'卡片边框已更新，尚未保存'}),config,()=>renderFields());
    if(config.cardBorderMode==='custom'){const row=make('div','actions');for(const [key,title]of [['Top','上边'],['Right','右边'],['Bottom','下边'],['Left','左边']]){const label=make('label','',title),input=make('input');input.type='checkbox';input.style.width='auto';input.checked=config['cardBorder'+key];input.setAttribute('aria-label','卡片'+title);input.addEventListener('change',()=>{remember();config['cardBorder'+key]=input.checked;apply();});label.prepend(input);row.append(label);}container.append(row);}
    const colorLabel=make('label','field','边框颜色来源'),mode=make('select');mode.setAttribute('aria-label','卡片边框颜色来源');for(const [value,name]of [['auto','默认半透明白'],['custom','自定义颜色']]){const option=make('option','',name);option.value=value;mode.append(option);}mode.value=config.cardBorderColor==='auto'?'auto':'custom';mode.addEventListener('change',()=>{remember();config.cardBorderColor=mode.value==='auto'?'auto':'#ffffff';apply();renderFields();});colorLabel.append(mode);container.append(colorLabel);
    if(config.cardBorderColor!=='auto')editorControl(container,field('卡片边框颜色','cardBorderColor','color',{notice:'卡片边框已更新，尚未保存'}),config);
    for(const f of [field('卡片边框粗细','cardBorderWidth','range',{min:0,max:12,step:.25,unit:'px'}),field('卡片边框线型','cardBorderStyle','select',{options:[['solid','实线'],['dashed','虚线'],['dotted','点线']]} )])editorControl(container,{...f,notice:'卡片边框已更新，尚未保存'},config);
  }
  function renderChromeFields(container){
    const zone=ui.region,v=config.chromeStyle[zone],isInput=zone==='input';
    propertyHeading(container,'区域开关');editorControl(container,field(isInput?'启用输入区美化':'启用顶栏美化','enabled','select',{options:[['true','启用'],['false','关闭 · 保留宿主']],notice:'区域开关已更新，尚未保存'}),v,()=>renderFields());if(!v.enabled)container.append(make('p','hint','当前关闭；下方设置保存为草稿，启用后生效。'));
    const controls=(target,fields)=>{for(const [label,key,type,opts={}]of fields)editorControl(container,field(label,key,type,{...opts,notice:'页面美化已更新，尚未保存'}),target,key==='fontMode'?()=>renderFields():undefined);};
    const range=(label,key,min,max,unit='px',step=1)=>[label,key,'range',{min,max,unit,step}];
    if(ui.kind==='surface'){
      if(isInput){propertyHeading(container,'排版与宽度');controls(v,[['输入区排版','layout','select',{options:[['inline','原生横排'],['stacked','文字首行 · 功能第二行']]}],range('输入区宽度','width',50,100,'%'),range('左侧留白','leftGap',0,80),range('右侧留白','rightGap',0,80),range('左右内距','padX',0,32),range('上下内距','padY',0,32)]);}
      propertyHeading(container,'底色与玻璃');controls(v,[['区域底色','color','color'],range('背景透明度','alpha',0,1,'',.05),range('玻璃模糊','blur',0,24)]);propertyHeading(container,'边框与圆角');controls(v,[['显示边框','borderEnabled','select',{options:[['true','显示'],['false','隐藏']]}],['区域边框颜色','borderColor','color'],range('区域边框粗细','borderWidth',0,6,'px',.25),range('区域圆角','radius',0,40)]);
      if(!isInput){propertyHeading(container,'图形与点击槽');controls(v,[range('顶栏图标大小','iconSize',12,40),range('顶栏点击槽','slot',28,64),range('顶栏按钮间距','gap',0,16),range('顶栏上下内距','padY',0,16)]);container.append(make('p','hint','窄处按九格可用空间收窄点击槽；打开项、焦点和异常提示保持可辨。'));}
    }else if(ui.kind==='text'){
      propertyHeading(container,'字体设计');controls(v,[['输入字体来源','fontMode','select',{options:[['interface','跟随界面字体'],['chat','跟随聊天正文'],['custom','自定义字体']]}]]);if(v.fontMode==='custom')controls(v,[['输入字体','font','select',{options:fonts}]]);controls(v,[range('输入字号','size',8,60),range('输入字重','weight',100,900,'',100),['输入文字颜色','textColor','color'],range('输入行高','lineHeight',1,3,'',.1)]);propertyHeading(container,'自动增高范围');controls(v,[range('输入最小高度','minHeight',32,160),range('输入最大高度','maxHeight',80,600)]);container.append(make('p','hint','最大高度需不小于最小高度，并受当前视口60%限制；真实输入仍由酒馆自动增高。'));if(v.fontMode==='custom'){propertyHeading(container,'外链字体');renderFontLinkFields(container,'chrome-input',v,'输入文字');}
    }else if(['tools','icons'].includes(ui.kind)){
      if(isInput){propertyHeading(container,'工具共用尺寸');controls(v,[range('输入图标大小','iconSize',12,40),range('输入点击槽','slot',28,64),range('输入工具间距','gap',0,24)]);}
      propertyHeading(container,'当前按钮图形');const item=v.icons[ui.object];editorControl(container,field('按钮图形','mode','select',{options:[['native','保留原生'],['image','使用图片']],notice:'图形已更新，尚未保存'}),item,()=>renderFields());
      if(item.mode==='image'){const pick=make('button','','选择或替换按钮图片');pick.id='chrome-icon-pick';pick.addEventListener('click',()=>{invalidateEditing();libraryPurpose='chrome:'+zone+':'+ui.object;ui.mode='library';renderFields();});container.append(pick,make('p','hint',item.image?'已选择上传图片':item.asset?ASSETS[item.asset].name:'尚未选择图片，保留原生图形'));}
      const clear=make('button','','恢复原生图形');clear.addEventListener('click',()=>{invalidateEditing();remember();Object.assign(item,{mode:'native',asset:'',image:''});apply();renderFields();});container.append(clear,make('p','hint',isInput?'显隐、发送与停止状态由酒馆控制；这里不执行按钮业务。':'只换图形，保留原抽屉、提示和打开/连接状态。'));
    }
  }
  function renderChromeSourceLibrary(container){
    const [,zone,id]=libraryPurpose.split(':'),target=config.chromeStyle[zone]?.icons[id];if(!target){libraryPurpose='layer';return renderFields();}
    return renderSourceLibrary(container,target);
  }

  function renderRegionLayers(container){
    const region=ui.region,allowed=['header','overall','reasoning','footer','input'];
    if(!allowed.includes(region)){container.append(make('p','hint','此区域没有可排序的素材。'));return;}
    const entries=regionEntries(config,region).reverse();
    if(!entries.length){container.append(make('p','hint','此区域还没有素材。'));return;}
    const selectedKey=ui.kind==='image'?imageKey(ui.object):ui.kind==='avatar'?'avatar':ui.object;
    const list=make('div','region-layer-list');
    for(const entry of entries){
      const row=make('div','region-layer-row'+(entry.key===selectedKey?' selected':''));row.dataset.layerKey=entry.key;
      const choose=make('button','layer-select',entry.label+(entry.visible?'':' · 已隐藏'));choose.type='button';choose.setAttribute('aria-pressed',String(entry.key===selectedKey));
      choose.addEventListener('click',()=>{ui.kind=entry.kind;ui.object=entry.kind==='avatar'?'photo-'+photoScope:entry.id;if(entry.kind==='image')selectedLayerId=entry.id;else if(entry.kind==='text')textItemKey=entry.id;renderFields();});row.append(choose);
      if(entry.key===selectedKey){const actions=make('div','actions');for(const [direction,label]of [['top','置顶'],['up','上移'],['down','下移'],['bottom','置底']]){const button=make('button','',label);button.type='button';button.disabled=!canMoveRegionItem(config,region,entry.key,direction);button.addEventListener('click',()=>{remember();config=moveRegionItem(config,region,entry.key,direction);apply();renderFields();});actions.append(button);}const edit=make('button','','编辑');edit.type='button';edit.addEventListener('click',()=>{ui.mobileView='adjust';renderFields();});actions.append(edit);row.append(actions);}list.append(row);
    }container.append(list);
  }
  function renderFields(group,{fromPreview=false}={}){
    if(group){ui.mode='edit';ui.page='chat';
      if(group==='decoration'){const layer=config.layers.find(l=>l.id===selectedLayerId);workbench.choose(layerRegion(layer),'image',layer?.id||'');}
      else if(group==='photo')workbench.choose('header','avatar','photo-'+photoScope);
      else if(group==='caption')workbench.choose('header','text',config.captions[0]?captionKey(config.captions[0].id):'name');
      else if(group==='text')workbench.choose('header','text',textItemKey);else if(group==='footer-text')workbench.choose('footer','text',textItemKey);
      else if(group==='avatar')workbench.choose('header','region','region');
      else if(group==='body')workbench.choose('body','region','body');
      else if(group==='reasoning'||group==='reasoning-body')workbench.choose('reasoning',group==='reasoning'?'entry':'reason-body',group);
      else if(group==='native')workbench.choose('native','actions','actions');
      else if(['input','topbar'].includes(group))workbench.choose(group,'surface','surface');
      else if(group==='global')workbench.choose('overall','card','card');
    }
    if(fromPreview&&(document.defaultView?.innerWidth||1200)<=700)ui.mobileView='preview';
    normalizeSelection(ui,config.layers,config.captions,config.footerCaptions);
    const container=shadow.querySelector('.fields');container.replaceChildren();let kinds=[],objects=[],title='',keys=[];const names={name:'名字',time:'时间',caption:'文案'};
    if(ui.page!=='chat')title=PREVIEW_PAGES[ui.page]+' · 页面预览';
    else if(ui.mode==='library')title=libraryPurpose.startsWith('chrome:')?'选择按钮图片':libraryPurpose==='native-more-icon'?'设置更多图标':libraryPurpose==='native-edit-icon'?'设置编辑图标':libraryPurpose==='reasoning-background'?'设置思维入口背景':'添加到：'+(ui.region==='input'?'输入区':ui.region==='footer'?'尾部区':ui.region==='reasoning'?'思维区':ui.region==='overall'?'整张消息':'头像区');
    else if(ui.region==='overall'){
      kinds=[['card','整体样式'],['image','全局装饰']];if(ui.kind==='image'){objects=matchingLayers(config.layers,'overall').map(l=>[l.id,l.name]);selectedLayerId=ui.object;selected='decoration';title=config.layers.find(l=>l.id===ui.object)?.name||'全局装饰';}else{selected='global';title='当前消息卡片';keys=['surface','accent','radius','glass','surfaceOpacity','cardWidth'];}
    }else if(ui.region==='header'){
      kinds=[['region','区域设置'],['avatar','头像设计'],['name','名字'],['time','时间'],['text','自定义文案'],['image','图片素材']];
      if(ui.kind==='text'){objects=['name','time'].includes(ui.object)?[]:config.captions.map(c=>[captionKey(c.id),c.name+(c.visible?'':' · 已隐藏')]);textItemKey=ui.object;selected=selectedCaption()?'caption':'avatar';title=(selectedCaption()?.name||names[ui.object])+'';keys=ui.object==='name'?['nameFont','nameColor','nameSize']:ui.object==='time'?['timeFont','timeColor','timeSize']:[];}
      else if(ui.kind==='avatar'){objects=[];selected='photo';title='';if(ui.object==='photo-user')photoScope='user';else if(ui.object==='photo-ai')photoScope='ai';}
      else if(ui.kind==='image'){selected='decoration';objects=matchingLayers(config.layers,'header').map(l=>[l.id,l.name]);selectedLayerId=ui.object;title=config.layers.find(l=>l.id===ui.object)?.name||'头像区图片';}
      else{selected='avatar';title='头像区设置';keys=['headerHeight'];}
    }else if(ui.region==='body'){selected='body';title='正文阅读样式';keys=['text','font','fontSize','lineHeight'];}
    else if(ui.region==='footer'){kinds=[['text','自定义文案'],['image','图片素材']];if(ui.kind==='image'){selected='decoration';objects=matchingLayers(config.layers,'footer').map(l=>[l.id,l.name]);selectedLayerId=ui.object;title=config.layers.find(l=>l.id===ui.object)?.name||'尾部图片';}else{ui.kind='text';objects=config.footerCaptions.map(c=>[footerKey(c.id),c.name+(c.visible?'':' · 已隐藏')]);textItemKey=ui.object;selected='footer';title=selectedCaption()?selectedCaption().name+'':'尾部文案 · 默认空';}}
    else if(['input','topbar'].includes(ui.region)){
      kinds=ui.region==='topbar'?[['surface','顶栏整体'],['icons','按钮图标']]:[['surface','输入外框'],['text','输入文字'],['tools','工具与发送'],['image','图片素材']];if(!kinds.some(([k])=>k===ui.kind))ui.kind='surface';
      if(ui.kind==='image'){selected='decoration';objects=matchingLayers(config.layers,'input').map(l=>[l.id,l.name]);selectedLayerId=ui.object;title=config.layers.find(l=>l.id===ui.object)?.name||'输入区图片';}
      else if(['icons','tools'].includes(ui.kind)){objects=ui.region==='topbar'?DRAWERS:INPUT_ICONS;if(!objects.some(([id])=>id===ui.object))ui.object=objects[0][0];title=objects.find(([id])=>id===ui.object)[1]+' · '+(ui.region==='topbar'?'顶栏按钮':'输入按钮');}
      else title=ui.region==='topbar'?'顶栏整体':ui.kind==='text'?'输入文字':'输入外框';
    }
    else if(ui.region==='native'){kinds=[['actions','编辑与更多'],['info','楼层信息'],['swipe','回复翻页']];if(!['actions','info','swipe'].includes(ui.kind))ui.kind='actions';selected='native';title=kinds.find(([key])=>key===ui.kind)[1];}
    else if(ui.region==='reasoning'){kinds=[['entry','思维入口'],['reason-body','思维正文'],['image','图片素材']];if(ui.kind==='image'){selected='decoration';objects=matchingLayers(config.layers,'reasoning').map(l=>[l.id,l.name]);selectedLayerId=ui.object;title=config.layers.find(l=>l.id===ui.object)?.name||'思维图片';}else{if(ui.kind!=='reason-body')ui.kind='entry';selected='reasoning';title=ui.kind==='entry'?'思维入口':'思维正文';}}
    else title='此区域尚未开放';
    let extra;if(ui.page==='chat'&&ui.mode==='edit'&&ui.kind==='image'){extra=make('button','','＋ 添加图片');extra.id='add-current-image';extra.addEventListener('click',()=>{invalidateEditing();libraryPurpose='layer';ui.mode='library';renderFields();});}
    let actions;if(ui.page==='chat'&&ui.mode==='edit'&&['header','footer'].includes(ui.region)&&ui.kind==='text'&&!(ui.region==='header'&&['name','time'].includes(ui.object))){const list=currentCaptions();actions=make('button','',`＋ 新增文案（${list.length}/${CAPTION_LIMIT}）${list.length>=CAPTION_LIMIT?' 已达上限':''}`);actions.id=ui.region==='footer'?'add-footer-caption':'add-caption';actions.disabled=list.length>=CAPTION_LIMIT;actions.title=actions.disabled?'已达20条文案上限':'新增一条文案';actions.addEventListener('click',()=>{remember();const cap=currentNewCaption({name:'文案'+(list.length+1),font:config.font,color:config.accent});list.push(cap);ui.object=currentCaptionKey(cap.id);apply();renderFields();});}
    const activeKind=ui.region==='header'&&ui.kind==='text'&&['name','time'].includes(ui.object)?ui.object:ui.kind;workbench.render({kinds,objects,title,extra,actions,activeKind});
    if(ui.page!=='chat')container.append(make('p','hint','当前是 '+PREVIEW_PAGES[ui.page]+' 的虚构页面预览。可展开分组、查看控件与滚动效果，不会修改酒馆数据。此页外观编辑尚未接入；从更多切回聊天可继续原来的编辑。'));
    else if(!['overall','header','body','reasoning','footer','native','input','topbar'].includes(ui.region)&&ui.mode!=='library')container.append(make('p','hint','此入口仅保留位置，真实功能尚未接入。当前主题和保存未改变。'));
    else if(ui.mode==='library')renderSourceLibrary(container);
    else if(ui.mobileView==='layers')renderRegionLayers(container);
    else{

      if(keys.length&&!['overall','body'].includes(ui.region)&&!(ui.region==='header'&&['text','region'].includes(ui.kind))){if(ui.region==='header'&&ui.kind==='avatar')propertyHeading(container,'形状与尺寸');renderConfigFields(container,keys);}
      if(ui.region==='overall'&&ui.kind!=='image'){propertyHeading(container,'画布与卡片');const desktopWidth=make('div','desktop-card-width');container.append(desktopWidth);editorControl(desktopWidth,{...field('卡片宽度','cardFullWidth','select',{options:[['false','限制最大宽度'],['true','铺满聊天区']]}),notice:'卡片宽度已更新，尚未保存'},config,()=>renderFields());if(!config.cardFullWidth)renderConfigFields(desktopWidth,['cardWidth']);editorControl(container,{...field('卡片两侧留白','cardGutter','range',{min:0,max:80,unit:'px'}),notice:'卡片留白已更新，尚未保存'},config);renderConfigFields(container,['radius']);
      container.append(make('p','muted','整体背景由酒馆管理；换图请使用酒馆背景设置。'));
      if(config.canvasBackground==='legacy-solid'){const notice=make('p','muted','此旧方案保留原纯色背景。'),migrate=make('button','','改为跟随酒馆背景');migrate.type='button';migrate.addEventListener('click',()=>{remember();config.canvasBackground='tavern';apply();renderFields();notify('已跟随酒馆背景；可撤销，保存后记住');});container.append(notice,migrate);}propertyHeading(container,'配色与透明');renderConfigFields(container,['surface','accent','surfaceOpacity','glass']);}
      if(ui.region==='header'&&ui.kind==='region'){propertyHeading(container,'头像区基础');renderConfigFields(container,['headerHeight']);container.append(make('p','hint','这是从卡片顶部到正文前的总高度。内容可自由移出区域，超出的部分不显示；调高后会重新露出。'));}
      if(['input','topbar'].includes(ui.region)&&ui.kind!=='image')renderChromeFields(container);
      if(ui.region==='native')renderNativeFields(container);if(ui.region==='body')renderBodySettings(container);if(ui.region==='reasoning'&&ui.kind!=='image')renderReasoningFields(container,ui.kind==='reason-body'?'body':'entry');
      if(ui.region==='overall'&&ui.kind!=='image')renderCardBorderSettings(container);
      if(ui.region==='header'&&ui.kind==='text'){if(selectedCaption()||['name','time'].includes(ui.object))renderTextFields(container);else container.append(make('p','hint','还没有自定义文案，点击新增文案开始。'));}
      if(ui.region==='footer'&&ui.kind==='text'){if(selectedCaption())renderTextFields(container);else container.append(make('p','hint','尾部还没有文案，点击新增文案开始；默认空白不占高。'));}
      if(ui.region==='header'&&ui.kind==='avatar')renderPhotoFields(container);
      if(ui.kind==='image')renderLayers(container);
    }
    const canOperate=ui.page!=='chat'||(['overall','header','body','reasoning','footer','native','input','topbar'].includes(ui.region)||ui.mode==='library');for(const id of ['save','import','export','restore','undo','apply-live'])shadow.querySelector('#'+id).disabled=!canOperate||(id==='undo'&&!history.length);
    for(const e of document.querySelectorAll('[data-orange-lab-fixture] .otl-selected'))e.classList.remove('otl-selected');
    if(ui.page==='chat'&&ui.mode==='edit')for(const e of document.querySelectorAll('[data-orange-lab-fixture] [data-pick]')){
      const matches=ui.kind==='image'?e.dataset.layerId===ui.object:['header','footer'].includes(ui.region)&&ui.kind==='text'?selectedCaption()?(ui.region==='footer'?e.dataset.footerCaptionId:e.dataset.captionId)===selectedCaption().id:e.dataset.textItem===textItemKey:ui.kind==='avatar'?e.dataset.pick==='photo'&&e.dataset.scope===photoScope:false;if(matches)e.classList.add('otl-selected');
    }
    chromePreview.update(config);updateWorkbenchLayout();
  }
  function apply(){
    config.regionOrder=syncRegionOrder(config).regionOrder;ui.previewMode='page';
    scrollbarVisibility.set(active&&normalizeScrollbars(config.hideScrollbars));if(scrollbarToggle)scrollbarToggle.checked=normalizeScrollbars(config.hideScrollbars);
    layerDrag.cancel();
    const root=document.documentElement;root.dataset.otlPreviewMode=ui.previewMode;
    fontSession?.update({body:{fontLink:config.bodyFontLink},...textEntries(config),...reasoningFontEntries(config),...footerTextEntries(config),...chromeFontEntries(config)});updateFontStatuses();
    const lengths=['radius','fontSize','avatarSize','avatarRadius','headerHeight','nameSize','timeSize','captionSize','reasoningSize','decorationWidth','decorationX','decorationY','glass','cardWidth','textTop'];
    // Variables live on this dedicated stylesheet, never on the user's root inline settings.
    const cssKeys=new Set(Object.values(groups).flat().filter(f=>f.type==='color'||f.type==='range'||f.key.endsWith('Font')||f.key==='font').map(f=>f.key));
    let vars=Object.entries(config).filter(([k])=>cssKeys.has(k)).map(([k,v])=>`--otl-${k}:${v}${lengths.includes(k)?'px':''}`).join(';');
    vars=vars.replace(/--otl-surface:#[0-9a-f]{6}/i,`--otl-surface:${config.surface}${Math.round(config.surfaceOpacity*255).toString(16).padStart(2,'0')}`);
    const marker='/* CONFIG */';const initial=liveStyle.textContent.split(marker)[0];liveStyle.textContent=initial+marker+`html[data-orange-lab]{${vars}}`+(config.timeFont==='auto'?'':'html[data-orange-lab] .otl-name-row .timestamp{font-family:var(--otl-timeFont)!important}');
    const selectors={name:'html[data-orange-lab] #chat > .mes[data-orange-lab-fixture] .otl-name-row .name_text',time:'html[data-orange-lab] #chat > .mes[data-orange-lab-fixture] .otl-name-row .timestamp'};
    for(const cap of config.captions){const selector=`html[data-orange-lab] #chat > .mes[data-orange-lab-fixture] .otl-caption[data-caption-id="${cap.id}"]`;selectors[captionKey(cap.id)]=selector;liveStyle.textContent+=`${selector}{font-family:${cap.font}!important;font-size:${cap.size}px!important;color:${cap.color}!important}${selector}[hidden]{display:none!important}`;}
    liveStyle.textContent+=textItemRules(textEntries(config),selectors,fontSession?.families()||{},textTokens(config),textFallbacks(config),{position:false});
    liveStyle.textContent+=canvasBackgroundRules(config,'html[data-orange-lab]');
    const sq='html[data-orange-lab] #chat > .mes[data-orange-lab-fixture]';liveStyle.textContent+=sceneTextRules(config,selectors)+sceneFrameRules(sq,sq+' .otl-header')+`${sq} .otl-header>.otl-photo-group{position:absolute!important;left:24px!important;top:calc(24px + var(--sc-photo-top))!important;bottom:auto!important;z-index:${regionZ(config,'header','avatar')}!important;clip-path:polygon(var(--sc-avatar-clip))!important;}${sq} .otl-meta,${sq} .otl-name-row{position:static!important;width:auto!important;padding:0!important;z-index:auto!important;transform:none!important}`;
    liveStyle.textContent+=avatarDesignRules(sq,config,true)+avatarFillRules(sq,config,true);
    liveStyle.textContent+=CHROME_PREVIEW_BASE+PAGE_PREVIEW_CSS+chromeRules(config,PREVIEW_CHROME_SELECTORS,fontSession?.families()||{},interfaceFont(document),true);
    chromePreview.update(config);
    liveStyle.textContent+=chatFrameRules('html[data-orange-lab] #chat',sq,config);
    liveStyle.textContent+=bodyCardRules('html[data-orange-lab] #chat > .mes[data-orange-lab-fixture] > .mes_block > .mes_text','html[data-orange-lab] #chat > .mes[data-orange-lab-fixture]',config,'preview',fontSession?.families()?.body);
    liveStyle.textContent+=footerRules('html[data-orange-lab] #chat > .mes[data-orange-lab-fixture]',config,fontSession?.families()||{},true);
    liveStyle.textContent+=nativeRules('html[data-orange-lab] #chat > .mes[data-orange-lab-fixture]',config,'.otl-header');
    const nq='html[data-orange-lab] #chat > .mes[data-orange-lab-fixture]';liveStyle.textContent+=`${nq} .otl-native-demo{display:flex!important;visibility:visible!important;opacity:1!important}${nq} .otl-native-demo > :is(.extraMesButtonsHint,.mes_edit){display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important}${nq} .otl-demo-stat-home > :is(.mesIDDisplay,.mes_timer,.tokenCounterDisplay){display:block!important}${nq}[is_user=false] > :is(.swipe_left,.swipeRightBlock),${nq}[is_user=false] > .swipeRightBlock > .swipe_right{display:flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;interactivity:auto!important}${nq}[is_user=false]:not([data-otl-native-hide-counter=true]) .swipes-counter{display:flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;interactivity:auto!important}${nq}[is_user=true] > :is(.swipe_left,.swipeRightBlock){display:none!important}`;

    root.dataset.otlLayout=config.layout;root.dataset.otlTime='below';renderCaptionNodes();
    const rq='html[data-orange-lab] #chat > .mes[data-orange-lab-fixture]';liveStyle.textContent+=reasoningShellRules(rq)+reasoningRules(rq+' .mes_reasoning_header',rq+' .mes_reasoning',rq+' .otl-reasoning-bg',config,fontSession?.families()||{},interfaceFont(document));
    for(const e of document.querySelectorAll('[data-orange-lab-fixture] .otl-reasoning-title')){e.textContent=config.reasoningStyle.entry.content;let bg=e.parentElement.querySelector('.otl-reasoning-bg');if(!bg){bg=make('div','otl-reasoning-bg');bg.setAttribute('aria-hidden','true');e.parentElement.prepend(bg);}}
    for(const msg of document.querySelectorAll('[data-orange-lab-fixture=message]'))msg.querySelector('.name_text').textContent=msg.getAttribute('is_user')==='true'?'旅人':config.template==='kitty'?'小砚':'小砚 · 雨天邮局';
    renderPhotos();
    renderArtwork();
    for(const msg of document.querySelectorAll('[data-orange-lab-fixture=message]'))renderFooter(msg,config,{resolveArtwork:artworkUrl,interactive:true,onImageLoad:()=>{if(active&&msg.isConnected)scheduleFit();}});
    renderPreviewNative();syncFooterSizes();layerDrag.refresh();
    scheduleFit();
    shadow.querySelector('[aria-label="基础模板"]').value=config.template;
    shadow.querySelector('#undo').disabled=!history.length;
    for(const b of shadow.querySelectorAll('[data-object]')){const layer=config.layers.find(l=>l.id===b.dataset.object),cap=currentCaptions().find(c=>currentCaptionKey(c.id)===b.dataset.object);if(layer)b.textContent=layer.name;if(cap)b.textContent=cap.name+(cap.visible?'':' · 已隐藏');}
    if(ui.mode==='edit'&&ui.kind==='text'&&selectedCaption())shadow.querySelector('.selected-title').textContent=selectedCaption().name+'';
    if(ui.mode==='edit'&&ui.kind==='image'){const layer=config.layers.find(l=>l.id===ui.object);if(layer)shadow.querySelector('.selected-title').textContent=layer.name;}
  }
  function open(){
    if(active)return;const chat=document.querySelector('#chat');if(!chat){notify('请先打开酒馆聊天界面');return;}
    previewChatWidth=chat.getBoundingClientRect().width;
    if(liveAdapter.active){liveAdapter.stop();liveBar.classList.add('hidden');}
    previewAvatars=readPreviewAvatars(document);mobileFlow.setEditorOpen(true);active=true;invalidateEditing();disabledStyle=document.querySelector('#custom-style');wasDisabled=disabledStyle?.disabled||false;if(disabledStyle)disabledStyle.disabled=true;
    document.head.append(liveStyle);document.documentElement.dataset.orangeLab='true';fontSession=createFontSession({document,onChange:()=>{if(active)apply();}});stopInterfaceWatch=watchInterfaceFont(document,()=>{if(active)apply();});
    chat.append(fixture(false),fixture(true),fixture(false,true));imageDisplay.watch(chat);imageDisplay.watch(shadow);
    shadow.querySelector('.launcher').classList.add('hidden');shadow.querySelector('.bar').classList.remove('hidden');panel.classList.remove('hidden');shadow.querySelector('.preview-tools').classList.remove('hidden');shadow.querySelector('.splitter').classList.remove('hidden');shadow.querySelector('.mobile-dock').classList.remove('hidden');document.documentElement.dataset.otlNarrow=String(ui.narrow);shadow.querySelector('#narrow').setAttribute('aria-pressed',String(ui.narrow));apply();renderFields();chat.scrollTop=0;
    layoutObserver=new ResizeObserver(scheduleFit);layoutObserver.observe(chat);for(const meta of chat.querySelectorAll('[data-orange-lab-fixture] .otl-meta'))layoutObserver.observe(meta);syncFooterSizes();
    if(loadError)notify('保存的方案未载入：'+loadError.message+' 点击“恢复已保存”重试。',0);
  }
  function syncFooterSizes(){
    if(!layoutObserver)return;const wanted=new Set(document.querySelectorAll('[data-orange-lab-fixture] .otl-footer-flow,[data-orange-lab-fixture] .name_text,[data-orange-lab-fixture] .timestamp,[data-orange-lab-fixture] .otl-caption'));for(const node of previewFooterSizes)if(!wanted.has(node)){layoutObserver.unobserve?.(node);previewFooterSizes.delete(node);}for(const node of wanted)if(!previewFooterSizes.has(node)){layoutObserver.observe(node);previewFooterSizes.add(node);}
  }
  function close(){
    if(!active)return;imageDisplay.clear();active=false;mobileFlow.setEditorOpen(false);previewAvatars={};scrollbarVisibility.stop();pagePreview.close();chromePreview.close();invalidateEditing();document.getElementById('orange-workbench-layout')?.remove();stopInterfaceWatch?.();stopInterfaceWatch=null;fontSession?.dispose();fontSession=null;layoutObserver?.disconnect();layoutObserver=null;previewFooterSizes.clear();cancelAnimationFrame(fitFrame);fitFrame=0;document.documentElement.removeAttribute('data-orange-lab');
    for(const attr of ['data-otl-layout','data-otl-time','data-otl-caption','data-otl-narrow','data-otl-preview-mode'])document.documentElement.removeAttribute(attr);
    document.querySelectorAll('[data-orange-lab-fixture]').forEach(e=>e.remove());liveStyle.remove();if(disabledStyle?.isConnected)disabledStyle.disabled=wasDisabled;fitInput()?.catch?.(error=>console.warn('[主题输入增高]',error.message));
    shadow.querySelector('.launcher').classList.remove('hidden');shadow.querySelector('.bar').classList.add('hidden');panel.classList.add('hidden');shadow.querySelector('.preview-tools').classList.add('hidden');shadow.querySelector('.splitter').classList.add('hidden');shadow.querySelector('.mobile-dock').classList.add('hidden');
  }
  function replaceStart(id){
    if(typeof window.confirm==='function'&&!window.confirm('这会替换当前草稿。原已保存方案不变，替换后可撤销。继续吗？'))return false;
    invalidateEditing();remember();
    if(id==='blank'){const blank=validate(clone(templates.blank));blank.layers=[];blank.captions=[];blank.footerCaptions=[];blank.photos=validatePhotos();blank.avatarFill.ai.enabled=false;blank.avatarFill.user.enabled=false;blank.reasoningStyle.entry.content='思考过程';config=validate(syncRegionOrder(blank));}else config=validate(clone(templates[id]));
    selectedLayerId=config.layers[0]?.id;ui.mobileView='preview';ui.previewMode='page';if(active){apply();renderFields();}notify('新起点已载入，尚未保存');return true;
  }
  const scrollbarLabel=make('label','field','隐藏滚动条（仍可滚动）'),scrollbarToggle=make('input');scrollbarToggle.type='checkbox';scrollbarToggle.checked=normalizeScrollbars(config.hideScrollbars);scrollbarToggle.setAttribute('aria-label','隐藏滚动条');scrollbarLabel.append(scrollbarToggle);shadow.querySelector('.bar details .menu').append(scrollbarLabel);scrollbarToggle.addEventListener('change',()=>{remember();config.hideScrollbars=scrollbarToggle.checked;apply();notify('滚动条显示已更新，保存方案后记住');});
  const mobileFlow=installMobileFlow({shadow,onVisibility:visible=>scrollbarVisibility.set((active||visible)&&normalizeScrollbars(config.hideScrollbars)),onContinue:open,onTemplate:replaceStart,onBlank:()=>replaceStart('blank'),onImport:()=>{open();shadow.querySelector('#import-file').click();},onLayout:()=>{if(active)updateWorkbenchLayout();}});
  shadow.querySelector('.launcher').addEventListener('click',()=>mobileFlow.mobile()?mobileFlow.show():open());shadow.querySelector('#close').addEventListener('click',close);
  document.addEventListener('click',event=>{if(!active)return;const target=event.target.closest('[data-orange-lab-fixture] [data-pick]');if(target){if(target.dataset.layerId||target.classList.contains('otl-reasoning-title'))event.preventDefault();invalidateEditing();if(target.dataset.captionId)textItemKey=captionKey(target.dataset.captionId);else if(target.dataset.textItem)textItemKey=target.dataset.textItem;if(target.dataset.footerCaptionId){textItemKey=footerKey(target.dataset.footerCaptionId);renderFields('footer-text',{fromPreview:true});return;}if(target.dataset.layerId){event.preventDefault();selectedLayerId=target.dataset.layerId;}if(target.dataset.pick==='photo')photoScope=target.dataset.scope;renderFields(target.dataset.textItem||target.dataset.captionId?'text':target.dataset.pick,{fromPreview:!!(target.dataset.layerId||target.dataset.textItem||target.dataset.captionId||target.classList.contains('otl-reasoning-title'))});}});
  document.addEventListener('keydown',event=>{if(!active||!['Enter',' '].includes(event.key))return;if(event.target.matches('[data-orange-lab-fixture] .otl-decoration')){event.preventDefault();selectedLayerId=event.target.dataset.layerId;renderFields('decoration');}else if(event.target.matches('[data-orange-lab-fixture] .otl-header')){event.preventDefault();renderFields('avatar');}});
  shadow.querySelector('[aria-label="基础模板"]').addEventListener('change',event=>{const id=event.target.value;if(!replaceStart(id))event.target.value=config.template;});
  shadow.querySelector('#narrow').addEventListener('click',event=>{const narrow=event.target.getAttribute('aria-pressed')!=='true';ui.narrow=narrow;event.target.setAttribute('aria-pressed',String(narrow));document.documentElement.dataset.otlNarrow=String(narrow);updateWorkbenchLayout();scheduleFit();});
  shadow.querySelector('#undo').addEventListener('click',()=>{if(!history.length)return;invalidateEditing();config=history.pop();apply();renderFields();notify('已撤销上一步');});
  shadow.querySelector('#save').addEventListener('click',async()=>{
    const button=shadow.querySelector('#save');if(button.disabled)return;
    if(loadError){notify('未保存：请先点击“恢复已保存”重新读取方案。原保存未改变。',0);return;}
    let checked,json;try{checked=validate(config);json=JSON.stringify(checked);}catch(error){shadow.querySelector('#save-state').textContent='未保存';notify('未保存：'+error.message,0);return;}
    button.disabled=true;shadow.querySelector('#save-state').textContent='正在保存…';
    try{
      await schemeStorage.save(json);saved=clone(checked);
      let unchanged=false;try{unchanged=JSON.stringify(validate(config))===json;}catch{}
      shadow.querySelector('#save-state').textContent=unchanged?'已保存方案':'未保存的草稿';
      notify(unchanged?'方案已保存到当前浏览器，刷新后可以继续编辑。':'点击保存时的方案已保存；之后的修改尚未保存。');
    }catch(error){shadow.querySelector('#save-state').textContent='未保存';notify(error.name==='QuotaExceededError'?'未保存：浏览器可用存储空间不足，原有保存未变。请释放设备或本站不需要的存储后重试；也可手动导出当前方案。':'未保存：'+error.message,0);}
    finally{button.disabled=false;}
  });
  shadow.querySelector('#restore').addEventListener('click',async()=>{
    const button=shadow.querySelector('#restore');if(button.disabled)return;
    if(loadError){
      button.disabled=true;const epoch=editEpoch,originalConfig=config,draft=JSON.stringify(config);
      try{const raw=await schemeStorage.load();saved=raw===null?null:validate(JSON.parse(raw));loadError=null;
        if(!active||epoch!==editEpoch||config!==originalConfig||JSON.stringify(config)!==draft){notify('已重新读取保存方案；点击“恢复已保存”载入。');return;}
      }catch(error){loadError=error;notify('保存的方案未载入：'+error.message,0);return;}
      finally{button.disabled=false;}
    }
    if(!saved){notify('还没有保存过方案。');return;}invalidateEditing();remember();config=clone(saved);selectedLayerId=config.layers[0]?.id;apply();renderFields();notify('已恢复上次保存的方案');
  });
  shadow.querySelector('#export').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(validate(config),null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=make('a');a.href=url;a.download='橙子的主题实验方案.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('已导出实验方案；它不是酒馆原生主题文件。');});
  shadow.querySelector('#import').addEventListener('click',()=>shadow.querySelector('#import-file').click());
  shadow.querySelector('#import-file').addEventListener('change',async event=>{const input=event.target,file=input.files[0];if(!file)return;invalidateEditing();const epoch=editEpoch,originalConfig=config;try{const contents=await file.text();if(!active||epoch!==editEpoch||config!==originalConfig)return;const next=validate(JSON.parse(contents));invalidateEditing();remember();config=next;selectedLayerId=config.layers[0]?.id;apply();renderFields();notify('已导入预览，点击保存后记住。');}catch(error){notify('未导入：'+error.message);}finally{input.value='';}});
})();

