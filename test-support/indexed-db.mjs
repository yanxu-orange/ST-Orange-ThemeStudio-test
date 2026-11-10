import assert from 'node:assert/strict';

// Minimal event-driven IndexedDB boundary double. Records commit after request
// success, allowing tests to catch premature success and transaction rollback.
export function indexedDatabase() {
  const databases = new Map(), controls = {failNext: '', blocked: false, failOpen: false, holdCommit: false, finish: null, opens: 0};
  const factory = {open(name, version) {
    controls.opens++;
    const request = {result: null, transaction: {abort() { request.error = new DOMException('aborted', 'AbortError'); request.onerror?.(); }}};
    queueMicrotask(() => {
      if (controls.blocked) { request.onblocked?.(); return; }
      if (controls.failOpen) { request.error = new DOMException('denied', 'SecurityError'); request.onerror?.(); return; }
      let data = databases.get(name), fresh = !data;
      if (!data) { data = new Map(); databases.set(name, data); }
      let closed = false;
      const db = {version, objectStoreNames: {contains: store => data.has(store)},
        createObjectStore(store) { data.set(store, new Map()); }, close() { closed = true; },
        transaction(storeName, mode) {
          if (closed) throw new DOMException('closed', 'InvalidStateError');
          assert.ok(data.has(storeName));
          const tx = {error: null, aborted: false, abort() { this.aborted = true; this.error ||= new DOMException('aborted', 'AbortError'); queueMicrotask(() => this.onabort?.()); },
            objectStore() {
              function operation(kind, argument) {
                const req = {};
                queueMicrotask(() => {
                  const store = data.get(storeName);
                  if (tx.aborted) return;
                  let result;
                  if (kind === 'getAll') result = [...store.values()];
                  if (kind === 'get') result = store.get(argument);
                  if (kind === 'add') {
                    assert.equal(mode, 'readwrite');
                    if (store.has(argument.id)) { tx.error = new DOMException('duplicate', 'ConstraintError'); tx.abort(); return; }
                    result = argument.id;
                  }
                  req.result = structuredClone(result); req.onsuccess?.();
                  const finish = () => {
                    if (controls.failNext) { tx.error = new DOMException('failed transaction', controls.failNext); controls.failNext = ''; tx.abort(); return; }
                    if (tx.aborted) return;
                    if (kind === 'add') store.set(argument.id, structuredClone(argument));
                    if (kind === 'delete') store.delete(argument);
                    tx.oncomplete?.();
                  };
                  if (controls.holdCommit) controls.finish = finish; else queueMicrotask(finish);
                });
                return req;
              }
              return {getAll: () => operation('getAll'), get: id => operation('get', id), add: record => operation('add', record), delete: id => operation('delete', id)};
            }};
          return tx;
        }};
      request.result = db;
      if (fresh) request.onupgradeneeded?.();
      if (!request.error) request.onsuccess?.();
    });
    return request;
  }};
  return {factory, controls, databases};
}

