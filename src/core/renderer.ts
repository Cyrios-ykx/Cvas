import { CanvasNode, TextNode, ButtonNode, parseSpacing, type NodeStyle } from './node'

/**
 * Canvas 渲染器
 * 负责将节点树绘制到 Canvas 上
 */
export class Renderer {
  private ctx: CanvasRenderingContext2D
  private width: number
  private height: number
  private dpr: number

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('无法获取 Canvas 2D 上下文')
    this.ctx = ctx

    // 处理高 DPI 屏幕
    this.dpr = window.devicePixelRatio || 1
    this.width = canvas.width
    this.height = canvas.height

    // 设置 Canvas 实际像素尺寸
    canvas.width = this.width * this.dpr
    canvas.height = this.height * this.dpr
    canvas.style.width = `${this.width}px`
    canvas.style.height = `${this.height}px`
    this.ctx.scale(this.dpr, this.dpr)
  }

  /**
   * 清空画布并重新渲染整棵树
   */
  render(root: CanvasNode): void {
    this.ctx.clearRect(0, 0, this.width, this.height)
    this.renderNode(root)
  }

  /**
   * 递归渲染节点
   */
  private renderNode(node: CanvasNode): void {
    const style = node.getComputedStyle()
    const { x, y, width, height } = node.layout

    // 保存上下文状态
    this.ctx.save()

    // 绘制背景和边框
    if (style.background || style.border || style.borderColor) {
      this.drawBox(x, y, width, height, style)
    }

    // 绘制文本内容
    if (node instanceof TextNode) {
      this.drawText(node.text, x, y, width, height, style)
    } else if (node instanceof ButtonNode) {
      // 按钮先画背景再画文字
      if (!style.background) {
        this.drawBox(x, y, width, height, { ...style, background: '#42b883' })
      }
      this.drawText(node.text, x, y, width, height, style)
    }

    // 恢复上下文状态
    this.ctx.restore()

    // 递归渲染子节点
    for (const child of node.children) {
      this.renderNode(child)
    }
  }

  /**
   * 绘制盒子（背景 + 边框 + 圆角 + 阴影）
   */
  private drawBox(x: number, y: number, w: number, h: number, style: NodeStyle): void {
    const radius = style.borderRadius || 0

    // 阴影
    if (style.shadowColor) {
      this.ctx.shadowColor = style.shadowColor
      this.ctx.shadowBlur = style.shadowBlur || 0
      this.ctx.shadowOffsetX = style.shadowOffsetX || 0
      this.ctx.shadowOffsetY = style.shadowOffsetY || 0
    }

    // 绘制圆角矩形路径
    this.ctx.beginPath()
    this.roundRect(x, y, w, h, radius)

    // 填充背景
    if (style.background) {
      this.ctx.fillStyle = style.background
      this.ctx.fill()
    }

    // 清除阴影（避免影响边框）
    this.ctx.shadowColor = 'transparent'

    // 绘制边框
    if (style.borderColor || style.border) {
      this.ctx.strokeStyle = style.borderColor || '#ccc'
      this.ctx.lineWidth = style.borderWidth || 1
      this.ctx.stroke()
    }
  }

  /**
   * 绘制文本
   */
  private drawText(text: string, x: number, y: number, w: number, h: number, style: NodeStyle): void {
    const fontSize = style.fontSize || 14
    const fontWeight = style.fontWeight || 'normal'
    const fontFamily = style.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    const color = style.color || '#333333'
    const textAlign = style.textAlign || 'center'

    this.ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
    this.ctx.fillStyle = color
    this.ctx.textBaseline = 'middle'

    const [pt, pr, pb, pl] = parseSpacing(style.padding)

    let textX: number
    switch (textAlign) {
      case 'left':
        this.ctx.textAlign = 'left'
        textX = x + pl
        break
      case 'right':
        this.ctx.textAlign = 'right'
        textX = x + w - pr
        break
      default:
        this.ctx.textAlign = 'center'
        textX = x + w / 2
        break
    }

    const textY = y + h / 2
    this.ctx.fillText(text, textX, textY)
  }

  /**
   * 绘制圆角矩形路径
   */
  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    if (r <= 0) {
      this.ctx.rect(x, y, w, h)
      return
    }
    r = Math.min(r, w / 2, h / 2)
    this.ctx.moveTo(x + r, y)
    this.ctx.arcTo(x + w, y, x + w, y + h, r)
    this.ctx.arcTo(x + w, y + h, x, y + h, r)
    this.ctx.arcTo(x, y + h, x, y, r)
    this.ctx.arcTo(x, y, x + w, y, r)
    this.ctx.closePath()
  }
}
