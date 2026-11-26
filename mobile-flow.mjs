// The same command bar is used at every width. Mobile setup never replaces a draft silently.
export function installMobileFlow({shadow,onContinue,onBlank,onImport,onVisibility,onLibrary}){
 const doc=shadow.ownerDocument,win=doc.defaultView,make=(tag,text)=>{const n=doc.createElement(tag);if(text)n.textContent=text;return n;},bar=shadow.querySelector('.bar');
 const style=make('style');style.textContent=`.flow-overlay{position:fixed;inset-inline:0;top:var(--wb-vv-top,0px);height:var(--wb-vv-height,100dvh);box-sizing:border-box;z-index:20100;background:#f5f5ef;overflow:auto;overscroll-behavior:contain;padding:max(20px,env(safe-area-inset-top)) max(18px,env(safe-area-inset-right)) max(20px,env(safe-area-inset-bottom)) max(18px,env(safe-area-inset-left));font:16px/1.6 system-ui;color:#303330}.flow-card{max-width:440px;margin:clamp(0px,4vh,30px) auto 0}.flow-card h2{font-size:22px;margin:0 0 12px}.flow-card button{width:100%;min-height:44px;margin:4px 0}.flow-card [data-flow=back]{border-color:transparent}`;
 shadow.append(style);const overlay=make('section');overlay.className='flow-overlay hidden';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','工坊首页');overlay.innerHTML='<div class="flow-card"><h2>工坊首页</h2><button data-flow="library" class="primary">从已有作品开始</button><button data-flow="blank">从空白开始</button><button data-flow="continue" hidden>继续当前草稿</button><button data-flow="back">返回</button></div>';
 shadow.append(overlay);
 const setup=make('button','工坊首页');setup.type='button';setup.className='mobile-work';setup.setAttribute('aria-label','打开工坊首页');const menu=shadow.querySelector('.desktop-scheme .menu');(menu.querySelector('[data-menu-group="works"]')||menu).append(setup);
 const labels=[['#save','保存草稿','保存草稿'],['#apply-live','应用','应用到酒馆'],['#close','退出','退出编辑']];
 function mobile(){return (win.innerWidth||1200)<=700;}
 function dismissMenus(){for(const menu of bar.querySelectorAll('details'))menu.open=false;}
 function setEditorOpen(){dismissMenus();}
 let opener;
 function sync(){dismissMenus();for(const [selector,short,full]of labels){const n=shadow.querySelector(selector);if(n){const text=mobile()?short:full;if(n.textContent!==text)n.textContent=text;if(n.getAttribute('aria-label')!==full)n.setAttribute('aria-label',full);}}}
 function show({canContinue=false, source=setup}={}){
  opener=source;dismissMenus();onVisibility?.(true);overlay.classList.remove('hidden');
  overlay.querySelector('[data-flow=continue]').hidden=!canContinue;
  overlay.scrollTop=0;
  overlay.querySelector('[data-flow=library]').focus?.({preventScroll:true});
 }
 function hide(){overlay.classList.add('hidden');onVisibility?.(false);}
 bar.addEventListener('click',e=>{if(e.target.closest?.('button'))dismissMenus();});
 const outside=e=>{if(!(e.composedPath?.()||[]).includes(bar)&&!bar.contains(e.target))dismissMenus();};shadow.addEventListener('pointerdown',outside);doc.addEventListener('pointerdown',outside);
 const escape=e=>{if(e.key==='Escape'){if(!overlay.classList.contains('hidden')){hide();opener?.focus?.();e.preventDefault();}dismissMenus();}};shadow.addEventListener('keydown',escape);
 setup.addEventListener('click',()=>show({canContinue:true}));overlay.addEventListener('click',e=>{const key=e.target.dataset.flow;if(!key)return;if(key==='back'){hide();opener?.focus?.();return;}if(key==='continue'){hide();onContinue();}if(key==='import'){hide();onImport();}if(key==='library'){hide();onLibrary?.(opener);}if(key==='blank'&&onBlank()!==false){hide();onContinue();}});
 win.addEventListener?.('resize',sync);sync();return {show,hide,mobile,setEditorOpen,isToolbarExpanded:()=>true};
}
