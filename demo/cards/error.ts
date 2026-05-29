import { CanvasNode, TextNode, ButtonNode } from '../../src'
import { queueJob } from '../../src/scheduler'

/**
 * 错误处理测试卡片
 */
export function createErrorCard(): CanvasNode {
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
    height: 36,
    alignItems: 'center'
  })

  // 按钮1：事件回调中抛错
  const btnEventError = new ButtonNode('事件回调报错', {
    padding: [6, 14], background: '#ef4444', color: '#fff',
    borderRadius: 6, fontSize: 13, fontWeight: 'bold', cursor: 'pointer'
  })
  btnEventError.hoverStyle = { background: '#dc2626' }
  btnEventError.on('click', () => {
    throw new Error('这是一个事件回调中的测试错误！')
  })

  // 按钮2：访问 undefined 属性
  const btnTypeError = new ButtonNode('TypeError', {
    padding: [6, 14], background: '#f97316', color: '#fff',
    borderRadius: 6, fontSize: 13, fontWeight: 'bold', cursor: 'pointer'
  })
  btnTypeError.hoverStyle = { background: '#ea580c' }
  btnTypeError.on('click', () => {
    const obj: any = null
    obj.foo.bar
  })

  // 按钮3：异步错误（调度器中）
  const btnAsyncError = new ButtonNode('调度器报错', {
    padding: [6, 14], background: '#8b5cf6', color: '#fff',
    borderRadius: 6, fontSize: 13, fontWeight: 'bold', cursor: 'pointer'
  })
  btnAsyncError.hoverStyle = { background: '#7c3aed' }
  btnAsyncError.on('click', () => {
    queueJob(() => {
      throw new Error('这是调度器任务中的测试错误！')
    })
  })

  // 按钮4：自定义错误信息
  const btnCustomError = new ButtonNode('自定义Error', {
    padding: [6, 14], background: '#06b6d4', color: '#fff',
    borderRadius: 6, fontSize: 13, fontWeight: 'bold', cursor: 'pointer'
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

  const errorStatus = new TextNode('✅ 点击按钮后查看浏览器控制台（F12）', {
    fontSize: 12,
    color: '#16a34a',
    textAlign: 'left'
  })

  errorCard.append(errorTitle, errorHint, errorBtnRow1, errorStatus)

  return errorCard
}
