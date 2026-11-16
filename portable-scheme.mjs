import { assetUrl } from './catalog.mjs';
import { blobToDataUrl } from './image-processing.mjs';

export async function portableScheme(scheme, { resolveAsset = assetUrl, fetchImage = globalThis.fetch, encodeImage = blobToDataUrl } = {}) {
  const copy = structuredClone(scheme), images = new Map();
  function image(id) {
    if (!images.has(id)) images.set(id, (async () => {
      const url = resolveAsset(id);
      if (!url) throw new Error('找不到素材：' + id);
      const response = await fetchImage(url);
      if (!response.ok) throw new Error('素材读取失败：' + id);
      return encodeImage(await response.blob());
    })());
    return images.get(id);
  }
  async function visit(value) {
    if (!value || typeof value !== 'object') return;
    if (typeof value.asset === 'string' && value.asset && typeof value.image === 'string') {
      if (!value.image || value.kind === 'asset') value.image = await image(value.asset);
      value.asset = '';
      if (value.kind === 'asset') value.kind = 'custom';
    }
    if (value.canvasWallpaperAsset) {
      if (!value.canvasWallpaper) value.canvasWallpaper = await image(value.canvasWallpaperAsset);
      delete value.canvasWallpaperAsset;
    }
    for (const child of Object.values(value)) await visit(child);
  }
  await visit(copy);
  return copy;
}
