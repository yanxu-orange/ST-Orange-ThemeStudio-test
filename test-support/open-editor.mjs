export function openEditor(shadow) {
  shadow.querySelector('.launcher').click();
  const home = shadow.querySelector('.flow-overlay');
  if (home && !home.classList.contains('hidden')) home.querySelector('[data-flow="blank"]').click();
}
