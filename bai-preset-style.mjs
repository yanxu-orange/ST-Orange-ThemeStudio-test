const feedback=['bai-bai-preset-vue-dragging','bai-bai-preset-drop-target','bai-bai-preset-vue-drag-ready-feedback','bai-bai-preset-vue-sortable-chosen','bai-bai-preset-vue-sortable-ghost','bai-bai-preset-vue-sortable-fallback','bai-bai-preset-global-library-prompt-selected'];
export function staticPresetManager(root){
 return `${root} #completion_prompt_manager:not(.bai-bai-preset-vue-dragging *)`;
}
export function guardPresetRules(css){
 const states=`:is(${feedback.map(name=>'.'+name).join(',')})`,guard=`:not(${states}):not(${states} *):not(:has(${states}))`;
 return css.replace(/([^{}]+)\{/g,(_,selectors)=>{
  let depth=0,start=0;const parts=[];
  for(let i=0;i<selectors.length;i++){if(selectors[i]==='(')depth++;else if(selectors[i]===')')depth--;else if(selectors[i]===','&&depth===0){parts.push(selectors.slice(start,i));start=i+1;}}
  parts.push(selectors.slice(start));return parts.map(selector=>selector+guard).join(',')+'{';
 });
}
export function baiPresetRules(root,page,global){
 if(!page.promptList)return '';
 const manager=staticPresetManager(root),panel=page.panel||global.panel,heading=page.heading||global.heading,field=page.field||global.field,text=page.text||global.text;
 const group=`${manager} :is(.bai-bai-preset-group,.bai-bai-preset-global-library)`,header=`${manager} .bai-bai-preset-group-header`;
 return guardPresetRules([
 `${group}{background:transparent!important;border-color:${panel.border}!important;box-shadow:none!important}`,
 `${manager} .bai-bai-preset-group-body-inner{background:${field.background}!important;box-shadow:none!important}`,
 `${header}{background:${heading.background}!important;color:${heading.color}!important;border-bottom:1px solid ${panel.border}!important;box-shadow:none!important}`,
 `${manager} :is(.bai-bai-preset-group-collapsed,.bai-bai-preset-global-library-collapsed) > .bai-bai-preset-group-header{border-bottom-color:transparent!important}`,
 `${manager} .bai-bai-preset-group-title-content > strong{color:${heading.color}!important;font-size:${heading.size}px!important;font-weight:${heading.weight}!important;white-space:normal!important;overflow-wrap:anywhere}`,
 `${manager} .bai-bai-preset-group-count{color:${text.muted}!important}`,
 `${manager} .bai-bai-preset-group-enable-toggle.fa-toggle-on{color:${text.accent}!important}`,
 `${manager} .bai-bai-preset-group-enable-toggle.fa-toggle-off{color:${text.muted}!important}`
 ].join('\n'));
}
