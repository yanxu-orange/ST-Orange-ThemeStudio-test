import { isLineShape, lineThicknessTarget } from './shape-assets.mjs';
import { LAYER_LIMIT, newLayer, clone, cropRect } from './layers.mjs';
import { uniqueId } from './unique-id.mjs';
import { matchingLayers } from './workbench-ui.mjs';
import { builtinAssetGroups, ASSETS } from './catalog.mjs';
import { inspectImageBlob, dataUrlToBlob } from './image-processing.mjs';
import { MAX_IMAGE_DATA_LENGTH } from './image-sources.mjs';
import {
  regionEntries,
  imageKey,
  canMoveRegionItem,
  moveRegionItem,
} from './region-layers.mjs';

export function createLayerEditor({
  getConfig,
  getSelectedLayerId,
  make,
  propertyHeading,
  remember,
  setSelectedLayerId,
  apply,
  renderFields,
  invalidateEditing,
  getUi,
  workbench,
  notify,
  getEditEpoch,
  beginUploadFeedback,
  currentTargetValid,
  getUploadFeedback,
  feedbackStatus,
  uploadFailure,
  attachUploadFeedback,
  editorControl,
  field,
  pairedFields,
  numericRow,
  isActive,
  getCancelCrop,
  setCancelCrop,
  shadow,
  getPhotoScope,
  setTextItemKey,
  setConfig,
}) {
  function renderLayers(container) {
    const layer = getConfig().layers.find((l) => l.id === getSelectedLayerId());
    if (!layer) {
      container.append(
        make('p', 'hint', '这里还没有图片。点击“添加图片”选择来源。'),
      );
      return;
    }
    propertyHeading(container, '基本信息');
    const commands = make('div', 'actions');
    const duplicate = make('button', '', '复制素材');
    duplicate.type = 'button';
    duplicate.disabled = getConfig().layers.length >= LAYER_LIMIT;
    duplicate.addEventListener('click', () => {
      remember();
      const copy = newLayer(layer.kind, {
        ...clone(layer),
        id: uniqueId(),
        name: (layer.name + ' 副本').slice(0, 80),
        x: Math.min(600, layer.x + 15),
        y: Math.min(600, layer.y + 15),
      });
      getConfig().layers.push(copy);
      setSelectedLayerId(copy.id);
      apply();
      renderFields('decoration');
    });
    const remove = make('button', '', '移除素材');
    remove.type = 'button';
    remove.addEventListener('click', () => {
      invalidateEditing();
      remember();
      const region = getUi().region;
      getConfig().layers = getConfig().layers.filter((l) => l.id !== layer.id);
      setSelectedLayerId(matchingLayers(getConfig().layers, region)[0]?.id);
      workbench.choose(region, 'image', getSelectedLayerId() || '');
      apply();
      renderFields();
      notify('已移除素材，可撤销。');
    });
    commands.append(duplicate, remove);
    if (layer.kind === 'custom' && layer.image) {
      const crop = make('button', '', '裁剪此图片');
      crop.type = 'button';
      crop.addEventListener('click', async () => {
        invalidateEditing();
        const epoch = getEditEpoch(),
          originalConfig = getConfig(),
          report = beginUploadFeedback('crop', layer.id, [
            { name: layer.name },
          ]),
          valid = () =>
            currentTargetValid(epoch, originalConfig, layer) &&
            getUploadFeedback() === report;
        try {
          feedbackStatus(report, 0, '准备裁剪…', true);
          const output = await cropImage(
            layer.image,
            layer.image.startsWith('data:image/gif')
              ? 'image/gif'
              : 'image/png',
            valid,
          );
          if (!valid()) return;
          if (!output) {
            feedbackStatus(report, 0, '已取消裁剪，原图未改变。');
            return;
          }
          remember();
          layer.image = output;
          apply();
          feedbackStatus(report, 0, '裁剪已应用，尚未保存方案。');
          renderFields('decoration');
          notify('裁剪已应用，可撤销；保存后记住。');
        } catch (error) {
          if (valid()) feedbackStatus(report, 0, uploadFailure(error));
        }
      });
      commands.append(crop);
    }
    container.append(commands);
    attachUploadFeedback(container, 'crop:' + layer.id);
    attachUploadFeedback(container, 'result:' + layer.id);
    if (layer.kind === 'asset') {
      const replacementLabel = make('label', 'field', '替换内置素材'),
        replacement = make('select');
      replacement.setAttribute('aria-label', '替换内置素材');
      for (const group of builtinAssetGroups(layer.asset)) {
        const options = make('optgroup');
        options.label = group.name;
        for (const asset of group.assets) {
          const option = make('option', '', asset.name);
          option.value = asset.id;
          options.append(option);
        }
        replacement.append(options);
      }
      replacement.value = layer.asset;
      replacement.addEventListener('change', () => {
        remember();
        layer.asset = replacement.value;
        layer.name = ASSETS[layer.asset].name;
        apply();
        renderFields('decoration');
        notify('已换素材，位置与层级保持。');
      });
      replacementLabel.append(replacement);
      container.append(replacementLabel);
    }
    if (layer.kind === 'shape') {
      propertyHeading(container, '形状与尺寸');
      editorControl(
        container,
        field('宽度单位', 'widthUnit', 'select', {
          options: [
            ['px', '像素'],
            ['percent', '相对区域百分比'],
          ],
        }),
        layer,
        () => renderFields(),
      );
      const dimensions = pairedFields(container);
      editorControl(
        dimensions,
        field(isLineShape(layer.shape) ? '长度' : '宽度', 'width', 'range', {
          min: 1,
          max: 500,
          unit: layer.widthUnit === 'percent' ? '%' : 'px',
        }),
        layer,
      );
      editorControl(
        dimensions,
        field(isLineShape(layer.shape) ? '粗细' : '高度', 'height', 'range', { min: 1, max: isLineShape(layer.shape) ? 40 : 500, unit: 'px' }),
        isLineShape(layer.shape) ? lineThicknessTarget(layer) : layer,
      );
      editorControl(
        container,
        field('旋转', 'rotation', 'range', { min: -180, max: 180, unit: '°' }),
        layer,
      );
      propertyHeading(container, '外观');
      for (const f of [
        field('填色', 'fillMode', 'select', {
          options: [
            ['solid', '纯色'],
            ['gradient', '双色渐变'],
          ],
        }),
        field('颜色', 'color', 'color'),
        ...(layer.fillMode === 'gradient'
          ? [
              field('第二种颜色', 'color2', 'color'),
              field('渐变方向', 'gradientAngle', 'range', {
                min: 0,
                max: 360,
                unit: '°',
              }),
            ]
          : []),
        ...(layer.shape === 'rectangle'
          ? [
              field('圆角', 'cornerRadius', 'range', {
                min: 0,
                max: 250,
                unit: 'px',
              }),
            ]
          : []),
      ])
        editorControl(
          container,
          f,
          layer,
          f.key === 'fillMode' ? () => renderFields() : undefined,
        );
      editorControl(
        container,
        field('不透明度', 'opacity', 'range', { min: 0, max: 1, step: 0.05 }),
        layer,
      );
    }
    const fields = [
      field('素材名称', 'name'),
      field('显示素材', 'visible', 'select', {
        options: [
          ['true', '显示'],
          ['false', '隐藏'],
        ],
      }),
      field('应用于', 'scope', 'select', {
        options: [
          ['both', 'AI 和用户'],
          ['ai', '仅 AI'],
          ['user', '仅用户'],
        ],
      }),
      field('定位区域', 'anchor', 'select', {
        options: [
          ['header', '头像区'],
          ['avatar', '头像'],
          ['message', '整张消息卡片'],
          ['reasoning-entry', '思维入口'],
          ['reasoning-body', '思维正文'],
          ['footer', '尾部区'],
          ['input', '输入区'],
        ],
      }),
      field('从哪侧定位', 'side', 'select', {
        options: [
          ['right', '右侧'],
          ['left', '左侧'],
        ],
      }),
      field('垂直定位基准', 'vertical', 'select', {
        options: [
          ['top', '顶部'],
          ['bottom', '底部'],
        ],
      }),
      field('宽度单位', 'widthUnit', 'select', {
        options: [
          ['px', '像素'],
          ['percent', '相对区域百分比'],
        ],
      }),
      field('素材宽度', 'width', 'range', {
        min: 1,
        max: 500,
        unit: layer.widthUnit === 'percent' ? '%' : 'px',
      }),
      field('素材高度', 'heightPercent', 'range', {
        min: 1,
        max: 100,
        unit: '%',
      }),
      field('距离单位', 'offsetUnit', 'select', {
        options: [
          ['px', '像素'],
          ['percent', '相对区域百分比'],
        ],
      }),
      field('侧边偏移', 'x', 'range', {
        min: -300,
        max: 600,
        unit: layer.offsetUnit === 'percent' ? '%' : 'px',
      }),
      field('垂直偏移', 'y', 'range', {
        min: -300,
        max: 600,
        unit: layer.offsetUnit === 'percent' ? '%' : 'px',
      }),
      field('旋转角度', 'rotation', 'range', {
        min: -180,
        max: 180,
        unit: '°',
      }),
      field('不透明度', 'opacity', 'range', { min: 0, max: 1, step: 0.05 }),
      field('前后层级', 'z', 'range', { min: 0, max: 20 }),
    ];
    const order = [
      'name',
      'visible',
      'scope',
      'anchor',
      'side',
      'x',
      'vertical',
      'y',
      'offsetUnit',
      'z',
      'widthUnit',
      'width',
      'heightPercent',
      'rotation',
      'opacity',
    ];
    fields.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
    let availability;
    for (const f of fields) {
      if (
        f.key === 'z' ||
        (layer.kind === 'shape' &&
          [
            'heightPercent',
            'widthUnit',
            'width',
            'rotation',
            'opacity',
          ].includes(f.key))
      )
        continue;
      if (f.key === 'heightPercent') {
        editorControl(container, field('高度', 'mode', 'select', {
          options: [['original', '原比例'], ['custom', '自定义']],
        }), {
          get mode() { return layer.heightPercent > 0 ? 'custom' : 'original'; },
          set mode(value) { layer.heightPercent = value === 'original' ? 0 : (layer.heightPercent || 100); },
        }, () => renderFields());
        if (!(layer.heightPercent > 0)) continue;
      }
      if (f.key === 'scope' && layer.anchor === 'input') continue;
      if (f.key === 'anchor') propertyHeading(container, '位置与叠放');
      if (f.key === 'widthUnit') propertyHeading(container, '尺寸与外观');
      if (f.key === 'visible') availability = pairedFields(container);
      if (f.key === 'side') {
        f.label = '水平定位边';
        f.options = [
          ['left', '左边'],
          ['right', '右边'],
        ];
      }
      if (f.key === 'vertical') {
        f.label = '垂直定位边';
        f.options = [
          ['top', '顶部'],
          ['bottom', '底部'],
        ];
      }
      if (f.key === 'x')
        f.label = layer.side === 'left' ? '距左边距离' : '距右边距离';
      if (f.key === 'y')
        f.label = layer.vertical === 'top' ? '距顶部距离' : '距底部距离';
      const label = make('label', 'field');
      label.append(make('span', 'field-title', f.label));
      const input = make(f.type === 'select' ? 'select' : 'input');
      input.setAttribute('aria-label', f.label);
      if (f.type === 'select') {
        for (const [value, name] of f.options) {
          const option = make('option', '', name);
          option.value = value;
          input.append(option);
        }
      } else {
        input.type = f.type;
        if (f.type === 'range') {
          input.min = f.min;
          input.max = f.max;
          input.step = f.step || 1;
        } else input.maxLength = 80;
      }
      input.value = String(layer[f.key]);
      let number = null,
        tracking = false;
      const update = (value) => {
        if (
          f.type === 'range' &&
          (!Number.isFinite(value) || value < f.min || value > f.max)
        )
          return false;
        if (!tracking) {
          remember();
          tracking = true;
        }
        layer[f.key] = value;
        if (layer.anchor === 'input') layer.scope = 'both';
        if (number) number.value = value;
        input.value = String(value);
        apply();
        notify('素材已更新，尚未保存');
        return true;
      };
      input.addEventListener('input', () =>
        update(
          f.type === 'range' || f.numeric
            ? Number(input.value)
            : f.key === 'visible'
              ? input.value === 'true'
              : input.value,
        ),
      );
      input.addEventListener('change', () => {
        tracking = false;
        if (
          ['widthUnit', 'offsetUnit', 'anchor', 'side', 'vertical'].includes(
            f.key,
          )
        )
          renderFields('decoration');
      });
      if (f.type !== 'range') label.append(input);
      if (f.type === 'range') {
        number = make('input', 'number-input');
        number.type = 'number';
        number.min = f.min;
        number.max = f.max;
        number.step = f.step || 1;
        number.value = layer[f.key];
        number.setAttribute('aria-label', f.label + ' 数值');
        number.addEventListener('input', () => {
          if (number.value === '') return;
          const ok = update(Number(number.value));
          number.setAttribute('aria-invalid', String(!ok));
        });
        number.addEventListener('change', () => {
          tracking = false;
        });
        numericRow(
          label,
          input,
          number,
          f.unit || '',
          ['x', 'y'].includes(f.key),
        );
      }
      (['visible', 'scope'].includes(f.key) ? availability : container).append(
        label,
      );
    }
  }
  async function cropImage(source, mime, valid = () => isActive()) {
    let animated = mime === 'image/gif';
    if (source.startsWith('data:')) {
      animated = (await inspectImageBlob(dataUrlToBlob(source))).animated;
    }
    if (animated) {
      notify('动画素材保持原样，暂不支持动画裁剪。');
      return null;
    }
    const image = new Image();
    image.src = source;
    await image.decode();
    if (!valid()) return null;
    if (image.naturalWidth * image.naturalHeight > 40000000)
      throw Error('图片像素过大');
    return new Promise((resolve) => {
      const dialog = make('dialog', 'crop-dialog');
      const canvas = make('canvas');
      let zoom = 1,
        panX = 50,
        panY = 50,
        ratio = image.naturalWidth / image.naturalHeight,
        done = false;
      dialog.append(
        make('h3', '', '裁剪这张素材'),
        make(
          'p',
          'hint',
          '选择比例，再移动取景。也可以保持原图，保留完整透明边缘。',
        ),
        canvas,
      );
      const ratioLabel = make('label', 'field', '裁剪比例');
      const ratioSelect = make('select');
      ratioSelect.setAttribute('aria-label', '裁剪比例');
      for (const [value, name] of [
        ['original', '原比例'],
        ['1', '方形 1:1'],
        ['0.75', '竖幅 3:4'],
        ['1.3333333333333333', '横幅 4:3'],
        ['1.7777777777777777', '横幅 16:9'],
      ]) {
        const option = make('option', '', name);
        option.value = value;
        ratioSelect.append(option);
      }
      ratioLabel.append(ratioSelect);
      dialog.append(ratioLabel);
      const draw = () => {
        const rect = cropRect(
          image.naturalWidth,
          image.naturalHeight,
          ratio,
          zoom,
          panX,
          panY,
        );
        const scale = Math.min(1, 1200 / Math.max(rect.width, rect.height));
        canvas.width = Math.max(1, Math.round(rect.width * scale));
        canvas.height = Math.max(1, Math.round(rect.height * scale));
        canvas.style.width = '100%';
        canvas.style.aspectRatio = String(ratio);
        canvas
          .getContext('2d')
          .drawImage(
            image,
            rect.x,
            rect.y,
            rect.width,
            rect.height,
            0,
            0,
            canvas.width,
            canvas.height,
          );
      };
      ratioSelect.addEventListener('change', () => {
        ratio =
          ratioSelect.value === 'original'
            ? image.naturalWidth / image.naturalHeight
            : Number(ratioSelect.value);
        draw();
      });
      for (const [key, name, min, max, step, initial] of [
        ['zoom', '放大取景', 1, 4, 0.05, 1],
        ['panX', '横向取景', 0, 100, 1, 50],
        ['panY', '纵向取景', 0, 100, 1, 50],
      ]) {
        const label = make('label', 'field', name),
          input = make('input'),
          number = make('input', 'number-input');
        input.type = 'range';
        number.type = 'number';
        for (const node of [input, number]) {
          node.min = min;
          node.max = max;
          node.step = step;
          node.value = initial;
        }
        input.setAttribute('aria-label', name);
        number.setAttribute('aria-label', name + ' 数值');
        const update = (value) => {
          if (!Number.isFinite(value) || value < min || value > max)
            return false;
          input.value = number.value = value;
          if (key === 'zoom') zoom = value;
          else if (key === 'panX') panX = value;
          else panY = value;
          draw();
          return true;
        };
        input.addEventListener('input', () => update(Number(input.value)));
        number.addEventListener('input', () => {
          if (number.value === '') return;
          number.setAttribute(
            'aria-invalid',
            String(!update(Number(number.value))),
          );
        });
        numericRow(label, input, number, key === 'zoom' ? '×' : '%');
        dialog.append(label);
      }
      if (mime === 'image/gif')
        dialog.append(
          make('p', 'hint', '裁剪 GIF 后会成为静态图片；保持原图可保留动画。'),
        );
      const cancel = () => finish(null);
      const finish = (value) => {
        if (done) return;
        done = true;
        if (getCancelCrop() === cancel) setCancelCrop(null);
        dialog.close();
        dialog.remove();
        resolve(valid() ? value : null);
      };
      setCancelCrop(cancel);
      const actions = make('div', 'actions');
      for (const [name, action] of [
        ['取消', () => finish(null)],
        ['保持原图', () => finish(source)],
        [
          '使用裁剪图',
          () => {
            const output = canvas.toDataURL('image/png');
            if (output.length > MAX_IMAGE_DATA_LENGTH) {
              notice.textContent = '裁剪图片过大，请缩小取景或保持原图。';
              return;
            }
            finish(output);
          },
        ],
      ]) {
        const button = make(
          'button',
          name === '使用裁剪图' ? 'primary' : '',
          name,
        );
        button.type = 'button';
        button.addEventListener('click', action);
        actions.append(button);
      }
      const notice = make('p', 'hint');
      dialog.append(actions, notice);
      dialog.addEventListener('cancel', (event) => {
        event.preventDefault();
        finish(null);
      });
      shadow.append(dialog);
      draw();
      dialog.showModal();
    });
  }

  function renderRegionLayers(container) {
    const region = getUi().region,
      allowed = ['header', 'overall', 'reasoning', 'footer', 'input'];
    if (!allowed.includes(region)) {
      container.append(make('p', 'hint', '此区域没有可排序的素材。'));
      return;
    }
    const entries = regionEntries(getConfig(), region).reverse();
    if (!entries.length) {
      container.append(make('p', 'hint', '此区域还没有素材。'));
      return;
    }
    const selectedKey =
      getUi().kind === 'image'
        ? imageKey(getUi().object)
        : getUi().kind === 'avatar'
          ? 'avatar'
          : getUi().object;
    const list = make('div', 'region-layer-list');
    for (const entry of entries) {
      const row = make(
        'div',
        'region-layer-row' + (entry.key === selectedKey ? ' selected' : ''),
      );
      row.dataset.layerKey = entry.key;
      const choose = make(
        'button',
        'layer-select',
        entry.label + (entry.visible ? '' : ' · 已隐藏'),
      );
      choose.type = 'button';
      choose.setAttribute('aria-pressed', String(entry.key === selectedKey));
      choose.addEventListener('click', () => {
        getUi().kind = entry.kind;
        getUi().object =
          entry.kind === 'avatar' ? 'photo-' + getPhotoScope() : entry.id;
        if (entry.kind === 'image') setSelectedLayerId(entry.id);
        else if (entry.kind === 'text') setTextItemKey(entry.id);
        renderFields();
      });
      row.append(choose);
      if (entry.key === selectedKey) {
        const actions = make('div', 'actions');
        for (const [direction, label] of [
          ['top', '置顶'],
          ['up', '上移'],
          ['down', '下移'],
          ['bottom', '置底'],
        ]) {
          const button = make('button', '', label);
          button.type = 'button';
          button.disabled = !canMoveRegionItem(
            getConfig(),
            region,
            entry.key,
            direction,
          );
          button.addEventListener('click', () => {
            remember();
            setConfig(
              moveRegionItem(getConfig(), region, entry.key, direction),
            );
            apply();
            renderFields();
          });
          actions.append(button);
        }
        const edit = make('button', '', '编辑');
        edit.type = 'button';
        edit.addEventListener('click', () => {
          getUi().mobileView = 'adjust';
          renderFields();
        });
        actions.append(edit);
        row.append(actions);
      }
      list.append(row);
    }
    container.append(list);
  }

  return { renderLayers, renderRegionLayers, cropImage };
}
