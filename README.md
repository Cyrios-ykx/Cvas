<p align="center">
  <img src="./public/Vuvas.png" alt="Vuvas Logo" width="180" />
</p>

# Vuvas

> /vjuːvæs/ — **V**(ue) + Canvas

**English** | [中文](./README.zh-CN.md)

<p align="center">
  <strong>Vue on Canvas</strong> — A progressive UI framework for Canvas
</p>

<p align="center">
  Build interfaces in Canvas with zero learning curve for Web developers
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <img src="https://img.shields.io/badge/language-TypeScript-blue.svg" alt="TypeScript" />
  <img src="https://img.shields.io/badge/status-WIP-orange.svg" alt="Work in Progress" />
</p>

---

## ✨ Features

- 🎨 **Vue-like DX** — Reactive data, components, template syntax. If you know Vue, you know Vuvas.
- 📐 **Flexbox Layout** — Layout like CSS, no manual coordinate calculations.
- ⚡ **Event System** — Click, hover, bubbling — just like DOM events.
- 🖼️ **Canvas Rendering** — Cross-platform consistency, image export, high-performance custom drawing.
- 📦 **Progressive** — From simple imperative API to full framework, use what you need.

## 🚀 Quick Start

```bash
# Clone the project
git clone https://github.com/your-username/vuvas.git
cd vuvas

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open `http://localhost:3000` in your browser to see the Demo.

## 📖 Example

```typescript
import { createApp, CanvasNode, TextNode, ButtonNode } from 'vuvas'

const app = createApp('#my-canvas')

// Create a Flexbox container
const container = new CanvasNode({
  display: 'flex',
  flexDirection: 'column',
  padding: 20,
  gap: 10,
  background: '#ffffff'
})

// Add text
const title = new TextNode('Hello Vuvas!', {
  fontSize: 24,
  color: '#333',
  fontWeight: 'bold'
})

// Add a button (with built-in hover effect)
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

## 🗺️ Roadmap

| Phase | Content | Status |
|-------|---------|--------|
| **Phase 1** | Core Engine (Renderer + Layout + Events) + Demo | ✅ In Progress |
| **Phase 2** | Reactive Framework (ref/reactive + VNode + Component System) | 🔲 Planned |
| **Phase 3** | Template Compiler + SFC + Vite Plugin | 🔲 Planned |

See [ARCHITECTURE.md](./ARCHITECTURE.md) and [TASKS.md](./TASKS.md) for details.

## 🏗️ Project Structure

```
vuvas/
├── src/core/         # Core engine
│   ├── node.ts       # Node definitions (styles, events)
│   ├── layout.ts     # Flexbox layout engine
│   ├── renderer.ts   # Canvas renderer
│   ├── event.ts      # Event system (hit-testing + bubbling)
│   └── index.ts      # Entry + App class
├── demo/             # Demo page
│   └── main.ts       # Demo entry
├── ARCHITECTURE.md   # Architecture design
├── TASKS.md          # Task tracking
├── CONTRIBUTING.md   # Contributing guide
└── CHANGELOG.md      # Changelog
```

## 🤝 Contributing

Contributions of any kind are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) to get started.

## 📄 License

[MIT](./LICENSE) © Vuvas Contributors
