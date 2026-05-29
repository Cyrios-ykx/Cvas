# 变更记录

所有重要的变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [0.2.0] - 2026-05-29

### 新增

- ✨ Todo List 示例（点击切换完成/未完成状态）
- ✨ 动画进度条示例（开始/暂停/重置，requestAnimationFrame 驱动）
- ✨ 项目命名为 Vuvas（/vjuːvæs/）

### 修复

- 🐛 修复布局引擎中 `width: 0` 被错误处理为未指定宽度的问题
- 🐛 增大 Canvas 高度（600 → 1000），解决内容被截断的问题

### 变更

- 🔄 模板指令前缀从 `v-` 改为 `c-`（避免与 Vue 冲突）
- 🔄 README 和 CONTRIBUTING 支持中英文切换
- 📄 添加 LICENSE、CONTRIBUTING.md、CHANGELOG.md

---

## [0.1.0] - 2026-05-29

### 新增

- 🎉 项目初始化
- ✨ Canvas 渲染引擎（矩形、文本、圆角、阴影、背景色）
- ✨ Flexbox 布局引擎（flexDirection, justifyContent, alignItems, gap）
- ✨ 事件系统（click, hover, 命中测试, 事件冒泡）
- ✨ 节点系统（CanvasNode, TextNode, ButtonNode）
- ✨ 高 DPI 屏幕适配
- ✨ Demo 页面（计数器 + 布局展示 + 交互演示）
- 📄 架构方案文档（ARCHITECTURE.md）
- 📄 任务追踪清单（TASKS.md）
- 📄 MIT 开源协议

---

## 未发布

### 计划中

- 响应式系统（ref / reactive / computed / watch）
- 虚拟节点 + Diff 算法
- 组件系统（Composition API 风格）
- 模板编译器
