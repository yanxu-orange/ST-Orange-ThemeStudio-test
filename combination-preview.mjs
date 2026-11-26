import {avatarMaskCss,avatarRectangleMask} from './avatar-mask-style.mjs';
import {createAvatarFxNode,styleStaticAvatarFx} from './avatar-fx.mjs';
import {effectSettings} from './avatar-effects.mjs';
import {reflectionGeometry,createAvatarReflectionNode,styleStaticAvatarReflection} from './avatar-reflection.mjs';
import {canvasEnabled,projectHeaderConfig} from './header-canvas.mjs';
import {headerTextStack,STACK_BOX,STACK_MEMBER,stackCaptionClip,stackBoxGeometry} from './header-text-stack.mjs';
import {resolveMetadata} from './native-metadata.mjs';
import {avatarArtworkFrameStyle} from './avatar-art.mjs';
import {frameAssetUrl} from './avatar-frame-pairs.mjs';
import { assetUrl } from './catalog.mjs';
import { shapeSvg, layerSizeStyle } from './shape-assets.mjs';
import { createPageHeaderScene } from './page-header-scene.mjs';
import { PAGE_HEADER_PAGES } from './page-headers.mjs';
import { regionEntries } from './region-layers.mjs';
import { itemPoint, sceneGeometry,avatarClipPolygon } from './text-scene.mjs';
import { cardPadding } from './body-card.mjs';
import { chromeSourceUrl } from './chrome.mjs';
import { resolveNativeActions, nativeIconUrl } from './native.mjs';
import { resolveNativeStats, statValueStyle } from './native-stat-style.mjs';

const W = 360;
const source = layer => layer.kind === 'shape' ? 'data:image/svg+xml,' + encodeURIComponent(shapeSvg(layer)) : layer.image || assetUrl(layer.asset) || '';

// A scaled layout sample uses placeholder identity, never a saved character name.
export function createCombinationPreview(document, config, { region, pageId = 'settings' }) {
  const designCanvas=region==='header'&&canvasEnabled(config);if(designCanvas)config=projectHeaderConfig(config,W);
  const page = region === 'home' ? 'home' : pageId;
  const header = config.pageHeaders?.[page];
  const height = region === 'header' ? config.headerHeight : ['home', 'page'].includes(region) ? Math.max(80, header?.height || 160) : region === 'footer' ? Math.max(100, ...(config.footerCaptions || []).map(v => v.y + v.size * 2)) : region === 'input' ? Math.max(80, config.chromeStyle.input.minHeight + 32) : 70;
  const reflectionReserve=region==='header'?reflectionGeometry(config,config.photos.ai,config.avatarFill.ai,sceneGeometry(config,W-cardPadding(config)*2,config.photos.ai),effectSettings(config)).reserve:0,displayHeight=height+reflectionReserve;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${displayHeight}`);
  svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', '组合布局预览');
  svg.style.cssText = 'display:block;width:100%;max-height:220px;background:#f2f3f4;pointer-events:none';
  const foreign = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
  foreign.setAttribute('width', String(W)); foreign.setAttribute('height', String(displayHeight)); svg.append(foreign);
  const canvas = document.createElement('div'); canvas.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  canvas.style.cssText = `position:relative;isolation:isolate;box-sizing:border-box;width:${W}px;height:${displayHeight}px;overflow:hidden;background:${config.surface};color:${config.text};font:14px/1.4 sans-serif;`;
  foreign.append(canvas);
  const node = (tag, text) => { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; return n; };
  function text(v, content, x = v.x * W / 100, y = v.y, z = 1, host = canvas) {
    if (v.visible === false) return;
    const n = node('div', content);
    n.style.cssText = `position:absolute;left:${x}px;top:${y}px;max-width:100%;width:${v.width === 'auto' || v.width === undefined ? 'max-content' : v.widthPixels!=null?v.widthPixels+'px':v.width + '%'};font-family:${v.font || 'sans-serif'};font-size:${v.size || 14}px;font-weight:${v.weight === 'auto' ? 400 : v.weight || 400};color:${v.color || config.text};line-height:${v.lineHeight || 1.4};white-space:pre-wrap;overflow-wrap:anywhere;transform:scaleX(${v.scaleX || 1});transform-origin:left top;z-index:${z};`;
    host.append(n); return n;
  }
  function image(v, z, host = canvas) {
    if (!v.visible || !source(v)) return;
    const n = node('img'); n.alt = ''; n.src = source(v);
    n.style.cssText = 'position:absolute;max-width:none;max-height:none;';
    Object.assign(n.style, layerSizeStyle(v), { [v.side]: v.x + (v.offsetUnit === 'percent' ? '%' : 'px'), [v.vertical]: v.y + (v.offsetUnit === 'percent' ? '%' : 'px'), opacity: String(v.opacity), transform: `rotate(${v.rotation}deg)`, zIndex: String(z) }); host.append(n);
  }
  if (region === 'header' || region === 'footer') {
    const padding = cardPadding(config), inner = W - padding * 2;
    const geometry = sceneGeometry(config, inner, config.photos.ai);
    const stack = region === 'header' && headerTextStack(config,false);
    let stackBox;
    if(stack){
      const {x,y,width}=stackBoxGeometry(stack,W,padding);
      stackBox=node('div');
      for(const [key,value] of Object.entries({...STACK_BOX,position:'absolute',left:x+'px',top:y+'px',width:width+'px'}))stackBox.style.setProperty(key,String(value));
      canvas.append(stackBox);
    }
    let artHost=canvas,avatarHost=canvas;if(designCanvas){artHost=node('div');artHost.style.cssText=`position:absolute;left:${padding}px;top:${padding}px;width:${inner}px;height:${height-padding}px`;canvas.append(artHost);}
    for (const [z, entry] of regionEntries(config, region).entries()) {
      if (entry.kind === 'image') { if (entry.item.scope !== 'user'){let host=designCanvas?artHost:canvas;if((designCanvas||config.avatarEffects||config.photos.ai.verticalAnchor==='bottom')&&entry.item.anchor==='avatar'){host=node('div');Object.assign(host.style,avatarArtworkFrameStyle(config,false,{...geometry,reserveTop:0},z));canvas.append(host);}image(entry.item,z,host);} continue; }
      if (entry.kind === 'avatar') {
        const p = config.photos.ai,filled=config.avatarFill.ai.enabled,effects=effectSettings(config),mask=avatarMaskCss(effects,config.avatarFill.ai,avatarRectangleMask(effects,p,config.avatarFill.ai,config.radius,geometry));
        canvas.style.setProperty('--otl-preview-avatar-mask',mask);
        const n = node('div', '头像');
        n.style.cssText = `position:absolute;display:grid;place-items:center;box-sizing:border-box;background:#e1e3e6;color:#696d73;font:13px sans-serif;width:${geometry.photoWidth}px;height:${geometry.photoHeight}px;border:${p.enabled ? p.frameWidth : 0}px solid ${p.frameColor};border-radius:${p.radius}px;left:${filled?0:padding + p.x}px;top:${filled?0:padding + geometry.photoTop + (geometry.photoShiftY??-p.y)}px;transform:rotate(${p.rotation}deg) scale(${effects.scale/100});transform-origin:50% 100%;mask-image:var(--otl-preview-avatar-mask);mask-composite:intersect;mask-mode:alpha;mask-size:contain;mask-position:center;mask-repeat:no-repeat;-webkit-mask-image:var(--otl-preview-avatar-mask);-webkit-mask-composite:source-in;-webkit-mask-size:contain;-webkit-mask-position:center;-webkit-mask-repeat:no-repeat;z-index:${z};`;
        if(effects.frame){n.style.border='0';n.style.borderRadius='0';}
        n.style.clipPath=`polygon(${avatarClipPolygon(config,geometry,p)})`;
        if(filled)n.style.transform=`scale(${effects.scale/100})`;
        canvas.append(n);
        if(region==='header'&&effects.reflection){const reflection=createAvatarReflectionNode(document,{owned:false,placeholder:true});styleStaticAvatarReflection(reflection,{avatarStyle:n.style.cssText,c:config,p,fill:config.avatarFill.ai,g:geometry,effects,mask:'var(--otl-preview-avatar-mask)',sourceClip:avatarClipPolygon(config,geometry,p)});canvas.append(reflection);}
        if(effects.fx){const fx=createAvatarFxNode(document,effects.fx,{owned:false});fx.style.cssText=n.style.cssText;Object.assign(fx.style,{background:'transparent',border:'0',pointerEvents:'none',overflow:'hidden'});styleStaticAvatarFx(fx,effects.fx);canvas.append(fx);}
        if(effects.frame){const frame=node('div');frame.style.cssText=n.style.cssText;Object.assign(frame.style,{background:effects.frame.color,border:'0',borderRadius:'0',maskImage:`url("${frameAssetUrl(effects.frame.id)}")`,maskSize:'contain',maskPosition:'center',maskRepeat:'no-repeat',webkitMaskImage:`url("${frameAssetUrl(effects.frame.id)}")`,pointerEvents:'none'});canvas.append(frame);}
        continue;
      }
      const actual=(designCanvas||stack)&&['name','time'].includes(entry.key)?resolveMetadata(config)[entry.key]:null;
      const v = actual?{...actual,...actual.style}:entry.item;
      if (!v || actual?.region==='body-top'||v.scope === 'user') continue;
      const point = region === 'header' ? itemPoint(config, v, inner) : { x: v.x * inner / 100, y: v.y };
      const style = actual?v:entry.key === 'name' ? { ...v, size: config.nameSize, color: config.nameColor, font: config.nameFont } : entry.key === 'time' ? { ...v, size: config.timeSize, color: config.timeColor, font: config.timeFont === 'auto' ? config.font : config.timeFont } : v;
      const content=entry.key === 'name' ? '角色名字' : entry.key === 'time' ? '2026年11月17日 13:28' : v.content;
      const order=stack&&(entry.key==='name'&&stack.name?1:entry.key==='time'&&stack.time?2:entry.item===stack.caption?3:0);
      if(order){
        const member=text({...style,lineHeight:order===1?1.4:order===2?1.5:style.lineHeight??1.6},content,0,0,z,stackBox);
        for(const [key,value] of Object.entries({...STACK_MEMBER,order,'text-align':config.textAlign,'clip-path':order===3?stackCaptionClip(v):'none'}))member.style.setProperty(key,String(value));
        continue;
      }
      if(designCanvas&&style.width!=='auto')style.widthPixels=inner*style.width/100;
      const drawn=text(style, content, padding + point.x, (region === 'header' ? padding : 0) + point.y, z);if(drawn&&actual&&actual.anchor!=='left'){const factor=actual.anchor==='center'?.5:1;drawn.style.left=(padding+point.x+inner*factor)+'px';drawn.style.transform=`translateX(${-100*factor}%)`;}
    }
    const actions = resolveNativeActions(config.nativeStyle.actions), stats = resolveNativeStats(config.nativeStyle.stats);
    for (const [key, label] of [['edit', '编辑'], ['more', '更多']]) {
      const v = actions[key]; if (v.position !== region) continue;
      const color = actions.color === 'auto' ? config.text : actions.color;
      const x = W - 88 + v.x * W / 100, y = (region === 'header' ? 12 : 36) + v.y;
      const url = nativeIconUrl(v);
      if (url && ['image', 'icon'].includes(v.mode)) {
        const n = node('img'); n.src=url; n.alt=''; n.style.cssText=`position:absolute;left:${x}px;top:${y}px;width:${v.imageSize}px;height:${v.imageSize}px;object-fit:contain;z-index:30`; canvas.append(n);
      } else text({size:actions.size,color}, v.mode==='text'?v.text:label,x+(key==='more'?38:0),y,30);
    }
    for (const [i,key] of ['floor','time','tokens'].entries()) {
      const v=stats[key]; if(v.position!==region) continue;
      const style=statValueStyle(stats,key); if(style.color==='auto') style.color=config.timeColor;
      text(style,(v.label?.text||'')+(key==='floor'?(v.prefix||'')+'02'+(v.suffix||''):key==='time'?'2s':'120'),16+i*58+v.x*W/100,(region==='header'?height-24:12)+v.y,30);
    }
    const swipe=config.nativeStyle.swipe;
    if(swipe.position===region) text({size:swipe.size,color:swipe.color==='auto'?config.text:swipe.color},`${swipe.left.mode==='text'?swipe.left.text:'上一版'}  1/2  ${swipe.right.mode==='text'?swipe.right.text:'下一版'}`,W/2+swipe.x*W/100,height-25+swipe.y,30);
  } else if (region === 'home' || region === 'page') {
    if (header.enabled && (header.image || header.asset)) {
      const n = node('img'); n.alt = ''; n.src = header.image || assetUrl(header.asset);
      n.style.cssText = `position:absolute;width:100%;height:100%;object-fit:${header.fit};object-position:${header.x}% ${header.y}%;`; canvas.append(n);
    }
    if (region === 'page') {
      const x = header.titleAlign === 'center' ? W / 2 : header.titleAlign === 'right' ? W - 16 : 16;
      const title = text({ size: header.titleSize, color: header.titleColor, weight: header.titleWeight }, header.title || PAGE_HEADER_PAGES[page], x, 20);
      if (header.titleAlign !== 'left') title.style.transform = `translateX(${header.titleAlign === 'center' ? '-50%' : '-100%'})`;
      if (header.titleSubtitle) {
        const subtitle = Object.values(header.titleSubtitle.texts).find(Boolean);
        if (subtitle) text(header.titleSubtitle.style, subtitle, 16, 24 + header.titleSize);
      }
      if (header.titleDecoration) {
        const d = header.titleDecoration, mark = node('div');
        mark.style.cssText = `position:absolute;left:${6 + d.x}px;top:${20 + d.y}px;width:${d.shape === 'line' ? 2 : d.size}px;height:${d.size}px;background:${d.color};border-radius:${d.shape === 'dot' ? '50%' : 0};`; canvas.append(mark);
      }
    }
    else if (header.native?.version) {
      const v = header.native.version, n = text(v, 'SillyTavern 1.18');
      if (n && v.firstLetter) { const first = node('span', 'S'); first.style.color = v.firstLetter.color || v.color; first.style.fontSize = (v.firstLetter.size || v.size) + 'px'; n.textContent = 'illyTavern 1.18'; n.prepend(first); }
    }
    const scene = node('div'); canvas.append(scene);
    createPageHeaderScene({ document, resolveArtwork: source }).render(scene, page, header.scene);
  } else {
    const c = config.chromeStyle[region];
    canvas.style.background = c.color;
    canvas.style.border = c.borderEnabled ? `${c.borderWidth}px solid ${c.borderColor}` : 'none';
    canvas.style.borderRadius = c.radius + 'px';
    const icons = node('div'); icons.style.cssText = `position:absolute;display:flex;align-items:center;justify-content:space-around;gap:${c.gap}px;left:8px;right:8px;bottom:10px;`;
    for (const [id, value] of Object.entries(c.icons)) {
      const url = chromeSourceUrl(value), n = node(url ? 'img' : 'span', url ? undefined : region === 'topbar' ? '◇' : id === 'send_but' ? '发送' : '·');
      if (url) { n.src = url; n.alt = ''; }
      n.style.cssText = `width:${c.iconSize}px;height:${c.iconSize}px;object-fit:contain;flex:none;font-size:${c.iconSize}px;text-align:center;`; icons.append(n);
    }
    if (region === 'input') {
      text({ size: c.size, color: c.textColor, font: c.font }, c.emptyText.enabled ? c.emptyText.idle : '输入消息', 14, 8);
      for (const [z, entry] of regionEntries(config, 'input').entries()) image(entry.item, z,designCanvas?(entry.item.anchor==='avatar'?avatarHost:artHost):canvas);
    }
    canvas.append(icons);
  }
  return svg;
}
