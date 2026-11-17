import { newCaption } from './captions.mjs';
import { syncRegionOrder } from './region-layers.mjs';

export function avatarCombinationScheme(source, variant = 'rectangle') {
  const c = structuredClone(source), flat = variant === 'flat';
  c.avatarDesign = 'unified';
  c.headerHeight = flat ? 300 : 150;
  delete c.userHeaderHeight;
  c.textInset = 0; c.textTop = 0;
  c.nameFont = 'sans-serif'; c.nameSize = 18; c.nameColor = '#363a40';
  c.timeFont = 'sans-serif'; c.timeSize = 11; c.timeColor = '#707780';
  c.metadata = { design: 'unified', unified: { name: null, time: null }, roles: { ai: { name: null, time: null }, user: { name: null, time: null } } };
  for (const role of ['ai', 'user']) {
    c.avatarFill[role].enabled = false;
    Object.assign(c.photos[role], { enabled: false, size: flat ? 100 : 26, widthUnit: 'percent', height: flat ? 200 : 'auto', ratio: '0.75', radius: 0, frameWidth: 0, shadow: false, x: 0, y: 0, rotation: 0 });
  }
  Object.assign(c.textItems.name, { x: flat ? 0 : 33, y: flat ? 216 : 8, width: flat ? 43 : 67, weight: 600 });
  Object.assign(c.textItems.time, { x: flat ? 46 : 33, y: flat ? 221 : 42, width: flat ? 54 : 67 });
  const caption = newCaption({ id: 'default-caption', content: '这里放一行自定义文案', font: 'sans-serif', size: 13, color: '#707780', x: flat ? 0 : 33, y: flat ? 252 : 75, width: flat ? 100 : 67 });
  delete caption.position;
  c.captions = [caption];
  return syncRegionOrder(c);
}

export function defaultReadingScheme(source) {
  const c = avatarCombinationScheme(source);
  const { actions, stats, swipe } = c.nativeStyle;
  actions.size = 12;
  for (const key of ['edit', 'more']) Object.assign(actions[key], { position: 'footer', anchor: 'top', y: 32, mode: 'text' });
  actions.edit.x = -9; actions.more.x = 12;
  stats.size = 11;
  for (const [key, anchor] of [['floor', 'left'], ['tokens', 'center'], ['time', 'right']]) Object.assign(stats[key], { position: 'footer', anchor, x: 0, y: 0 });
  stats.tokens.label = { text: 'Token ', style: null, gap: 0 };
  stats.time.label = { text: '生成 ', style: null, gap: 0 };
  Object.assign(swipe, { size: 12, position: 'footer', layout: 'compact', hideHistory: false, gap: 16, x: 50, y: 32 });
  Object.assign(swipe.left, { mode: 'text', text: '上一版' });
  Object.assign(swipe.right, { mode: 'text', text: '下一版' });
  c.footerCaptions = [];
  return syncRegionOrder(c);
}
