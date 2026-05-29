import { createApp, CanvasNode, TextNode, ButtonNode, queueJob } from '../src'
import { ref, computed, watchEffect } from '../src/reactivity'

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

const subtitle = new TextNode('Canvas-based UI Framework with Vue-like DX', {
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
const counterValue = new TextNode(`计数器: ${count}`, {
  fontSize: 20,
  color: '#42b883',
  fontWeight: 'bold',
  textAlign: 'left'
})

// 计数器状态（与 App.vuvas 的 computed 对齐）
function getCounterStatus(n: number): string {
  if (n === 0) return '😐 初始状态'
  if (n > 0) return '😊 正数'
  return '😢 负数'
}
const counterStatus = new TextNode(`状态: ${getCounterStatus(count)}`, {
  fontSize: 14,
  color: '#666',
  textAlign: 'left'
})

// 按钮行
const buttonRow = new CanvasNode({
  display: 'flex',
  flexDirection: 'row',
  gap: 12,
  alignItems: 'center'
})

const btnAdd = new ButtonNode('+1', {
  padding: [8, 20],
  background: '#42b883',
  color: '#fff',
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 'bold',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  flexShrink: 0
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
  counterValue.text = `计数器: ${count}`
  counterStatus.text = `状态: ${getCounterStatus(count)}`
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
counterCard.append(counterTitle, counterValue, counterStatus, buttonRow)

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
  gap: 12
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

// --- Todo List 卡片 ---
const todoCard = new CanvasNode({
  display: 'flex',
  flexDirection: 'column',
  padding: [20, 24],
  background: '#ffffff',
  borderRadius: 12,
  gap: 12,
  shadowColor: 'rgba(0,0,0,0.08)',
  shadowBlur: 12,
  shadowOffsetY: 4
})

const todoTitle = new TextNode('📝 Todo List', {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#333',
  textAlign: 'left'
})

// Todo 数据（与 App.vuvas 保持一致）
const todos = [
  { text: '学习 Vuvas', done: true },
  { text: '编写 .vuvas 组件', done: true },
  { text: '发布 1.0 版本', done: false }
]

// 创建 Todo 项
const todoItems: { row: CanvasNode; label: TextNode; done: boolean }[] = []

for (const todo of todos) {
  const row = new CanvasNode({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: [6, 12],
    background: todo.done ? '#f0fdf4' : '#fafafa',
    borderRadius: 6,
    cursor: 'pointer'
  })
  row.hoverStyle = { background: todo.done ? '#dcfce7' : '#f0f0f0' }

  const checkbox = new TextNode(todo.done ? '✅' : '⬜', {
    fontSize: 16,
    textAlign: 'left'
  })

  const label = new TextNode(todo.text, {
    fontSize: 14,
    color: todo.done ? '#16a34a' : '#333333',
    textAlign: 'left'
  })

  row.append(checkbox, label)
  todoItems.push({ row, label, done: todo.done })

  // 点击切换完成状态
  row.on('click', () => {
    const item = todoItems.find(t => t.row === row)!
    item.done = !item.done
    // 更新显示
    checkbox.text = item.done ? '✅' : '⬜'
    item.label.setStyle({ color: item.done ? '#16a34a' : '#333333' })
    row.setStyle({ background: item.done ? '#f0fdf4' : '#fafafa' })
    row.hoverStyle = { background: item.done ? '#dcfce7' : '#f0f0f0' }
    app.scheduleRender()
  })

  todoCard.append(row)
}

// 在最前面插入标题
todoCard.children.unshift(todoTitle)
todoTitle.parent = todoCard

// --- 动画进度条卡片 ---
const progressCard = new CanvasNode({
  display: 'flex',
  flexDirection: 'column',
  padding: [20, 24],
  background: '#ffffff',
  borderRadius: 12,
  gap: 14,
  shadowColor: 'rgba(0,0,0,0.08)',
  shadowBlur: 12,
  shadowOffsetY: 4
})

const progressTitle = new TextNode('🚀 动画进度条', {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#333',
  textAlign: 'left'
})

// 进度条背景
const progressBg = new CanvasNode({
  display: 'flex',
  flexDirection: 'row',
  height: 24,
  background: '#e5e7eb',
  borderRadius: 12
})

// 进度条填充
const progressFill = new CanvasNode({
  width: 0,
  height: 24,
  background: '#6366f1',
  borderRadius: 12
})

progressBg.append(progressFill)

// 进度文本
const progressText = new TextNode('0%', {
  fontSize: 14,
  color: '#6366f1',
  fontWeight: 'bold',
  textAlign: 'left'
})

// 控制按钮行
const progressBtnRow = new CanvasNode({
  display: 'flex',
  flexDirection: 'row',
  gap: 12,
  alignItems: 'center'
})

const btnStart = new ButtonNode('开始', {
  padding: [6, 16],
  background: '#6366f1',
  color: '#fff',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 'bold',
  cursor: 'pointer'
})
btnStart.hoverStyle = { background: '#4f46e5' }

const btnPause = new ButtonNode('暂停', {
  padding: [6, 16],
  background: '#f59e0b',
  color: '#fff',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 'bold',
  cursor: 'pointer'
})
btnPause.hoverStyle = { background: '#d97706' }

const btnResetProgress = new ButtonNode('重置', {
  padding: [6, 16],
  background: '#ef4444',
  color: '#fff',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 'bold',
  cursor: 'pointer'
})
btnResetProgress.hoverStyle = { background: '#dc2626' }

progressBtnRow.append(btnStart, btnPause, btnResetProgress)
progressCard.append(progressTitle, progressBg, progressText, progressBtnRow)

// 进度条动画逻辑
let progress = 0
let animating = false
let animationId: number | null = null

function animateProgress() {
  if (!animating) return
  progress += 0.5
  if (progress >= 100) {
    progress = 100
    animating = false
  }
  // 更新进度条宽度（基于父容器宽度的百分比）
  const maxWidth = progressBg.layout.width || 300
  progressFill.setLayoutStyle({ width: (progress / 100) * maxWidth })
  progressText.text = `${Math.round(progress)}%`
  app.scheduleRender()

  if (animating) {
    animationId = requestAnimationFrame(animateProgress)
  }
}

btnStart.on('click', () => {
  if (!animating && progress < 100) {
    animating = true
    animateProgress()
  }
})

btnPause.on('click', () => {
  animating = false
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
})

btnResetProgress.on('click', () => {
  animating = false
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  progress = 0
  progressFill.setLayoutStyle({ width: 0 })
  progressText.text = '0%'
  app.scheduleRender()
})

// --- 嵌套布局 + 渐变 + 边框样式卡片 ---
const nestedCard = new CanvasNode({
  display: 'flex',
  flexDirection: 'column',
  padding: [20, 24],
  background: '#ffffff',
  borderRadius: 12,
  gap: 14,
  shadowColor: 'rgba(0,0,0,0.08)',
  shadowBlur: 12,
  shadowOffsetY: 4
})

const nestedTitle = new TextNode('🎯 嵌套布局 + 渐变 + 边框', {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#333',
  textAlign: 'left'
})

// 渐变背景展示行
const gradientRow = new CanvasNode({
  display: 'flex',
  flexDirection: 'row',
  gap: 10,
  alignItems: 'stretch'
})

const grad1 = new CanvasNode({
  width: 100,
  height: 50,
  background: { type: 'linear', direction: 'to right', colors: ['#667eea', '#764ba2'] },
  borderRadius: 8
})

const grad2 = new CanvasNode({
  width: 100,
  height: 50,
  background: { type: 'linear', direction: 'to bottom', colors: ['#f093fb', '#f5576c'] },
  borderRadius: 8
})

const grad3 = new CanvasNode({
  width: 100,
  height: 50,
  background: { type: 'linear', direction: 'to right', colors: ['#4facfe', '#00f2fe'] },
  borderRadius: 8
})

const grad4 = new CanvasNode({
  width: 100,
  height: 50,
  background: { type: 'linear', direction: 'to right', colors: ['#43e97b', '#38f9d7'] },
  borderRadius: 8
})

gradientRow.append(grad1, grad2, grad3, grad4)

// 边框样式展示行
const borderRow = new CanvasNode({
  display: 'flex',
  flexDirection: 'row',
  gap: 10,
  alignItems: 'stretch'
})

const borderSolid = new CanvasNode({
  width: 130,
  height: 50,
  borderColor: '#6366f1',
  borderWidth: 2,
  borderStyle: 'solid',
  borderRadius: 8
})

const borderDashed = new CanvasNode({
  width: 130,
  height: 50,
  borderColor: '#ec4899',
  borderWidth: 2,
  borderStyle: 'dashed',
  borderRadius: 8
})

const borderDotted = new CanvasNode({
  width: 130,
  height: 50,
  borderColor: '#f59e0b',
  borderWidth: 2,
  borderStyle: 'dotted',
  borderRadius: 8
})

borderRow.append(borderSolid, borderDashed, borderDotted)

// 嵌套布局展示
const nestedLayout = new CanvasNode({
  display: 'flex',
  flexDirection: 'row',
  gap: 10
})

// 左侧面板
const leftPanel = new CanvasNode({
  display: 'flex',
  flexDirection: 'column',
  width: 200,
  padding: 10,
  gap: 8,
  background: { type: 'linear', direction: 'to bottom', colors: ['#e0e7ff', '#c7d2fe'] },
  borderRadius: 8
})

const leftHeader = new TextNode('左侧面板', {
  fontSize: 12,
  fontWeight: 'bold',
  color: '#4338ca',
  textAlign: 'left'
})

const leftContent = new CanvasNode({
  display: 'flex',
  flexDirection: 'row',
  gap: 6,
  height: 30,
  alignItems: 'stretch'
})

for (let i = 0; i < 3; i++) {
  leftContent.append(new CanvasNode({
    width: 30,
    background: '#6366f1',
    borderRadius: 4
  }))
}

leftPanel.append(leftHeader, leftContent)

// 右侧面板
const rightPanel = new CanvasNode({
  display: 'flex',
  flexDirection: 'column',
  width: 200,
  padding: 10,
  gap: 8,
  background: { type: 'linear', direction: 'to bottom', colors: ['#fef3c7', '#fde68a'] },
  borderRadius: 8
})

const rightHeader = new TextNode('右侧面板', {
  fontSize: 12,
  fontWeight: 'bold',
  color: '#92400e',
  textAlign: 'left'
})

const rightContent = new CanvasNode({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  alignItems: 'stretch'
})

for (let i = 0; i < 3; i++) {
  rightContent.append(new CanvasNode({
    height: 14,
    background: '#f59e0b',
    borderRadius: 3
  }))
}

rightPanel.append(rightHeader, rightContent)

nestedLayout.append(leftPanel, rightPanel)
nestedCard.append(nestedTitle, gradientRow, borderRow, nestedLayout)

// --- 响应式系统展示卡片 ---
const reactiveCard = new CanvasNode({
  display: 'flex',
  flexDirection: 'column',
  padding: [20, 24],
  background: '#ffffff',
  borderRadius: 12,
  gap: 14,
  shadowColor: 'rgba(0,0,0,0.08)',
  shadowBlur: 12,
  shadowOffsetY: 4
})

const reactiveTitle = new TextNode('⚡ 响应式系统 (ref + computed + watchEffect)', {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#333',
  textAlign: 'left'
})

// 使用响应式数据驱动 UI
const temperature = ref(20)
const status = computed(() => {
  const t = temperature.value
  if (t < 0) return '❄️ 冰冻'
  if (t < 15) return '🌬️ 寒冷'
  if (t < 25) return '☀️ 舒适'
  if (t < 35) return '🔥 炎热'
  return '🌡️ 酷热'
})

const tempDisplay = new TextNode(`温度: ${temperature.value}°C — ${status.value}`, {
  fontSize: 16,
  color: '#6366f1',
  fontWeight: 'bold',
  textAlign: 'left'
})

// watchEffect: 温度变化时自动更新显示
watchEffect(() => {
  tempDisplay.text = `温度: ${temperature.value}°C — ${status.value}`
  app.scheduleRender()
})

// 温度控制按钮
const tempBtnRow = new CanvasNode({
  display: 'flex',
  flexDirection: 'row',
  gap: 10,
  alignItems: 'center'
})

const btnTempUp = new ButtonNode('+5°C', {
  padding: [6, 14],
  background: '#ef4444',
  color: '#fff',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 'bold',
  cursor: 'pointer'
})
btnTempUp.hoverStyle = { background: '#dc2626' }

const btnTempDown = new ButtonNode('-5°C', {
  padding: [6, 14],
  background: '#3b82f6',
  color: '#fff',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 'bold',
  cursor: 'pointer'
})
btnTempDown.hoverStyle = { background: '#2563eb' }

const btnTempReset = new ButtonNode('20°C', {
  padding: [6, 14],
  background: '#8b5cf6',
  color: '#fff',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 'bold',
  cursor: 'pointer'
})
btnTempReset.hoverStyle = { background: '#7c3aed' }

btnTempUp.on('click', () => { temperature.value += 5 })
btnTempDown.on('click', () => { temperature.value -= 5 })
btnTempReset.on('click', () => { temperature.value = 20 })

tempBtnRow.append(btnTempUp, btnTempDown, btnTempReset)

const reactiveHint = new TextNode('↑ 点击按钮修改 ref 值，watchEffect 自动更新 UI', {
  fontSize: 12,
  color: '#999',
  textAlign: 'left'
})

reactiveCard.append(reactiveTitle, tempDisplay, tempBtnRow, reactiveHint)



// --- 错误处理测试卡片 ---
const errorCard = new CanvasNode({
  display: 'flex',
  flexDirection: 'column',
  padding: [20, 24],
  background: '#ffffff',
  borderRadius: 12,
  gap: 14,
  shadowColor: 'rgba(0,0,0,0.08)',
  shadowBlur: 12,
  shadowOffsetY: 4
})

const errorTitle = new TextNode('🚨 错误处理测试', {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#333',
  textAlign: 'left'
})

const errorHint = new TextNode('点击下方按钮触发不同类型的错误，观察控制台输出', {
  fontSize: 13,
  color: '#666',
  textAlign: 'left'
})

const errorBtnRow1 = new CanvasNode({
  display: 'flex',
  flexDirection: 'row',
  gap: 10,
  alignItems: 'center'
})

// 按钮1：事件回调中抛错
const btnEventError = new ButtonNode('事件回调报错', {
  padding: [6, 14],
  background: '#ef4444',
  color: '#fff',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 'bold',
  cursor: 'pointer'
})
btnEventError.hoverStyle = { background: '#dc2626' }
btnEventError.on('click', () => {
  throw new Error('这是一个事件回调中的测试错误！')
})

// 按钮2：访问 undefined 属性
const btnTypeError = new ButtonNode('TypeError', {
  padding: [6, 14],
  background: '#f97316',
  color: '#fff',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 'bold',
  cursor: 'pointer'
})
btnTypeError.hoverStyle = { background: '#ea580c' }
btnTypeError.on('click', () => {
  const obj: any = null
  obj.foo.bar // TypeError: Cannot read properties of null
})

// 按钮3：异步错误（调度器中）
const btnAsyncError = new ButtonNode('调度器报错', {
  padding: [6, 14],
  background: '#8b5cf6',
  color: '#fff',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 'bold',
  cursor: 'pointer'
})
btnAsyncError.hoverStyle = { background: '#7c3aed' }

btnAsyncError.on('click', () => {
  queueJob(() => {
    throw new Error('这是调度器任务中的测试错误！')
  })
})

// 按钮4：自定义错误信息
const btnCustomError = new ButtonNode('自定义Error', {
  padding: [6, 14],
  background: '#06b6d4',
  color: '#fff',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 'bold',
  cursor: 'pointer'
})
btnCustomError.hoverStyle = { background: '#0891b2' }
btnCustomError.on('click', () => {
  class VuvasCustomError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'VuvasCustomError'
    }
  }
  throw new VuvasCustomError('自定义错误类型测试 — 业务逻辑异常')
})

errorBtnRow1.append(btnEventError, btnTypeError, btnAsyncError, btnCustomError)

// 状态文本
const errorStatus = new TextNode('✅ 点击按钮后查看浏览器控制台（F12）', {
  fontSize: 12,
  color: '#16a34a',
  textAlign: 'left'
})

errorCard.append(errorTitle, errorHint, errorBtnRow1, errorStatus)

// --- 交互提示卡片 ---
const infoCard = new CanvasNode({
  display: 'flex',
  flexDirection: 'row',
  padding: [16, 24],
  background: '#e8f5e9',
  borderRadius: 12,
  gap: 12,
  alignItems: 'center'
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
