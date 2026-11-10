import {validateCaptionStyle} from './captions.mjs';
export const FONT_LIBRARY_KEY='orange.theme-lab.font-library.v1';
export function createFontLibrary(storage=globalThis.localStorage){
 const read=()=>{const raw=storage.getItem(FONT_LIBRARY_KEY);return raw?JSON.parse(raw):[];};
 return {
  list:read,
  save(name,fontLink){name=name.trim();if(!name||name.length>80)throw Error('请填写字体名称（最多80字）');const link=validateCaptionStyle({fontLink}).fontLink;if(!link)throw Error('请填写字体直链');const records=read(),record={name,fontLink:link},index=records.findIndex(r=>r.name===name);if(index<0)records.push(record);else records[index]=record;storage.setItem(FONT_LIBRARY_KEY,JSON.stringify(records));return record;},
  remove(name){storage.setItem(FONT_LIBRARY_KEY,JSON.stringify(read().filter(r=>r.name!==name)));}
 };
}
export function renderFontLibrary(container,{library,link,face,onSelect=()=>{},onError=()=>{}}){
 const d=container.ownerDocument,make=(tag,text)=>{const n=d.createElement(tag);if(text)n.textContent=text;return n;};
 const row=make('div');row.className='paired-fields';const label=make('label','我的字体'),select=make('select');select.setAttribute('aria-label','我的字体');label.className='field';label.append(select);row.append(label);container.append(row);
 const refresh=()=>{try{select.replaceChildren();const first=make('option','选择已保存字体');first.value='';select.append(first);for(const r of library.list()){const o=make('option',r.name);o.value=r.name;select.append(o);}}catch(e){onError(e.message);}};
 select.addEventListener('change',()=>{try{const record=library.list().find(r=>r.name===select.value);if(!record)return;link.value=record.fontLink.url;face.value=record.fontLink.faceWeight;name.value=record.name;onSelect();}catch(e){onError(e.message);}});
 const details=make('details'),summary=make('summary','保存字体'),name=make('input');name.type='text';name.maxLength=80;name.placeholder='字体名称';name.setAttribute('aria-label','字体名称');details.append(summary,name);
 const save=make('button','保存到字体库');save.type='button';save.addEventListener('click',()=>{try{const record=library.save(name.value,{url:link.value.trim(),faceWeight:face.value});refresh();select.value=record.name;}catch(e){onError(e.message);}});
 const remove=make('button','从字体库移除');remove.type='button';remove.addEventListener('click',()=>{if(!select.value)return;try{library.remove(select.value);refresh();}catch(e){onError(e.message);}});details.append(save,remove);container.append(details);refresh();
}
