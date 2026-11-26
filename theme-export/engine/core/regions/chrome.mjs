import {DRAWERS,INPUT_ICONS} from '../../../../chrome.mjs';
import {iconStyle} from '../../../../icon-style.mjs';
import {regionEntries} from '../../../../region-layers.mjs';
import {rule,esc} from './shared.mjs';
const rgba=(color,alpha)=>color+Math.round(alpha*255).toString(16).padStart(2,'0');
const surface=v=>({background:rgba(v.color,v.alpha),'backdrop-filter':`blur(${v.blur}px)`,'-webkit-backdrop-filter':`blur(${v.blur}px)`,border:`${v.borderEnabled?v.borderWidth:0}px solid ${v.borderColor}`,'border-radius':v.radius+'px','box-shadow':'none'});
const inputArtworkSlots=['#send_form::before','#send_form::after'];
export const inputArtworkCapacity=inputArtworkSlots.length;
export function activeInputArtwork(c){
 if(!c.chromeStyle.input.enabled)return [];
 return regionEntries(c,'input').filter(entry=>entry.visible).map(entry=>entry.item);
}

function inputArtworkCss(c,ctx){
 const layers=activeInputArtwork(c);
 if(!layers.length)return [];
 // The two pseudo-elements paint back to front at z=0, beneath all native controls.
 const artwork=layers.map((layer,index)=>{
  const field=ctx.firstField('layers.'+c.layers.indexOf(layer)+'.');
  const info=ctx.image(field),offsetUnit=layer.offsetUnit==='percent'?'%':'px';
  const dimensions=layer.widthUnit==='percent'
   ? {width:layer.width+'%','aspect-ratio':`${info.width} / ${info.height}`}
   : {width:layer.width+'px',height:layer.width*info.height/info.width+'px'};
  return rule(inputArtworkSlots[index],{
   content:'""',position:'absolute',[layer.side]:layer.x+offsetUnit,[layer.vertical]:layer.y+offsetUnit,
   ...dimensions,background:`${ctx.source(field)} center / contain no-repeat`,
   opacity:layer.opacity,transform:`rotate(${layer.rotation}deg)`,'z-index':0,'pointer-events':'none',
  });
 });
 return [...artwork,rule('#send_form > *',{position:'relative','z-index':1})];
}

export function chromeCss(c,ctx){
 const t=c.chromeStyle.topbar,i=c.chromeStyle.input,topbar=[],input=[],prompt=[];
 function icon(out,selector,v,size,field){
  if(v.mode==='native'){out.push(rule(selector,{color:v.color||c.commonStyle.text.color,'text-shadow':'none'}));return;}
  const selected=ctx.firstField(field+'.');const image=ctx.source(selected),style=iconStyle(v),iconLength=field.startsWith('chromeStyle.topbar')?`min(${v.size||size}px,max(8px,calc(100cqw - 6px)))`:`min(${v.size||size}px,100%)`;
  out.push(rule(selector+':not(:is(:disabled,[disabled],[aria-disabled="true"],.disabled)):not(:is(:disabled,[disabled],[aria-disabled="true"],.disabled) *)',{opacity:1}),rule(selector,{position:'relative','text-shadow':'none',filter:'none'}),rule(selector+' > i',{visibility:'hidden'}),rule(selector+'::before',{content:'""',position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:iconLength,height:iconLength,'pointer-events':'none',...(style.tint?{background:style.fillMode==='gradient'?`linear-gradient(${style.gradientAngle}deg,${style.color},${style.color2})`:style.color,'mask-image':image,'-webkit-mask-image':image,'mask-size':'contain','-webkit-mask-size':'contain','mask-repeat':'no-repeat','-webkit-mask-repeat':'no-repeat','mask-position':'center','-webkit-mask-position':'center'}:{background:`${image} center / contain no-repeat`})}));
 }
 if(t.enabled){const height=t.slot+2*t.padY+(t.borderEnabled?t.borderWidth*2:0);
  topbar.push(rule('body',{'--topBarBlockSize':height+'px','--topBarIconSize':t.iconSize+'px'}),rule('#top-bar,body.no-blur #top-bar',{...surface(t),'box-sizing':'border-box',height:height+'px'}),
  rule('#top-settings-holder',{height:height+'px','box-sizing':'border-box',display:'grid','grid-template-columns':'repeat(9,minmax(0,1fr))','grid-auto-rows':t.slot+'px',gap:`min(${t.gap}px,1vw)`,padding:`${t.padY}px 4px`,border:`${t.borderEnabled?t.borderWidth:0}px solid transparent`,'align-items':'center',overflow:'visible'}),
  rule('#top-settings-holder > .drawer',{'min-width':0,width:'auto','justify-content':'center'}),rule('#top-settings-holder .drawer-toggle',{position:'relative','box-sizing':'border-box',width:`min(${t.slot}px,100%)`,height:t.slot+'px','container-type':'inline-size',display:'grid','place-items':'center',margin:'auto',cursor:'pointer'}),
  rule('#top-settings-holder .drawer-icon',{'box-sizing':'border-box','font-size':`min(${t.iconSize}px,max(8px,calc(100cqw - 6px)))`,'max-width':'100%',padding:0,width:'100%',height:'100%',display:'grid','place-items':'center'}),rule('#top-settings-holder .openIcon',{'box-shadow':`0 2px 0 ${t.borderColor}`}));
  for(const [id]of DRAWERS)icon(topbar,`#top-settings-holder #${id} > .drawer-toggle .drawer-icon`,t.icons[id],t.iconSize,'chromeStyle.topbar.icons.'+id);
 }
 if(i.enabled){const text=ctx.formatTypography,stacked=i.layout==='stacked',textPad=Math.max(6,(i.minHeight-i.size*i.lineHeight)/2);
  input.push(rule('#send_form,body.no-blur #send_form',{...surface(i),'box-sizing':'border-box',width:`clamp(120px,${i.width}%,calc(100% - ${i.leftGap+i.rightGap}px))`,'max-width':`calc(100% - ${i.leftGap+i.rightGap}px)`,'margin-left':i.leftGap+'px','margin-right':i.rightGap+'px',padding:`${i.padY}px ${i.padX}px`,position:'relative',isolation:'isolate',overflow:'visible'}),
  rule('#nonQRFormItems',{position:'relative',display:'grid','grid-template-columns':stacked?'minmax(0,1fr) minmax(0,1fr)':'minmax(0,max-content) minmax(0,1fr) minmax(0,max-content)',gap:i.gap+'px',width:'100%','min-width':0,'align-items':stacked?'end':'center'}),
  rule('#send_textarea',{'grid-column':stacked?'1 / -1':'2','grid-row':1,'min-width':0,width:'100%','box-sizing':'border-box',margin:0,border:0,padding:`${textPad}px 6px`,'min-height':i.minHeight+'px','max-height':`min(${i.maxHeight}px,60vh)`,'font-family':text.inputFont,'font-size':`calc(${text.inputSize} * var(--fontScale,1))`,'font-weight':i.weight,color:i.textColor,'line-height':i.lineHeight,'letter-spacing':'normal','overflow-y':'auto',resize:'vertical',background:i.textSurface.enabled?rgba(i.textSurface.color,i.textSurface.alpha):'transparent','border-radius':(i.textSurface.enabled?i.textSurface.radius:0)+'px'}),
  rule('#leftSendForm,#rightSendForm',{'min-width':0,width:'auto',height:'auto',display:'flex','flex-wrap':'wrap','align-items':'center',gap:i.gap+'px',order:'initial',padding:0}),rule('#leftSendForm',{'grid-column':1,'grid-row':stacked?2:1,'justify-content':'flex-start'}),rule('#rightSendForm',{'grid-column':stacked?2:3,'grid-row':stacked?2:1,'justify-content':'flex-end'}),
  rule('#send_form :where(#leftSendForm,#rightSendForm) > div',{'box-sizing':'border-box',width:i.slot+'px',height:i.slot+'px','font-size':i.iconSize+'px','line-height':i.slot+'px','text-align':'center',margin:0,padding:0,position:'relative','flex-shrink':0}));
  for(const [id]of INPUT_ICONS)icon(input,'#send_form #'+id,i.icons[id],i.iconSize,'chromeStyle.input.icons.'+id);
  if(i.emptyText.enabled&&i.emptyText.idle){const ordinary=':is([placeholder="Type a message, or /? for help"],[placeholder="输入想发送的消息，或输入 /? 获取帮助"])',textarea='#send_textarea:placeholder-shown:not(:disabled):not([readonly])'+ordinary,scope='body:has(#API-status-top.fa-plug:not(.fa-plug-circle-exclamation)) #form_sheld:not(.isExecutingCommandsFromChatInput) #send_form:not(.no-connection) #nonQRFormItems';
   prompt.push('@supports selector(:has(textarea:placeholder-shown)){'+rule(scope+':has(> '+textarea+')::after',{content:esc(i.emptyText.idle),position:'absolute','grid-area':stacked?'1 / 1 / 2 / -1':'1 / 2 / 2 / 3',inset:0,display:'grid','place-items':'center','box-sizing':'border-box',padding:'2px 6px','pointer-events':'none','user-select':'none','white-space':'pre-wrap',overflow:'hidden','overflow-wrap':'anywhere',color:i.emptyText.color,'font-family':text.placeholderFont,'font-size':`calc(${text.placeholderSize} * var(--fontScale,1))`,'font-weight':i.weight,'line-height':1.25,'text-align':'center','z-index':2}),rule(scope+' > '+textarea+'::placeholder',{color:'transparent',opacity:0})+'}');
  }
 }
 return {topbar:topbar.join('\n'),input:input.join('\n'),prompt:prompt.join('\n'),artwork:inputArtworkCss(c,ctx).join('\n')};
}
