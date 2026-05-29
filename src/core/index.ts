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
 * html-in-canvas 应用实例
 */
export class App {
  private canvas: HTMLCanvasElement
  private renderer: Renderer
  private layout: LayoutEngine
  private events: EventManager
  private root: CanvasNode | null = null
  private _rafId: number | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.renderer = new Renderer(canvas)
    this.layout = new LayoutEngine()
    this.events = new EventManager(canvas)

    // 事件系统触发重渲染
    this.events.setRenderCallback(() => this.scheduleRender())
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
   * 执行一次完整的布局 + 渲染
   */
  render(): void {
    if (!this.root) return
    // 计算布局
    const width = this.canvas.width / (window.devicePixelRatio || 1)
    const height = this.canvas.height / (window.devicePixelRatio || 1)
    this.layout.computeLayout(this.root, width, height)
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
