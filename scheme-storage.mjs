export const SCHEME_DB = 'orange.theme-lab.mobile-test.schemes.v1';
export const SCHEME_STORE = 'schemes';
export const SCHEME_KEY = 'current';

function storageError(error) {
  if (error?.name === 'QuotaExceededError') return error;
  if (error?.name === 'SchemeStorageError') return error;
  const result = new Error('浏览器无法读写方案，请检查网站存储权限后重试。', {cause: error});
  result.name = 'SchemeStorageError';
  return result;
}

// One saved scheme, independent of reusable assets. Store the existing JSON
// format directly; imports, exports and placed image copies stay self-contained.
export function createSchemeStorage({indexedDB = globalThis.indexedDB, databaseName = SCHEME_DB} = {}) {
  let database, opening;
  async function open() {
    if (database) return database;
    if (opening) return opening;
    if (!indexedDB?.open) throw storageError();
    opening = new Promise((resolve, reject) => {
      let request, settled = false;
      const fail = error => { if (!settled) { settled = true; reject(storageError(error)); } };
      try { request = indexedDB.open(databaseName, 1); }
      catch (error) { fail(error); return; }
      request.onupgradeneeded = () => {
        try { request.result.createObjectStore(SCHEME_STORE, {keyPath: 'id'}); }
        catch (error) { request.transaction.abort(); fail(error); }
      };
      request.onerror = () => fail(request.error);
      request.onblocked = () => { const error = new Error('方案存储被其他页面占用，请关闭其他编辑页面后重试。'); error.name = 'SchemeStorageError'; fail(error); };
      request.onsuccess = () => {
        const db = request.result;
        if (settled) { db.close(); return; }
        settled = true; database = db;
        db.onversionchange = () => { db.close(); if (database === db) { database = null; opening = null; } };
        resolve(db);
      };
    }).catch(error => { opening = null; throw error; });
    return opening;
  }
  async function transaction(mode, operation) {
    const db = await open();
    return new Promise((resolve, reject) => {
      let tx, request, result;
      try {
        tx = db.transaction(SCHEME_STORE, mode);
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(storageError(tx.error || request?.error));
        tx.onabort = () => reject(storageError(tx.error || request?.error));
        request = operation(tx.objectStore(SCHEME_STORE));
        request.onsuccess = () => { result = request.result; };
      } catch (error) { try { tx?.abort(); } catch {} reject(storageError(error)); }
    });
  }
  return {
    async load() {
      const record = await transaction('readonly', store => store.get(SCHEME_KEY));
      if (record === undefined) return null;
      if (record?.id !== SCHEME_KEY || typeof record.json !== 'string') throw Error('保存的方案记录无效。');
      return record.json;
    },
    async save(json) {
      if (typeof json !== 'string') throw TypeError('方案必须是 JSON 文本。');
      await transaction('readwrite', store => store.put({id: SCHEME_KEY, json}));
    },
  };
}
