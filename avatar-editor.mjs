import {MASK_FINISH_DEFAULTS} from './avatar-mask-style.mjs';
import {AVATAR_FX} from './avatar-fx.mjs';
import {REFLECTION_DEFAULTS} from './avatar-reflection.mjs';
import {effectSettings,setAvatarEffects,chooseAvatarFx,chooseAvatarFrame} from './avatar-effects.mjs';
import {AVATAR_FRAME_PAIRS,framePair,frameAssetUrl} from './avatar-frame-pairs.mjs';
import {prepareAvatarMask} from './avatar-mask-upload.mjs';
import {createAvatarCompositionList,COMPOSITION_LIST_CSS} from './avatar-composition-list.mjs';
import {canvasEnabled,enableHeaderCanvas,designInnerWidth} from './header-canvas.mjs';
import { clone } from './layers.mjs';
import { sceneWidth } from './text-scene.mjs';
import { photoDimensions } from './photos.mjs';

export function createAvatarEditor({
  make,
  getConfig,
  remember,
  getPhotoScope,
  apply,
  renderFields,
  validate,
  notify,
  setPhotoScope,
  getUi,
  propertyHeading,
  editorControl: baseEditorControl,
  field,
  renderCompositionLayer,
  getSelectedLayerId,
  setSelectedLayerId,
  openCompositionPicker,
  getEditEpoch,
  isActive,
  getNotice,
}) {
  let avatarTab='whole', uploadToken=0, pendingUpload=null, compositionList=null;
  const editorControl=(container,f,target,onUpdate)=>baseEditorControl(container,{...f,nudge:false},target,onUpdate);
  function choice(container,title,value,options,update,redraw=false){
    const row=make('label','field',title),select=make('select');
    for(const [key,text] of options){const option=make('option','',text);option.value=key;select.append(option);}
    select.setAttribute('aria-label',title);
    select.value=value;row.append(select);container.append(row);
    select.addEventListener('change',()=>{remember();update(select.value);apply();if(redraw)renderFields();});
  }
  function renderPhotoFields(container) {
    compositionList?.dispose();compositionList=null;
    ++uploadToken;
    const roles=make('div',getConfig().avatarDesign==='separate'?'paired-fields':'');
    container.append(roles);
    const mode = make('label', 'field', 'AI 与用户'),
      select = make('select');
    select.setAttribute('aria-label', 'AI 与用户');
    for (const [value, label] of [
      ['unified', '一起设置'],
      ['separate', '分开设置'],
    ]) {
      const o = make('option', '', label);
      o.value = value;
      select.append(o);
    }
    select.value = getConfig().avatarDesign;
    mode.append(select);
    roles.append(mode);
    select.addEventListener('change', () => {
      remember();
      getConfig().avatarDesign = select.value;
      if (select.value === 'unified') {
        const other = getPhotoScope() === 'ai' ? 'user' : 'ai';
        getConfig().photos[other] = clone(getConfig().photos[getPhotoScope()]);
        getConfig().avatarFill[other] = clone(
          getConfig().avatarFill[getPhotoScope()],
        );
        if(getConfig().avatarEffects)getConfig().avatarEffects[other]=clone(effectSettings(getConfig(),getPhotoScope()==='user'));
      }
      apply();
      renderFields();
    });
    if (getConfig().avatarDesign === 'separate') {
      const label = make('label', 'field', '正在设计'),
        scope = make('select');
      scope.setAttribute('aria-label', '正在设计');
      for (const [value, text] of [
        ['ai', 'AI'],
        ['user', '用户'],
      ]) {
        const o = make('option', '', text);
        o.value = value;
        scope.append(o);
      }
      scope.value = getPhotoScope();
      label.append(scope);
      roles.append(label);
      scope.addEventListener('change', () => {
        setPhotoScope(scope.value);
        getUi().object = 'photo-' + getPhotoScope();
        renderFields();
      });
    }
    const p = getConfig().photos[getPhotoScope()],
      fill = getConfig().avatarFill[getPhotoScope()];

    const tabs=make('div','kind-tabs');tabs.setAttribute('aria-label','头像组合设置');
    for(const [id,text]of [['whole','尺寸与位置'],['avatar','取景与效果'],['materials','组合素材']]){const b=make('button','',text);b.type='button';b.dataset.avatarTab=id;b.setAttribute('aria-pressed',String(avatarTab===id));b.addEventListener('click',()=>{avatarTab=id;renderFields();});tabs.append(b);}container.append(tabs);
    if(avatarTab==='materials'){renderCompositionFields(container);return;}
    if(avatarTab==='avatar'){renderAvatarEffects(container,p,fill);return;}
    const effects=effectSettings(getConfig(),getPhotoScope()==='user');
    const compositionScale=()=>editorControl(container,{...field('组合缩放','scale','range',{min:25,max:300,unit:'%'}),beforeApply:()=>setAvatarEffects(getConfig(),getPhotoScope(),effects)},effects);
    propertyHeading(container, '显示方式');
    editorControl(
      container,
      field('铺满卡片顶部', 'enabled', 'select', {
        options: [
          ['false', '普通显示'],
          ['true', '铺满卡片顶部'],
        ],
      }),
      fill,
      () => renderFields(),
    );
    if (fill.enabled) compositionScale();
    else {
      propertyHeading(container, '头像窗口');
      const syncPhoto = () => {
        if (getConfig().avatarDesign === 'unified')
          getConfig().photos[getPhotoScope() === 'ai' ? 'user' : 'ai'] =
            clone(p);
      };
      if(!canvasEnabled(getConfig())){
      const unitLabel = make('label', 'field', '头像宽度单位'),
        unitSelect = make('select');
      unitSelect.setAttribute('aria-label', '头像宽度单位');
      for (const [value, text] of [
        ['px', '像素'],
        ['percent', '相对区域百分比'],
      ]) {
        const option = make('option', '', text);
        option.value = value;
        unitSelect.append(option);
      }
      unitSelect.value = p.widthUnit || 'px';
      unitLabel.append(unitSelect);
      container.append(unitLabel);
      unitSelect.addEventListener('change', () => {
        remember();
        p.widthUnit = unitSelect.value;
        p.size = Math.min(
          p.widthUnit === 'percent' ? 100 : canvasEnabled(getConfig())?2000:600,
          Math.max(p.widthUnit === 'percent' || canvasEnabled(getConfig()) ? 1 : 40, p.size),
        );
        syncPhoto();
        apply();
        renderFields();
      });
      }
      editorControl(
        container,
        field('头像窗口宽度', 'size', 'range', {
          min: p.widthUnit === 'percent' || canvasEnabled(getConfig()) ? 1 : 40,
          max: p.widthUnit === 'percent' ? 100 : canvasEnabled(getConfig())?2000:600,
          unit: p.widthUnit === 'percent' ? '%' : 'px',
        }),
        p,
      );
      const heightLabel = make('label', 'field', '头像窗口高度'),
        heightMode = make('select');
      heightMode.setAttribute('aria-label', '头像窗口高度');
      for (const [value, text] of [
        ['auto', '按比例'],
        ['fixed', '固定高度'],
      ]) {
        const option = make('option', '', text);
        option.value = value;
        heightMode.append(option);
      }
      heightMode.value =
        p.height === 'auto' || p.height === undefined ? 'auto' : 'fixed';
      heightLabel.append(heightMode);
      container.append(heightLabel);
      heightMode.addEventListener('change', () => {
        remember();
        const message = document.querySelector(
            `#chat > .mes[data-otl-live][is_user="${getPhotoScope() === 'user'}"]`,
          ),
          width = message
            ? sceneWidth(message, getConfig())
            : Math.max(
                1,
                getConfig().cardWidth - (getConfig().cardPadding ?? 24) * 2,
              );
        p.height =
          heightMode.value === 'auto'
            ? 'auto'
            : Math.max(1, Math.min(canvasEnabled(getConfig())?2000:600, photoDimensions(p, width).height));
        syncPhoto();
        apply();
        renderFields();
      });
      if (p.height === 'auto' || p.height === undefined)
        editorControl(
          container,
          field('头像比例', 'ratio', 'select', {
            options: [
              ['1', '方形 1:1'],
              ['0.8', '竖幅 4:5'],
              ['0.75', '竖幅 3:4'],
              ['1.3333333333333333', '横幅 4:3'],
            ],
          }),
          p,
        );
      else
        editorControl(
          container,
          field('窗口高度', 'height', 'range', {
            min: 1,
            max: canvasEnabled(getConfig())?2000:600,
            unit: 'px',
          }),
          p,
        );
      compositionScale();
      propertyHeading(container, '位置与旋转');
      choice(container,'头像纵向定位',p.verticalAnchor??'manual',[['manual','手动定位'],['bottom','贴齐头像区底部']],value=>{
        if(value==='bottom')p.verticalAnchor='bottom';else delete p.verticalAnchor;
        syncPhoto();
      },true);
      for (const f of [
        field('头像横向移动', 'x', 'range', { min: canvasEnabled(getConfig())?-2000:-80, max: canvasEnabled(getConfig())?2000:80, unit: 'px' }),
        ...(p.verticalAnchor==='bottom'?[]:[field('头像纵向移动', 'y', 'range', { min: canvasEnabled(getConfig())?-2000:-80, max: canvasEnabled(getConfig())?2000:80, unit: 'px' })]),
        field('头像旋转', 'rotation', 'range', {
          min: -20,
          max: 20,
          step: 0.1,
          unit: '°',
        }),
      ])
        editorControl(container, f, p);
      propertyHeading(container, '边框与阴影');
      editorControl(
        container,
        field('头像圆角', 'radius', 'range', { min: 0, max: 150, unit: 'px' }),
        p,
      );
      editorControl(
        container,
        field('头像边框', 'enabled', 'select', {
          options: [
            ['false', '关闭'],
            ['true', '开启'],
          ],
        }),
        p,
        () => renderFields(),
      );
      if (p.enabled)
        for (const f of [
          field('边框宽度', 'frameWidth', 'range', {
            min: 0,
            max: 15,
            step: 0.25,
            unit: 'px',
          }),
          field('边框颜色', 'frameColor', 'color'),
        ])
          editorControl(container, f, p);
      editorControl(
        container,
        field('头像阴影', 'shadow', 'select', {
          options: [
            ['true', '显示'],
            ['false', '隐藏'],
          ],
        }),
        p,
      );
    }
  }

  function renderAvatarEffects(container,p,fill){
    const scope=getPhotoScope(),c=getConfig(),effects=effectSettings(c,scope==='user');
    const control=(label,key,min,max,unit='%')=>editorControl(container,{...field(label,key,'range',{min,max,unit}),beforeApply:()=>setAvatarEffects(getConfig(),scope,effects)},effects);
    propertyHeading(container,'人物取景');control('取景缩放','zoom',100,300);
    for(const f of [field('头像取景水平位置','x','range',{min:0,max:100,unit:'%'}),field('头像取景垂直位置','y','range',{min:0,max:100,unit:'%'})])editorControl(container,f,fill);
    propertyHeading(container,'头像滤镜');control('亮度','brightness',0,200);control('饱和度','saturation',0,200);
    propertyHeading(container,'头像框');
    const frameLabel=make('label','field','选择头像框'),frameSelect=make('select');frameSelect.setAttribute('aria-label','选择头像框');
    for(const [id,name]of [['','无'],...Object.values(AVATAR_FRAME_PAIRS).map(f=>[f.id,f.name])]){const o=make('option','',name);o.value=id;frameSelect.append(o);}frameSelect.value=effects.frame?.id||'';frameLabel.append(frameSelect);container.append(frameLabel);
    frameSelect.addEventListener('change',()=>{remember();chooseAvatarFrame(c,scope,frameSelect.value);apply();renderFields();});
    if(effects.frame){editorControl(container,{...field('头像框颜色','color','color'),beforeApply:()=>setAvatarEffects(c,scope,effects)},effects.frame);const thumb=make('img','page-art-preview');thumb.src=frameAssetUrl(effects.frame.id);thumb.alt=framePair(effects.frame.id).name;thumb.style.maxHeight='100px';thumb.style.objectFit='contain';container.append(thumb);}
    propertyHeading(container,'头像特效');
    const fxLabel=make('label','field','特效'),fxSelect=make('select');fxSelect.setAttribute('aria-label','头像特效');
    for(const [id,name]of [['','无'],...Object.entries(AVATAR_FX)]){const o=make('option','',name);o.value=id;fxSelect.append(o);}fxSelect.value=effects.fx?.kind||'';fxLabel.append(fxSelect);container.append(fxLabel);
    fxSelect.addEventListener('change',()=>{remember();chooseAvatarFx(c,scope,fxSelect.value);apply();renderFields();});
    if(effects.fx){editorControl(container,{...field('特效播放','motion','select',{options:[['true','动态'],['false','静止']]}),beforeApply:()=>setAvatarEffects(c,scope,effects)},effects.fx);editorControl(container,{...field('特效颜色','color','color'),beforeApply:()=>setAvatarEffects(c,scope,effects)},effects.fx);}
    if(effects.fx){const tuning={size:effects.fx.size??100,strength:effects.fx.strength??100};for(const [label,key,min,max]of [['特效大小','size',50,200],['特效强度','strength',25,200]])editorControl(container,{...field(label,key,'range',{min,max,unit:'%'}),beforeApply:()=>{effects.fx[key]=tuning[key];setAvatarEffects(c,scope,effects);}},tuning);}
    if(effects.fx&&['snow','float'].includes(effects.fx.kind)){const tuning={density:effects.fx.density??6,speed:effects.fx.speed??100};for(const [label,key,min,max,unit]of [['粒子数量','density',3,12,''],['飘动速度','speed',50,200,'%']])editorControl(container,{...field(label,key,'range',{min,max,step:1,unit}),beforeApply:()=>{effects.fx[key]=tuning[key];setAvatarEffects(c,scope,effects);}},tuning);}
    propertyHeading(container,'头像倒影');
    const reflectionLabel=make('label','field','镜像倒影'),reflectionSelect=make('select');reflectionSelect.setAttribute('aria-label','镜像倒影');
    for(const [id,name]of [['','关闭'],['true','开启']]){const option=make('option','',name);option.value=id;reflectionSelect.append(option);}reflectionSelect.value=effects.reflection?'true':'';reflectionLabel.append(reflectionSelect);container.append(reflectionLabel);
    reflectionSelect.addEventListener('change',()=>{remember();if(reflectionSelect.value)effects.reflection={...REFLECTION_DEFAULTS};else delete effects.reflection;setAvatarEffects(c,scope,effects);apply();renderFields();});
    if(effects.reflection)for(const [label,key,min,max,unit]of [['倒影高度','height',10,60,'%'],['倒影间距','gap',0,40,'px'],['倒影强度','strength',0,80,'%']])editorControl(container,{...field(label,key,'range',{min,max,unit}),beforeApply:()=>setAvatarEffects(c,scope,effects)},effects.reflection);
    propertyHeading(container,'头像遮罩');
    editorControl(container,{...field('遮罩形状','kind','select',{options:[['none','无'],...(effects.frame?[['frame','配套遮罩']]:[]),['circle','圆形'],['ellipse','椭圆'],['diamond','菱形'],...(effects.mask.image.startsWith('data:')?[['custom','自定义遮罩']]:[])]}),beforeApply:()=>{if(effects.mask.kind==='frame')effects.mask.image=effects.frame.id;else if(framePair(effects.mask.image))effects.mask.image='';setAvatarEffects(getConfig(),scope,effects);}},effects.mask,()=>renderFields());
    const finish={...(effects.maskFinish||MASK_FINISH_DEFAULTS)},finishField=f=>({...f,beforeApply:()=>{effects.maskFinish={...finish};setAvatarEffects(getConfig(),scope,effects);}});
    editorControl(container,finishField(field('边缘柔化','feather','range',{min:0,max:20,unit:'%'})),finish);
    editorControl(container,finishField(field('渐隐方向','fade','select',{options:[['none','无'],['down','向下'],['left','向左'],['right','向右']]})),finish,()=>renderFields());
    if(finish.fade!=='none')editorControl(container,finishField(field('开始位置','start','range',{min:0,max:100,unit:'%'})),finish);
    const label=make('label','field','上传自定义遮罩'),input=make('input');input.type='file';input.accept='image/png,image/jpeg,image/webp';input.id='avatar-mask-file';input.setAttribute('aria-label','上传自定义遮罩');label.append(input);container.append(label);
    if(effects.mask.image.startsWith('data:')){const thumb=make('img','page-art-preview');thumb.src=effects.mask.image;thumb.alt='自定义遮罩';thumb.style.background='#9ca79b';thumb.style.maxHeight='100px';thumb.style.objectFit='contain';container.append(thumb);}
    input.addEventListener('change',async()=>{
      const file=input.files?.[0];input.value='';if(!file)return;
      const token=++uploadToken,epoch=getEditEpoch(),original=c,valid=()=>isActive()&&getEditEpoch()===epoch&&getConfig()===original&&getPhotoScope()===scope&&getUi().kind==='avatar'&&avatarTab==='avatar'&&uploadToken===token;
      const operation={};pendingUpload=operation;input.disabled=true;notify('正在处理头像遮罩…');
      try{const result=await prepareAvatarMask(file,{valid});if(!result||!valid())return;remember();effects.mask={kind:'custom',image:result.image};setAvatarEffects(c,scope,effects);apply();renderFields();notify('已添加头像遮罩，可撤销；保存后记住。');}
      catch(error){if(valid())notify('未添加遮罩：'+error.message);}
      finally{input.disabled=false;if(pendingUpload===operation){pendingUpload=null;if(getNotice()==='正在处理头像遮罩…')notify(isActive()?'已取消遮罩上传。':'');}}
    });
    if(fill.enabled){propertyHeading(container,'下缘颜色过渡');
      editorControl(
        container,
        field('颜色过渡', 'gradient', 'select', {
          options: [
            ['false', '关闭'],
            ['true', '开启'],
          ],
        }),
        fill,
        () => renderFields(),
      );
      if (fill.gradient)
        for (const f of [
          field('过渡颜色', 'color', 'color'),
          field('过渡强度', 'opacity', 'range', { min: 0, max: 1, step: 0.05 }),
          field('过渡开始位置', 'start', 'range', {
            min: 0,
            max: 100,
            unit: '%',
          }),
        ])
          editorControl(container, f, fill);

    }
  }
  function renderCompositionFields(container){
    const c=getConfig(),scope=getPhotoScope(),epoch=getEditEpoch(),layers=c.layers.filter(l=>l.anchor==='avatar'&&(l.scope==='both'||l.scope===scope));
    if(!layers.some(l=>l.id===getSelectedLayerId()))setSelectedLayerId(layers[0]?.id||'');
    const style=make('style');style.textContent=COMPOSITION_LIST_CSS;container.append(style);
    compositionList=createAvatarCompositionList({make,config:c,scope,selected:getSelectedLayerId(),
      valid:()=>isActive()&&getConfig()===c&&getPhotoScope()===scope&&getEditEpoch()===epoch&&getUi().kind==='avatar'&&avatarTab==='materials',
      onSelect:id=>{setSelectedLayerId(id);renderFields();},
      onAdd:()=>openCompositionPicker(scope),
      onCommit:(key,order)=>{remember();c.regionOrder.header=order;setSelectedLayerId(key.slice(6));apply();renderFields();},
    });container.append(compositionList.element);
    const layer=layers.find(l=>l.id===getSelectedLayerId());if(!layer)return;
    propertyHeading(container,layer.name);renderCompositionLayer(container);
  }

  function renderHeaderHeightFields(container) {
    const c=getConfig(), separate=c.userHeaderHeight!=null;
    if(!canvasEnabled(c)){const start=make('button','','启用等比制作画布');start.type='button';start.id='enable-header-canvas';start.addEventListener('click',()=>{let next;try{next=validate(enableHeaderCanvas(c));}catch(error){notify('未启用制作画布：'+error.message);return;}remember();Object.assign(c,next);apply();renderFields();});container.append(start);}else{propertyHeading(container,'制作画布');editorControl(container,field('制作宽度','width','range',{min:200,max:2000,unit:'px'}),c.headerCanvas);}
    if(canvasEnabled(c))choice(container,'头像区文字字号',c.headerCanvas.textScale??'follow',[['follow','跟随画布'],['fixed','保持字号']],value=>{
      if(value==='fixed')c.headerCanvas.textScale='fixed';else delete c.headerCanvas.textScale;
    });
    propertyHeading(container,'文字排列');
    choice(container,'头像区文字排列',c.headerTextStack?'stack':'free',[['free','自由摆放'],['stack','纵向排列']],value=>{
      if(value==='stack')c.headerTextStack={captionId:''};else delete c.headerTextStack;
    },true);
    if(c.headerTextStack&&c.captions.length)choice(container,'纵排文案',c.headerTextStack.captionId,[['','仅姓名和时间'],...c.captions.map(cap=>[cap.id,cap.name+(!cap.visible?'（隐藏）':!cap.content.trim()?'（未填写）':'')])],value=>{
      c.headerTextStack.captionId=value;
    });
    if(c.headerTextStack){
      const stack=c.headerTextStack;
      choice(container,'纵排列宽限制',stack.maxWidth===undefined?'auto':'custom',[['auto','不限'],['custom','限制最大宽度']],value=>{
        if(value==='custom')stack.maxWidth=126;else delete stack.maxWidth;
      },true);
      if(stack.maxWidth!==undefined)editorControl(container,field('纵排文字最大宽度','maxWidth','range',{min:40,max:1000,unit:'px'}),stack);
    }

    const label=make('label','field','AI 与用户头像区高度'), select=make('select');
    select.setAttribute('aria-label','AI 与用户头像区高度');
    for(const [value,text]of [['unified','相同高度'],['separate','分开设置']]){const option=make('option','',text);option.value=value;select.append(option);}
    select.value=separate?'separate':'unified';label.append(select);container.append(label);
    select.addEventListener('change',()=>{remember();if(select.value==='separate')getConfig().userHeaderHeight=getConfig().headerHeight;else delete getConfig().userHeaderHeight;apply();renderFields();});
    for(const [label,key]of separate?[['AI 头像区高度','headerHeight'],['用户头像区高度','userHeaderHeight']]:[['头像区总高度','headerHeight']])editorControl(container,field(label,key,'range',{min:60,max:1000,unit:'px'}),c);
  }

  function selectCompositionLayer(id){avatarTab='materials';setSelectedLayerId(id);}
  return { renderPhotoFields, renderHeaderHeightFields, selectCompositionLayer };
}
