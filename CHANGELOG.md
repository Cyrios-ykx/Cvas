# 变更记录

所有重要的变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [1.1.0] - 2026-05-29

### 新增

- ✨ **Source Map 支持**（`src/compiler/sourcemap.ts`）
  - 完整的 VLQ（Variable-Length Quantity）编码实现
  - `SourceMapBuilder` 增量构建器（逐行添加映射）
  - 符合 Source Map v3 规范输出
  - `generateSFCSourceMap()` 为 .vuvas 文件生成映射
  - 支持内联 Source Map（data URL 格式）
  - Vite 插件自动生成并传递 Source Map
- ✨ **SFC 模板编译 Demo 卡片**
  - 展示 .vuvas 文件的实时编译结果
  - 显示 SFC 源码预览（代码高亮风格）
  - 展示模板 → 渲染函数的编译产物
  - 显示 Source Map 生成状态和元信息

---

## [1.0.0] - 2026-05-29

### 新增

- 🎉 **路由系统**（`src/router/`）
  - `createRouter()` 创建路由器实例
  - 支持 hash 和 history 两种路由模式
  - 动态路由参数匹配（`:id` 语法）
  - 查询参数解析
  - `push()` / `replace()` / `back()` / `forward()` 导航方法
  - `beforeEach()` 全局前置守卫
  - `afterEach()` 全局后置钩子
  - 路由重定向
  - 子路由支持
  - `useRoute()` / `useRouter()` 组合式 API
  - 响应式 `currentRoute`
- 🎉 **状态管理**（`src/store/`，类 Pinia）
  - `defineStore()` 组合式 API 风格定义 Store
  - 响应式 state + getters + actions
  - `$reset()` 重置到初始状态
  - `$patch()` 批量更新（支持对象和函数两种形式）
  - `$subscribe()` 订阅 state 变化
  - `$onAction()` 订阅 action 调用（支持 after/onError 钩子）
  - 全局插件系统 `addStorePlugin()`
  - Store 缓存（单例模式）

---

## [0.9.0] - 2026-05-29

### 新增

- ✨ **Flexbox: flexWrap**（`src/core/layout.ts`）
  - 支持 `flexWrap: 'wrap'`，子元素超出容器时自动换行/换列
  - 水平方向换行 + 垂直方向换列
- ✨ **百分比尺寸**
  - `widthPercent` / `heightPercent`（0~1 表示百分比，如 0.5 = 50%）
  - 基于父容器可用空间计算
- ✨ **auto 尺寸（文本自适应）**
  - 文本节点/按钮节点未指定尺寸时自动根据内容计算宽高
  - 支持百分比与 auto 混合使用
- ✨ **优先级调度器**（`src/scheduler/`）
  - 5 级优先级：SYNC > HIGH > NORMAL > LOW > IDLE
  - `queueHighPriorityJob()` 动画帧级别
  - `queueLowPriorityJob()` 后台任务
  - `queueIdleJob()` 空闲时执行（requestIdleCallback）
  - 任务按优先级排序 + 去重
- ✨ **脏区域重绘优化**（`src/core/renderer.ts`）
  - `markDirty(x, y, w, h)` 标记需要重绘的区域
  - `markNodeDirty(node)` 标记节点脏区域（自动扩展阴影范围）
  - 使用 `clip()` 裁剪仅重绘脏区域，避免全量重绘
- ✨ **离屏 Canvas 缓存**
  - `cacheNode(node)` 将静态子树缓存到离屏 Canvas
  - `clearCache(node)` / `clearAllCache()` 缓存管理
  - 基于版本号自动失效过期缓存
  - 缓存命中时直接 `drawImage`，跳过递归渲染
- ✨ **节点级透明度** — `opacity` 属性在渲染层正确处理

---

## [0.8.0] - 2026-05-29

### 新增

- ✨ **动画系统**（`src/animation/`）
  - `transition()` 过渡动画（属性插值 + 缓动函数）
  - `animate()` 关键帧动画（多帧 + 循环 + 方向控制）
  - 7 种内置缓动函数：linear, ease-in, ease-out, ease-in-out, ease, bounce, elastic
  - 支持 delay、iterations、direction、fill 选项
  - 可取消动画 + Promise 完成通知
- ✨ **文本换行处理**
  - 支持 `whiteSpace: 'normal'`（自动换行）/ `'nowrap'`（不换行）
  - `lineHeight` 行高控制
  - `maxLines` 最大行数限制
  - `textOverflow: 'ellipsis'` 溢出省略号
  - 精确的 `measureText` 换行计算
- ✨ **拖拽事件**
  - `dragstart` / `drag` / `dragend` / `drop` 事件
  - 5px 移动阈值防误触
- ✨ **键盘事件**
  - `keydown` / `keyup` 事件
  - 支持 key, code, ctrlKey, shiftKey, altKey, metaKey
  - Canvas 自动设置 tabindex 可聚焦
- ✨ **opacity 透明度** 支持

---

## [0.7.0] - 2026-05-29

### 新增

- ✨ **v-model 双向绑定**
  - 编译器支持 `v-model` 指令
  - 支持 `.number` 修饰符（自动转数字）
  - 支持 `.trim` 修饰符（自动去空格）
  - 生成 `value` 绑定 + `onInput` 事件更新
- ✨ **单文件组件（SFC）系统**
  - `.vuvas` 文件格式定义
  - SFC 解析器（`parseSFC`）：解析 template/script/style 块
  - SFC 编译器（`compileSFC`）：编译为可执行 JS 模块
  - `<template>` 模板块解析
  - `<script setup>` 支持（自动提取 import、生成 defineComponent）
  - `<style scoped>` 样式块（CSS → 样式对象转换）
  - 支持块属性解析（lang, scoped, setup 等）
- ✨ **Vite 插件**（`vite-plugin-vuvas`）
  - `.vuvas` 文件自动编译
  - HMR 热更新基础支持
  - 编译错误友好提示

---

## [0.6.0] - 2026-05-29

### 新增

- ✨ **组件系统完善**
  - Props 校验系统（类型校验、必填、默认值、自定义 validator）
  - emit 事件声明与校验
  - `provide` / `inject` 跨层级依赖注入（原型链继承）
  - `slot` 插槽 + `renderSlot()` 辅助函数
  - `attrs` 非 props 属性透传
- ✨ **模板编译器**（阶段三核心）
  - Tokenizer 词法分析器
  - Parser 语法分析器（生成 AST）
  - Code Generator 代码生成器（AST → 渲染函数）
  - `{{ }}` 插值表达式
  - `v-if` 条件渲染
  - `v-for` 列表渲染（支持 `(item, index) in list`）
  - `v-show` 显示/隐藏
  - `@event` 事件绑定简写
  - `:prop` 动态属性绑定
  - `compile()` 公共 API
  - `parseTemplate()` 仅解析 AST

---

## [0.5.0] - 2026-05-29

### 新增

- ✨ **虚拟节点系统（VNode）**
  - `VNode` 类型定义（type, props, children, key）
  - `h()` 创建函数（类似 Vue3 的 h）
  - `createNode()` 首次挂载（VNode → CanvasNode）
  - `patch()` diff + 最小化更新
  - 基于 key 的子节点对比算法
- ✨ **组件系统**
  - `defineComponent()` 组件定义
  - `setup()` 函数（Composition API 风格）
  - `onMounted` / `onUpdated` / `onUnmounted` 生命周期钩子
  - 响应式 effect 驱动组件自动更新
- ✨ **调度器**
  - `nextTick()` 微任务调度
  - `queueJob()` 批量更新队列（去重 + 合并）

---

## [0.4.0] - 2026-05-29

### 新增

- ✨ **响应式系统**（阶段二核心）
  - `effect` 副作用函数（依赖追踪 + 自动重执行）
  - `reactive` 响应式对象（Proxy 深层代理）
  - `ref` 响应式引用（基本类型包装）
  - `computed` 计算属性（惰性求值 + 缓存）
  - `watch` / `watchEffect` 侦听器
- ✨ **Flexbox flex-grow / flex-shrink** 支持
  - 剩余空间按 flexGrow 比例分配
  - 溢出空间按 flexShrink 比例收缩
- ✨ 响应式系统 Demo 示例（温度计：ref + computed + watchEffect 驱动 UI）

---

## [0.3.0] - 2026-05-29

### 新增

- ✨ 渐变背景支持（线性渐变，支持 to right/bottom/left/top 方向）
- ✨ 边框样式支持（solid / dashed / dotted）
- ✨ 图片节点 ImageNode（支持 objectFit: cover/contain/fill + 圆角裁剪）
- ✨ 触摸事件支持（touchstart / touchmove / touchend，支持触摸滚动）
- ✨ 嵌套布局示例（渐变 + 边框 + 多层嵌套 Flexbox）
- ✨ 滚动系统（鼠标滚轮 + 触摸滑动，视口裁剪优化）

### 变更

- 🔄 模板指令前缀改回 `v-`（与 Vue 保持一致）
- 🔄 项目名确定为 Vuvas

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
