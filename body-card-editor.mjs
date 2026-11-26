export function createBodyCardEditors({
  getConfig, make, field, propertyHeading, pairedFields, editorControl,
  renderConfigFields, renderFontLinkFields, remember, apply, renderFields,
}) {
  function renderBodySettings(container) {
    const config = getConfig();
    propertyHeading(container, '字体设计');
    const fontRow = pairedFields(container);
    renderConfigFields(fontRow, ['font']);

    const label = make('label', 'field', '正文字重');
    const mode = make('select');
    mode.setAttribute('aria-label', '正文字重模式');
    for (const [value, name] of [['auto', '沿用当前'], ['custom', '自定义']]) {
      const option = make('option', '', name);
      option.value = value;
      mode.append(option);
    }
    mode.value = config.bodyWeight === 'auto' ? 'auto' : 'custom';
    mode.addEventListener('change', () => {
      remember();
      getConfig().bodyWeight = mode.value === 'auto' ? 'auto' : 400;
      apply();
      renderFields();
    });
    label.append(mode);
    fontRow.append(label);

    const notice = '正文排版已更新，尚未保存';
    if (config.bodyWeight !== 'auto') {
      editorControl(container, field('正文字重', 'bodyWeight', 'range', {min:100, max:900, step:50, notice}), config);
    }
    renderConfigFields(container, ['fontSize', 'text']);
    renderFontLinkFields(container, 'body', {
      get fontLink() { return getConfig().bodyFontLink; },
      set fontLink(value) { getConfig().bodyFontLink = value; },
    }, '正文');

    propertyHeading(container, '段落排版');
    renderConfigFields(container, ['lineHeight']);
    for (const definition of [
      field('段距（含末段下方）', 'bodyParagraphGap', 'range', {min:0, max:80, unit:'px'}),
      field('首行缩进', 'bodyIndent', 'select', {options:[['false', '关闭'], ['true', '两个字']]}),
    ]) {
      editorControl(container, {...definition, notice}, config);
    }

    propertyHeading(container, '正文左边框');
    editorControl(container, field('正文左边框粗细', 'bodyLeftBorderWidth', 'range', {min:0, max:12, step:.25, unit:'px', notice}), config);
    editorControl(container, field('正文左边框颜色', 'bodyLeftBorderColor', 'color', {notice}), config);

    propertyHeading(container, '左右留白');
    editorControl(container, field('正文整体缩进', 'bodyInset', 'range', {min:0, max:80, unit:'px', notice}), config);
    for (const [label, key] of [['正文左侧留白', 'bodyPaddingLeft'], ['正文右侧留白', 'bodyPaddingRight']]) {
      editorControl(container, field(label, key, 'range', {min:0, max:100, unit:'px', notice}), config);
    }
  }

  function renderCardBorderSettings(container) {
    const config = getConfig();
    const notice = '卡片边框已更新，尚未保存';
    propertyHeading(container, '消息卡片边框');
    editorControl(container, field('边框范围', 'cardBorderMode', 'select', {
      options:[['none', '关闭'], ['all', '四周'], ['custom', '指定边']],
      notice,
    }), config, () => renderFields());

    if (config.cardBorderMode === 'custom') {
      const row = make('div', 'actions');
      for (const [key, title] of [['Top', '上边'], ['Right', '右边'], ['Bottom', '下边'], ['Left', '左边']]) {
        const label = make('label', '', title);
        const input = make('input');
        input.type = 'checkbox';
        input.style.width = 'auto';
        input.checked = config['cardBorder' + key];
        input.setAttribute('aria-label', '卡片' + title);
        input.addEventListener('change', () => {
          remember();
          getConfig()['cardBorder' + key] = input.checked;
          apply();
        });
        label.prepend(input);
        row.append(label);
      }
      container.append(row);
    }

    const colorLabel = make('label', 'field', '边框颜色来源');
    const mode = make('select');
    mode.setAttribute('aria-label', '卡片边框颜色来源');
    for (const [value, name] of [['auto', '默认半透明白'], ['custom', '自定义颜色']]) {
      const option = make('option', '', name);
      option.value = value;
      mode.append(option);
    }
    mode.value = config.cardBorderColor === 'auto' ? 'auto' : 'custom';
    mode.addEventListener('change', () => {
      remember();
      getConfig().cardBorderColor = mode.value === 'auto' ? 'auto' : '#ffffff';
      apply();
      renderFields();
    });
    colorLabel.append(mode);
    container.append(colorLabel);

    if (config.cardBorderColor !== 'auto') {
      editorControl(container, field('卡片边框颜色', 'cardBorderColor', 'color', {notice}), config);
    }
    for (const definition of [
      field('卡片边框粗细', 'cardBorderWidth', 'range', {min:0, max:12, step:.25, unit:'px'}),
      field('卡片边框线型', 'cardBorderStyle', 'select', {options:[['solid', '实线'], ['dashed', '虚线'], ['dotted', '点线'], ['paper', '手绘纸边']]}),
    ]) {
      editorControl(container, {...definition, notice}, config);
    }
  }

  return {renderBodySettings, renderCardBorderSettings};
}
