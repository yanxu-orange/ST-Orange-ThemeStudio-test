/** Linkedom reports the observed root as childList.target, unlike a browser.
 * Give DOM unit tests real parent targets without adding emulator behavior to production. */
export function mutationObserverFor(document){
 const Native=document.defaultView.MutationObserver;
 return class MutationObserver {
  constructor(callback){
   this.parents=new WeakMap();this.roots=new Set();
   this.observer=new Native(records=>{
    const normalized=records.map(record=>{
     if(record.type!=='childList')return record;
     const node=record.addedNodes[0]||record.removedNodes[0];
     return {...record,target:record.addedNodes.length?node.parentNode||record.target:this.parents.get(node)||record.target};
    });
    for(const root of this.roots)this.remember(root);
    callback(normalized);
   });
  }
  remember(node){for(const child of node.childNodes){this.parents.set(child,node);this.remember(child);}}
  observe(node,options){this.roots.add(node);this.remember(node);this.observer.observe(node,options);}
  disconnect(){this.observer.disconnect();this.roots.clear();}
 };
}
