// The same command bar is used at every width. Mobile setup never replaces a draft silently.
export function installMobileFlow({shadow,onContinue,onTemplate,onBlank,onImport,onLayout,onVisibility}){
 const doc=shadow.ownerDocument,win=doc.defaultView,make=(tag,text)=>{const n=doc.createElement(tag);if(text)n.textContent=text;return n;},bar=shadow.querySelector('.bar');
 const style=make('style');style.textContent=`.flow-overlay{position:fixed;inset:0;z-index:20100;background:#f5f5ef;overflow:auto;padding:24px max(18px,env(safe-area-inset-left));font:16px/1.6 system-ui;color:#303330}.flow-card{max-width:440px;margin:30px auto}.flow-card h2{font-size:22px}.flow-card h3{font-size:14px;margin-top:28px}.flow-card button,.flow-card select{width:100%;min-height:44px;margin:6px 0}.flow-card p{font-size:13px;color:#73766f}.flow-card select{font-size:16px}`;
 shadow.append(style);const overlay=make('section');overlay.className='flow-overlay hidden';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','作品设置');overlay.innerHTML='<div class="flow-card"><h2>主题工坊</h2><button data-flow="continue" class="primary">继续当前草稿</button><button data-flow="import">导入方案</button><h3>新的起点</h3><select aria-label="起点模板"></select><button data-flow="template">使用所选模板</button><button data-flow="blank">无装饰起稿</button><p>新起点会替换当前草稿，可撤销。已保存方案不受影响。</p><button data-flow="back">返回</button></div>';
 shadow.append(overlay);const picker=overlay.querySelector('select');for(const option of shadow.querySelector('[aria-label="基础模板"]').children)picker.append(option.cloneNode(true));
 const setup=make('button','作品');setup.type='button';setup.className='mobile-work';setup.setAttribute('aria-label','打开作品设置');shadow.querySelector('.desktop-scheme .menu').prepend(setup);
 const labels=[['#save','保存','保存方案'],['#apply-live','应用','应用到酒馆'],['#close','退出','退出编辑']];
 function mobile(){return (win.innerWidth||1200)<=700;}
 function dismissMenus(){for(const menu of bar.querySelectorAll('details'))menu.open=false;}
 function setEditorOpen(){dismissMenus();}
 function sync(){dismissMenus();for(const [selector,short,full]of labels){const n=shadow.querySelector(selector);if(n){n.textContent=mobile()?short:full;n.setAttribute('aria-label',full);}}if(!mobile())hide();onLayout?.();}
 function show(){dismissMenus();onVisibility?.(true);overlay.classList.remove('hidden');overlay.querySelector('[data-flow=continue]').focus?.();}
 function hide(){overlay.classList.add('hidden');onVisibility?.(false);}
 bar.addEventListener('click',e=>{if(e.target.closest?.('button'))dismissMenus();});
 const outside=e=>{if(!(e.composedPath?.()||[]).includes(bar)&&!bar.contains(e.target))dismissMenus();};shadow.addEventListener('pointerdown',outside);doc.addEventListener('pointerdown',outside);
 const escape=e=>{if(e.key==='Escape'){if(!overlay.classList.contains('hidden')){hide();setup.focus?.();e.preventDefault();}dismissMenus();}};shadow.addEventListener('keydown',escape);
 setup.addEventListener('click',show);overlay.addEventListener('click',e=>{const key=e.target.dataset.flow;if(!key)return;if(key==='back'){hide();setup.focus?.();return;}if(key==='continue'){hide();onContinue();}if(key==='import'){hide();onImport();}if(key==='template'&&onTemplate(picker.value)!==false){hide();onContinue();}if(key==='blank'&&onBlank()!==false){hide();onContinue();}});
 win.addEventListener?.('resize',sync);sync();return {show,hide,mobile,setEditorOpen,isToolbarExpanded:()=>true};
}
