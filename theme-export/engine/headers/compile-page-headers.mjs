import {canvasBackgroundRules} from '../../../canvas-background.mjs';
import {assessGlass,standaloneGlassCss} from '../materials/glass.mjs';
import {headerArtNeedsNaturalRatio} from '../card/regions/header-art-geometry.mjs';
import {assessAvatarStatic,avatarStaticCss} from '../avatar/static.mjs';
import {borderWidths,borderColor} from '../../../body-card.mjs';
import {createSchemeModel} from '../../../scheme-model.mjs';
import {resolveExportResources,replaceExportResourceUrls} from '../core/resources.mjs';
import {assessControls} from '../controls/assess-controls.mjs';
import {fieldCoverage,runtimeContract} from './field-coverage.mjs';
import {assessPages,pagesCss} from '../pages/pages.mjs';
import {assessHeaders,pageHeadersCss} from './headers.mjs';
import {renderFiniteControls} from '../controls/render-controls.mjs';
import {resourceContext} from '../core/regions/shared.mjs';
import {headerCompositionCss,headerCompositionDiagnostics} from '../card/regions/header-composition.mjs';
import {bodyCss} from '../core/regions/body.mjs';
import {reasoningCss} from '../core/regions/reasoning.mjs';
import {activeInputArtwork,chromeCss,inputArtworkCapacity} from '../core/regions/chrome.mjs';
import {staticCompositionDiagnostics,staticCompositionCss,MIN_CARD_WIDTH} from '../core/regions/static-composition.mjs';
import {commonCss} from '../pages/common.mjs';
import {createFormatTypography,formatThemeCss} from '../core/format.mjs';
const error=(field,reason,code='UNSUPPORTED')=>({severity:'error',code,field,reason});
/** Full bounded native-region compiler. No application, saving, network fetch, or DOM dependency. */
export async function compilePageHeaders(source,options={}){
 const diagnostics=[],dependencies=[],model=createSchemeModel();let c,controlPlan,coverage={entries:[]};
 const fail=()=>({ok:false,theme:null,css:null,diagnostics,dependencies,coverage,fieldCoverage:c?fieldCoverage(c,controlPlan||{fieldCoverage:[]},diagnostics):[],runtimeContract:controlPlan?runtimeContract(controlPlan.mode,controlPlan.layout):null,resourceManifest:resolved||null});let resolved;
 const target=options.target||{};
 if(typeof target.name!=='string'||!target.name.trim()||target.name.length>120)diagnostics.push(error('target.name','An explicit theme name is required','TARGET'));
 if(Object.keys(target).some(k=>k!=='name'))diagnostics.push(error('target','Arbitrary native parameter overrides are not accepted','TARGET'));
 try{c=model.validate(source);}catch{diagnostics.push(error('config','Source fails current schema validation','CONFIG'));return fail();}
 for(const key of Object.keys(source))if(!Object.hasOwn(c,key))diagnostics.push(error(key,'Unknown source field','CONFIG'));
 if(![10,11,12].includes(c.version)||c.version===11&&!c.headerCanvas)diagnostics.push(error('version','Only explicit legacy v10 or design-canvas v11/v12 coordinates are supported'));
 const canvas=!!c.headerCanvas,defaults=model.templates.blank;
 if(canvas&&(c.textInset!==0||c.textTop!==0))diagnostics.push(error('header.textInset/textTop','Finite design canvas requires zero legacy inset/top fields; legacy v10 maps them explicitly'));
 diagnostics.push(...assessGlass(c));
 diagnostics.push(...assessAvatarStatic(c));
 const headerLayers=c.layers.filter(x=>x.visible&&['header','avatar'].includes(x.anchor)),inputLayers=activeInputArtwork(c);
 if(inputLayers.length>inputArtworkCapacity)diagnostics.push(error('layers.input',`Input artwork needs ${inputLayers.length} independent paint slots but the native input form has ${inputArtworkCapacity}`,'CAPACITY'));
 for(const l of inputLayers)if(!['asset','custom'].includes(l.kind)||l.heightPercent||l.imageSizing)diagnostics.push(error('layers.'+c.layers.indexOf(l),'Input artwork uses natural ratio; custom height/shape resizing is not implemented'));
 for(const [index,l]of c.layers.entries())if(l.visible&&!['header','avatar','input','message','footer'].includes(l.anchor))diagnostics.push(error('layers.'+index,'Independent reasoning artwork is not implemented in this batch'));
 diagnostics.push(...headerCompositionDiagnostics(c),...staticCompositionDiagnostics(c));
 controlPlan=assessControls(c);diagnostics.push(...controlPlan.diagnostics);
 diagnostics.push(...assessHeaders(c));
 diagnostics.push(...assessPages(c,defaults));
 if(c.chromeStyle.topbar.enabled&&c.chromeStyle.topbar.layout==='island')diagnostics.push(error('chromeStyle.topbar.layout','Floating launcher interaction requires runtime support'));
 const empty=c.chromeStyle.input.emptyText;if(c.chromeStyle.input.enabled&&empty.enabled&&empty.generating&&empty.generating!==empty.idle)diagnostics.push(error('chromeStyle.input.emptyText.generating','Different generation text has no reliable pure CSS computed-display selector'));
 function unsupportedFont(v,path=''){
  if(!v||typeof v!=='object')return;
  for(const [key,item]of Object.entries(v)){
   const field=path?path+'.'+key:key;
   if((key==='font'||key.endsWith('Font'))&&typeof item==='string'&&item.includes('LabSongti'))
    diagnostics.push(error(field,'This implicit bundled family has no approved export resource binding'));
   else if(item&&typeof item==='object'){
    if((path==='captions'||path==='footerCaptions')&&(!item.visible||!item.content.trim()))continue;
    unsupportedFont(item,field);
   }
  }
 }
 unsupportedFont(c);
 resolved=await resolveExportResources(c,{registry:options.registry,bundledUrls:options.bundledUrls});diagnostics.push(...resolved.diagnostics);if(options.replacements){const replacement=replaceExportResourceUrls(resolved,options.replacements);diagnostics.push(...replacement.diagnostics);if(replacement.ok)resolved=replacement.result;}
 for(const l of [...headerLayers,...inputLayers,...c.layers.filter(l=>l.visible&&['message','footer'].includes(l.anchor))]){const ix=c.layers.indexOf(l),resource=resolved.resources.find(x=>x.active&&x.fieldRefs.some(f=>f.startsWith('layers.'+ix+'.'))),needs=!['header','avatar'].includes(l.anchor)||headerArtNeedsNaturalRatio(l);if(needs&&(!resource?.width||!resource?.height||resource.status==='replaced'))diagnostics.push(error('layers.'+ix,'This use derives natural artwork height; provide trusted dimensions or an explicit supported image frame. Other explicit-frame uses may retain external URLs without fetching','RESOURCE_GEOMETRY'));}
 coverage={entries:fieldCoverage(c,controlPlan,diagnostics),rendererAvailable:true,canGenerateTheme:false,controlsMode:controlPlan.mode};
 if(diagnostics.some(x=>x.severity==='error'))return fail();
 try{
  const ctx={...resourceContext(resolved),headerZScale:2};
  ctx.formatTypography=createFormatTypography(c,ctx);
  const header=headerCompositionCss(c,ctx),chrome=chromeCss(c,ctx),join=items=>items.filter(Boolean).join('\n');
  const sections={resources:ctx.declarations,common:commonCss(c,ctx),pages:pagesCss(c,ctx),pageHeaders:pageHeadersCss(c,ctx),header:join([header.types,header.foundation,header.chat]),body:bodyCss(c,ctx),reasoning:reasoningCss(c,ctx),chrome:join(Object.values(chrome)),composition:staticCompositionCss(c,ctx)};
  if(c.canvasBackground==='legacy-solid')sections.canvasColor=canvasBackgroundRules(c,'');
  const staticAvatar=avatarStaticCss(c,ctx,{controlsMode:controlPlan.mode});if(staticAvatar)sections.avatarStatic=staticAvatar;
  if(controlPlan.mode==='finite-footer')Object.assign(sections,renderFiniteControls(c,{layout:controlPlan.layout,ctx}));
  const glass={message:[],chrome:[],pages:[]},material=standaloneGlassCss(c);
  for(const {region,css} of material)glass[region==='message'?'message':region==='topbar'||region==='input'?'chrome':'pages'].push(css);
  if(material.length)sections.material=material.map(part=>part.css).join('\n');
  const css=formatThemeCss(sections,{values:ctx.formatTypography.values,header,chrome,
   glass:Object.fromEntries(Object.entries(glass).map(([group,rules])=>[group,join(rules)]))});
  const theme={name:target.name.trim(),font_scale:1,chat_display:0,waifuMode:false,hideChatAvatars_enabled:false,timestamps_enabled:true,timestamp_model_icon:false,custom_css:css};
  dependencies.push({field:'font_scale',value:1,reason:'Typography emitted from one authored size source, shared by body/interface/reasoning/input; avoids inherited recipient multiplier'},...['chat_display','waifuMode','hideChatAvatars_enabled','timestamps_enabled','timestamp_model_icon'].map(field=>({field,value:theme[field],reason:'Finite unified native portrait/name/time contract'})));
  dependencies.push({feature:'card-border',widths:borderWidths(c),style:c.cardBorderStyle,color:borderColor(c,'live'),reason:'Single border owner; border-box outer width, client/query-content inner width, origin naturally starts at border inner edge; no duplicated coordinate offsets'});
  dependencies.push({feature:'native-header-structure',reason:'Requires original native avatar/img and name/time plus ch_name > div.flex1 > div.alignItemsBaseline in ST1.18/1.19; does not synthesize missing portrait sources or move native nodes'});
  if(headerLayers.some(layer=>layer.anchor==='avatar'))dependencies.push({feature:'avatar-artwork',reason:'Independent header leaves follow the portrait pose and clip against the fixed header; native hidden states suppress the attached decorations'});
  dependencies.push({feature:'static-composition-width',minimumClientWidth:MIN_CARD_WIDTH,minimumBorderBoxWidth:MIN_CARD_WIDTH+borderWidths(c)[1]+borderWidths(c)[3],reason:'Conservative proved domain: actual message clientWidth >=200px (border-box minimum includes left+right borders); footer uses original P and px/percent coordinates, not header-canvas scaling'});
  dependencies.push({feature:'chrome blur',reason:'Scoped native CSS includes body.no-blur overrides for authored topbar/input material; fast_ui_mode preference is preserved, subject to browser proof'});
  if(inputLayers.length===2)dependencies.push({feature:'input-artwork',reason:'Two natural-ratio images paint in authored input order behind the native form controls; the textarea placeholder remains on its own element'});
  if(c.chromeStyle.input.enabled&&empty.enabled&&empty.idle)dependencies.push({feature:'emptyText',reason:'Known ordinary en/zh placeholder strings only; no-connection/command/disabled/readonly preserve native text; other locales retain native placeholder'});
  dependencies.push({feature:'coordinates',value:canvas?'design-canvas':'legacy-mixed-px-percent',reason:'No coordinate migration or source save is performed'},{feature:'reasoning duration',reason:'Native data-duration remains dynamic; unknown/null/empty do not append seconds'});
  const entries=fieldCoverage(c,controlPlan,diagnostics),contract=runtimeContract(controlPlan.mode,controlPlan.layout);
  dependencies.push({feature:'page-headers',requiredNativeRoots:'Nine original ST1.18/1.19 drawer roots and character rm_PinAndTabs sentinel',requiredPadding:'5px except Backgrounds0; rm_PinAndTabs right5',reason:'Finite40..600 fixed-height normal-flow paint slots, requiring remaining native-inner viewport height; original inner scroll surfaces preserved instead of runtime scroll accessor/event forwarding; source scroll behavior differs deliberately; Spring max600 calc-size/allow-discrete height transitions are also not copied, native height/transition remains'});
  dependencies.push({feature:'native-controls',mode:controlPlan.mode,minimumClientWidth:contract.minimumClientWidth,reason:'Original configuration is assessed once; safe layout policy and runtime fidelity are explicit, no derived neutralized baseline'});
  return {ok:true,theme,css,sections,diagnostics,dependencies,fieldCoverage:entries,runtimeContract:contract,coverage:{entries,rendererAvailable:true,canGenerateTheme:true,controlsMode:controlPlan.mode,minimumClientWidth:contract.minimumClientWidth,minimumBorderBoxWidth:contract.minimumClientWidth+borderWidths(c)[1]+borderWidths(c)[3],supportedContract:'18-reading-controls+17-avatar-frame+16-static-avatar+15-parameterized-page-headers+12-worldbook-presets+11-finite-controls+08-graphics',notice:'Bounded configuration support; runtime message fidelity limitations are not falsely diagnosed as configuration errors'},resourceManifest:resolved};
 }catch{diagnostics.push(error('compile','Native region generation could not bind its declared resources','GENERATION'));return fail();}
}
