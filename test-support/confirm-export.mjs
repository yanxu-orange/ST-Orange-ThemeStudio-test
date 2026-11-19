import assert from 'node:assert/strict';

// Integration tests explicitly accept the same naming step shown to users.
export function confirmExport(document = globalThis.document) {
  const shadow = document.querySelector('#orange-theme-lab')?.shadowRoot;
  const form = shadow?.querySelector('.otl-export-name form');
  assert.ok(form, 'export naming dialog should open before downloading');
  form.dispatchEvent(new document.defaultView.Event('submit', {cancelable:true}));
}
