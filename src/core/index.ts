import { CanvasNode } from './node'
import { LayoutEngine } from './layout'
import { Renderer } from './renderer'
import { EventManager } from './event'
import { handleError, ErrorSource } from '../error'

export { CanvasNode, TextNode, ButtonNode, ImageNode } from './node'
export type { NodeStyle, CanvasEvent, EventHandler } from './node'
export { LAYOUT_AFFECTING_PROPS, VISUAL_ONLY_PROPS, detectStyleChangeType, StyleChangeType } from './node'
export { LayoutEngine } from './layout'
export { Renderer } from './renderer'
export { EventManager } from './event'

/**
 * Vuvas 应用实例
 */
export class App {
  private canvas: HTMLCanvasElement
  private renderer: Renderer
  private layout: LayoutEngine
  private events: EventManager
  private root: CanvasNode | null = null
  private _rafId: number | null = null

  // 滚动状态
  private scrollY: number = 0
  private maxScrollY: number = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.renderer = new Renderer(canvas)
    this.layout = new LayoutEngine()
    this.events = new EventManager(canvas)

    // 事件系统触发重渲染
    this.events.setRenderCallback(() => this.scheduleRender())

    // 滚动事件处理
    this.events.setScrollCallback((deltaY) => this.handleScroll(deltaY))
  }

  /**
   * 挂载根节点并开始渲染
   */
  mount(root: CanvasNode): this {
    this.root = root
    this.events.setRoot(root)
    this.render()
    return this
  }

  /**
   * 调度一次渲染（合并多次请求）
   */
  scheduleRender(): void {
    if (this._rafId !== null) return
    this._rafId = requestAnimationFrame(() => {
      this._rafId = null
      try {
        this.render()
      } catch (err) {
        handleError(err, ErrorSource.RENDER, 'Canvas render loop')
      }
    })
  }

  /**
   * 处理滚动
   */
  private handleScroll(deltaY: number): void {
    const newScrollY = this.scrollY + deltaY
    // 限制滚动范围
    this.scrollY = Math.max(0, Math.min(newScrollY, this.maxScrollY))
    // 同步滚动偏移到渲染器和事件系统
    this.renderer.scrollY = this.scrollY
    this.events.setScrollY(this.scrollY)
    // 滚动需要全量重绘（视口偏移变了）
    this.renderer.invalidateAll()
    this.scheduleRender()
  }

  /**
   * 执行一次完整的布局 + 渲染
   * 优化：使用增量布局，仅在布局属性变更时重新计算
   */
  render(): void {
    if (!this.root) return

    // 获取视口尺寸
    const { width, height } = this.renderer.getViewportSize()

    // 增量布局：仅在有布局变更时重新计算
    const layoutChanged = this.layout.computeLayoutIfNeeded(this.root, width, height)

    if (layoutChanged) {
      // 布局变了，更新滚动范围
      const contentHeight = this.root.layout.height
      this.maxScrollY = Math.max(0, contentHeight - height)

      // 确保当前滚动位置不超出范围
      if (this.scrollY > this.maxScrollY) {
        this.scrollY = this.maxScrollY
        this.renderer.scrollY = this.scrollY
        this.events.setScrollY(this.scrollY)
      }

      // 布局变更需要全量重绘
      this.renderer.invalidateAll()
      this.renderer.render(this.root)
    } else if (this.renderer.needsFullRender()) {
      // 布局没变但有全量重绘标记（如滚动）
      this.renderer.render(this.root)
    } else {
      // 布局没变，尝试仅重绘视觉变更的节点
      this.renderer.renderVisualChanges(this.root)
    }
  }
}

/**
 * 创建应用实例
 */
export function createApp(selector: string): App {
  const canvas = document.querySelector(selector) as HTMLCanvasElement
  if (!canvas || canvas.tagName !== 'CANVAS') {
    throw new Error(`找不到 Canvas 元素: ${selector}`)
  }
  return new App(canvas)
}
