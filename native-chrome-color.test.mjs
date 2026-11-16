import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHROME_DEFAULTS, chromeRules } from './chrome.mjs';
test('native chrome icons use readable theme text without overriding custom icons', () => {
 const c={chromeStyle:structuredClone(CHROME_DEFAULTS),commonStyle:{text:{color:'#363a40'}},text:'#363a40'};
 c.chromeStyle.topbar.enabled=true;c.chromeStyle.input.enabled=true;
 c.chromeStyle.topbar.icons['ai-config-button'].color='#990000';
 c.chromeStyle.topbar.icons['sys-settings-button'].mode='image';
 const css=chromeRules(c);
 assert.match(css,/#ai-config-button \.drawer-icon:not\(\[data-oc-image\]\)\{color:#990000!important/);
 assert.match(css,/#user-settings-button \.drawer-icon:not\(\[data-oc-image\]\)\{color:#363a40!important/);
 assert.doesNotMatch(css,/#sys-settings-button \.drawer-icon/);
 assert.match(css,/#send_but:not\(\[data-oc-image\]\)>i\{color:#354b42!important/);
 c.chromeStyle.topbar.enabled=false;c.chromeStyle.input.enabled=false;
 assert.doesNotMatch(chromeRules(c),/#user-settings-button|#send_but:not/);
});
