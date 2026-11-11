import {validateCaptionStyle} from './captions.mjs';

export const COMMON_STYLE_DEFAULTS={
 text:{font:'auto',size:14,color:'#354b42',muted:'#78847b',accent:'#6f8973',fontLink:null},
 panel:{background:'#fffdf8',opacity:1,border:'#d8e0d6',width:1,radius:12},
 heading:{color:'#354b42',background:'#eef2e9',size:16,weight:600,radius:8},
 button:{color:'#354b42',background:'#f4f7ef',border:'#cbd7c8',radius:7,hover:'#e4eddf'},
 field:{color:'#354b42',background:'#ffffff',border:'#cbd7c8',radius:6,focus:'#6f8973'}
};
const fonts=['auto','serif','sans-serif','Georgia, serif','monospace','"LabSongti",serif'];
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
export function normalizeCommonConfig(raw={}){
 if(!object(raw))throw Error('共用外观方案无效');
 const value=raw.commonStyle===undefined?{}:raw.commonStyle;
 if(!object(value)||Object.keys(value).some(k=>!Object.hasOwn(COMMON_STYLE_DEFAULTS,k)))throw Error('共用外观字段无效');
 const commonStyle={};
 for(const [group,defaults]of Object.entries(COMMON_STYLE_DEFAULTS)){
  const supplied=value[group]===undefined?{}:value[group];
  if(!object(supplied)||Object.keys(supplied).some(k=>!Object.hasOwn(defaults,k)))throw Error('共用外观分组无效：'+group);
  const item={...defaults,...supplied};
  if(['text','heading','button','field'].includes(group)&&supplied.color===undefined&&raw.text!==undefined)item.color=raw.text;
  if(group==='field'&&supplied.focus===undefined&&raw.accent!==undefined)item.focus=raw.accent;
  if(group==='text'&&supplied.accent===undefined&&raw.accent!==undefined)item.accent=raw.accent;
  if(group==='panel'&&supplied.background===undefined&&raw.surface!==undefined)item.background=raw.surface;
  for(const [key,v]of Object.entries(item)){
   if(key==='font'){if(!fonts.includes(v))throw Error('界面字体无效');}
   else if(key==='fontLink'){item.fontLink=validateCaptionStyle({fontLink:v}).fontLink;}
   else if(typeof defaults[key]==='number'){
    const [min,max]=key==='size'?[12,group==='text'?24:32]:key==='weight'?[100,900]:key==='opacity'?[0,1]:key==='width'?[0,4]:[0,32];
    if(!Number.isFinite(v)||v<min||v>max||(key==='weight'&&v%100!==0))throw Error('共用外观数值无效：'+key);
   }else if(typeof v!=='string'||!/^#[0-9a-f]{6}$/i.test(v))throw Error('共用外观颜色无效：'+key);
  }
  commonStyle[group]=item;
 }
 return {...raw,commonStyle};
}
export function commonFontEntries(config){return {common:{fontLink:normalizeCommonConfig(config).commonStyle.text.fontLink}};}

// The host owns geometry, visibility, events, and icon fonts. Only appearance is shared.
// Source: SillyTavern 1.18.0 style.css, world-info.css, select2-overrides.css.
export function commonStyleRules(config,{preview=false,family='',rootScope='',dropdownScope=''}={}){
 const {text:t,panel:p,heading:h,button:b,field:f}=normalizeCommonConfig(config).commonStyle;
 const guard=':not(:where(#chat *,#send_form *,#form_sheld *,#orange-theme-lab,#orange-theme-lab *))';
 const page=rootScope||(preview?'html[data-orange-lab] #chat>.otl-native-page':`html[data-orange-live] :is(.drawer-content,dialog.popup:not(.transparent_dialogue_popup):not(:has(.img_enlarged_container)),#options,.options-content,.list-group)${guard}`);
 const scope=selector=>{const [element,pseudo]=selector.split('::');return `${page} ${element}${preview?'':guard}${pseudo?'::'+pseudo:''}`;};
 // Select2 appends its dropdown to body rather than to the source drawer.
 const dropdown=dropdownScope||(preview?scope('.select2-dropdown'):'html[data-orange-live] body>.select2-container--open .select2-dropdown');
 const select2=selector=>`${scope(selector)},${dropdown} ${selector}`;
 const font=family?JSON.stringify(family):t.font==='auto'?'var(--mainFontFamily, sans-serif)':t.font;
 const fontVariables=`--mainFontSize:${t.size}px;${family||t.font!=='auto'?'--mainFontFamily:'+font+';':''}`;
 const bg=`rgba(${[1,3,5].map(i=>parseInt(p.background.slice(i,i+2),16)).join(',')},${p.opacity})`;
 const input=':is(input:not([type]),input[type=text],input[type=number],input[type=password],input[type=search],input[type=url],input[type=email],select,textarea,.text_pole):not([type=checkbox]):not([type=range]):not([type=color]):not([type=button]):not([type=submit]):not([type=hidden])';
 const button=':is(button,.menu_button,input[type=button],input[type=submit]):not(.red_button):not(.redWarningBG):not(.delete_entry_button):not(.select2-results__option)';
 const disabled=':is(:disabled,[disabled],.disabled,[aria-disabled=true])';
 const headings=preview?':is(h3,.standoutHeader,.inline-drawer-header,.title_restorable)':':is(h3,:where(#user-settings-block) h4,.standoutHeader,.inline-drawer-header,.title_restorable)';
 const rules=[];const add=(selector,css)=>rules.push(`${selector}{${css}}`);
 add(`${page},${dropdown}`,`${fontVariables}--SmartThemeBodyColor:${t.color};--SmartThemeEmColor:${t.muted};--SmartThemeQuoteColor:${t.accent};--SmartThemeBorderColor:${p.border};--SmartThemeBlurTintColor:${bg};--SmartThemeCheckboxTickColor:#fff;color:${t.color}!important;font-family:${font}!important;font-size:${t.size}px!important;text-shadow:none!important`);
 add(page,`background:${bg}!important;border:${p.width}px solid ${p.border}!important;border-radius:${p.radius}px!important;box-shadow:none!important`);
 add(scope(':is(.wi-card-entry,.standoutHeader~.inline-drawer-content)'),`background:${bg}!important;border:${p.width}px solid ${p.border}!important;border-radius:${p.radius}px!important`);
 add(scope(':is(small,.notes,.toggle-description,.otl-sample-note,.otl-sample-version)'),`color:${t.muted}!important`);
 add(scope(headings),`color:${h.color}!important;background:${h.background}!important;font-size:${h.size}px!important;font-weight:${h.weight}!important;border-color:${p.border}!important;border-radius:${h.radius}px!important;text-shadow:none!important;filter:none!important`);
 add(scope(':is(.inline-drawer-header:hover,.inline-drawer-header:has(.inline-drawer-icon.up),.inline-drawer-header[aria-expanded=true],details[open]>.inline-drawer-header)'),`background:${b.hover}!important`);
 add(scope(input),`color:${f.color}!important;background:${f.background}!important;border:1px solid ${f.border}!important;border-radius:${f.radius}px!important;font-family:${font}!important;font-size:${t.size}px!important;text-shadow:none!important;box-shadow:none!important`);
 add(scope(':is(input,textarea)::placeholder'),`color:${t.muted}!important;opacity:1!important`);
 add(scope(`${input}[readonly]:not(:disabled)`),`border-style:dashed!important;color:${t.muted}!important`);
 // Native text buttons declare their own font; icon buttons keep Font Awesome.
 add(scope(button),`color:${b.color}!important;background:${b.background}!important;border:1px solid ${b.border}!important;border-radius:${b.radius}px!important;box-shadow:none!important;text-shadow:none!important;filter:none!important`);
 add(scope(`${button}:not(:is(.fa,.fas,.far,.fab,.fa-solid,.fa-regular,.fa-brands,.fa-light,.fa-thin,.fa-duotone))`),`font-family:${font}!important;font-size:${t.size}px!important`);
 add(scope(`${button}:not(${disabled}):is(:hover,.active,.toggled,.toggleEnabled,[aria-pressed=true])`),`background:${b.hover}!important;border-color:${f.focus}!important`);
 add(scope(':is(input,select,textarea,button,.menu_button,summary,[tabindex]):focus-visible'),`outline:2px solid ${f.focus}!important;outline-offset:2px!important`);
 add(scope(`:is(input,select,textarea,button,.menu_button)${disabled}`),'opacity:.5!important;cursor:not-allowed!important');
 add(scope('input[type=checkbox]'),`accent-color:${t.accent};background:${f.background}!important;border-color:${f.border}!important;box-shadow:none!important;filter:none!important`);
 add(scope('input[type=checkbox]:checked'),`background:${t.accent}!important;border-color:${t.accent}!important`);
 add(scope('input[type=checkbox]:checked::before'),'box-shadow:inset 1em 1em #fff!important');
 add(scope('input[type=range]'),`accent-color:${t.accent};background:${f.border}!important;box-shadow:none!important;filter:none!important`);
 for(const pseudo of ['::-webkit-slider-thumb','::-moz-range-thumb'])add(scope('input[type=range]'+pseudo),`background:${t.accent}!important;border-color:${f.background}!important`);
 add(scope('input[type=color]'),`background:${f.background}!important;border-color:${f.border}!important;border-radius:${f.radius}px!important`);
 add(`${scope(':is(.select2-selection--single,.select2-selection--multiple)')},${dropdown}`,`color:${f.color}!important;background:${f.background}!important;border:1px solid ${f.border}!important;border-radius:${f.radius}px!important;font-family:${font}!important;box-shadow:none!important;text-shadow:none!important`);
 add(select2(':is(.select2-selection__rendered,.select2-selection__clear,.select2-selection__choice__remove,.select2-results__option)'),`color:${f.color}!important`);
 add(select2(':is(.select2-selection__placeholder,.select2-results__option--disabled)'),`color:${t.muted}!important`);
 add(select2(':is(.select2-selection__choice,.select2-selection__choice__remove)'),`background:${b.background}!important;border-color:${f.border}!important`);
 add(select2('.select2-search__field'),`color:${f.color}!important;background:${f.background}!important;border-color:${f.border}!important;font-family:${font}!important`);
 add(select2('.select2-results__option--selectable'),`background:${f.background}!important;opacity:1!important`);
 add(select2(':is(.select2-results__option--highlighted,.select2-results__option--selected)'),`background:${b.hover}!important`);
 add(select2('.select2-results__option::before'),`background:${f.background}!important;border-color:${f.border}!important`);
 add(select2('.select2-results__option--selected::before'),`background:${t.accent}!important;color:#fff!important`);
 add(select2('.select2-results__option--disabled'),'opacity:.5!important;filter:none!important');
 add(scope('.select2-container--disabled .select2-selection'),'opacity:.5!important;cursor:not-allowed!important');
 add(scope(':is(.select2-container--focus,.select2-container--open) .select2-selection'),`outline:2px solid ${f.focus}!important;outline-offset:2px!important`);
 add(`${dropdown} .select2-search__field:focus-visible`,`outline:2px solid ${f.focus}!important;outline-offset:2px!important`);
 const mobileFields=`${scope(input)},${scope(':is(.select2-selection,.select2-selection__rendered,.select2-selection__choice)')},${dropdown} .select2-search__field{font-size:${Math.max(16,t.size)}px!important}`;
 rules.push(`@media(max-width:700px){${mobileFields}}`);
 if(preview)rules.push(`@container(max-width:700px){${mobileFields}}`);
 return rules.join('\n');
}
