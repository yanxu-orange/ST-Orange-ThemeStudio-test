import assert from 'node:assert/strict';

// Minimal event-driven IndexedDB boundary double. Records commit after request
// success, allowing tests to catch premature success and transaction rollback.
export function indexedDatabase() {
  const databases = new Map(), controls = {failNext: '', blocked: false, failOpen: false, holdCommit: false, finish: null, opens: 0, reads: []};
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
        transaction(storeNames, mode) {
          if (closed) throw new DOMException('closed', 'InvalidStateError');
          const names = Array.isArray(storeNames) ? storeNames : [storeNames];
          for (const name of names) assert.ok(data.has(name));
          const staged = new Map(names.map(name => [name, new Map(data.get(name))])), writes = [];
          let pending = 0, completed = false;
          const tx = {error: null, aborted: false, abort() { this.aborted = true; this.error ||= new DOMException('aborted', 'AbortError'); queueMicrotask(() => this.onabort?.()); },
            objectStore(storeName = names[0]) {
              assert.ok(names.includes(storeName));
              function operation(kind, argument) {
                const req = {}, input = structuredClone(argument);
                pending++;
                queueMicrotask(() => {
                  const store = staged.get(storeName);
                  if (tx.aborted) return;
                  let result;
                  if (kind === 'getAll' || kind === 'get') controls.reads.push({database: name, store: storeName, kind, key: input});
                  if (kind === 'getAll') result = [...store.values()];
                  if (kind === 'get') result = store.get(input);
                  if (kind === 'add' || kind === 'put') {
                    assert.equal(mode, 'readwrite');
                    if (kind === 'add' && store.has(input.id)) { tx.error = new DOMException('duplicate', 'ConstraintError'); tx.abort(); return; }
                    result = input.id;
                    store.set(input.id, input);
                    writes.push(() => data.get(storeName).set(input.id, input));
                  }
                  if (kind === 'delete') {
                    assert.equal(mode, 'readwrite');
                    store.delete(input);
                    writes.push(() => data.get(storeName).delete(input));
                  }
                  req.result = structuredClone(result); req.onsuccess?.();
                  pending--;
                  const finish = () => {
                    if (completed || tx.aborted || pending) return;
                    if (controls.failNext) { tx.error = new DOMException('failed transaction', controls.failNext); controls.failNext = ''; tx.abort(); return; }
                    for (const write of writes) write();
                    completed = true;
                    tx.oncomplete?.();
                  };
                  if (!pending) {
                    if (controls.holdCommit) controls.finish = finish; else queueMicrotask(finish);
                  }
                });
                return req;
              }
              return {getAll: () => operation('getAll'), get: id => operation('get', id), add: record => operation('add', record), put: record => operation('put', record), delete: id => operation('delete', id)};
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

