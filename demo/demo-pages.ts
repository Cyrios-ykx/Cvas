/**
 * Demo 页面入口
 *
 * 为 demo.html 的各个 Canvas 分别挂载不同的演示内容
 * 采用懒加载策略：只有当页面切换到对应 tab 时才初始化 Canvas
 */

import { createApp, createVuvasApp, CanvasNode, TextNode, ButtonNode } from '../src'
import { ref, computed, watchEffect } from '../src/reactivity'
import App from './App.vuvas'

// ============================================================
// 工具函数
// ============================================================

/** 已初始化的页面集合 */
const initialized = new Set<string>()

/** 监听页面切换，懒加载对应 Canvas */
function observePageSwitch() {
  const observer = new MutationObserver(() => {
    const activePage = document.querySelector('.page.active')
    if (!activePage) return
    const pageId = activePage.id.replace('page-', '')
    if (!initialized.has(pageId)) {
      initialized.add(pageId)
      initPage(pageId)
    }
  })

  // 监听所有 page 的 class 变化
  document.querySelectorAll('.page').forEach(page => {
    observer.observe(page, { attributes: true, attributeFilter: ['class'] })
  })

  // 初始化默认激活的页面
  const activePage = document.querySelector('.page.active')
  if (activePage) {
    const pageId = activePage.id.replace('page-', '')
    initialized.add(pageId)
    initPage(pageId)
  }
}

/** 根据页面 ID 初始化对应的 Canvas Demo */
function initPage(pageId: string) {
  switch (pageId) {
    case 'imperative':
      initImperativePage()
      break
    case 'sfc':
      initSfcPage()
      break
    case 'reactivity':
      initReactivityPage()
      break
    case 'layout':
      initLayoutPage()
      break
    case 'events':
      initEventsPage()
      break
    case 'animation':
      initAnimationPage()
      break
  }
}

// ============================================================
// 命令式 API 综合演示
// ============================================================

function initImperativePage() {
  const app = createApp('#canvas-imperative')

  const root = new CanvasNode({
    display: 'flex',
    flexDirection: 'column',
    padding: 24,
    gap: 16,
    background: '#f8f9fa'
  })

  // 标题
  const header = new CanvasNode({
    display: 'flex', flexDirection: 'column', padding: [16, 20],
    background: '#ffffff', borderRadius: 10, gap: 6,
    shadowColor: 'rgba(0,0,0,0.06)', shadowBlur: 8, shadowOffsetY: 2
  })
  header.append(
    new TextNode('🎨 Vuvas 命令式 API', { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e', textAlign: 'left' }),
    new TextNode('createApp + CanvasNode + TextNode + ButtonNode', { fontSize: 13, color: '#666', textAlign: 'left' })
  )

  // 计数器
  let count = 0
  const counterCard = new CanvasNode({
    display: 'flex', flexDirection: 'column', padding: [16, 20],
    background: '#ffffff', borderRadius: 10, gap: 12,
    shadowColor: 'rgba(0,0,0,0.06)', shadowBlur: 8, shadowOffsetY: 2
  })
  const counterTitle = new TextNode('📊 计数器', { fontSize: 16, fontWeight: 'bold', color: '#333', textAlign: 'left' })
  const counterValue = new TextNode(`计数: ${count}`, { fontSize: 18, color: '#42b883', fontWeight: 'bold', textAlign: 'left' })

  const btnRow = new CanvasNode({ display: 'flex', flexDirection: 'row', gap: 10, alignItems: 'center' })
  const btnAdd = new ButtonNode('+1', { padding: [6, 16], background: '#42b883', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' })
  const btnSub = new ButtonNode('-1', { padding: [6, 16], background: '#e74c3c', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' })
  const btnReset = new ButtonNode('Reset', { padding: [6, 16], background: '#95a5a6', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' })
  btnAdd.hoverStyle = { background: '#369970' }
  btnSub.hoverStyle = { background: '#c0392b' }
  btnReset.hoverStyle = { background: '#7f8c8d' }

  btnAdd.on('click', () => { count++; counterValue.text = `计数: ${count}`; app.scheduleRender() })
  btnSub.on('click', () => { count--; counterValue.text = `计数: ${count}`; app.scheduleRender() })
  btnReset.on('click', () => { count = 0; counterValue.text = `计数: ${count}`; app.scheduleRender() })

  btnRow.append(btnAdd, btnSub, btnReset)
  counterCard.append(counterTitle, counterValue, btnRow)

  // Todo 列表
  const todoCard = new CanvasNode({
    display: 'flex', flexDirection: 'column', padding: [16, 20],
    background: '#ffffff', borderRadius: 10, gap: 10,
    shadowColor: 'rgba(0,0,0,0.06)', shadowBlur: 8, shadowOffsetY: 2
  })
  todoCard.append(new TextNode('📝 Todo List', { fontSize: 16, fontWeight: 'bold', color: '#333', textAlign: 'left' }))

  const todos = [
    { text: '学习 Vuvas', done: true },
    { text: '编写 .vuvas 组件', done: true },
    { text: '发布 1.0 版本', done: false }
  ]

  for (const todo of todos) {
    const row = new CanvasNode({
      display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8,
      padding: [4, 10], background: todo.done ? '#f0fdf4' : '#fafafa',
      borderRadius: 6, cursor: 'pointer'
    })
    row.hoverStyle = { background: todo.done ? '#dcfce7' : '#f0f0f0' }
    const checkbox = new TextNode(todo.done ? '✅' : '⬜', { fontSize: 14, textAlign: 'left' })
    const label = new TextNode(todo.text, { fontSize: 13, color: todo.done ? '#16a34a' : '#333', textAlign: 'left' })
    row.append(checkbox, label)

    let done = todo.done
    row.on('click', () => {
      done = !done
      checkbox.text = done ? '✅' : '⬜'
      label.setStyle({ color: done ? '#16a34a' : '#333' })
      row.setStyle({ background: done ? '#f0fdf4' : '#fafafa' })
      row.hoverStyle = { background: done ? '#dcfce7' : '#f0f0f0' }
      app.scheduleRender()
    })
    todoCard.append(row)
  }

  // 提示
  const hint = new CanvasNode({
    display: 'flex', flexDirection: 'row', padding: [12, 16],
    background: '#e8f5e9', borderRadius: 8, alignItems: 'center'
  })
  hint.append(new TextNode('💡 点击按钮和 Todo 项体验交互效果', { fontSize: 13, color: '#2e7d32', textAlign: 'left' }))

  root.append(header, counterCard, todoCard, hint)
  app.mount(root)
}

// ============================================================
// SFC 组件演示
// ============================================================

function initSfcPage() {
  try {
    createVuvasApp(App).mount('#canvas-sfc')
    console.log('[Demo] SFC 页面挂载成功')
  } catch (e) {
    console.error('[Demo] SFC 页面挂载失败:', e)
  }
}

// ============================================================
// 响应式系统演示
// ============================================================

function initReactivityPage() {
  const app = createApp('#canvas-reactivity')

  const root = new CanvasNode({
    display: 'flex', flexDirection: 'column', padding: 24, gap: 16, background: '#f8f9fa'
  })

  const card = new CanvasNode({
    display: 'flex', flexDirection: 'column', padding: [20, 24],
    background: '#ffffff', borderRadius: 10, gap: 14,
    shadowColor: 'rgba(0,0,0,0.06)', shadowBlur: 8, shadowOffsetY: 2
  })

  card.append(new TextNode('⚡ ref + computed + watchEffect', { fontSize: 18, fontWeight: 'bold', color: '#333', textAlign: 'left' }))

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
    fontSize: 16, color: '#6366f1', fontWeight: 'bold', textAlign: 'left'
  })

  watchEffect(() => {
    tempDisplay.text = `温度: ${temperature.value}°C — ${status.value}`
    app.scheduleRender()
  })

  const btnRow = new CanvasNode({ display: 'flex', flexDirection: 'row', gap: 10, alignItems: 'center' })

  const btnUp = new ButtonNode('+5°C', { padding: [6, 14], background: '#ef4444', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' })
  const btnDown = new ButtonNode('-5°C', { padding: [6, 14], background: '#3b82f6', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' })
  const btnReset = new ButtonNode('20°C', { padding: [6, 14], background: '#8b5cf6', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' })
  btnUp.hoverStyle = { background: '#dc2626' }
  btnDown.hoverStyle = { background: '#2563eb' }
  btnReset.hoverStyle = { background: '#7c3aed' }

  btnUp.on('click', () => { temperature.value += 5 })
  btnDown.on('click', () => { temperature.value -= 5 })
  btnReset.on('click', () => { temperature.value = 20 })

  btnRow.append(btnUp, btnDown, btnReset)

  const hint = new TextNode('↑ 点击按钮修改 ref 值，watchEffect 自动更新 UI', { fontSize: 12, color: '#999', textAlign: 'left' })

  card.append(tempDisplay, btnRow, hint)
  root.append(card)
  app.mount(root)
}

// ============================================================
// Flexbox 布局演示
// ============================================================

function initLayoutPage() {
  const app = createApp('#canvas-layout')

  const root = new CanvasNode({
    display: 'flex', flexDirection: 'column', padding: 24, gap: 16, background: '#f8f9fa'
  })

  // Row 布局
  const rowCard = new CanvasNode({
    display: 'flex', flexDirection: 'column', padding: [16, 20],
    background: '#ffffff', borderRadius: 10, gap: 12,
    shadowColor: 'rgba(0,0,0,0.06)', shadowBlur: 8, shadowOffsetY: 2
  })
  rowCard.append(new TextNode('📐 Row 布局 (space-between)', { fontSize: 15, fontWeight: 'bold', color: '#333', textAlign: 'left' }))

  const flexRow = new CanvasNode({
    display: 'flex', flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', gap: 10, padding: [10, 16],
    background: '#eef2ff', borderRadius: 8
  })
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316']
  for (let i = 0; i < 5; i++) {
    const box = new CanvasNode({ width: 40, height: 30, background: colors[i], borderRadius: 4 })
    box.hoverStyle = { borderRadius: 12 }
    flexRow.append(box)
  }
  rowCard.append(flexRow)

  // Column 布局
  const colCard = new CanvasNode({
    display: 'flex', flexDirection: 'column', padding: [16, 20],
    background: '#ffffff', borderRadius: 10, gap: 12,
    shadowColor: 'rgba(0,0,0,0.06)', shadowBlur: 8, shadowOffsetY: 2
  })
  colCard.append(new TextNode('📐 Column 布局 (不同对齐方式)', { fontSize: 15, fontWeight: 'bold', color: '#333', textAlign: 'left' }))

  const colContainer = new CanvasNode({ display: 'flex', flexDirection: 'row', gap: 12 })

  // 左：space-between
  const col1 = new CanvasNode({
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    width: 100, padding: 8, background: '#f0fdf4', borderRadius: 8, gap: 4
  })
  for (let i = 0; i < 3; i++) col1.append(new CanvasNode({ height: 20, background: '#22c55e', borderRadius: 4 }))

  // 中：center
  const col2 = new CanvasNode({
    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    width: 100, padding: 8, background: '#fef3c7', borderRadius: 8, gap: 4
  })
  for (let i = 0; i < 3; i++) col2.append(new CanvasNode({ width: 50, height: 20, background: '#f59e0b', borderRadius: 4 }))

  // 右：flex-end
  const col3 = new CanvasNode({
    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    width: 100, padding: 8, background: '#fce4ec', borderRadius: 8, gap: 4
  })
  for (let i = 0; i < 3; i++) col3.append(new CanvasNode({ height: 20, background: '#e91e63', borderRadius: 4 }))

  colContainer.append(col1, col2, col3)
  colCard.append(colContainer)

  // 渐变 + 边框
  const styleCard = new CanvasNode({
    display: 'flex', flexDirection: 'column', padding: [16, 20],
    background: '#ffffff', borderRadius: 10, gap: 12,
    shadowColor: 'rgba(0,0,0,0.06)', shadowBlur: 8, shadowOffsetY: 2
  })
  styleCard.append(new TextNode('🎨 渐变 + 边框样式', { fontSize: 15, fontWeight: 'bold', color: '#333', textAlign: 'left' }))

  const gradRow = new CanvasNode({ display: 'flex', flexDirection: 'row', gap: 10, alignItems: 'stretch' })
  gradRow.append(
    new CanvasNode({ width: 80, height: 40, background: { type: 'linear', direction: 'to right', colors: ['#667eea', '#764ba2'] }, borderRadius: 6 }),
    new CanvasNode({ width: 80, height: 40, background: { type: 'linear', direction: 'to bottom', colors: ['#f093fb', '#f5576c'] }, borderRadius: 6 }),
    new CanvasNode({ width: 80, height: 40, background: { type: 'linear', direction: 'to right', colors: ['#4facfe', '#00f2fe'] }, borderRadius: 6 }),
    new CanvasNode({ width: 80, height: 40, background: { type: 'linear', direction: 'to right', colors: ['#43e97b', '#38f9d7'] }, borderRadius: 6 })
  )

  const borderRow = new CanvasNode({ display: 'flex', flexDirection: 'row', gap: 10, alignItems: 'stretch' })
  borderRow.append(
    new CanvasNode({ width: 100, height: 40, borderColor: '#6366f1', borderWidth: 2, borderStyle: 'solid', borderRadius: 6 }),
    new CanvasNode({ width: 100, height: 40, borderColor: '#ec4899', borderWidth: 2, borderStyle: 'dashed', borderRadius: 6 }),
    new CanvasNode({ width: 100, height: 40, borderColor: '#f59e0b', borderWidth: 2, borderStyle: 'dotted', borderRadius: 6 })
  )

  styleCard.append(gradRow, borderRow)

  root.append(rowCard, colCard, styleCard)
  app.mount(root)
}

// ============================================================
// 事件系统演示
// ============================================================

function initEventsPage() {
  const app = createApp('#canvas-events')

  const root = new CanvasNode({
    display: 'flex', flexDirection: 'column', padding: 24, gap: 16, background: '#f8f9fa'
  })

  // 计数器（事件演示）
  const eventCard = new CanvasNode({
    display: 'flex', flexDirection: 'column', padding: [16, 20],
    background: '#ffffff', borderRadius: 10, gap: 12,
    shadowColor: 'rgba(0,0,0,0.06)', shadowBlur: 8, shadowOffsetY: 2
  })
  eventCard.append(new TextNode('🎯 Click 事件', { fontSize: 16, fontWeight: 'bold', color: '#333', textAlign: 'left' }))

  let clickCount = 0
  const clickText = new TextNode('点击次数: 0', { fontSize: 14, color: '#6366f1', fontWeight: 'bold', textAlign: 'left' })

  const clickBtn = new ButtonNode('点击我！', {
    padding: [8, 20], background: '#6366f1', color: '#fff',
    borderRadius: 6, fontSize: 14, fontWeight: 'bold', cursor: 'pointer'
  })
  clickBtn.hoverStyle = { background: '#4f46e5' }
  clickBtn.on('click', () => {
    clickCount++
    clickText.text = `点击次数: ${clickCount}`
    app.scheduleRender()
  })

  eventCard.append(clickText, clickBtn)

  // Hover 效果演示
  const hoverCard = new CanvasNode({
    display: 'flex', flexDirection: 'column', padding: [16, 20],
    background: '#ffffff', borderRadius: 10, gap: 12,
    shadowColor: 'rgba(0,0,0,0.06)', shadowBlur: 8, shadowOffsetY: 2
  })
  hoverCard.append(new TextNode('✨ Hover 效果', { fontSize: 16, fontWeight: 'bold', color: '#333', textAlign: 'left' }))
  hoverCard.append(new TextNode('悬停在下方色块上查看效果', { fontSize: 12, color: '#999', textAlign: 'left' }))

  const hoverRow = new CanvasNode({ display: 'flex', flexDirection: 'row', gap: 12, alignItems: 'stretch' })
  const hoverColors = ['#42b883', '#6366f1', '#ec4899', '#f59e0b']
  for (const color of hoverColors) {
    const box = new CanvasNode({ width: 60, height: 50, background: color, borderRadius: 8 })
    box.hoverStyle = { borderRadius: 24, background: color + '99' }
    hoverRow.append(box)
  }
  hoverCard.append(hoverRow)

  // Todo 切换（事件演示）
  const todoCard = new CanvasNode({
    display: 'flex', flexDirection: 'column', padding: [16, 20],
    background: '#ffffff', borderRadius: 10, gap: 10,
    shadowColor: 'rgba(0,0,0,0.06)', shadowBlur: 8, shadowOffsetY: 2
  })
  todoCard.append(new TextNode('📝 点击切换状态', { fontSize: 16, fontWeight: 'bold', color: '#333', textAlign: 'left' }))

  const items = ['学习 Vuvas', '编写组件', '发布版本']
  for (const text of items) {
    const row = new CanvasNode({
      display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8,
      padding: [4, 10], background: '#fafafa', borderRadius: 6, cursor: 'pointer'
    })
    row.hoverStyle = { background: '#f0f0f0' }
    const checkbox = new TextNode('⬜', { fontSize: 14, textAlign: 'left' })
    const label = new TextNode(text, { fontSize: 13, color: '#333', textAlign: 'left' })
    row.append(checkbox, label)

    let done = false
    row.on('click', () => {
      done = !done
      checkbox.text = done ? '✅' : '⬜'
      label.setStyle({ color: done ? '#16a34a' : '#333' })
      row.setStyle({ background: done ? '#f0fdf4' : '#fafafa' })
      row.hoverStyle = { background: done ? '#dcfce7' : '#f0f0f0' }
      app.scheduleRender()
    })
    todoCard.append(row)
  }

  root.append(eventCard, hoverCard, todoCard)
  app.mount(root)
}

// ============================================================
// 动画演示
// ============================================================

function initAnimationPage() {
  const app = createApp('#canvas-animation')

  const root = new CanvasNode({
    display: 'flex', flexDirection: 'column', padding: 24, gap: 16, background: '#f8f9fa'
  })

  const card = new CanvasNode({
    display: 'flex', flexDirection: 'column', padding: [20, 24],
    background: '#ffffff', borderRadius: 10, gap: 14,
    shadowColor: 'rgba(0,0,0,0.06)', shadowBlur: 8, shadowOffsetY: 2
  })

  card.append(new TextNode('🚀 动画进度条', { fontSize: 16, fontWeight: 'bold', color: '#333', textAlign: 'left' }))

  // 进度条
  const progressBg = new CanvasNode({
    display: 'flex', flexDirection: 'row', height: 20, background: '#e5e7eb', borderRadius: 10
  })
  const progressFill = new CanvasNode({ width: 0, height: 20, background: '#6366f1', borderRadius: 10 })
  progressBg.append(progressFill)

  const progressText = new TextNode('0%', { fontSize: 13, color: '#6366f1', fontWeight: 'bold', textAlign: 'left' })

  // 控制按钮
  const btnRow = new CanvasNode({ display: 'flex', flexDirection: 'row', gap: 10, alignItems: 'center' })

  const btnStart = new ButtonNode('开始', { padding: [6, 14], background: '#6366f1', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' })
  const btnPause = new ButtonNode('暂停', { padding: [6, 14], background: '#f59e0b', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' })
  const btnResetP = new ButtonNode('重置', { padding: [6, 14], background: '#ef4444', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' })
  btnStart.hoverStyle = { background: '#4f46e5' }
  btnPause.hoverStyle = { background: '#d97706' }
  btnResetP.hoverStyle = { background: '#dc2626' }

  let progress = 0
  let animating = false
  let animationId: number | null = null

  function animate() {
    if (!animating) return
    progress += 0.5
    if (progress >= 100) { progress = 100; animating = false }
    const maxWidth = progressBg.layout.width || 300
    progressFill.setLayoutStyle({ width: (progress / 100) * maxWidth })
    progressText.text = `${Math.round(progress)}%`
    app.scheduleRender()
    if (animating) animationId = requestAnimationFrame(animate)
  }

  btnStart.on('click', () => {
    if (!animating && progress < 100) { animating = true; animate() }
  })
  btnPause.on('click', () => {
    animating = false
    if (animationId) { cancelAnimationFrame(animationId); animationId = null }
  })
  btnResetP.on('click', () => {
    animating = false
    if (animationId) { cancelAnimationFrame(animationId); animationId = null }
    progress = 0
    progressFill.setLayoutStyle({ width: 0 })
    progressText.text = '0%'
    app.scheduleRender()
  })

  btnRow.append(btnStart, btnPause, btnResetP)
  card.append(progressBg, progressText, btnRow)
  root.append(card)
  app.mount(root)
}

// ============================================================
// 启动
// ============================================================

observePageSwitch()
console.log('✅ Vuvas Demo 页面已启动')
