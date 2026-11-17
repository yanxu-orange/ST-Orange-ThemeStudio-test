import { BUILTIN_TEMPLATE_NOTICE } from './builtin-template-library.mjs';

export function createCombinationLibrary({ shadow, storageForRegion, capture, apply, preview, builtins = () => [], visibilityStorage = globalThis.localStorage, onMessage }) {
  const document = shadow.ownerDocument;
  const make = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const button = (text, action, handler) => {
    const node = make('button', text); node.type = 'button'; node.dataset.comboAction = action;
    node.addEventListener('click', handler); return node;
  };
  const style = make('style');
  style.textContent = `.combination-library{position:fixed;inset:0;height:100dvh;z-index:20210;overflow:auto;padding:16px;background:#f3f4f5;color:#30343a;font:14px/1.5 system-ui;box-sizing:border-box}.combination-library[hidden],.combination-library [hidden]{display:none}.combination-library-inner{max-width:640px;margin:auto}.combination-library h2{font-size:16px;margin:0}.combination-heading,.combination-create,.combination-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.combination-heading{justify-content:space-between}.combination-create{margin:16px 0}.combination-create label{flex:1;min-width:170px}.combination-library input{display:block;box-sizing:border-box;width:100%;font:14px system-ui;padding:10px;min-height:44px;border:1px solid #ccd0d5;border-radius:0;background:#fff;color:#30343a}.combination-library button,.combination-library summary{font:14px system-ui;min-height:44px;padding:10px;box-sizing:border-box;cursor:pointer}.combination-list{display:grid;gap:12px}.combination-item{padding:12px;background:#fff;border:1px solid #d7dade;border-radius:0}.combination-item h3{font-size:14px;margin:8px 0;overflow-wrap:anywhere}.combination-preview{width:100%;min-height:90px;overflow:hidden;background:#f7f8f9;border:0;border-radius:0}.combination-preview>*{max-width:100%}.combination-item details{margin-left:auto}.combination-item details[open]{width:100%;margin-top:8px}.combination-item details input{margin:8px 0}.combination-status{min-height:21px;margin:8px 0}.combination-conflict{padding:12px;border:1px solid #b7bec7;border-radius:0;background:#fff}.combination-conflict p{margin:0 0 8px}.combination-view{margin:12px 0}.combination-view .combination-preview{min-height:160px}`;
  style.textContent += `.combination-library.is-picker{position:relative;inset:auto;height:auto;z-index:auto;overflow:visible;padding:12px;margin:8px 0 16px;border:1px solid #d7dade;background:#f7f8f9}.is-picker .combination-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;max-height:320px;overflow:auto;margin-top:12px}.is-picker .combination-list>h3,.is-picker .combination-list>p{grid-column:1/-1;margin:0;font-size:12px}.is-picker .combination-item{min-width:0;padding:8px}.is-picker .combination-item.is-selected{border-color:#68618d;box-shadow:inset 0 0 0 1px #68618d}.is-picker .combination-preview{padding:0;min-height:90px}.is-picker .combination-status:empty{display:none}.combination-picker-actions{display:flex;justify-content:flex-end;margin-top:12px}.is-picker .combination-heading{gap:8px}.is-picker .combination-heading h2{font-size:14px;flex:1 1 100%}`;
  const panel = make('section', undefined, 'combination-library'); panel.hidden = true;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-label', '我的组合');
  const inner = make('div', undefined, 'combination-library-inner');
  const heading = make('div', undefined, 'combination-heading'), title = make('h2', '我的组合');
  const back = button('返回编辑', 'close', () => hide());
  const manage = button('管理组合', 'manage', () => show(context, opener, { returnToPicker: true }));
  heading.append(title, manage, back);
  const create = make('div', undefined, 'combination-create'), label = make('label', '组合名称'), name = make('input');
  name.type = 'text'; name.setAttribute('aria-label', '组合名称'); label.append(name);
  const save = button('保存当前组合', 'save-current', () => run(async token => {
    const nextName = name.value.trim();
    if (!nextName) { name.focus?.(); throw Error('请填写组合名称。'); }
    const value = await capture({ ...context });
    if (!current(token)) return;
    await saveNamed(nextName, JSON.stringify(value), undefined, token);
  }));
  create.append(label, save);
  const status = make('p', '', 'combination-status'); status.setAttribute('role', 'status');
  const conflict = make('div', undefined, 'combination-conflict'); conflict.hidden = true;
  const view = make('div', undefined, 'combination-view'); view.hidden = true;
  const list = make('div', undefined, 'combination-list');
  const pickerActions = make('div', undefined, 'combination-picker-actions');
  const useSelected = button('套用', 'apply-selected', () => run(async token => {
    if (!selected) return;
    const value = await selected.load();
    if (current(token)) await selected.use(value, token);
  }));
  pickerActions.append(useSelected);
  inner.append(heading, create, status, conflict, view, list, pickerActions); panel.append(inner); shadow.append(style, panel);
  let context, storage, opener, epoch = 0, busy = false, observer, pending, selected, picker = false, returnToPicker = false;
  const hiddenKey = 'orange.theme-lab.hidden-combinations.v1';
  function hiddenBuiltins() {
    const value = visibilityStorage?.getItem(hiddenKey);
    if (!value) return [];
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.some(id => typeof id !== 'string')) throw Error('内置组合列表记录无效。');
    return parsed;
  }
  function hideBuiltin(id) {
    if (!visibilityStorage?.setItem) throw Error('内置组合列表未能保存。');
    visibilityStorage.setItem(hiddenKey, JSON.stringify([...new Set([...hiddenBuiltins(), id])]));
  }
  const current = token => token === epoch && !panel.hidden;
  const confirm = text => document.defaultView?.confirm?.(text) === true;
  function announce(text) { status.textContent = text; onMessage?.(text); }
  function disable(value) {
    busy = value;
    for (const node of panel.querySelectorAll('button,input')) if (node !== back) node.disabled = value;
    useSelected.disabled = value || !selected;
  }
  async function run(action) {
    if (busy || panel.hidden) return;
    const token = epoch; disable(true);
    try { await action(token); }
    catch (error) { if (current(token)) announce('操作未完成：' + error.message); }
    finally { if (current(token)) disable(false); }
  }
  async function write(record, token) {
    const target = storage;
    await target.save(record);
    if (!current(token)) return;
    conflict.hidden = true; pending = null; name.value = '';
    await refresh(token); if (current(token)) announce(`已保存「${record.name}」。`);
  }
  async function saveNamed(nextName, json, id, token) {
    const items = await storage.list(); if (!current(token)) return;
    const same = items.find(item => item.name === nextName && item.id !== id);
    if (!same) return write({ ...(id ? { id } : {}), name: nextName, json }, token);
    pending = { name: nextName, json, same, id };
    const alternate = make('input'); alternate.value = nextName + ' 副本'; alternate.setAttribute('aria-label', '另存名称');
    conflict.replaceChildren(make('p', `已有「${nextName}」`), alternate);
    conflict.append(button('覆盖已有组合', 'replace-duplicate', () => run(async nextToken => {
      if (!pending) return;
      const value = pending;
      await write({ id: value.same.id, name: value.name, json: value.json }, nextToken);
    })), button('换名另存', 'rename-duplicate', () => run(async nextToken => {
      const title = alternate.value.trim(); if (!title) throw Error('请填写组合名称。');
      if (pending) await saveNamed(title, pending.json, undefined, nextToken);
    })), button('取消', 'cancel-duplicate', () => { conflict.hidden = true; pending = null; }));
    conflict.hidden = false;
  }
  function draw(container, value) {
    container.replaceChildren();
    const node = preview?.(value, { ...context });
    if (node) container.append(node);
  }
  function row(item, builtin, token) {
    const element = make('article', undefined, 'combination-item'); element.dataset.comboId = item.id;
    const thumbnail = button('查看组合', 'preview', () => run(async nextToken => {
      if (picker) {
        selected = { load, use };
        for (const card of list.querySelectorAll('.combination-item')) {
          card.classList.toggle('is-selected', card === element);
          card.querySelector('[data-combo-action=preview]').setAttribute('aria-pressed', String(card === element));
        }
        return;
      }
      const value = await load(); if (!current(nextToken)) return;
      view.replaceChildren();
      const large = make('div', undefined, 'combination-preview'); draw(large, value);
      view.append(make('h3', item.name + ' · 布局示意'), large, button(`套用到${context.label}`, 'apply-preview', () => run(t => use(value, t))), button('返回列表', 'close-preview', () => { view.hidden = true; list.hidden = false; }));
      view.hidden = false; list.hidden = true;
    })); thumbnail.className = 'combination-preview'; thumbnail.setAttribute('aria-label', `预览 ${item.name}`);
    if (picker) thumbnail.setAttribute('aria-pressed', 'false');
    let loaded;
    async function load() {
      if (loaded) return loaded;
      const json = builtin ? null : await storage.load(item.id);
      if (!builtin && json === null) throw Error('该组合已不存在。');
      loaded = builtin ? item.combination : JSON.parse(json); return loaded;
    }
    async function use(value, nextToken) {
      if (!current(nextToken)) return;
      const accepted = await apply(value, { ...context });
      if (current(nextToken) && accepted !== false) hide();
    }
    const actions = make('div', undefined, 'combination-actions');
    actions.append(button(`套用到${context.label}`, 'apply', () => run(async nextToken => {
      const value = await load(); if (current(nextToken)) await use(value, nextToken);
    })));
    if (builtin) {
      const more = make('details'), summary = make('summary', '更多');
      more.append(summary, button('删除', 'delete', () => {
        if (!confirm(`从本机内置组合删除「${item.name}」？删除后不再显示。`)) return;
        run(async nextToken => { hideBuiltin(item.id); await refresh(nextToken); if (current(nextToken)) announce(`已删除「${item.name}」。`); });
      })); actions.append(more);
    } else {
      const more = make('details'), summary = make('summary', '更多');
      const rename = make('input'); rename.value = item.name; rename.setAttribute('aria-label', `重命名 ${item.name}`);
      more.append(summary, rename,
        button('重命名', 'rename', () => run(async nextToken => {
          const nextName = rename.value.trim(); if (!nextName) throw Error('请填写组合名称。');
          const value = await load(); if (!current(nextToken)) return;
          const items = await storage.list(); if (!current(nextToken)) return;
          if (items.some(other => other.id !== item.id && other.name === nextName)) throw Error('已有同名组合，请换一个名称。');
          await write({ id: item.id, name: nextName, json: JSON.stringify(value) }, nextToken);
        })),
        button('另存为', 'save-copy', () => run(async nextToken => {
          const nextName = rename.value.trim(); if (!nextName) throw Error('请填写组合名称。');
          const value = await load(); if (current(nextToken)) await saveNamed(nextName, JSON.stringify(value), undefined, nextToken);
        })),
        button('覆盖保存', 'overwrite', () => {
          if (!confirm(`用当前${context.label}覆盖「${item.name}」？`)) return;
          run(async nextToken => { const value = await capture({ ...context }); if (current(nextToken)) await write({ id: item.id, name: item.name, json: JSON.stringify(value) }, nextToken); });
        }),
        button('删除', 'delete', () => {
          if (!confirm(`永久删除「${item.name}」？删除后无法恢复。`)) return;
          run(async nextToken => { await storage.remove(item.id); if (current(nextToken)) { await refresh(nextToken); announce(`已删除「${item.name}」。`); } });
        })); actions.append(more);
    }
    actions.hidden = picker;
    element.append(thumbnail, make('h3', item.name), actions);
    const paint = async () => { try { const value = await load(); if (current(token) && element.isConnected) draw(thumbnail, value); } catch (error) { if (current(token)) thumbnail.textContent = '预览未能读取'; } };
    if (observer) { element._paint = paint; observer.observe(element); } else queueMicrotask(paint);
    return element;
  }
  async function refresh(token) {
    selected = null; useSelected.disabled = true;
    observer?.disconnect(); list.replaceChildren(); view.hidden = true; list.hidden = false;
    const items = await storage.list(); if (!current(token)) return;
    const available = await builtins({ ...context }); if (!current(token)) return;
    const removed = hiddenBuiltins(), defaults = available.filter(item => !removed.includes(item.id));
    if (defaults.length) { list.append(make('h3', '内置组合'), make('p', BUILTIN_TEMPLATE_NOTICE)); for (const item of defaults) list.append(row(item, true, token)); }
    list.append(make('h3', '我的组合'));
    if (!items.length) list.append(make('p', '还没有保存的组合'));
    for (const item of items) list.append(row(item, false, token));
  }
  async function show(nextContext, source, options = {}) {
    opener?.setAttribute('aria-expanded', 'false');
    picker = options.picker === true && !!source?.parentNode; returnToPicker = options.returnToPicker === true; selected = null;
    panel.classList.toggle('is-picker', picker);
    panel.setAttribute('role', picker ? 'region' : 'dialog');
    if (picker) panel.removeAttribute('aria-modal'); else panel.setAttribute('aria-modal', 'true');
    create.hidden = picker; manage.hidden = !picker; pickerActions.hidden = !picker;
    back.textContent = picker ? '收起' : returnToPicker ? '返回选择' : '返回编辑';
    if (picker) source.after(panel); else shadow.append(panel);
    ++epoch; context = { ...nextContext }; storage = storageForRegion(context.region); opener = source;
    title.textContent = context.label + ' · 我的组合'; name.value = ''; status.textContent = ''; conflict.hidden = true; pending = null;
    panel.hidden = false; busy = false;
    if (picker) opener.setAttribute('aria-expanded', 'true');
    observer?.disconnect();
    const Observe = document.defaultView?.IntersectionObserver;
    observer = Observe ? new Observe(entries => { for (const entry of entries) if (entry.isIntersecting) { observer.unobserve(entry.target); entry.target._paint?.(); } }, { root: picker ? list : panel, rootMargin: '200px' }) : null;
    const token = epoch; await run(refresh); if (current(token)) back.focus?.();
  }
  function hide({ focus = true } = {}) { ++epoch; panel.hidden = true; busy = false; observer?.disconnect(); pending = null; selected = null; opener?.setAttribute('aria-expanded', 'false'); if (focus) opener?.focus?.(); }
  back.addEventListener('click', () => { if (returnToPicker && opener?.isConnected) show(context, opener, { picker: true }); });
  function toggle(nextContext, source) {
    if (picker && !panel.hidden && opener === source) { hide(); return; }
    return show(nextContext, source, { picker: true });
  }
  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); hide(); }
    if (event.key === 'Tab' && !picker) {
      const nodes = [...panel.querySelectorAll('button,input,summary')].filter(node => !node.disabled && !node.closest('[hidden]') && (!node.closest('details') || node.tagName === 'SUMMARY' || node.closest('details').open));
      const first = nodes[0], last = nodes.at(-1), focused = shadow.activeElement || document.activeElement;
      if (event.shiftKey && focused === first) { event.preventDefault(); last?.focus?.(); }
      else if (!event.shiftKey && focused === last) { event.preventDefault(); first?.focus?.(); }
    }
  });
  return { show, hide, toggle };
}
