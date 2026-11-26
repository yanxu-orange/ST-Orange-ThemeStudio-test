import {createThemeExportSession} from './session.mjs';
const regions={presets:'预设',connection:'API',worldbook:'世界书',settings:'设置',backgrounds:'背景',extensions:'扩展',personas:'人设',characters:'角色',formatting:'回复格式'};
function fieldName(field,source){const layer=String(field).match(/^layers\.(\d+)/);if(layer){const l=source?.layers?.[Number(layer[1])],anchors={header:'头像区',message:'整卡装饰',footer:'尾部区',input:'输入区',avatar:'头像组合'};return (anchors[l?.anchor]||'装饰素材')+' · '+(l?.name||'图片');}const art=String(field).match(/^pageHeaders\.([^.]+)\.scene\.(images|texts)\.(\d+)/);if(art){const v=source?.pageHeaders?.[art[1]]?.scene?.[art[2]]?.[Number(art[3])];return (regions[art[1]]||art[1])+'页头 · '+(v?.name||(art[2]==='images'?'图片':'文字'));}return String(field||'当前方案').replace(/^pageHeaders\.([^.]+)/,(_,p)=>(regions[p]||p)+'页头').replace(/^pageStyle\.([^.]+)/,(_,p)=>(regions[p]||p)+'页面').replace(/^avatarEffects\.(ai|user)/,(_,r)=>(r==='ai'?'AI':'用户')+'头像特效').replace(/^nativeStyle/,'消息按钮与信息').replace(/^layers/,'装饰素材');}
function errorText(d,replaced=false){if(d.code==='REPLACEMENT')return '外链地址无效，请填写公开的 HTTP 或 HTTPS 地址。';if(d.code==='RESOURCE_GEOMETRY')return replaced?'替换后无法确认图片比例，请保留原素材或原链接。':'这张图片缺少可信尺寸，暂不能独立导出。';if(d.code==='PAGE_HEADER_UNSUPPORTED')return '当前页头布局暂不支持独立导出。';if(d.code==='PAGE_STYLE_UNSUPPORTED')return '当前页面的这组设置暂不支持独立导出。';if(d.code==='RESOURCE_RESOLUTION')return '素材无法携带，请检查图片或字体来源。';if(d.field?.startsWith('avatarEffects'))return '当前头像特效暂不支持独立导出。';return '这项设置暂不支持独立导出。';}
async function readInstalledVersion(){
 try{
  const response=await fetch(new URL('../manifest.json',import.meta.url),{cache:'no-cache'});
  if(!response.ok)throw Error();
  return (await response.json()).version;
 }catch{throw Error('无法读取绘境版本，请重试。');}
}
export function requestThemeExport({document,root,trigger,source,value='绘境主题',session=createThemeExportSession(source),download,readVersion=readInstalledVersion}={}){
 return new Promise(resolve=>{
  const make=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;},dialog=make('dialog'),style=make('style'),title=make('h3','导出酒馆主题'),content=make('div'),status=make('div'),actions=make('div'),cancel=make('button','取消'),next=make('button','下一步');
  dialog.className='otl-theme-export';dialog.setAttribute('aria-label','导出酒馆主题');status.setAttribute('role','status');actions.className='export-actions';next.className='primary';cancel.type=next.type='button';
  style.textContent='.otl-theme-export{box-sizing:border-box;width:min(520px,calc(100vw - 24px));max-height:calc(100dvh - 24px);overflow:auto;margin:auto;padding:20px;border:1px solid #dce3e1;background:#fffdf8;color:#34443e;font:14px/1.5 system-ui,sans-serif}.otl-theme-export::backdrop{background:#152c2638}.otl-theme-export *{box-sizing:border-box}.otl-theme-export h3{margin:0 0 16px}.otl-theme-export label{display:grid;gap:6px}.otl-theme-export input{width:100%;min-width:0;min-height:44px;border:1px solid #dce3e1;padding:8px;font:inherit;background:white;color:inherit}.otl-theme-export button{min-height:44px;padding:8px 16px;background:white;color:inherit;border:1px solid #dce3e1;font:inherit;cursor:pointer}.otl-theme-export button:disabled{opacity:.5;cursor:wait}.otl-theme-export .primary{background:#4e6e5d;color:white;border-color:#4e6e5d}.otl-theme-export .export-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}.otl-theme-export .resource{display:grid;grid-template-columns:52px minmax(0,1fr);gap:10px;padding:12px 0;border-bottom:1px solid #dce3e1}.otl-theme-export .resource img{width:52px;height:52px;object-fit:contain}.otl-theme-export .resource small{overflow-wrap:anywhere}.otl-theme-export [role=status]{color:#934855;margin-top:8px;white-space:pre-wrap}.otl-theme-export :focus-visible{outline:2px solid #507c69;outline-offset:2px}';
  const name=make('input');name.value=value;name.maxLength=100;name.setAttribute('aria-label','主题名称');const label=make('label','主题名称');label.append(name);content.append(label,make('p','已按作品自动配套'));actions.append(cancel,next);dialog.append(style,title,content,status,actions);root.append(dialog);
  let done=false,stage='name',busy=false,rows=[];
  function close(result){if(done)return;done=true;session.cancel();try{dialog.close();}catch{}dialog.remove();resolve(result);if(trigger?.isConnected&&!trigger.disabled)trigger.focus?.();}
  function diagnostics(result,replaced=false){status.replaceChildren();const list=make('ul');for(const d of result.diagnostics.filter(d=>d.severity==='error'))list.append(make('li',fieldName(d.field,source)+'：'+errorText(d,replaced)));status.append(make('strong','暂时无法导出'),list);}
  cancel.addEventListener('click',()=>close(null));dialog.addEventListener('cancel',e=>{e.preventDefault();close(null);});dialog.addEventListener('close',()=>close(null));dialog.addEventListener('keydown',e=>{e.stopPropagation();if(!e.isComposing&&e.key==='Escape'){e.preventDefault();close(null);}else if(!e.isComposing&&e.key==='Enter'&&stage==='name'&&e.target===name){e.preventDefault();next.click();}});dialog.addEventListener('keyup',e=>e.stopPropagation());
  next.addEventListener('click',async()=>{
   if(busy||done)return;busy=true;next.disabled=true;status.textContent='';
   try{
    if(stage==='name'){
     const data=await session.prepare(name.value);if(done||!data)return;
     if(!data.result.ok){diagnostics(data.result);return;}
     stage='resources';title.textContent='检查导出素材';content.replaceChildren();rows=[];
     const embedded=data.embeddedBytes||0;
     content.append(make('p','内置素材 '+(data.builtinCount||0)+' 项，自动携带；上传图片默认内嵌。'));
     if(source?.canvasBackground==='image')content.append(make('p','方案壁纸请单独分享。'));
     if(embedded)content.append(make('small','内嵌资源约 '+(embedded/1024).toFixed(0)+' KB'));
     for(const item of data.resources){
      const row=make('div'),body=make('div'),input=make('input');row.className='resource';if(item.category==='image'){const img=make('img');img.alt='';img.src=item.previewSource;row.append(img);}else row.append(make('span','字体'));
      input.type='url';input.placeholder='外链地址（可选）';const original=item.sourceType==='external'?item.exportUrl:'';input.value=original;input.setAttribute('aria-label',fieldName(item.fieldRefs[0],source)+'外链地址');body.append(make('small',fieldName(item.fieldRefs[0],source)),input);row.append(body);content.append(row);rows.push({id:item.id,input,original});
     }
     if(!data.resources.length)content.append(make('p','没有需要补充外链的素材。'));
     next.textContent='导出主题';next.focus();
    }else{
     const replacements={};for(const row of rows){const value=row.input.value.trim();if(value!==row.original){if(!value&&row.original){status.textContent='已有外链请保留或填入新的地址。';row.input.focus();return;}if(value)replacements[row.id]=value;}}
     const output=await session.finish(replacements);if(done||!output)return;
     if(!output.artifact){diagnostics(output.result,Object.keys(replacements).length>0);return;}
     const version=await readVersion();
     if(done)return;
     if(typeof version!=='string'||!/^[0-9][0-9A-Za-z.+-]{0,79}$/.test(version))throw Error('无法读取有效的绘境版本，请重试。');
     const {theme,filename}=output.artifact;
     const custom_css='/* 由「绘境·美化工坊」v'+version+' 生成 · 禁止商用 */\n\n'+theme.custom_css;
     await download({filename,theme:{...theme,custom_css}});close(filename);
    }
   }catch(error){if(!done)status.textContent='导出失败：'+error.message;}
   finally{busy=false;if(!done)next.disabled=false;}
  });
  try{dialog.showModal();name.focus();name.select();}catch(error){close(null);}
 });
}
export function downloadTheme({filename,theme},{document,url=URL}={}){const blob=new Blob([JSON.stringify(theme,null,2)],{type:'application/json'}),href=url.createObjectURL(blob),a=document.createElement('a');a.href=href;a.download=filename;try{a.click();}finally{setTimeout(()=>url.revokeObjectURL(href),1000);}}
