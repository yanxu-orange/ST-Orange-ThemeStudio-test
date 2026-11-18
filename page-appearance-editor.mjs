import {resolveGlass} from './glass-model.mjs';
import { WORLD_ENTRY_DEFAULTS } from './world-entry-style.mjs';
import { assetUrl } from './catalog.mjs';
import { clone } from './layers.mjs';
import { COMMON_PARTS, PAGE_NAMES } from './workbench-ui.mjs';

export function createPageAppearanceEditor({
  getUi,
  renderGlassFields,
  make,
  workbench,
  getConfig,
  editorControl,
  field,
  fonts,
  propertyHeading,
  renderFontLinkFields,
  openMaterialPicker,
  remember,
  apply,
  renderFields,
  pairedFields,
  notify,
}) {
  function renderCommonFields(container) {
    if(getUi().commonPart==='glass'){renderGlassFields(container,{global:true});propertyHeading(container,'首页最近聊天卡片');renderGlassFields(container,{region:'home'});return;}
    if (getUi().page === 'chat') {
      const row = make('div', 'actions');
      for (const [page, label] of [
        ['settings', '查看设置页'],
        ['worldbook', '查看世界书'],
      ]) {
        const button = make('button', '', label);
        button.type = 'button';
        button.addEventListener('click', () => workbench.choosePage(page));
        row.append(button);
      }
      container.append(row);
    }
    container.append(
      make('p', 'hint', '用于各页面共用界面；聊天正文、顶栏和输入区单独设置。'),
    );
    renderSharedStyleFields(
      container,
      getUi().commonPart,
      getConfig().commonStyle[getUi().commonPart],
    );
  }
  function renderSharedStyleFields(
    container,
    part,
    item,
    {
      fontKey = 'common',
      notice = '界面共用外观已更新，尚未保存',
      keys = null,
    } = {},
  ) {
    const control = (f) => {
      if (!keys || keys.includes(f.key))
        editorControl(container, { ...f, notice }, item);
    };
    if (part === 'text') {
      control(
        field('界面字体', 'font', 'select', {
          options: [['auto', '沿用酒馆界面字体'], ...fonts],
        }),
      );
      control(
        field('界面字号', 'size', 'range', { min: 12, max: 24, unit: 'px' }),
      );
      for (const [key, label] of [
        ['color', '界面文字颜色'],
        ['muted', '辅助文字颜色'],
        ['accent', '界面强调颜色'],
      ])
        control(field(label, key, 'color'));
      if (!keys || keys.includes('fontLink')) {
        propertyHeading(container, '外链字体');
        renderFontLinkFields(container, fontKey, item, '界面');
      }
    } else if (part === 'panel') {
      control(field('面板底色', 'background', 'color'));
      control(
        field('面板不透明度', 'opacity', 'range', {
          min: 0,
          max: 1,
          step: 0.05,
        }),
      );
      control(field('面板边框颜色', 'border', 'color'));
      control(
        field('面板边框粗细', 'width', 'range', { min: 0, max: 4, unit: 'px' }),
      );
      control(
        field('面板圆角', 'radius', 'range', { min: 0, max: 32, unit: 'px' }),
      );
    } else if (part === 'heading') {
      control(field('标题文字颜色', 'color', 'color'));
      control(field('标题底色', 'background', 'color'));
      control(
        field('标题字号', 'size', 'range', { min: 12, max: 32, unit: 'px' }),
      );
      control(
        field('标题字重', 'weight', 'select', {
          numeric: true,
          options: [
            [100, '100 · 极细'],
            [200, '200 · 纤细'],
            [300, '300 · 细体'],
            [400, '400 · 常规'],
            [500, '500 · 中等'],
            [600, '600 · 半粗'],
            [700, '700 · 粗体'],
            [800, '800 · 特粗'],
            [900, '900 · 重体'],
          ],
        }),
      );
      control(
        field('标题圆角', 'radius', 'range', { min: 0, max: 32, unit: 'px' }),
      );
    } else if (part === 'button') {
      for (const [key, label] of [
        ['color', '按钮文字颜色'],
        ['background', '按钮底色'],
        ['border', '按钮边框颜色'],
        ['hover', '按钮悬停底色'],
      ])
        control(field(label, key, 'color'));
      control(field('按钮底色不透明度','opacity','range',{min:0,max:1,step:0.01}));
      control(field('按钮悬停底色不透明度','hoverOpacity','range',{min:0,max:1,step:0.01}));
      control(
        field('按钮圆角', 'radius', 'range', { min: 0, max: 32, unit: 'px' }),
      );
    } else {
      for (const [key, label] of [
        ['color', '文字颜色'],
        ['background', '背景颜色'],
        ['border', '边框颜色'],
        ['focus', '选中时边框颜色'],
      ])
        control(field(label, key, 'color'));
      control(
        field('控件圆角', 'radius', 'range', { min: 0, max: 32, unit: 'px' }),
      );
    }
  }

  function renderPageArtwork(container, page, surface) {
    const art = getConfig().pageStyle[page].art[surface],
      label =
        surface === 'page'
          ? '页面背景图片'
          : surface === 'entry'
            ? '条目背景图片'
            : '分组背景图片';
    propertyHeading(container, label);
    const row = make('div', 'actions'),
      pick = make('button', '', art ? '更换图片' : '选择图片');
    pick.type = 'button';
    pick.dataset.pageArtwork = surface;
    pick.addEventListener('click', () =>
      openMaterialPicker(
        'page-background',
        'images',
        page + ':' + surface,
        (source) => {
          getConfig().pageStyle[page].art[surface] = {
            asset: source.asset || '',
            image: source.image || '',
            fit: art?.fit || 'cover',
            x: art?.x ?? 50,
            y: art?.y ?? 50,
          };
        },
      ),
    );
    row.append(pick);
    if (art) {
      const remove = make('button', '', '移除图片');
      remove.type = 'button';
      remove.dataset.removePageArtwork = surface;
      remove.addEventListener('click', () => {
        remember();
        getConfig().pageStyle[page].art[surface] = null;
        apply();
        renderFields();
      });
      row.append(remove);
    }
    container.append(row);
    if (art) {
      const preview = make('img', 'page-art-preview');
      preview.alt = label;
      preview.src = art.asset ? assetUrl(art.asset) : art.image;
      preview.loading = 'lazy';
      container.append(preview);
      editorControl(
        container,
        field('图片铺放', 'fit', 'select', {
          options: [
            ['cover', '铺满区域'],
            ['contain', '完整显示'],
            ['auto', '原始大小'],
          ],
        }),
        art,
      );
      const position = pairedFields(container);
      for (const [key, name] of [
        ['x', '水平取景'],
        ['y', '垂直取景'],
      ])
        editorControl(
          position,
          field(name, key, 'range', { min: 0, max: 100, unit: '%' }),
          art,
        );
    }
  }
  function renderPageStyleSource(
    container,
    pageConfig,
    part,
    inherited,
    label,
    follow,
    aria = '样式来源',
  ) {
    const item = pageConfig[part];
    const sourceLabel = make('label', 'field', label + '样式来源'),
      source = make('select');
    source.setAttribute('aria-label', aria);
    source.dataset.pageStyleSource = part;
    for (const [value, text] of [
      ['inherit', follow],
      ['custom', '单独设置'],
    ]) {
      const option = make('option', '', text);
      option.value = value;
      source.append(option);
    }
    source.value = item ? 'custom' : 'inherit';
    source.addEventListener('change', () => {
      remember();
      pageConfig[part] = source.value === 'custom' ? clone(inherited) : null;
      apply();
      renderFields();
      notify(
        source.value === 'custom'
          ? '已从当前外观开始单独设置，尚未保存'
          : '已恢复跟随，尚未保存',
      );
    });
    sourceLabel.append(source);
    container.append(sourceLabel);
  }
  function renderBaiGroups(container) {
    const page = getConfig().pageStyle.presets;
    for (const [part, label, keys] of [
      ['panel', '分组边线', ['border']],
      ['heading', '分组标题', ['background', 'color', 'size', 'weight']],
      ['field', '分组内部底色', ['background']],
      ['text', '分组状态', ['muted', 'accent']],
    ]) {
      propertyHeading(container, label);
      renderPageStyleSource(
        container,
        page,
        part,
        getConfig().commonStyle[part],
        label,
        '跟随全局',
        label + '样式来源',
      );
      container.append(
        make(
          'p',
          'hint',
          `样式来源与预设页「${COMMON_PARTS.find(([id]) => id === part)[1]}」整组共用，切换也会改变该组其他属性。`,
        ),
      );
      if (page[part])
        renderSharedStyleFields(container, part, page[part], {
          fontKey: 'page-presets',
          notice: '预设外观已更新，尚未保存',
          keys,
        });
    }
  }
  function renderWorldEntryFields(container, page) {
    propertyHeading(container, '条目排版');
    const label=make('label','field','排版来源'), select=make('select');
    for(const [value,text] of [['native','保持现有排版'],['custom','单独设置']]){const option=make('option','',text);option.value=value;select.append(option);}
    select.setAttribute('aria-label','条目排版来源');
    select.value=page.entryDetails?'custom':'native';
    select.addEventListener('change',()=>{remember();page.entryDetails=select.value==='custom'?clone(WORLD_ENTRY_DEFAULTS):null;apply();renderFields();});
    label.append(select);container.append(label);
    const details=page.entryDetails;if(!details)return;
    const control=f=>editorControl(container,f,details);
    control(field('条目边框','borderMode','select',{options:[['all','四边边框'],['bottom','仅底部分隔线'],['none','无边框']]}));
    for(const [key,label] of [['paddingTop','条目上留白'],['paddingX','条目左右留白'],['paddingBottom','条目下留白'],['gap','条目间距'],['contentPaddingY','标题与内容上下留白'],['contentPaddingX','标题与内容左右留白']])control(field(label,key,'range',{min:0,max:48,unit:'px'}));
    const choice=(label,key,options)=>{const state={enabled:details[key]};editorControl(container,field(label,'enabled','select',{options,beforeApply:()=>{details[key]=state.enabled;}}),state,renderFields);};
    choice('标题底色','headerGradient',[['false','纯色'],['true','左右渐变']]);
    if(details.headerGradient)control(field('渐变右侧颜色','headerEnd','color'));
    choice('操作图标边框','plainIcons',[['false','跟随按钮'],['true','无边框']]);
    choice('停用条目文字','mutedDisabled',[['false','保持现有样式'],['true','使用辅助文字色']]);
    control(field('展开箭头大小','arrowScale','range',{min:0,max:3,step:.1}));
    control(field('输入框字体与字号','fieldTypography','select',{options:[['theme','跟随美化'],['native','沿用酒馆设置']]}));
    for(const [key,label] of [['deleteColor','删除图标颜色'],['deleteBackground','删除按钮底色'],['deleteBorder','删除按钮边框']])control(field(label,key,'color'));
  }
  function renderPageFields(container) {
    if(getUi().region==='page-common'&&getUi().commonPart==='glass'){renderGlassFields(container,{region:getUi().page});return;}
    const bai = getUi().page === 'presets' && getUi().region === 'page-bai';
    if (bai)
      container.append(
        make(
          'p',
          'hint',
          '与预设页面共用样式。',
        ),
      );
    if (
      getUi().page === 'presets' &&
      getUi().region === 'page-content' &&
      getUi().kind === 'tip'
    ) {
      editorControl(
        container,
        field('提示位置', 'sliderTip', 'select', {
          options: [
            ['native', '酒馆默认位置'],
            ['flow', '随页面内容排列'],
          ],
        }),
        getConfig().pageStyle.presets,
      );
      container.append(
        make('p', 'hint', '只调整提示的位置，是否显示仍由酒馆的滑块设置决定。'),
      );
      return;
    }
    if (bai && getUi().kind === 'group') {
      renderBaiGroups(container);
      return;
    }
    const page = getUi().page,
      specific = getUi().region === 'page-content' || bai,
      part = specific
        ? page === 'settings'
          ? 'section'
          : getUi().kind === 'heading'
            ? 'entryHeading'
            : 'entry'
        : getUi().commonPart,
      basePart = ['section', 'entry'].includes(part)
        ? 'panel'
        : part === 'entryHeading'
          ? 'heading'
          : part;
    const pageConfig = getConfig().pageStyle[page],
      inherited = pageConfig[basePart] || getConfig().commonStyle[basePart],
      item = pageConfig[part],
      label = specific
        ? part === 'entryHeading'
          ? '条目标题'
          : page === 'settings'
            ? '设置分组'
            : page === 'presets'
              ? '提示词条目'
              : '条目卡片'
        : COMMON_PARTS.find(([id]) => id === part)?.[1];
    const follow = specific
      ? part === 'section'
        ? pageConfig.panel
          ? '跟随本页面板样式'
          : '酒馆默认分组样式'
        : basePart === 'panel'
          ? '跟随本页面板样式'
          : pageConfig.heading
            ? '跟随本页标题'
            : '沿用页面标题区'
      : '跟随全局';
    renderPageStyleSource(
      container,
      pageConfig,
      part,
      inherited,
      label,
      follow,
    );
    if (item)
      renderSharedStyleFields(container, basePart, item, {
        fontKey: 'page-' + page,
        notice: PAGE_NAMES[page] + '外观已更新，尚未保存',
        ...(!specific&&basePart==='panel'&&resolveGlass(getConfig(),page)?.mode&&resolveGlass(getConfig(),page).mode!=='none'?{keys:['border','width','radius']}:{}),
      });
    else if (part === 'entryHeading' && !pageConfig.heading)
      container.append(
        make('p', 'hint', '选择“单独设置”可一起调整标题区和标题文字。'),
      );
    else if (part === 'section' && !pageConfig.panel)
      container.append(make('p', 'hint', '单独设置会从当前面板外观开始调整。'));
    if(page==='worldbook'&&specific&&part==='entry')renderWorldEntryFields(container,pageConfig);
    if (basePart === 'panel' && !(page === 'presets' && specific))
      renderPageArtwork(container, page, specific ? part : 'page');
    if (part === 'button')
      container.append(make('p', 'hint', '删除等按钮保留警示色。'));
    if (part === 'field')
      container.append(make('p', 'hint', '勾选与滑块颜色在“界面文字”中调整。'));
  }

  return { renderCommonFields, renderPageFields };
}
