# Spring native action tray fix

2026-11-18. Scope: native.mjs and native-actions-role.test.mjs only.

The native host hides More's hint while expanding its absolute-positioned tools. Its measured footprint then collapsed, bringing the tools over Edit and shifting Edit horizontally. The fix places tools 6 px below the occupied Edit/More row in the same region, reserves visible tray height in the footer, and retains the last visible hint footprint for the Edit anchor. Header/footer mixed placements do not reserve the distant region. Template values, native nodes, events, and visibility ownership are unchanged.

Validation: npm test 671/671 passed. Actual isolated SillyTavern 1.19.0 browser, current built-in 移动-春日来信, reproduced overlap before the fix. After: Edit bottom 513.3 px; tools top 519.3 px (6 px gap); Edit x stable at 682.2 px; footer bottom 553.3 px > tools bottom 545.3 px. Outside-click collapse, edit, cancel, and another expansion passed. Browser verification was performed by coordinating agent.

The user's screenshot alone cannot establish the installed commit. The reproduced case is the current built-in 移动-春日来信, not a claim about every historical Spring file or the user's exact installed build. No public repository release is part of this change.
