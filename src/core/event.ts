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
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e))
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e))
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e))
    this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave())

    // 滚轮事件
    this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false })

    // 触摸事件
    this.canvas.addEventListener('touchstart', (e) => this.handleTouch('click', e), { passive: false })
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false })
    this.canvas.addEventListener('touchend', () => this.handleTouchEnd())

    // 键盘事件（需要 canvas 可聚焦）
    this.canvas.setAttribute('tabindex', '0')
    this.canvas.addEventListener('keydown', (e) => this.handleKeyboard('keydown', e))
    this.canvas.addEventListener('keyup', (e) => this.handleKeyboard('keyup', e))
  }

  /**
   * 处理滚轮事件
   */
  private handleWheel(e: WheelEvent): void {
    e.preventDefault()
    this.onScroll?.(e.deltaY)
  }

  // 触摸滚动相关状态
  private lastTouchY: number = 0
  private isTouching: boolean = false

  /**
   * 处理触摸开始（模拟点击）
   */
  private handleTouch(type: string, e: TouchEvent): void {
    e.preventDefault()
    if (!this.root || e.touches.length === 0) return
    const touch = e.touches[0]
    const { x, y } = this.getTouchPosition(touch)
    this.lastTouchY = touch.clientY
    this.isTouching = true

    const target = this.hitTest(this.root, x, y + this.scrollY)
    if (target) {
      const event = this.createEvent(type, target, x, y + this.scrollY)
      this.dispatchEvent(target, event)
    }
  }

  /**
   * 处理触摸移动（模拟滚动）
   */
  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault()
    if (!this.isTouching || e.touches.length === 0) return
    const touch = e.touches[0]
    const deltaY = this.lastTouchY - touch.clientY
    this.lastTouchY = touch.clientY
    this.onScroll?.(deltaY)
  }

  /**
   * 处理触摸结束
   */
  private handleTouchEnd(): void {
    this.isTouching = false
  }

  // ============================================================
  // 拖拽事件
  // ============================================================

  // 拖拽状态
  private isDragging: boolean = false
  private dragTarget: CanvasNode | null = null
  private dragStartX: number = 0
  private dragStartY: number = 0

  /**
   * 处理鼠标按下（拖拽开始检测）
   */
  private handleMouseDown(e: MouseEvent): void {
    if (!this.root) return
    const { x, y } = this.getCanvasPosition(e)
    const target = this.hitTest(this.root, x, y + this.scrollY)

    if (target) {
      // 触发 mousedown 事件
      const event = this.createEvent('mousedown', target, x, y + this.scrollY)
      this.dispatchEvent(target, event)

      // 记录拖拽起始信息
      this.dragTarget = target
      this.dragStartX = x
      this.dragStartY = y
    }
  }

  /**
   * 处理鼠标释放（拖拽结束）
   */
  private handleMouseUp(e: MouseEvent): void {
    if (!this.root) return
    const { x, y } = this.getCanvasPosition(e)
    const target = this.hitTest(this.root, x, y + this.scrollY)

    // 触发 mouseup 事件
    if (target) {
      const event = this.createEvent('mouseup', target, x, y + this.scrollY)
      this.dispatchEvent(target, event)
    }

    // 如果正在拖拽，触发 dragend
    if (this.isDragging && this.dragTarget) {
      const dragEndEvent = this.createEvent('dragend', this.dragTarget, x, y + this.scrollY)
      this.dispatchEvent(this.dragTarget, dragEndEvent)
      this.isDragging = false
    }

    // 如果正在拖拽并释放到另一个节点上，触发 drop
    if (this.isDragging && target && target !== this.dragTarget) {
      const dropEvent = this.createEvent('drop', target, x, y + this.scrollY)
      this.dispatchEvent(target, dropEvent)
    }

    this.dragTarget = null
  }

  // ============================================================
  // 键盘事件
  // ============================================================

  /** 当前获得焦点的节点 */
  private focusedNode: CanvasNode | null = null

  /**
   * 设置焦点节点
   */
  setFocusedNode(node: CanvasNode | null): void {
    this.focusedNode = node
  }

  /**
   * 处理键盘事件
   */
  private handleKeyboard(type: string, e: KeyboardEvent): void {
    // 创建键盘事件对象
    const target = this.focusedNode || this.hoveredNode || this.root
    if (!target) return

    const event: any = {
      type,
      target,
      x: 0,
      y: 0,
      key: e.key,
      code: e.code,
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      metaKey: e.metaKey,
      _stopped: false,
      stopPropagation() { this._stopped = true },
      preventDefault() { e.preventDefault() }
    }

    this.dispatchEvent(target, event)
  }

  /**
   * 获取触摸点在 Canvas 中的坐标
   */
  private getTouchPosition(touch: Touch): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    }
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
   * 处理鼠标移动（hover 检测 + 拖拽检测）
   */
  private handleMouseMove(e: MouseEvent): void {
    if (!this.root) return
    const { x, y } = this.getCanvasPosition(e)

    // 拖拽检测：鼠标按下并移动超过 5px 阈值
    if (this.dragTarget && !this.isDragging) {
      const dx = x - this.dragStartX
      const dy = y - this.dragStartY
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        this.isDragging = true
        const dragStartEvent = this.createEvent('dragstart', this.dragTarget, x, y + this.scrollY)
        this.dispatchEvent(this.dragTarget, dragStartEvent)
      }
    }

    // 拖拽中：触发 drag 事件
    if (this.isDragging && this.dragTarget) {
      const dragEvent = this.createEvent('drag', this.dragTarget, x, y + this.scrollY)
      this.dispatchEvent(this.dragTarget, dragEvent)
      this.onNeedRender?.()
      return // 拖拽中不处理 hover
    }

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
