/** Keep workshop presses out of Tavern's html-level drawer outside-click handler.
 * Listen on the host in the bubble phase so controls finish handling the event.
 * Default actions and pointer events remain available for focus, scroll and drag.
 */
export function installWorkshopEventBoundary(host) {
  const types = ['mousedown', 'touchstart'];
  const stop = event => event.stopPropagation();
  for (const type of types) host.addEventListener(type, stop);
  return () => {
    for (const type of types) host.removeEventListener(type, stop);
  };
}
