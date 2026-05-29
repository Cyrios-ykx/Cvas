import { CanvasNode, TextNode, ButtonNode } from '../../src'
import type { App } from '../../src/core'

/**
 * 计数器卡片
 */
export function createCounterCard(app: App): CanvasNode {
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
    counterValue.text = `当前值: ${count}`
    app.scheduleRender()
  }

  // 绑定事件
  btnAdd.on('click', () => { count++; updateCounter() })
  btnSubtract.on('click', () => { count--; updateCounter() })
  btnReset.on('click', () => { count = 0; updateCounter() })

  buttonRow.append(btnAdd, btnSubtract, btnReset)
  counterCard.append(counterTitle, counterValue, buttonRow)

  return counterCard
}
