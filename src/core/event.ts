import { CanvasNode, type CanvasEvent } from './node'

/**
 * 事件管理器
 * 负责 Canvas 上的事件监听、命中测试和事件分发
 */
export class EventManager {
  private canvas: HTMLCanvasElement
  private root: CanvasNode | null = null
  private hoveredNode: CanvasNode | null = null
  private onNeedRender: (() => void) | null = null

  // 滚动相关
  private scrollY: number = 0
  private onScroll: ((deltaY: number) => void) | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.bindEvents()
  }

  /**
   * 设置根节点
   */
  setRoot(root: CanvasNode): void {
    this.root = root
  }

  /**
   * 设置重渲染回调
   */
  setRenderCallback(cb: () => void): void {
    this.onNeedRender = cb
  }

  /**
   * 设置滚动回调
   */
  setScrollCallback(cb: (deltaY: number) => void): void {
    this.onScroll = cb
  }

  /**
   * 更新当前滚动偏移（用于命中测试坐标修正）
   */
  setScrollY(scrollY: number): void {
    this.scrollY = scrollY
  }

  /**
   * 绑定 Canvas DOM 事件
   */
  private bindEvents(): void {
    this.canvas.addEventListener('click', (e) => this.handleEvent('click', e))
    this.canvas.addEventListener('mousedown', (e) => this.handleEvent('mousedown', e))
    this.canvas.addEventListener('mouseup', (e) => this.handleEvent('mouseup', e))
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e))
    this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave())

    // 滚轮事件
    this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false })
  }

  /**
   * 处理滚轮事件
   */
  private handleWheel(e: WheelEvent): void {
    e.preventDefault()
    this.onScroll?.(e.deltaY)
  }

  /**
   * 处理通用事件
   */
  private handleEvent(type: string, e: MouseEvent): void {
    if (!this.root) return
    const { x, y } = this.getCanvasPosition(e)
    // 命中测试时需要加上滚动偏移，因为节点的 layout 坐标是绝对坐标
    const target = this.hitTest(this.root, x, y + this.scrollY)

    if (target) {
      const event = this.createEvent(type, target, x, y + this.scrollY)
      this.dispatchEvent(target, event)
    }
  }

  /**
   * 处理鼠标移动（hover 检测）
   */
  private handleMouseMove(e: MouseEvent): void {
    if (!this.root) return
    const { x, y } = this.getCanvasPosition(e)
    // 命中测试时加上滚动偏移
    const target = this.hitTest(this.root, x, y + this.scrollY)

    // 更新 hover 状态
    if (target !== this.hoveredNode) {
      // 离开旧节点
      if (this.hoveredNode) {
        this.hoveredNode.isHovered = false
        const leaveEvent = this.createEvent('mouseleave', this.hoveredNode, x, y + this.scrollY)
        this.hoveredNode.emit('mouseleave', leaveEvent)
      }

      // 进入新节点
      if (target) {
        target.isHovered = true
        const enterEvent = this.createEvent('mouseenter', target, x, y + this.scrollY)
        target.emit('mouseenter', enterEvent)
      }

      this.hoveredNode = target

      // 更新鼠标样式
      const cursor = target?.getComputedStyle().cursor
      this.canvas.style.cursor = cursor || 'default'

      // 触发重渲染（hover 样式变化）
      this.onNeedRender?.()
    }
  }

  /**
   * 处理鼠标离开 Canvas
   */
  private handleMouseLeave(): void {
    if (this.hoveredNode) {
      this.hoveredNode.isHovered = false
      this.hoveredNode = null
      this.canvas.style.cursor = 'default'
      this.onNeedRender?.()
    }
  }

  /**
   * 命中测试 - 找到坐标下最深层的节点
   */
  private hitTest(node: CanvasNode, x: number, y: number): CanvasNode | null {
    const { layout } = node

    // 检查点是否在节点范围内
    if (x < layout.x || x > layout.x + layout.width ||
        y < layout.y || y > layout.y + layout.height) {
      return null
    }

    // 从后往前遍历子节点（后绘制的在上层）
    for (let i = node.children.length - 1; i >= 0; i--) {
      const hit = this.hitTest(node.children[i], x, y)
      if (hit) return hit
    }

    // 如果没有子节点命中，返回当前节点
    return node
  }

  /**
   * 事件冒泡分发
   */
  private dispatchEvent(target: CanvasNode, event: CanvasEvent): void {
    let current: CanvasNode | null = target
    while (current && !event._stopped) {
      current.emit(event.type, event)
      current = current.parent
    }
  }

  /**
   * 获取鼠标在 Canvas 中的坐标
   */
  private getCanvasPosition(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  /**
   * 创建事件对象
   */
  private createEvent(type: string, target: CanvasNode, x: number, y: number): CanvasEvent {
    return {
      type,
      target,
      x,
      y,
      _stopped: false,
      stopPropagation() {
        this._stopped = true
      }
    }
  }
}
