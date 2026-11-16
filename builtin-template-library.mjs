export const BUILTIN_TEMPLATE_KEY = 'orange.theme-lab.hidden-builtins.v1';
export const BUILTIN_TEMPLATE_NOTICE = '内置作品可删除，请勿二传，禁止商业化。';
export const BUILTIN_TEMPLATES = Object.freeze([
  { id: 'jinghai', name: '移动-京海日报' },
  { id: 'spring', name: '移动-春日来信' },
]);

export function createBuiltinTemplateLibrary({ document, availableIds, getCurrent, onMessage, storage = globalThis.localStorage }) {
  const available = BUILTIN_TEMPLATES.filter(item => availableIds.includes(item.id));
  let hidden = [];
  try {
    const value = JSON.parse(storage?.getItem(BUILTIN_TEMPLATE_KEY) || '[]');
    if (Array.isArray(value)) hidden = value.filter(id => BUILTIN_TEMPLATES.some(item => item.id === id));
  } catch (error) {
    onMessage('内置作品列表未能读取：' + error.message);
  }
  const views = [];
  function render(view) {
    const selected = view.current ? getCurrent() : view.select.value;
    view.currentId = selected;
    const visible = available.filter(item => !hidden.includes(item.id));
    view.select.replaceChildren();
    if ((view.current && !visible.some(item => item.id === selected)) || !visible.length) {
      const empty = document.createElement('option');
      empty.value = '';
      empty.textContent = visible.length ? '选择内置作品' : '暂无内置作品';
      empty.disabled = true;
      view.select.append(empty);
    }
    for (const { id, name } of visible) {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = name;
      view.select.append(option);
    }
    view.select.value = visible.some(item => item.id === selected) ? selected : view.current ? '' : visible[0]?.id || '';
    view.onAvailability?.(visible.length > 0);
  }
  function sync() { for (const view of views) render(view); }
  function saveHidden(next) {
    try {
      if (!storage) throw new Error('浏览器存储不可用');
      storage.setItem(BUILTIN_TEMPLATE_KEY, JSON.stringify(next));
      hidden = next;
      sync();
      return true;
    } catch (error) {
      onMessage('内置作品列表未保存：' + error.message);
      return false;
    }
  }
  function attach(select, { current = false, onAvailability } = {}) {
    const view = { select, current, onAvailability };
    views.push(view);
    render(view);
  }
  return {
    list() { return available.filter(item => !hidden.includes(item.id)).map(item => ({ ...item })); },
    remove(id) {
      if (!available.some(item => item.id === id)) return false;
      return saveHidden([...new Set([...hidden, id])]);
    },
    attach, syncCurrent() { for (const view of views) if (view.current && view.currentId !== getCurrent()) render(view); } };
}
