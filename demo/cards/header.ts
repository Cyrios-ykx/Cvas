import { CanvasNode, TextNode } from '../../src'

/**
 * 标题区域卡片
 */
export function createHeader(): CanvasNode {
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
  return header
}
