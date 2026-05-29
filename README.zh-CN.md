# Vuvas

> /vjuːvæs/ — **V**(ue) + Canvas

[English](./README.md) | **中文**

<p align="center">
  <strong>Canvas 上的 Vue</strong> —— 一个面向 Canvas 的渐进式 UI 框架
</p>

<p align="center">
  让 Web 开发者零学习成本地在 Canvas 中构建界面
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <img src="https://img.shields.io/badge/language-TypeScript-blue.svg" alt="TypeScript" />
  <img src="https://img.shields.io/badge/status-WIP-orange.svg" alt="Work in Progress" />
</p>

---

## ✨ 特性

- 🎨 **类 Vue 开发体验** — 响应式数据、组件化、模板语法，会 Vue 就会用
- 📐 **Flexbox 布局** — 像写 CSS 一样布局，不用手动计算坐标
- ⚡ **事件系统** — 点击、悬停、冒泡，和 DOM 事件一样自然
- 🖼️ **Canvas 渲染** — 跨端一致、可导出图片、高性能自绘
- 📦 **渐进式** — 从简单命令式 API 到完整框架，按需使用

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

## 🗺️ 路线图

| 阶段 | 内容 | 状态 |
|------|------|------|
| **阶段一** | 核心引擎（渲染 + 布局 + 事件）+ Demo | ✅ 进行中 |
| **阶段二** | 响应式框架（ref/reactive + VNode + 组件系统） | 🔲 计划中 |
| **阶段三** | 模板编译 + SFC + Vite 插件 | 🔲 计划中 |

详见 [ARCHITECTURE.md](./ARCHITECTURE.md) 和 [TASKS.md](./TASKS.md)。

## 🏗️ 项目结构

```
vuvas/
├── src/core/         # 核心引擎
│   ├── node.ts       # 节点定义（样式、事件）
│   ├── layout.ts     # Flexbox 布局引擎
│   ├── renderer.ts   # Canvas 渲染器
│   ├── event.ts      # 事件系统（命中测试 + 冒泡）
│   └── index.ts      # 入口 + App 类
├── demo/             # Demo 页面
│   └── main.ts       # Demo 入口
├── ARCHITECTURE.md   # 架构方案
├── TASKS.md          # 任务追踪
├── CONTRIBUTING.md   # 贡献指南
└── CHANGELOG.md      # 变更记录
```

## 🤝 参与贡献

欢迎任何形式的贡献！请阅读 [CONTRIBUTING.zh-CN.md](./CONTRIBUTING.zh-CN.md) 了解如何参与。

## 📄 许可证

[MIT](./LICENSE) © Vuvas Contributors
