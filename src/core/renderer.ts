import { CanvasNode, TextNode, ButtonNode, ImageNode, parseSpacing, type NodeStyle } from './node'
import { drawText as drawTextFn } from './renderer-text'

/**
 * Canvas 渲染器
 * 负责将节点树绘制到 Canvas 上
 *
 * 优化策略：
 * - 脏区域重绘：仅重绘发生变化的区域
 * - 离屏 Canvas 缓存：静态子树缓存到离屏 Canvas
 * - 视口裁剪：跳过不在可视区域内的节点
 */
export class Renderer {
  private ctx: CanvasRenderingContext2D
  private width: number
  private height: number
  private dpr: number

  // 滚动偏移量
  scrollY: number = 0

  // 脏区域列表
  private dirtyRects: { x: number; y: number; width: number; height: number }[] = []
  // 是否强制全量重绘
  private forceFullRender: boolean = true

  // 离屏 Canvas 缓存
  private offscreenCache: Map<CanvasNode, { canvas: HTMLCanvasElement; version: number }> = new Map()
  // 节点版本号（用于判断是否需要更新缓存）
  private nodeVersions: WeakMap<CanvasNode, number> = new WeakMap()

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('无法获取 Canvas 2D 上下文')
    this.ctx = ctx

    // 处理高 DPI 屏幕
    this.dpr = window.devicePixelRatio || 1

    // 确定逻辑尺寸（CSS 像素）
    // 优先使用 CSS style 中的尺寸（说明已经被初始化过）
    // 否则使用 HTML 属性中的 width/height 作为逻辑尺寸（首次初始化）
    const cssWidth = canvas.style.width ? parseInt(canvas.style.width) : 0
    const cssHeight = canvas.style.height ? parseInt(canvas.style.height) : 0

    if (cssWidth > 0 && cssHeight > 0) {
      // 已经初始化过，使用 CSS 尺寸作为逻辑尺寸
      this.width = cssWidth
      this.height = cssHeight
    } else {
      // 首次初始化，HTML 属性中的值就是逻辑尺寸
      this.width = canvas.width
      this.height = canvas.height
    }

    // 设置 Canvas 物理像素尺寸（仅在需要时）
    const expectedPhysicalWidth = Math.round(this.width * this.dpr)
    const expectedPhysicalHeight = Math.round(this.height * this.dpr)

    if (canvas.width !== expectedPhysicalWidth || canvas.height !== expectedPhysicalHeight) {
      canvas.width = expectedPhysicalWidth
      canvas.height = expectedPhysicalHeight
    }
    canvas.style.width = `${this.width}px`
    canvas.style.height = `${this.height}px`

    // 重置变换矩阵并应用 DPR 缩放
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
  }

  /**
   * 获取视口尺寸
   */
  getViewportSize(): { width: number; height: number } {
    return { width: this.width, height: this.height }
  }

  /**
   * 标记脏区域（需要重绘的区域）
   */
  markDirty(x: number, y: number, width: number, height: number): void {
    this.dirtyRects.push({ x, y, width, height })
  }

  /**
   * 标记节点为脏（需要重绘）
   */
  markNodeDirty(node: CanvasNode): void {
    const { x, y, width, height } = node.layout
    // 扩展脏区域以包含阴影
    const style = node.getComputedStyle()
    const shadowBlur = style.shadowBlur || 0
    const shadowOffsetX = style.shadowOffsetX || 0
    const shadowOffsetY = style.shadowOffsetY || 0
    const shadowExpand = shadowBlur + Math.max(Math.abs(shadowOffsetX), Math.abs(shadowOffsetY))
    // 额外扩展 1px 避免 clip() 边缘的抗锯齿伪影
    const expand = shadowExpand + 1
    this.markDirty(x - expand, y - expand, width + expand * 2, height + expand * 2)
    // 更新节点版本号
    const currentVersion = this.nodeVersions.get(node) || 0
    this.nodeVersions.set(node, currentVersion + 1)
  }

  /**
   * 强制下次全量重绘
   */
  invalidateAll(): void {
    this.forceFullRender = true
  }

  /**
   * 检查是否需要全量重绘
   */
  needsFullRender(): boolean {
    return this.forceFullRender
  }

  /**
   * 智能重绘：遍历节点树，仅将 _visualDirty 的节点标记为脏区域
   * 适用于只有视觉属性变更（颜色、透明度等）的场景
   * 比 invalidateAll() 全量重绘更高效
   */
  renderVisualChanges(root: CanvasNode): void {
    this.collectDirtyNodes(root)
    if (this.dirtyRects.length > 0) {
      this.render(root)
    }
  }

  /**
   * 递归收集视觉脏节点的区域
   */
  private collectDirtyNodes(node: CanvasNode): void {
    if (node._visualDirty) {
      this.markNodeDirty(node)
      node._visualDirty = false
    }
    for (const child of node.children) {
      this.collectDirtyNodes(child)
    }
  }

  /**
   * 清空画布并重新渲染整棵树
   * 支持脏区域优化：如果有脏区域，仅重绘脏区域
   */
  render(root: CanvasNode): void {
    if (this.forceFullRender || this.dirtyRects.length === 0) {
      // 全量重绘
      this.ctx.clearRect(0, 0, this.width, this.height)
      this.ctx.save()
      this.ctx.translate(0, -this.scrollY)
      this.renderNode(root)
      this.ctx.restore()
      this.forceFullRender = false
    } else {
      // 脏区域重绘
      this.ctx.save()
      // 合并脏区域为裁剪区域
      this.ctx.beginPath()
      for (const rect of this.dirtyRects) {
        this.ctx.rect(
          rect.x,
          rect.y - this.scrollY,
          rect.width,
          rect.height
        )
      }
      this.ctx.clip()
      // 清除脏区域
      for (const rect of this.dirtyRects) {
        this.ctx.clearRect(
          rect.x,
          rect.y - this.scrollY,
          rect.width,
          rect.height
        )
      }
      // 在裁剪区域内重绘
      this.ctx.translate(0, -this.scrollY)
      this.renderNode(root)
      this.ctx.restore()
    }
    // 清空脏区域列表
    this.dirtyRects = []
  }

  /**
   * 为静态子树创建离屏缓存
   * 适用于不经常变化的复杂节点（如背景装饰、静态列表等）
   */
  cacheNode(node: CanvasNode): void {
    const { width, height } = node.layout
    if (width <= 0 || height <= 0) return

    const offscreen = document.createElement('canvas')
    offscreen.width = width * this.dpr
    offscreen.height = height * this.dpr
    const offCtx = offscreen.getContext('2d')!
    offCtx.scale(this.dpr, this.dpr)

    // 临时替换上下文进行绘制
    const originalCtx = this.ctx
    const originalX = node.layout.x
    const originalY = node.layout.y

    // 将节点移到 (0,0) 绘制到离屏 Canvas
    this.ctx = offCtx
    node.layout.x = 0
    node.layout.y = 0
    this.renderNode(node)

    // 恢复
    this.ctx = originalCtx
    node.layout.x = originalX
    node.layout.y = originalY

    const version = this.nodeVersions.get(node) || 0
    this.offscreenCache.set(node, { canvas: offscreen, version })
  }

  /**
   * 清除节点的离屏缓存
   */
  clearCache(node: CanvasNode): void {
    this.offscreenCache.delete(node)
  }

  /**
   * 清除所有离屏缓存
   */
  clearAllCache(): void {
    this.offscreenCache.clear()
  }

  /**
   * 递归渲染节点
   * 优化：减少 ctx.save()/restore() 调用，只在需要透明度或阴影时才保存状态
   */
  private renderNode(node: CanvasNode): void {
    const style = node.getComputedStyle()
    const { x, y, width, height } = node.layout

    // 跳过零尺寸节点
    if (width <= 0 || height <= 0) return

    // 视口裁剪优化：跳过完全不在可视区域内的节点
    const viewTop = this.scrollY
    const viewBottom = this.scrollY + this.height
    if (y + height < viewTop || y > viewBottom) {
      return
    }

    // 离屏缓存命中：如果节点有缓存且版本未变，直接绘制缓存
    const cached = this.offscreenCache.get(node)
    if (cached) {
      const currentVersion = this.nodeVersions.get(node) || 0
      if (cached.version === currentVersion) {
        this.ctx.drawImage(cached.canvas, 0, 0, cached.canvas.width, cached.canvas.height, x, y, width, height)
        return
      } else {
        this.offscreenCache.delete(node)
      }
    }

    // 判断是否需要保存/恢复上下文状态（减少开销）
    const hasOpacity = style.opacity !== undefined && style.opacity < 1
    const hasShadow = !!style.shadowColor
    const needsSave = hasOpacity || hasShadow

    if (hasOpacity) {
      this.ctx.globalAlpha = style.opacity!
    }

    if (needsSave) {
      this.ctx.save()
    }

    // 绘制背景和边框（跳过无样式的纯容器节点）
    if (style.background || style.border || style.borderColor) {
      this.drawBox(x, y, width, height, style)
    }

    // 绘制图片
    if (node instanceof ImageNode) {
      this.drawImage(node, x, y, width, height, style)
    }

    // 绘制文本内容
    if (node instanceof TextNode) {
      this.drawText(node.text, x, y, width, height, style)
    } else if (node instanceof ButtonNode) {
      if (!style.background) {
        this.drawBox(x, y, width, height, { ...style, background: '#42b883' })
      }
      this.drawText(node.text, x, y, width, height, style)
    }

    // 恢复上下文状态
    if (needsSave) {
      this.ctx.restore()
    }
    if (hasOpacity) {
      this.ctx.globalAlpha = 1
    }

    // 递归渲染子节点
    for (const child of node.children) {
      this.renderNode(child)
    }
  }

  /**
   * 绘制盒子（背景 + 边框 + 圆角 + 阴影）
   * 优化：简单矩形（无圆角、无阴影）使用 fillRect 快速路径
   */
  private drawBox(x: number, y: number, w: number, h: number, style: NodeStyle): void {
    const radius = style.borderRadius || 0
    const hasShadow = !!style.shadowColor
    const hasBorder = !!(style.borderColor || style.border)

    // 快速路径：纯色矩形，无圆角，无阴影，无边框
    if (!radius && !hasShadow && !hasBorder && style.background && typeof style.background === 'string') {
      this.ctx.fillStyle = style.background
      this.ctx.fillRect(x, y, w, h)
      return
    }

    // 快速路径：纯色 + 圆角，无阴影，无边框（动画中最常见的场景）
    if (radius && !hasShadow && !hasBorder && style.background && typeof style.background === 'string') {
      this.ctx.fillStyle = style.background
      this.ctx.beginPath()
      this.roundRect(x, y, w, h, radius)
      this.ctx.fill()
      return
    }

    // 阴影
    if (hasShadow) {
      this.ctx.shadowColor = style.shadowColor!
      this.ctx.shadowBlur = style.shadowBlur || 0
      this.ctx.shadowOffsetX = style.shadowOffsetX || 0
      this.ctx.shadowOffsetY = style.shadowOffsetY || 0
    }

    // 绘制圆角矩形路径
    this.ctx.beginPath()
    this.roundRect(x, y, w, h, radius)

    // 填充背景（支持纯色和渐变）
    if (style.background) {
      if (typeof style.background === 'string') {
        this.ctx.fillStyle = style.background
      } else {
        // 线性渐变
        const grad = style.background
        let gradient: CanvasGradient
        switch (grad.direction) {
          case 'to right':
            gradient = this.ctx.createLinearGradient(x, y, x + w, y)
            break
          case 'to left':
            gradient = this.ctx.createLinearGradient(x + w, y, x, y)
            break
          case 'to top':
            gradient = this.ctx.createLinearGradient(x, y + h, x, y)
            break
          default: // 'to bottom'
            gradient = this.ctx.createLinearGradient(x, y, x, y + h)
            break
        }
        const colors = grad.colors
        for (let i = 0; i < colors.length; i++) {
          gradient.addColorStop(i / (colors.length - 1), colors[i])
        }
        this.ctx.fillStyle = gradient
      }
      this.ctx.fill()
    }

    // 清除阴影（避免影响边框）
    this.ctx.shadowColor = 'transparent'

    // 绘制边框
    if (style.borderColor || style.border) {
      this.ctx.strokeStyle = style.borderColor || '#ccc'
      this.ctx.lineWidth = style.borderWidth || 1

      // 边框样式
      const borderStyle = style.borderStyle || 'solid'
      if (borderStyle === 'dashed') {
        this.ctx.setLineDash([6, 4])
      } else if (borderStyle === 'dotted') {
        this.ctx.setLineDash([2, 2])
      } else {
        this.ctx.setLineDash([])
      }

      this.ctx.stroke()
      this.ctx.setLineDash([]) // 重置
    }
  }

  /**
   * 绘制图片
   */
  private drawImage(node: ImageNode, x: number, y: number, w: number, h: number, style: NodeStyle): void {
    const img = node.getImage()
    if (!img) return

    const radius = style.borderRadius || 0
    const objectFit = style.objectFit || 'cover'

    this.ctx.save()

    // 圆角裁剪
    if (radius > 0) {
      this.ctx.beginPath()
      this.roundRect(x, y, w, h, radius)
      this.ctx.clip()
    }

    // 根据 objectFit 计算绘制区域
    let sx = 0, sy = 0, sw = img.width, sh = img.height
    let dx = x, dy = y, dw = w, dh = h

    if (objectFit === 'contain') {
      const ratio = Math.min(w / img.width, h / img.height)
      dw = img.width * ratio
      dh = img.height * ratio
      dx = x + (w - dw) / 2
      dy = y + (h - dh) / 2
    } else if (objectFit === 'cover') {
      const ratio = Math.max(w / img.width, h / img.height)
      sw = w / ratio
      sh = h / ratio
      sx = (img.width - sw) / 2
      sy = (img.height - sh) / 2
    }
    // 'fill' 直接拉伸

    this.ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
    this.ctx.restore()
  }

  /**
   * 绘制文本（委托到 renderer-text 模块）
   */
  private drawText(text: string, x: number, y: number, w: number, h: number, style: NodeStyle): void {
    drawTextFn(this.ctx, text, x, y, w, h, style)
  }

  /**
   * 绘制圆角矩形路径
   * 优化：优先使用 Canvas 原生 roundRect API（性能更好）
   */
  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    if (r <= 0) {
      this.ctx.rect(x, y, w, h)
      return
    }
    r = Math.min(r, w / 2, h / 2)
    // 使用原生 roundRect API（Chrome 99+, Firefox 112+, Safari 15.4+）
    if (this.ctx.roundRect) {
      this.ctx.roundRect(x, y, w, h, r)
      return
    }
    // 回退方案：使用 arcTo
    this.ctx.moveTo(x + r, y)
    this.ctx.arcTo(x + w, y, x + w, y + h, r)
    this.ctx.arcTo(x + w, y + h, x, y + h, r)
    this.ctx.arcTo(x, y + h, x, y, r)
    this.ctx.arcTo(x, y, x + w, y, r)
    this.ctx.closePath()
  }
}
