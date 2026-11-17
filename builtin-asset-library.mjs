export const HIDDEN_BUILTIN_ASSETS_KEY = 'orange.theme-lab.hidden-assets.v1';

// Keep asset registration intact: saved works may still reference removed entries.
export function createBuiltinAssetLibrary({ storage = globalThis.localStorage } = {}) {
  function read() {
    const value = JSON.parse(storage?.getItem(HIDDEN_BUILTIN_ASSETS_KEY) || '[]');
    return Array.isArray(value) ? value.filter(id => typeof id === 'string') : [];
  }
  return {
    visible(groups) {
      const hidden = new Set(read());
      return groups.map(group => ({ ...group, assets: group.assets.filter(asset => !hidden.has(asset.id)) }));
    },
    remove(id) {
      if (!storage) throw new Error('浏览器存储不可用');
      storage.setItem(HIDDEN_BUILTIN_ASSETS_KEY, JSON.stringify([...new Set([...read(), id])]));
    },
  };
}
