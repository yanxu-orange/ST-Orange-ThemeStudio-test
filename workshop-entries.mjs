// Browser-local navigation preferences. Never serialize these into a theme scheme.
export const WORKSHOP_ENTRIES_KEY='orange.theme-lab.entries.v1';
export const DEFAULT_WORKSHOP_ENTRIES=Object.freeze({wand:true,extensions:true,floating:true});
const labels={wand:'魔棒',extensions:'扩展',floating:'悬浮入口'};
const targets={wand:'#extensionsMenu',extensions:'#extensions_settings'};

export function createWorkshopEntries({document,launcher,onOpen=()=>{},onStopApplied=()=>{},onMessage=()=>{},storage,key=WORKSHOP_ENTRIES_KEY}={}){
 if(!document||!launcher)throw new TypeError('Workshop entries require document and launcher');
 let preferences={...DEFAULT_WORKSHOP_ENTRIES},editing=false,applied=false,destroyed=false;
 const entries=new Map(),settings=new Set();
 const report=message=>onMessage(message);
 try{
  if(storage===undefined)storage=document.defaultView?.localStorage||globalThis.localStorage;
  if(!storage)throw new Error('浏览器存储不可用');
  const raw=storage.getItem(key);
  if(raw!=null){
   const value=JSON.parse(raw);
   if(!value||Object.keys(labels).some(name=>typeof value[name]!=='boolean')||!Object.keys(labels).some(name=>value[name]))throw new Error('入口设置无效');
   preferences=Object.fromEntries(Object.keys(labels).map(name=>[name,value[name]]));
  }
 }catch(error){report('入口设置未能读取，已使用默认入口：'+error.message);}
 const make=(tag,text)=>{const node=document.createElement(tag);if(text)node.textContent=text;return node;};
 const button=(text,action)=>{const node=make('button',text);node.type='button';node.className='menu_button';node.addEventListener('click',action);return node;};
 function ensureEntries(){
  for(const [name,selector] of Object.entries(targets)){
   const target=document.querySelector(selector),old=entries.get(name);
   if(old?.root.parentNode===target&&target?.isConnected)continue;
   old?.root.remove();entries.delete(name);
   if(!target)continue;
   const root=make('div');root.dataset.workshopEntry=name;
   root.className=name==='wand'?'list-group-item flex-container flexGap5':'extension_container';
   const open=button('打开主题工坊',()=>onOpen());
   const stop=button('退出应用',()=>onStopApplied());
   root.append(open,stop);target.append(root);entries.set(name,{root,open,stop});
  }
 }
 function available(name){
  if(name==='floating')return !!launcher.isConnected;
  const entry=entries.get(name);
  return !!entry?.root.isConnected&&(name!=='wand'||!!document.querySelector('#extensionsMenuButton')?.isConnected);
 }
 function updateSettings(){
  for(const root of settings){
   for(const input of root.querySelectorAll('[data-workshop-entry-choice]')){
    const name=input.dataset.workshopEntryChoice;
    input.checked=preferences[name];
    const hint=root.querySelector(`[data-workshop-entry-hint="${name}"]`);
    hint.textContent=name!=='floating'&&!available(name)?'（等待酒馆入口载入）':'';
   }
  }
 }
 function sync(){
  if(destroyed)return;
  ensureEntries();
  for(const [name,{root,open,stop}] of entries){
   // Explicit inline display is understood by SillyTavern's native wand item counter.
   const display=preferences[name]?'':'none';
   if(root.style.display!==display)root.style.display=display;
   const text=editing||applied?'继续编辑':'打开主题工坊';
   if(open.textContent!==text)open.textContent=text;
   if(stop.hidden!==!applied)stop.hidden=!applied;
   if(stop.style.display!==(applied?'':'none'))stop.style.display=applied?'':'none';
  }
  const hide=editing||!preferences.floating;
  if(launcher.classList.contains('hidden')!==hide)launcher.classList.toggle('hidden',hide);
  updateSettings();
 }
 function setPreference(name,enabled){
  if(destroyed||!Object.hasOwn(labels,name))return false;
  sync();
  const next={...preferences,[name]:!!enabled};
  if(!Object.keys(labels).some(entry=>next[entry]&&available(entry))){
   report('请至少保留一个已可用的工坊入口；可先启用魔棒或扩展，等待入口载入后再关闭悬浮入口。');updateSettings();return false;
  }
  try{
   if(!storage)throw new Error('浏览器存储不可用');
   storage.setItem(key,JSON.stringify(next));
  }catch(error){report('入口设置未保存，已保留原设置：'+error.message);updateSettings();return false;}
  preferences=next;sync();return true;
 }
 function renderSettings(){
  const root=make('section');root.dataset.workshopEntrySettings='';
  root.append(make('h4','工坊入口'),make('p','仅保存在当前浏览器，不随方案保存或导出。至少保留一个可用入口。'));
  for(const [name,title] of Object.entries(labels)){
   const label=make('label');label.className='checkbox_label';
   const input=make('input');input.type='checkbox';input.dataset.workshopEntryChoice=name;input.setAttribute('aria-label',title+'入口');
   input.addEventListener('change',()=>setPreference(name,input.checked));
   const hint=make('small');hint.dataset.workshopEntryHint=name;
   label.append(input,make('span',title),hint);root.append(label);
  }
  settings.add(root);updateSettings();return root;
 }
 sync();
 // Native wand HTML is loaded asynchronously; also restore our entries after host rerenders.
 const Observer=document.defaultView?.MutationObserver;
 const observer=Observer?new Observer(records=>{
  if(records.some(record=>record.type==='childList'&&[...record.addedNodes,...record.removedNodes].some(node=>node.nodeType===1&&!node.closest?.('[data-workshop-entry-settings]')&&!node.closest?.('[data-workshop-entry]'))))sync();
 }):null;
 observer?.observe(document.body,{childList:true,subtree:true});
 return {
  get preferences(){return {...preferences};},
  renderSettings,setPreference,sync,
  setEditing(value){editing=!!value;sync();},
  setApplied(value){applied=!!value;sync();},
  destroy(){destroyed=true;observer?.disconnect();for(const {root} of entries.values())root.remove();entries.clear();settings.clear();},
 };
}
