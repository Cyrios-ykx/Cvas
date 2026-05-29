import { CanvasNode, TextNode } from '../../src'

/**
 * Flexbox 布局演示卡片
 */
export function createLayoutCard(): CanvasNode {
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

  return layoutCard
}
