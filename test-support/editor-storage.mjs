import assert from 'node:assert/strict';
import {indexedDatabase} from './indexed-db.mjs';
import {createSchemeStorage} from '../scheme-storage.mjs';

// Reuse the browser's existing database double so asset and scheme storage share
// one factory. localStorage remains independent for fonts and UI preferences.
export async function editorStorage(initialJson = null) {
  globalThis.indexedDB ||= indexedDatabase().factory;
  const storage = createSchemeStorage({indexedDB: globalThis.indexedDB});
  if (initialJson !== null) await storage.save(initialJson);
  return storage;
}

export async function saveEditorScheme(shadow, storage) {
  const button = shadow.querySelector('#save');
  assert.ok(button);
  assert.equal(button.disabled, false, 'a previous save must finish first');
  button.click();
  for (let turns = 0; button.disabled && turns < 100; turns++) {
    await new Promise(resolve => setImmediate(resolve));
  }
  assert.equal(button.disabled, false, 'scheme save finishes');
  assert.equal(shadow.querySelector('#save-state').textContent, '已保存方案', 'save success is visible');
  const json = await storage.load();
  assert.notEqual(json, null, 'scheme was committed to IndexedDB');
  return JSON.parse(json);
}
