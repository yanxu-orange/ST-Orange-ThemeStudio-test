let serial=0;
/** Font faces belong to this session only. Loading cannot be cancelled, so late results are ignored. */
export function createFontSession({document,FontFace:Face=document.defaultView?.FontFace,onChange=()=>{},timeout=10000,setTimer=setTimeout,clearTimer=clearTimeout}={}){
  let disposed=false;const entries=new Map();let current={};
  const keyFor=link=>JSON.stringify(link);
  function changed(){if(!disposed)onChange();}
  function remove(entry){entry.active=false;clearTimer(entry.timer);if(entry.face)document.fonts?.delete?.(entry.face);}
  function update(items){
    if(disposed)return;current=items;
    const wanted=new Set(Object.keys(items).filter(k=>items[k]?.fontLink).map(k=>keyFor(items[k].fontLink)));
    for(const [key,entry]of entries)if(!wanted.has(key)){remove(entry);entries.delete(key);}
    for(const key of wanted){
      if(entries.has(key))continue;
      const link=JSON.parse(key),entry={status:'loading',family:'OrangeTextFont'+(++serial),active:true,face:null,timer:null};entries.set(key,entry);
      if(!Face||!document.fonts?.add){entry.status='error';continue;}
      try{
        const face=new Face(entry.family,`url(${JSON.stringify(link.url)})`,{weight:link.faceWeight,style:'normal',display:'swap'});entry.face=face;
        entry.timer=setTimer(()=>{if(!entry.active||disposed)return;entry.status='error';entry.active=false;changed();},timeout);
        Promise.resolve(face.load()).then(()=>{
          if(!entry.active||disposed)return;clearTimer(entry.timer);try{document.fonts.add(face);entry.status='loaded';}catch{entry.status='error';entry.active=false;}changed();
        },()=>{if(!entry.active||disposed)return;clearTimer(entry.timer);entry.status='error';entry.active=false;changed();});
      }catch{clearTimer(entry.timer);entry.status='error';entry.active=false;}
    }
  }
  return {update,
    families(){return Object.fromEntries(Object.keys(current).flatMap(k=>{const link=current[k]?.fontLink,entry=link&&entries.get(keyFor(link));return entry?.status==='loaded'?[[k,entry.family]]:[];}));},
    status(key){const link=current[key]?.fontLink;return link?entries.get(keyFor(link))?.status||'idle':'idle';},
    retry(){for(const [key,e]of entries)if(e.status==='error'){remove(e);entries.delete(key);}update(current);changed();},
    dispose(){if(disposed)return;disposed=true;for(const e of entries.values())remove(e);entries.clear();current={};}
  };
}
