import { ICONS } from './icon-catalog.mjs';
import { ASSETS } from './catalog.mjs';
export function createChromeEditor({
  getConfig,
  getUi,
  propertyHeading,
  editorControl,
  field,
  renderFields,
  make,
  fonts,
  renderFontLinkFields,
  remember,
  apply,
  notify,
  renderMaterialControl,
  renderIconAppearance,
}) {
  function renderChromeFields(container) {
    const config = getConfig(),
      ui = getUi();
    const zone = ui.region,
      v = config.chromeStyle[zone],
      isInput = zone === 'input';
    const controls = (target, fields) => {
      for (const [label, key, type, opts = {}] of fields)
        editorControl(
          container,
          field(label, key, type, {
            ...opts,
            notice: '页面美化已更新，尚未保存',
          }),
          target,
          key === 'fontMode' ? () => renderFields() : undefined,
        );
    };
    const range = (label, key, min, max, unit = 'px', step = 1) => [
      label,
      key,
      'range',
      { min, max, unit, step },
    ];
    if (ui.kind === 'surface') {
      if (isInput) {
        propertyHeading(container, '布局');
        controls(v, [
          [
            '输入区排版',
            'layout',
            'select',
            {
              options: [
                ['inline', '输入框与按钮同排'],
                ['stacked', '输入框在上，按钮在下'],
              ],
            },
          ],
          range('输入区宽度', 'width', 50, 100, '%'),
          range('左侧留白', 'leftGap', 0, 80),
          range('右侧留白', 'rightGap', 0, 80),
          range('左右内距', 'padX', 0, 32),
          range('上下内距', 'padY', 0, 32),
        ]);
      }
      propertyHeading(container, '背景');
      controls(v, [
        ['区域底色', 'color', 'color'],
        range('背景不透明度', 'alpha', 0, 1, '', 0.05),
        range('背景模糊', 'blur', 0, 24),
      ]);
      propertyHeading(container, '边框与圆角');
      controls(v, [
        [
          '显示边框',
          'borderEnabled',
          'select',
          {
            options: [
              ['true', '显示'],
              ['false', '隐藏'],
            ],
          },
        ],
        ['区域边框颜色', 'borderColor', 'color'],
        range('区域边框粗细', 'borderWidth', 0, 6, 'px', 0.25),
        range('区域圆角', 'radius', 0, 40),
      ]);
      if (!isInput) {
        propertyHeading(container, '图标与按钮尺寸');
        controls(v, [
          range('顶栏图标大小', 'iconSize', 12, 40),
          range('顶栏按钮大小', 'slot', 28, 64),
          range('顶栏按钮间距', 'gap', 0, 16),
          range('顶栏上下内距', 'padY', 0, 16),
        ]);
      }
    } else if (ui.kind === 'text') {
      propertyHeading(container, '字体设计');
      controls(v, [
        [
          '输入字体来源',
          'fontMode',
          'select',
          {
            options: [
              ['interface', '跟随界面字体'],
              ['chat', '跟随聊天正文'],
              ['custom', '自定义字体'],
            ],
          },
        ],
      ]);
      if (v.fontMode === 'custom')
        controls(v, [['输入字体', 'font', 'select', { options: fonts }]]);
      controls(v, [
        range('输入字号', 'size', 8, 60),
        range('输入字重', 'weight', 100, 900, '', 100),
        ['输入文字颜色', 'textColor', 'color'],
        range('输入行高', 'lineHeight', 1, 3, '', 0.1),
      ]);
      propertyHeading(container, '自动增高范围');
      controls(v, [
        range('输入最小高度', 'minHeight', 32, 160),
        range('输入最大高度', 'maxHeight', 80, 600),
      ]);
      container.append(
        make(
          'p',
          'hint',
          '最大高度需不小于最小高度，且不超过当前可视区域高度的60%。',
        ),
      );
      if (v.fontMode === 'custom') {
        propertyHeading(container, '外链字体');
        renderFontLinkFields(container, 'chrome-input', v, '输入文字');
      }
      propertyHeading(container, '输入框背景');
      editorControl(
        container,
        field('启用输入框背景', 'enabled', 'select', {
          options: [
            ['false', '关闭'],
            ['true', '启用'],
          ],
        }),
        v.textSurface,
      );
      controls(v.textSurface, [
        ['输入框背景', 'color', 'color'],
        range('背景不透明度', 'alpha', 0, 1, '', 0.05),
        range('输入框圆角', 'radius', 0, 40),
      ]);
    } else if (ui.kind === 'placeholder') {
      const empty = v.emptyText;
      propertyHeading(container, '输入框自定义文案');
      editorControl(
        container,
        field('启用输入框自定义文案', 'enabled', 'select', {
          options: [
            ['false', '关闭'],
            ['true', '启用'],
          ],
        }),
        empty,
      );
      for (const [key, title] of [
        ['idle', '默认状态'],
        ['generating', '生成状态'],
      ]) {
        const row = make('label', 'field', title),
          input = make('textarea');
        input.rows = 2;
        input.maxLength = 300;
        input.value = empty[key];
        input.setAttribute('aria-label', title);
        let tracking = false;
        input.addEventListener('input', () => {
          if (!tracking) {
            remember();
            tracking = true;
          }
          empty[key] = input.value;
          empty.enabled = !!(empty.idle.trim() || empty.generating.trim());
          apply();
          notify('输入框自定义文案已更新，尚未保存');
        });
        for (const event of ['change', 'blur'])
          input.addEventListener(event, () => {
            tracking = false;
          });
        row.append(input);
        container.append(row);
      }
      container.append(
        make(
          'p',
          'hint',
          '生成状态留空时沿用默认状态；断开连接时保留酒馆提示，已有草稿时不覆盖输入内容。',
        ),
      );
      container.append(
        make(
          'p',
          'hint',
          '文案超出输入区可见范围会裁切，可在输入框背景与高度中调整最小高度。',
        ),
      );
      propertyHeading(container, '文案外观');
      controls(empty, [
        ['输入框自定义文案颜色', 'color', 'color'],
        range('输入框自定义文案字号', 'size', 8, 60),
      ]);
    } else if (['tools', 'icons'].includes(ui.kind)) {
      if (isInput) {
        propertyHeading(container, '工具共用尺寸');
        controls(v, [
          range('输入图标大小', 'iconSize', 12, 40),
          range('输入区按钮大小', 'slot', 28, 64),
          range('输入工具间距', 'gap', 0, 24),
        ]);
      }
      propertyHeading(container, '当前按钮图标');
      const item = v.icons[ui.object];
      renderMaterialControl(container, item, {
        label: '按钮图标',
        purpose: 'chrome:' + zone + ':' + ui.object,
        id: 'chrome-icon-pick',
      });
      if (['image', 'icon'].includes(item.mode))
        container.append(
          make(
            'p',
            'hint',
            item.icon
              ? ICONS[item.icon]?.name || '图标'
              : item.image
                ? '已选择上传图片'
                : item.asset
                  ? ASSETS[item.asset].name
                  : '尚未选择素材',
          ),
        );
      if (item.mode === 'icon') renderIconAppearance(container, item);
    }
  }

  return { renderChromeFields };
}
