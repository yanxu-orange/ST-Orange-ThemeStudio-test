import {TIME_FONTS,validateTextItems} from './text-layout.mjs';
export const CAPTION_LIMIT=20;
export const CAPTION_SCOPES=Object.freeze(['both','ai','user']);
export function captionMatchesScope(caption,user=false){return caption.scope==='both'||caption.scope===(user?'user':'ai');}
export function visibleCaptions(c,user=false){return c.captions.filter(caption=>caption.visible&&caption.content.trim()&&captionMatchesScope(caption,user));}
export const LEGACY_CAPTION_FIELDS=['caption','captionFont','captionColor','captionSize','captionPosition','captionWidth'];
export const captionKey=id=>'caption:'+id;
export const captionToken=id=>'cap-'+id;
export function styleOf(value={}){return Object.fromEntries(['x','y','weight','z','fontLink'].filter(k=>value[k]!==undefined).map(k=>[k,value[k]]));}
export function validateCaptionStyle(value,{stable=false}={}){return validateTextItems({caption:styleOf(value)},{stable}).caption;}
export function newCaption(overrides={}){return {id:crypto.randomUUID(),name:'文案',content:'新的一句文案',font:'serif',size:14,color:'#7e9477',visible:true,scope:'both',position:'below',width:'auto',...validateCaptionStyle({}),...overrides};}
export function validateCaptions(raw,{large=false,header=false}={}){
 if(!Array.isArray(raw)||raw.length>CAPTION_LIMIT)throw Error('文案列表无效或超过20条');const ids=new Set();
 return raw.map(c=>{
  if(!c||typeof c!=='object'||Array.isArray(c)||Object.keys(c).some(k=>!['id','name','content','font','size','color','visible','scope',...(!header?['position']:[]),'width','x','y','weight','z','fontLink'].includes(k)))throw Error('文案字段无效');
  if(typeof c.id!=='string'||!/^[\w-]{1,80}$/.test(c.id)||ids.has(c.id))throw Error('文案标识无效或重复');ids.add(c.id);
  if(typeof c.name!=='string'||c.name.length>80||typeof c.content!=='string'||c.content.length>300)throw Error('文案名称或内容过长');
  if(!TIME_FONTS.includes(c.font)||!Number.isFinite(c.size)||c.size<(large?8:10)||c.size>(large?200:26)||typeof c.color!=='string'||!/^#[0-9a-f]{6}$/i.test(c.color))throw Error('文案样式无效');
  if(!CAPTION_SCOPES.includes(c.scope))throw Error('文案显示对象无效');
  if(typeof c.visible!=='boolean'||(!header&&!['above','below'].includes(c.position)))throw Error('文案显示或位置无效');
  if(c.width!=='auto'&&(!Number.isFinite(c.width)||c.width<10||c.width>100))throw Error('文案宽度无效');
  return {id:c.id,name:c.name,content:c.content,font:c.font,size:c.size,color:c.color,visible:c.visible,scope:c.scope,...(!header?{position:c.position}:{}),width:c.width,...validateCaptionStyle(c,{stable:header})};
 });
}
export function stripLegacyCaptions(config){for(const key of LEGACY_CAPTION_FIELDS)delete config[key];if(config.textItems)delete config.textItems.caption;return config;}
export function normalizeCaptionConfig(raw){
 if(!raw||![1,2,3,4,5,6,7,8,9,10].includes(raw.version))throw Error('方案版本不支持');
 let captions;
 if(raw.version>=4){if(LEGACY_CAPTION_FIELDS.some(k=>Object.hasOwn(raw,k))||Object.hasOwn(raw.textItems||{},'caption'))throw Error('新版方案不能包含旧文案镜像');captions=validateCaptions(raw.captions,{large:raw.version>=8,header:raw.version>=8});}
 else{
  if(Object.hasOwn(raw,'captions'))throw Error('旧版本不能包含新文案列表');
  const position=raw.captionPosition===undefined?'above':raw.captionPosition;if(!['above','below','hidden'].includes(position))throw Error('文案位置无效');
  captions=validateCaptions([newCaption({id:'caption-legacy',name:'文案1',content:(raw.caption===undefined?'今日也有一封来信':raw.caption),font:(raw.captionFont===undefined?'serif':raw.captionFont),size:(raw.captionSize===undefined?14:raw.captionSize),color:(raw.captionColor===undefined?'#7e9477':raw.captionColor),visible:position!=='hidden',position:position==='below'?'below':'above',width:(raw.captionWidth===undefined?'auto':raw.captionWidth),...validateCaptionStyle(raw.textItems?.caption)})]);
 }
 const styles=validateTextItems(raw.textItems,{stable:raw.version>=8});return stripLegacyCaptions({...raw,version:Math.max(4,raw.version),captions,textItems:{name:styles.name,time:styles.time}});
}
export function textEntries(c){return {name:c.textItems.name,time:c.textItems.time,...Object.fromEntries(c.captions.map(cap=>[captionKey(cap.id),cap]))};}
export function textTokens(c){return {name:'name',time:'time',...Object.fromEntries(c.captions.map(cap=>[captionKey(cap.id),captionToken(cap.id)]))};}
export function textFallbacks(c){return {name:c.nameFont,time:!c.timeFont||c.timeFont==='auto'?c.font:c.timeFont,...Object.fromEntries(c.captions.map(cap=>[captionKey(cap.id),cap.font]))};}
