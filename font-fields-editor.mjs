import { validateCaptionStyle } from './captions.mjs';

export function createFontFieldsEditor({
  pairedFields,
  make,
  getUi,
  remember,
  apply,
  notify,
  fontPickerButton,
  liveAdapter,
  shadow,
}) {
  function renderFontLinkFields(container, key, item, labelName, beforeApply) {
    const linkRow = pairedFields(container);
    linkRow.classList.add('font-link-row');
    const linkLabel = make('label', 'field', '字体文件直链（留空用预设）'),
      link = make('input');
    link.type = 'url';
    link.maxLength = 2048;
    link.value = item.fontLink?.url || '';
    link.setAttribute('aria-label', labelName + ' 字体直链');
    linkLabel.append(link);
    const faceLabel = make('label', 'field', '链接文件类型'),
      face = make('select');
    face.setAttribute('aria-label', labelName + ' 链接文件类型');
    for (const [value, title] of [
      ['100', '极细字体'],
      ['200', '纤细字体'],
      ['300', '细体字体'],
      ['400', '常规字体'],
      ['500', '中等字体'],
      ['600', '半粗字体'],
      ['700', '粗体字体'],
      ['800', '特粗字体'],
      ['900', '重体字体'],
      ['100 900', '可变字体'],
    ]) {
      const option = make('option', '', title);
      option.value = value;
      face.append(option);
    }
    face.value = item.fontLink?.faceWeight || '400';
    faceLabel.append(face);
    linkRow.append(faceLabel, linkLabel);
    const commit = () => {
      try {
        const next = validateCaptionStyle(
          {
            fontLink: link.value.trim()
              ? { url: link.value.trim(), faceWeight: face.value }
              : null,
          },
          { stable: getUi().region === 'header' },
        );
        remember();
        item.fontLink = next.fontLink;
        link.removeAttribute('aria-invalid');
        beforeApply?.();
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
    status.dataset.fontStatus = key;
    container.append(status);
    updateFontStatuses();
    const retry = make('button', '', '重新加载链接字体');
    retry.type = 'button';
    retry.addEventListener('click', () => liveAdapter.retryFonts());
    container.append(
      retry,
      make('p', 'hint', '字体链接须允许跨域；加载失败时使用预设字体。'),
    );
  }

  function updateFontStatuses() {
    for (const node of shadow.querySelectorAll('[data-font-status]'))
      node.textContent = {
        idle: '使用预设字体',
        loading: '链接字体加载中，暂用预设',
        loaded: '链接字体已加载',
        error: '链接字体未加载，继续使用预设；可重试',
      }[liveAdapter.fontStatus(node.dataset.fontStatus) || 'idle'];
  }

  return { renderFontLinkFields, updateFontStatuses };
}
