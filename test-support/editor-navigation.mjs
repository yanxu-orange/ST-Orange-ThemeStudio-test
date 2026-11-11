import assert from 'node:assert/strict';

const globalRegions = new Set(['common', 'topbar', 'input', 'home-design']);

/** Follow the workbench's real scope and region selects, without touching Tavern. */
export function navigateRegion(shadow, region) {
  const change = (select, value) => {
    assert.ok(select, 'navigation select exists');
    assert.ok([...select.options].some(option => option.value === value), `available choice: ${value}`);
    select.value = value;
    select.dispatchEvent(new shadow.ownerDocument.defaultView.Event('change', {bubbles: true}));
  };
  const page = globalRegions.has(region) ? 'home' : 'chat';
  const scope = shadow.querySelector('#workspace-page');
  if (scope.value !== page) change(scope, page);
  change(shadow.querySelector('#region-select'), region);
}

/** Shared functional test click helper; region tokens denote a navigation action. */
export function clickEditor(shadow, selector) {
  const region = /^\[data-region=["']?([^\]"']+)["']?\]$/.exec(selector)?.[1];
  if (region) return navigateRegion(shadow, region);
  const node = shadow.querySelector(selector);
  assert.ok(node, selector);
  assert.notEqual(node.disabled, true, selector);
  node.click();
}
