import { validateCaptionStyle } from './captions.mjs';
import { ASSETS } from './catalog.mjs';
export function createReasoningEditor({
  getConfig,
  editorControl,
  make,
  remember,
  apply,
  renderFields,
  field,
  propertyHeading,
  pairedFields,
  fonts,
  fontPickerButton,
  notify,
  liveAdapter,
  updateFontStatuses,
  openMaterialPicker,
}) {
  function reasoningControl(container, target, f, onUpdate) {
    editorControl(
      container,
      { ...f, notice: '思维样式已更新，尚未保存' },
      target,
      onUpdate,
    );
  }
  function renderReasoningColor(container, target, key, label) {
    const mode = make('select'),
      row = make('label', 'field', label + '来源');
    mode.setAttribute('aria-label', label + '来源');
    for (const [v, t] of [
      ['auto', '沿用主题颜色'],
      ['custom', '自定义'],
    ]) {
      const o = make('option', '', t);
      o.value = v;
      mode.append(o);
    }
    mode.value = target[key] === 'auto' ? 'auto' : 'custom';
    mode.addEventListener('change', () => {
      remember();
      target[key] = mode.value === 'auto' ? 'auto' : getConfig().accent;
      apply();
      renderFields();
    });
    row.append(mode);
    container.append(row);
    if (target[key] !== 'auto')
      reasoningControl(container, target, field(label, key, 'color'));
  }
  function renderReasoningFields(container, part) {
    const item = getConfig().reasoningStyle[part],
      prefix = part === 'entry' ? '入口' : '思维正文';
    if (part === 'entry') {
      propertyHeading(container, '入口内容');
      reasoningControl(container, item, field('入口文字', 'content'));
      reasoningControl(
        container,
        item,
        field('显示入口箭头', 'showArrow', 'select', {
          options: [
            ['false', '隐藏'],
            ['true', '显示'],
          ],
        }),
      );
      propertyHeading(container, '入口第二文案');
      reasoningControl(container, item.secondary, field('第二文案', 'content'));
      reasoningControl(container, item.secondary, field('第二文案字号', 'size', 'range', {min:10,max:34,unit:'px'}));
      renderReasoningColor(container, item.secondary, 'color', '第二文案颜色');
      reasoningControl(container, item.secondary, field('第二文案对齐', 'align', 'select', {options:[['left','左对齐'],['center','居中'],['right','右对齐']]}));
      propertyHeading(container, '入口文字位置');
      for (const [key, label] of [
        ['x', '入口文字水平位置'],
        ['y', '入口文字纵向位置'],
      ])
        reasoningControl(
          container,
          item.labelPosition,
          field(label, key, 'range', { min: -500, max: 500, unit: 'px' }),
        );
    }
    propertyHeading(container, '字体设计');
    reasoningControl(
      container,
      item,
      field('字体来源', 'fontSource', 'select', {
        options: [
          ['body', '跟随聊天正文'],
          ['interface', '跟随界面'],
          ['custom', '自定义'],
        ],
      }),
      () => renderFields(),
    );

    const fontRow = pairedFields(container);
    if (item.fontSource === 'custom')
      reasoningControl(
        fontRow,
        item,
        field(prefix + '字体', 'font', 'select', { options: fonts }),
      );
    const weightLabel = make('label', 'field', prefix + '字重'),
      weight = make('select');
    weight.setAttribute('aria-label', prefix + '字重');
    for (const [v, t] of [
      ['auto', '常规（沿用）'],
      ...Array.from({ length: 9 }, (_, i) => [
        String((i + 1) * 100),
        String((i + 1) * 100),
      ]),
    ]) {
      const o = make('option', '', t);
      o.value = v;
      weight.append(o);
    }
    weight.value = String(item.weight);
    weight.addEventListener('change', () => {
      remember();
      item.weight = weight.value === 'auto' ? 'auto' : Number(weight.value);
      apply();
    });
    weightLabel.append(weight);
    fontRow.append(weightLabel);
    reasoningControl(
      container,
      item,
      field(prefix + '字号', 'size', 'range', {
        min: 10,
        max: part === 'entry' ? 34 : 28,
        unit: 'px',
      }),
    );
    renderReasoningColor(container, item, 'color', prefix + '颜色');
    if (item.fontSource === 'custom') {
      propertyHeading(container, '外链字体');
      const linkRow = pairedFields(container);
      linkRow.classList.add('font-link-row');
      const label = make('label', 'field', '字体文件直链（留空用预设）'),
        link = make('input');
      link.type = 'url';
      link.maxLength = 2048;
      link.value = item.fontLink?.url || '';
      link.setAttribute('aria-label', prefix + ' 字体直链');
      label.append(link);
      const faceLabel = make('label', 'field', '链接文件类型'),
        face = make('select');
      face.setAttribute('aria-label', prefix + ' 链接文件类型');
      for (const [v, t] of [
        ['400', '常规字体'],
        ['700', '粗体字体'],
        ['100 900', '可变字体'],
        ['100', '极细字体'],
        ['200', '纤细字体'],
        ['300', '细体字体'],
        ['500', '中等字体'],
        ['600', '半粗字体'],
        ['800', '特粗字体'],
        ['900', '重体字体'],
      ]) {
        const o = make('option', '', t);
        o.value = v;
        face.append(o);
      }
      face.value = item.fontLink?.faceWeight || '400';
      faceLabel.append(face);
      linkRow.append(faceLabel, label);
      const commit = () => {
        try {
          const value = validateCaptionStyle({
            fontLink: link.value.trim()
              ? { url: link.value.trim(), faceWeight: face.value }
              : null,
          });
          remember();
          item.fontLink = value.fontLink;
          link.removeAttribute('aria-invalid');
          apply();
        } catch (error) {
          link.setAttribute('aria-invalid', 'true');
          notify(error.message);
        }
      };
      fontPickerButton(container, item, (record) => {
        link.value = record.fontLink.url;
        face.value = record.fontLink.faceWeight;
        commit();
      });
      link.addEventListener('change', commit);
      face.addEventListener('change', () => {
        if (link.value.trim()) commit();
      });
      const status = make('p', 'hint');
      status.dataset.fontStatus = 'reasoning:' + part;
      container.append(status);
      const retry = make('button', '', '重新加载链接字体');
      retry.addEventListener('click', () => liveAdapter.retryFonts());
      container.append(
        retry,
        make('p', 'hint', '字体链接须允许跨域；导出保留链接。'),
      );
      updateFontStatuses();
    }

    if (part === 'entry') {
      propertyHeading(container, '入口背景');
      const bg = item.background,
        g = item.geometry;
      reasoningControl(
        container,
        bg,
        field('入口背景', 'mode', 'select', {
          options: [
            ['none', '无背景'],
            ['color', '颜色'],
            ['image', '自选图片'],
          ],
        }),
        () => renderFields(),
      );
      if (bg.mode === 'color')
        reasoningControl(
          container,
          bg,
          field('入口背景颜色', 'color', 'color'),
        );
      if (bg.mode === 'image') {
        const pick = make('button', '', '选择或替换背景图片');
        pick.id = 'reasoning-bg-pick';
        pick.addEventListener('click', () => {
          openMaterialPicker('reasoning-background');
        });
        container.append(
          pick,
          make(
            'p',
            'hint',
            bg.source
              ? bg.source.kind === 'asset'
                ? ASSETS[bg.source.asset].name
                : '已选择上传图片'
              : '尚未选择图片',
          ),
        );
        reasoningControl(
          container,
          bg,
          field('背景填充', 'fit', 'select', {
            options: [
              ['cover', '铺满（可能裁边）'],
              ['contain', '完整显示'],
            ],
          }),
        );
        for (const [key, label] of [
          ['x', '背景横向取景'],
          ['y', '背景纵向取景'],
        ])
          reasoningControl(
            container,
            bg,
            field(label, key, 'range', { min: 0, max: 100, unit: '%' }),
          );
      }
      if (bg.mode !== 'none')
        reasoningControl(
          container,
          bg,
          field('背景透明度', 'opacity', 'range', {
            min: 0,
            max: 1,
            step: 0.05,
          }),
        );
      propertyHeading(container, '入口尺寸与留白');
      const mode = make('select'),
        label = make('label', 'field', '入口宽度');
      mode.setAttribute('aria-label', '入口宽度模式');
      for (const [v, t] of [
        ['auto', '自动'],
        ['custom', '自定义'],
      ]) {
        const o = make('option', '', t);
        o.value = v;
        mode.append(o);
      }
      mode.value = g.width === 'auto' ? 'auto' : 'custom';
      mode.addEventListener('change', () => {
        remember();
        g.width = mode.value === 'auto' ? 'auto' : 60;
        apply();
        renderFields();
      });
      label.append(mode);
      container.append(label);
      if (g.width !== 'auto')
        reasoningControl(
          container,
          g,
          field('入口宽度占比', 'width', 'range', {
            min: 20,
            max: 100,
            unit: '%',
          }),
        );
      for (const [key, label, max] of [
        ['minHeight', '入口最小高度', 160],
        ['radius', '入口圆角', 40],
        ['paddingX', '入口左右留白', 40],
        ['paddingY', '入口上下留白', 40],
      ])
        reasoningControl(
          container,
          g,
          field(label, key, 'range', { min: 0, max, unit: 'px' }),
        );
    } else {
      propertyHeading(container, '容器底色与边框');
      const c = item.container;
      reasoningControl(
        container,
        c,
        field('思维正文背景', 'background', 'select', {
          options: [
            ['none', '无背景'],
            ['color', '颜色'],
          ],
        }),
        () => renderFields(),
      );
      if (c.background === 'color')
        reasoningControl(
          container,
          c,
          field('思维正文背景颜色', 'color', 'color'),
        );
      for (const [key, label, max] of [
        ['radius', '正文容器圆角', 40],
        ['borderWidth', '正文容器边框粗细', 8],
      ])
        reasoningControl(
          container,
          c,
          field(label, key, 'range', {
            min: 0,
            max,
            step: key === 'borderWidth' ? 0.25 : 1,
            unit: 'px',
          }),
        );
      reasoningControl(
        container,
        c,
        field('正文容器边框颜色', 'borderColor', 'color'),
      );
      reasoningControl(
        container,
        c,
        field('正文容器边框线型', 'borderStyle', 'select', {
          options: [
            ['solid', '实线'],
            ['dashed', '虚线'],
            ['dotted', '点线'],
          ],
        }),
      );
      propertyHeading(container, '容器留白');
      for (const [key, label] of [
        ['paddingX', '思维正文左右留白'],
        ['paddingY', '思维正文上下留白'],
      ])
        reasoningControl(
          container,
          c,
          field(label, key, 'range', { min: 0, max: 40, unit: 'px' }),
        );
    }
  }

  return { renderReasoningFields };
}
