# Vuvas 任务追踪清单

> **项目定位**："Canvas 上的 Vue" —— 让开发者用类 Vue 的方式（响应式、组件化、模板语法）开发渲染在 Canvas 上的 UI
>
> 最后更新：2026-05-29

## 阶段一：核心引擎 + Demo ✅ 基本完成

### 项目搭建
- [x] 创建项目结构
- [x] 配置 TypeScript + Vite
- [x] 创建 Demo 页面骨架

### 渲染引擎
- [x] 基础节点类型定义（CanvasNode）
- [x] 矩形绘制（背景色、边框、圆角）
- [x] 文本绘制（字体、颜色、对齐）
- [x] 图片绘制
- [x] 阴影效果
- [x] 渐变背景
- [x] 边框样式（dashed, dotted）

### 布局引擎
- [x] 基础盒模型（width, height, padding, margin）
- [x] Flexbox: flexDirection (row/column)
- [x] Flexbox: justifyContent (start/center/end/space-between)
- [x] Flexbox: alignItems (start/center/end/stretch)
- [x] Flexbox: gap
- [x] Flexbox: flexWrap
- [x] Flexbox: flex-grow / flex-shrink
- [x] 百分比尺寸（widthPercent / heightPercent）
- [x] auto 尺寸（文本自适应）

### 事件系统
- [x] Canvas 事件监听（mousedown, mouseup, mousemove）
- [x] Hit-testing（点击命中检测）
- [x] 事件冒泡
- [x] click 事件
- [x] hover 状态（mouseenter / mouseleave）
- [x] 拖拽事件（dragstart / drag / dragend / drop）
- [x] 键盘事件（keydown / keyup）
- [x] 触摸事件

### Demo 页面
- [x] Counter 计数器示例
- [x] 按钮 hover 效果
- [x] Flexbox 布局展示
- [x] Todo List 示例
- [x] 动画进度条示例
- [x] 嵌套布局示例

---

## 阶段二：响应式框架（类 Vue 核心）✅ 完成

> 目标：让开发者像写 Vue 组件一样写 Canvas UI

### 响应式系统（对标 Vue3 @vue/reactivity）
- [x] effect 副作用函数
- [x] reactive 响应式对象
- [x] ref 响应式引用
- [x] computed 计算属性
- [x] watch / watchEffect

### 虚拟节点（对标 Vue3 VNode）
- [x] VNode 类型定义
- [x] h() 创建函数
- [x] diff 算法
- [x] patch 更新

### 组件系统（对标 Vue3 Composition API）
- [x] defineComponent 组件定义
- [x] setup() 函数
- [x] props 传递与校验（类型校验、必填、默认值、自定义 validator）
- [x] emit 事件（声明校验）
- [x] 生命周期钩子（onMounted, onUpdated, onUnmounted）
- [x] slot 插槽（renderSlot 辅助函数）
- [x] provide / inject（原型链继承）

### 调度器
- [x] 批量更新（nextTick）
- [x] 优先级调度（SYNC / HIGH / NORMAL / LOW / IDLE）

---

## 阶段三：模板编译 + 生态（完整 Vue 体验）✅ 进行中

> 目标：让开发者写的代码看起来就像 Vue SFC，但渲染在 Canvas 上

### 模板编译器（对标 @vue/compiler-dom）
- [x] 模板解析（tokenizer + parser）
- [x] {{ }} 插值表达式
- [x] v-if / v-else 条件渲染
- [x] v-for 列表渲染
- [x] v-model 双向绑定（支持 .number / .trim 修饰符）
- [x] @event 事件绑定
- [x] :prop 动态属性
- [x] v-show 显示/隐藏

### 单文件组件（对标 .vue 文件）
- [x] .vuvas 单文件组件格式定义
- [x] `<template>` 模板块
- [x] `<script setup>` 脚本块
- [x] `<style scoped>` 样式块（CSS → 样式对象）
- [x] Vite 插件（vite-plugin-vuvas）
- [x] HMR 热更新（基础支持）
- [x] Source Map（VLQ 编码 + Source Map v3 规范）

### 扩展功能
- [x] 动画系统（transition / animate + 缓动函数）
- [x] 路由系统（canvas-router：hash/history 模式 + 动态参数 + 导航守卫）
- [x] 状态管理（类 Pinia：defineStore + $patch + $subscribe + 插件系统）
- [ ] 开发者工具（DevTools）
- [ ] 性能分析面板

### VS Code 语言扩展（vscode-vuvas）
- [x] TextMate Grammar 语法高亮（template / script / style 三块）
- [x] 语言配置（括号匹配、注释、自动闭合、折叠）
- [x] 文件图标（light / dark 主题）
- [ ] Language Server Protocol (LSP) 支持
- [ ] IntelliSense 智能补全（组件名、指令、属性）
- [ ] Diagnostics 实时错误检查
- [ ] Go to Definition 跳转定义
- [ ] Hover 悬停信息提示
- [ ] 代码格式化（Formatter）
- [ ] 代码片段（Snippets，如 `vuvas` 生成 SFC 模板）

---

## 阶段四：组件库 + 开发工具

> 目标：让框架真正可用，提供开箱即用的 UI 组件和完善的开发体验

### 组件库（对标 Element Plus / Ant Design Vue）
- [ ] Input 输入框（光标、选区、IME 输入法支持）
- [ ] Select 下拉选择
- [ ] Checkbox 复选框
- [ ] Radio 单选框
- [ ] Switch 开关
- [ ] Modal 弹窗
- [ ] Toast / Message 消息提示
- [ ] Table 表格
- [ ] Tabs 标签页
- [ ] Tooltip 工具提示
- [ ] Dropdown 下拉菜单
- [ ] Progress 进度条组件
- [ ] Slider 滑块
- [ ] 主题系统（样式 token + 主题变量）
- [ ] 暗色 / 亮色模式切换

### 表单验证（对标 VeeValidate / FormKit）
- [ ] 声明式表单校验规则
- [ ] 异步校验
- [ ] 错误消息展示

### 开发者工具（DevTools）
- [ ] 组件树查看
- [ ] 状态检查 & 实时编辑
- [ ] 事件追踪
- [ ] 性能分析面板（渲染耗时、重绘次数、帧率监控）

### CLI 脚手架（对标 create-vue）
- [ ] `create-vuvas` 命令行工具
- [ ] 项目模板选择（基础 / 带路由 / 带状态管理）
- [ ] 交互式配置

---

## 阶段五：生态完善 + 高级特性

> 目标：对齐 Vue 生态的完整能力，构建可扩展的插件体系

### 框架高级特性
- [ ] 异步组件 & Suspense（defineAsyncComponent + fallback 加载态）
- [ ] Teleport（将节点渲染到 Canvas 树的其他位置，如全局弹窗层）
- [ ] KeepAlive 缓存（路由切换时缓存组件状态 + onActivated / onDeactivated）
- [ ] 自定义指令（v-focus / v-longpress / v-tooltip 等注册机制）
- [ ] 插件系统（app.use(plugin) 注册全局组件、指令、provide）

### 国际化 i18n（对标 vue-i18n）
- [ ] `$t('key')` 翻译函数
- [ ] 语言包加载
- [ ] 动态切换语言

### HTTP 请求层（对标 VueUse useFetch）
- [ ] `useFetch` composable
- [ ] 请求 / 响应拦截器
- [ ] 加载状态管理

### Composables 工具库（对标 VueUse）
- [ ] useMousePosition
- [ ] useInterval / useTimeout
- [ ] useStorage（localStorage 持久化）
- [ ] useDraggable
- [ ] useCanvasSize
- [ ] useHitTest
- [ ] useAnimation

### 测试工具（对标 @vue/test-utils + Vitest）
- [ ] 组件单元测试工具（mount / shallowMount）
- [ ] 模拟事件触发
- [ ] 快照测试（Canvas 像素对比）

### SSR / 预渲染（对标 Nuxt）
- [ ] 服务端将组件树序列化为 Canvas 指令
- [ ] 静态图片导出（Canvas → PNG / SVG）
- [ ] PDF 导出

---

## 阶段六：Canvas 特有增强

> 目标：发挥 Canvas 的独特优势，提供 DOM 无法实现的能力

### 滚动系统
- [ ] 虚拟滚动（大列表性能优化）
- [ ] 自定义滚动条渲染
- [ ] 惯性滚动 & 回弹效果

### 文本增强
- [ ] 富文本支持（多样式文本段落、内联图片）
- [ ] 文本选择 & 复制

### 渲染增强
- [ ] Canvas 层叠（背景层 / UI 层 / 弹窗层分离）
- [ ] WebGL 渲染后端（大规模节点加速）
- [ ] 离线渲染 / 视频帧导出

### 无障碍 (Accessibility)
- [ ] 生成隐藏 DOM 映射，支持屏幕阅读器
- [ ] 键盘导航（Tab / Enter / Escape）
- [ ] ARIA 属性映射

---

## 已知问题 & 优化项

- [x] 文本换行处理（支持 maxLines / textOverflow / lineHeight）
- [x] 高 DPI 屏幕适配（devicePixelRatio）
- [x] 脏区域重绘优化（markDirty + clip 局部重绘）
- [x] 离屏 Canvas 缓存（cacheNode / clearCache）
