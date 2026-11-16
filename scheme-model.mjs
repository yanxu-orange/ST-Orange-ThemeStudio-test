import {
  TEXT_DEFAULTS,
  validateTextItems,
  textSettings,
} from './text-layout.mjs';
import { BODY_CARD_DEFAULTS, bodyCardSettings } from './body-card.mjs';
import { kittyLayers, defaultPhoto, validatePhotos } from './photos.mjs';
import { newLayer, migrateLayers } from './layers.mjs';
import { normalizeScrollbars } from './scrollbars.mjs';
import { normalizeCaptionConfig, stripLegacyCaptions } from './captions.mjs';
import { normalizeReasoningConfig } from './reasoning.mjs';
import { normalizeFooterConfig } from './footer.mjs';
import { normalizeNativeConfig } from './native.mjs';
import { validEmbeddedImage } from './image-sources.mjs';
import { validateMetadata } from './native-metadata.mjs';
import { normalizePageHeaders } from './page-headers.mjs';
import { normalizePageConfig } from './page-style.mjs';
import { normalizeCommonConfig } from './common-style.mjs';
import { normalizeCanvasBackground } from './canvas-background.mjs';
import { normalizeTextScene } from './text-scene.mjs';
import { validateRegionOrder, syncRegionOrder } from './region-layers.mjs';
import { normalizeAvatarFill } from './avatar-fill.mjs';
import { normalizeChromeConfig } from './chrome.mjs';

export function createSchemeModel() {
  const fonts = [
    ['serif', '宋体风格'],
    ['sans-serif', '黑体风格'],
    ['Georgia, serif', '英文衬线'],
    ['monospace', '等宽字体'],
  ];
  const base = {
    ...TEXT_DEFAULTS,
    ...BODY_CARD_DEFAULTS,
    textItems: validateTextItems(),
    version: 1,
    template: 'letter',
    avatarDesign: 'unified',
    canvasBackground: 'tavern',
    background: '#e8ece6',
    surface: '#fffdf8',
    text: '#354b42',
    accent: '#6f8973',
    radius: 20,
    font: 'serif',
    fontSize: 17,
    lineHeight: 1.9,
    layout: 'top',
    avatarSize: 88,
    headerHeight: 240,
    avatarRadius: 16,
    nameColor: '#354b42',
    nameSize: 23,
    nameFont: 'serif',
    timeColor: '#89958b',
    timeSize: 12,
    timePosition: 'below',
    caption: '今日也有一封来信',
    captionColor: '#7e9477',
    captionSize: 14,
    captionFont: 'serif',
    captionPosition: 'above',
    reasoning: '展开这页思绪',
    reasoningSize: 14,
    reasoningFont: 'serif',
    decoration: 'flower',
    decorationWidth: 90,
    decorationX: 8,
    decorationY: 8,
    decorationOpacity: 0.8,
    glass: 0,
    image: '',
  };
  const templates = {
    letter: { ...base },
    clear: {
      ...base,
      template: 'clear',
      background: '#eaf0f6',
      surface: '#ffffff',
      text: '#344963',
      accent: '#7893b3',
      radius: 8,
      font: 'sans-serif',
      layout: 'left',
      avatarSize: 56,
      headerHeight: 140,
      nameSize: 18,
      caption: '一个普通而清新的日子',
      decoration: 'none',
    },
    scrapbook: {
      ...base,
      template: 'scrapbook',
      background: '#f0e9e0',
      surface: '#fffaf0',
      text: '#645243',
      accent: '#aa8562',
      radius: 3,
      avatarSize: 112,
      headerHeight: 265,
      caption: '把今天收进这一页',
      captionColor: '#a07d60',
      decoration: 'star',
      decorationWidth: 110,
    },
  };
  base.surfaceOpacity = 1;
  for (const theme of Object.values(templates)) theme.surfaceOpacity = 1;
  base.cardWidth = 760;
  for (const theme of Object.values(templates)) theme.cardWidth = 760;
  templates.kitty = {
    ...base,
    template: 'kitty',
    avatarDesign: 'separate',
    background: '#edf1f8',
    surface: '#ffffff',
    text: '#28365e',
    accent: '#7985b6',
    radius: 9,
    font: '"LabSongti",serif',
    fontSize: 15,
    lineHeight: 1.95,
    layout: 'collage',
    headerHeight: 240,
    nameFont: 'serif',
    nameColor: '#26365f',
    nameSize: 22,
    timeColor: '#61769c',
    caption: '今夜有一点魔法',
    captionColor: '#5d70a0',
    captionSize: 11,
    captionPosition: 'below',
    reasoning: 'Kitty Gets to Work',
    reasoningFont: 'Georgia, serif',
    cardWidth: 680,
    layers: kittyLayers(),
    photos: {
      ai: defaultPhoto({
        enabled: true,
        size: 190,
        rotation: -0.6,
        asset: 'kitty-header-garden',
      }),
      user: defaultPhoto({
        enabled: true,
        size: 190,
        rotation: 0.45,
        asset: 'kitty-user-window',
      }),
    },
  };
  templates.blank = {
    ...templates.clear,
    template: 'blank',
    caption: '',
    decoration: 'none',
    layers: [],
  };
  for (const theme of Object.values(templates))
    if (!theme.photos)
      theme.photos = {
        ai: defaultPhoto({
          size: theme.avatarSize,
          radius: theme.avatarRadius,
        }),
        user: defaultPhoto({
          size: theme.avatarSize,
          radius: theme.avatarRadius,
        }),
      };
  fonts.push(['"LabSongti",serif', '随包思源宋体']);
  templates.scrapbook.layers = [
    newLayer('tape', {
      name: '照片上方胶带',
      side: 'left',
      width: 135,
      x: -9,
      y: -7,
      rotation: -12,
      z: 4,
    }),
    newLayer('leaf', {
      name: '右侧叶枝',
      width: 105,
      x: 5,
      y: 14,
      rotation: 14,
      z: 0,
      opacity: 0.5,
    }),
    newLayer('flower', {
      name: '角落小花',
      width: 64,
      x: 8,
      y: 95,
      rotation: -15,
      z: 3,
    }),
    newLayer('star', {
      name: '小星星',
      width: 38,
      x: 100,
      y: 10,
      rotation: 12,
      z: 2,
    }),
  ];

  const field = (label, key, type = 'text', extra = {}) => ({
    label,
    key,
    type,
    ...extra,
  });
  const groups = {
    global: [
      field('卡片底色', 'surface', 'color'),
      field('文字颜色', 'text', 'color'),
      field('强调颜色', 'accent', 'color'),
      field('公共圆角', 'radius', 'range', { min: 0, max: 40, unit: 'px' }),
      field('正文字体', 'font', 'select', { options: fonts }),
      field('正文字号', 'fontSize', 'range', { min: 12, max: 28, unit: 'px' }),
      field('正文行高', 'lineHeight', 'range', {
        min: 1.2,
        max: 2.6,
        step: 0.05,
      }),
      field('玻璃模糊', 'glass', 'range', { min: 0, max: 20, unit: 'px' }),
    ],
    avatar: [
      field('头像大小', 'avatarSize', 'range', {
        min: 40,
        max: 150,
        unit: 'px',
      }),
      field('头像圆角', 'avatarRadius', 'range', {
        min: 0,
        max: 80,
        unit: 'px',
      }),
      field('头像区总高度', 'headerHeight', 'range', {
        min: 60,
        max: 240,
        unit: 'px',
      }),
      field('名字字体', 'nameFont', 'select', { options: fonts }),
      field('名字颜色', 'nameColor', 'color'),
      field('名字字号', 'nameSize', 'range', { min: 8, max: 200, unit: 'px' }),
      field('时间颜色', 'timeColor', 'color'),
      field('时间字号', 'timeSize', 'range', { min: 8, max: 200, unit: 'px' }),
      field('时间位置', 'timePosition', 'select', {
        options: [
          ['below', '名字下面'],
          ['beside', '名字旁边'],
        ],
      }),
    ],
    caption: [
      field('自定义文案', 'caption', 'textarea'),
      field('文案位置', 'captionPosition', 'select', {
        options: [
          ['above', '名字上方'],
          ['below', '名字下方'],
          ['hidden', '隐藏'],
        ],
      }),
      field('文案字体', 'captionFont', 'select', { options: fonts }),
      field('文案颜色', 'captionColor', 'color'),
      field('文案字号', 'captionSize', 'range', {
        min: 10,
        max: 26,
        unit: 'px',
      }),
    ],
    reasoning: [
      field('入口文字', 'reasoning'),
      field('思维字体', 'reasoningFont', 'select', { options: fonts }),
      field('入口字号', 'reasoningSize', 'range', {
        min: 12,
        max: 24,
        unit: 'px',
      }),
    ],
    decoration: [
      field('装饰图案', 'decoration', 'select', {
        options: [
          ['flower', '花朵'],
          ['star', '星星'],
          ['custom', '我的图片'],
          ['none', '不显示'],
        ],
      }),
      field('装饰大小', 'decorationWidth', 'range', {
        min: 20,
        max: 180,
        unit: 'px',
      }),
      field('距右边', 'decorationX', 'range', { min: 0, max: 100, unit: 'px' }),
      field('距顶部', 'decorationY', 'range', { min: 0, max: 160, unit: 'px' }),
      field('装饰透明度', 'decorationOpacity', 'range', {
        min: 0,
        max: 1,
        step: 0.05,
      }),
    ],
  };
  groups.global.push(
    field('卡片不透明度', 'surfaceOpacity', 'range', {
      min: 0,
      max: 1,
      step: 0.05,
    }),
  );
  groups.global.push(
    field('卡片最大宽度', 'cardWidth', 'range', {
      min: 320,
      max: 900,
      unit: 'px',
    }),
  );
  groups.avatar.push(
    field('时间字体', 'timeFont', 'select', {
      options: [['auto', '沿用当前字体'], ...fonts],
    }),
    field('文字区对齐', 'textAlign', 'select', {
      options: [
        ['start', '左对齐'],
        ['center', '居中'],
        ['end', '右对齐'],
      ],
    }),
    field('文字区两侧内缩', 'textInset', 'range', {
      min: 0,
      max: 20,
      unit: '%',
    }),
    field('文字区上方留白', 'textTop', 'range', {
      min: 0,
      max: 80,
      unit: 'px',
    }),
  );

  groups.avatar.find((f) => f.key === 'headerHeight').max = 1000;
  function validate(raw) {
    if (!raw || ![1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(raw.version))
      throw Error('方案版本不支持');
    if (
      raw.version < 10 &&
      raw.headerHeight !== undefined &&
      raw.headerHeight > 360
    )
      throw Error('旧头像区高度超出范围');
    if (raw.version < 8) {
      for (const [key, min, max] of [
        ['nameSize', 14, 34],
        ['timeSize', 10, 18],
      ])
        if (
          raw[key] !== undefined &&
          (!Number.isFinite(raw[key]) || raw[key] < min || raw[key] > max)
        )
          throw Error('旧字号超出范围');
    }
    if (raw.version >= 8 && Object.hasOwn(raw, 'timePosition'))
      throw Error('新版方案不能包含旧时间位置');
    if (
      raw.avatarDesign !== undefined &&
      !['unified', 'separate'].includes(raw.avatarDesign)
    )
      throw Error('头像设计对象无效');
    const hideScrollbars = normalizeScrollbars(raw.hideScrollbars);
    const canonical = normalizeCaptionConfig(raw),
      reasoning = normalizeReasoningConfig(raw),
      footer = normalizeFooterConfig(raw),
      native = normalizeNativeConfig(raw),
      result = { ...base, ...textSettings(raw), ...bodyCardSettings(raw) };
    for (const f of Object.values(groups).flat()) {
      const v = raw[f.key];
      if (v === undefined) continue;
      if (f.type === 'range') {
        if (!Number.isFinite(v) || v < f.min || v > f.max)
          throw Error('数值超出范围：' + f.label);
      } else if (f.type === 'color') {
        if (typeof v !== 'string' || !/^#[0-9a-f]{6}$/i.test(v))
          throw Error('颜色格式无效');
      } else if (f.type === 'select') {
        if (!f.options.some((o) => o[0] === v))
          throw Error('选项无效：' + f.label);
      } else if (typeof v !== 'string' || v.length > 300)
        throw Error('文案过长');
      result[f.key] = v;
    }
    if (raw.image) {
      if (!validEmbeddedImage(raw.image)) throw Error('图片格式不支持');
      result.image = raw.image;
    }
    if (Object.hasOwn(templates, raw.template)) result.template = raw.template;
    if (raw.layout !== undefined) {
      if (!['top', 'left', 'collage'].includes(raw.layout))
        throw Error('排版值无效');
      result.layout = raw.layout;
    }
    result.metadata = validateMetadata(raw.metadata);
    result.pageHeaders = normalizePageHeaders(raw).pageHeaders;
    result.pageStyle = normalizePageConfig(raw).pageStyle;
    result.commonStyle = normalizeCommonConfig(raw).commonStyle;
    result.avatarDesign = raw.avatarDesign || 'separate';
    Object.assign(result, normalizeCanvasBackground(raw));
    result.hideScrollbars = hideScrollbars;
    result.textItems = canonical.textItems;
    result.captions = canonical.captions;
    result.layers = migrateLayers(raw);
    result.photos = validatePhotos(raw.photos);
    result.reasoningStyle = reasoning.reasoningStyle;
    result.footerCaptions = footer.footerCaptions;
    result.nativeStyle = native.nativeStyle;
    result.version = raw.version >= 8 ? raw.version : 7;
    if (raw.version >= 8) delete result.timePosition;
    result.image = '';
    if (raw.surfaceOpacity === undefined && raw.glass > 0)
      result.surfaceOpacity = 0.81;
    for (const key of ['reasoning', 'reasoningFont', 'reasoningSize'])
      delete result[key];
    const scene = normalizeTextScene(stripLegacyCaptions(result));
    if (raw.regionOrder)
      scene.regionOrder = validateRegionOrder(raw.regionOrder, scene);
    return syncRegionOrder(
      normalizeAvatarFill(
        normalizeChromeConfig({
          ...scene,
          version: raw.version,
          ...(Object.hasOwn(raw, 'chromeStyle')
            ? { chromeStyle: raw.chromeStyle }
            : {}),
          ...(Object.hasOwn(raw, 'avatarFill')
            ? { avatarFill: raw.avatarFill }
            : {}),
        }),
      ),
    );
  }

  return { fonts, base, templates, field, groups, validate };
}
