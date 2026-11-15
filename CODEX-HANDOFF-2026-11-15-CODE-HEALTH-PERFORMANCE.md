# Codex 交接：代码健康与性能优化

日期：2026-11-15
仓库：yanxu-orange/ST-Orange-ThemeStudio-test
已核对代码基线：e3d92915dd611708f252dbd815045c4beaa86025（main）
范围：仅代码健康与性能优化。本文件是交接说明，不包含功能实现或源码修改。

## 目标与边界

保持当前产品功能、界面文案、方案格式和原生交互不变，降低不必要的渲染成本，改善代码维护性。
不负责主题复刻、标题角标、素材、字体或其他新功能；不新增自动布局、旧数据迁移或假设性防御机制。
开始前重新核对远端、工作区状态和仓库说明，保留其他修改。若存在相关 .agents/skills，按需阅读。
权限拒绝必须停止，不切换路径绕过。功能修复与行为不变的重构分开提交，便于审阅。

## 一、性能：深层纯颜色字段误触发全楼几何测量

基线源码定位：
- live-adapter.mjs 的 cssOnlyField / sameLayout（约109–136行）已排除部分浅层颜色变化。
- flush（约286–311行）在 needsLayout 成立后将所有消息标为待更新，随后测量头像、文案、姓名时间、尾部与原生控件。
- 新增深层样式颜色字段未完整接入上述分类。这是代码路径发现，不是已完成的手机性能实测。
- 既有单楼动态更新优化仍存在，不要重复推倒重写。

优先逐项核对下列字段及其消费者 native-stat-style.mjs、native-swipe-style.mjs、native.mjs：

```
nativeStyle.actions.roles.{ai,user}.color
nativeStyle.stats.{floor,time,tokens}.valueStyle.color
nativeStyle.stats.{floor,time,tokens}.label.style.color
nativeStyle.stats.roles.{ai,user}.{floor,time,tokens}.valueStyle.color
nativeStyle.stats.roles.{ai,user}.{floor,time,tokens}.label.style.color
nativeStyle.swipe.{left,right}.valueStyle.color
nativeStyle.swipe.counter.valueStyle.color
nativeStyle.swipe.counter.label.style.color
```

确认仅输出 CSS color 后，以最小改动使其更新样式而不重新测量全部聊天楼层。
不要笼统忽略所有 color 字段：图标着色等可能需要其他更新。字号、字体、字重、文字、位置、显隐及间距仍可能影响几何。

验收：
1. 约20个混合AI/用户楼层作为普通规模代表，不把此数当作用户固定使用量。
2. 纯颜色变化可见且不触发聊天几何重算；同帧连续调色正常合并。
3. 字号、字体、文字、位置变化仍正确测量；颜色与尺寸同时改变不能漏重排。
4. 流式内容、编辑、翻页、统计动态仍按必要范围更新，保留已有单楼优化。
5. 保存、恢复、退出行为不变。
6. 保留既有大规模测试作附加回归，不用500/1000楼作为默认优化目标，也不将DOM测试计数当作手机帧率结论。

## 二、代码健康：按职责渐进拆分 index.js

基线 index.js 约1016行，多个长行混合属性编辑、素材、导入保存与拖动接线，维护时容易牵连其他功能。
优先抽出已有属性编辑器，入口保留协调逻辑；具体模块边界由实际依赖决定，不机械拆成大量小文件。

要求：
- 不更换框架、不重写状态机制、不新增配置迁移。
- 不改变既定文案、控件顺序、默认行为、CSS输出或方案导出结构。
- 保留对象引用、AI/用户选择范围、素材回填目标、撤销与保存行为。
- 每次拆分范围清晰，先测试再继续；不顺手调整无关功能。
- 不新增版本记录式、安全防御式或待验收式源码注释；必要注释只说明当前代码职责。

验收：
- 相关配置的CSS与导出结构保持等价。
- 输入与失焦、切页/切角色、选择与取消、素材回填、撤销、保存恢复、导入导出正常。
- 原生按钮事件及退出清理正常。
- 对涉及真实浏览器的行为，区分实际验证与仅DOM模拟。

## 基线测试与报告

package.json 的测试入口为 npm test（node --test *.test.mjs），使用 linkedom。
先在可用开发环境执行基线，再对最终改动执行相关回归和完整测试，不把历史记录当本次结果。

历史记录曾为527项中523通过、4项失败；本次交接未重新执行，需复核：
- workbench fill and gradient save, restore, undo and keep independent normal settings
- same renderer provides appearance parity without host geometry or global token leaks
- readonly state extends the base input selector so it wins native appearance specificity
- all nine page roots inherit by default and independent base styles never emit another page scope

long-chat-performance.test.mjs 会写测试报告；若环境只读，报告落盘失败应与断言失败分开说明，不能伪称整套通过。

最终提交说明应列出：实际改动、基线与最终测试结果、性能计数对比、已知原有失败、未验证范围和剩余风险。不要宣称未经实测的手机性能提升。
