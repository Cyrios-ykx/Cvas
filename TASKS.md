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
- [ ] Source Map

### 扩展功能
- [x] 动画系统（transition / animate + 缓动函数）
- [x] 路由系统（canvas-router：hash/history 模式 + 动态参数 + 导航守卫）
- [x] 状态管理（类 Pinia：defineStore + $patch + $subscribe + 插件系统）
- [ ] 开发者工具（DevTools）
- [ ] 性能分析面板

---

## 已知问题 & 优化项

- [x] 文本换行处理（支持 maxLines / textOverflow / lineHeight）
- [x] 高 DPI 屏幕适配（devicePixelRatio）
- [x] 脏区域重绘优化（markDirty + clip 局部重绘）
- [x] 离屏 Canvas 缓存（cacheNode / clearCache）
