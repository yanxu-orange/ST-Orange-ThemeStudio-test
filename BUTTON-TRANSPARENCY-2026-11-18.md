# Button backgrounds for glass surfaces

Global entry: 首页和全局 → 全局基础 → 按钮. Local: select one of nine native pages → 页面基础 → 按钮 → 样式来源 (跟随全局 / 单独设置).

Adds normal and hover background opacity (0..1). Old works and old independent button objects default to 1 and retain hex CSS output; no automatic recolor. Existing text, border, radius, focus and disabled states remain. No button backdrop filter or new observer. Only background alpha changes; text opacity remains 1 except existing disabled treatment.

Scope: ordinary buttons/menu_button/button inputs in native drawer panels, normal popups/options menus, welcome panel and existing Select2 selected-choice chips. Nine page overrides: settings, world book, presets, API, backgrounds, extensions, personas, characters, response formatting. Excludes message controls, input bar, workshop editor and existing danger/delete selectors. Select/input fields remain their separate controls; not all clickable icons are buttons. Existing hover color sharing with headings/recent cards remains, but their opacity is not changed by this addition.

Validation: 669 tests pass. Includes all nine local opacity editors, normalization limits, legacy output, local inheritance, save/export/import/undo and native event identity. CSS-only update test covers no message geometry reads. Actual cloud SillyTavern 1.19.0: world-book Create button global white .22 / text #103948 yields rgba(255,255,255,.22), opacity1, backdrop-filter none. Independent world-book alpha .6 survives whole-page reload; restoring Follow global restores .22. Screenshot manually inspected: buttons retain visible boundaries and dark text over light translucent fill. Other page manual flows and hover screenshots were not separately exercised.

Trial palette only (not forced defaults): #ffffff background .22, #103948 text, #ffffff hover .4; adjust alpha upward for busy wallpaper. Glass itself still has measured rendering cost documented separately; this patch does not claim to fix liquid-glass scrolling performance.

No public release push.
