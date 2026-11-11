import {inspectImageBlob, encodeImageBlob, dataUrlToBlob, MAX_UPLOAD_BYTES, MAX_UPLOAD_PIXELS} from './image-processing.mjs';

// This cache is a display-only overlay. It never writes a scheme, library item or src.
export function displayDimensions(width, height, rect, dpr = 1, fit = 'fill') {
  if (!(width > 0 && height > 0 && rect.width > 0 && rect.height > 0)) return null;
  const ratios = [rect.width * dpr / width, rect.height * dpr / height];
  const scale = Math.min(1, fit === 'contain' || fit === 'scale-down' ? Math.min(...ratios) : Math.max(...ratios));
  return {width: Math.max(1, Math.ceil(width * scale)), height: Math.max(1, Math.ceil(height * scale))};
}

export function createImageDisplay({document = globalThis.document,
  selector = 'img[data-ltai-display-image]', maxEntries = 32, maxBytes = 48 * 1024 * 1024,
  inspect = inspectImageBlob, encode = encodeImageBlob, toBlob = dataUrlToBlob,
  url = globalThis.URL} = {}) {
  const win = document?.defaultView || globalThis;
  const states = new Map(), cache = new Map(), queue = new Set(), roots = new Set();
  let bytes = 0, epoch = 0, running = null;
  const IO = win.IntersectionObserver, RO = win.ResizeObserver, MO = win.MutationObserver;
  const intersection = IO ? new IO(entries => {
    for (const entry of entries) {
      const state = states.get(entry.target);
      if (!state) continue;
      state.visible = entry.isIntersecting;
      if (state.visible) enqueue(entry.target); else queue.delete(entry.target);
    }
  }) : null;
  const resize = RO ? new RO(entries => entries.forEach(entry => enqueue(entry.target))) : null;
  const mutation = MO ? new MO(records => {
    const added = new Set();
    let removedElements = false;
    for (const record of records) {
      if (record.type === 'attributes') {
        const img = record.target;
        if (record.attributeName === 'srcset') {
          const state = states.get(img);
          // Our own installs/restores must not feed the resize/cache queue.
          if (!state || img.getAttribute('srcset') === state.applied) continue;
          remove(img, state);
          continue;
        }
        // Streaming text/layout writes on unrelated containers are not image work.
        if (states.has(img) || img.matches?.(selector)) added.add(img);
        // Ancestor selectors can change eligibility without changing the image.
        if (record.attributeName === 'class' || record.attributeName === 'style') {
          for (const child of img.querySelectorAll?.('img') || []) {
            if (states.has(child) || child.matches(selector)) added.add(child);
          }
        }
      } else {
        for (const node of record.addedNodes || []) {
          if (node.nodeType !== 1) continue;
          if (node.matches?.(selector)) added.add(node);
          for (const img of node.querySelectorAll?.(selector) || []) added.add(img);
        }
        if ([...(record.removedNodes || [])].some(node => node.nodeType === 1)) removedElements = true;
      }
    }
    if (removedElements) {
      for (const [img, state] of states) if (!img.isConnected) remove(img, state);
    }
    for (const img of added) refreshImage(img);
  }) : null;

  function restore(img, state) {
    if (state.applied && img.getAttribute('srcset') === state.applied) img.removeAttribute('srcset');
    state.applied = null;
  }
  function discard(key, entry) {
    cache.delete(key); bytes -= entry.cost;
    if (entry.url) {
      for (const [img, state] of states) if (state.applied === `${entry.url} 1x`) restore(img, state);
      url.revokeObjectURL(entry.url);
    }
  }
  function trim() {
    while (cache.size > maxEntries || bytes > maxBytes) {
      const [key, entry] = cache.entries().next().value;
      discard(key, entry);
    }
  }
  function remove(img, state) {
    restore(img, state); states.delete(img); queue.delete(img);
    intersection?.unobserve(img); resize?.unobserve(img);
  }
  function eligible(img, state) {
    const src = img.getAttribute('src') || '';
    return img.isConnected && img.matches(selector) && !img.closest('picture') &&
      !img.hasAttribute('sizes') && (!img.hasAttribute('srcset') || img.getAttribute('srcset') === state?.applied) &&
      /^data:image\/(?:png|jpe?g|webp);base64,/i.test(src) && src.length <= 23 * 1024 * 1024;
  }
  function enqueue(img) {
    const state = states.get(img);
    if (!state?.visible || !eligible(img, state)) return;
    queue.add(img);
    if (!running) {
      running = Promise.resolve().then(drain).finally(() => { running = null; if (queue.size) enqueue(queue.values().next().value); });
    }
  }
  async function drain() {
    while (queue.size) {
      const img = queue.values().next().value; queue.delete(img);
      const state = states.get(img), generation = epoch;
      if (!state?.visible || !eligible(img, state)) continue;
      const source = img.getAttribute('src');
      const current = () => epoch === generation && states.get(img) === state && state.visible && eligible(img, state) && img.getAttribute('src') === source;
      try {
        const rect = img.getBoundingClientRect();
        if (!(rect.width > 0 && rect.height > 0)) continue;
        let entry = cache.get(source), blob;
        if (!entry) {
          blob = toBlob(source);
          if (blob.size > MAX_UPLOAD_BYTES) continue;
          const meta = await inspect(blob);
          if (!current()) continue;
          entry = {meta, cost: source.length * 2, url: null, width: 0, height: 0};
          cache.set(source, entry); bytes += entry.cost; trim();
          if (!cache.has(source)) continue;
        } else { cache.delete(source); cache.set(source, entry); }
        const {meta} = entry;
        if (meta.animated || !['image/png', 'image/jpeg', 'image/webp'].includes(meta.mime) || !(meta.width * meta.height <= MAX_UPLOAD_PIXELS)) continue;
        const target = displayDimensions(meta.width, meta.height, rect, Math.max(1, win.devicePixelRatio || 1), win.getComputedStyle?.(img)?.objectFit);
        if (!target) continue;
        // Never display an undersized derivative while a larger one is being made.
        if (entry.width < target.width || entry.height < target.height) restore(img, state);
        if (target.width >= meta.width && target.height >= meta.height) { restore(img, state); continue; }
        if (!entry.url || entry.width < target.width || entry.height < target.height) {
          const output = await encode(blob || toBlob(source), {...target, valid: current});
          if (!current() || cache.get(source) !== entry) continue;
          // A late geometry change is handled by the queued ResizeObserver refresh.
          const oldUrl = entry.url;
          entry.url = url.createObjectURL(output);
          entry.width = target.width; entry.height = target.height;
          const outputCost = output.size + target.width * target.height * 4;
          bytes += outputCost - (entry.outputCost || 0); entry.cost += outputCost - (entry.outputCost || 0); entry.outputCost = outputCost;
          if (oldUrl) {
            for (const [other, otherState] of states) if (otherState.applied === `${oldUrl} 1x`) {
              if (other.getAttribute('srcset') === otherState.applied && other.getAttribute('src') === source) {
                otherState.applied = `${entry.url} 1x`; other.setAttribute('srcset', otherState.applied);
              } else restore(other, otherState);
            }
            url.revokeObjectURL(oldUrl);
          }
          trim();
        }
        if (current() && cache.get(source) === entry && entry.url) {
          const latest = displayDimensions(meta.width, meta.height, img.getBoundingClientRect(), Math.max(1, win.devicePixelRatio || 1), win.getComputedStyle?.(img)?.objectFit);
          if (!latest || latest.width > entry.width || latest.height > entry.height) { restore(img, state); if (latest) enqueue(img); continue; }
          state.applied = `${entry.url} 1x`;
          if (img.getAttribute('srcset') !== state.applied) img.setAttribute('srcset', state.applied);
        }
      } catch { /* Decode/encode failure leaves the original source available. */ }
    }
  }
  function refreshImage(img) {
    let state = states.get(img);
    if (!eligible(img, state)) { if (state) remove(img, state); return; }
    if (!state) {
      state = {visible: !intersection, applied: null, source: img.getAttribute('src')}; states.set(img, state);
      intersection?.observe(img); resize?.observe(img);
    } else if (state.source !== img.getAttribute('src')) {
      restore(img, state); state.source = img.getAttribute('src');
    }
    enqueue(img);
  }
  function refresh(root = document) {
    for (const [img, state] of states) if (!eligible(img, state)) remove(img, state);
    const images = [...(root?.matches?.(selector) ? [root] : []), ...root?.querySelectorAll?.(selector) || []];
    for (const img of images) refreshImage(img);
  }
  const refreshRoots = () => { for (const root of roots) refresh(root); };
  function watch(root = document) {
    if (!roots.size) win.addEventListener?.('resize', refreshRoots);
    if (!roots.has(root)) {
      roots.add(root);
      mutation?.observe(root, {childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'srcset', 'sizes', 'class', 'style']});
    }
    refresh(root);
  }
  function clear() {
    win.removeEventListener?.('resize', refreshRoots);
    epoch++; queue.clear(); roots.clear(); mutation?.disconnect(); intersection?.disconnect(); resize?.disconnect();
    for (const [img, state] of states) restore(img, state);
    states.clear();
    for (const [key, entry] of cache) discard(key, entry);
  }
  return {watch, refresh, clear, async whenIdle() { while (running) await running; },
    stats() { return {entries: cache.size, bytes, watched: states.size, queued: queue.size}; }};
}
