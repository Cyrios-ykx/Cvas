import { createApp, CanvasNode, TextNode, ButtonNode } from '../src'

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

// --- 标题区域 ---
const header = new CanvasNode({
  display: 'flex',
  flexDirection: 'column',
  padding: [20, 24],
  background: '#ffffff',
  borderRadius: 12,
  gap: 8,
  shadowColor: 'rgba(0,0,0,0.08)',
  shadowBlur: 12,
  shadowOffsetY: 4
})

const title = new TextNode('🎨 Vuvas', {
  fontSize: 28,
  fontWeight: 'bold',
  color: '#1a1a2e',
  textAlign: 'left'
})

const subtitle = new TextNode('Canvas 上的 Vue — 响应式 + 组件化 + Flexbox 布局 + 事件系统', {
  fontSize: 14,
  color: '#666666',
  textAlign: 'left'
})

header.append(title, subtitle)

// --- 计数器卡片 ---
const counterCard = new CanvasNode({
  display: 'flex',
  flexDirection: 'column',
  padding: [20, 24],
  background: '#ffffff',
  borderRadius: 12,
  gap: 16,
  shadowColor: 'rgba(0,0,0,0.08)',
  shadowBlur: 12,
  shadowOffsetY: 4
})

const counterTitle = new TextNode('📊 Counter 计数器', {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#333',
  textAlign: 'left'
})

// 计数器值
let count = 0
const counterValue = new TextNode(`当前值: ${count}`, {
  fontSize: 20,
  color: '#42b883',
  fontWeight: 'bold',
  textAlign: 'left'
})

// 按钮行
const buttonRow = new CanvasNode({
  display: 'flex',
  flexDirection: 'row',
  gap: 12,
  height: 40,
  alignItems: 'center'
})

const btnAdd = new ButtonNode('+1', {
  padding: [8, 20],
  background: '#42b883',
  color: '#fff',
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 'bold',
  cursor: 'pointer'
})
btnAdd.hoverStyle = { background: '#369970' }

const btnSubtract = new ButtonNode('-1', {
  padding: [8, 20],
  background: '#e74c3c',
  color: '#fff',
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 'bold',
  cursor: 'pointer'
})
btnSubtract.hoverStyle = { background: '#c0392b' }

const btnReset = new ButtonNode('Reset', {
  padding: [8, 20],
  background: '#95a5a6',
  color: '#fff',
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 'bold',
  cursor: 'pointer'
})
btnReset.hoverStyle = { background: '#7f8c8d' }

// 更新计数器显示
function updateCounter() {
  counterValue.text = `当前值: ${count}`
  app.scheduleRender()
}

// 绑定事件
btnAdd.on('click', () => {
  count++
  updateCounter()
})

btnSubtract.on('click', () => {
  count--
  updateCounter()
})

btnReset.on('click', () => {
  count = 0
  updateCounter()
})

buttonRow.append(btnAdd, btnSubtract, btnReset)
counterCard.append(counterTitle, counterValue, buttonRow)

// --- 布局演示卡片 ---
const layoutCard = new CanvasNode({
  display: 'flex',
  flexDirection: 'column',
  padding: [20, 24],
  background: '#ffffff',
  borderRadius: 12,
  gap: 16,
  shadowColor: 'rgba(0,0,0,0.08)',
  shadowBlur: 12,
  shadowOffsetY: 4
})

const layoutTitle = new TextNode('📐 Flexbox 布局演示', {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#333',
  textAlign: 'left'
})

// Flex row 演示
const flexRow = new CanvasNode({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 10,
  height: 50,
  padding: [10, 16],
  background: '#eef2ff',
  borderRadius: 8
})

const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316']
for (let i = 0; i < 5; i++) {
  const box = new CanvasNode({
    width: 40,
    height: 30,
    background: colors[i],
    borderRadius: 4
  })
  box.hoverStyle = { borderRadius: 12 }
  flexRow.append(box)
}

// Flex column 演示
const flexColContainer = new CanvasNode({
  display: 'flex',
  flexDirection: 'row',
  gap: 12,
  height: 120
})

const flexCol1 = new CanvasNode({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  width: 120,
  padding: 10,
  background: '#f0fdf4',
  borderRadius: 8,
  gap: 6
})

for (let i = 0; i < 3; i++) {
  flexCol1.append(new CanvasNode({
    height: 24,
    background: '#22c55e',
    borderRadius: 4
  }))
}

const flexCol2 = new CanvasNode({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  width: 120,
  padding: 10,
  background: '#fef3c7',
  borderRadius: 8,
  gap: 6
})

for (let i = 0; i < 3; i++) {
  flexCol2.append(new CanvasNode({
    width: 60,
    height: 24,
    background: '#f59e0b',
    borderRadius: 4
  }))
}

const flexCol3 = new CanvasNode({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  width: 120,
  padding: 10,
  background: '#fce4ec',
  borderRadius: 8,
  gap: 6
})

for (let i = 0; i < 3; i++) {
  flexCol3.append(new CanvasNode({
    height: 24,
    background: '#e91e63',
    borderRadius: 4
  }))
}

flexColContainer.append(flexCol1, flexCol2, flexCol3)
layoutCard.append(layoutTitle, flexRow, flexColContainer)

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

const infoText = new TextNode('💡 试试点击按钮、悬停在彩色方块上查看交互效果！', {
  fontSize: 14,
  color: '#2e7d32',
  textAlign: 'left'
})

infoCard.append(infoText)

// --- 组装并挂载 ---
root.append(header, counterCard, layoutCard, infoCard)
app.mount(root)

console.log('✅ Vuvas Demo 已启动!')
