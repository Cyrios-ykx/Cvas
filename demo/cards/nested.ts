import { CanvasNode, TextNode } from '../../src'

/**
 * 嵌套布局 + 渐变 + 边框样式卡片
 */
export function createNestedCard(): CanvasNode {
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
    height: 50,
    alignItems: 'stretch'
  })

  const grad1 = new CanvasNode({
    width: 100,
    background: { type: 'linear', direction: 'to right', colors: ['#667eea', '#764ba2'] },
    borderRadius: 8
  })
  const grad2 = new CanvasNode({
    width: 100,
    background: { type: 'linear', direction: 'to bottom', colors: ['#f093fb', '#f5576c'] },
    borderRadius: 8
  })
  const grad3 = new CanvasNode({
    width: 100,
    background: { type: 'linear', direction: 'to right', colors: ['#4facfe', '#00f2fe'] },
    borderRadius: 8
  })
  const grad4 = new CanvasNode({
    width: 100,
    background: { type: 'linear', direction: 'to right', colors: ['#43e97b', '#38f9d7'] },
    borderRadius: 8
  })

  gradientRow.append(grad1, grad2, grad3, grad4)

  // 边框样式展示行
  const borderRow = new CanvasNode({
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
    height: 50,
    alignItems: 'stretch'
  })

  const borderSolid = new CanvasNode({ width: 130, borderColor: '#6366f1', borderWidth: 2, borderStyle: 'solid', borderRadius: 8 })
  const borderDashed = new CanvasNode({ width: 130, borderColor: '#ec4899', borderWidth: 2, borderStyle: 'dashed', borderRadius: 8 })
  const borderDotted = new CanvasNode({ width: 130, borderColor: '#f59e0b', borderWidth: 2, borderStyle: 'dotted', borderRadius: 8 })

  borderRow.append(borderSolid, borderDashed, borderDotted)

  // 嵌套布局展示
  const nestedLayout = new CanvasNode({ display: 'flex', flexDirection: 'row', gap: 10, height: 100 })

  // 左侧面板
  const leftPanel = new CanvasNode({
    display: 'flex', flexDirection: 'column', width: 200, padding: 10, gap: 8,
    background: { type: 'linear', direction: 'to bottom', colors: ['#e0e7ff', '#c7d2fe'] },
    borderRadius: 8
  })
  const leftHeader = new TextNode('左侧面板', { fontSize: 12, fontWeight: 'bold', color: '#4338ca', textAlign: 'left' })
  const leftContent = new CanvasNode({ display: 'flex', flexDirection: 'row', gap: 6, height: 30, alignItems: 'stretch' })
  for (let i = 0; i < 3; i++) {
    leftContent.append(new CanvasNode({ width: 30, background: '#6366f1', borderRadius: 4 }))
  }
  leftPanel.append(leftHeader, leftContent)

  // 右侧面板
  const rightPanel = new CanvasNode({
    display: 'flex', flexDirection: 'column', width: 200, padding: 10, gap: 8,
    background: { type: 'linear', direction: 'to bottom', colors: ['#fef3c7', '#fde68a'] },
    borderRadius: 8
  })
  const rightHeader = new TextNode('右侧面板', { fontSize: 12, fontWeight: 'bold', color: '#92400e', textAlign: 'left' })
  const rightContent = new CanvasNode({ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'stretch' })
  for (let i = 0; i < 3; i++) {
    rightContent.append(new CanvasNode({ height: 14, background: '#f59e0b', borderRadius: 3 }))
  }
  rightPanel.append(rightHeader, rightContent)

  nestedLayout.append(leftPanel, rightPanel)
  nestedCard.append(nestedTitle, gradientRow, borderRow, nestedLayout)

  return nestedCard
}
