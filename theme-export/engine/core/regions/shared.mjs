import {cssString,fontFaceCss} from '../resources.mjs';
export const Q='#chat > .mes:not(.smallSysMes):not([is_system="true"])';
export const H=Q+' > .mes_block > .ch_name',B=Q+' > .mes_block';
export const rule=(selector,props)=>`${selector}{${Object.entries(props).map(([key,value])=>`${key}:${value}!important`).join(';')}}`;
export const esc=cssString;
export function resourceContext(resolved){
 const map=new Map(resolved.resources.filter(x=>x.active&&x.status!=='error').flatMap(x=>x.fieldRefs.map(field=>[field,x])));
 const css=rule(':root',Object.fromEntries(resolved.resources.filter(x=>x.active&&x.status!=='error'&&x.category==='image').map(x=>['--yj-r-'+x.id.slice(6,22),`url(${esc(x.exportUrl)})`])));
 return {declarations:css+'\n'+fontFaceCss(resolved),source(field){const x=map.get(field);if(!x||!resolved.snapshot.sources[field])throw Error('Missing resolved resource binding at '+field);return `var(--yj-r-${x.id.slice(6,22)})`;},image(field){return map.get(field);},family(field,fallback){const x=map.get(field);return x?.category==='font'?`${esc(x.fontFamily)},${fallback}`:fallback;},fontFamily(field){return map.get(field)?.fontFamily||'';},firstField(prefix){return [...map.keys()].find(k=>k.startsWith(prefix));}};
}
export function fontFor(c,part,key,ctx){const v=c.reasoningStyle[part];return v.fontSource==='body'?ctx.family('bodyFontLink.url',c.font):v.fontSource==='interface'?'var(--mainFontFamily,sans-serif)':ctx.family(`reasoningStyle.${part}.fontLink.url`,v.font);}
