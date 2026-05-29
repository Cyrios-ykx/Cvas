import { CanvasNode, TextNode, ButtonNode } from '../../src'
import type { App } from '../../src/core'

/**
 * 动画进度条卡片
 */
export function createProgressCard(app: App): CanvasNode {
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
    height: 36,
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

  return progressCard
}
