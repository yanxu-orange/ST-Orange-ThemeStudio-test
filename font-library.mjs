import {createFontSession} from './font-sources.mjs';
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
/** A manager never receives a theme object. Selection is available only to a caller. */
export function renderFontLibrary(container,{library,onUse,onError=()=>{}}){
 const d=container.ownerDocument,make=(tag,text)=>{const n=d.createElement(tag);if(text)n.textContent=text;return n;};
 const button=(text,action)=>{const n=make('button',text);n.type='button';n.addEventListener('click',action);return n;};
 const toolbar=make('div'),list=make('div'),form=make('form'),status=make('p');list.className='font-library-list';status.setAttribute('role','status');form.hidden=true;form.className='font-library-form';
 const name=make('input'),url=make('input'),weight=make('select');name.type='text';name.maxLength=80;url.type='url';url.maxLength=2048;
 for(const [control,label] of [[name,'字体名称'],[url,'字体文件直链'],[weight,'字体文件字重']]){control.setAttribute('aria-label',label);const field=make('label',label);field.className='field';field.append(control);form.append(field);}
 for(const [value,title] of [['400','常规'],['700','粗体'],['100 900','可变'],['100','极细'],['200','纤细'],['300','细体'],['500','中等'],['600','半粗'],['800','特粗'],['900','重体']]){const option=make('option',title);option.value=value;weight.append(option);}
 let editing=null,disposed=false;const previews=new Map();
 const session=createFontSession({document:d,onChange:()=>{if(disposed)return;const families=session.families();for(const [key,node]of previews){node.style.fontFamily=families[key]?`"${families[key]}"`:'serif';const state=session.status(key);node.title=state==='error'?'字体加载失败，显示默认字体':state==='loading'?'字体加载中':'';}}});
 function edit(record){editing=record?.name||null;name.value=record?.name||'';url.value=record?.fontLink.url||'';weight.value=record?.fontLink.faceWeight||'400';form.hidden=false;name.focus();}
 toolbar.append(button('添加字体',()=>edit(null)));container.append(toolbar,list,form,status);
 const save=button('保存字体',()=>{try{const old=editing;const record=library.save(name.value,{url:url.value.trim(),faceWeight:weight.value});if(old&&old!==record.name)library.remove(old);form.hidden=true;refresh();status.textContent='字体已保存';}catch(error){status.textContent=error.message;onError(error.message);}}),cancel=button('取消',()=>{form.hidden=true;});form.append(save,cancel);form.addEventListener('submit',event=>{event.preventDefault();save.click();});
 function refresh(){try{const records=library.list();list.replaceChildren();previews.clear();const items={};if(!records.length)list.append(make('p','暂无字体，点击“添加字体”保存名称和链接。'));
  records.forEach((record,index)=>{const card=make('div'),title=make('strong',record.name),preview=make('p','山川与日月 · Aa 0123'),actions=make('div');card.className='font-library-card';preview.className='font-library-preview';const key='font'+index;items[key]=record;previews.set(key,preview);actions.className='actions';if(onUse)actions.append(button('使用字体',()=>onUse(record)));actions.append(button('编辑',()=>edit(record)),button('移除',()=>{try{library.remove(record.name);refresh();status.textContent='已从字体库移除';}catch(error){onError(error.message);}}));card.append(title,preview,actions);list.append(card);});session.update(items);
 }catch(error){onError(error.message);status.textContent=error.message;}}
 refresh();return ()=>{disposed=true;session.dispose();};
}
