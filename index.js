import {canvasEnabled,headerCanvasScale,projectHeaderConfig,designInnerWidth} from './header-canvas.mjs';
import {requestExportName} from './export-name.mjs';
import {createGlassEditor} from './glass-editor.mjs';
import { avatarCombinationScheme } from './default-layout.mjs';
import { activateEditedRegion } from './edit-activation.mjs';
import { createCombinationLibrary } from './combination-library.mjs';
import { captureCombination, applyCombination, inspectCombinationConflicts, builtinPageCombination } from './region-combinations.mjs';
import { combinationContext } from './combination-context.mjs';
import { createCombinationPreview } from './combination-preview.mjs';
import { rebaseBundledFontLinks } from './spring-fonts.mjs';
import { portableScheme } from './portable-scheme.mjs';
import { createCustomWorkStorage } from './custom-work-storage.mjs';
import { createWorkLibrary } from './work-library.mjs';
import { createBuiltinTemplateLibrary } from './builtin-template-library.mjs';
import { createSchemeModel } from './scheme-model.mjs';
import { createIconControlsEditor } from './icon-controls-editor.mjs';
import { createLayerEditor } from './layer-editor.mjs';
import { createTextEditor } from './text-editor.mjs';
import { createFontFieldsEditor } from './font-fields-editor.mjs';
import { createAvatarEditor } from './avatar-editor.mjs';
import { createPropertyControls } from './property-controls.mjs';
import { createPageAppearanceEditor } from './page-appearance-editor.mjs';
import { createPageHeaderEditor } from './page-header-editor.mjs';
import { createChromeEditor } from './chrome-editor.mjs';
import { createNativeControlsEditor } from './native-controls-editor.mjs';
import { createReasoningEditor } from './reasoning-editor.mjs';
import { resolveMetadata } from './native-metadata.mjs';
import { PAGE_TITLE_SUBTITLE_TARGETS } from './page-title-subtitle.mjs';
import { createWorkshopEntries } from './workshop-entries.mjs';
import { installWorkshopEventBoundary } from './workshop-events.mjs';
import { createLiveCanvas } from './live-canvas.mjs';
import { normalizeCommonConfig } from './common-style.mjs';
import { normalizePageConfig, PAGE_ROOTS } from './page-style.mjs';
import { normalizePageHeaders, PAGE_HEADER_PAGES } from './page-headers.mjs';
import { createImageDisplay } from './image-display.mjs';
import { createSchemeStorage, APPLIED_SCHEME_KEY } from './scheme-storage.mjs';
import { createFontLibrary, renderFontLibrary } from './font-library.mjs';
import { createAssetLibrary } from './asset-library.mjs';
import {
  createIconLibrary,
  renderIconLibrary,
  ICON_LIBRARY_CSS,
} from './icon-library.mjs';
import { prepareImageUpload } from './image-processing.mjs';
import { normalizeImageUrl } from './image-sources.mjs';
import { installLauncherDrag } from './launcher-drag.mjs';
import { syncRegionOrder } from './region-layers.mjs';
import { shapeDataUrl, SHAPE_NAMES } from './shape-assets.mjs';
import { updateHeaderArtworkClip } from './header-art-clip.mjs';
import { previewFrameGeometry } from './preview-layout.mjs';
import { NUMERIC_STEPPER_CSS } from './numeric-stepper.mjs';
import { createColorPicker } from './color-picker.mjs';
import {
  createScrollbarVisibility,
  normalizeScrollbars,
} from './scrollbars.mjs';
import { installMobileFlow } from './mobile-flow.mjs';
import { createLayerDrag } from './layer-drag.mjs';
import { normalizeAvatarFill } from './avatar-fill.mjs';
import { createInputFitBridge } from './chrome-adapter.mjs';
import { normalizeChromeConfig, DRAWERS, INPUT_ICONS } from './chrome.mjs';
import { sceneWidth, normalizeTextScene } from './text-scene.mjs';
import { normalizeNativeConfig, resolveNativeActions } from './native.mjs';
import {
  footerBaseHeight,
  footerKey,
  normalizeFooterConfig,
} from './footer.mjs';
import { normalizeReasoningConfig } from './reasoning.mjs';
import { createBodyCardEditors } from './body-card-editor.mjs';
import {
  CAPTION_LIMIT,
  captionKey,
  normalizeCaptionConfig,
} from './captions.mjs';
import {
  PAGE_NAMES,
  supportsLayers,
  COMMON_PARTS,
  workbenchMarkup,
  createWorkbench,
  matchingLayers,
  normalizeSelection,
  layerRegion,
  layoutWidths,
  mobileGeometry,
} from './workbench-ui.mjs';
import { newLayer, migrateLayers, clone, LAYER_LIMIT } from './layers.mjs';
import { snapshotDraft } from './draft-snapshot.mjs';
import { assetUrl, builtinAssetGroups } from './catalog.mjs';
import { createBuiltinAssetLibrary } from './builtin-asset-library.mjs';
import { validatePhotos } from './photos.mjs';
import { createLiveAdapter } from './live-adapter.mjs';
import { validateTextItems } from './text-layout.mjs';

await (async () => {
  'use strict';
  if (document.getElementById('orange-theme-lab')) return;
  const schemeStorage = createSchemeStorage();
  const appliedStorage = createSchemeStorage({ key: APPLIED_SCHEME_KEY });
  let workLibrary = null, combinationLibrary = null;
  let appliedSnapshot = null,
    applying = false,
    exiting = false,
    applicationLoadError = null;
  let loadError = null;
  const { fonts, base, templates, field, groups, validate } =
    createSchemeModel();
  let config = validate(structuredClone(templates.blank)),
    saved = null,
    history = [],
    active = false,
    panel,
    selected = 'global',
    selectedLayerId = config.layers[0]?.id,
    photoScope = 'ai',
    statScope = 'ai',
    actionScope = 'ai',
    gestureSelection = null,
    textItemKey = 'name',
    editEpoch = 0,
    cancelCrop = null,
    imageUploadAbort = null,
    uploadFeedback = null,
    libraryPurpose = 'layer',
    libraryTarget = '',
    materialCategory = 'images',
    iconLibraryTab = 'builtin',
    iconTargetKey = 'input:options_button',
    reasoningAnchor = 'reasoning-entry',
    previewChatWidth = 0;
  config = normalizePageHeaders(
    normalizePageConfig(normalizeCommonConfig(config)),
  );
  const assetLibrary = createAssetLibrary();
  const builtinAssets = createBuiltinAssetLibrary();
  const iconLibrary = createIconLibrary();
  let disposeIconLibrary = null,
    disposeFontLibrary = null;
  const fontLibrary = createFontLibrary();
  const host = document.createElement('div');
  host.id = 'orange-theme-lab';
  document.body.append(host);
  installWorkshopEventBoundary(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const imageDisplay = createImageDisplay({
    document,
    selector: 'img[data-layer-id], [data-library-asset] img',
  });
  const blankDraft = snapshotDraft(config);
  const recoverableDraft = () => saved ?? appliedSnapshot ?? blankDraft;
  function sameDraft(a, b) {
    if (a === b) return true;
    if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length &&
      keys.every(key => Object.hasOwn(b, key) && sameDraft(a[key], b[key]));
  }
  const hasUnsavedDraft = () => !sameDraft(config, recoverableDraft());

  const scrollbarVisibility = createScrollbarVisibility({
    document,
    ownShadow: shadow,
  });
  const make = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };
  try {
    const raw = await schemeStorage.load();
    if (raw !== null) {
      saved = validate(rebaseBundledFontLinks(JSON.parse(raw), import.meta.url));
      config = clone(saved);
      selectedLayerId = config.layers[0]?.id;
    }
  } catch (error) {
    loadError = error;
    console.warn('[主题编辑实验] 保存方案未载入', error.message);
  }
  try {
    const raw = await appliedStorage.load();
    if (raw !== null) appliedSnapshot = validate(rebaseBundledFontLinks(JSON.parse(raw), import.meta.url));
  } catch (error) {
    applicationLoadError = error;
    console.warn('[主题工坊] 已应用方案未载入', error.message);
  }
  const decorations = {
    flower:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><g fill="#e5b3b1"><ellipse cx="60" cy="35" rx="15" ry="27"/><ellipse cx="60" cy="35" rx="15" ry="27" transform="rotate(72 60 60)"/><ellipse cx="60" cy="35" rx="15" ry="27" transform="rotate(144 60 60)"/><ellipse cx="60" cy="35" rx="15" ry="27" transform="rotate(216 60 60)"/><ellipse cx="60" cy="35" rx="15" ry="27" transform="rotate(288 60 60)"/></g><circle cx="60" cy="60" r="13" fill="#e9ca81"/></svg>',
    star: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><path d="m60 8 14 34 37 3-28 24 9 36-32-19-32 19 9-36L9 45l37-3z" fill="#e6c480" stroke="#b89355" stroke-width="2"/><path d="m22 8 3 9 9 3-9 3-3 9-3-9-9-3 9-3z" fill="#acb8a0"/></svg>',
    tape: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 48"><path d="m5 3 8 4 6-4 9 4 7-4h126l-3 8 7 8-5 9 5 9-8 8H15l4-7-8-7 6-10-8-7z" fill="#d6c1a1" fill-opacity=".85"/><path d="M20 16h130M20 30h130" stroke="#fff" stroke-opacity=".3" stroke-width="2" stroke-dasharray="3 6"/></svg>',
    leaf: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 180"><path d="M43 172Q22 100 69 10" fill="none" stroke="#718d70" stroke-width="2"/><g fill="#8fa284"><ellipse cx="42" cy="131" rx="11" ry="27" transform="rotate(-40 42 131)"/><ellipse cx="56" cy="104" rx="11" ry="26" transform="rotate(40 56 104)"/><ellipse cx="40" cy="79" rx="10" ry="25" transform="rotate(-35 40 79)"/><ellipse cx="64" cy="52" rx="9" ry="24" transform="rotate(35 64 52)"/><ellipse cx="65" cy="22" rx="8" ry="19" transform="rotate(15 65 22)"/></g></svg>',
  };
  const svgUrl = (svg) =>
    'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  let noticeTimer;
  function notify(text, duration = 4500) {
    const n = shadow.querySelector('#notice');
    const visibleNotice = shadow.querySelector('#visible-notice');
    n.textContent = text;
    visibleNotice.textContent = text;
    clearTimeout(noticeTimer);
    if (duration) {
      noticeTimer = setTimeout(() => {
        n.textContent = '';
        visibleNotice.textContent = '';
      }, duration);
      noticeTimer.unref?.();
    }
  }
  let saveState = saved ? 'saved' : 'draft';
  function syncSaveState() {
    shadow.querySelector('#save').disabled = saveState === 'saving';
    shadow.querySelector('#save-state').textContent = {
      draft: '草稿未保存',
      saving: '正在保存…',
      saved: '已保存方案',
      failed: '未保存',
    }[saveState];
  }
  function setSaveState(state) {
    saveState = state;
    syncSaveState();
  }
  let pendingRegionEdit = null;
  function remember(activateRegion = true) {
    pendingRegionEdit = activateRegion ? { ui: { ...ui }, config } : null;
    if (saveState !== 'saving') setSaveState('draft');
    history.push(snapshotDraft(config));
    if (history.length > 40) history.shift();
  }
  shadow.innerHTML = workbenchMarkup();
  shadow.append(
    make(
      'style',
      '',
      ICON_LIBRARY_CSS +
        '.material-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:10px}.material-card{display:flex;flex-direction:column;gap:6px;align-items:center;text-align:center;padding:8px;min-width:0;font-size:12px}.material-card img{width:100%;height:84px;object-fit:contain}.material-grid[hidden]{display:none}.font-library-card{padding:12px 0;border-bottom:1px solid #d5ded7}.font-library-preview{font-size:22px;margin:10px 0}.font-library-form{padding:12px 0}.font-library-form[hidden]{display:none}' +
        '[data-material-category][aria-pressed=true]{font-weight:700;background:#e7eee9;color:#31493e;border-color:#6f8973}',
    ),
  );
  installLauncherDrag({ launcher: shadow.querySelector('.launcher') });
  const colorPicker = createColorPicker({ document, root: shadow });
  const numericStyle = make('style');
  numericStyle.textContent = NUMERIC_STEPPER_CSS;
  shadow.append(numericStyle);
  let materialSession = null,
    managerReturn = null;
  // A material visit owns only the editing selection, never workspace layout or
  // the native page observed while the picker is open.
  const materialSelection = ({
    page,
    commonPart,
    region,
    kind,
    object,
    mode,
    mobileView,
  }) => ({ page, commonPart, region, kind, object, mode, mobileView });
  const workbench = createWorkbench(shadow, {
      onNavigate: ({ libraryOpened = false, previous } = {}) => {
        invalidateEditing();
        if (libraryOpened) {
          managerReturn = {
            selection:
              materialSession?.selection ||
              managerReturn?.selection ||
              materialSelection(
                previous || { ...ui, mode: 'edit', mobileView: 'adjust' },
              ),
            scroll: shadow.querySelector('.fields').scrollTop,
            inspectorScroll: shadow.querySelector('.inspector').scrollTop,
          };
          materialCategory = 'images';
        } else managerReturn = null;
        materialSession = null;
        libraryPurpose = 'manager';
        libraryTarget = '';
        iconTargetKey = '';
        renderFields();
      },
      onLayout: () => {
        if (active) updateWorkbenchLayout();
      },
    }),
    ui = workbench.ui;
  shadow
    .querySelector('#material-back')
    .addEventListener('click', returnFromMaterials);
  shadow.addEventListener('keydown', (event) => {
    if (
      event.key === 'Escape' &&
      ui.mode === 'library' &&
      !event.defaultPrevented
    ) {
      event.preventDefault();
      event.stopPropagation();
      returnFromMaterials();
    }
  });
  function openMaterialPicker(
    purpose,
    category = 'images',
    target = '',
    onUse = null,
  ) {
    invalidateEditing();
    managerReturn = null;
    materialSession = Object.freeze({
      purpose,
      target,
      onUse,
      nativeActions:
        purpose === 'native-edit-icon' || purpose === 'native-more-icon'
          ? resolveNativeActions(
              config.nativeStyle.actions,
              actionScope === 'user',
            )
          : null,
      selection: Object.freeze(materialSelection(ui)),
      scroll: shadow.querySelector('.fields').scrollTop,
      inspectorScroll: shadow.querySelector('.inspector').scrollTop,
      config,
    });
    libraryPurpose = purpose;
    libraryTarget = target;
    materialCategory = category;
    ui.mode = 'library';
    renderFields();
    shadow.querySelector('.fields').scrollTop = 0;
    shadow.querySelector('.inspector').scrollTop = 0;
  }
  function returnFromMaterials() {
    const session = materialSession || managerReturn;
    invalidateEditing();
    materialSession = null;
    managerReturn = null;
    libraryPurpose = 'manager';
    libraryTarget = '';
    if (session) Object.assign(ui, session.selection);
    else ui.mode = 'edit';
    ui.libraryExpanded = false;
    renderFields();
    if (session) {
      shadow.querySelector('.fields').scrollTop = session.scroll;
      shadow.querySelector('.inspector').scrollTop = session.inspectorScroll;
    }
  }
  const MATERIAL_TARGETS = [
    ['header', '聊天 / 头像区'],
    ['message', '聊天 / 消息整体'],
    ['reasoning-entry', '聊天 / 思维入口'],
    ['reasoning-body', '聊天 / 思维正文'],
    ['footer', '聊天 / 尾部区'],
    ['input', '首页和全局 / 共用输入区'],
  ];
  function targetForRegion() {
    return ui.page === 'home' && ui.region === 'input'
      ? 'input'
      : ui.page === 'chat'
        ? {
            header: 'header',
            overall: 'message',
            reasoning: reasoningAnchor,
            footer: 'footer',
          }[ui.region] || ''
        : '';
  }
  function revealMaterialTarget(region, kind, object) {
    returnFromMaterials();
    if (kind === 'image') {
      ui.kind = kind;
      ui.object = object;
      selectedLayerId = object;
      renderFields();
    }
  }

  panel = shadow.querySelector('.panel');
  const extraStyle = make('style');
  extraStyle.textContent = `.page-art-preview{display:block;width:100%;max-height:112px;object-fit:contain;border:1px solid #dde4dc;border-radius:0;margin-top:10px;background:#f3f4ed}.material-source-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;min-width:0}.material-source-row select{min-width:0;width:100%}.material-source-row button{white-space:nowrap}.material-source-row select{min-height:40px}.material-source-row button{min-height:44px}textarea{font:inherit;font-size:var(--wb-font-body);width:100%;min-height:100px;resize:vertical;border:1px solid #dce3d6;border-radius:0;padding:8px;background:white;color:#344d3e;line-height:1.6}input[aria-invalid=true]{border-color:#b86b63}.layer-list{display:grid;gap:5px;max-height:180px;overflow:auto;margin:12px 0}.layer-list button{display:flex;align-items:center;gap:9px;text-align:left;padding:7px}.layer-list button[aria-pressed=true]{background:#edf3e9;border-color:#7d9a78}.layer-list img{width:34px;height:34px;object-fit:contain;background:#f1eee5;border-radius:0}.layer-list span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.number-input{width:80px;padding:5px;border:1px solid #dce3d6;border-radius:0}.crop-dialog{border:1px solid #dce3d6;border-radius:0;width:min(560px,94vw);max-height:92vh;overflow:auto;padding:22px;color:#31493e;background:#fffdf8;font:14px/1.5 system-ui,sans-serif}.crop-dialog::backdrop{background:#1e302666}.crop-dialog canvas{display:block;max-width:100%;max-height:40vh;object-fit:contain;margin:14px auto;background:repeating-conic-gradient(#eee 0% 25%,white 0% 50%) 50% / 16px 16px}.crop-dialog h3{margin:0 0 6px;font-size:16px;font-weight:600}.crop-dialog .actions{margin-top:16px}.layer-count{font-size:12px;color:#7c8975;margin-top:12px}`;
  shadow.append(extraStyle);
  const nativeFit = createInputFitBridge({
    document,
    load: () =>
      import(
        new URL('../../../RossAscends-mods.js', import.meta.url).href
      ).then((m) => m.autoFitSendTextAreaDebounced),
  });
  const fitInput = () => {
    if (!document.defaultView?.location?.protocol?.startsWith('http')) return;
    return nativeFit();
  };
  const canvas = createLiveCanvas({
    document,
    onPage: (page) => {
      if (active) workbench.syncViewedPage(page);
    },
  });
  const liveAdapter = createLiveAdapter({
    document,
    resolveArtwork: artworkUrl,
    fitInput,
    onRender: ({ nodes = [], chromeChanged = false, pageHeaderNodes = [] }) => {
      if (!active) return;
      updateFontStatuses();
      if (!headerDrag.dragging) headerDrag.refresh(pageHeaderNodes);
      if (!layerDrag.dragging)
        layerDrag.refresh([
          ...nodes,
          ...(chromeChanged
            ? [document.querySelector('#send_form')].filter(Boolean)
            : []),
        ]);
    },
  });
  function previewTextTarget(node) {
    if (ui.page !== 'chat') return null;
    const id = node.dataset.captionId,
      footerId = node.dataset.footerCaptionId,
      key =
        node.dataset.textItem ||
        (node.classList.contains('name_text')
          ? 'name'
          : node.classList.contains('timestamp')
            ? 'time'
            : undefined);
    if (node.classList.contains('otl-live-reasoning'))
      return {
        item: config.reasoningStyle.entry.labelPosition,
        selected: ui.region === 'reasoning' && ui.kind === 'entry',
        percentX: false,
        minX: -500,
        maxX: 500,
        minY: -500,
        maxY: 500,
      };
    if (!id && !footerId && ['name', 'time'].includes(key)) {
      const msg = node.closest('.mes[data-otl-live]'),
        user = msg?.getAttribute('is_user') === 'true',
        value = resolveMetadata(config, user)[key];
      if (value) {
        metadataScope = user ? 'user' : 'ai';
        const pixels=canvasEnabled(config)&&value.region==='header',canvasScale=pixels?headerCanvasScale(config,msg.clientWidth):1;
        const parent =
          value.region === 'body-top'
            ? msg.querySelector('.mes_text')
            : node.closest('.ch_name');
        let width = sceneWidth(msg, config);
        if (value.region === 'body-top' && parent) {
          const rect = parent.getBoundingClientRect(),
            style = document.defaultView?.getComputedStyle?.(parent);
          width = Math.max(
            1,
            rect.width -
              (parseFloat(style?.paddingLeft) || 0) -
              (parseFloat(style?.paddingRight) || 0),
          );
        }
        return {
          item: value,
          canvasScale,percentX:!pixels,minX:pixels?-4000:-100,maxX:pixels?4000:200,
          selected:
            ui.region === 'header' && ui.kind === 'text' && ui.object === key,
          parent,
          width,
          maxY: 1600,
        };
      }
    }
    const item = footerId
      ? config.footerCaptions.find((c) => c.id === footerId && c.visible)
      : id
        ? config.captions.find((c) => c.id === id && c.visible)
        : config.textItems[key];
    if (!item) return null;
    const region = footerId ? 'footer' : 'header',
      object = footerId ? footerKey(footerId) : id ? captionKey(id) : key;
    const parent = node.closest(footerId ? '.otl-footer' : '.ch_name');
    const pixels=canvasEnabled(config)&&!footerId;
    return {
      item,
      selected:
        ui.region === region && ui.kind === 'text' && ui.object === object,
      canvasScale:pixels?headerCanvasScale(config,node.closest('.mes').clientWidth):1,percentX:!pixels,minX:pixels?-4000:-100,
      maxX: pixels?4000:footerId ? 100 : 200,
      maxY: footerId ? 400 : 1600,
      parent,
      width: footerId
        ? parent.clientWidth ||
          parent.getBoundingClientRect().width ||
          Math.max(1, config.cardWidth - (config.cardPadding ?? 24) * 2)
        : sceneWidth(node.closest('.mes[data-otl-live]'), config),
    };
  }
  function previewLayerTarget(node, item) {
    if (canvasEnabled(config)&&['header','avatar'].includes(item.anchor)){const msg=node.closest('.mes'),scale=headerCanvasScale(config,msg.clientWidth),projected=projectHeaderConfig(config,msg.clientWidth);return {canvasScale:scale,maxSize:4000,onPreview:item.anchor==='header'?()=>updateHeaderArtworkClip(node,item,sceneWidth(msg,projected),Math.max(0,(msg.getAttribute('is_user')==='true'?projected.userHeaderHeight??projected.headerHeight:projected.headerHeight)-(projected.cardPadding??24)),projected.cardPadding??24):undefined};}
    if (item.anchor === 'header')
      return {
        onPreview: () =>
          updateHeaderArtworkClip(
            node,
            item,
            sceneWidth(node.closest('.mes[data-otl-live]'), config),
            Math.max(0, (node.closest('.mes')?.getAttribute('is_user')==='true' ? config.userHeaderHeight ?? config.headerHeight : config.headerHeight) - (config.cardPadding ?? 24)),
            config.cardPadding ?? 24,
          ),
      };
    if (item.anchor !== 'footer') return {};
    const root = node.closest('.otl-footer'),
      scene = root.querySelector('.otl-footer-scene'),
      flow = root.querySelector('.otl-footer-flow'),
      width =
        root.clientWidth ||
        root.getBoundingClientRect().width ||
        Math.max(1, config.cardWidth - (config.cardPadding ?? 24) * 2);
    const images = [...scene.querySelectorAll('.otl-footer-image')],
      others = config.layers.filter((l) => l.id !== item.id),
      fixed = footerBaseHeight(
        flow.getBoundingClientRect().height,
        width,
        others,
        images,
      ),
      ratio =
        node.naturalWidth > 0 && node.naturalHeight > 0
          ? node.naturalHeight / node.naturalWidth
          : 1;
    const parentHeightForWidth = (nextWidth, nextHeight, sizing=item.imageSizing) =>
      Math.max(
        fixed,
        item.imageSizing
          ? footerBaseHeight(flow.getBoundingClientRect().height,width,[{...item,width:nextWidth,imageSizing:{...sizing,...(nextHeight===undefined?{}:{height:nextHeight})}}],images)
          : item.kind === 'shape'
          ? item.heightUnit === 'px'
            ? (nextHeight ?? item.height)
            : item.widthUnit === 'percent'
              ? (width * nextWidth) / 100
              : nextWidth
          : (item.widthUnit === 'percent'
              ? (width * nextWidth) / 100
              : nextWidth) * ratio,
      );
    return {
      parent: scene,
      height: parentHeightForWidth(item.width),
      parentHeightForWidth,
    };
  }
  const layerDrag = createLayerDrag({
    document,
    scopeSelector: '.mes[data-otl-live],#send_form',
    selector:
      '.mes[data-otl-live] :is([data-layer-id],.name_text,.timestamp,.otl-live-caption[data-caption-id],[data-footer-caption-id],.otl-live-reasoning),#send_form [data-layer-id]',
    getState: () => ({
      active,
      ...ui,
      page: ui.page === 'home' && ui.region === 'input' ? 'chat' : ui.page,
      layers: config.layers,
      compositionSelectedId: ui.kind==='avatar'?selectedLayerId:null,
      regionFor: layerRegion,
    }),
    getTextTarget: previewTextTarget,
    getLayerTarget: previewLayerTarget,
    onCommit: (item, next) => {
      remember();
      Object.assign(item, next);
      apply();
      renderFields();
      notify('位置或大小已更新，尚未保存');
    },
  });
  const applyButton = make('button', 'primary', '应用到酒馆');
  applyButton.type = 'button';
  applyButton.id = 'apply-live';
  shadow.querySelector('#save').after(applyButton);
  applyButton.addEventListener('click', async () => {
    if (applying || exiting || saveState === 'saving') return;
    applying = true;
    applyButton.disabled = true;
    try {
      const draftAtApply = snapshotDraft(config);
      const snapshot = validate(draftAtApply);
      await appliedStorage.save(JSON.stringify(snapshot));
      appliedSnapshot = snapshot;
      const newerDraft = !sameDraft(config, draftAtApply);
      if (!newerDraft) resetDraftTo(recoverableDraft());
      await close({ keepApplied: true });
      if (newerDraft) notify('已应用点击时的方案，之后的修改仍保留为未保存草稿。');
      entries.setApplied(true);
      entries.sync();
    } catch (error) {
      notify('应用失败：' + error.message);
    } finally {
      applying = false;
      applyButton.disabled = false;
    }
  });
  async function clearApplied() {
    if (appliedSnapshot === null && !applicationLoadError) return true;
    try {
      await appliedStorage.clear();
      appliedSnapshot = null;
      applicationLoadError = null;
      return true;
    } catch (error) {
      notify('停用美化失败：' + error.message);
      return false;
    }
  }
  async function stopApplied() {
    if (active) return requestExit(true);
    if (exiting || applying) return;
    exiting = true;
    try {
      const keepDraft = !!saved || hasUnsavedDraft();
      if (!(await clearApplied())) return;
      if (!keepDraft) resetDraftTo(recoverableDraft());
      liveAdapter.stop();
      entries.setApplied(false);
    } finally {
      exiting = false;
    }
  }

  const headerDrag = createLayerDrag({
    document,
    scopeSelector: '[data-otl-header-scene]',
    selector: '[data-otl-header-layer]',
    getState: () => ({ active, ...ui }),
    resolveTarget: (node, state) => {
      if (
        state.region !== 'page-header' ||
        node
          .closest('[data-otl-header-scene]')
          ?.getAttribute('data-otl-header-scene') !== state.page
      )
        return null;
      const [type, id] = node.getAttribute('data-otl-header-layer').split(':'),
        scene = config.pageHeaders[state.page]?.scene,
        item = (type === 'image' ? scene?.images : scene?.texts)?.find(
          (item) => item.id === id && item.visible,
        );
      if (!item) return null;
      const parent = node.closest('[data-otl-header-scene]');
      return {
        item,
        image: type === 'image',
        selected:
          state.kind === (type === 'image' ? 'scene-images' : 'scene-texts') &&
          state.object === id,
        parent,
        width: parent.clientWidth || parent.getBoundingClientRect().width,
        height: parent.clientHeight || parent.getBoundingClientRect().height,
      };
    },
    onCommit: (item, next) => {
      remember();
      Object.assign(item, next);
      apply();
      renderFields();
      notify('位置或大小已更新，尚未保存');
    },
  });
  window.addEventListener('pagehide', () => {
    close({ keepApplied: true });
    invalidateEditing();
    scrollbarVisibility.stop();
    liveAdapter.stop();
  });
  const builtinLibrary = createBuiltinTemplateLibrary({
    document,
    availableIds: Object.keys(templates),
    getCurrent: () => config.template,
    onMessage: notify,
  });
  function updateWorkbenchLayout() {
    layerDrag.cancel();
    headerDrag.cancel();
    const win = document.defaultView,
      vv = win?.visualViewport,
      mobile = (win?.innerWidth || 1200) <= 700,
      compact = mobile && !!vv && vv.height < (win?.innerHeight || 800) * 0.75;
    if (shadow.host.dataset.wbCompact !== String(compact))
      shadow.host.dataset.wbCompact = String(compact);
    const setProperty = (name, value) => {
      if (shadow.host.style.getPropertyValue(name) !== value)
        shadow.host.style.setProperty(name, value);
    };
    const collapsed = ui.toolbarCollapsed;
    const barTop = mobile
      ? parseFloat(
          win?.getComputedStyle?.(shadow.querySelector('.bar'))?.top,
        ) ||
        vv?.offsetTop ||
        0
      : 0;
    const barBottom = collapsed
      ? 0
      : shadow.querySelector('.bar').getBoundingClientRect?.().bottom ||
        (mobile ? barTop + 52 : 104);
    setProperty('--wb-mobile-tools-top', barBottom + 4 + 'px');
    const toolsBottom = barBottom;
    const safeBottom =
      parseFloat(
        win
          ?.getComputedStyle?.(shadow.host)
          ?.getPropertyValue('--wb-safe-bottom'),
      ) || 0;
    const mobileTop = barBottom + 6;
    const geom = mobileGeometry(
      vv?.height || win?.innerHeight || 800,
      mobileTop - (vv?.offsetTop || 0),
      ui.mode === 'library' || ui.mobileView !== 'preview',
      vv?.offsetTop || 0,
      compact,
      safeBottom,
      {
        share: ui.mobileSplit,
        fullscreen: ui.libraryExpanded,
        editing: ui.layoutEditing,
      },
    );
    setProperty('--wb-mobile-sheet', geom.sheet + 'px');
    workbench.setMobileGeometry(geom);
    const right =
      (ui.mobileView === 'preview' && ui.mode !== 'library'
        ? 0
        : layoutWidths(document.defaultView?.innerWidth || 1200, ui.split)
            .previewRight) + 'px';
    if (!active) return;
    const frame = previewFrameGeometry(
      previewChatWidth,
      win?.innerWidth || 1200,
      parseFloat(right),
      ui.narrow,
    );
    canvas.layout({
      left: frame.left,
      width: frame.width,
      top: mobile ? geom.top : toolsBottom + 6,
      height: mobile
        ? geom.height
        : Math.max(100, (win?.innerHeight || 800) - toolsBottom - 24),
      hidden: ui.libraryExpanded,
      preserveTopbar: collapsed,
    });
    liveAdapter.syncIsland();
  }

  function beginUploadFeedback(source, target, files) {
    uploadFeedback = {
      source,
      target,
      rows: files.map((f) => ({
        name: f.name,
        size: f.size,
        status: '等待处理',
        busy: true,
      })),
      added: [],
    };
    refreshUploadFeedback();
    return uploadFeedback;
  }
  function feedbackStatus(report, index, status, busy = false) {
    if (uploadFeedback !== report) return;
    Object.assign(report.rows[index], { status, busy });
    refreshUploadFeedback();
  }
  function attachUploadFeedback(container, context) {
    const status = make('div', 'upload-feedback');
    status.dataset.uploadFeedback = context;
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    container.append(status);
    refreshUploadFeedback();
  }
  function refreshUploadFeedback() {
    for (const node of shadow.querySelectorAll('[data-upload-feedback]')) {
      node.replaceChildren();
      const report = uploadFeedback;
      if (!report) continue;
      const context = node.dataset.uploadFeedback;
      if (context.startsWith('result:')) {
        if (
          report.source === 'library' &&
          report.added.includes(context.slice(7))
        )
          node.append(
            make(
              'p',
              '',
              `本次已添加 ${report.added.length} 张图片；完整结果见素材库上传处。`,
            ),
          );
      } else if (context === report.source + ':' + report.target) {
        for (const row of report.rows) {
          const size = Number.isFinite(row.size)
            ? `（${(row.size / 1048576).toFixed(2)} MiB）`
            : '';
          node.append(make('p', '', row.name + size + '：' + row.status));
        }
      }
      if (node.childNodes.length && node.isConnected) {
        const fields = node.closest('.fields'),
          box = fields?.getBoundingClientRect(),
          rect = node.getBoundingClientRect();
        if (box && rect.bottom > box.bottom)
          fields.scrollTop += rect.bottom - box.bottom + 8;
      }
    }
  }
  function uploadFailure(error) {
    return error?.code === 'IMAGE_INPUT'
      ? error.message
      : error?.message === '图片像素过大'
        ? '图片超过 4000 万像素，请选择较小图片。'
        : '读取或裁剪失败，原图未改变，请重新选择。';
  }
  function addReselect(container, input) {
    const button = make('button', '', '重新选择文件');
    button.type = 'button';
    button.addEventListener('click', () => input.click());
    container.append(button);
  }
  function invalidateEditing() {
    disposeIconLibrary?.();
    disposeIconLibrary = null;
    disposeFontLibrary?.();
    disposeFontLibrary = null;
    imageUploadAbort?.abort();
    imageUploadAbort = null;
    colorPicker.cancel();
    layerDrag?.cancel();
    headerDrag?.cancel();
    editEpoch++;
    if (uploadFeedback)
      for (const row of uploadFeedback.rows)
        if (row.busy) {
          row.status = '已取消，编辑对象或会话已改变。';
          row.busy = false;
        }
    refreshUploadFeedback();
    cancelCrop?.();
    cancelCrop = null;
  }
  function currentTargetValid(epoch, original, target) {
    return (
      active &&
      editEpoch === epoch &&
      config === original &&
      (config.layers.includes(target) ||
        Object.values(config.photos).includes(target))
    );
  }
  const {
    numericRow,
    colorRow,
    pairedFields,
    editorControl,
    renderConfigFields,
    propertyHeading,
  } = createPropertyControls({
    make,
    remember,
    getUi: () => ui,
    getConfig: () => config,
    getPhotoScope: () => photoScope,
    apply,
    notify,
    getEditEpoch: () => editEpoch,
    colorPicker,
    isActive: () => active,
    liveAdapter,
    groups,
  });
  const { renderPhotoFields, renderHeaderHeightFields, selectCompositionLayer } = createAvatarEditor({
    make,
    getConfig: () => config,
    renderCompositionLayer: container => renderLayers(container,{composition:true}),
    getSelectedLayerId: () => selectedLayerId,
    setSelectedLayerId: value => {selectedLayerId=value;},
    openCompositionPicker: scope => openMaterialPicker('avatar-composition','images','',source=>{
      if(config.layers.length>=LAYER_LIMIT)throw Error(`最多放置 ${LAYER_LIMIT} 层素材`);
      const layer=newLayer(source.shape?'shape':source.asset?'asset':'custom',{name:source.name,asset:source.asset||'',image:source.image||'',...(source.shape?{shape:source.shape}:{}),opacity:1,anchor:'avatar',scope:config.avatarDesign==='unified'?'both':scope,width:100,x:0,y:0,side:'left',vertical:'top'});
      config.layers.push(layer);selectedLayerId=layer.id;
    }),
    getEditEpoch:()=>editEpoch,
    isActive:()=>active,
    getNotice:()=>shadow.querySelector('#notice').textContent,
    validate,
    notify,
    remember,
    getPhotoScope: () => photoScope,
    apply,
    renderFields,
    setPhotoScope: (value) => {
      photoScope = value;
    },
    getUi: () => ui,
    propertyHeading,
    editorControl,
    field,
  });
  function artworkUrl(layer) {
    return layer.kind === 'shape'
      ? shapeDataUrl(layer)
      : layer.kind === 'asset'
        ? assetUrl(layer.asset)
        : layer.kind === 'custom'
          ? layer.image
          : decorations[layer.kind]
            ? svgUrl(decorations[layer.kind])
            : '';
  }
  function renderFontShelf(container) {
    const session = materialSession;
    disposeFontLibrary = renderFontLibrary(container, {
      library: fontLibrary,
      onError: notify,
      onUse: session?.onUse
        ? (record) => {
            if (materialSession !== session || config !== session.config)
              return;
            session.onUse(record);
            returnFromMaterials();
          }
        : undefined,
    });
  }
  function fontPickerButton(container, item, commit) {
    const button = make('button', '', '从字体库选择');
    button.type = 'button';
    button.addEventListener('click', () =>
      openMaterialPicker('font', 'fonts', '', (record) => {
        commit(record);
      }),
    );
    container.append(button);
  }
  const { seedIconStyle, renderMaterialControl, renderIconAppearance } =
    createIconControlsEditor({
      getConfig: () => config,
      make,
      openMaterialPicker,
      invalidateEditing,
      remember,
      apply,
      renderFields,
      notify,
      propertyHeading,
      editorControl,
      field,
    });
  function renderIconShelf(container, chromeTarget, nativeTarget) {
    const purpose = libraryPurpose,
      choices = [
        ...DRAWERS.map(([id, name]) => ['topbar:' + id, '顶栏 · ' + name]),
        ...INPUT_ICONS.map(([id, name]) => ['input:' + id, '输入区 · ' + name]),
        ['native:more', '消息 · 更多'],
        ['native:edit', '消息 · 编辑'],
      ];
    let key = chromeTarget
      ? purpose.slice(7)
      : nativeTarget
        ? 'native:' + (purpose === 'native-more-icon' ? 'more' : 'edit')
        : iconTargetKey;
    if (!choices.some(([id]) => id === key)) key = '';
    const shelf = make('div');
    container.append(shelf);
    disposeIconLibrary = renderIconLibrary(shelf, {
      library: iconLibrary,
      tab: iconLibraryTab,
      onTab: (tab) => {
        invalidateEditing();
        iconLibraryTab = tab;
        renderFields();
      },
      isCurrent: () =>
        active &&
        shelf.isConnected &&
        ui.mode === 'library' &&
        libraryPurpose === purpose &&
        materialCategory === 'icons',
      onError: (error) => notify(error.message || String(error)),
      onUse: materialSession
        ? (source) => {
            if (
              !active ||
              !materialSession ||
              materialSession.config !== config ||
              !shelf.isConnected ||
              libraryPurpose !== purpose
            )
              return;
            if (!key) {
              notify('请先选择应用图标的按钮。');
              return;
            }
            const [zone, id] = key.split(':'),
              target =
                zone === 'native'
                  ? (materialSession.nativeActions ||
                      resolveNativeActions(
                        config.nativeStyle.actions,
                        actionScope === 'user',
                      ))[id]
                  : config.chromeStyle[zone]?.icons[id];
            if (!target) return;
            invalidateEditing();
            remember();
            seedIconStyle(target);
            target.mode = 'icon';
            target.icon = source.icon || '';
            target.tint = source.tint;
            if (zone === 'native') {
              target.source = source.image
                ? { kind: 'custom', asset: '', image: source.image }
                : null;
            } else {
              target.asset = '';
              target.image = source.image || '';
            }
            if (zone !== 'native') config.chromeStyle[zone].enabled = true;
            libraryPurpose = 'layer';
            apply();
            revealMaterialTarget(
              zone,
              zone === 'native'
                ? 'actions'
                : zone === 'topbar'
                  ? 'icons'
                  : 'tools',
              zone === 'native' ? 'actions' : id,
            );
            notify(
              '已更新图标',
            );
          }
        : undefined,
    });
  }
  function renderSourceLibrary(container, chromeTarget = null) {
    if (!chromeTarget && libraryPurpose.startsWith('chrome:'))
      return renderChromeSourceLibrary(container);
    const isPageBackground = [
        'avatar-composition',
        'canvas-wallpaper',
        'page-background',
        'page-header',
        'page-scene',
      ].includes(libraryPurpose),
      isBackground = libraryPurpose === 'reasoning-background',
      isMoreIcon = libraryPurpose === 'native-more-icon',
      isEditIcon = libraryPurpose === 'native-edit-icon' || isMoreIcon,
      isSourceTarget =
        !!chromeTarget || isBackground || isEditIcon || isPageBackground,
      backgroundTarget = isEditIcon
        ? (materialSession?.nativeActions ||
            resolveNativeActions(
              config.nativeStyle.actions,
              actionScope === 'user',
            ))[isMoreIcon ? 'more' : 'edit']
        : config.reasoningStyle.entry.background,
      targetGroup = isEditIcon ? 'native' : 'reasoning',
      purpose = libraryPurpose,
      session = materialSession;
    const categories = make('div', 'actions material-categories');
    categories.setAttribute('aria-label', '素材类型');
    for (const [id, label] of [
      ['images', '图片'],
      ['shapes', '图形'],
      ['icons', '图标'],
      ['fonts', '字体'],
    ]) {
      const button = make('button', '', label);
      button.type = 'button';
      button.dataset.materialCategory = id;
      button.setAttribute('aria-pressed', String(materialCategory === id));
      button.disabled =
        !!materialSession &&
        (libraryPurpose === 'font'
          ? id !== 'fonts'
          : ['layer', 'page-scene'].includes(libraryPurpose)
            ? !['images', 'shapes'].includes(id)
            : id === 'shapes' ||
              id === 'fonts' ||
              ((isBackground || isPageBackground) && id === 'icons'));
      if (button.disabled) continue;
      button.addEventListener('click', () => {
        invalidateEditing();
        materialCategory = id;
        renderFields();
      });
      categories.append(button);
    }
    shadow.querySelector('#library-expand').before(categories);
    if (materialCategory === 'fonts') {
      renderFontShelf(container);
      return;
    }

    if (materialCategory === 'icons') {
      renderIconShelf(
        container,
        chromeTarget,
        isEditIcon ? backgroundTarget : null,
      );
      return;
    }
    const anchor = () =>
      session && MATERIAL_TARGETS.some(([id]) => id === session.target)
        ? session.target
        : '';
    function useSource(source) {
      if (
        !active ||
        !session ||
        materialSession !== session ||
        session.config !== config ||
        libraryPurpose !== purpose
      )
        return;
      if (!isSourceTarget && !anchor()) {
        notify('请先选择素材要放入的区域。');
        return;
      }
      if (!isSourceTarget && config.layers.length >= LAYER_LIMIT) {
        notify(`最多放置 ${LAYER_LIMIT} 层素材；素材库可继续保存图片。`);
        return;
      }
      invalidateEditing();
      remember();
      if (isPageBackground) {
        session.onUse?.(source);
        const chosen =
          purpose === 'page-scene'
            ? { kind: ui.kind, object: ui.object }
            : null;
        apply();
        returnFromMaterials();
        if (chosen) {
          Object.assign(ui, chosen);
          renderFields();
        }
      } else if (chromeTarget) {
        Object.assign(chromeTarget, {
          mode: 'image',
          asset: source.asset || '',
          image: source.image || '',
          icon: '',
        });
        apply();
        returnFromMaterials();
      } else if (isSourceTarget) {
        backgroundTarget.source = {
          kind: source.asset ? 'asset' : 'custom',
          asset: source.asset || '',
          image: source.image || '',
        };
        backgroundTarget.mode = 'image';
        if (isEditIcon) backgroundTarget.icon = '';
        apply();
        returnFromMaterials();
      } else {
        const layer = newLayer(
          source.shape ? 'shape' : source.asset ? 'asset' : 'custom',
          {
            name: source.name,
            asset: source.asset || '',
            image: source.image || '',
            ...(source.shape ? { shape: source.shape } : {}),
            opacity: 1,
            anchor: anchor(),
          },
        );
        config.layers.push(layer);
        selectedLayerId = layer.id;
        apply();
        revealMaterialTarget(layerRegion(layer), 'image', layer.id);
      }
      notify('已添加，尚未保存');
    }
    if (materialCategory === 'shapes') {
      const shapes = make('div', 'material-grid');
      for (const [shape, name] of Object.entries(SHAPE_NAMES)) {
        const card = make(materialSession ? 'button' : 'div', 'material-card'),
          preview = make('img');
        preview.src = shapeDataUrl(newLayer('shape', { shape }));
        preview.alt = name;
        card.dataset.addShape = shape;
        card.append(preview, make('span', '', name));
        if (materialSession) {
          card.type = 'button';
          card.disabled =
            libraryPurpose === 'page-scene'
              ? config.pageHeaders[ui.page].scene.images.length >= LAYER_LIMIT
              : !anchor() || config.layers.length >= LAYER_LIMIT;
          card.addEventListener('click', () => useSource({ shape, name }));
        }
        shapes.append(card);
      }
      container.append(shapes);
      return;
    }
    const filters = make('div', 'actions material-filters'),
      builtin = make('div', 'material-grid'),
      mine = make('div');
    for (const [id, title] of [
      ['builtin', '内置'],
      ['mine', '我的'],
    ]) {
      const tab = make('button', '', title);
      tab.type = 'button';
      tab.dataset.imageFilter = id;
      tab.setAttribute('aria-pressed', String(id === 'builtin'));
      tab.addEventListener('click', () => {
        builtin.hidden = id !== 'builtin';
        mine.hidden = id !== 'mine';
        for (const t of filters.children)
          t.setAttribute('aria-pressed', String(t === tab));
      });
      filters.append(tab);
    }
    container.append(filters, builtin, mine);
    mine.hidden = true;
    const builtinStatus = make('p', 'hint');
    builtinStatus.dataset.builtinAssetStatus = '';
    builtinStatus.setAttribute('role', 'status');
    container.insertBefore(builtinStatus, mine);
    function renderBuiltinAssets() {
      let groups;
      try { groups = builtinAssets.visible(builtinAssetGroups()); }
      catch (error) {
        builtinStatus.textContent = '内置素材列表未能读取，请重试。';
        return;
      }
      builtin.replaceChildren();
      for (const group of groups)
        for (const asset of group.assets) {
          const entry = make('div'),
            card = make(materialSession ? 'button' : 'div', 'material-card'),
            preview = make('img');
          entry.style.minWidth = '0';
          card.style.width = '100%';
          card.dataset.builtinAsset = asset.id;
          preview.src = assetUrl(asset.id);
          preview.alt = '';
          preview.loading = 'lazy';
          card.append(preview, make('span', '', asset.name));
          if (materialSession) {
            card.type = 'button';
            card.setAttribute('aria-label', '使用素材：' + asset.name);
            card.addEventListener('click', () => {
              if (card.isConnected) useSource({ asset: asset.id, name: asset.name });
            });
          }
          const remove = make('button', '', '删除');
          remove.type = 'button';
          remove.dataset.removeBuiltinAsset = asset.id;
          remove.setAttribute('aria-label', '从素材库删除：' + asset.name);
          remove.addEventListener('click', () => {
            if (!visible() || !entry.isConnected || remove.disabled) return;
            if (!window.confirm(`从素材库删除“${asset.name}”？已放入作品的图片不受影响。`)) return;
            remove.disabled = true;
            try {
              builtinAssets.remove(asset.id);
              builtinStatus.textContent = `已删除“${asset.name}”`;
              renderBuiltinAssets();
            } catch (error) {
              builtinStatus.textContent = `未删除“${asset.name}”：列表未保存，请重试。`;
              remove.disabled = false;
            }
          });
          entry.append(card, remove);
          builtin.append(entry);
        }
      if (!builtin.children.length) builtin.append(make('p', 'hint', '暂无内置素材'));
    }
    renderBuiltinAssets();
    const imports = make('div', 'material-import'),
      add = make('button', '', '添加图片');
    imports.hidden = true;
    add.type = 'button';
    add.setAttribute('aria-expanded', 'false');
    add.addEventListener('click', () => {
      imports.hidden = !imports.hidden;
      add.setAttribute('aria-expanded', String(!imports.hidden));
    });
    mine.append(add, imports);

    const uploadLabel = make('label', 'field', '上传图片到素材库'),
      upload = make('input');
    upload.type = 'file';
    upload.multiple = true;
    upload.accept = 'image/png,image/apng,image/jpeg,image/webp,image/gif';
    upload.setAttribute(
      'aria-label',
      chromeTarget ? '上传按钮图片' : '上传装饰图片',
    );
    uploadLabel.append(
      make('p', 'hint', 'PNG、JPG、WebP、GIF；最大 16 MiB、1600 万像素。'),
      upload,
    );
    imports.append(uploadLabel);
    addReselect(uploadLabel, upload);
    const feedbackSource = chromeTarget ? 'chrome' : 'library',
      feedbackTarget = chromeTarget ? purpose.slice(7) : '';
    attachUploadFeedback(uploadLabel, feedbackSource + ':' + feedbackTarget);

    const urlLabel = make('label', 'field', 'HTTP(S) 图片链接'),
      urlInput = make('input');
    urlInput.type = 'url';
    urlInput.placeholder = 'https://example.com/image.png';
    urlInput.setAttribute('aria-label', '图片链接');
    urlInput.autocomplete = 'off';
    const saveUrl = make('button', '', '保存链接到素材库');
    saveUrl.type = 'button';
    urlLabel.append(urlInput, saveUrl);
    imports.append(urlLabel, make('p', 'hint', '链接图片依赖来源网站可用。'));
    const status = make('p', 'hint');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.dataset.assetLibraryStatus = '';
    container.append(status);
    const list = make('div', 'asset-library-list');
    list.dataset.assetLibraryList = '';
    mine.append(list);
    let listVersion = 0;
    const visible = () =>
      active &&
      list.isConnected &&
      ui.mode === 'library' &&
      libraryPurpose === purpose;
    async function refreshLibrary() {
      const version = ++listVersion;
      list.textContent = '正在读取素材库…';
      try {
        const records = await assetLibrary.list();
        if (!visible() || version !== listVersion) return;
        list.replaceChildren();
        if (!records.length)
          list.append(
            make('p', 'hint', '暂无图片，点击“添加图片”上传或粘贴链接。'),
          );
        for (const record of records) {
          const card = make('div', 'asset-library-card');
          card.dataset.libraryAsset = record.id;
          Object.assign(card.style, {
            display: 'grid',
            gridTemplateColumns: '52px minmax(0,1fr)',
            gap: '8px',
            padding: '10px',
            border: '1px solid #d5ded7',
            borderRadius: '10px',
            marginBottom: '8px',
          });
          const preview = make('img');
          preview.src = record.image;
          preview.alt = record.name;
          preview.loading = 'lazy';
          preview.referrerPolicy = 'no-referrer';
          Object.assign(preview.style, {
            width: '52px',
            height: '52px',
            objectFit: 'contain',
          });
          const detail = make('div'),
            name = make('p', '', record.name),
            source = make(
              'small',
              '',
              record.kind === 'url' ? '链接素材' : '已保存在本浏览器',
            );
          Object.assign(name.style, {
            margin: '0 0 4px',
            overflowWrap: 'anywhere',
          });
          const use = make('button', '', '使用素材');
          use.type = 'button';
          use.setAttribute('aria-label', '使用素材：' + record.name);
          use.disabled =
            !isSourceTarget &&
            (!anchor() || config.layers.length >= LAYER_LIMIT);
          use.addEventListener('click', () => useSource(record));
          preview.addEventListener('error', () => {
            source.textContent =
              record.kind === 'url'
                ? '图片加载失败，请检查链接或来源网站限制。'
                : '图片无法预览，请重新上传。';
          });
          const remove = make('button', '', '从素材库删除');
          remove.type = 'button';
          remove.setAttribute('aria-label', '从素材库删除：' + record.name);
          remove.addEventListener('click', async () => {
            if (remove.disabled || !visible() || !card.isConnected) return;
            if (
              !window.confirm(
                `从素材库删除“${record.name}”？已放入方案的图片不受影响；库中原图删除后无法撤销。`,
              )
            )
              return;
            remove.disabled = true;
            status.textContent = '正在删除素材…';
            try {
              await assetLibrary.remove(record.id);
              if (visible()) {
                status.textContent = `已从素材库删除“${record.name}”，方案中的图片未改变。`;
                await refreshLibrary();
              }
            } catch (error) {
              if (visible())
                status.textContent = `未删除“${record.name}”：素材库删除失败，请重试。`;
            } finally {
              remove.disabled = false;
            }
          });
          const actions = make('div', 'actions');
          if (materialSession) actions.append(use);
          actions.append(remove);
          detail.append(name, source, actions);
          card.append(preview, detail);
          list.append(card);
        }
      } catch (error) {
        if (visible() && version === listVersion) {
          list.replaceChildren(make('p', 'hint', error.message));
          const retry = make('button', '', '重试读取素材库');
          retry.type = 'button';
          retry.addEventListener('click', refreshLibrary);
          list.append(retry);
        }
      }
    }
    saveUrl.addEventListener('click', async () => {
      if (saveUrl.disabled) return;
      let image;
      try {
        image = normalizeImageUrl(urlInput.value);
        urlInput.removeAttribute('aria-invalid');
      } catch (error) {
        urlInput.setAttribute('aria-invalid', 'true');
        status.textContent = error.message;
        return;
      }
      saveUrl.disabled = true;
      status.textContent = '正在保存链接…';
      try {
        const parsed = new URL(image),
          last = parsed.pathname.split('/').filter(Boolean).pop();
        await assetLibrary.add({
          name: (last || parsed.hostname).slice(0, 80),
          image,
        });
        if (visible()) {
          status.textContent = '链接已保存';
          urlInput.value = '';
          await refreshLibrary();
        }
      } catch (error) {
        if (visible()) status.textContent = error.message;
      } finally {
        saveUrl.disabled = false;
      }
    });
    upload.addEventListener('change', async () => {
      const files = [...upload.files];
      if (!files.length) return;
      upload.value = '';
      invalidateEditing();
      imageUploadAbort = new AbortController();
      const signal = imageUploadAbort.signal,
        epoch = editEpoch,
        report = beginUploadFeedback(feedbackSource, feedbackTarget, files),
        valid = () =>
          visible() && epoch === editEpoch && uploadFeedback === report;
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        if (!valid()) break;
        try {
          feedbackStatus(report, index, '读取与自动优化中…', true);
          const result = await prepareImageUpload(file, { valid, signal });
          if (!result || !valid()) break;
          feedbackStatus(report, index, '正在存入素材库…', true);
          const record = await assetLibrary.add({
            name: file.name.slice(0, 80) || '我的图片',
            image: result.image,
          });
          if (!valid()) break;
          report.added.push(record.id);
          const detail = result.optimized
            ? `已优化为 ${(result.bytes / 1024).toFixed(0)} KiB，尺寸不变；`
            : result.animated
              ? '已保留动画原素材；'
              : '已保留原素材；';
          feedbackStatus(report, index, detail + '已存入素材库');
        } catch (error) {
          if (valid())
            feedbackStatus(
              report,
              index,
              error.code ? error.message : uploadFailure(error),
            );
        }
      }
      if (valid() && report.added.length) {
        await refreshLibrary();
        if (valid())
          notify(`已存入 ${report.added.length} 张图片，当前方案尚未改变。`);
      }
    });
    refreshLibrary();
  }
  const { renderLayers, renderRegionLayers, cropImage } = createLayerEditor({
    getConfig: () => config,
    getSelectedLayerId: () => selectedLayerId,
    make,
    propertyHeading,
    remember,
    setSelectedLayerId: (value) => {
      selectedLayerId = value;
    },
    apply,
    renderFields,
    invalidateEditing,
    getUi: () => ui,
    workbench,
    notify,
    getEditEpoch: () => editEpoch,
    beginUploadFeedback,
    currentTargetValid,
    getUploadFeedback: () => uploadFeedback,
    feedbackStatus,
    uploadFailure,
    attachUploadFeedback,
    editorControl,
    field,
    pairedFields,
    numericRow,
    isActive: () => active,
    getCancelCrop: () => cancelCrop,
    setCancelCrop: (value) => {
      cancelCrop = value;
    },
    shadow,
    getPhotoScope: () => photoScope,
    setTextItemKey: (value) => {
      textItemKey = value;
    },
    setConfig: (value) => {
      config = value;
    },
  });
  const { renderFontLinkFields, updateFontStatuses } = createFontFieldsEditor({
    pairedFields,
    make,
    getUi: () => ui,
    remember,
    apply,
    notify,
    fontPickerButton,
    liveAdapter,
    shadow,
  });
  let metadataScope = 'ai';
  const {
    selectedCaption,
    currentCaptions,
    currentCaptionKey,
    currentNewCaption,
    renderTextFields,
    renderCaptionMetrics,
  } = createTextEditor({
    getUi: () => ui,
    getConfig: () => config,
    make,
    remember,
    apply,
    renderFields,
    editorControl,
    field,
    propertyHeading,
    getMetadataScope: () => metadataScope,
    setMetadataScope: (value) => {
      metadataScope = value;
    },
    fonts,
    renderFontLinkFields,
    getTextItemKey: () => textItemKey,
    pairedFields,
    renderConfigFields,
    setTextItemKey: (value) => {
      textItemKey = value;
    },
    invalidateEditing,
  });
  const {renderGlassFields}=createGlassEditor({getConfig:()=>config,make,field,editorControl,propertyHeading,remember,apply,renderFields,notify});
  const { renderCommonFields, renderPageFields } = createPageAppearanceEditor({
    renderGlassFields,
    getUi: () => ui,
    make,
    workbench,
    getConfig: () => config,
    editorControl,
    field,
    fonts,
    propertyHeading,
    renderFontLinkFields,
    openMaterialPicker,
    remember,
    apply,
    renderFields,
    pairedFields,
    notify,
  });
  const { renderPageHeaderFields } = createPageHeaderEditor({
    getConfig: () => config,
    getUi: () => ui,
    editorControl,
    field,
    make,
    remember,
    apply,
    renderFields,
    renderFontLinkFields,
    openMaterialPicker,
    invalidateEditing,
    renderCaptionMetrics,
    propertyHeading,
    notify,
    pairedFields,
  });
  const { renderReasoningFields } = createReasoningEditor({
    getConfig: () => config,
    editorControl,
    make,
    remember,
    apply,
    renderFields,
    field,
    propertyHeading,
    pairedFields,
    fonts,
    fontPickerButton,
    notify,
    liveAdapter,
    updateFontStatuses,
    openMaterialPicker,
  });
  const { renderNativeFields } = createNativeControlsEditor({
    getConfig: () => config,
    getUi: () => ui,
    getActionScope: () => actionScope,
    setActionScope: (value) => {
      actionScope = value;
    },
    getStatScope: () => statScope,
    setStatScope: (value) => {
      statScope = value;
    },
    editorControl,
    field,
    make,
    remember,
    apply,
    renderFields,
    propertyHeading,
    renderMaterialControl,
    renderIconAppearance,
    fonts,
    renderFontLinkFields,
  });
  const { renderBodySettings, renderCardBorderSettings } =
    createBodyCardEditors({
      getConfig: () => config,
      make,
      field,
      propertyHeading,
      pairedFields,
      editorControl,
      renderConfigFields,
      renderFontLinkFields,
      remember,
      apply,
      renderFields,
    });
  const { renderChromeFields } = createChromeEditor({
    resetIslandPosition: liveAdapter.resetIslandPosition,
    renderGlassFields,
    getConfig: () => config,
    getUi: () => ui,
    propertyHeading,
    editorControl,
    field,
    renderFields,
    make,
    fonts,
    renderFontLinkFields,
    remember,
    apply,
    notify,
    renderMaterialControl,
    renderIconAppearance,
  });
  function renderChromeSourceLibrary(container) {
    const [, zone, id] = libraryPurpose.split(':'),
      target = config.chromeStyle[zone]?.icons[id];
    if (!target) {
      libraryPurpose = 'layer';
      return renderFields();
    }
    return renderSourceLibrary(container, target);
  }

  function renderFields(group, { fromPreview = false } = {}) {
    combinationLibrary?.hide({ focus: false });
    headerDrag.cancel();
    queueMicrotask(() => {
      if (active) headerDrag.refresh();
      else headerDrag.reset();
    });
    if (group) {
      ui.mode = 'edit';
      ui.page = 'chat';
      if (group === 'decoration') {
        const layer = config.layers.find((l) => l.id === selectedLayerId);
        if(layer?.anchor==='avatar'&&(fromPreview||ui.kind==='avatar')){selectCompositionLayer(layer.id);workbench.choose('header','avatar','photo-'+photoScope);}
        else workbench.choose(layerRegion(layer), 'image', layer?.id || '');
      } else if (group === 'photo')
        workbench.choose('header', 'avatar', 'photo-' + photoScope);
      else if (group === 'caption')
        workbench.choose(
          'header',
          'text',
          config.captions[0] ? captionKey(config.captions[0].id) : 'name',
        );
      else if (group === 'text')
        workbench.choose('header', 'text', textItemKey);
      else if (group === 'footer-text')
        workbench.choose('footer', 'text', textItemKey);
      else if (group === 'avatar')
        workbench.choose('header', 'region', 'region');
      else if (group === 'body') workbench.choose('body', 'region', 'body');
      else if (group === 'reasoning' || group === 'reasoning-body')
        workbench.choose(
          'reasoning',
          group === 'reasoning' ? 'entry' : 'reason-body',
          group,
        );
      else if (group === 'native')
        workbench.choose('native', 'actions', 'actions');
      else if (['input', 'topbar'].includes(group))
        workbench.choose(group, 'surface', 'surface');
      else if (group === 'global') workbench.choose('overall', 'card', 'card');
    }
    if (fromPreview && (document.defaultView?.innerWidth || 1200) <= 700)
      ui.mobileView = 'preview';
    normalizeSelection(
      ui,
      config.layers,
      config.captions,
      config.footerCaptions,
    );
    shadow.querySelector('.inspector-head .material-categories')?.remove();
    const container = shadow.querySelector('.fields');
    disposeIconLibrary?.();
    disposeIconLibrary = null;
    disposeFontLibrary?.();
    disposeFontLibrary = null;
    container.replaceChildren();
    let kinds = [],
      objects = [],
      title = '',
      keys = [];
    const names = { name: '名字', time: '时间', caption: '文案' };
    const headerEditing =
        Object.hasOwn(PAGE_HEADER_PAGES, ui.page) &&
        ui.region === 'page-header' &&
        ui.mode !== 'library',
      pageEditing =
        Object.hasOwn(PAGE_ROOTS, ui.page) &&
        !headerEditing &&
        ui.mode !== 'library',
      commonEditing =
        ui.page === 'home' && ui.region === 'common' && ui.mode !== 'library',
      unavailable =
        ui.mode !== 'library' &&
        !headerEditing &&
        ((!['home', 'chat'].includes(ui.page) &&
          !Object.hasOwn(PAGE_ROOTS, ui.page)) ||
          ui.region === 'home-design');
    if (headerEditing) {
      kinds = [
        ['base', '基础'],
        ['scene-images', '图片与形状'],
        ['scene-texts', '文字'],
        ...(ui.page === 'home' ? [['native-home', '酒馆文字与按钮']] : []),
      ];
      if (!kinds.some(([key]) => key === ui.kind)) ui.kind = 'base';
      objects =
        ui.kind === 'base'
          ? [
              ['image', '头图'],
              ['title', '标题'],
              ['layout', '排版'],
              ...(PAGE_TITLE_SUBTITLE_TARGETS[ui.page]
                ? [['subtitle', '标题下方文字'], ['decoration', '标题装饰']]
                : []),
            ]
          : ui.kind === 'native-home'
            ? [
                ['version', '版本文字'],
                ['settings', '设置按钮'],
                ['show', '展开按钮'],
                ['hide', '收起按钮'],
              ]
            : (ui.kind === 'scene-images'
                ? config.pageHeaders[ui.page].scene.images
                : config.pageHeaders[ui.page].scene.texts
              ).map((item) => [
                item.id,
                item.name + (item.visible ? '' : ' · 已隐藏'),
              ]);
      if (!objects.some(([key]) => key === ui.object))
        ui.object = objects[0]?.[0] || '';
      title = PAGE_HEADER_PAGES[ui.page] + ' / 页面头部';
    } else if (pageEditing) {
      if (
        ![
          'page-common',
          'page-content',
          ...(ui.page === 'presets' ? ['page-bai'] : []),
        ].includes(ui.region)
      )
        ui.region = 'page-common';
      if (ui.region === 'page-common') {
        kinds = [...COMMON_PARTS,['glass','玻璃效果']];
        title = PAGE_NAMES[ui.page] + ' / 页面基础';
      } else if (ui.region === 'page-bai') {
        kinds = [
          ['group', '分组'],
          ['entry', '条目'],
        ];
        if (!['group', 'entry'].includes(ui.kind)) ui.kind = 'group';
        title = '预设 / 柏宝箱';
      } else {
        kinds =
          ui.page === 'worldbook'
            ? [
                ['surface', '条目卡片'],
                ['heading', '条目标题'],
              ]
            : ui.page === 'presets'
              ? [
                  ['surface', '提示词条目'],
                  ['tip', '滑块提示'],
                ]
              : [];
        if (
          !(
            ui.page === 'presets' ? ['surface', 'tip'] : ['surface', 'heading']
          ).includes(ui.kind)
        )
          ui.kind = 'surface';
        title =
          ui.page === 'worldbook'
            ? '世界书 / 条目'
            : ui.page === 'presets'
              ? '预设 / 内容分组'
              : '设置分组';
      }
    } else if (commonEditing) {
      kinds = [...COMMON_PARTS,['glass','玻璃效果']];
      title = '全局基础 / 界面共用';
    } else if (unavailable)
      title =
        ui.region === 'home-design'
          ? '首页独立设计尚未接入'
          : PAGE_NAMES[ui.page] + '独立设计尚未接入';
    else if (ui.mode === 'library')
      title = libraryPurpose.startsWith('chrome:')
        ? '选择按钮素材'
        : libraryPurpose === 'native-more-icon'
          ? '设置更多图标'
          : libraryPurpose === 'native-edit-icon'
            ? '设置编辑图标'
            : libraryPurpose === 'reasoning-background'
              ? '设置思维入口背景'
              : materialSession
                ? '选择素材'
                : '素材库';
    else if (ui.region === 'overall') {
      kinds = [
        ['card', '整体样式'],
        ['image', '消息装饰'],
      ];
      if (ui.kind === 'image') {
        objects = matchingLayers(config.layers, 'overall').map((l) => [
          l.id,
          l.name,
        ]);
        selectedLayerId = ui.object;
        selected = 'decoration';
        title =
          config.layers.find((l) => l.id === ui.object)?.name || '消息装饰';
      } else {
        selected = 'global';
        title = '当前消息卡片';
        keys = [
          'surface',
          'accent',
          'radius',
          'glass',
          'surfaceOpacity',
          'cardWidth',
        ];
      }
    } else if (ui.region === 'header') {
      kinds = [
        ['region', '区域设置'],
        ['avatar', '头像与相框'],
        ['name', '名字'],
        ['time', '时间'],
        ['text', '自定义文案'],
        ['image', '图片素材'],
      ];
      if (ui.kind === 'text') {
        objects = ['name', 'time'].includes(ui.object)
          ? []
          : config.captions.map((c) => [
              captionKey(c.id),
              c.name + (c.visible ? '' : ' · 已隐藏'),
            ]);
        textItemKey = ui.object;
        selected = selectedCaption() ? 'caption' : 'avatar';
        title = (selectedCaption()?.name || names[ui.object]) + '';
        keys =
          ui.object === 'name'
            ? ['nameFont', 'nameColor', 'nameSize']
            : ui.object === 'time'
              ? ['timeFont', 'timeColor', 'timeSize']
              : [];
      } else if (ui.kind === 'avatar') {
        objects = [];
        selected = 'photo';
        title = '';
        if (ui.object === 'photo-user') photoScope = 'user';
        else if (ui.object === 'photo-ai') photoScope = 'ai';
      } else if (ui.kind === 'image') {
        selected = 'decoration';
        objects = matchingLayers(config.layers, 'header').map((l) => [
          l.id,
          l.name,
        ]);
        selectedLayerId = ui.object;
        title =
          config.layers.find((l) => l.id === ui.object)?.name || '头像区图片';
      } else {
        selected = 'avatar';
        title = '头像区设置';
        keys = ['headerHeight'];
      }
    } else if (ui.region === 'body') {
      selected = 'body';
      title = '正文阅读样式';
      keys = ['text', 'font', 'fontSize', 'lineHeight'];
    } else if (ui.region === 'footer') {
      kinds = [
        ['text', '自定义文案'],
        ['image', '图片素材'],
      ];
      if (ui.kind === 'image') {
        selected = 'decoration';
        objects = matchingLayers(config.layers, 'footer').map((l) => [
          l.id,
          l.name,
        ]);
        selectedLayerId = ui.object;
        title =
          config.layers.find((l) => l.id === ui.object)?.name || '尾部图片';
      } else {
        ui.kind = 'text';
        objects = config.footerCaptions.map((c) => [
          footerKey(c.id),
          c.name + (c.visible ? '' : ' · 已隐藏'),
        ]);
        textItemKey = ui.object;
        selected = 'footer';
        title = selectedCaption()
          ? selectedCaption().name + ''
          : '尾部文案 · 默认空';
      }
    } else if (['input', 'topbar'].includes(ui.region)) {
      kinds =
        ui.region === 'topbar'
          ? [
              ['surface', '顶栏整体'],
              ['icons', '按钮图标'],
            ]
          : [
              ['surface', '输入外框'],
              ['text', '输入框背景与高度'],
              ['placeholder', '输入框自定义文案'],
              ['tools', '工具与发送'],
              ['image', '图片素材'],
            ];
      if (!kinds.some(([k]) => k === ui.kind)) ui.kind = 'surface';
      if (ui.kind === 'image') {
        selected = 'decoration';
        objects = matchingLayers(config.layers, 'input').map((l) => [
          l.id,
          l.name,
        ]);
        selectedLayerId = ui.object;
        title =
          config.layers.find((l) => l.id === ui.object)?.name || '输入区图片';
      } else if (['icons', 'tools'].includes(ui.kind)) {
        objects = ui.region === 'topbar' ? DRAWERS : INPUT_ICONS;
        if (!objects.some(([id]) => id === ui.object))
          ui.object = objects[0][0];
        title =
          objects.find(([id]) => id === ui.object)[1] +
          ' · ' +
          (ui.region === 'topbar' ? '顶栏按钮' : '输入按钮');
      } else
        title =
          ui.region === 'topbar'
            ? '顶栏整体'
            : ui.kind === 'text'
              ? '输入框背景与高度'
              : ui.kind === 'placeholder'
                ? '输入框自定义文案'
                : '输入外框';
    } else if (ui.region === 'native') {
      kinds = [
        ['actions', '编辑与更多按钮'],
        ['info', '楼层信息'],
        ['swipe', '回复翻页'],
      ];
      if (!['actions', 'info', 'swipe'].includes(ui.kind)) ui.kind = 'actions';
      selected = 'native';
      title = kinds.find(([key]) => key === ui.kind)[1];
      if (ui.kind === 'info') {
        objects = [
          ['floor', '楼层号'],
          ['tokens', 'Token 统计'],
          ['time', '生成时长'],
        ];
        if (!objects.some(([key]) => key === ui.object)) ui.object = 'floor';
        title = objects.find(([key]) => key === ui.object)[1];
      } else if (ui.kind === 'swipe') {
        objects = [
          ['group', '整体排列'],
          ['left', '上一版'],
          ['right', '下一版'],
          ['counter', '翻页计数（a/b）'],
        ];
        if (!objects.some(([key]) => key === ui.object)) ui.object = 'group';
        title = objects.find(([key]) => key === ui.object)[1];
      }
    } else if (ui.region === 'reasoning') {
      kinds = [
        ['entry', '思维入口'],
        ['reason-body', '思维正文'],
        ['image', '图片素材'],
      ];
      if (ui.kind === 'image') {
        selected = 'decoration';
        objects = matchingLayers(config.layers, 'reasoning').map((l) => [
          l.id,
          l.name,
        ]);
        selectedLayerId = ui.object;
        title =
          config.layers.find((l) => l.id === ui.object)?.name || '思维图片';
      } else {
        if (ui.kind !== 'reason-body') ui.kind = 'entry';
        selected = 'reasoning';
        title = ui.kind === 'entry' ? '思维入口' : '思维正文';
      }
    } else title = '此区域尚未开放';
    let extra;
    if (supportsLayers(ui) && ui.mode === 'edit' && ui.kind === 'image') {
      extra = make('button', '', '＋ 添加图片');
      extra.id = 'add-current-image';
      extra.addEventListener('click', () => {
        openMaterialPicker('layer', 'images', targetForRegion());
      });
    }
    let actions;
    if (
      ui.page === 'chat' &&
      ui.mode === 'edit' &&
      ['header', 'footer'].includes(ui.region) &&
      ui.kind === 'text' &&
      !(ui.region === 'header' && ['name', 'time'].includes(ui.object))
    ) {
      const list = currentCaptions();
      actions = make(
        'button',
        '',
        `＋ 新增文案（${list.length}/${CAPTION_LIMIT}）${list.length >= CAPTION_LIMIT ? ' 已达上限' : ''}`,
      );
      actions.id =
        ui.region === 'footer' ? 'add-footer-caption' : 'add-caption';
      actions.disabled = list.length >= CAPTION_LIMIT;
      actions.title = actions.disabled ? '已达20条文案上限' : '新增一条文案';
      actions.addEventListener('click', () => {
        remember();
        const cap = currentNewCaption({
          name: '文案' + (list.length + 1),
          font: config.font,
          color: config.accent,
        });
        list.push(cap);
        ui.object = currentCaptionKey(cap.id);
        apply();
        renderFields();
      });
    }
    const activeKind =
      commonEditing || (pageEditing && ui.region === 'page-common')
        ? ui.commonPart
        : ui.region === 'header' &&
            ui.kind === 'text' &&
            ['name', 'time'].includes(ui.object)
          ? ui.object
          : ui.kind;
    workbench.render({ kinds, objects, title, extra, actions, activeKind });
    const combinationTarget = combinationContext(ui);
    if (combinationTarget) {
      const combinations = make('button', '', '我的组合');
      combinations.type = 'button';
      combinations.id = 'open-region-combinations';
      combinations.setAttribute('aria-expanded', 'false');
      combinations.addEventListener('click', () => combinationLibrary.toggle(combinationTarget, combinations));
      container.append(combinations);
    }
    if (unavailable) {
      container.append(
        make('p', 'hint', '本页沿用全局外观，专属样式尚未开放。'),
      );
      const global = make('button', '', '前往全局基础');
      global.type = 'button';
      global.addEventListener('click', () => {
        workbench.choose('common', 'text', 'common');
        renderFields();
      });
      container.append(global);
    } else if (headerEditing) renderPageHeaderFields(container);
    else if (commonEditing) renderCommonFields(container);
    else if (pageEditing) renderPageFields(container);
    else if (
      ![
        'overall',
        'header',
        'body',
        'reasoning',
        'footer',
        'native',
        'input',
        'topbar',
      ].includes(ui.region) &&
      ui.mode !== 'library'
    )
      container.append(make('p', 'hint', '此区域的编辑功能尚未开放。'));
    else if (ui.mode === 'library') renderSourceLibrary(container);
    else if (ui.mobileView === 'layers') renderRegionLayers(container);
    else {
      if (
        keys.length &&
        !['overall', 'body'].includes(ui.region) &&
        !(ui.region === 'header' && ['text', 'region'].includes(ui.kind))
      ) {
        if (ui.region === 'header' && ui.kind === 'avatar')
          propertyHeading(container, '形状与尺寸');
        renderConfigFields(container, keys);
      }
      if (ui.region === 'overall' && ui.kind !== 'image') {
        propertyHeading(container, '画布与卡片');
        const desktopWidth = make('div', 'desktop-card-width');
        container.append(desktopWidth);
        editorControl(
          desktopWidth,
          {
            ...field('卡片宽度', 'cardFullWidth', 'select', {
              options: [
                ['false', '限制最大宽度'],
                ['true', '铺满聊天区'],
              ],
            }),
            notice: '卡片宽度已更新，尚未保存',
          },
          config,
          () => renderFields(),
        );
        if (!config.cardFullWidth)
          renderConfigFields(desktopWidth, ['cardWidth']);
        editorControl(
          container,
          {
            ...field('楼间距', 'messageGap', 'range', {
              min: 0,
              max: 120,
              unit: 'px',
            }),
            notice: '楼间距已更新，尚未保存',
          },
          config,
        );
        editorControl(
          container,
          {
            ...field('卡片两侧留白', 'cardGutter', 'range', {
              min: 0,
              max: 80,
              unit: 'px',
            }),
            notice: '卡片留白已更新，尚未保存',
          },
          config,
        );
        editorControl(
          container,
          field('卡片内边距', 'cardPadding', 'range', {
            min: 0,
            max: 80,
            unit: 'px',
          }),
          config,
        );
        editorControl(
          container,
          field('卡片阴影', 'cardShadow', 'select', {
            options: [
              ['true', '显示'],
              ['false', '隐藏'],
            ],
          }),
          config,
        );
        renderConfigFields(container, ['radius']);
        const wallpaperButton=make('button','','选择方案壁纸');
        wallpaperButton.type='button';
        wallpaperButton.addEventListener('click',()=>openMaterialPicker('canvas-wallpaper','images','',source=>{
          config.canvasWallpaper=source.image || '';
          config.canvasWallpaperAsset=source.asset || '';
          config.canvasBackground='image';
        }));
        container.append(wallpaperButton);
        if(config.canvasBackground==='image'){
          const preview=make('img','page-art-preview');preview.src=config.canvasWallpaper || assetUrl(config.canvasWallpaperAsset);preview.alt='方案壁纸';container.append(preview);
          const follow=make('button','','恢复跟随酒馆背景');follow.type='button';
          follow.addEventListener('click',()=>{remember();config.canvasBackground='tavern';delete config.canvasWallpaper;delete config.canvasWallpaperAsset;apply();renderFields();});container.append(follow);
        }
        if (config.canvasBackground === 'legacy-solid') {
          const notice = make('p', 'muted', '此旧方案保留原纯色背景。'),
            migrate = make('button', '', '改为跟随酒馆背景');
          migrate.type = 'button';
          migrate.addEventListener('click', () => {
            remember();
            config.canvasBackground = 'tavern';
            apply();
            renderFields();
            notify('已跟随酒馆背景；可撤销，保存后记住');
          });
          container.append(notice, migrate);
        }
        propertyHeading(container, '配色与透明');
        const glassActive=renderGlassFields(container,{region:'message'});
        renderConfigFields(container, glassActive?['accent']:['surface','accent','surfaceOpacity',...(config.glassStyle?[]:['glass'])]);
      }
      if (ui.region === 'header' && ui.kind === 'region') {
        renderHeaderHeightFields(container);
        container.append(make('p', 'hint', '超出区域高度的内容会被裁切。'));
      }
      if (['input', 'topbar'].includes(ui.region) && ui.kind !== 'image')
        renderChromeFields(container);
      if (ui.region === 'native') renderNativeFields(container);
      if (ui.region === 'body') renderBodySettings(container);
      if (ui.region === 'reasoning' && ui.kind !== 'image')
        renderReasoningFields(
          container,
          ui.kind === 'reason-body' ? 'body' : 'entry',
        );
      if (ui.region === 'overall' && ui.kind !== 'image')
        renderCardBorderSettings(container);
      if (ui.region === 'header' && ui.kind === 'text') {
        if (selectedCaption() || ['name', 'time'].includes(ui.object))
          renderTextFields(container);
        else
          container.append(
            make('p', 'hint', '还没有自定义文案，点击新增文案开始。'),
          );
      }
      if (ui.region === 'footer' && ui.kind === 'text') {
        if (selectedCaption()) renderTextFields(container);
        else
          container.append(
            make(
              'p',
              'hint',
              '尾部还没有文案，点击新增文案开始；默认空白不占高。',
            ),
          );
      }
      if (ui.region === 'header' && ui.kind === 'avatar')
        renderPhotoFields(container);
      if (ui.kind === 'image') renderLayers(container);
    }
    for (const id of ['import', 'export', 'restore', 'undo', 'apply-live'])
      shadow.querySelector('#' + id).disabled =
        id === 'undo' && !history.length;
    syncSaveState();
    updateWorkbenchLayout();
    const selection = JSON.stringify([
      active,
      ui.page,
      ui.mode,
      ui.region,
      ui.kind,
      ui.object,
    ]);
    if (selection !== gestureSelection) {
      gestureSelection = selection;
      layerDrag.refresh();
    }
  }
  function apply() {
    if (pendingRegionEdit) {
      if (pendingRegionEdit.config === config) activateEditedRegion(config, pendingRegionEdit.ui);
      pendingRegionEdit = null;
    }
    config.regionOrder = syncRegionOrder(config).regionOrder;
    scrollbarVisibility.set(
      active && normalizeScrollbars(config.hideScrollbars),
    );
    if (scrollbarToggle)
      scrollbarToggle.checked = normalizeScrollbars(config.hideScrollbars);
    layerDrag.cancel();
    if (active) liveAdapter.update(config, { validated: true });
    updateFontStatuses();
    builtinLibrary.syncCurrent();
    shadow.querySelector('#undo').disabled = !history.length;
    for (const b of shadow.querySelectorAll('[data-object]')) {
      const layer = config.layers.find((l) => l.id === b.dataset.object),
        cap = currentCaptions().find(
          (c) => currentCaptionKey(c.id) === b.dataset.object,
        );
      if (layer) b.textContent = layer.name;
      if (cap) b.textContent = cap.name + (cap.visible ? '' : ' · 已隐藏');
    }
    if (ui.region === 'page-header' && ui.mode === 'edit') {
      const scene = config.pageHeaders[ui.page].scene;
      for (const button of shadow.querySelectorAll('[data-object]')) {
        const item = [...scene.images, ...scene.texts].find(
          (item) => item.id === button.dataset.object,
        );
        if (item)
          button.textContent = item.name + (item.visible ? '' : ' · 已隐藏');
      }
    }
    if (ui.mode === 'edit' && ui.kind === 'text' && selectedCaption())
      shadow.querySelector('.selected-title').textContent =
        selectedCaption().name;
    if (ui.mode === 'edit' && ui.kind === 'image') {
      const layer = config.layers.find((l) => l.id === ui.object);
      if (layer)
        shadow.querySelector('.selected-title').textContent = layer.name;
    }
  }
  function open() {
    if (active) return;
    const chat = document.querySelector('#chat');
    if (!chat) {
      notify('请先打开酒馆聊天界面');
      return;
    }
    previewChatWidth = chat.getBoundingClientRect().width;
    workbench.syncSizing();
    active = true;
    invalidateEditing();
    mobileFlow.hide();
    mobileFlow.setEditorOpen(true);
    canvas.start();
    try {
      if (liveAdapter.active) liveAdapter.update(config, { validated: true });
      else liveAdapter.start(config);
    } catch (error) {
      active = false;
      canvas.stop();
      mobileFlow.setEditorOpen(false);
      notify('进入编辑失败：' + error.message);
      return;
    }
    imageDisplay.watch(shadow);
    scrollbarVisibility.set(normalizeScrollbars(config.hideScrollbars));
    entries.setEditing(true);
    entries.setApplied(false);
    shadow.querySelector('.bar').classList.remove('hidden');
    panel.classList.remove('hidden');
    shadow.querySelector('.splitter').classList.remove('hidden');
    shadow
      .querySelector('#narrow')
      .setAttribute('aria-pressed', String(ui.narrow));
    builtinLibrary.syncCurrent();
    shadow.querySelector('#stop-and-close').hidden = appliedSnapshot === null && !applicationLoadError;
    syncSaveState();
    renderFields();
    if (loadError)
      notify(
        '保存的方案未载入：' + loadError.message + ' 点击“恢复已保存”重试。',
        0,
      );
  }
  async function close({ keepApplied = false } = {}) {
    if (!active || (applying && !keepApplied)) return;
    hideExitDialog();
    if (materialSession || managerReturn) returnFromMaterials();
    workLibrary?.hide();
    combinationLibrary?.hide();
    invalidateEditing();
    layerDrag.reset();
    headerDrag.reset();
    active = false;
    ui.mobileView = 'adjust';
    workbench.resetLayoutSession();
    imageDisplay.clear();
    mobileFlow.setEditorOpen(false);
    scrollbarVisibility.stop();
    canvas.stop();
    document.documentElement.removeAttribute('data-otl-narrow');
    gestureSelection = null;
    if (appliedSnapshot !== null) liveAdapter.update(appliedSnapshot);
    else liveAdapter.stop();
    fitInput()?.catch?.((error) =>
      console.warn('[主题输入增高]', error.message),
    );
    entries.setEditing(false);
    entries.setApplied(appliedSnapshot !== null);
    shadow.querySelector('.bar').classList.add('hidden');
    panel.classList.add('hidden');
    shadow.querySelector('.splitter').classList.add('hidden');
  }

  function resetDraftTo(snapshot) {
    config = snapshotDraft(snapshot);
    selectedLayerId = config.layers[0]?.id;
    history.length = 0;
    pendingRegionEdit = null;
    setSaveState(saved ? 'saved' : 'draft');
  }

  function startScheme(next, { preview }) {
    if (exiting || applying) return false;
    if (!document.querySelector('#chat')) {
      notify('请先打开酒馆聊天界面');
      return false;
    }
    const replacing = !sameDraft(config, next);
    if (replacing && hasUnsavedDraft() &&
      window.confirm?.('这会替换尚未保存的草稿。替换后可撤销，继续吗？') === false) return false;
    invalidateEditing();
    if (replacing) remember(false);
    config = next;
    selectedLayerId = config.layers[0]?.id;
    ui.mode = 'edit';
    ui.mobileView = preview ? 'preview' : 'adjust';
    if (active) { apply(); renderFields(); }
    else open();
    notify('新起点已载入，尚未保存');
    return true;
  }

  function replaceStart(id) {
    if (!Object.hasOwn(templates, id)) return false;
    return startScheme(validate(clone(templates[id])), { preview: id !== 'blank' });
  }

  const exitDialog = make('dialog', 'workbench-exit');
  exitDialog.setAttribute('aria-labelledby', 'workbench-exit-title');
  exitDialog.innerHTML = `<h2 id="workbench-exit-title">草稿尚未保存</h2>
    <p id="workbench-exit-message"></p>
    <p data-exit-error role="status"></p>
    <div class="actions">
      <button type="button" data-exit-choice="stay">继续编辑</button>
      <button type="button" data-exit-choice="discard">不保存退出</button>
      <button type="button" data-exit-choice="save" class="primary">保存草稿后退出</button>
    </div>`;
  const exitStyle = make('style');
  exitStyle.textContent = '.workbench-exit{width:min(430px,calc(100vw - 32px));box-sizing:border-box;border:1px solid var(--line);background:var(--paper);color:#303330;padding:20px;z-index:20300}.workbench-exit:not([open]){display:none}.workbench-exit::backdrop{background:#0006}.workbench-exit h2{font-size:18px;margin:0}.workbench-exit [data-exit-error]:empty{display:none}.workbench-exit [data-exit-error]{color:#9e3930}.workbench-exit button{min-height:44px}';
  shadow.append(exitStyle);
  let exitMode = false;
  function hideExitDialog() {
    if (exitDialog.hasAttribute('open') && typeof exitDialog.close === 'function') exitDialog.close();
    exitDialog.removeAttribute('open');
    exitDialog.remove();
  }
  async function requestExit(stop) {
    if (!active || exiting || applying) return;
    if (saveState === 'saving') {
      notify('草稿正在保存，请稍后重试。', 0);
      return;
    }
    if (!hasUnsavedDraft()) return finishExit(stop);
    exitMode = stop;
    exitDialog.querySelector('#workbench-exit-message').textContent = stop
      ? '停用美化并退出前，可以先保存草稿。'
      : '退出编辑前，可以先保存草稿。';
    exitDialog.querySelector('[data-exit-error]').textContent = '';
    if (!exitDialog.hasAttribute('open')) {
      shadow.append(exitDialog);
      if (typeof exitDialog.showModal === 'function') exitDialog.showModal();
      if (!exitDialog.hasAttribute('open')) exitDialog.setAttribute('open', '');
    }
    exitDialog.querySelector('[data-exit-choice="stay"]').focus?.();
  }
  async function finishExit(stop, choice) {
    if (!active || exiting || applying) return;
    exiting = true;
    const buttons = [...exitDialog.querySelectorAll('button')];
    const baseline = recoverableDraft();
    buttons.forEach(button => { button.disabled = true; });
    try {
      if (choice === 'save' && !(await saveDraft())) {
        exitDialog.querySelector('[data-exit-error]').textContent = shadow.querySelector('#notice').textContent;
        return;
      }
      const draftAtStop = stop ? snapshotDraft(config) : null;
      if (stop && !(await clearApplied())) {
        exitDialog.querySelector('[data-exit-error]').textContent = shadow.querySelector('#notice').textContent;
        return;
      }
      const newerDraft = stop && !sameDraft(config, draftAtStop);
      if (!newerDraft) {
        if (choice === 'discard') resetDraftTo(saved ?? (stop ? blankDraft : baseline));
        else if (stop && !saved) resetDraftTo(blankDraft);
      }
      await close();
      if (newerDraft) notify('已停用美化，等待期间的修改仍保留为未保存草稿。');
    } finally {
      buttons.forEach(button => { button.disabled = false; });
      exiting = false;
    }
  }
  exitDialog.addEventListener('cancel', event => {
    event.preventDefault();
    if (!exiting) hideExitDialog();
  });
  exitDialog.addEventListener('click', event => {
    const choice = event.target.dataset.exitChoice;
    if (choice === 'stay') hideExitDialog();
    else if (choice) finishExit(exitMode, choice);
  });

  const scrollbarLabel = make('label', 'field'),
    scrollbarToggle = make('input');
  scrollbarToggle.type = 'checkbox';
  scrollbarToggle.checked = normalizeScrollbars(config.hideScrollbars);
  scrollbarToggle.setAttribute('aria-label', '隐藏滚动条');
  scrollbarLabel.append(
    scrollbarToggle,
    make('span', '', '隐藏滚动条（仍可滚动）'),
  );
  shadow.querySelector('.bar details .menu').append(scrollbarLabel);
  scrollbarToggle.addEventListener('change', () => {
    remember(false);
    config.hideScrollbars = scrollbarToggle.checked;
    apply();
    notify('滚动条显示已更新，保存方案后记住');
  });
  const mobileFlow = installMobileFlow({
    shadow,
    templateLibrary: builtinLibrary,
    onLibrary: (source) => workLibrary.show(source, {
      view: 'start',
      onCancel: () => {
        invalidateEditing();
        mobileFlow.show({ canContinue: active || !!saved || !!appliedSnapshot, source });
      },
    }),
    onVisibility: (visible) =>
      scrollbarVisibility.set(
        (active || visible) && normalizeScrollbars(config.hideScrollbars),
      ),
    onContinue: open,
    onBlank: () => replaceStart('blank'),
  });
  workLibrary = createWorkLibrary({
    shadow,
    builtins: builtinLibrary,
    storage: createCustomWorkStorage(),
    snapshot: () => JSON.stringify(validate(config)),
    onBuiltin: replaceStart,
    onOpen: (json) => startScheme(
      validate(rebaseBundledFontLinks(JSON.parse(json), import.meta.url)),
      { preview: true },
    ),
    onImport: () => shadow.querySelector('#import-file').click(),
    onMessage: notify,
  });
  const combinationStores = new Map();
  combinationLibrary = createCombinationLibrary({
    shadow,
    storageForRegion: (region) => {
      if (!combinationStores.has(region)) combinationStores.set(region, createCustomWorkStorage({ databaseName: 'orange.theme-lab.combinations.' + region + '.v1' }));
      return combinationStores.get(region);
    },
    capture: async (context) => portableScheme(captureCombination(validate(config), context.region, context.pageId)),
    preview: (combination) => {
      const context = { region: combination.region, pageId: combination.pageId };
      const sample = validate(applyCombination(validate(clone(templates.blank)), combination, context.pageId, { moveNative: true }));
      return createCombinationPreview(document, sample, context);
    },
    builtins: (context) => {
      if (context.region === 'header') return [['flat', '平铺大头像'], ['rectangle', '矩形头像并排文字']].map(([variant, name]) => ({ id: 'avatar-' + variant, name, combination: captureCombination(validate(avatarCombinationScheme(templates.blank, variant)), 'header') }));
      if (!['home', 'page'].includes(context.region)) return [];
      const pageId = context.region === 'home' ? 'home' : context.pageId;
      const combination = builtinPageCombination(validate(clone(templates.jinghai)), context.region, pageId);
      return combination ? [{ id: 'jinghai-' + pageId, name: '京海日报 · ' + PAGE_HEADER_PAGES[pageId], combination }] : [];
    },
    apply: (combination, context) => {
      const conflicts = inspectCombinationConflicts(config, combination);
      if (conflicts.length && !window.confirm(conflicts.join('\n') + '\n继续套用吗？')) return false;
      const next = validate(applyCombination(config, combination, context.pageId, { moveNative: conflicts.length > 0 }));
      invalidateEditing();
      remember();
      config = next;
      activateEditedRegion(config, ui);
      apply();
      renderFields();
      notify('已套用到' + context.label);
      return true;
    },
    onMessage: notify,
  });
  const libraryButton = make('button', '', '作品库');
  libraryButton.type = 'button';
  libraryButton.id = 'open-work-library';
  shadow.querySelector('.desktop-scheme .menu').prepend(libraryButton);
  libraryButton.addEventListener('click', () => workLibrary.show(libraryButton));
  const saveWorkButton = make('button', '', '另存为作品');
  saveWorkButton.type = 'button';
  saveWorkButton.id = 'save-work';
  libraryButton.after(saveWorkButton);
  saveWorkButton.addEventListener('click', () => {
    if (active && !exiting && !applying) workLibrary.show(shadow.querySelector('.desktop-scheme summary'), { view: 'create' });
  });
  const launch = () => {
    if (active) {
      workbench.restoreWorkbench();
      return;
    }
    if (exiting) return;
    if (saved || appliedSnapshot || loadError || hasUnsavedDraft()) open();
    else mobileFlow.show({source: shadow.querySelector('.launcher')});
  };
  const entries = createWorkshopEntries({
    document,
    launcher: shadow.querySelector('.launcher'),
    onOpen: launch,
    onStopApplied: stopApplied,
    onMessage: notify,
  });
  const entrySettings = make('details', 'entry-settings');
  entrySettings.append(make('summary', '', '工坊入口'));
  const entryControls = entries.renderSettings();
  entryControls.querySelector('h4')?.remove();
  entrySettings.append(entryControls);
  shadow.querySelector('.menu-session-divider').before(entrySettings);
  const entryStyle = make('style');
  entryStyle.textContent =
    '[data-workshop-entry-settings] h4{margin:10px 0 4px}[data-workshop-entry-settings] p{font-size:12px}[data-workshop-entry-settings] .checkbox_label{display:flex;align-items:center;gap:7px;padding:6px 0;font-size:13px}[data-workshop-entry-settings] input{width:20px;height:20px;flex:none}';
  shadow.append(entryStyle);
  shadow.querySelector('.launcher').addEventListener('click', launch);
  shadow.querySelector('#close').addEventListener('click', () => requestExit(false));
  shadow.querySelector('#stop-and-close').addEventListener('click', () => requestExit(true));
  document.addEventListener('click', (event) => {
    if (!active || ui.mode === 'library') return;
    const target = event.target;
    if (
      ui.page === 'home' &&
      !(ui.region === 'input' && target.closest?.('#send_form'))
    )
      return;
    if (!['home', 'chat'].includes(ui.page)) return;
    if (!target.closest?.('#chat .mes[data-otl-live],#send_form')) return;
    // Native controls remain native. Their click/submit behavior is never intercepted.
    if (
      target.closest(
        'button,input,textarea,select,a,.mes_button,.mes_edit_buttons,.swipe_left,.swipe_right',
      ) ||
      (target.closest('summary') &&
        !target.closest('.otl-live-reasoning,[data-layer-id]'))
    )
      return;
    const image = target.closest('[data-layer-id]');
    if (image) {
      event.preventDefault();
      invalidateEditing();
      selectedLayerId = image.dataset.layerId;
      renderFields('decoration', { fromPreview: true });
      return;
    }
    const text = target.closest(
      '.name_text,.timestamp,.otl-live-caption[data-caption-id],[data-footer-caption-id],.otl-live-reasoning',
    );
    if (text) {
      invalidateEditing();
      if (text.dataset.footerCaptionId) {
        textItemKey = footerKey(text.dataset.footerCaptionId);
        renderFields('footer-text', { fromPreview: true });
        return;
      }
      if (text.classList.contains('otl-live-reasoning')) {
        event.preventDefault();
        renderFields('reasoning', { fromPreview: true });
        return;
      }
      textItemKey = text.dataset.captionId
        ? captionKey(text.dataset.captionId)
        : text.classList.contains('name_text')
          ? 'name'
          : 'time';
      if (!text.dataset.captionId)
        metadataScope =
          text.closest('.mes')?.getAttribute('is_user') === 'true'
            ? 'user'
            : 'ai';
      renderFields('text', { fromPreview: true });
      return;
    }
    const photo = target.closest('.avatar');
    if (photo) {
      invalidateEditing();
      photoScope =
        photo.closest('.mes').getAttribute('is_user') === 'true'
          ? 'user'
          : 'ai';
      renderFields('photo');
    }
  });
  shadow.querySelector('#narrow').addEventListener('click', (event) => {
    const narrow = event.target.getAttribute('aria-pressed') !== 'true';
    ui.narrow = narrow;
    document.documentElement.dataset.otlNarrow = String(narrow);
    event.target.setAttribute('aria-pressed', String(narrow));
    updateWorkbenchLayout();
  });
  shadow.querySelector('#undo').addEventListener('click', () => {
    if (!history.length) return;
    invalidateEditing();
    config = history.pop();
    apply();
    renderFields();
    notify('已撤销上一步');
  });
  async function saveDraft() {
    if (saveState === 'saving') return false;
    if (loadError) {
      notify('未保存：请先点击“恢复已保存”重新读取方案。原保存未改变。', 0);
      return false;
    }
    let checked, json;
    try {
      checked = validate(config);
      json = JSON.stringify(checked);
    } catch (error) {
      setSaveState('failed');
      notify('未保存：' + error.message, 0);
      return false;
    }
    setSaveState('saving');
    try {
      await schemeStorage.save(json);
      saved = clone(checked);
      let unchanged = false;
      try {
        unchanged = JSON.stringify(validate(config)) === json;
      } catch {}
      setSaveState(unchanged ? 'saved' : 'draft');
      notify(
        unchanged
          ? '方案已保存到当前浏览器，刷新后可以继续编辑。'
          : '点击保存时的方案已保存；之后的修改尚未保存。',
      );
      return unchanged;
    } catch (error) {
      setSaveState('failed');
      notify(
        error.name === 'QuotaExceededError'
          ? '未保存：浏览器可用存储空间不足，原有保存未变。请释放设备或本站不需要的存储后重试；也可手动导出当前方案。'
          : '未保存：' + error.message,
        0,
      );
      return false;
    }
  }
  shadow.querySelector('#save').addEventListener('click', () => { if (!exiting && !applying) saveDraft(); });
  shadow.querySelector('#restore').addEventListener('click', async () => {
    const button = shadow.querySelector('#restore');
    if (button.disabled) return;
    if (loadError) {
      button.disabled = true;
      const epoch = editEpoch,
        originalConfig = config,
        draft = JSON.stringify(config);
      try {
        const raw = await schemeStorage.load();
        saved = raw === null ? null : validate(rebaseBundledFontLinks(JSON.parse(raw), import.meta.url));
        loadError = null;
        if (
          !active ||
          epoch !== editEpoch ||
          config !== originalConfig ||
          JSON.stringify(config) !== draft
        ) {
          notify('已重新读取保存方案；点击“恢复已保存”载入。');
          return;
        }
      } catch (error) {
        loadError = error;
        notify('保存的方案未载入：' + error.message, 0);
        return;
      } finally {
        button.disabled = false;
      }
    }
    if (!saved) {
      notify('还没有保存过方案。');
      return;
    }
    invalidateEditing();
    remember();
    config = clone(saved);
    selectedLayerId = config.layers[0]?.id;
    apply();
    renderFields();
    notify('已恢复上次保存的方案');
  });
  shadow.querySelector('#export').addEventListener('click', async () => {
    const button = shadow.querySelector('#export');
    button.disabled = true;
    try {
      const filename = await requestExportName({document, root: shadow, trigger: button});
      if (filename === null) return;
      const exported = validate(await portableScheme(validate(config)));
      const blob = new Blob([JSON.stringify(exported, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = make('a');
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify('已导出实验方案；它不是酒馆原生主题文件。');
    } catch (error) { notify('导出失败：' + error.message); }
    finally {
      button.disabled = false;
      const restoreFocus = () => {
        button.focus?.();
        if (shadow.activeElement !== button) shadow.querySelector('.desktop-scheme summary')?.focus?.();
      };
      if (document.defaultView?.requestAnimationFrame) document.defaultView.requestAnimationFrame(restoreFocus);
      else restoreFocus();
    }
  });
  shadow
    .querySelector('#import')
    .addEventListener('click', () =>
      shadow.querySelector('#import-file').click(),
    );
  shadow
    .querySelector('#import-file')
    .addEventListener('change', async (event) => {
      const input = event.target;
      const file = input.files[0];
      if (!file) return;
      invalidateEditing();
      const epoch = editEpoch;
      const originalConfig = config;
      try {
        const contents = await file.text();
        if (epoch !== editEpoch || config !== originalConfig) return;
        const next = validate(rebaseBundledFontLinks(JSON.parse(contents), import.meta.url));
        if (startScheme(next, { preview: true })) {
          workLibrary.hide();
          notify('已导入预览，点击保存后记住。');
        }
      } catch (error) {
        notify('未导入：' + error.message);
      } finally {
        input.value = '';
      }
    });
  if (applicationLoadError)
    notify('已应用方案未载入：' + applicationLoadError.message, 0);
  if (appliedSnapshot !== null) {
    try {
      if (!saved) resetDraftTo(appliedSnapshot);
      liveAdapter.start(appliedSnapshot);
      entries.setApplied(true);
    } catch (error) {
      liveAdapter.stop();
      notify('恢复已应用方案失败：' + error.message, 0);
    }
  }
})();

