// Export names belong to the download, never to the saved scheme model.
export function exportFilename(value) {
  const name = String(value ?? '').trim().replace(/(?:\.json)+$/i, '')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').replace(/[. ]+$/g, '').trim();
  if (!name) throw new Error('请填写方案名称。');
  if (name.length > 100) throw new Error('方案名称不能超过100个字符。');
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name))
    throw new Error('请换一个方案名称。');
  return name + '.json';
}

export function requestExportName({document, root, trigger, value = '绘境方案'}) {
  return new Promise(resolve => {
    const make = (tag, text) => {const n = document.createElement(tag); if (text) n.textContent = text; return n;};
    const dialog = make('dialog'); dialog.className = 'otl-export-name'; dialog.setAttribute('aria-label', '导出方案');
    const style = make('style');
    style.textContent = `.otl-export-name{box-sizing:border-box;width:min(380px,calc(100vw - 24px));max-height:calc(100dvh - 24px);overflow:auto;margin:auto;padding:20px;border:1px solid #dce3e1;border-radius:0;background:#fffdf8;color:#34443e;font:14px/1.5 system-ui,sans-serif;box-shadow:0 12px 44px #172b2526}.otl-export-name::backdrop{background:#152c2638}.otl-export-name *{box-sizing:border-box}.otl-export-name h3{font-size:17px;margin:0 0 16px}.otl-export-name label{display:grid;gap:6px}.otl-export-name .name-row{display:flex;gap:8px;align-items:center}.otl-export-name input{width:100%;min-width:0;min-height:44px;border:1px solid #dce3e1;background:white;padding:8px;font:inherit;color:inherit}.otl-export-name button{min-height:44px;border:1px solid #dce3e1;background:white;padding:8px 16px;font:inherit;color:inherit;cursor:pointer}.otl-export-name .export-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}.otl-export-name .primary{background:#4e6e5d;color:white;border-color:#4e6e5d}.otl-export-name .export-error{min-height:21px;margin-top:6px;color:#a13e3e}.otl-export-name :focus-visible{outline:2px solid #507c69;outline-offset:2px}`;
    const title = make('h3', '导出方案'), form = make('form'), label = make('label', '方案名称'), row = make('div'); row.className = 'name-row';
    const input = make('input'); input.type = 'text'; input.maxLength = 110; input.value = value; input.setAttribute('aria-label', '导出方案名称');
    row.append(input, make('span', '.json')); label.append(row);
    const error = make('div'); error.className = 'export-error'; error.setAttribute('role', 'status');
    const actions = make('div'); actions.className = 'export-actions';
    const cancel = make('button', '取消'), confirm = make('button', '导出'); cancel.type = 'button'; confirm.type = 'submit'; confirm.className = 'primary';
    actions.append(cancel, confirm); form.append(label, error, actions); dialog.append(style, title, form);
    let done = false;
    const finish = result => {if (done) return; done = true; try {dialog.close?.();} catch {} dialog.remove(); resolve(result); if (trigger?.isConnected && !trigger.disabled) trigger.focus?.();};
    const submit = () => {try {finish(exportFilename(input.value));} catch (e) {error.textContent = e.message; input.setAttribute('aria-invalid', 'true'); input.focus?.();}};
    form.addEventListener('submit', e => {e.preventDefault(); submit();});
    input.addEventListener('input', () => {error.textContent = ''; input.removeAttribute('aria-invalid');});
    cancel.addEventListener('click', () => finish(null));
    dialog.addEventListener('cancel', e => {e.preventDefault(); finish(null);}); dialog.addEventListener('close', () => finish(null));
    dialog.addEventListener('keyup', e => e.stopPropagation());
    dialog.addEventListener('keydown', e => {e.stopPropagation(); if (!e.isComposing && e.key === 'Escape') {e.preventDefault(); finish(null);}});
    root.append(dialog);
    try {if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');} catch {finish(null); return;}
    input.focus?.(); input.select?.();
  });
}
