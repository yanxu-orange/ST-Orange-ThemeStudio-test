import { uniqueId } from './unique-id.mjs';

export const CUSTOM_WORK_DB = 'orange.theme-lab.custom-works.v1';
export const CUSTOM_WORK_METADATA = 'metadata';
export const CUSTOM_WORK_CONTENT = 'content';

function storageError(error) {
  if (error?.name === 'QuotaExceededError' || error?.name === 'WorkStorageError') return error;
  const result = new Error('浏览器无法读写作品库，请检查网站存储权限后重试。', { cause: error });
  result.name = 'WorkStorageError';
  return result;
}

function validId(id) {
  if (typeof id !== 'string' || !/^[\w-]{1,128}$/.test(id)) throw new TypeError('作品标识无效。');
  return id;
}

function metadataOf(record) {
  if (!record || typeof record.name !== 'string' || !record.name.trim() || !Number.isFinite(record.updatedAt))
    throw new Error('作品目录记录无效。');
  return { id: validId(record.id), name: record.name, updatedAt: record.updatedAt };
}

export function createCustomWorkStorage({
  indexedDB = globalThis.indexedDB,
  databaseName = CUSTOM_WORK_DB,
  now = Date.now,
  makeId = uniqueId,
} = {}) {
  let database, opening;
  async function open() {
    if (database) return database;
    if (opening) return opening;
    if (!indexedDB?.open) throw storageError();
    opening = new Promise((resolve, reject) => {
      let request, settled = false;
      const fail = error => {
        if (!settled) { settled = true; reject(storageError(error)); }
      };
      try { request = indexedDB.open(databaseName, 1); }
      catch (error) { fail(error); return; }
      request.onupgradeneeded = () => {
        try {
          request.result.createObjectStore(CUSTOM_WORK_METADATA, { keyPath: 'id' });
          request.result.createObjectStore(CUSTOM_WORK_CONTENT, { keyPath: 'id' });
        } catch (error) { request.transaction.abort(); fail(error); }
      };
      request.onerror = () => fail(request.error);
      request.onblocked = () => {
        const error = new Error('作品库被其他页面占用，请关闭其他编辑页面后重试。');
        error.name = 'WorkStorageError';
        fail(error);
      };
      request.onsuccess = () => {
        const db = request.result;
        if (settled) { db.close(); return; }
        settled = true;
        database = db;
        db.onversionchange = () => {
          db.close();
          if (database === db) { database = null; opening = null; }
        };
        resolve(db);
      };
    }).catch(error => { opening = null; throw error; });
    return opening;
  }
  async function transaction(stores, mode, operation) {
    const db = await open();
    return new Promise((resolve, reject) => {
      let tx, result;
      try {
        tx = db.transaction(stores, mode);
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(storageError(tx.error));
        tx.onabort = () => reject(storageError(tx.error));
        operation(tx, value => { result = value; });
      } catch (error) {
        try { tx?.abort(); } catch {}
        reject(storageError(error));
      }
    });
  }
  return {
    async list() {
      const records = await transaction(CUSTOM_WORK_METADATA, 'readonly', (tx, done) => {
        const request = tx.objectStore(CUSTOM_WORK_METADATA).getAll();
        request.onsuccess = () => done(request.result);
      });
      return records.map(metadataOf).sort((a, b) => b.updatedAt - a.updatedAt || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
    },
    async load(id) {
      validId(id);
      const record = await transaction(CUSTOM_WORK_CONTENT, 'readonly', (tx, done) => {
        const request = tx.objectStore(CUSTOM_WORK_CONTENT).get(id);
        request.onsuccess = () => done(request.result);
      });
      if (record === undefined) return null;
      if (record?.id !== id || typeof record.json !== 'string') throw new Error('作品内容记录无效。');
      return record.json;
    },
    async save({ id, name, json }) {
      const isNew = id === undefined;
      if (isNew) id = makeId();
      validId(id);
      if (typeof name !== 'string' || !name.trim()) throw new TypeError('请填写作品名称。');
      if (typeof json !== 'string') throw new TypeError('作品方案必须是 JSON 文本。');
      const metadata = metadataOf({ id, name: name.trim(), updatedAt: now() });
      await transaction([CUSTOM_WORK_METADATA, CUSTOM_WORK_CONTENT], 'readwrite', tx => {
        const method = isNew ? 'add' : 'put';
        tx.objectStore(CUSTOM_WORK_METADATA)[method](metadata);
        tx.objectStore(CUSTOM_WORK_CONTENT)[method]({ id, json });
      });
      return metadata;
    },
    async remove(id) {
      validId(id);
      await transaction([CUSTOM_WORK_METADATA, CUSTOM_WORK_CONTENT], 'readwrite', tx => {
        tx.objectStore(CUSTOM_WORK_METADATA).delete(id);
        tx.objectStore(CUSTOM_WORK_CONTENT).delete(id);
      });
    },
  };
}
