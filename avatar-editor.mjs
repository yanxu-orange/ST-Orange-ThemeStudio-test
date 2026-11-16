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
  setPhotoScope,
  getUi,
  propertyHeading,
  editorControl,
  field,
}) {
  function renderPhotoFields(container) {
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
    container.append(mode);
    select.addEventListener('change', () => {
      remember();
      getConfig().avatarDesign = select.value;
      if (select.value === 'unified') {
        const other = getPhotoScope() === 'ai' ? 'user' : 'ai';
        getConfig().photos[other] = clone(getConfig().photos[getPhotoScope()]);
        getConfig().avatarFill[other] = clone(
          getConfig().avatarFill[getPhotoScope()],
        );
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
      container.append(label);
      scope.addEventListener('change', () => {
        setPhotoScope(scope.value);
        getUi().object = 'photo-' + getPhotoScope();
        renderFields();
      });
    }
    const p = getConfig().photos[getPhotoScope()],
      fill = getConfig().avatarFill[getPhotoScope()];

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
    if (fill.enabled) {
      editorControl(
        container,
        field('下缘渐隐', 'gradient', 'select', {
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
          field('渐隐强度', 'opacity', 'range', { min: 0, max: 1, step: 0.05 }),
          field('渐隐开始位置', 'start', 'range', {
            min: 0,
            max: 100,
            unit: '%',
          }),
        ])
          editorControl(container, f, fill);
    } else {
      propertyHeading(container, '形状与尺寸');
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
      const syncPhoto = () => {
        if (getConfig().avatarDesign === 'unified')
          getConfig().photos[getPhotoScope() === 'ai' ? 'user' : 'ai'] =
            clone(p);
      };
      unitSelect.addEventListener('change', () => {
        remember();
        p.widthUnit = unitSelect.value;
        p.size = Math.min(
          p.widthUnit === 'percent' ? 100 : 600,
          Math.max(p.widthUnit === 'percent' ? 1 : 40, p.size),
        );
        syncPhoto();
        apply();
        renderFields();
      });
      editorControl(
        container,
        field('头像宽度', 'size', 'range', {
          min: p.widthUnit === 'percent' ? 1 : 40,
          max: p.widthUnit === 'percent' ? 100 : 600,
          unit: p.widthUnit === 'percent' ? '%' : 'px',
        }),
        p,
      );
      const heightLabel = make('label', 'field', '头像高度'),
        heightMode = make('select');
      heightMode.setAttribute('aria-label', '头像高度');
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
            : Math.max(1, Math.min(600, photoDimensions(p, width).height));
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
          field('头像固定高度', 'height', 'range', {
            min: 1,
            max: 600,
            unit: 'px',
          }),
          p,
        );
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
      propertyHeading(container, '位置与旋转');
      for (const f of [
        field('头像横向移动', 'x', 'range', { min: -80, max: 80, unit: 'px' }),
        field('头像纵向移动', 'y', 'range', { min: -80, max: 80, unit: 'px' }),
        field('头像旋转', 'rotation', 'range', {
          min: -20,
          max: 20,
          step: 0.1,
          unit: '°',
        }),
      ])
        editorControl(container, f, p);
    }
    propertyHeading(container, '取景');
    for (const f of [
      field('头像取景水平位置', 'x', 'range', { min: 0, max: 100, unit: '%' }),
      field('头像取景垂直位置', 'y', 'range', { min: 0, max: 100, unit: '%' }),
    ])
      editorControl(container, f, fill);
  }

  function renderHeaderHeightFields(container) {
    const c=getConfig(), separate=c.userHeaderHeight!=null;
    const label=make('label','field','AI 与用户头像区高度'), select=make('select');
    select.setAttribute('aria-label','AI 与用户头像区高度');
    for(const [value,text]of [['unified','相同高度'],['separate','分开设置']]){const option=make('option','',text);option.value=value;select.append(option);}
    select.value=separate?'separate':'unified';label.append(select);container.append(label);
    select.addEventListener('change',()=>{remember();if(select.value==='separate')getConfig().userHeaderHeight=getConfig().headerHeight;else delete getConfig().userHeaderHeight;apply();renderFields();});
    for(const [label,key]of separate?[['AI 头像区高度','headerHeight'],['用户头像区高度','userHeaderHeight']]:[['头像区总高度','headerHeight']])editorControl(container,field(label,key,'range',{min:60,max:1000,unit:'px'}),c);
  }

  return { renderPhotoFields, renderHeaderHeightFields };
}
