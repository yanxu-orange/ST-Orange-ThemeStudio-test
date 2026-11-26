import { BUILTIN_TEMPLATE_NOTICE } from './builtin-template-library.mjs';

export function createWorkLibrary({ shadow, builtins, storage, snapshot, builtinPreview, onOpen, onBuiltin, onImport, onMessage }) {
  const document = shadow.ownerDocument;
  const make = (tag, text) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const style = make('style');
  const previewStyle='.work-library-preview{display:block;margin:0 0 10px}.spring-work-thumbnail{min-height:150px;display:flex;align-items:center;justify-content:center;gap:clamp(10px,5vw,30px);padding:10px 20px;background:linear-gradient(115deg,#fff9fb,#faeee9);border:1px solid #ead5db;overflow:hidden}.spring-work-thumbnail span{font:30px/.94 Georgia,serif;letter-spacing:.035em;white-space:pre-line;color:#a94d6b}.spring-work-thumbnail img{width:clamp(68px,25%,122px);height:132px;object-fit:contain}.work-library [data-work-action=open]{background:#526c5c;border-color:#526c5c;color:#fff}.work-library-manage summary{cursor:pointer;color:#5f695f;padding:6px 2px;min-height:40px;align-content:center}.work-library-heading [data-work-library=close]{border-color:transparent}';
  style.textContent = '.work-library{position:fixed;inset:0;height:100dvh;box-sizing:border-box;z-index:20200;overflow:auto;padding:20px;background:#f5f5ef;color:#303330;font:14px/1.5 system-ui}.work-library[hidden]{display:none}.work-library-card{max-width:640px;margin:0 auto}.work-library-heading,.work-library-tabs,.work-library-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.work-library-heading{justify-content:space-between}.work-library h2{margin:0;font-size:16px;font-weight:600}.work-library-tabs{margin:16px 0}.work-library button{min-height:40px;padding:7px 12px}.work-library [aria-selected=true]{background:#344d3e;color:#fff}.work-library-create{display:flex;gap:8px;align-items:end;flex-wrap:wrap;margin:16px 0}.work-library-create[hidden]{display:none}.work-library-create label{flex:1;min-width:180px}.work-library input{display:block;box-sizing:border-box;width:100%;min-height:42px;padding:8px;border:1px solid #b6c3b5;border-radius:0;background:#fff;color:#303330}.work-library-list{display:grid;gap:10px}.work-library-item{padding:12px;border:1px solid #d4ddd0;border-radius:0;background:#fffdf8}.work-library-name{font-size:14px;font-weight:600;margin:0 0 8px;overflow-wrap:anywhere}.work-library p{font-size:12px}.work-library-status{min-height:1.5em}.work-library-badge{font-size:12px;font-weight:400;padding:2px 6px;border-radius:0;background:#e8eee6}';
  style.textContent += previewStyle;
  const panel = make('section');
  panel.className = 'work-library';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', '作品库');
  const card = make('div'); card.className = 'work-library-card';
  const heading = make('div'); heading.className = 'work-library-heading';
  const back = make('button', '返回编辑'); back.type = 'button'; back.dataset.workLibrary = 'close';
  const headingText = make('h2', '作品库');
  const importButton = make('button', '导入方案');
  importButton.type = 'button';
  importButton.dataset.workLibrary = 'import';
  heading.append(headingText, importButton, back);
  const create = make('div'); create.className = 'work-library-create';
  const nameLabel = make('label', '作品名称'), name = make('input');
  name.type = 'text'; name.setAttribute('aria-label', '新作品名称'); nameLabel.append(name);
  const saveNew = make('button', '保存为新作品'); saveNew.type = 'button'; saveNew.dataset.workLibrary = 'save-new';
  create.append(nameLabel, saveNew);
  const status = make('p'); status.className = 'work-library-status'; status.setAttribute('role', 'status');
  const list = make('div'); list.className = 'work-library-list'; list.setAttribute('aria-label', '作品列表');
  card.append(heading, create, status, list); panel.append(card); shadow.append(style, panel);
  let busy = false, epoch = 0, opener, mode = 'library', onBack;
  function confirm(message) { return document.defaultView?.confirm?.(message) !== false; }
  function announce(message) { status.textContent = message; onMessage?.(message); }
  function setBusy(value) {
    busy = value;
    for (const button of panel.querySelectorAll('button')) if (button !== back || mode === 'create') button.disabled = value;
  }
  function row(item, kind) {
    const element = make('div'); element.className = 'work-library-item'; element.dataset.workId = item.id;
    const title = make('h3', item.name); title.className = 'work-library-name';
    const actions = make('div'); actions.className = 'work-library-actions';
    const open = make('button', '预览作品'); open.type = 'button'; open.dataset.workAction = 'open';
    open.addEventListener('click', () => run(async token => {
      if (kind === 'builtin') {
        if (onBuiltin(item.id) !== false) hide();
      } else {
        const json = await storage.load(item.id);
        if (token !== epoch || panel.hidden) return;
        if (json === null) throw new Error('该作品已不存在。');
        if (onOpen(json, item.name) !== false) hide();
      }
    }));
    actions.append(open);
    const manage = make('details'); manage.className = 'work-library-manage';
    const tools = make('div'); tools.className = 'work-library-actions';
    manage.append(make('summary', '管理作品'), tools);
    if (kind === 'custom' && mode === 'library') {
      const save = make('button', '覆盖保存'); save.type = 'button'; save.dataset.workAction = 'save';
      save.addEventListener('click', () => {
        if (!confirm(`用当前草稿覆盖「${item.name}」？`)) return;
        run(async () => {
          const json = snapshot();
          await storage.save({ id: item.id, name: item.name, json });
          await refresh(); announce(`已保存「${item.name}」。`);
        });
      });
      tools.append(save);
    }
    const remove = make('button', '删除'); remove.type = 'button'; remove.dataset.workAction = 'delete';
    remove.addEventListener('click', () => {
      const question = kind === 'builtin'
        ? `从本机内置列表删除「${item.name}」？`
        : `删除「${item.name}」？删除后无法恢复。`;
      if (!confirm(question)) return;
      run(async () => {
        if (kind === 'builtin') {
          if (!builtins.remove(item.id)) throw new Error('内置作品列表未能保存。');
        } else await storage.remove(item.id);
        await refresh(); announce(kind === 'builtin' ? `已从本机内置列表移除「${item.name}」。` : `已删除「${item.name}」。`);
      });
    });
    if (mode === 'library') tools.append(remove);
    element.append(title);
    if (kind === 'builtin') {
      const badge = make('span', '内置'); badge.className = 'work-library-badge'; title.append(' ', badge);
      const preview = builtinPreview?.(item.id);
      if(preview){const figure=make('div');figure.className='work-library-preview';figure.append(preview);element.append(figure);}
      const notice = make('p', BUILTIN_TEMPLATE_NOTICE); element.append(notice);
    }
    element.append(actions);
    if(mode==='library')element.append(manage);
    return element;
  }
  async function refresh() {
    const token = ++epoch;
    list.replaceChildren();
    const customItems = await storage.list();
    if (token !== epoch) return;
    const builtinItems = builtins.list();
    if (!builtinItems.length && !customItems.length) list.append(make('p', '还没有作品'));
    for (const item of builtinItems) list.append(row(item, 'builtin'));
    for (const item of customItems) list.append(row(item, 'custom'));
  }

  async function run(action) {
    if (busy) return;
    setBusy(true);
    try { await action(epoch); }
    catch (error) { announce('操作未完成：' + error.message); }
    finally { setBusy(false); }
  }
  async function show(source, { view = 'library', onCancel } = {}) {
    if (busy) return;
    opener = source;
    onBack = onCancel;
    mode = view;
    panel.hidden = false;
    headingText.textContent = view === 'create' ? '另存为作品' : '作品库';
    panel.setAttribute('aria-label', headingText.textContent);
    back.textContent = view === 'create' ? '取消' : view === 'start' ? '返回工坊首页' : '返回编辑';
    importButton.hidden = view !== 'start';
    name.value = '';
    create.hidden = view === 'start';
    list.hidden = view === 'create';
    saveNew.textContent = view === 'create' ? '保存作品' : '保存为新作品';
    status.textContent = '';
    if (view === 'create') name.focus?.();
    else {
      await run(() => refresh());
      if (!panel.hidden) back.focus?.();
    }
  }
  function hide() {
    ++epoch;
    panel.hidden = true;
    const menu=opener?.closest?.('.desktop-scheme');
    const target=menu&&!menu.open?menu.querySelector('summary'):opener;
    target?.focus?.({preventScroll:true});
  }
  function cancel() {
    const callback = onBack;
    hide();
    callback?.();
  }
  back.addEventListener('click', cancel);
  importButton.addEventListener('click', () => {
    if (!busy) onImport?.();
  });
  saveNew.addEventListener('click', () => run(async token => {
    const title = name.value.trim();
    if (!title) { name.focus?.(); throw new Error('请填写作品名称。'); }
    await storage.save({ name: title, json: snapshot() });
    if (token !== epoch || panel.hidden) return;
    name.value = '';
    if (mode === 'create') hide();
    else await refresh();
    announce(`已保存「${title}」。`);
  }));
  panel.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel.hidden && !busy) { event.preventDefault(); cancel(); } });
  return { show, hide };
}
