import {COMMON_FIELD_SELECTOR,COMMON_BUTTON_SELECTOR} from './common-style.mjs';
export const WORLD_ENTRY_DEFAULTS={borderMode:'all',paddingTop:8,paddingX:3,paddingBottom:12,gap:10,contentPaddingY:8,contentPaddingX:4,headerEnd:'#ffffff',headerGradient:false,plainIcons:false,mutedDisabled:false,arrowScale:1,fieldTypography:'theme',deleteColor:'#934855',deleteBackground:'#f8e8eb',deleteBorder:'#d7aab2'};
export function normalizeWorldEntry(raw){
 if(raw===null||raw===undefined)return null;
 if(typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>!Object.hasOwn(WORLD_ENTRY_DEFAULTS,k)))throw Error('世界书条目外观无效');
 const value={...WORLD_ENTRY_DEFAULTS,...raw};
 for(const [key,v] of Object.entries(value)){
  const d=WORLD_ENTRY_DEFAULTS[key];
  if(typeof d==='boolean'){if(typeof v!=='boolean')throw Error('世界书条目选项无效');}
  else if(typeof d==='number'){if(!Number.isFinite(v)||v<0||v>(key==='arrowScale'?3:48))throw Error('世界书条目尺寸无效');}
  else if(key==='borderMode'){if(!['all','bottom','none'].includes(v))throw Error('世界书条目边框无效');}
  else if(key==='fieldTypography'){if(!['theme','native'].includes(v))throw Error('世界书输入字体无效');}
  else if(!/^#[0-9a-f]{6}$/i.test(v))throw Error('世界书条目颜色无效');
 }
 return value;
}
export function worldEntryRules(root,page,global){
 const d=page.entryDetails;if(!d)return '';
 const p=page.entry||page.panel||global.panel,h=page.entryHeading||page.heading||global.heading,t=page.text||global.text,f=page.field||global.field,b=page.button||global.button;
 const list=`${root} #world_popup_entries_list`,entry=`${list} .wi-card-entry`,header=`${list} .world_entry .inline-drawer-header`,content=`${list} .world_entry .inline-drawer-content`,fields=`${root} ${COMMON_FIELD_SELECTOR}:is(input,textarea,select,.text_pole)`;
 const rules=[`${entry}{padding:${d.paddingTop}px ${d.paddingX}px ${d.paddingBottom}px!important;margin-bottom:${d.gap}px!important;box-shadow:none!important}`];
 if(d.borderMode!=='all')rules.push(`${entry}{border:0!important;${d.borderMode==='bottom'?`border-bottom:${p.width}px solid ${p.border}!important;`:''}}`);
 rules.push(`${header}{border:0!important;padding:${d.contentPaddingY}px ${d.contentPaddingX}px!important;${d.headerGradient?`background:linear-gradient(90deg,${h.background},${d.headerEnd})!important;`:''}}`);
 rules.push(`${content}{border:0!important;background:${p.background}!important;padding:${d.contentPaddingY}px ${d.contentPaddingX}px!important}`);
 rules.push(`${header} .inline-drawer-icon{font-size:calc(var(--mainFontSize) * ${d.arrowScale})!important;color:${t.muted}!important}`);
 if(d.plainIcons)rules.push(`${root} ${COMMON_BUTTON_SELECTOR}:is(.fa-solid,.fa-regular,.fa-fw,.menu_button_icon){background:transparent!important;border-color:transparent!important;min-width:36px;min-height:36px;color:${b.color}!important}`);
 rules.push(`${list} .delete_entry_button{color:${d.deleteColor}!important;background:${d.deleteBackground}!important;border:1px solid ${d.deleteBorder}!important}`);
 if(d.mutedDisabled){const off=`${root} .disabledWIEntry`;rules.push(`${off}{opacity:1!important;filter:none!important;color:${t.muted}!important}`,`${off} .inline-drawer-header{background:${f.background}!important}`,`${off} :is(input,textarea,select){color:${t.muted}!important;background:${f.background}!important;border-color:${f.border}!important}`);}
 if(d.fieldTypography==='native')rules.push(`${root}{--mainFontFamily:inherit!important;--mainFontSize:inherit!important}`,`${fields}{font-family:var(--mainFontFamily),sans-serif!important;font-size:var(--mainFontSize)!important}`,`${list} .world_entry_form > .inline-drawer > .inline-drawer-header textarea[name=comment]{color:${f.color}!important;font-family:var(--mainFontFamily),sans-serif!important;font-size:var(--mainFontSize)!important}`);
 if(d.mutedDisabled)rules.push(`${list} .disabledWIEntry .world_entry_form > .inline-drawer > .inline-drawer-header textarea[name=comment],${list} .world_entry_form.disabledWIEntry > .inline-drawer > .inline-drawer-header textarea[name=comment]{color:${t.muted}!important}`);
 return rules.join('\n');
}
