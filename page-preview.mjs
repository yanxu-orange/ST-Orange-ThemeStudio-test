// Representative, isolated fixtures based on SillyTavern 1.18.0 public/index.html
// (user-settings-block, world_entry_template) and css/world-info.css.
// No native IDs, names, persistence or host application handlers are copied.
export const PREVIEW_PAGES={chat:'聊天',settings:'设置',worldbook:'世界书'};
export const PENDING_PREVIEW_PAGES={extensions:'扩展',presets:'预设',characters:'角色',personas:'用户角色',connection:'连接',formatting:'格式',backgrounds:'背景'};

const select=(label,options)=>`<label class="otl-sample-field"><span>${label}</span><select class="text_pole" aria-label="示例${label}">${options.map(text=>`<option>${text}</option>`).join('')}</select></label>`;
const checkbox=(text,checked=false)=>`<label class="checkbox_label"><input type="checkbox" ${checked?'checked':''}><span>${text}</span></label>`;
const range=(label,value,min,max)=>`<label class="otl-sample-field"><span>${label}</span><span class="range-block"><input class="neo-range-slider" aria-label="示例${label}" type="range" min="${min}" max="${max}" value="${value}"><output>${value}</output></span></label>`;
const section=(title,content,open=true)=>`<details class="inline-drawer otl-sample-group" ${open?'open':''}><summary class="inline-drawer-header userSettingsInnerExpandable"><b>${title}</b><span class="otl-sample-chevron" aria-hidden="true">⌄</span></summary><div class="inline-drawer-content">${content}</div></details>`;
const intro=(title,subtitle)=>`<header class="otl-sample-heading"><h3>${title}</h3><span class="otl-sample-version">SillyTavern 1.18</span></header><p class="otl-sample-note">${subtitle} · 虚构示例，仅用于预览，不改变酒馆数据。</p>`;
function settingsMarkup(){return `${intro('用户设置','分组标题、输入、下拉、勾选与滑块')}<div class="otl-settings-columns flex-container spaceEvenly">
<section class="flex-container flexFlowColumn otl-settings-column"><h4 class="title_restorable">界面主题</h4>${select('主题',['默认主题（示例）','浅色主题（示例）'])}${select('头像样式',['圆形','方形','圆角'])}${select('聊天样式',['平面','气泡','文档'])}${section('界面尺寸',range('字体缩放',100,80,150)+range('聊天宽度',80,40,100))}</section>
<section class="flex-container flexFlowColumn otl-settings-column"><h4 class="title_restorable">聊天与消息</h4>${checkbox('显示时间戳',true)}${checkbox('显示消息楼层',true)}${checkbox('显示 Token 计数')}${select('发送键',['Enter 发送','Ctrl + Enter 发送'])}${section('消息行为',checkbox('自动滚动到最新消息',true)+checkbox('允许回复翻页',true))}</section>
<section class="flex-container flexFlowColumn otl-settings-column"><h4 class="title_restorable">其他设置</h4>${select('界面语言',['简体中文','English'])}<label class="otl-sample-field"><span>示例单行输入</span><input class="text_pole" aria-label="示例单行输入" value="给今天留一点空白"></label><label class="otl-sample-field"><span>示例多行输入</span><textarea class="text_pole" rows="3" aria-label="示例多行输入">这是虚构的设置预览。\n可查看多行文字、焦点与滚动效果。</textarea></label>${section('更多选项',checkbox('减少动画')+checkbox('确认删除',true),false)}<label class="otl-sample-field"><span>只读示例</span><input class="text_pole" value="这里只检查外观" readonly></label><div class="otl-sample-actions"><button type="button" class="menu_button" data-sample-toggle aria-pressed="false">选中状态示例</button><button type="button" class="menu_button" disabled>不可用按钮示例</button></div></section>
</div>`;}
// The desktop world-info editor uses Select2 tags; phones use the plaintext field.
// This isolated specimen mirrors those classes without invoking host/plugin handlers.
function keywordField(title,keywords){return `<div class="world_entry_form_control otl-sample-field otl-keyword-field"><span>主要关键字</span><textarea class="text_pole keyprimarytextpole otl-keyword-plain" rows="2" aria-label="${title}示例关键字">${keywords}</textarea><div class="otl-keyword-tags" data-keyword-picker><span class="select2 select2-container select2-container--default"><span class="selection"><span class="select2-selection select2-selection--multiple" role="combobox" tabindex="0" aria-label="${title}示例标签选择" aria-expanded="false"><ul class="select2-selection__rendered"></ul><span class="select2-search select2-search--inline"><input class="select2-search__field" aria-label="${title}添加示例关键字" placeholder="输入后按回车"></span></span></span></span><span class="select2-container select2-container--default select2-container--open otl-keyword-options" hidden><span class="select2-dropdown"><span class="select2-results"><span class="select2-results__options" role="listbox" aria-label="${title}可选示例关键字" aria-multiselectable="true"></span></span></span></span></div></div>`;}
function installKeywordPickers(root,document){
 const pickers=[...root.querySelectorAll('[data-keyword-picker]')];
 for(const picker of pickers){
  const source=picker.parentElement.querySelector('.otl-keyword-plain'),combo=picker.querySelector('[role=combobox]'),tags=picker.querySelector('.select2-selection__rendered'),input=picker.querySelector('.select2-search__field'),popup=picker.querySelector('.otl-keyword-options'),options=picker.querySelector('[role=listbox]');
  const values=()=>source.value.split(/[,，]/).map(value=>value.trim()).filter(Boolean),available=[...new Set([...values(),'邮局','雨天','来信','车站'])];
  const toggle=open=>{popup.hidden=!open;combo.setAttribute('aria-expanded',String(open));picker.querySelector('.select2-container').classList.toggle('select2-container--open',open);};
  const update=next=>{source.value=[...new Set(next)].join(', ');render();};
  function render(){
   tags.replaceChildren();options.replaceChildren();const selected=values(),query=input.value.trim();
   for(const value of selected){const tag=document.createElement('li');tag.className='select2-selection__choice';const remove=document.createElement('button');remove.type='button';remove.className='select2-selection__choice__remove';remove.setAttribute('aria-label','移除示例关键字 '+value);remove.textContent='×';remove.addEventListener('click',event=>{event.stopPropagation();update(values().filter(item=>item!==value));input.focus();});const text=document.createElement('span');text.className='select2-selection__choice__display';text.textContent=value;tag.append(remove,text);tags.append(tag);}
   for(const value of available.filter(value=>value.includes(query))){const option=document.createElement('button');option.type='button';option.className='select2-results__option select2-results__option--selectable'+(selected.includes(value)?' select2-results__option--selected':'');option.setAttribute('role','option');option.setAttribute('aria-selected',String(selected.includes(value)));option.textContent=value;option.addEventListener('click',event=>{event.stopPropagation();update(selected.includes(value)?values().filter(item=>item!==value):[...values(),value]);toggle(true);input.focus();});options.append(option);}
   const unavailable=document.createElement('span');unavailable.className='select2-results__option select2-results__option--disabled';unavailable.setAttribute('role','option');unavailable.setAttribute('aria-disabled','true');unavailable.textContent='不可用示例';options.append(unavailable);
  }
  combo.addEventListener('click',()=>{toggle(true);input.focus();});
  input.addEventListener('input',()=>{render();toggle(true);});
  picker.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();toggle(false);combo.focus();}else if(event.key==='ArrowDown'){event.preventDefault();toggle(true);options.querySelector('button')?.focus();}else if(event.key==='Enter'&&event.target===input){event.preventDefault();const value=input.value.trim();if(value){if(!available.includes(value))available.push(value);input.value='';update([...values(),value]);toggle(true);}}else if(event.key==='Enter'&&event.target===combo){event.preventDefault();toggle(true);input.focus();}});
  picker.addEventListener('focusout',event=>{if(!picker.contains(event.relatedTarget))toggle(false);});
  source.addEventListener('input',render);root.addEventListener('click',event=>{if(!picker.contains(event.target))toggle(false);});render();
 }
}
function worldEntry({title,status,open=false,disabled=false,keywords,content}){return `<article class="world_entry${disabled?' disabledWIEntry':''}"><div class="world_entry_form wi-card-entry"><details class="inline-drawer" ${open?'open':''}><summary class="inline-drawer-header otl-entry-heading"><span class="otl-sample-chevron" aria-hidden="true">⌄</span><span class="otl-entry-title">${title}</span><span class="otl-entry-status">${status}</span>${disabled?'<span class="otl-entry-disabled">已停用</span>':''}</summary><div class="inline-drawer-content"><div class="WIEntryContentAndMemo"><div class="world_entry_thin_controls">${keywordField(title,keywords)}<label class="world_entry_form_control otl-sample-field"><span>可选过滤器</span><input class="text_pole keysecondarytextpole" aria-label="${title}示例过滤器" placeholder="输入辅助关键字"></label></div><label class="world_entry_form_control otl-sample-field otl-entry-content"><span>内容</span><textarea class="text_pole" rows="5" aria-label="${title}示例内容">${content}</textarea></label></div><div class="WIEnteryHeaderControls">${select('插入位置',['角色定义前','角色定义后','指定深度'])}<label class="otl-sample-field"><span>顺序</span><input class="text_pole" aria-label="${title}示例顺序" type="number" value="100" min="0" max="9999"></label><label class="otl-sample-field"><span>触发概率 %</span><input class="text_pole" aria-label="${title}示例触发概率" type="number" value="100" min="0" max="100"></label></div></div></details></div></article>`;}
function worldbookMarkup(){return `${intro('世界书','条目卡片、关键字、正文与停用状态')}<div class="world_info_select_block">${select('世界书',['雨天邮局（示例）'])}<button class="menu_button" type="button" disabled>新增条目</button></div>${section('全局设置',range('扫描深度',2,0,10)+range('上下文预算 %',25,1,100)+checkbox('递归扫描',true)+checkbox('区分大小写')+checkbox('匹配完整单词'),false)}<div class="otl-worldbook-toolbar"><label class="otl-sample-field"><span>搜索条目</span><input class="text_pole" type="search" aria-label="搜索示例世界书条目" placeholder="搜索名称或关键字"></label><span class="otl-sample-note" data-entry-count>3 条示例</span></div><div class="otl-worldbook-entries">${[
{title:'雨天邮局',status:'🔵 常驻',open:true,keywords:'邮局, 雨天',content:'街角的邮局在雨天依然亮着灯。\n窗边放着未写完的信，木桌上留着一枚邮戳。\n这是世界书正文的虚构示例。'},
{title:'街角来信',status:'🟢 关键词',keywords:'来信, 邮差',content:'每天傍晚，邮差会把新到的信放进门口的木箱。'},
{title:'旧车站',status:'🟢 关键词',disabled:true,keywords:'车站, 站台',content:'这是一条停用的虚构条目，用来检查停用外观。'}
].map(worldEntry).join('')}</div><p class="otl-sample-note" data-no-entries hidden>没有匹配的示例条目。</p>`;}
export function createPagePreview({document,ui}={}){
 const pages=new Map(),scrollPositions=new Map();let current='chat',captured=false,pendingScroll=null;
 function ensure(page){
  if(pages.get(page)?.isConnected)return pages.get(page);
  const chat=document.querySelector('#chat');if(!chat||!['settings','worldbook'].includes(page))return null;
  const root=document.createElement('section');root.className='otl-native-page drawer-content';root.dataset.orangeLabFixture='page';root.dataset.previewPage=page;root.setAttribute('aria-label',PREVIEW_PAGES[page]+'页面预览');root.innerHTML=page==='settings'?settingsMarkup():worldbookMarkup();
  installKeywordPickers(root,document);
  for(const button of root.querySelectorAll('[data-sample-toggle]'))button.addEventListener('click',()=>button.setAttribute('aria-pressed',String(button.getAttribute('aria-pressed')!=='true')));
  // Local controls can demonstrate focus and interaction, but never reach native handlers.
  for(const type of ['click','dblclick','input','change','keydown','keyup','submit'])root.addEventListener(type,event=>{event.stopPropagation();if(type==='submit')event.preventDefault();});
  root.addEventListener('input',event=>{
   if(event.target.type==='range')event.target.parentElement.querySelector('output').textContent=event.target.value;
   if(event.target.type==='search'){
    const query=event.target.value.trim().toLocaleLowerCase();let count=0;
    for(const entry of root.querySelectorAll('.world_entry')){const content=[...entry.querySelectorAll('textarea')].map(n=>n.value).join(' ');entry.hidden=!`${entry.querySelector('.otl-entry-title').textContent} ${content}`.toLocaleLowerCase().includes(query);if(!entry.hidden)count++;}
    root.querySelector('[data-entry-count]').textContent=`${count} 条示例`;root.querySelector('[data-no-entries]').hidden=!!count;
   }
  });
  pages.set(page,root);chat.append(root);return root;
 }
 function capture(){const chat=document.querySelector('#chat');if(chat){scrollPositions.set(current,chat.scrollTop);captured=true;}}
 function restore(){const chat=document.querySelector('#chat');if(chat&&pendingScroll!==null){chat.scrollTop=pendingScroll;pendingScroll=null;}}
 function update({deferRestore=false}={}){
  const chat=document.querySelector('#chat');if(!chat)return;
  if(current!==ui.page){if(!captured)scrollPositions.set(current,chat.scrollTop);current=ui.page;captured=false;}
  ensure(ui.page);
  document.documentElement.dataset.otlPreviewPage=ui.page;
  for(const node of chat.querySelectorAll('[data-orange-lab-fixture]'))if(node.dataset.orangeLabFixture==='message'||node.dataset.orangeLabFixture==='page')node.hidden=node.dataset.orangeLabFixture==='message'?ui.page!=='chat':node.dataset.previewPage!==ui.page;
  if(chat.dataset.previewPage!==ui.page){chat.dataset.previewPage=ui.page;pendingScroll=scrollPositions.get(ui.page)||0;}
  if(!deferRestore)restore();
 }
 function close(){for(const page of pages.values())page.remove();pages.clear();scrollPositions.clear();current='chat';captured=false;pendingScroll=null;document.documentElement.removeAttribute('data-otl-preview-page');document.querySelector('#chat')?.removeAttribute('data-preview-page');}
 return {capture,update,restore,close};
}
export const PAGE_PREVIEW_CSS=`
html[data-orange-lab] #chat>[data-orange-lab-fixture][hidden],html[data-orange-lab] .otl-native-page [hidden]{display:none!important}
html[data-orange-lab]:not([data-otl-preview-page=chat]) #chat{padding:0!important;border:0!important;background:transparent!important}
html[data-orange-lab] #chat>.otl-native-page{position:relative!important;inset:auto!important;display:block;box-sizing:border-box;width:100%!important;min-width:0!important;max-width:none!important;height:auto!important;max-height:none!important;overflow:visible!important;transform:none!important;margin:0!important;padding:14px!important;border:1px solid var(--SmartThemeBorderColor,#657168)!important;border-radius:10px!important;background:var(--SmartThemeBlurTintColor,#202722)!important;color:var(--SmartThemeBodyColor,#eee)!important;font:14px/1.5 var(--mainFontFamily,system-ui);text-shadow:none;container-type:inline-size}
html[data-orange-lab] .otl-native-page *{box-sizing:border-box;min-width:0;max-width:100%}
html[data-orange-lab] .otl-native-page :is(h3,h4,p){margin:0}
html[data-orange-lab] .otl-native-page .otl-sample-heading{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
html[data-orange-lab] .otl-native-page h3{font-size:18px}html[data-orange-lab] .otl-native-page h4{font-size:15px;padding:4px 7px;border:1px solid var(--SmartThemeBorderColor,#657168);border-radius:10px;background-image:linear-gradient(348deg,#ffffff20 2%,#5555 10%,#0008 95%,var(--SmartThemeQuoteColor,#80a584) 100%)}
html[data-orange-lab] .otl-native-page :is(.otl-sample-note,.otl-sample-version){font-size:12px;opacity:.75;line-height:1.5}
html[data-orange-lab] .otl-native-page>.otl-sample-note{margin:6px 0 14px}
html[data-orange-lab] .otl-settings-columns{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;align-items:start}
html[data-orange-lab] .otl-settings-column{display:flex;flex-direction:column;gap:12px}
html[data-orange-lab] .otl-native-page .otl-sample-field{display:flex;flex-direction:column;gap:5px;margin:0;flex:1}
html[data-orange-lab] .otl-native-page :is(input:not([type=checkbox]):not([type=range]),select,textarea){width:100%;margin:0;padding:8px;border:1px solid var(--SmartThemeBorderColor,#657168);border-radius:5px;background:var(--black30a,#0004);color:inherit;font:inherit;line-height:1.5;min-height:36px}
html[data-orange-lab] .otl-native-page textarea{height:auto;resize:vertical;white-space:pre-wrap}
html[data-orange-lab] .otl-native-page .checkbox_label{display:flex;gap:8px;align-items:center;margin:0;min-height:32px}
html[data-orange-lab] .otl-native-page input[type=checkbox]{width:18px;height:18px;flex:0 0 18px;margin:0;accent-color:var(--SmartThemeQuoteColor,#80a584)}
html[data-orange-lab] .otl-native-page .range-block{display:flex;gap:8px;align-items:center}html[data-orange-lab] .otl-native-page input[type=range]{width:100%;min-width:0;flex:1;margin:0;accent-color:var(--SmartThemeQuoteColor,#80a584)}
html[data-orange-lab] .otl-native-page .range-block output{width:3em;text-align:end}
html[data-orange-lab] .otl-native-page .menu_button{display:inline-flex;align-items:center;justify-content:center;width:auto;padding:7px 10px;min-height:36px;margin:0;font:inherit;border:1px solid var(--SmartThemeBorderColor,#657168);border-radius:5px;background:var(--black30a,#0004);color:inherit}
html[data-orange-lab] .otl-native-page :disabled{opacity:.45;cursor:default}
html[data-orange-lab] .otl-native-page .inline-drawer{width:100%;margin:0}
html[data-orange-lab] .otl-native-page .inline-drawer-header{display:flex;align-items:center;gap:8px;padding:7px 0;cursor:pointer;list-style:none;font:inherit;user-select:none}
html[data-orange-lab] .otl-native-page summary::-webkit-details-marker{display:none}
html[data-orange-lab] .otl-native-page .otl-sample-group>.inline-drawer-header{justify-content:space-between;border-bottom:1px solid var(--SmartThemeBorderColor,#657168)}
html[data-orange-lab] .otl-native-page .otl-sample-chevron{display:inline-block;transform:rotate(-90deg);flex:none;font-size:18px}
html[data-orange-lab] .otl-native-page details[open]>.inline-drawer-header>.otl-sample-chevron{transform:none}
html[data-orange-lab] .otl-native-page details>.inline-drawer-content{display:none;padding:10px 0}
html[data-orange-lab] .otl-native-page details[open]>.inline-drawer-content{display:flex!important;flex-direction:column;gap:12px}
html[data-orange-lab] .otl-native-page .world_info_select_block{display:flex;gap:8px;align-items:end;margin-bottom:12px}
html[data-orange-lab] .otl-worldbook-toolbar{display:flex;align-items:end;gap:12px;margin:14px 0 10px}
html[data-orange-lab] .otl-worldbook-entries{display:flex;flex-direction:column;gap:8px}
html[data-orange-lab] .otl-native-page .wi-card-entry{border:1px solid var(--SmartThemeBorderColor,#657168);border-radius:10px;padding:0 10px;margin:0}
html[data-orange-lab] .otl-native-page .otl-entry-title{flex:1;font-weight:600;overflow-wrap:anywhere}
html[data-orange-lab] .otl-native-page :is(.otl-entry-status,.otl-entry-disabled){font-size:12px;white-space:nowrap}
html[data-orange-lab] .otl-native-page .disabledWIEntry{opacity:.45;filter:grayscale(1)}
html[data-orange-lab] .otl-native-page .WIEntryContentAndMemo{display:flex;gap:12px;flex-flow:row!important;align-items:start}
html[data-orange-lab] .otl-native-page .world_entry_thin_controls{display:flex;flex-direction:column;gap:10px;flex:1}
html[data-orange-lab] .otl-native-page .otl-entry-content{flex:2}
html[data-orange-lab] .otl-native-page .WIEnteryHeaderControls{display:grid;grid-template-columns:2fr 1fr 1fr;gap:10px;width:100%}
html[data-orange-lab] .otl-native-page :is(input,select,textarea,summary,button):focus-visible{outline:2px solid var(--SmartThemeQuoteColor,#80a584);outline-offset:2px}

html[data-orange-lab] .otl-native-page .otl-sample-actions{display:flex;gap:6px;flex-wrap:wrap}
html[data-orange-lab] .otl-native-page .otl-keyword-tags{position:relative}
html[data-orange-lab] .otl-native-page .otl-keyword-plain{display:none}
html[data-orange-lab] .otl-native-page .select2-container{display:block;width:100%}
html[data-orange-lab] .otl-native-page .select2-selection{display:block;padding:5px;min-height:36px;cursor:text}
html[data-orange-lab] .otl-native-page .select2-selection__rendered{list-style:none;display:flex;flex-wrap:wrap;gap:4px;padding:0;margin:0}
html[data-orange-lab] .otl-native-page .select2-selection__choice{display:inline-flex;align-items:center;gap:5px;border:1px solid;border-radius:4px;padding:2px 5px}
html[data-orange-lab] .otl-native-page .select2-selection__choice__remove{position:static;inset:auto;transform:none;display:inline-flex;width:auto;height:auto;margin:0;padding:0 4px;border:0;background:none}
html[data-orange-lab] .otl-native-page .select2-selection__choice__display{padding:0}
html[data-orange-lab] .otl-native-page .select2-search__field{width:100%;min-height:30px;padding:3px;border:0;margin-top:4px}
html[data-orange-lab] .otl-native-page .otl-keyword-options{position:absolute;top:100%;left:0;z-index:5}
html[data-orange-lab] .otl-native-page .select2-dropdown{display:block;padding:4px;box-shadow:0 6px 14px #0002}
html[data-orange-lab] .otl-native-page .select2-results__options{display:grid;max-height:160px;overflow:auto}
html[data-orange-lab] .otl-native-page .select2-results__option{text-align:start;min-height:32px;border:0;border-radius:0;padding:4px 8px}
@container(max-width:600px){html[data-orange-lab] .otl-native-page .otl-keyword-tags{display:none}html[data-orange-lab] .otl-native-page .otl-keyword-plain{display:block}}
@container(max-width:600px){html[data-orange-lab] .otl-settings-columns{grid-template-columns:1fr}html[data-orange-lab] .otl-native-page .WIEntryContentAndMemo{flex-direction:column!important}html[data-orange-lab] .otl-native-page .WIEntryContentAndMemo>*{width:100%}html[data-orange-lab] .otl-native-page .WIEnteryHeaderControls{grid-template-columns:repeat(2,minmax(0,1fr))}html[data-orange-lab] .otl-native-page .WIEnteryHeaderControls>:first-child{grid-column:1/-1}}
@media(max-width:700px){html[data-orange-lab] #chat>.otl-native-page{padding:12px!important}html[data-orange-lab] .otl-native-page :is(input,select,textarea){font-size:16px!important}html[data-orange-lab] .otl-native-page :is(summary,.menu_button,.checkbox_label){min-height:44px}}
`;
