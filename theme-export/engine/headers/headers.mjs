import {assessOptionalHeader,optionalPageHeaderCss} from './optional-scene.mjs';
import {PAGE_HEADER_MOUNTS} from '../../../page-headers.mjs';
import {PAGE_TITLE_SUBTITLE_SELECTORS} from '../../../page-title-subtitle.mjs';
import {rule,esc} from '../core/regions/shared.mjs';
const err=(field,reason)=>({severity:'error',code:'PAGE_HEADER_UNSUPPORTED',field,reason});
function legacyHeaderDiagnostics(c){
 const ds=[];
 for(const [page,v]of Object.entries(c.pageHeaders)){
  if(!v.enabled)continue;
  const path='pageHeaders.'+page,add=(field,why)=>ds.push(err(path+'.'+field,why));
  if(page==='home'){ds.push(err(path,'Native home header is outside the nine-drawer contract'));continue;}
  for(const [key,value]of Object.entries({sizing:'fixed',topGap:0,sideGap:0,layout:'standard',placement:'banner',asset:'',image:'',title:'',titleStyle:null,titleSubtitle:null,titleDecoration:null}))if(v[key]!==value)add(key,'Only fixed-height standard scene banners without separate title/base-image objects are implemented');
  const {images,texts,order}=v.scene;
  if(images.length!==2||texts.length!==2){add('scene','Requires exactly asset + line and two text leaves');continue;}
  if(order.join('|')!==[`image:${images[0].id}`,`image:${images[1].id}`,`text:${texts[0].id}`,`text:${texts[1].id}`].join('|'))add('scene.order','Requires art, line, title, subtitle paint order');
  const [art,line]=images;
  if(!['asset','custom'].includes(art.kind)||!art.visible||art.opacity!==1||art.rotation!==0||art.side!=='right'||art.vertical!=='top'||art.widthUnit!=='px'||art.offsetUnit!=='px'||art.heightPercent||art.imageSizing)add('scene.images.0','Finite natural-ratio right/top px artwork required');
  if(line.kind!=='shape'||!line.visible||line.opacity!==1||line.rotation!==0||line.shape!=='rectangle'||line.cornerRadius!==0||line.fillMode!=='solid'||line.widthUnit!=='percent'||line.offsetUnit!=='px'||line.side!=='left'||line.vertical!=='top'||line.heightUnit!=='px'||line.heightPercent)add('scene.images.1','Finite solid rectangular line requires percent width, px thickness and left/top px position');
  for(const [i,t]of texts.entries())if(!t.visible||!t.content.trim()||t.width==='auto'||t.x<0||t.width<=0||t.x+t.width>100||t.y<0||(t.scaleX??1)!==1||!['left','center','right'].includes(t.align))add('scene.texts.'+i,'Requires visible finite in-header percent width, nonnegative y, standard alignment and scaleX1');
 }
 return ds;
}
export function assessHeaders(c){return Object.entries(c.pageHeaders).flatMap(([page,v])=>!v.enabled||!legacyHeaderDiagnostics({pageHeaders:{[page]:v}}).length?[]:assessOptionalHeader(page,v));}
function textStyle(t,page,index,ctx){return {'font-family':ctx.family(`pageHeaders.${page}.scene.texts.${index}.fontLink.url`,t.font),'font-size':t.size+'px','font-weight':t.weight==='auto'?'inherit':String(t.weight),color:t.color,'line-height':String(t.lineHeight??1.35),'text-align':t.align,'white-space':'pre-wrap','overflow-wrap':'anywhere','letter-spacing':'normal'};}
function nativeTitles(page,root){
 const rules=[];
 if(page==='settings'){
  const group=root+' > .flex-container:first-child';
  rules.push(rule(group,{display:'grid','grid-template-columns':'minmax(0,1fr) auto minmax(0,1.15fr)',gap:'10px 8px','align-items':'center','margin-bottom':'12px'}));
  rules.push(rule(group+' > :is([name="userSettingsRowOne"],[name="UserSettingsRowTwo"])',{display:'contents'}));
  rules.push(rule(group+' [name="userSettingsRowOne"] > .flex-container:has([data-i18n="User Settings"])',{display:'none'}));
  rules.push(rule(group+' #version_display',{'grid-column':'1 / -1','grid-row':1,'min-width':0,'font-size':'.72em','line-height':1.45,'overflow-wrap':'anywhere'}));
  rules.push(rule(group+' #UI-language-block',{'grid-column':1,'grid-row':2,'min-width':0,gap:'8px','flex-wrap':'nowrap','align-items':'center'}),rule(group+' #UI-language-block > span',{flex:'0 0 auto'}),rule(group+' #ui_language_select',{'min-width':0,width:'100%'}));
  rules.push(rule(group+' #account_controls',{'grid-column':2,'grid-row':2,'min-width':0,'max-width':'6.5em',gap:'6px'}),rule(group+' #settingsSearch',{'grid-column':3,'grid-row':2,'min-width':0,width:'100%','max-width':'100%','box-sizing':'border-box',margin:0}));
 }else{
  for(const selector of Object.values(PAGE_TITLE_SUBTITLE_SELECTORS[page]||{}))rules.push(rule(root+' '+selector,{display:'none'}));
  const rowMap={presets:root+' .standoutHeader:has(> strong > span[data-i18n])',connection:root+' .flex-container:has(> h3 > span[data-i18n="Connection Profile"])',worldbook:root+' .flex-container:has(> h3 > span[data-i18n="Worlds/Lorebooks"])',backgrounds:root+' #bg-header-fixed .bg-header-row-1',extensions:root+' .flex-container:has(> h3[data-i18n="Extensions"])',personas:root+' .flex-container:has(> .flex1 > h3 > span[data-i18n="Persona Management"])',formatting:root+' .flex-container:has(> h3 > span[data-i18n="Advanced Formatting"])'};
  const row=rowMap[page];if(row){
   rules.push(rule(row,{position:'relative','box-sizing':'border-box',display:'flex','flex-wrap':'wrap','align-items':'center','justify-content':'flex-end','min-height':'36px',padding:'9px 10px',margin:'0 0 8px',gap:'5px',border:0,'border-bottom':'1px solid var(--SmartThemeBorderColor,rgba(0,0,0,.15))','border-radius':0}));
   rules.push(rule(row+' > :is(h3,strong,.flex1)',{flex:'0 1 auto',width:'auto','min-width':0,margin:0,padding:0}));
   rules.push(rule(row+' > :is(.flex-container:not(.flex1),[data-cc-null])',{'margin-left':'auto','max-width':'100%','flex-wrap':'wrap','justify-content':'flex-end'}),rule(row+' .menu_button',{width:'max-content','flex-shrink':0,'white-space':'nowrap'}));
   if(page==='worldbook')rules.push(rule(row+' > h3',{flex:'1 1 auto',width:'auto'}));
   if(page==='backgrounds')rules.push(rule(row,{display:'grid','grid-template-columns':'minmax(0,1fr) repeat(3,auto)','min-height':0,gap:'8px 6px'}),rule(row+' > h3',{'grid-column':'1 / -1'}),rule(row+' > .expander',{display:'none'}),rule(row+' > #background_fitting',{'min-width':0,width:'100%',margin:0}),rule(row+' > :is(#auto_background,#bg_add_folder_button,#add_background_button_top)',{'min-width':'32px','min-height':'32px',margin:0,'justify-self':'end'}));
  }
 }
 return rules.join('\n');
}
export function pageHeadersCss(c,ctx){
 const rules=[];
 for(const [page,v]of Object.entries(c.pageHeaders)){
  if(!v.enabled)continue;
  if(legacyHeaderDiagnostics({pageHeaders:{[page]:v}}).length){rules.push(optionalPageHeaderCss(page,v,ctx,nativeTitles));continue;}
  const root=PAGE_HEADER_MOUNTS[page],characters=page==='characters',zero=page==='backgrounds',p=zero?0:5,host=characters?root+' > #rm_PinAndTabs':root,extra=characters?15:p*2,full=`(100cqw + ${extra}px)`,main=host+(characters?'::after':'::before'),sub=host+(characters?'::before':'::after'),[art,line]=v.scene.images,[title,subtitle]=v.scene.texts;
  const prefix=`pageHeaders.${page}.scene.images.0.`,src=ctx.source(prefix+(art.kind==='asset'?'asset':'image'));
  // Resolve the declared native padding dependency explicitly: a common theme
  // can otherwise win over Backgrounds' zero-padding source layout.
  rules.push(rule(root,{padding:p+'px'}),rule(host,{'container-type':'inline-size'}));
  // Native positioning is already relative/absolute/fixed; only the sentinel needs a local CB.
  if(characters)rules.push(rule(host,{position:'relative'}));
  rules.push(rule(main,{content:esc(title.y>=v.height?'':title.content),display:'block',position:'relative','box-sizing':'border-box',width:`calc(100% + ${extra}px)`,height:v.height+'px','min-height':v.height+'px','max-height':v.height+'px',flex:'0 0 auto','grid-column':'1 / -1',margin:characters?' -10px -10px 0 -5px':`${-p}px ${-p}px 0`,padding:`${Math.min(title.y,v.height)}px calc(${(100-title.x-title.width)/100} * ${full}) 0 calc(${title.x/100} * ${full})`,border:0,'border-radius':0,overflow:'hidden','pointer-events':'none',...textStyle(title,page,0,ctx),'background-image':`linear-gradient(${line.color},${line.color}),${src}`,'background-repeat':'no-repeat','background-size':`${line.width}% ${line.height}px,${art.width}px auto`,'background-position':`left ${line.x===0?'0':line.x+'px'} top ${line.y}px,right ${art.x}px top ${art.y}px`,'background-origin':'border-box','background-clip':'border-box','z-index':0}));
  rules.push(rule(sub,{content:esc(subtitle.y>=v.height?'':subtitle.content),display:'block',position:'absolute','box-sizing':'border-box',left:`calc(${subtitle.x/100} * ${full}${characters?' - 5px':''})`,width:`calc(${subtitle.width/100} * ${full})`,top:characters?'auto':Math.min(subtitle.y,v.height)+'px',bottom:characters?0:'auto',height:Math.max(0,v.height-subtitle.y)+'px',margin:0,padding:0,border:0,overflow:'hidden','pointer-events':'none',...textStyle(subtitle,page,1,ctx),'z-index':1}));
  rules.push(nativeTitles(page,root));
 }
 return rules.join('\n');
}
