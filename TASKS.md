# Vuvas 任务追踪清单

> **项目定位**："Canvas 上的 Vue" —— 让开发者用类 Vue 的方式（响应式、组件化、模板语法）开发渲染在 Canvas 上的 UI
>
> 最后更新：2026-05-29

## 阶段一：核心引擎 + Demo ✅ 进行中

### 项目搭建
- [x] 创建项目结构
- [x] 配置 TypeScript + Vite
- [x] 创建 Demo 页面骨架

### 渲染引擎
- [x] 基础节点类型定义（CanvasNode）
- [x] 矩形绘制（背景色、边框、圆角）
- [x] 文本绘制（字体、颜色、对齐）
- [ ] 图片绘制
- [ ] 阴影效果
- [ ] 渐变背景
- [ ] 边框样式（dashed, dotted）

### 布局引擎
- [x] 基础盒模型（width, height, padding, margin）
- [x] Flexbox: flexDirection (row/column)
- [x] Flexbox: justifyContent (start/center/end/space-between)
- [x] Flexbox: alignItems (start/center/end/stretch)
- [x] Flexbox: gap
- [ ] Flexbox: flexWrap
- [ ] Flexbox: flex-grow / flex-shrink
- [ ] 百分比尺寸
- [ ] auto 尺寸（文本自适应）

### 事件系统
- [x] Canvas 事件监听（mousedown, mouseup, mousemove）
- [x] Hit-testing（点击命中检测）
- [x] 事件冒泡
- [x] click 事件
- [x] hover 状态（mouseenter / mouseleave）
- [ ] 拖拽事件
- [ ] 键盘事件
- [ ] 触摸事件

### Demo 页面
- [x] Counter 计数器示例
- [x] 按钮 hover 效果
- [x] Flexbox 布局展示
- [ ] Todo List 示例
- [ ] 动画进度条示例
- [ ] 嵌套布局示例

---

## 阶段二：响应式框架（类 Vue 核心）🔲 待开始

> 目标：让开发者像写 Vue 组件一样写 Canvas UI

### 响应式系统（对标 Vue3 @vue/reactivity）
- [ ] effect 副作用函数
- [ ] reactive 响应式对象
- [ ] ref 响应式引用
- [ ] computed 计算属性
- [ ] watch / watchEffect

### 虚拟节点（对标 Vue3 VNode）
- [ ] VNode 类型定义
- [ ] h() 创建函数
- [ ] diff 算法
- [ ] patch 更新

### 组件系统（对标 Vue3 Composition API）
- [ ] defineComponent 组件定义
- [ ] setup() 函数
- [ ] props 传递与校验
- [ ] emit 事件
- [ ] 生命周期钩子（onMounted, onUpdated, onUnmounted）
- [ ] slot 插槽
- [ ] provide / inject

### 调度器
- [ ] 批量更新（nextTick）
- [ ] 优先级调度

---

## 阶段三：模板编译 + 生态（完整 Vue 体验）🔲 待开始

> 目标：让开发者写的代码看起来就像 Vue SFC，但渲染在 Canvas 上

### 模板编译器（对标 @vue/compiler-dom）
- [ ] 模板解析（tokenizer + parser）
- [ ] {{ }} 插值表达式
- [ ] v-if / v-else 条件渲染
- [ ] v-for 列表渲染
- [ ] v-model 双向绑定
- [ ] @event 事件绑定
- [ ] :prop 动态属性
- [ ] v-show 显示/隐藏

### 单文件组件（对标 .vue 文件）
- [ ] .hic 单文件组件格式定义
- [ ] `<template>` 模板块
- [ ] `<script setup>` 脚本块
- [ ] `<style scoped>` 样式块
- [ ] Vite 插件（vite-plugin-hic）
- [ ] HMR 热更新
- [ ] Source Map

### 扩展功能
- [ ] 动画系统（transition / animation）
- [ ] 路由系统（canvas-router）
- [ ] 状态管理（类 Pinia）
- [ ] 开发者工具（DevTools）
- [ ] 性能分析面板

---

## 已知问题 & 优化项

- [ ] 文本换行处理
- [ ] 高 DPI 屏幕适配（devicePixelRatio）
- [ ] 脏区域重绘优化（避免全量重绘）
- [ ] 离屏 Canvas 缓存
