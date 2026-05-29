# Vuvas

> /vjuːvæs/ — **V**(ue) + Canvas

[English](./README.md) | **中文**

<p align="center">
  <img src="./public/Vuvas.png" alt="Vuvas Logo" width="180" />
</p>

<p align="center">
  <strong>Canvas 上的 Vue</strong> —— 一个面向 Canvas 的渐进式 UI 框架
</p>

<p align="center">
  让 Web 开发者零学习成本地在 Canvas 中构建界面
</p>

<p align="center">
  <a href="https://github.com/Cyrios-ykx/Vuvas/actions/workflows/ci.yml"><img src="https://github.com/Cyrios-ykx/Vuvas/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <img src="https://img.shields.io/badge/language-TypeScript-blue.svg" alt="TypeScript" />
  <img src="https://img.shields.io/badge/status-WIP-orange.svg" alt="Work in Progress" />
</p>

<p align="center">
  <a href="https://cyrios-ykx.github.io/Vuvas/">📺 在线 Demo</a>
</p>

---

## ✨ 特性

- 🎨 **类 Vue 开发体验** — 响应式数据、组件化、模板语法，会 Vue 就会用
- 📐 **Flexbox 布局** — 像写 CSS 一样布局，不用手动计算坐标
- ⚡ **事件系统** — 点击、悬停、拖拽、键盘、触摸 — 完整的类 DOM 事件冒泡
- 🖼️ **Canvas 渲染** — 跨端一致、可导出图片、高性能自绘
- 📦 **渐进式** — 从简单命令式 API 到完整框架，按需使用
- 🔄 **响应式系统** — `ref`、`reactive`、`computed`、`watch` — 与 Vue 3 一致
- 🧩 **组件系统** — `defineComponent`、`setup()`、props、emit、slots、provide/inject
- 📝 **模板编译器** — `{{ }}`、`v-if`、`v-for`、`v-model`、`@event`、`:prop`、`v-show`
- 📄 **单文件组件** — `.vuvas` SFC，支持 `<template>`、`<script setup>`、`<style scoped>`
- 🎬 **动画** — 过渡与动画，内置缓动函数
- 🗺️ **路由** — Hash/History 模式、动态参数、导航守卫
- 🏪 **状态管理** — 类 Pinia 的状态管理，支持 `defineStore`、`$patch`、`$subscribe`
- 🔧 **Vite 插件** — `vite-plugin-vuvas`，支持 HMR 和 Source Map

## 🎯 Vuvas vs Vue：适用场景

| 场景 | Vuvas (Canvas) | Vue (DOM) |
|------|---------------|-----------|
| 可视化编辑器（Figma 类、白板、流程图） | ✅ 最佳选择 | ❌ 很痛苦 |
| 游戏 UI / 互动 H5 | ✅ 最佳选择 | ⚠️ 能力有限 |
| 图片/海报生成 | ✅ 原生导出 | ⚠️ 需要 hack |
| 大规模数据面板（1000+ 节点） | ✅ 高性能 | ⚠️ 回流问题 |
| 跨端像素级一致性 | ✅ 完全一致 | ❌ 浏览器差异 |
| 常规 Web 应用（后台、电商） | ⚠️ 杀鸡用牛刀 | ✅ 最佳选择 |
| SEO 要求高的页面 | ❌ 不可索引 | ✅ 原生支持 |
| 无障碍（屏幕阅读器） | ⚠️ 需额外工作 | ✅ 原生支持 |
| 富文本编辑 | ⚠️ 复杂 | ✅ 原生支持 |
| 表单密集型应用 | ⚠️ 能力有限 | ✅ 最佳选择 |

**一句话总结**：Vue → 「内容型」应用（信息展示、表单、标准 Web）。Vuvas → 「画布型」应用（自由定位、像素控制、图形密集、导出需求）。

> Vuvas 的最大价值不是"替代 Vue"，而是让需要 Canvas 的场景也能享受 Vue 的开发体验，降低 Canvas 应用的开发门槛。

## 🚀 快速开始

```bash
# 克隆项目
git clone https://github.com/your-username/vuvas.git
cd vuvas

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

浏览器打开 `http://localhost:3000` 即可看到 Demo。

## 📖 示例

### 命令式 API

```typescript
import { createApp, CanvasNode, TextNode, ButtonNode } from 'vuvas'

const app = createApp('#my-canvas')

// 创建一个 Flexbox 容器
const container = new CanvasNode({
  display: 'flex',
  flexDirection: 'column',
  padding: 20,
  gap: 10,
  background: '#ffffff'
})

// 添加文本
const title = new TextNode('Hello Vuvas!', {
  fontSize: 24,
  color: '#333',
  fontWeight: 'bold'
})

// 添加按钮（自带 hover 效果）
const btn = new ButtonNode('Click me', {
  padding: [8, 16],
  background: '#42b883',
  color: '#fff',
  borderRadius: 6
})

btn.on('click', () => console.log('Clicked!'))

container.append(title, btn)
app.mount(container)
```

### 单文件组件 (.vuvas)

```html
<template>
  <view :style="{ flexDirection: 'column', padding: 20, gap: 10 }">
    <text :style="{ fontSize: 24, color: '#333' }">Count: {{ count }}</text>
    <view
      @click="increment"
      :style="{ padding: [8, 16], background: '#42b883', borderRadius: 6 }"
    >
      <text :style="{ color: '#fff' }">+1</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vuvas'

const count = ref(0)
function increment() {
  count.value++
}
</script>

<style scoped>
view {
  background: #ffffff;
}
</style>
```

## 🗺️ 路线图

详见 [TASKS.md](./TASKS.md) 了解完整路线图和任务追踪。

## 🏗️ 项目结构

```
vuvas/
├── src/
│   ├── core/             # 核心引擎
│   │   ├── node.ts       # 节点定义（样式、事件）
│   │   ├── layout.ts     # Flexbox 布局引擎
│   │   ├── renderer.ts   # Canvas 渲染器
│   │   ├── event.ts      # 事件系统（命中测试 + 冒泡）
│   │   └── index.ts      # 入口 + App 类
│   ├── reactivity/       # 响应式系统（ref、reactive、computed、watch）
│   │   └── index.ts
│   ├── runtime/          # 运行时（VNode、diff、patch、组件）
│   │   ├── vnode.ts      # VNode 类型 & diff 算法
│   │   └── index.ts      # 组件系统 & 生命周期
│   ├── compiler/         # 模板编译器 & SFC
│   │   ├── index.ts      # 模板解析器 & 代码生成器
│   │   ├── sfc.ts        # .vuvas SFC 解析器
│   │   ├── sourcemap.ts  # Source Map 支持
│   │   └── vite-plugin.ts # Vite 插件（HMR）
│   ├── animation/        # 动画系统（过渡、缓动）
│   │   └── index.ts
│   ├── router/           # 路由（hash/history、守卫）
│   │   └── index.ts
│   ├── store/            # 状态管理（类 Pinia）
│   │   └── index.ts
│   ├── scheduler/        # 批量更新调度器
│   │   └── index.ts
│   └── index.ts          # 主入口 & 导出
├── demo/                 # Demo 页面
│   └── main.ts           # Demo 入口
├── ARCHITECTURE.md       # 架构方案
├── TASKS.md              # 任务追踪
├── CONTRIBUTING.md       # 贡献指南
└── CHANGELOG.md          # 变更记录
```

## 🤝 参与贡献

欢迎任何形式的贡献！请阅读 [CONTRIBUTING.zh-CN.md](./CONTRIBUTING.zh-CN.md) 了解如何参与。

## 📄 许可证

[MIT](./LICENSE) © 2026-present Cyrios-ykx
