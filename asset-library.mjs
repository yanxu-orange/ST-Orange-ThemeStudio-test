import {validEmbeddedImage, validImageUrl} from './image-sources.mjs';

export const ASSET_LIBRARY_DB = 'orange.theme-lab.mobile-test.assets.v1';
export const ASSET_LIBRARY_STORE = 'images';

export class AssetLibraryError extends Error {
  constructor(code, message, cause) {
    super(message, cause ? {cause} : undefined);
    this.name = 'AssetLibraryError';
    this.code = code;
  }
}

function storageError(error) {
  if (error instanceof AssetLibraryError) return error;
  if (error?.name === 'QuotaExceededError') return new AssetLibraryError('QUOTA', '素材库空间不足，图片尚未保存。请清理不需要的素材后重试。', error);
  return new AssetLibraryError('STORAGE', '素材库读写失败，请重试。图片不会自动放入当前方案。', error);
}

export function createAssetRecord({name = '我的图片', image} = {}, {id = globalThis.crypto.randomUUID(), createdAt = Date.now()} = {}) {
  const kind = validEmbeddedImage(image) ? 'upload' : validImageUrl(image) ? 'url' : '';
  if (!kind) throw new AssetLibraryError('INVALID_IMAGE', '素材图片格式无效，请使用 PNG、JPG、WebP、GIF 或 HTTP(S) 图片链接。');
  if (typeof name !== 'string' || !name.trim() || name.length > 80) throw new AssetLibraryError('INVALID_NAME', '素材名称需要 1 至 80 个字符。');
  if (typeof id !== 'string' || !/^[\w-]{1,80}$/.test(id) || !Number.isSafeInteger(createdAt) || createdAt < 0) throw new AssetLibraryError('INVALID_RECORD', '素材记录无效。');
  return {id, name: name.trim(), image, kind, createdAt};
}

function readRecord(value) {
  if (value === undefined) return null;
  if (!value || typeof value.id !== 'string' || !Number.isSafeInteger(value.createdAt)) throw new AssetLibraryError('INVALID_RECORD', '素材记录无效。');
  const result = createAssetRecord(value, {id: value?.id, createdAt: value?.createdAt});
  if (value.kind !== result.kind) throw new AssetLibraryError('INVALID_RECORD', '素材记录无效。');
  return result;
}

/**
 * This database is independent of theme snapshots, undo and imports/exports.
 * To place an asset, copy record.image into the selected theme object. Never
 * save library IDs in themes: deleting a library entry cannot break a theme.
 * No fallback pretends an unsuccessful IndexedDB write was persisted.
 */
export function createAssetLibrary({indexedDB = globalThis.indexedDB, databaseName = ASSET_LIBRARY_DB,
  createId = () => globalThis.crypto.randomUUID(), now = () => Date.now()} = {}) {
  let database = null, opening = null, closed = false;

  function open() {
    if (closed) return Promise.reject(new AssetLibraryError('CLOSED', '素材库已关闭，请重新打开编辑器。'));
    if (database) return Promise.resolve(database);
    if (opening) return opening;
    if (!indexedDB?.open) return Promise.reject(new AssetLibraryError('UNAVAILABLE', '此浏览器无法使用本地素材库。请允许网站存储后重试。'));
    opening = new Promise((resolve, reject) => {
      let request, settled = false;
      const fail = error => { if (!settled) { settled = true; reject(storageError(error)); } };
      try { request = indexedDB.open(databaseName, 1); }
      catch (error) { fail(error); return; }
      request.onupgradeneeded = () => {
        if (settled || closed) { request.transaction.abort(); return; }
        try {
          if (!request.result.objectStoreNames.contains(ASSET_LIBRARY_STORE)) request.result.createObjectStore(ASSET_LIBRARY_STORE, {keyPath: 'id'});
        } catch (error) { request.transaction.abort(); fail(error); }
      };
      request.onerror = () => fail(request.error);
      request.onblocked = () => fail(new AssetLibraryError('BLOCKED', '素材库被其他页面占用，请关闭其他编辑页面后重试。'));
      request.onsuccess = () => {
        const db = request.result;
        if (settled || closed) { db.close(); fail(new AssetLibraryError('CLOSED', '素材库已关闭。')); return; }
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
        tx = db.transaction(ASSET_LIBRARY_STORE, mode);
        // Only transaction completion confirms a durable write. A request can
        // succeed and still be rolled back by a later quota/abort failure.
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(storageError(tx.error || request?.error));
        tx.onabort = () => reject(storageError(tx.error || request?.error));
        request = operation(tx.objectStore(ASSET_LIBRARY_STORE));
        request.onsuccess = () => { result = request.result; };
      } catch (error) { try { tx?.abort(); } catch {} reject(storageError(error)); }
    });
  }

  return {
    async list() {
      const records = await transaction('readonly', store => store.getAll());
      return records.map(readRecord).sort((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id));
    },
    async add(input) {
      const record = createAssetRecord(input, {id: createId(), createdAt: now()});
      await transaction('readwrite', store => store.add(record));
      return structuredClone(record);
    },
    async get(id) { return readRecord(await transaction('readonly', store => store.get(id))); },
    async remove(id) { await transaction('readwrite', store => store.delete(id)); },
    close() { closed = true; database?.close(); database = null; },
  };
}
