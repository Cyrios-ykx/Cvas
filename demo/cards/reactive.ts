import { CanvasNode, TextNode, ButtonNode } from '../../src'
import { ref, computed, watchEffect } from '../../src/reactivity'
import type { App } from '../../src/core'

/**
 * 响应式系统展示卡片
 */
export function createReactiveCard(app: App): CanvasNode {
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
    height: 36,
    alignItems: 'center'
  })

  const btnTempUp = new ButtonNode('+5°C', {
    padding: [6, 14], background: '#ef4444', color: '#fff',
    borderRadius: 6, fontSize: 13, fontWeight: 'bold', cursor: 'pointer'
  })
  btnTempUp.hoverStyle = { background: '#dc2626' }

  const btnTempDown = new ButtonNode('-5°C', {
    padding: [6, 14], background: '#3b82f6', color: '#fff',
    borderRadius: 6, fontSize: 13, fontWeight: 'bold', cursor: 'pointer'
  })
  btnTempDown.hoverStyle = { background: '#2563eb' }

  const btnTempReset = new ButtonNode('20°C', {
    padding: [6, 14], background: '#8b5cf6', color: '#fff',
    borderRadius: 6, fontSize: 13, fontWeight: 'bold', cursor: 'pointer'
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

  return reactiveCard
}
