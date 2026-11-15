import {newCaption,validateCaptions} from './captions.mjs';
const selectors={version:'.welcomeHeaderVersionDisplay',settings:'.recentChatsSettings',show:'.showRecentChats',hide:'.hideRecentChats'};
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
export function newPageHeaderNative(kind){return kind==='version'?{x:0,y:0,width:'auto',size:16,color:'#354b42',font:'serif',weight:'auto',fontLink:null}:{x:0,y:0,width:32,size:20,color:'#354b42'};}
export function normalizePageHeaderNative(raw={hideLogo:false,version:null,settings:null,show:null,hide:null}){
 if(!object(raw)||Object.keys(raw).some(k=>!['hideLogo',...Object.keys(selectors)].includes(k))||typeof raw.hideLogo!=='boolean')throw Error('首页原生对象无效');
 const result={hideLogo:raw.hideLogo};for(const key of Object.keys(selectors)){const v=raw[key];if(v===null||v===undefined){result[key]=null;continue;}const defaults=newPageHeaderNative(key);if(!object(v)||Object.keys(v).some(k=>!Object.hasOwn(defaults,k)))throw Error('首页原生对象字段无效');const n={...defaults,...v};
 if(!Number.isFinite(n.x)||n.x< -100||n.x>200||!Number.isFinite(n.y)||n.y< -400||n.y>1600||!Number.isFinite(n.size)||n.size<8||n.size>200||typeof n.color!=='string'||!/^#[\da-f]{6}$/i.test(n.color))throw Error('首页原生对象样式无效');
 if(key==='version'){const caption=newCaption({...n,id:'native-version',scope:'both'});delete caption.position;validateCaptions([caption],{large:true,header:true});}else if(!Number.isFinite(n.width)||n.width<16||n.width>200)throw Error('首页按钮宽度无效');result[key]=n;}
 return result;
}
export function createPageHeaderNative({document}={}){
 const changed=new Map(),hadStyle=new Map();let state=null,families={};
 function set(node,key,value,wanted){if(!node)return;let props=changed.get(node);if(!props){props=new Map();changed.set(node,props);hadStyle.set(node,node.hasAttribute('style'));}if(!props.has(key))props.set(key,{old:node.style.getPropertyValue(key),priority:(typeof node.style.getPropertyPriority==='function'?node.style.getPropertyPriority(key):''),last:''});node.style.setProperty(key,value,'important');props.get(key).last=node.style.getPropertyValue(key);if(!wanted.has(node))wanted.set(node,new Set());wanted.get(node).add(key);}
 function restore(node,key,v){if(node.style.getPropertyValue(key)===v.last){if(v.old)node.style.setProperty(key,v.old,v.priority);else node.style.removeProperty(key);}}
 function sync(entries){state=entries;const wanted=new Map();for(const {host,config:v}of entries){const n=v.native;set(host,'position','relative',wanted);set(host,'isolation','isolate',wanted);set(host,'min-height',(v.height+v.topGap)+'px',wanted);
 if(n.hideLogo)set(host.querySelector('.welcomeHeaderLogo'),'display','none',wanted);
 for(const [key,selector]of Object.entries(selectors)){const p=n[key];if(!p)continue;const node=host.querySelector(':scope > '+selector);for(const [prop,value]of Object.entries({position:'absolute',left:p.x+'%',top:(v.topGap+p.y)+'px',right:'auto',bottom:'auto',width:key==='version'?(p.width==='auto'?'auto':p.width+'%'):p.width+'px','font-size':p.size+'px',color:p.color,'z-index':'2'}))set(node,prop,value,wanted);
 if(key==='version'){set(node,'white-space','normal',wanted);set(node,'overflow-wrap','anywhere',wanted);set(node,'font-family',families['page-header-home-native-version']?`"${families['page-header-home-native-version']}",${p.font}`:p.font,wanted);if(p.weight!=='auto')set(node,'font-weight',String(p.weight),wanted);}
 }
 }
 for(const [node,props]of changed){for(const [key,v]of props)if(!wanted.get(node)?.has(key)){restore(node,key,v);props.delete(key);}if(!props.size){if(!hadStyle.get(node)&&!node.style.cssText)node.removeAttribute('style');hadStyle.delete(node);changed.delete(node);}}
 }
 return {sync,updateFonts(next={}){const changed=(families['page-header-home-native-version']||'')!==(next['page-header-home-native-version']||'');families=next;const active=!!state?.some(e=>e.config.native.version);if(changed&&active)sync(state);return changed&&active;},stop(){for(const [node,props]of changed)for(const [key,v]of props)restore(node,key,v);for(const node of changed.keys())if(!hadStyle.get(node)&&!node.style.cssText)node.removeAttribute('style');changed.clear();hadStyle.clear();state=null;}};
}
