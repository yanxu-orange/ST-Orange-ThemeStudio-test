# Global and local glass: development candidate

## Scope and approval
Owner approved implementing global/local frosted and liquid glass in development and test repositories. Public release repository is excluded. Source baseline: dev d983502ff9d0da03b0419d95da884a9eda0c6610; test 25dbce1e76550143fb2c189be8bde903115ece18.

Global: Home and global > Global basics > Glass. Local message/topbar/input/recent-chat cards and native page outer panels support inherit, independent, or none. Existing works without glassStyle retain prior rendering. First explicit edit migrates prior nonzero blur to independent frosted settings. Active material does not overwrite stored original background, radius or text colors. Local none restores original surface styling.

Liquid defaults: tint #103948, alpha .22, blur 0, displacement 15, highlight .65. Static SVG filters are shared by parameter profile and removed on stop. Highlight zero clears both inset highlights; default visual preserved. No animation, per-message SVG copies, global ancestor filter, or new geometry measurement loop.

## Checks
- Final full suite: 665 passed, zero failures.
- CSS-only glass change regression: no message geometry reads; original avatar/name node identities retained; stop clears SVG.
- Scheme JSON save/export/import, applied state and reopen covered by tests.
- Actual isolated SillyTavern 1.19.0 cloud Chrome: global liquid; local none restores background; local custom frosted 8px coexists with liquid input; inheritance restored; save/apply and page reload restore filter definitions.
- Actual world-book and preset outer panels inherit liquid. Child controls are not independently filtered.
- 30 fabricated long messages imported through native temporary chat; no model/API calls. Total 31 host message nodes, 18,487px scroll range.

One 5-second scroll sweep per mode on the same cloud browser:

| mode | median frame interval | p95 | max | >50ms intervals | long tasks |
|---|---:|---:|---:|---:|---:|
| none | 16.7ms | 16.8ms | 83.27ms | 2 | 2 / 165ms |
| liquid 15, blur 0 | 16.7ms | 33.4ms | 83.2ms | 3 | 0 |
| frosted blur 8 | 16.7ms | 50ms | 99.92ms | 7 | 1 / 111ms |

These are single-run cloud measurements, not mobile frame-rate claims. Filters have a rendering cost despite CSS-only update behavior. A repeat after the final test suite was blocked by CDP command dispatch/read timeouts; no second-run result is claimed. Test harness and fabricated data are not packaged with the extension.

## Review and boundaries
Independent review found no P0/P1 data/inheritance blocker for dev/test trial. Fixed its highlight-zero finding. Underlying solid or image backgrounds remain intentionally preserved; a solid chat canvas can hide wallpaper texture. Dark text on dark wallpaper requires the existing text-color controls; glass does not silently recolor text.

Existing production export UI exports scheme JSON, not standalone CSS/native theme. Glass round-trips in JSON with the plugin. portable CSS helpers are preparatory only; standalone liquid CSS export is not implemented or claimed. SVG backdrop URL rendering was checked in this Chrome host; other engines have not been verified. No public release push in this task.

## Idle retest and refraction evidence (2026-11-18, follow-up)
Browser access recovered. Same isolated host, 31 message nodes, 18,487px scroll extent and 5-second scroll sweep; no concurrent automated test suite.

| mode/run | median | p95 | max | >50ms | long tasks |
|---|---:|---:|---:|---:|---:|
| liquid 1 | 16.7ms | 33.4ms | 66.7ms | 1 | 1 / 58ms |
| liquid 2 | 16.7ms | 33.4ms | 66.6ms | 2 | 1 / 50ms |
| none 1 | 16.7ms | 16.8ms | 66.6ms | 1 | 1 / 66ms |
| none 2 | 16.7ms | 16.7ms | 33.4ms | 0 | 1 / 75ms |

Liquid rendering cost remains in idle runs; performance is NOT claimed fixed. Subsequent frosted runs coincided with browser/transport stalls (p95 949.8ms and 183.3ms), so they are not a reliable isolated material comparison. One later experimental 100% SVG-filter-region sweep had a 6315ms frame and is excluded. The next 100% and original 140% region sweeps both had p95 49.9ms, providing no demonstrated optimization benefit. No production region or visual-default change was made.

Actual same-position refraction 0 versus 15 screenshots are in glass-evidence/. Card rectangle was identical (left305, top-20.6875, width570, height631.5625). Wallpaper mountain ridges/lakeshore shift slightly inside the card while text positions stay fixed. Mean absolute RGB difference was 3.31/255 for the whole card and 1.48/255 for a texture-only inner strip, versus 0.21/255 outside (outside includes pointer movement). JPEG screenshot noise means numbers alone are not proof; side-by-side observed texture displacement supports actual backdrop refraction, not merely a CSS property being present.

Manual coverage: chat, topbar, input, world book and presets; other mapped native pages have code/unit coverage, not exhaustive manual page testing. Real persistence check: apply/save then full page reload restores filter. JSON import/export/undo/reopen predominantly automated coverage. Independent CSS export is not a shipped UI feature.

Next optimization work: profile compositor/raster time separately, test bounded filter regions on multiple card sizes/rounded edges before changing production, and run ordered interleaved none/frosted/liquid repeats in a stable renderer. Keep current visual defaults until a measured improvement preserves refraction and edge rendering. Do not hide cost by silently changing liquid to blur or removing refraction. No public repository push.
