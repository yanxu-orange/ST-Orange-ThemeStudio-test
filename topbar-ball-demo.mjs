const demoRequested = new URLSearchParams(location.search).get('topbar-ball-demo') === '1';

if (demoRequested) {
    const mount = () => {
        const holder = document.getElementById('top-settings-holder');
        if (!holder || document.querySelector('[data-topbar-ball-toggle]')) return;

        const root = document.documentElement;
        const style = document.createElement('style');
        style.textContent = `
html[data-topbar-ball-demo] {
    --ball-nav-inset: max(8px, env(safe-area-inset-top));
    --ball-nav-size: 54px;
    --ball-nav-bottom: calc(var(--ball-nav-inset) + var(--ball-nav-size));
    --ball-nav-width: 425px;
    --ball-nav-gap: 3px;
}

html[data-topbar-ball-demo] body #top-bar {
    visibility: hidden !important;
}

html[data-topbar-ball-demo] body #sheld {
    top: 0 !important;
    height: calc(100vh - 1px) !important;
    height: calc(100dvh - 1px) !important;
    max-height: calc(100dvh - 1px) !important;
}

html[data-topbar-ball-demo] body #top-settings-holder {
    --topBarBlockSize: var(--ball-nav-size);
    position: fixed !important;
    inset: var(--ball-nav-inset) 0 auto !important;
    display: grid !important;
    grid-template-columns: repeat(9, minmax(0, 42px)) !important;
    grid-auto-rows: 44px;
    align-content: center !important;
    align-items: center !important;
    justify-content: center !important;
    gap: var(--ball-nav-gap) !important;
    height: var(--ball-nav-size) !important;
    padding: 0 !important;
    border: 0 !important;
    pointer-events: none;
}

html[data-topbar-ball-demo] body #top-settings-holder::before {
    position: absolute;
    inset: 0 0 auto;
    height: var(--ball-nav-size);
    width: min(var(--ball-nav-width), 100%);
    margin-inline: auto;
    box-sizing: border-box;
    border-radius: 999px;
    border: 1px solid rgba(81, 99, 90, .25);
    background: rgba(250, 248, 243, .97);
    box-shadow: 0 4px 18px rgba(31, 48, 40, .2);
    pointer-events: none;
}

html[data-topbar-ball-demo][data-topbar-ball-open] #top-settings-holder::before {
    content: "";
}

html[data-topbar-ball-demo] body #top-settings-holder > .drawer {
    min-width: 0;
}

html[data-topbar-ball-demo] body #top-settings-holder > .drawer > .drawer-toggle {
    box-sizing: border-box;
    width: 100% !important;
    min-width: 0 !important;
    height: 44px !important;
    display: grid !important;
    position: relative;
    place-items: center;
    visibility: hidden;
}

html[data-topbar-ball-demo][data-topbar-ball-open] #top-settings-holder > .drawer > .drawer-toggle {
    visibility: visible;
    pointer-events: auto;
}

html[data-topbar-ball-demo] #top-settings-holder > .drawer > .drawer-toggle .drawer-icon {
    color: #40594d !important;
    text-shadow: none !important;
    opacity: .84;
}

html[data-topbar-ball-demo][data-topbar-ball-open] #top-settings-holder > .drawer > .drawer-toggle:hover .drawer-icon,
html[data-topbar-ball-demo][data-topbar-ball-open] #top-settings-holder > .drawer > .drawer-toggle .drawer-icon.openIcon {
    opacity: 1;
}

html[data-topbar-ball-demo] #top-settings-holder .drawer-content {
    pointer-events: auto;
}

html[data-topbar-ball-demo] #top-settings-holder #WorldInfo {
    top: var(--ball-nav-bottom) !important;
    max-height: calc(100dvh - var(--ball-nav-bottom) - var(--bottomFormBlockSize));
}

@media (max-width: 1000px) {
    html[data-topbar-ball-demo] #top-settings-holder :is(#left-nav-panel, #right-nav-panel) {
        top: var(--ball-nav-bottom) !important;
        max-height: calc(100dvh - var(--ball-nav-bottom));
    }
}

html[data-topbar-ball-demo] button[data-topbar-ball-toggle] {
    position: fixed;
    inset-block-start: var(--ball-nav-inset);
    inset-inline-end: max(8px, env(safe-area-inset-right));
    z-index: 4050;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 1px solid #587567;
    border-radius: 50%;
    background: #3f5c4e;
    color: #fff;
    box-shadow: 0 3px 12px rgba(31, 48, 40, .25);
    cursor: pointer;
    font: 600 17px / 1 system-ui, sans-serif;
}

html[data-topbar-ball-demo] button[data-topbar-ball-toggle]:focus-visible {
    outline: 2px solid #cf7898;
    outline-offset: 2px;
}

@media (max-width: 520px) {
    html[data-topbar-ball-demo] {
        --ball-nav-size: 96px;
        --ball-nav-width: 228px;
    }

    html[data-topbar-ball-demo] body #top-settings-holder {
        grid-template-columns: repeat(5, minmax(0, 40px)) !important;
    }

    html[data-topbar-ball-demo] body #top-settings-holder::before {
        border-radius: 26px;
    }
}
        `;

        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('data-topbar-ball-toggle', '');
        button.setAttribute('aria-controls', holder.id);
        const mark = document.createElement('span');
        mark.setAttribute('aria-hidden', 'true');
        button.append(mark);

        function setOpen(open) {
            root.toggleAttribute('data-topbar-ball-open', open);
            const label = open ? '收起酒馆顶栏' : '展开酒馆顶栏';
            button.setAttribute('aria-label', label);
            button.setAttribute('aria-expanded', String(open));
            button.title = label;
            mark.textContent = open ? '×' : '•••';
            if (!open && document.activeElement?.closest('#top-settings-holder .drawer-toggle')) {
                button.focus({ preventScroll: true });
            }
        }

        button.addEventListener('click', event => {
            event.stopPropagation();
            setOpen(button.getAttribute('aria-expanded') !== 'true');
        });
        // SillyTavern closes drawers on these events when they reach the page root.
        for (const type of ['mousedown', 'touchstart']) {
            button.addEventListener(type, event => event.stopPropagation());
        }
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true' && !document.querySelector('dialog[open]')) {
                setOpen(false);
            }
        });

        setOpen(false);
        document.head.append(style);
        document.body.append(button);
        root.setAttribute('data-topbar-ball-demo', '');
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount, { once: true });
    } else {
        mount();
    }
}
