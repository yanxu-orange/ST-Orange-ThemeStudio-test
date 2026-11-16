import { resolveNativeActions } from './native.mjs';
import { statValueStyle, resolveNativeStats } from './native-stat-style.mjs';
import {
  SWIPE_COUNTER_DEFAULTS,
  swipeValueStyle,
} from './native-swipe-style.mjs';
import { clone } from './layers.mjs';
export function createNativeControlsEditor({
  getConfig,
  getUi,
  getActionScope,
  setActionScope,
  getStatScope,
  setStatScope,
  editorControl,
  field,
  make,
  remember,
  apply,
  renderFields,
  propertyHeading,
  renderMaterialControl,
  renderIconAppearance,
  fonts,
  renderFontLinkFields,
}) {
  function nativeControl(container, target, f, onUpdate) {
    editorControl(
      container,
      { ...f, notice: '原生功能样式已更新，尚未保存' },
      target,
      onUpdate,
    );
  }
  function nativePositionFields(container, v) {
    nativeControl(
      container,
      v,
      field('所在区域', 'position', 'select', {
        options: [
          ['header', '头像区'],
          ['footer', '尾部区'],
        ],
      }),
      () => renderFields(),
    );
    if (v.anchor && v.position === 'header')
      nativeControl(
        container,
        v,
        field('垂直定位', 'anchor', 'select', {
          options: [
            ['top', '顶部'],
            ['center', '居中'],
            ['bottom', '底部'],
          ],
        }),
      );
    nativeControl(
      container,
      v,
      field('左右移动', 'x', 'range', { min: -100, max: 100, unit: '%' }),
    );
    nativeControl(
      container,
      v,
      field('上下移动', 'y', 'range', { min: -160, max: 160, unit: 'px' }),
    );
  }
  function nativeAppearanceFields(container, v, isStats = false, minSize = 10) {
    nativeControl(
      container,
      v,
      field('字号', 'size', 'range', { min: minSize, max: 28, unit: 'px' }),
    );
    const label = make('label', 'field', '颜色来源'),
      mode = make('select');
    mode.setAttribute('aria-label', '颜色来源');
    for (const [id, text] of [
      ['auto', '沿用主题颜色'],
      ['custom', '自定义'],
    ]) {
      const o = make('option', '', text);
      o.value = id;
      mode.append(o);
    }
    mode.value = v.color === 'auto' ? 'auto' : 'custom';
    mode.addEventListener('change', () => {
      remember();
      v.color =
        mode.value === 'auto'
          ? 'auto'
          : isStats
            ? getConfig().timeColor
            : getConfig().accent;
      apply();
      renderFields();
    });
    label.append(mode);
    container.append(label);
    if (v.color !== 'auto')
      nativeControl(container, v, field('颜色', 'color', 'color'));
  }
  function renderNativeFields(container) {
    if (getUi().kind === 'actions') {
      const rootActions = getConfig().nativeStyle.actions;
      const designRow = make('label', 'field', '设计对象'),
        design = make('select');
      design.setAttribute('aria-label', '设计对象');
      for (const [value, text] of [
        ['unified', '一起设置'],
        ['separate', '分开设置'],
      ]) {
        const option = make('option', '', text);
        option.value = value;
        design.append(option);
      }
      design.value = rootActions.design || 'unified';
      designRow.append(design);
      container.append(designRow);
      design.addEventListener('change', () => {
        remember();
        rootActions.design = design.value;
        if (design.value === 'separate' && !rootActions.roles) {
          const shared = Object.fromEntries(
            Object.entries(rootActions).filter(
              ([key]) => !['design', 'roles'].includes(key),
            ),
          );
          rootActions.roles = { ai: clone(shared), user: clone(shared) };
        }
        apply();
        renderFields();
      });
      if (rootActions.design === 'separate') {
        const scopeRow = make('label', 'field', '正在设计'),
          scope = make('select');
        scope.setAttribute('aria-label', '正在设计');
        for (const [value, text] of [
          ['ai', 'AI'],
          ['user', '用户'],
        ]) {
          const option = make('option', '', text);
          option.value = value;
          scope.append(option);
        }
        scope.value = getActionScope();
        scopeRow.append(scope);
        container.append(scopeRow);
        scope.addEventListener('change', () => {
          setActionScope(scope.value);
          renderFields();
        });
      }
      const actions = resolveNativeActions(
          rootActions,
          getActionScope() === 'user',
        ),
        edit = actions.edit;
      propertyHeading(container, '编辑');
      nativePositionFields(container, edit);
      renderMaterialControl(container, edit, {
        label: '显示方式',
        purpose: 'native-edit-icon',
        id: 'native-edit-pick',
        native: true,
      });
      if (edit.mode === 'text')
        nativeControl(
          container,
          edit,
          field('文字', 'text', 'text', { maxLength: 40 }),
        );
      if (['image', 'icon'].includes(edit.mode))
        nativeControl(
          container,
          edit,
          field('图标大小', 'imageSize', 'range', {
            min: 8,
            max: 120,
            unit: 'px',
          }),
        );
      if (edit.mode === 'icon')
        renderIconAppearance(container, edit, {
          native: true,
          prefix: '编辑图标',
        });
      propertyHeading(container, '更多');
      nativePositionFields(container, actions.more);
      renderMaterialControl(container, actions.more, {
        label: '更多显示方式',
        purpose: 'native-more-icon',
        id: 'native-more-pick',
        native: true,
      });
      if (actions.more.mode === 'text')
        nativeControl(
          container,
          actions.more,
          field('更多文字', 'text', 'text', { maxLength: 40 }),
        );
      if (['image', 'icon'].includes(actions.more.mode))
        nativeControl(
          container,
          actions.more,
          field('更多图标大小', 'imageSize', 'range', {
            min: 8,
            max: 120,
            unit: 'px',
          }),
        );
      if (actions.more.mode === 'icon')
        renderIconAppearance(container, actions.more, {
          native: true,
          prefix: '更多图标',
        });
      propertyHeading(container, '外观');
      nativeAppearanceFields(container, actions);
    } else if (getUi().kind === 'info') {
      const rootStats = getConfig().nativeStyle.stats,
        key = getUi().object;
      const designRow = make('label', 'field', '设计对象'),
        design = make('select');
      design.setAttribute('aria-label', '设计对象');
      for (const [value, text] of [
        ['unified', '统一设计'],
        ['separate', '分别设计'],
      ]) {
        const option = make('option', '', text);
        option.value = value;
        design.append(option);
      }
      design.value = rootStats.design || 'unified';
      designRow.append(design);
      container.append(designRow);
      design.addEventListener('change', () => {
        remember();
        rootStats.design = design.value;
        if (design.value === 'separate' && !rootStats.roles) {
          const items = Object.fromEntries(
            ['floor', 'time', 'tokens'].map((name) => [name, rootStats[name]]),
          );
          rootStats.roles = { ai: clone(items), user: clone(items) };
        }
        apply();
        renderFields();
      });
      if (rootStats.design === 'separate') {
        const scopeRow = make('label', 'field', '正在设计'),
          scope = make('select');
        scope.setAttribute('aria-label', '正在设计');
        for (const [value, text] of [
          ['ai', 'AI'],
          ['user', '用户'],
        ]) {
          const option = make('option', '', text);
          option.value = value;
          scope.append(option);
        }
        scope.value = getStatScope();
        scopeRow.append(scope);
        container.append(scopeRow);
        scope.addEventListener('change', () => {
          setStatScope(scope.value);
          renderFields();
        });
      }
      const stats = resolveNativeStats(rootStats, getStatScope() === 'user'),
        item = stats[key],
        fontPrefix =
          'native-' +
          (rootStats.design === 'separate' ? getStatScope() + '-' : '') +
          key;

      const modeField = (label, current, change) => {
        const row = make('label', 'field', label),
          select = make('select');
        select.setAttribute('aria-label', label);
        for (const [value, title] of [
          ['inherit', label === '标签样式' ? '跟随数值样式' : '跟随公共样式'],
          ['custom', '单独设置'],
        ]) {
          const option = make('option', '', title);
          option.value = value;
          select.append(option);
        }
        select.value = current ? 'custom' : 'inherit';
        select.addEventListener('change', () => {
          remember();
          change(select.value === 'custom');
          apply();
          renderFields();
        });
        row.append(select);
        container.append(row);
      };
      const appearance = (style, id) => {
        nativeAppearanceFields(container, style, true, 8);
        nativeControl(
          container,
          style,
          field('字体', 'font', 'select', {
            options: [
              ['auto', id === 'label' ? '跟随数值字体' : '沿用原生字体'],
              ...fonts,
            ],
          }),
        );
        nativeControl(
          container,
          {
            get weight() {
              return style.weight;
            },
            set weight(v) {
              style.weight = v === 'auto' ? 'auto' : Number(v);
            },
          },
          field('字重', 'weight', 'select', {
            options: [
              ['auto', id === 'label' ? '跟随数值字重' : '沿用原生字重'],
              ...Array.from({ length: 9 }, (_, i) => [
                String((i + 1) * 100),
                String((i + 1) * 100),
              ]),
            ],
          }),
        );
        renderFontLinkFields(
          container,
          fontPrefix + '-' + id,
          style,
          '楼层信息',
        );
      };
      propertyHeading(container, '文字');
      if (key === 'floor') {
        nativeControl(
          container,
          item,
          field('前缀', 'prefix', 'text', { maxLength: 40 }),
        );
        nativeControl(
          container,
          item,
          field('后缀', 'suffix', 'text', { maxLength: 40 }),
        );
      }
      const label = item.label || { text: '', style: null, gap: 8 };
      nativeControl(
        container,
        {
          get text() {
            return label.text;
          },
          set text(v) {
            label.text = v;
            item.label = label;
          },
        },
        field('标签文案', 'text', 'text', { maxLength: 40 }),
      );
      const labelInput = container.querySelector('[aria-label="标签文案"]'),
        hadLabel = Boolean(label.text);
      const refreshLabelFields = () => {
        if (labelInput.isConnected && Boolean(label.text) !== hadLabel)
          renderFields();
      };
      labelInput.addEventListener('change', refreshLabelFields);
      labelInput.addEventListener('blur', refreshLabelFields);
      propertyHeading(container, '数值外观');
      modeField('数值样式', item.valueStyle, (custom) => {
        item.valueStyle = custom ? statValueStyle(stats, key) : null;
      });
      if (item.valueStyle) appearance(item.valueStyle, 'value');
      if (label.text) {
        propertyHeading(container, '标签外观');
        modeField('标签样式', label.style, (custom) => {
          label.style = custom ? { ...statValueStyle(stats, key) } : null;
        });
        if (label.style) appearance(label.style, 'label');
        nativeControl(
          container,
          label,
          field('标签间距', 'gap', 'range', { min: 0, max: 40, unit: 'px' }),
        );
      }
      propertyHeading(container, '位置');
      nativeControl(
        container,
        item,
        field('所在区域', 'position', 'select', {
          options: [
            ['header', '头像区'],
            ['footer', '尾部区'],
          ],
        }),
      );
      nativeControl(
        container,
        {
          get anchor() {
            return item.anchor || 'default';
          },
          set anchor(value) {
            item.anchor = value;
          },
        },
        field('水平定位', 'anchor', 'select', {
          options: [
            ['default', '默认位置'],
            ['left', '左侧'],
            ['center', '居中'],
            ['right', '右侧'],
          ],
        }),
      );
      nativeControl(
        container,
        item,
        field('左右移动', 'x', 'range', { min: -100, max: 100, unit: '%' }),
      );
      nativeControl(
        container,
        item,
        field('上下移动', 'y', 'range', { min: -160, max: 160, unit: 'px' }),
      );
    } else {
      const swipe = getConfig().nativeStyle.swipe,
        key = getUi().object;
      const modeField = (label, current, change, follow = '跟随翻页样式') => {
        const row = make('label', 'field', label),
          select = make('select');
        select.setAttribute('aria-label', label);
        for (const [value, title] of [
          ['inherit', follow],
          ['custom', '单独设置'],
        ]) {
          const option = make('option', '', title);
          option.value = value;
          select.append(option);
        }
        select.value = current ? 'custom' : 'inherit';
        select.addEventListener('change', () => {
          remember();
          change(select.value === 'custom');
          apply();
          renderFields();
        });
        row.append(select);
        container.append(row);
      };
      const valueStyle = () => swipeValueStyle(swipe);
      const appearance = (style, id, label = false) => {
        nativeAppearanceFields(container, style, false, 8);
        nativeControl(
          container,
          style,
          field('字体', 'font', 'select', {
            options: [
              ['auto', label ? '跟随数值字体' : '沿用原生字体'],
              ...fonts,
            ],
          }),
        );
        nativeControl(
          container,
          {
            get weight() {
              return style.weight;
            },
            set weight(v) {
              style.weight = v === 'auto' ? 'auto' : Number(v);
            },
          },
          field('字重', 'weight', 'select', {
            options: [
              ['auto', label ? '跟随数值字重' : '沿用原生字重'],
              ...Array.from({ length: 9 }, (_, i) => [
                String((i + 1) * 100),
                String((i + 1) * 100),
              ]),
            ],
          }),
        );
        renderFontLinkFields(
          container,
          'native-swipe-' + id,
          style,
          '回复翻页',
        );
      };
      const flag = (target, name, label) =>
        nativeControl(
          container,
          {
            get value() {
              return target[name] ?? false;
            },
            set value(v) {
              target[name] = v === true || v === 'true';
            },
          },
          field(label, 'value', 'select', {
            options: [
              ['false', '不额外隐藏'],
              ['true', '隐藏'],
            ],
          }),
        );
      if (key === 'group') {
        propertyHeading(container, '排列');
        nativeControl(
          container,
          swipe,
          field('箭头排列', 'layout', 'select', {
            options: [
              ['compact', '紧凑'],
              ['ends', '左右两端'],
            ],
          }),
          () => renderFields(),
        );
        if (swipe.layout === 'compact')
          nativeControl(
            container,
            swipe,
            field('中间间距', 'gap', 'range', { min: 0, max: 40, unit: 'px' }),
          );
        propertyHeading(container, '位置');
        nativePositionFields(container, swipe);
        propertyHeading(container, '外观');
        nativeAppearanceFields(container, swipe);
        propertyHeading(container, '显示');
        flag(swipe, 'hideHistoryControls', '隐藏历史翻页按钮与计数');
      } else if (key === 'left' || key === 'right') {
        const arrow = swipe[key],
          name = key === 'left' ? '左箭头' : '右箭头';
        propertyHeading(container, '文字');
        nativeControl(
          container,
          arrow,
          field(name + '显示', 'mode', 'select', {
            options: [
              ['default', '原生箭头'],
              ['text', '自定义文字'],
            ],
          }),
          () => renderFields(),
        );
        if (arrow.mode === 'text')
          nativeControl(
            container,
            arrow,
            field(name + '文字', 'text', 'text', { maxLength: 40 }),
          );
        propertyHeading(container, '外观');
        modeField('按钮样式', arrow.valueStyle, (custom) => {
          arrow.valueStyle = custom ? valueStyle() : null;
        });
        if (arrow.valueStyle) {
          if (arrow.mode === 'text') appearance(arrow.valueStyle, key);
          else nativeAppearanceFields(container, arrow.valueStyle, false, 8);
        }
      } else {
        const raw = swipe.counter || { ...SWIPE_COUNTER_DEFAULTS },
          counter = new Proxy(raw, {
            set(target, name, value) {
              target[name] = value;
              swipe.counter = target;
              return true;
            },
          });
        propertyHeading(container, '显示');
        for (const [name, label] of [
          ['hideHistory', '隐藏历史版本页数'],
          ['hideLatest', '隐藏最新AI版本页数'],
        ])
          flag(swipe, name, label);
        flag(counter, 'hideSingle', '隐藏单候选计数');
        propertyHeading(container, '数字');
        nativeControl(
          container,
          counter,
          field('计数显示', 'mode', 'select', {
            options: [
              ['native', '原生当前 / 总数'],
              ['current', '仅当前版本'],
            ],
          }),
          () => renderFields(),
        );
        if (counter.mode === 'current')
          nativeControl(
            container,
            {
              get value() {
                return counter.pad;
              },
              set value(v) {
                counter.pad = v === true || v === 'true';
              },
            },
            field('两位补零', 'value', 'select', {
              options: [
                ['false', '不补零'],
                ['true', '补零'],
              ],
            }),
          );
        propertyHeading(container, '数值外观');
        modeField('数值样式', counter.valueStyle, (custom) => {
          counter.valueStyle = custom ? valueStyle() : null;
        });
        if (counter.valueStyle) appearance(counter.valueStyle, 'counter-value');
        nativeControl(
          container,
          {
            get value() {
              return counter.italic;
            },
            set value(v) {
              counter.italic = v === true || v === 'true';
            },
          },
          field('斜体', 'value', 'select', {
            options: [
              ['false', '不使用'],
              ['true', '使用'],
            ],
          }),
        );
        propertyHeading(container, '标签');
        const label = counter.label || { text: '', style: null, gap: 8 };
        nativeControl(
          container,
          {
            get text() {
              return label.text;
            },
            set text(v) {
              label.text = v;
              counter.label = label;
            },
          },
          field('标签文案', 'text', 'text', { maxLength: 40 }),
        );
        const labelInput = container.querySelector('[aria-label="标签文案"]'),
          hadLabel = Boolean(label.text),
          refresh = () => {
            if (labelInput.isConnected && Boolean(label.text) !== hadLabel)
              renderFields();
          };
        labelInput.addEventListener('change', refresh);
        labelInput.addEventListener('blur', refresh);
        if (label.text) {
          modeField(
            '标签样式',
            label.style,
            (custom) => {
              label.style = custom
                ? { ...(counter.valueStyle || valueStyle()) }
                : null;
            },
            '跟随数值样式',
          );
          if (label.style) appearance(label.style, 'counter-label', true);
          nativeControl(
            container,
            label,
            field('标签间距', 'gap', 'range', { min: 0, max: 40, unit: 'px' }),
          );
        }
        propertyHeading(container, '位置');
        nativeControl(
          container,
          counter,
          field('计数位置', 'position', 'select', {
            options: [
              ['group', '跟随翻页按钮'],
              ['header', '头像区'],
              ['footer', '尾部区'],
            ],
          }),
          () => renderFields(),
        );
        if (counter.position !== 'group') {
          nativeControl(
            container,
            counter,
            field('水平定位', 'anchor', 'select', {
              options: [
                ['left', '左侧'],
                ['center', '居中'],
                ['right', '右侧'],
              ],
            }),
          );
          nativeControl(
            container,
            counter,
            field('左右移动', 'x', 'range', { min: -100, max: 100, unit: '%' }),
          );
          nativeControl(
            container,
            counter,
            field('上下移动', 'y', 'range', {
              min: -160,
              max: 160,
              unit: 'px',
            }),
          );
        }
      }
    }
  }

  return { renderNativeFields };
}
