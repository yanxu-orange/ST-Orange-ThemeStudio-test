import {canvasEnabled,designInnerWidth} from './header-canvas.mjs';
import { footerKey, newFooterCaption } from './footer.mjs';
import { captionKey, CAPTION_LIMIT } from './captions.mjs';
import { newSceneCaption } from './text-scene.mjs';
import {
  newMetadata,
  metadataItem,
  metadataFontKey,
} from './native-metadata.mjs';
import { clone } from './layers.mjs';
import { uniqueId } from './unique-id.mjs';

export function createTextEditor({
  getUi,
  getConfig,
  make,
  remember,
  apply,
  renderFields,
  editorControl,
  field,
  propertyHeading,
  getMetadataScope,
  setMetadataScope,
  fonts,
  renderFontLinkFields,
  getTextItemKey,
  pairedFields,
  renderConfigFields,
  setTextItemKey,
  invalidateEditing,
}) {
  function selectedCaption() {
    return getUi().region === 'footer'
      ? getConfig().footerCaptions.find(
          (c) => footerKey(c.id) === getUi().object,
        )
      : getConfig().captions.find((c) => captionKey(c.id) === getUi().object);
  }
  function currentCaptions() {
    return getUi().region === 'footer'
      ? getConfig().footerCaptions
      : getConfig().captions;
  }
  function currentCaptionKey(id) {
    return getUi().region === 'footer' ? footerKey(id) : captionKey(id);
  }
  function currentNewCaption(overrides) {
    return getUi().region === 'footer'
      ? newFooterCaption(overrides)
      : newSceneCaption(getConfig(), overrides);
  }
  function renderCaptionWidth(container, cap, labelName = '文案') {
    const pixels=canvasEnabled(getConfig())&&getUi().region==='header';
    const label = make('label', 'field', labelName + '宽度'),
      mode = make('select');
    mode.setAttribute('aria-label', labelName + '宽度模式');
    for (const [value, name] of [
      ['auto', getUi().region === 'footer' ? '完整尾部宽度' : '自动宽度'],
      ['custom', '自定义'],
    ]) {
      const option = make('option', '', name);
      option.value = value;
      mode.append(option);
    }
    mode.value = cap.width === 'auto' ? 'auto' : 'custom';
    mode.addEventListener('change', () => {
      remember();
      cap.width = mode.value === 'auto' ? 'auto' : pixels?300:60;
      apply();
      renderFields();
    });
    label.append(mode);
    container.append(label);
    if (cap.width !== 'auto')
      editorControl(
        container,
        field(labelName + (pixels?'宽度':'宽度占比'), 'width', 'range', {
          min: pixels?1:10,
          max: pixels?4000:100,
          unit: pixels?'px':'%',
          notice: '文案宽度已更新，尚未保存',
        }),
        cap,
      );
  }

  function renderMetadataFields(container, key) {
    const m = getConfig().metadata || newMetadata(),
      labelName = key === 'name' ? '名字' : '时间';
    propertyHeading(container, 'AI 与用户');
    const modeLabel = make('label', 'field', 'AI 与用户'),
      mode = make('select');
    mode.setAttribute('aria-label', 'AI 与用户');
    for (const [v, t] of [
      ['unified', '一起设置'],
      ['separate', '分开设置'],
    ]) {
      const o = make('option', '', t);
      o.value = v;
      mode.append(o);
    }
    mode.value = m.design;
    modeLabel.append(mode);
    container.append(modeLabel);
    mode.addEventListener('change', () => {
      remember();
      if (mode.value === 'separate')
        for (const scope of ['ai', 'user'])
          for (const k of ['name', 'time'])
            if (m.roles[scope][k] === null)
              m.roles[scope][k] = clone(
                m.unified[k] || metadataItem(getConfig(), k),
              );
      m.design = mode.value;
      getConfig().metadata = m;
      apply();
      renderFields();
    });
    if (m.design === 'separate') {
      const l = make('label', 'field', '正在设计'),
        sel = make('select');
      sel.setAttribute('aria-label', '姓名时间对象');
      for (const [v, t] of [
        ['ai', 'AI'],
        ['user', '用户'],
      ]) {
        const o = make('option', '', t);
        o.value = v;
        sel.append(o);
      }
      sel.value = getMetadataScope();
      l.append(sel);
      container.append(l);
      sel.addEventListener('change', () => {
        setMetadataScope(sel.value);
        renderFields();
      });
    }
    const scope = m.design === 'separate' ? getMetadataScope() : 'unified',
      group = scope === 'unified' ? m.unified : m.roles[scope],
      item = group[key] || metadataItem(getConfig(), key),
      commit = () => {
        getConfig().metadata = m;
        group[key] = item;
      };
    const control = (f, target = item, after) =>
      editorControl(
        container,
        {
          ...f,
          beforeApply: commit,
          positionSource: group[key] ? undefined : getConfig().textItems[key],
          beforePreview: () => {
            const previous = group[key];
            commit();
            return () => {
              group[key] = previous;
            };
          },
        },
        target,
        after,
      );
    if (key === 'name') {
      const redrawPrefix = () => {
        if (scope !== 'unified') setMetadataScope(scope);
        renderFields();
      };
      control(
        field('姓名前缀', 'prefix', 'text', { maxLength: 40 }),
        new Proxy(item, {
          get: (value, name) =>
            name === 'prefix' ? (value.prefix ?? '') : value[name],
        }),
      );
      const prefixInput = container.querySelector('[aria-label="姓名前缀"]');
      const finishPrefix = () => {
        if (prefixInput.isConnected) redrawPrefix();
      };
      prefixInput.addEventListener('change', finishPrefix);
      prefixInput.addEventListener('blur', finishPrefix);
      if (item.prefix) {
        const prefixStyle = item.prefixStyle || { size: null, color: null };
        const prefixCommit = () => {
          item.prefixStyle = prefixStyle;
          commit();
        };
        const prefixSource = (label, key, fallback) => {
          const row = make('label', 'field', key === 'size' ? '前缀字号' : '前缀颜色'),
            select = make('select');
          select.setAttribute('aria-label', label);
          for (const [value, title] of [
            ['inherit', '跟随姓名'],
            ['custom', '单独设置'],
          ]) {
            const option = make('option', '', title);
            option.value = value;
            select.append(option);
          }
          select.value = prefixStyle[key] == null ? 'inherit' : 'custom';
          row.append(select);
          container.append(row);
          select.addEventListener('change', () => {
            remember();
            prefixStyle[key] = select.value === 'custom' ? fallback : null;
            prefixCommit();
            apply();
            redrawPrefix();
          });
        };
        const prefixControl = (f) =>
          editorControl(
            container,
            { ...f, beforeApply: prefixCommit },
            prefixStyle,
          );
        prefixSource('前缀字号来源', 'size', item.style.size);
        if (prefixStyle.size != null)
          prefixControl(
            field('前缀字号', 'size', 'range', {
              min: 8,
              max: 200,
              unit: 'px',
            }),
          );
        prefixSource('前缀颜色来源', 'color', item.style.color);
        if (prefixStyle.color != null)
          prefixControl(field('前缀颜色', 'color', 'color'));
      }
    }
    propertyHeading(container, '位置');
    const pixels=canvasEnabled(getConfig())&&item.region==='header';
    const regionProxy=new Proxy(item,{set(target,key,value){if(key==='region'&&value!==target.region&&canvasEnabled(getConfig())){const toPixels=value==='header',w=designInnerWidth(getConfig());target.x=target.x*(toPixels?w/100:100/w);if(target.width!=='auto')target.width=target.width*(toPixels?w/100:100/w);if(!toPixels){target.x=Math.max(-100,Math.min(200,target.x));if(target.width!=='auto')target.width=Math.max(10,Math.min(100,target.width));}}target[key]=value;return true;}});
    control(
      field('定位区域', 'region', 'select', {
        options: [
          ['header', '头像区'],
          ['body-top', '正文上沿'],
        ],
      }),
      regionProxy,
      () => renderFields(),
    );
    if (item.region === 'body-top')
      control(
        field('正文上沿排布', 'flow', 'select', {
          options: [
            ['reserve', '保留占位'],
            ['overlay', '叠放在正文上沿'],
          ],
        }),
      );
    if(!(key==='time'&&getConfig().headerTextStack&&item.region==='header')){
    control(
      field('水平对齐', 'anchor', 'select', {
        options: [
          ['left', '左侧'],
          ['center', '居中'],
          ['right', '右侧'],
        ],
      }),
    );
    for (const f of [
      field(labelName + ' 水平位置', 'x', 'range', {
        min: pixels?-4000:-100,
        max: pixels?4000:200,
        unit: pixels?'px':'%',
      }),
      field(labelName + ' 纵向位置', 'y', 'range', {
        min: -400,
        max: 1600,
        unit: 'px',
      }),
    ])
      control(f);
    const widthLabel = make('label', 'field', labelName + '宽度'),
      width = make('select');
    width.setAttribute('aria-label', labelName + '宽度模式');
    for (const [v, t] of [
      ['auto', '自动宽度'],
      ['custom', '自定义'],
    ]) {
      const o = make('option', '', t);
      o.value = v;
      width.append(o);
    }
    width.value = item.width === 'auto' ? 'auto' : 'custom';
    widthLabel.append(width);
    container.append(widthLabel);
    width.addEventListener('change', () => {
      remember();
      item.width = width.value === 'auto' ? 'auto' : pixels?300:60;
      commit();
      apply();
      renderFields();
    });
    if (item.width !== 'auto')
      control(
        field(labelName + (pixels?'宽度':'宽度占比'), 'width', 'range', {
          min: pixels?1:10,
          max: pixels?4000:100,
          unit: pixels?'px':'%',
        }),
      );
    }
    propertyHeading(container, '字体设计');
    const style = item.style;
    control(
      field(key === 'name' ? '名字字体' : '时间字体', 'font', 'select', {
        options: fonts,
      }),
      style,
    );
    control(
      field(labelName + '字号', 'size', 'range', {
        min: 8,
        max: 200,
        unit: 'px',
      }),
      style,
    );
    control(field(labelName + '颜色', 'color', 'color'), style);
    const weightLabel = make('label', 'field', '字重'),
      weight = make('select');
    weight.setAttribute('aria-label', labelName + ' 字重');
    for (const [v, t] of [
      ['auto', '沿用'],
      ...Array.from({ length: 9 }, (_, i) => [
        String((i + 1) * 100),
        String((i + 1) * 100),
      ]),
    ]) {
      const o = make('option', '', t);
      o.value = v;
      weight.append(o);
    }
    weight.value = String(style.weight);
    weightLabel.append(weight);
    container.append(weightLabel);
    weight.addEventListener('change', () => {
      remember();
      style.weight = weight.value === 'auto' ? 'auto' : Number(weight.value);
      commit();
      apply();
    });
    propertyHeading(container, '外链字体');
    renderFontLinkFields(
      container,
      metadataFontKey(scope, key),
      style,
      labelName,
      commit,
    );
  }
  function renderCaptionMetrics(container, item, fallback) {
    const target = new Proxy(item, {
      get(value, key) {
        return key === 'lineHeight'
          ? (value.lineHeight ?? fallback)
          : key === 'scaleX'
            ? (value.scaleX ?? 1)
            : value[key];
      },
    });
    editorControl(
      container,
      field('文案行高', 'lineHeight', 'range', {
        min: 1,
        max: 3,
        step: 0.05,
        unit: '倍',
      }),
      target,
    );
    editorControl(
      container,
      field('文案横向缩放', 'scaleX', 'range', {
        min: 0.5,
        max: 2,
        step: 0.001,
        unit: '倍',
      }),
      target,
    );
  }
  function renderTextFields(container) {
    if (
      getUi().region === 'header' &&
      ['name', 'time'].includes(getTextItemKey())
    ) {
      renderMetadataFields(container, getTextItemKey());
      return;
    }
    const key = getTextItemKey(),
      cap = selectedCaption(),
      item = cap || getConfig().textItems[key],
      labelName = cap ? '文案' : { name: '名字', time: '时间' }[key],
      stacked = cap&&getUi().region==='header'&&getConfig().headerTextStack?.captionId===cap.id;
    propertyHeading(container, cap ? stacked?'内容':'内容与位置' : '位置');
    if (cap) {
      editorControl(
        container,
        field('应用于', 'scope', 'select', {
          options: [
            ['both', 'AI 和用户'],
            ['ai', '仅 AI'],
            ['user', '仅用户'],
          ],
        }),
        cap,
      );
      const contentRow = pairedFields(container);
      editorControl(
        contentRow,
        field('文案标题', 'name', 'text', {
          notice: '文案标题已更新，尚未保存',
        }),
        cap,
      );
      editorControl(
        contentRow,
        field('显示文案', 'visible', 'select', {
          options: [
            ['true', '显示'],
            ['false', '隐藏'],
          ],
          notice: '文案显隐已更新，尚未保存',
        }),
        cap,
      );
      const label = make('label', 'field', '文案内容'),
        input = make('textarea');
      input.maxLength = 300;
      input.rows = 4;
      input.setAttribute('aria-label', '文案内容');
      input.value = cap.content;
      let tracking = false;
      input.addEventListener('input', () => {
        if (!tracking) {
          remember();
          tracking = true;
        }
        cap.content = input.value;
        apply();
      });
      for (const event of ['blur', 'change'])
        input.addEventListener(event, () => (tracking = false));
      label.append(input);
      container.append(label);
      if(!stacked)renderCaptionWidth(container, cap);
    } else {
      renderCaptionWidth(container, item, labelName);
    }
    if(!stacked)for (const f of [
      field(
        labelName + (getUi().region === 'footer' ? ' 左右移动' : ' 水平位置'),
        'x',
        'range',
        { min: canvasEnabled(getConfig())&&getUi().region==='header'?-4000:-100, max: canvasEnabled(getConfig())&&getUi().region==='header'?4000:getUi().region === 'footer' ? 100 : 200, unit: canvasEnabled(getConfig())&&getUi().region==='header'?'px':'%' },
      ),
      field(
        labelName + (getUi().region === 'footer' ? ' 上下移动' : ' 纵向位置'),
        'y',
        'range',
        {
          min: -400,
          max: getUi().region === 'footer' ? 400 : 1600,
          unit: 'px',
        },
      ),
    ])
      editorControl(
        container,
        { ...f, notice: '文字位置已更新，尚未保存' },
        item,
      );
    propertyHeading(container, '字体设计');
    const fontRow = pairedFields(container);
    if (cap)
      editorControl(
        fontRow,
        field('文案字体', 'font', 'select', {
          options: fonts,
          notice: '字体已更新，尚未保存',
        }),
        cap,
      );
    else
      renderConfigFields(fontRow, [key === 'name' ? 'nameFont' : 'timeFont']);
    const weightLabel = make('label', 'field', '字重'),
      weight = make('select');
    weight.setAttribute('aria-label', labelName + ' 字重');
    for (const [value, title] of [
      ['auto', '沿用'],
      ...Array.from({ length: 9 }, (_, i) => [
        String((i + 1) * 100),
        String((i + 1) * 100),
      ]),
    ]) {
      const option = make('option', '', title);
      option.value = value;
      weight.append(option);
    }
    weight.value = String(item.weight);
    weight.addEventListener('change', () => {
      remember();
      item.weight = weight.value === 'auto' ? 'auto' : Number(weight.value);
      apply();
    });
    weightLabel.append(weight);
    fontRow.append(weightLabel);

    if (cap) {
      editorControl(
        container,
        field('文案字号', 'size', 'range', {
          min: 8,
          max: 200,
          unit: 'px',
          notice: '字号已更新，尚未保存',
        }),
        cap,
      );
      renderCaptionMetrics(container, cap, 1.6);
      editorControl(
        container,
        field('文案颜色', 'color', 'color', { notice: '颜色已更新，尚未保存' }),
        cap,
      );
    } else
      renderConfigFields(
        container,
        key === 'name' ? ['nameSize', 'nameColor'] : ['timeSize', 'timeColor'],
      );
    propertyHeading(container, '外链字体');
    renderFontLinkFields(container, key, item, labelName);
    if (cap) {
      const actions = make('div', 'actions'),
        copy = make('button', '', '复制文案'),
        remove = make('button', '', '删除文案');
      copy.disabled = currentCaptions().length >= CAPTION_LIMIT;
      copy.addEventListener('click', () => {
        remember();
        const value = currentNewCaption({
          ...clone(cap),
          id: uniqueId(),
          name: (cap.name + ' 副本').slice(0, 80),
        });
        currentCaptions().push(value);
        getUi().object = currentCaptionKey(value.id);
        setTextItemKey(getUi().object);
        apply();
        renderFields();
      });
      remove.addEventListener('click', () => {
        invalidateEditing();
        remember();
        const list = currentCaptions(),
          index = list.indexOf(cap);
        list.splice(index, 1);
        if(getUi().region==='header'&&getConfig().headerTextStack?.captionId===cap.id)getConfig().headerTextStack.captionId='';
        getUi().object = list[Math.min(index, list.length - 1)]
          ? currentCaptionKey(list[Math.min(index, list.length - 1)].id)
          : getUi().region === 'footer'
            ? ''
            : 'caption';
        apply();
        renderFields();
      });
      actions.append(copy, remove);
      container.append(actions);
    }
  }

  return {
    selectedCaption,
    currentCaptions,
    currentCaptionKey,
    currentNewCaption,
    renderTextFields,
    renderCaptionMetrics,
  };
}
