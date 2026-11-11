import {createAssetLibrary} from './asset-library.mjs';
import {prepareImageUpload} from './image-processing.mjs';
import {iconGroups, iconUrl} from './icon-catalog.mjs';

export const ICON_LIBRARY_DB = 'orange.theme-lab.mobile-test.icons.v1';
export function createIconLibrary(options = {}) {
  return createAssetLibrary({...options, databaseName: ICON_LIBRARY_DB});
}
export const ICON_LIBRARY_CSS = `
.icon-library-tabs{display:flex;gap:8px;margin-bottom:12px}.icon-library-tabs button[aria-selected="true"]{font-weight:700;outline:2px solid currentColor}
.icon-library-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:10px}.icon-library-card{min-width:0;display:flex;flex-direction:column;gap:6px}.icon-library-use{display:flex;flex-direction:column;align-items:center;gap:8px;padding:12px 6px;min-height:90px;width:100%;overflow-wrap:anywhere}.icon-library-use img{width:32px;height:32px;object-fit:contain}.icon-library-help,.icon-library-status{font-size:12px;line-height:1.6}.icon-library-group{margin:12px 0 8px}.icon-library-upload{display:block;margin:12px 0}.icon-library-results{font-size:12px;overflow-wrap:anywhere}
`;
const owners = new WeakMap();

/** Returns a disposer: call it when closing the containing editor. Each render
 * also invalidates the preceding render, including pending file reads. */
export function renderIconLibrary(container, {library, tab = 'builtin', onTab,
  isCurrent = () => true, onUse, onError = () => {}, prepareUpload = prepareImageUpload,
  confirmRemove = message => globalThis.confirm(message)} = {}) {
  owners.get(container)?.();
  const controller = new AbortController();
  let active = true, busy = false, listing = 0;
  const valid = () => active && isCurrent() && owners.get(container) === dispose;
  function dispose() { active = false; controller.abort(); }
  owners.set(container, dispose);
  container.replaceChildren();
  const doc = container.ownerDocument;
  function el(tag, text, className) {
    const node = doc.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function button(text, handler, className) {
    const node = el('button', text, className); node.type = 'button';
    node.addEventListener('click', handler); return node;
  }
  const tabs = el('div', '', 'icon-library-tabs'); tabs.setAttribute('role', 'tablist');
  for (const [key, label] of [['builtin', '内置'], ['mine', '我的']]) {
    const item = button(label, () => {
      if (!valid() || key === tab) return;
      dispose();
      if (onTab) onTab(key);
      else renderIconLibrary(container, {library, tab: key, isCurrent, onUse, onError, prepareUpload, confirmRemove});
    });
    item.setAttribute('role', 'tab'); item.setAttribute('aria-selected', String(key === tab));
    tabs.append(item);
  }
  container.append(tabs, el('p', '内置图标默认使用统一颜色；上传图标默认保留原图颜色。整体染色依赖图片透明度（Alpha），不会去除不透明背景，也不会保留原图多色；实色背景可能变成整块颜色。', 'icon-library-help'));
  const status = el('p', '', 'icon-library-status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  container.append(status);
  function fail(error) {
    if (!valid()) return;
    status.textContent = error?.message || '图标库操作失败，请重试。';
    onError(error);
  }
  async function use(value) {
    if (!valid() || busy) return;
    try { await onUse?.(value); } catch (error) { fail(error); }
  }
  function card(name, src, value) {
    const node = el('div', '', 'icon-library-card');
    const select = button('', () => use(value), 'icon-library-use');
    select.setAttribute('aria-label', `使用图标：${name}`);
    const img = el('img'); img.src = src; img.alt = ''; img.loading = 'lazy';
    select.append(img, el('span', name)); node.append(select); return node;
  }
  if (tab === 'builtin') {
    for (const group of iconGroups()) {
      const title = el('h4', group.name, 'icon-library-group');
      const grid = el('div', '', 'icon-library-grid');
      for (const item of group.icons) grid.append(card(item.name, iconUrl(item.id), {icon: item.id, name: item.name, tint: true}));
      container.append(title, grid);
    }
    return dispose;
  }
  const label = el('label', '上传图标（可多选）', 'icon-library-upload');
  const upload = el('input'); upload.type = 'file'; upload.multiple = true;
  upload.accept = '.png,.apng,.jpg,.jpeg,.webp,.gif,image/png,image/apng,image/jpeg,image/webp,image/gif';
  upload.setAttribute('aria-label', '上传图标（可多选）'); label.append(upload);
  const results = el('ul', '', 'icon-library-results');
  const grid = el('div', '', 'icon-library-grid');
  const retry = button('重新加载图标库', () => { if (valid() && !busy) { status.textContent = ''; refresh(); } }); retry.hidden = true;
  container.append(label, el('p', '支持 PNG / APNG、JPG、WebP、GIF；不支持上传 SVG。图标只保存在当前浏览器中，使用时会复制到方案，删除库中图标不影响已应用的方案。', 'icon-library-help'), results, retry, grid);
  async function refresh() {
    const request = ++listing;
    try {
      const records = await library.list();
      if (!valid() || request !== listing) return;
      retry.hidden = true; grid.replaceChildren();
      if (!records.length) grid.append(el('p', '还没有上传图标。'));
      for (const record of records) {
        const node = card(record.name, record.image, {icon: '', image: record.image, name: record.name, tint: false});
        node.append(button('删除', async () => {
          if (!valid() || busy) return;
          busy = true;
          try {
            const confirmed = await confirmRemove(`删除“${record.name}”？只删除图标库中的原素材，已应用的方案不受影响。`);
            if (!confirmed || !valid()) return;
            await library.remove(record.id);
            if (!valid()) return;
            status.textContent = '图标已从库中删除，已应用的方案不受影响。';
            await refresh();
          } catch (error) { fail(error); }
          finally { busy = false; }
        })); grid.append(node);
      }
    } catch (error) { if (valid() && request === listing) { retry.hidden = false; fail(error); } }
  }
  upload.addEventListener('change', async () => {
    if (!valid() || busy) return;
    const files = Array.from(upload.files || []); upload.value = '';
    if (!files.length) return;
    busy = true; upload.disabled = true; results.replaceChildren();
    let success = 0, failed = 0;
    for (const file of files) {
      if (!valid()) break;
      const row = el('li', `${file.name}：正在读取…`); results.append(row);
      try {
        if (/\.svg$/i.test(file.name || '') || file.type === 'image/svg+xml') throw new Error('不支持上传 SVG，请使用 PNG / APNG、JPG、WebP 或 GIF。');
        const prepared = await prepareUpload(file, {valid, signal: controller.signal});
        if (!valid() || !prepared) break;
        await library.add({name: file.name?.slice(0, 80) || '我的图标', image: prepared.image});
        if (!valid()) break;
        success++; row.textContent = `${file.name}：已保存，点击图标使用。`;
      } catch (error) {
        if (!valid()) break;
        failed++; row.textContent = `${file.name}：${error?.message || '保存失败，请重新上传重试。'}`;
        fail(error);
      }
    }
    busy = false;
    if (!valid()) return;
    upload.disabled = false;
    status.textContent = `上传完成：成功 ${success} 个，失败 ${failed} 个。${failed ? '失败项可重新选择文件重试。' : '点击图标放入当前目标。'}`;
    await refresh();
  });
  refresh();
  return dispose;
}
