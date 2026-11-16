import {pageTitleFontKey} from './page-title-style.mjs';
import {newPageTitleDecoration} from './page-title-decoration.mjs';
import { newPageHeaderNative } from './page-header-native.mjs';
import { TIME_FONTS } from './text-layout.mjs';
import { LAYER_LIMIT, clone } from './layers.mjs';
import {
  newPageHeaderImage,
  newPageHeaderText,
  pageHeaderSceneFontKey,
} from './page-header-scene.mjs';
import { uniqueId } from './unique-id.mjs';
import { SHAPE_NAMES } from './shape-assets.mjs';
import {
  PAGE_TITLE_SUBTITLE_TARGETS,
  newPageTitleSubtitle,
  pageTitleSubtitleFontKey,
} from './page-title-subtitle.mjs';
import { PAGE_HEADER_PAGES } from './page-headers.mjs';
import { assetUrl } from './catalog.mjs';

export function createPageHeaderEditor({
  getConfig,
  getUi,
  editorControl: renderControl,
  field,
  make,
  remember,
  apply: applyPreview,
  renderFields,
  renderFontLinkFields,
  openMaterialPicker,
  invalidateEditing,
  renderCaptionMetrics,
  propertyHeading,
  notify,
  pairedFields,
}) {
  const editorControl = renderControl, apply = applyPreview;
  function renderPageNativeFields(container) {
    const head = getConfig().pageHeaders.home,
      native = head.native,
      key = getUi().object;
    const item = native[key] || newPageHeaderNative(key);
    const commit = () => {
      native[key] = item; head.enabled = true; head.placement = 'native';
      const placement = container.querySelector('[aria-label="首页内容放置"]');
      if (placement) placement.value = 'native';
    };
    const apply = () => { commit(); applyPreview(); };
    const editorControl = (container, f, target, onUpdate) => renderControl(container, {
      ...f,
      beforeApply: () => { f.beforeApply?.(); commit(); },
      beforePreview: () => {
        const previous = native[key], placement = head.placement;
        const rollback = f.beforePreview?.();
        native[key] = item;
        head.placement = 'native';
        return () => { native[key] = previous; head.placement = placement; rollback?.(); };
      },
    }, target, onUpdate);
    renderControl(
      container,
      field('首页内容放置', 'placement', 'select', {
        options: [
          ['banner', '独立头图'],
          ['native', '与首页文字、按钮叠放'],
        ],
      }),
      head,
    );
    const logo = make('label', 'field', '酒馆标志'),
      select = make('select');
    select.setAttribute('aria-label', '酒馆标志');
    for (const [v, t] of [
      ['false', '保留'],
      ['true', '隐藏'],
    ]) {
      const o = make('option', '', t);
      o.value = v;
      select.append(o);
    }
    select.value = String(native.hideLogo);
    select.addEventListener('change', () => {
      remember();
      native.hideLogo = select.value === 'true';
      head.enabled = true;
      applyPreview();
    });
    logo.append(select);
    container.append(logo);
    for (const f of [
      field('横向位置', 'x', 'range', { min: -100, max: 200, unit: '%' }),
      field('纵向位置', 'y', 'range', { min: -400, max: 1600, unit: 'px' }),
      field(key === 'version' ? '版本字号' : '图标大小', 'size', 'range', { min: 8, max: 200 }),
      field(key === 'version' ? '版本颜色' : '图标颜色', 'color', 'color'),
    ])
      editorControl(container, f, item);
    if (key === 'version') {
      editorControl(
        container,
        field('版本字体', 'font', 'select', {
          options: TIME_FONTS.map((font) => [font, font]),
        }),
        item,
      );
      const weight = new Proxy(item, {
        set(target, key, value) {
          target[key] = value === 'auto' ? value : Number(value);
          return true;
        },
      });
      editorControl(
        container,
        field('版本字重', 'weight', 'select', {
          options: [
            ['auto', '沿用字体'],
            ...Array.from({ length: 9 }, (_, i) => [
              String((i + 1) * 100),
              String((i + 1) * 100),
            ]),
          ],
        }),
        weight,
      );
      renderFontLinkFields(
        container,
        'page-header-home-native-version',
        item,
        '版本文字',
        commit,
      );
      const b = make(
        'button',
        '',
        item.width === 'auto' ? '自定义版本文字宽度' : '恢复自动宽度',
      );
      b.type = 'button';
      b.addEventListener('click', () => {
        remember();
        item.width = item.width === 'auto' ? 80 : 'auto';
        apply();
        renderFields();
      });
      container.append(b);
      if (item.width !== 'auto')
        editorControl(
          container,
          field('版本宽度', 'width', 'range', { min: 10, max: 100, unit: '%' }),
          item,
        );
      const initialMode = (label, value, change) => {
        const row = make('label', 'field', label),
          select = make('select');
        select.setAttribute('aria-label', label);
        for (const [id, text] of [
          ['inherit', '沿用整段'],
          ['custom', '单独设置'],
        ]) {
          const option = make('option', '', text);
          option.value = id;
          select.append(option);
        }
        select.value = value;
        select.addEventListener('change', () => {
          remember();
          change(select.value === 'custom');
          apply();
          renderFields();
        });
        row.append(select);
        container.append(row);
      };
      initialMode(
        '首字母样式',
        item.firstLetter ? 'custom' : 'inherit',
        (custom) => {
          item.firstLetter = custom ? { size: null, color: null } : null;
        },
      );
      if (item.firstLetter) {
        const initial = item.firstLetter;
        initialMode(
          '首字母字号来源',
          initial.size === null ? 'inherit' : 'custom',
          (custom) => {
            initial.size = custom ? item.size : null;
          },
        );
        if (initial.size !== null)
          editorControl(
            container,
            field('首字母字号', 'size', 'range', {
              min: 8,
              max: 200,
              unit: 'px',
            }),
            initial,
          );
        initialMode(
          '首字母颜色来源',
          initial.color === null ? 'inherit' : 'custom',
          (custom) => {
            initial.color = custom ? item.color : null;
          },
        );
        if (initial.color !== null)
          editorControl(
            container,
            field('首字母颜色', 'color', 'color'),
            initial,
          );
      }
    } else
      editorControl(
        container,
        field('按钮宽度', 'width', 'range', { min: 16, max: 200, unit: 'px' }),
        item,
      );
  }
  function pageSceneEntries() {
    const scene = getConfig().pageHeaders[getUi().page].scene;
    return scene.order
      .map((key) => {
        const [type, id] = key.split(':');
        return {
          key,
          type,
          item: (type === 'image' ? scene.images : scene.texts).find(
            (item) => item.id === id,
          ),
        };
      })
      .filter((entry) => entry.item);
  }
  function addPageSceneImage() {
    const page = getUi().page;
    openMaterialPicker('page-scene', 'images', page, (source) => {
      const head = getConfig().pageHeaders[page],
        scene = head.scene;
      if (scene.images.length >= LAYER_LIMIT) return;
      const item = newPageHeaderImage(
        source.shape ? 'shape' : source.asset ? 'asset' : 'custom',
        {
          name: source.name,
          asset: source.asset || '',
          image: source.image || '',
          ...(source.shape ? { shape: source.shape } : {}),
          side: 'left',
          x: 0,
          y: 0,
        },
      );
      scene.images.push(item);
      scene.order.push('image:' + item.id);
      head.enabled = true;
      getUi().kind = 'scene-images';
      getUi().object = item.id;
    });
  }
  function renderPageSceneOrder(container) {
    const entries = pageSceneEntries(),
      scene = getConfig().pageHeaders[getUi().page].scene;
    if (!entries.length) {
      container.append(make('p', 'hint', '此页面头部还没有图层。'));
      return;
    }
    const list = make('div', 'region-layer-list');
    for (const { key, type, item } of entries.reverse()) {
      const row = make('div', 'region-layer-row');
      row.dataset.pageHeaderLayerKey = key;
      const choose = make(
        'button',
        'layer-select',
        item.name + (item.visible ? '' : ' · 已隐藏'),
      );
      choose.type = 'button';
      choose.addEventListener('click', () => {
        getUi().kind = type === 'image' ? 'scene-images' : 'scene-texts';
        getUi().object = item.id;
        renderFields();
      });
      row.append(choose);
      if (getUi().object === item.id) {
        const actions = make('div', 'actions');
        for (const [direction, label] of [
          ['top', '置顶'],
          ['up', '上移'],
          ['down', '下移'],
          ['bottom', '置底'],
        ]) {
          const b = make('button', '', label),
            i = scene.order.indexOf(key),
            n =
              direction === 'top'
                ? scene.order.length - 1
                : direction === 'bottom'
                  ? 0
                  : Math.max(
                      0,
                      Math.min(
                        scene.order.length - 1,
                        i + (direction === 'up' ? 1 : -1),
                      ),
                    );
          b.type = 'button';
          b.disabled = n === i;
          b.addEventListener('click', () => {
            remember();
            scene.order.splice(i, 1);
            scene.order.splice(n, 0, key);
            apply();
            renderFields();
          });
          actions.append(b);
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
  function renderPageSceneFields(container) {
    const head = getConfig().pageHeaders[getUi().page],
      scene = head.scene,
      image = getUi().kind === 'scene-images',
      list = image ? scene.images : scene.texts,
      type = image ? 'image' : 'text',
      item = list.find((item) => item.id === getUi().object);
    const add = make('button', '', image ? '＋ 添加图片或形状' : '＋ 添加文字');
    add.type = 'button';
    add.id = image ? 'add-header-image' : 'add-header-text';
    add.disabled = list.length >= 20;
    add.addEventListener('click', () => {
      if (image) return addPageSceneImage();
      remember();
      const text = newPageHeaderText({ name: '文字' + (list.length + 1) });
      list.push(text);
      scene.order.push('text:' + text.id);
      head.enabled = true;
      getUi().object = text.id;
      apply();
      renderFields();
    });
    container.append(add);
    if (!item) return;
    const commands = make('div', 'actions');
    for (const [action, label] of [
      ['copy', '复制图层'],
      ['remove', '删除图层'],
    ]) {
      const b = make('button', '', label);
      b.type = 'button';
      b.dataset.headerLayerAction = action;
      b.disabled = action === 'copy' && list.length >= 20;
      b.addEventListener('click', () => {
        invalidateEditing();
        remember();
        if (action === 'copy') {
          const copy = {
            ...clone(item),
            id: uniqueId(),
            name: (item.name + ' 副本').slice(0, 80),
          };
          list.push(copy);
          scene.order.push(type + ':' + copy.id);
          getUi().object = copy.id;
        } else {
          list.splice(list.indexOf(item), 1);
          scene.order = scene.order.filter(
            (key) => key !== type + ':' + item.id,
          );
          getUi().object = list[0]?.id || '';
        }
        apply();
        renderFields();
      });
      commands.append(b);
    }
    container.append(commands);
    editorControl(container, field('图层名称', 'name'), item);
    editorControl(
      container,
      field('显示图层', 'visible', 'select', {
        options: [
          ['true', '显示'],
          ['false', '隐藏'],
        ],
      }),
      item,
    );
    if (image) {
      const replace = make('button', '', '更换素材');
      replace.type = 'button';
      replace.addEventListener('click', () => {
        const page = getUi().page;
        openMaterialPicker('page-scene', 'images', page, (source) => {
          const next = newPageHeaderImage(
            source.shape ? 'shape' : source.asset ? 'asset' : 'custom',
            {
              ...Object.fromEntries(
                Object.keys(newPageHeaderImage())
                  .filter((key) => Object.hasOwn(item, key))
                  .map((key) => [key, item[key]]),
              ),
              heightPercent: 0,
              kind: source.shape ? 'shape' : source.asset ? 'asset' : 'custom',
              asset: source.asset || '',
              image: source.image || '',
              ...(source.shape ? { shape: source.shape } : {}),
            },
          );
          Object.keys(item).forEach((k) => delete item[k]);
          Object.assign(item, next);
        });
      });
      container.append(replace);
      for (const f of [
        field('从哪侧定位', 'side', 'select', {
          options: [
            ['left', '左侧'],
            ['right', '右侧'],
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
        field('素材宽度', 'width', 'range', { min: 1, max: 500 }),
        field('距离单位', 'offsetUnit', 'select', {
          options: [
            ['px', '像素'],
            ['percent', '相对区域百分比'],
          ],
        }),
        field(item.side === 'right' ? '距右边距离' : '距左边距离', 'x', 'range', { min: -300, max: 600 }),
        field(item.vertical === 'bottom' ? '距底部距离' : '距顶部距离', 'y', 'range', { min: -300, max: 600 }),
        field('旋转角度', 'rotation', 'range', { min: -180, max: 180 }),
        field('不透明度', 'opacity', 'range', { min: 0, max: 1, step: 0.05 }),
      ])
        editorControl(container, f, item, ['side', 'vertical'].includes(f.key) ? renderFields : undefined);
      if (item.kind === 'shape') {
        for (const f of [
          field('形状', 'shape', 'select', {
            options: Object.entries(SHAPE_NAMES),
          }),
          field('高度单位', 'heightUnit', 'select', {
            options: [
              ['px', '像素'],
              ['percent', '相对区域百分比'],
            ],
          }),
          field('形状高度', 'height', 'range', {
            min: 1,
            max: 500,
            unit: item.heightUnit === 'percent' ? '%' : 'px',
          }),
          field('填色', 'fillMode', 'select', {
            options: [
              ['solid', '纯色'],
              ['gradient', '双色渐变'],
            ],
          }),
          field('颜色', 'color', 'color'),
          ...(item.fillMode === 'gradient'
            ? [
                field('第二种颜色', 'color2', 'color'),
                field('渐变方向', 'gradientAngle', 'range', {
                  min: 0,
                  max: 360,
                }),
              ]
            : []),
          ...(item.shape === 'rectangle'
            ? [field('圆角', 'cornerRadius', 'range', { min: 0, max: 250 })]
            : []),
        ])
          editorControl(
            container,
            f,
            item,
            ['shape', 'fillMode', 'heightUnit'].includes(f.key)
              ? () => renderFields()
              : undefined,
          );
      } else {
        editorControl(container, field('高度', 'mode', 'select', {
          options: [['original', '原比例'], ['custom', '自定义']],
        }), {
          get mode() { return item.heightPercent > 0 ? 'custom' : 'original'; },
          set mode(value) { item.heightPercent = value === 'original' ? 0 : (item.heightPercent || 100); },
        }, () => renderFields());
        if (item.heightPercent > 0) editorControl(
          container,
          field('素材高度', 'heightPercent', 'range', { min: 1, max: 100, unit: '%' }),
          item,
        );
      }
    } else {
      const row = make('label', 'field', '文字内容'),
        text = make('textarea');
      text.rows = 2;
      text.maxLength = 300;
      text.value = item.content;
      text.setAttribute('aria-label', '文字内容');
      let tracking = false;
      text.addEventListener('input', () => {
        if (!tracking) {
          remember();
          tracking = true;
        }
        item.content = text.value;
        apply();
      });
      text.addEventListener('change', () => {
        tracking = false;
      });
      row.append(text);
      container.append(row);
      for (const f of [
        field('文字字号', 'size', 'range', { min: 8, max: 200 }),
        field('文字颜色', 'color', 'color'),
        field('文字对齐', 'align', 'select', {
          options: [
            ['left', '左对齐'],
            ['center', '居中'],
            ['right', '右对齐'],
          ],
        }),
        field('文字字体', 'font', 'select', {
          options: TIME_FONTS.map((font) => [font, font]),
        }),
        field('文字字重', 'weight', 'select', {
          options: [
            ['auto', '沿用字体'],
            ...Array.from({ length: 9 }, (_, i) => [
              String((i + 1) * 100),
              String((i + 1) * 100),
            ]),
          ],
        }),
        field('横向位置', 'x', 'range', { min: -100, max: 200, unit: '%' }),
        field('纵向位置', 'y', 'range', { min: -400, max: 1600, unit: 'px' }),
      ]) {
        if (f.key === 'weight') {
          const proxy = new Proxy(item, {
            set(target, key, value) {
              target[key] = value === 'auto' ? value : Number(value);
              return true;
            },
          });
          editorControl(container, f, proxy);
        } else editorControl(container, f, item);
        if (f.key === 'size') renderCaptionMetrics(container, item, 1.35);
      }
      renderFontLinkFields(
        container,
        pageHeaderSceneFontKey(getUi().page, item.id),
        item,
        '头部文字',
      );
      const width = make('label', 'field', '文字宽度'),
        select = make('select');
      select.setAttribute('aria-label', '文字宽度模式');
      for (const [v, t] of [
        ['auto', '自动'],
        ['custom', '指定宽度'],
      ]) {
        const o = make('option', '', t);
        o.value = v;
        select.append(o);
      }
      select.value = item.width === 'auto' ? 'auto' : 'custom';
      select.addEventListener('change', () => {
        remember();
        item.width = select.value === 'auto' ? 'auto' : 50;
        apply();
        renderFields();
      });
      width.append(select);
      container.append(width);
      if (item.width !== 'auto')
        editorControl(
          container,
          field('文字宽度', 'width', 'range', { min: 10, max: 100, unit: '%' }),
          item,
        );
    }
  }
  const pageSubtitleTargets = new Map();
  function renderPageSubtitleFields(container, page, head) {
    const targets = PAGE_TITLE_SUBTITLE_TARGETS[page],
      subtitle = head.titleSubtitle || newPageTitleSubtitle(page),
      commit = () => {
        head.titleSubtitle = subtitle;
      };
    editorControl(
      container,
      field('页面头部排版', 'layout', 'select', {
        options: [
          ['native', '酒馆原有排版'],
          ['standard', '工坊标题排版'],
        ],
      }),
      head,
    );
    container.append(
      make(
        'p',
        'hint',
        '只在工坊标题排版且酒馆原标题保留时显示；有头图或自定义标题替代酒馆原标题时不显示。清空文案即可关闭对应文字。',
      ),
    );
    const keys = Object.keys(targets);
    let target = pageSubtitleTargets.get(page);
    if (!keys.includes(target)) target = keys[0];
    if (keys.length > 1) {
      const row = make('label', 'field', '酒馆原标题'),
        select = make('select');
      select.setAttribute('aria-label', '酒馆原标题');
      for (const [key, label] of Object.entries(targets)) {
        const option = make('option', '', label);
        option.value = key;
        select.append(option);
      }
      select.value = target;
      select.addEventListener('change', () => {
        pageSubtitleTargets.set(page, select.value);
        renderFields();
      });
      row.append(select);
      container.append(row);
    }
    const control = (f, value = subtitle.style) =>
      editorControl(
        container,
        {
          ...f,
          beforeApply: commit,
          beforePreview: () => {
            const previous = head.titleSubtitle;
            commit();
            return () => {
              head.titleSubtitle = previous;
            };
          },
        },
        value,
      );
    control(
      field('标题下方文字', target, 'text', { maxLength: 160 }),
      new Proxy(subtitle.texts, { get: (value, key) => value[key] ?? '' }),
    );
    propertyHeading(container, '标题下方文字外观');
    container.append(make('p', 'hint', '本页各个酒馆原标题的下方文字共用这组外观。'));
    for (const f of [
      field('标题下方文字字体', 'font', 'select', {
        options: TIME_FONTS.map((font) => [font, font]),
      }),
      field('标题下方文字字号', 'size', 'range', { min: 8, max: 60, unit: 'px' }),
      field('标题下方文字颜色', 'color', 'color'),
      field('标题下方文字行高', 'lineHeight', 'range', {
        min: 1,
        max: 3,
        step: 0.05,
        unit: '倍',
      }),
      field('标题下方文字字距', 'letterSpacing', 'range', {
        min: -2,
        max: 10,
        step: 0.1,
        unit: 'px',
      }),
    ])
      control(f);
    control(
      field('标题下方文字字重', 'weight', 'select', {
        options: [
          ['auto', '沿用字体'],
          ...Array.from({ length: 9 }, (_, i) => [
            String((i + 1) * 100),
            String((i + 1) * 100),
          ]),
        ],
      }),
      new Proxy(subtitle.style, {
        set(value, key, next) {
          value[key] = next === 'auto' ? next : Number(next);
          return true;
        },
      }),
    );
    renderFontLinkFields(
      container,
      pageTitleSubtitleFontKey(page),
      subtitle.style,
      '标题下方文字',
      commit,
    );
  }
  function renderPageDecorationFields(container, page, head) {
    editorControl(container, field('页面头部排版', 'layout', 'select', {
      options: [['native', '酒馆原有排版'], ['standard', '工坊标题排版']],
    }), head);
    container.append(make('p', 'hint', '装饰绑定本页酒馆原标题；头图隐藏标题时，装饰一并隐藏。'));
    const decoration = head.titleDecoration || newPageTitleDecoration();
    const state = { enabled: !!head.titleDecoration };
    editorControl(container, field('显示标题装饰', 'enabled', 'select', {
      options: [['false', '关闭'], ['true', '开启']],
      beforeApply: () => { head.titleDecoration = state.enabled ? decoration : null; },
      beforePreview: () => { const previous = head.titleDecoration; head.titleDecoration = state.enabled ? decoration : null; return () => { head.titleDecoration = previous; }; },
    }), state, renderFields);
    if (!head.titleDecoration) return;
    for (const f of [
      field('装饰形状', 'shape', 'select', { options: [['square', '方块'], ['dot', '圆点'], ['line', '线条']] }),
      field('装饰颜色', 'color', 'color'),
      field('装饰大小', 'size', 'range', { min: 2, max: 40, unit: 'px' }),
      field('装饰水平位置', 'x', 'range', { min: -80, max: 80, unit: 'px' }),
      field('装饰纵向位置', 'y', 'range', { min: -80, max: 80, unit: 'px' }),
    ]) editorControl(container, f, decoration);
  }
  function renderPageHeaderFields(container) {
    if (getUi().page === 'home' && getUi().kind === 'native-home')
      return renderPageNativeFields(container);
    if (getUi().mobileView === 'layers') return renderPageSceneOrder(container);
    if (['scene-images', 'scene-texts'].includes(getUi().kind))
      return renderPageSceneFields(container);
    const page = getUi().page,
      item = getConfig().pageHeaders[page],
      hasImage = !!(item.asset || item.image);
    if (getUi().object === 'decoration' && PAGE_TITLE_SUBTITLE_TARGETS[page])
      return renderPageDecorationFields(container, page, item);
    if (getUi().object === 'subtitle' && PAGE_TITLE_SUBTITLE_TARGETS[page])
      return renderPageSubtitleFields(container, page, item);
    container.append(
      make(
        'p',
        'hint',
        page === 'home'
          ? '在近期聊天首页上方显示图片或标题。'
          : '在本页内容上方显示图片或标题。',
      ),
    );
    if (getUi().object === 'title') {
      propertyHeading(container, '标题内容');
      const row = make('label', 'field', '页面标题'),
        text = make('textarea');
      text.rows = 2;
      text.maxLength = 300;
      text.value = item.title;
      text.setAttribute('aria-label', '页面标题');
      let tracking = false;
      text.addEventListener('input', () => {
        if (!tracking) {
          remember();
          tracking = true;
        }
        item.title = text.value;
        apply();
        notify('页面标题已更新，尚未保存');
      });
      for (const event of ['change', 'blur'])
        text.addEventListener(event, () => {
          tracking = false;
        });
      row.append(text);
      container.append(row);
      propertyHeading(container, '标题外观');
      editorControl(
        container,
        field('标题字号', 'titleSize', 'range', {
          min: 8,
          max: 60,
          unit: 'px',
        }),
        item,
      );
      editorControl(container, field('标题颜色', 'titleColor', 'color'), item);
      editorControl(
        container,
        field('标题对齐', 'titleAlign', 'select', {
          options: [
            ['left', '左对齐'],
            ['center', '居中'],
            ['right', '右对齐'],
          ],
        }),
        item,
      );
      editorControl(
        container,
        field('标题字重', 'titleWeight', 'range', {
          min: 100,
          max: 900,
          step: 100,
        }),
        item,
      );
      if (item.titleStyle && PAGE_TITLE_SUBTITLE_TARGETS[page]) {
        for (const f of [
          field('标题字体', 'font', 'select', {options:[['auto','沿用界面字体'],...TIME_FONTS.map(font=>[font,font])]}),
          field('标题行高', 'lineHeight', 'range', {min:1,max:3,step:0.05}),
          field('标题字间距', 'letterSpacing', 'range', {min:-2,max:10,step:0.1,unit:'px'}),
        ]) editorControl(container,f,item.titleStyle);
        renderFontLinkFields(container,pageTitleFontKey(page),item.titleStyle,'标题');
      }
      return;
    }
    if (getUi().object === 'layout') {
      propertyHeading(container, '排版');
      editorControl(
        container,
        field('页面头部排版', 'layout', 'select', {
          options: [
            ['native', '酒馆原有排版'],
            ['standard', '工坊标题排版'],
          ],
        }),
        item,
      );
      container.append(
        make(
          'p',
          'hint',
          '酒馆原有排版保留酒馆原标题。工坊标题排版在页面头部实际显示时隐藏对应酒馆原标题；没有头部内容时整理酒馆原标题，角色名称始终保留。',
        ),
      );
      if (page === 'settings')
        container.append(
          make(
            'p',
            'hint',
            '设置页使用工坊标题排版且实际显示头部时才启用固定排版；否则保留酒馆原有排版。',
          ),
        );
      propertyHeading(container, '头部尺寸');
      editorControl(
        container,
        field('高度方式', 'sizing', 'select', {
          options: [
            ['fixed', '指定高度'],
            ['ratio', '按图片比例'],
          ],
        }),
        item,
        () => renderFields(),
      );
      if (item.sizing === 'fixed' || !hasImage)
        editorControl(
          container,
          field('头部高度', 'height', 'range', {
            min: 40,
            max: 600,
            unit: 'px',
          }),
          item,
        );
      if (!hasImage)
        container.append(
          make(
            'p',
            'hint',
            '按图片比例需要头图；仅使用标题时，请使用指定高度。',
          ),
        );
      if (hasImage && item.sizing === 'ratio')
        container.append(
          make('p', 'hint', '宽度跟随页面，高度按原图比例变化。'),
        );
      if (item.scene.images.length || item.scene.texts.length)
        container.append(
          make(
            'p',
            'hint',
            '多图层使用指定的头部高度作为画布，超出画布的内容会裁切。',
          ),
        );
      propertyHeading(container, '留白');
      const spacing = pairedFields(container);
      for (const [key, label] of [
        ['topGap', '顶部留白'],
        ['sideGap', '左右留白'],
      ])
        editorControl(
          spacing,
          field(label, key, 'range', { min: 0, max: 160, unit: 'px' }),
          item,
        );
      return;
    }
    const row = make('div', 'actions'),
      pick = make('button', '', hasImage ? '更换图片' : '选择图片');
    pick.type = 'button';
    pick.dataset.pageHeaderArtwork = page;
    pick.addEventListener('click', () =>
      openMaterialPicker('page-header', 'images', page, (source) => {
        Object.assign(getConfig().pageHeaders[page], {
          asset: source.asset || '',
          image: source.image || '',
          enabled: true,
        });
      }),
    );
    row.append(pick);
    if (hasImage) {
      const remove = make('button', '', '移除图片');
      remove.type = 'button';
      remove.dataset.removePageHeader = page;
      remove.addEventListener('click', () => {
        remember();
        Object.assign(item, {
          asset: '',
          image: '',
          enabled:
            item.enabled &&
            Boolean(
              item.placement === 'native' ||
              item.title.trim() ||
              item.scene.images.some((layer) => layer.visible) ||
              item.scene.texts.some(
                (layer) => layer.visible && layer.content.trim(),
              ),
            ),
        });
        apply();
        renderFields();
      });
      row.append(remove);
    }
    container.append(row);
    if (!hasImage) return;
    const preview = make('img', 'page-art-preview');
    preview.alt = PAGE_HEADER_PAGES[page] + '页面头部';
    preview.src = item.asset ? assetUrl(item.asset) : item.image;
    preview.loading = 'lazy';
    container.append(preview);
    propertyHeading(container, '图片取景');
    if (item.sizing === 'fixed') {
      editorControl(
        container,
        field('图片显示', 'fit', 'select', {
          options: [
            ['cover', '铺满区域'],
            ['contain', '完整显示'],
          ],
        }),
        item,
      );
      const position = pairedFields(container);
      for (const [key, label] of [
        ['x', '水平取景'],
        ['y', '垂直取景'],
      ])
        editorControl(
          position,
          field(label, key, 'range', { min: 0, max: 100, unit: '%' }),
          item,
        );
    } else
      container.append(make('p', 'hint', '宽度跟随页面，高度按原图比例变化。'));
  }

  return { renderPageHeaderFields };
}
