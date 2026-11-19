import { activateEditedRegion } from './edit-activation.mjs';
import { addNumericStepper } from './numeric-stepper.mjs';
import { clone } from './layers.mjs';

export function createPropertyControls({
  make,
  remember,
  getUi,
  getConfig,
  getPhotoScope,
  apply,
  notify,
  getEditEpoch,
  colorPicker,
  isActive,
  liveAdapter,
  groups,
}) {
  function numericRow(label, range, number, unit = '', nudge = false) {
    const row = make('span', 'control-row numeric-row'),
      shortUnit = unit.includes('（') ? unit.split('（')[0] : unit;
    row.append(number, make('span', 'control-unit', shortUnit));
    if (nudge) {
      row.classList.add('position-nudge');
      const buttons = [];
      const refresh = () => {
        const value = Number(number.value),
          valid =
            number.value !== '' &&
            Number.isFinite(value) &&
            value >= Number(number.min) &&
            value <= Number(number.max);
        buttons.forEach(
          ([button, delta]) =>
            (button.disabled =
              !valid ||
              (delta < 0
                ? value <= Number(number.min)
                : value >= Number(number.max))),
        );
      };
      for (const [symbol, delta] of [
        ['−', -1],
        ['+', 1],
      ]) {
        const button = make('button', 'nudge-button', symbol);
        button.type = 'button';
        button.setAttribute(
          'aria-label',
          range.getAttribute('aria-label') + (delta < 0 ? ' 减少' : ' 增加'),
        );
        button.addEventListener('click', (event) => {
          event.preventDefault();
          if (button.disabled) return;
          number.dispatchEvent(new window.Event('change', { bubbles: true }));
          number.value = String(
            Math.min(
              Number(number.max),
              Math.max(
                Number(number.min),
                Number(
                  (
                    Number(number.value) +
                    delta * Number(number.step || 1)
                  ).toFixed(6),
                ),
              ),
            ),
          );
          number.dispatchEvent(new window.Event('input', { bubbles: true }));
          number.dispatchEvent(new window.Event('change', { bubbles: true }));
          refresh();
        });
        buttons.push([button, delta]);
        row.append(button);
      }
      for (const node of [range, number])
        node.addEventListener('input', refresh);
      refresh();
    }
    row.append(range);
    label.append(row);
    addNumericStepper(row, range, number);
    if (unit.includes('（'))
      label.append(make('span', 'hint', unit.slice(unit.indexOf('（'))));
    return row;
  }
  function colorRow(label, swatch, hex) {
    const row = make('span', 'control-row color-row');
    row.append(hex, swatch);
    label.append(row);
    return row;
  }
  function pairedFields(container) {
    const row = make('div', 'paired-fields');
    container.append(row);
    return row;
  }
  function editorControl(container, f, target, onUpdate) {
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
      }
    }
    if (f.type === 'text')
      input.maxLength = f.maxLength || (f.key === 'name' ? 80 : 300);
    input.value = String(target[f.key]);
    let tracking = false,
      number = null,
      hex = null,
      colorChip = null;
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
      target[f.key] = value;
      if (
        getUi().region === 'header' &&
        getUi().kind === 'avatar' &&
        getConfig().avatarDesign === 'unified'
      ) {
        const other = getPhotoScope() === 'ai' ? 'user' : 'ai';
        if (target === getConfig().photos[getPhotoScope()])
          getConfig().photos[other] = clone(target);
        if (target === getConfig().avatarFill[getPhotoScope()])
          getConfig().avatarFill[other] = clone(target);
      }
      input.value = String(value);
      if (number) number.value = value;
      if (hex) hex.value = value;
      if (colorChip) colorChip.style.background = value;
      f.beforeApply?.();
      apply();
      onUpdate?.();
      notify(f.notice || '设置已更新');
      return true;
    };
    input.addEventListener('input', () =>
      update(
        f.type === 'range' || f.numeric
          ? Number(input.value)
          : [
                'promptList',
                'cardFullWidth',
                'cardShadow',
                'showArrow',
                'enabled',
                'gradient',
                'borderEnabled',
                'shadow',
                'visible',
                'bodyIndent',
                'hideHistory',
                'hideLatest',
                'tint',
              ].includes(f.key)
            ? input.value === 'true'
            : input.value,
      ),
    );
    input.addEventListener('change', () => {
      tracking = false;
    });
    if (!['range', 'color'].includes(f.type)) label.append(input);
    if (f.type === 'range') {
      number = make('input', 'number-input');
      number.type = 'number';
      number.min = f.min;
      number.max = f.max;
      number.step = f.step || 1;
      number.value = target[f.key];
      number.setAttribute('aria-label', f.label + ' 数值');
      number.addEventListener('input', () => {
        if (number.value === '') return;
        number.setAttribute(
          'aria-invalid',
          String(!update(Number(number.value))),
        );
      });
      number.addEventListener('change', () => {
        tracking = false;
      });
      numericRow(
        label,
        input,
        number,
        f.unit || '',
        f.nudge ?? ['x', 'y'].includes(f.key),
      );
    }
    if (f.type === 'color') {
      hex = make('input', 'hex-input');
      hex.type = 'text';
      hex.maxLength = 7;
      hex.value = target[f.key];
      hex.setAttribute('aria-label', f.label + ' HEX');
      hex.addEventListener('input', () => {
        const valid = /^#[a-f0-9]{6}$/i.test(hex.value);
        hex.setAttribute('aria-invalid', String(!valid));
        if (valid) update(hex.value);
      });
      hex.addEventListener('change', () => {
        tracking = false;
      });
      input.type = 'hidden';
      label.append(input);
      const trigger = make('button', 'otl-color-launch');
      trigger.type = 'button';
      trigger.setAttribute('aria-label', '选择' + f.label + '颜色');
      trigger.setAttribute('aria-haspopup', 'dialog');
      colorChip = make('span');
      colorChip.style.background = target[f.key];
      trigger.append(colorChip);
      trigger.addEventListener('click', (event) => {
        event.preventDefault();
        const epoch = getEditEpoch(),
          originalConfig = getConfig();
        colorPicker.open({
          value: target[f.key],
          label: f.label,
          trigger,
          isValid: () =>
            isActive() &&
            epoch === getEditEpoch() &&
            getConfig() === originalConfig &&
            trigger.isConnected,
          onPreview: (value) => {
            if (
              !isActive() ||
              epoch !== getEditEpoch() ||
              getConfig() !== originalConfig
            )
              return;
            const old = target[f.key],
              otherScope = getPhotoScope() === 'ai' ? 'user' : 'ai',
              other =
                getConfig().avatarDesign === 'unified'
                  ? target === getConfig().photos[getPhotoScope()]
                    ? getConfig().photos[otherScope]
                    : target === getConfig().avatarFill[getPhotoScope()]
                      ? getConfig().avatarFill[otherScope]
                      : null
                  : null,
              otherOld = other?.[f.key];
            target[f.key] = value;
            if (other) other[f.key] = value;
            const rollback = f.beforePreview?.();
            const restoreActivation = activateEditedRegion(getConfig(), getUi());
            try {
              liveAdapter.update(getConfig(), { validated: true });
            } finally {
              restoreActivation();
              rollback?.();
              target[f.key] = old;
              if (other) other[f.key] = otherOld;
            }
          },
          onCancel: () => {
            if (isActive())
              liveAdapter.update(getConfig(), { validated: true });
          },
          onCommit: (value) => {
            tracking = false;
            update(value);
            tracking = false;
          },
        });
      });
      colorRow(label, trigger, hex);
    }
    container.append(label);
  }

  function renderConfigFields(container, keys) {
    for (const key of keys) {
      const f = Object.values(groups)
        .flat()
        .find((f) => f.key === key);
      if (!f) continue;
      if (f.type === 'textarea') {
        const label = make('label', 'field', f.label),
          input = make('textarea');
        input.setAttribute('aria-label', f.label);
        input.maxLength = 300;
        input.rows = 4;
        input.value = getConfig()[f.key];
        let tracking = false;
        input.addEventListener('input', () => {
          if (!tracking) {
            remember();
            tracking = true;
          }
          getConfig()[f.key] = input.value;
          apply();
          notify('尚未保存 · 预览已更新');
        });
        for (const event of ['change', 'blur'])
          input.addEventListener(event, () => (tracking = false));
        label.append(input);
        container.append(label);
      } else
        editorControl(
          container,
          { ...f, notice: '尚未保存 · 预览已更新' },
          getConfig(),
        );
    }
  }
  function propertyHeading(container, title) {
    const heading = make('h3', 'property-heading', title);
    container.append(heading);
  }

  return {
    numericRow,
    colorRow,
    pairedFields,
    editorControl,
    renderConfigFields,
    propertyHeading,
  };
}
