import {PAGE_HEADER_MOUNTS} from '../../../page-headers.mjs';
import {rule,esc} from '../core/regions/shared.mjs';
const textKey=t=>'text:'+t.id,imageKey=t=>'image:'+t.id;
const visibleTexts=v=>v.scene.texts.filter(t=>t.visible&&t.content.trim()),visibleImages=v=>v.scene.images.filter(t=>t.visible&&t.opacity>0);
export function assessOptionalHeader(page,v){
 const ds=[],bad=(field,reason)=>ds.push({severity:'error',code:'PAGE_HEADER_UNSUPPORTED',field:'pageHeaders.'+page+'.'+field,reason});
 for(const [key,value]of Object.entries({sizing:'fixed',sideGap:0,title:'',titleStyle:null,titleSubtitle:null,titleDecoration:null}))if(v[key]!==value)bad(key,'Optional scenes require fixed sizing, zero side gap and no separate native-title objects');
 if(page==='home'&&v.placement!=='native')bad('placement','Home currently uses the original native welcome title surface');
 if(page!=='home'&&v.topGap>0&&(v.image||v.asset))bad('topGap','A separate fitted base image with top gap needs its own fit box; scene artwork with top gap remains supported');
 const images=visibleImages(v),texts=visibleTexts(v),arts=images.filter(l=>l.kind!=='shape'),lines=images.filter(l=>l.kind==='shape');
 if(arts.length>1||lines.length>1||texts.length>2)bad('scene','Optional page scenes support one scene image, one simple line and up to two independent texts');
 for(const l of arts)if(!['asset','custom'].includes(l.kind)||l.opacity!==1||l.rotation||l.vertical!=='top'||l.widthUnit!=='px'||l.offsetUnit!=='px'||l.heightPercent||l.imageSizing)bad('scene.images.'+v.scene.images.indexOf(l),'Scene artwork requires unit opacity, natural px width, top/px coordinates and no rotation');
 for(const l of lines)if(l.opacity!==1||l.rotation||l.shape!=='rectangle'||l.cornerRadius||l.fillMode!=='solid'||!['px','percent'].includes(l.widthUnit)||l.offsetUnit!=='px'||l.vertical!=='top'||l.heightUnit!=='px'||l.heightPercent)bad('scene.images.'+v.scene.images.indexOf(l),'Scene lines require a unit-opacity solid rectangle, explicit px thickness and top/px offsets');
 for(const t of texts)if(t.x<0||t.width==='auto'||t.width<=0||t.x+t.width>100||t.y<0||(t.scaleX??1)!==1)bad('scene.texts.'+v.scene.texts.indexOf(t),'Page text requires bounded percent width, nonnegative y and scaleX1');
 const order=v.scene.order,firstText=Math.min(...texts.map(t=>order.indexOf(textKey(t))));if(images.some(l=>order.indexOf(imageKey(l))>firstText))bad('scene.order','Images after/interleaved with page text require additional independent paint leaves');
 return ds;
}
function textStyle(t,page,index,ctx){return t?{'font-family':ctx.family(`pageHeaders.${page}.scene.texts.${index}.fontLink.url`,t.font),'font-size':t.size+'px','font-weight':t.weight==='auto'?'inherit':String(t.weight),color:t.color,'line-height':String(t.lineHeight??1.35),'text-align':t.align,'white-space':'pre-wrap','overflow-wrap':'anywhere','letter-spacing':'normal'}:{};}
export function optionalPageHeaderCss(page,v,ctx,nativeTitles){
 const home=page==='home',root=PAGE_HEADER_MOUNTS[page],characters=page==='characters',p=page==='backgrounds'?0:5,host=home?root+' > .welcomeHeaderTitle':characters?root+' > #rm_PinAndTabs':root;
 const extra=home?0:characters?15:p*2,full=`(100cqw + ${extra}px)`,main=host+(characters?'::after':'::before'),sub=host+(characters?'::before':'::after'),out=[];
 const images=visibleImages(v).sort((a,b)=>v.scene.order.indexOf(imageKey(b))-v.scene.order.indexOf(imageKey(a))),texts=visibleTexts(v).sort((a,b)=>v.scene.order.indexOf(textKey(a))-v.scene.order.indexOf(textKey(b))),title=texts[0],subtitle=texts[1];
 if(home)out.push(rule(host,{position:'relative',isolation:'isolate','min-height':(v.height+v.topGap)+'px','container-type':'inline-size'}));
 else{if(!images.length&&!texts.length&&!v.image&&!v.asset)return v.layout==='standard'?nativeTitles(page,root):'';out.push(rule(root,{padding:p+'px'}),rule(host,{'container-type':'inline-size'}));if(characters)out.push(rule(host,{position:'relative'}));}
 const backgrounds=images.map(l=>l.kind==='shape'?`linear-gradient(${l.color},${l.color})`:ctx.source(ctx.firstField(`pageHeaders.${page}.scene.images.${v.scene.images.indexOf(l)}.`))),sizes=images.map(l=>l.kind==='shape'?`${l.width}${l.widthUnit==='percent'?'%':'px'} ${l.height}px`:`${l.width}px auto`),positions=images.map(l=>`${l.side} ${l.x}px top ${l.y+(home?0:v.topGap)}px`);
 if(v.image||v.asset){backgrounds.push(ctx.source('pageHeaders.'+page+'.'+(v.image?'image':'asset')));sizes.push(v.fit);positions.push(`${v.x}% ${v.y}%`);}
 const y=title?Math.min(title.y,v.height):0;
 out.push(rule(main,{content:esc(title&&title.y<v.height?title.content:''),display:'block',position:home?'absolute':'relative','box-sizing':'border-box',...(home?{left:0,top:v.topGap+'px'}:{}),width:home?'100%':`calc(100% + ${extra}px)`,height:(v.height+(home?0:v.topGap))+'px','min-height':(v.height+(home?0:v.topGap))+'px','max-height':(v.height+(home?0:v.topGap))+'px',flex:'0 0 auto','grid-column':'1 / -1',margin:home?0:characters?' -10px -10px 0 -5px':`${-p}px ${-p}px 0`,padding:title?`${y+(home?0:v.topGap)}px calc(${(100-title.x-title.width)/100} * ${full}) 0 calc(${title.x/100} * ${full})`:0,border:0,'border-radius':0,overflow:'hidden','clip-path':`inset(${home?0:v.topGap}px 0 0)`,'pointer-events':'none',...textStyle(title,page,v.scene.texts.indexOf(title),ctx),'background-image':backgrounds.join(',')||'none','background-size':sizes.join(',')||'auto','background-position':positions.join(',')||'0 0','background-repeat':'no-repeat','background-origin':'border-box','background-clip':'border-box','z-index':home?-2:0}));
 if(subtitle)out.push(rule(sub,{content:esc(subtitle.y<v.height?subtitle.content:''),display:'block',position:'absolute','box-sizing':'border-box',left:`calc(${subtitle.x/100} * ${full}${characters?' - 5px':''})`,width:`calc(${subtitle.width/100} * ${full})`,top:characters?'auto':(v.topGap+Math.min(subtitle.y,v.height))+'px',bottom:characters?0:'auto',height:Math.max(0,v.height-subtitle.y)+'px',margin:0,padding:0,border:0,overflow:'hidden','pointer-events':'none',...textStyle(subtitle,page,v.scene.texts.indexOf(subtitle),ctx),'z-index':home?-1:1}));
 if(home)out.push(homeNativeCss(host,v,ctx));else if(v.layout==='standard')out.push(nativeTitles(page,root));
 return out.join('\n');
}
function homeNativeCss(host,v,ctx){const out=[],selectors={version:'.welcomeHeaderVersionDisplay',settings:'.recentChatsSettings',show:'.showRecentChats',hide:'.hideRecentChats'};
 if(v.native.hideLogo)out.push(rule(host+' > .welcomeHeaderLogo',{display:'none'}));
 for(const [key,selector]of Object.entries(selectors)){const p=v.native[key];if(!p)continue;const s=host+' > '+selector;
  out.push(rule(s,{position:'absolute',left:p.x+'%',top:(v.topGap+p.y)+'px',right:'auto',bottom:'auto',width:key==='version'?(p.width==='auto'?'auto':p.width+'%'):p.width+'px','font-size':p.size+'px',color:p.color,'z-index':2}));
  if(key==='version'){out.push(rule(s,{'white-space':'normal','overflow-wrap':'anywhere','font-family':ctx.family('pageHeaders.home.native.version.fontLink.url',p.font),...(p.weight!=='auto'?{'font-weight':String(p.weight)}:{})}));if(p.firstLetter)out.push(rule(s+'::first-letter',{...(p.firstLetter.size!==null?{'font-size':p.firstLetter.size+'px'}:{}),...(p.firstLetter.color!==null?{color:p.firstLetter.color}:{})}));}
 }
 return out.join('\n');
}
