// Only native scrollbar rendering is changed. Existing styles and overflow stay intact.
export const SCROLLBAR_CSS='*{scrollbar-width:none!important}*::-webkit-scrollbar{display:none!important;width:0!important;height:0!important}';
export function normalizeScrollbars(value){if(value!==undefined&&typeof value!=='boolean')throw Error('隐藏滚动条设置必须为布尔值');return value!==false;}
export function createScrollbarVisibility({document,ownShadow,MutationObserver:Observer=document.defaultView?.MutationObserver}={}){
 const roots=new Map(),known='lantai-benmo-host#lantai-benmo-panel,lantai-benmo-notice';let observer=null,enabled=false;
 function add(root){if(!root||roots.has(root))return;const style=document.createElement('style');style.dataset.otlScrollbarStyle='';style.textContent=SCROLLBAR_CSS;root.append(style);roots.set(root,style);}
 function discover(node){if(node.nodeType!==1)return;if(node.matches(known))add(node.shadowRoot);for(const host of node.querySelectorAll(known))add(host.shadowRoot);}
 function stop(){enabled=false;observer?.disconnect();observer=null;for(const style of roots.values())style.remove();roots.clear();}
 function set(value){if(!value){stop();return;}if(enabled)return;enabled=true;add(document.head);add(ownShadow);discover(document.documentElement);
  if(Observer){observer=new Observer(records=>{for(const r of records)for(const n of r.addedNodes)discover(n);for(const [root,style]of roots)if(root.host&&!root.host.isConnected){style.remove();roots.delete(root);}});observer.observe(document.body,{childList:true,subtree:true});}
 }
 return {set,stop};
}
