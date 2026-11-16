export function activateEditedRegion(config, ui) {
  let target, key;
  if (['topbar', 'input'].includes(ui.region)) {
    target = config.chromeStyle?.[ui.region]; key = 'enabled';
  } else if (ui.region === 'page-header') {
    target = config.pageHeaders?.[ui.page]; key = 'enabled';
  } else if (ui.page === 'presets' && ['page-content', 'page-bai'].includes(ui.region) && ui.kind !== 'tip') {
    target = config.pageStyle?.presets; key = 'promptList';
  }
  if (!target) return () => {};
  const previous = target[key];
  target[key] = true;
  return () => { target[key] = previous; };
}
