import { ICON_STYLE_DEFAULTS, iconStyle } from './icon-style.mjs';

export function createIconControlsEditor({
  getConfig,
  make,
  openMaterialPicker,
  invalidateEditing,
  remember,
  apply,
  renderFields,
  notify,
  propertyHeading,
  editorControl,
  field,
}) {
  function seedIconStyle(target) {
    for (const [key, value] of Object.entries(ICON_STYLE_DEFAULTS))
      if (target[key] === undefined)
        target[key] = key === 'color' ? getConfig().accent : value;
  }
  function renderMaterialControl(
    container,
    target,
    { label, purpose, id, native = false },
  ) {
    const nativeMode = native ? 'default' : 'native',
      hasMaterial = !!(
        target.icon ||
        target.image ||
        target.asset ||
        target.source
      ),
      custom = ['image', 'icon'].includes(target.mode);
    const fieldLabel = make('div', 'field'),
      row = make('div', 'material-source-row'),
      mode = make('select'),
      pick = make('button', '', hasMaterial ? '更换' : '选择素材');
    mode.setAttribute('aria-label', label);
    for (const [value, name] of [
      [nativeMode, '原生'],
      ...(native ? [['text', '文字']] : []),
      ['custom', '自定义'],
    ]) {
      const option = make('option', '', name);
      option.value = value;
      mode.append(option);
    }
    mode.value = custom ? 'custom' : target.mode;
    pick.type = 'button';
    pick.id = id;
    pick.setAttribute(
      'aria-label',
      (hasMaterial ? '更换' : '选择素材') + '：' + label,
    );
    const choose = () =>
      openMaterialPicker(purpose, target.mode === 'icon' ? 'icons' : 'images');
    pick.addEventListener('click', choose);
    mode.addEventListener('change', () => {
      if (mode.value === 'custom') {
        mode.value = custom ? 'custom' : target.mode;
        choose();
        return;
      }
      if (mode.value === target.mode) return;
      invalidateEditing();
      remember();
      target.mode = mode.value;
      if (target.mode === nativeMode) {
        target.icon = '';
        if (native) target.source = null;
        else {
          target.asset = '';
          target.image = '';
        }
      }
      apply();
      renderFields();
      notify('显示方式已更新，尚未保存');
    });
    row.append(mode, pick);
    fieldLabel.append(make('span', '', label), row);
    container.append(fieldLabel);
  }
  function renderIconAppearance(
    container,
    target,
    { native = false, prefix = '图标' } = {},
  ) {
    target = new Proxy(target, {
      get: (object, key) =>
        Object.hasOwn(ICON_STYLE_DEFAULTS, key)
          ? iconStyle(object)[key]
          : object[key],
    });
    propertyHeading(container, prefix + '外观');
    const control = (label, key, type, extra = {}, rerender = false) =>
      editorControl(
        container,
        field(label, key, type, {
          ...extra,
          notice: '图标外观已更新，尚未保存',
        }),
        target,
        rerender ? () => renderFields() : undefined,
      );
    control(
      prefix + '整体染色',
      'tint',
      'select',
      {
        options: [
          ['false', '保留原色'],
          ['true', '统一染色'],
        ],
      },
      true,
    );
    if (target.tint) {
      control(
        prefix + '填色方式',
        'fillMode',
        'select',
        {
          options: [
            ['solid', '纯色'],
            ['gradient', '双色渐变'],
          ],
        },
        true,
      );
      control(prefix + '颜色', 'color', 'color');
      if (target.fillMode === 'gradient') {
        control(prefix + '第二颜色', 'color2', 'color');
        control(prefix + '渐变方向', 'gradientAngle', 'range', {
          min: 0,
          max: 360,
          unit: '°',
        });
      }
    }
    if (!native) {
      const label = make('label', 'field', prefix + '大小来源'),
        select = make('select');
      select.setAttribute('aria-label', prefix + '大小来源');
      for (const [id, name] of [
        ['auto', '跟随区域'],
        ['custom', '单独调整'],
      ]) {
        const option = make('option', '', name);
        option.value = id;
        select.append(option);
      }
      select.value = target.size ? 'custom' : 'auto';
      select.addEventListener('change', () => {
        remember();
        target.size = select.value === 'auto' ? 0 : 22;
        apply();
        renderFields();
      });
      label.append(select);
      container.append(label);
      if (target.size)
        control(prefix + '单独大小', 'size', 'range', {
          min: 12,
          max: 40,
          unit: 'px',
        });
    }
    container.append(
      make('p', 'hint', '统一染色会覆盖原图配色，不会去除实色背景。'),
    );
  }

  return { seedIconStyle, renderMaterialControl, renderIconAppearance };
}
