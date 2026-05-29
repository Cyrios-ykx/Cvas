import { createApp, CanvasNode, TextNode } from '../src'
import {
  createHeader,
  createCounterCard,
  createLayoutCard,
  createTodoCard,
  createProgressCard,
  createNestedCard,
  createReactiveCard,
  createErrorCard
} from './cards'

// ============================================================
// Vuvas Demo
// 展示：Flexbox 布局 + 事件交互 + hover 效果 + 计数器
// ============================================================

const app = createApp('#app')

// --- 根容器 ---
const root = new CanvasNode({
  display: 'flex',
  flexDirection: 'column',
  padding: 30,
  gap: 20,
  background: '#f8f9fa'
})

// --- 各卡片 ---
const header = createHeader()
const counterCard = createCounterCard(app)
const layoutCard = createLayoutCard()
const todoCard = createTodoCard(app)
const progressCard = createProgressCard(app)
const nestedCard = createNestedCard()
const reactiveCard = createReactiveCard(app)
const errorCard = createErrorCard()

// --- 交互提示卡片 ---
const infoCard = new CanvasNode({
  display: 'flex',
  flexDirection: 'row',
  padding: [16, 24],
  background: '#e8f5e9',
  borderRadius: 12,
  gap: 12,
  alignItems: 'center',
  height: 56
})

const infoText = new TextNode('💡 试试点击按钮、Todo项、悬停在彩色方块上查看交互效果！', {
  fontSize: 14,
  color: '#2e7d32',
  textAlign: 'left'
})

infoCard.append(infoText)

// --- 组装并挂载 ---
root.append(header, counterCard, layoutCard, todoCard, progressCard, nestedCard, reactiveCard, errorCard, infoCard)
app.mount(root)

console.log('✅ Vuvas Demo 已启动!')
