import { CanvasNode } from './node'
import { LayoutEngine } from './layout'
import { Renderer } from './renderer'
import { EventManager } from './event'

export { CanvasNode, TextNode, ButtonNode } from './node'
export type { NodeStyle, CanvasEvent, EventHandler } from './node'
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
      this.render()
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
    this.scheduleRender()
  }

  /**
   * 执行一次完整的布局 + 渲染
   */
  render(): void {
    if (!this.root) return

    // 获取视口尺寸
    const { width, height } = this.renderer.getViewportSize()

    // 计算布局（使用视口宽度，但高度不限制，让内容自然撑开）
    this.layout.computeLayout(this.root, width, height)

    // 计算最大滚动范围（内容高度 - 视口高度）
    const contentHeight = this.root.layout.height
    this.maxScrollY = Math.max(0, contentHeight - height)

    // 确保当前滚动位置不超出范围
    if (this.scrollY > this.maxScrollY) {
      this.scrollY = this.maxScrollY
      this.renderer.scrollY = this.scrollY
      this.events.setScrollY(this.scrollY)
    }

    // 渲染到 Canvas
    this.renderer.render(this.root)
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
