/**
 * 节点样式定义
 */
export interface NodeStyle {
  // 尺寸
  width?: number
  height?: number
  minWidth?: number
  minHeight?: number

  // 盒模型
  padding?: number | [number, number] | [number, number, number, number]
  margin?: number | [number, number] | [number, number, number, number]

  // Flexbox
  display?: 'flex' | 'block'
  flexDirection?: 'row' | 'column'
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around'
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch'
  gap?: number

  // 外观
  background?: string
  color?: string
  fontSize?: number
  fontWeight?: 'normal' | 'bold'
  fontFamily?: string
  textAlign?: 'left' | 'center' | 'right'
  borderRadius?: number
  border?: string
  borderColor?: string
  borderWidth?: number

  // 阴影
  shadowColor?: string
  shadowBlur?: number
  shadowOffsetX?: number
  shadowOffsetY?: number

  // 定位辅助
  overflow?: 'visible' | 'hidden'
  cursor?: string
}

/**
 * 计算后的布局信息
 */
export interface LayoutBox {
  x: number
  y: number
  width: number
  height: number
}

/**
 * 解析 padding/margin 为四个方向的值
 */
export function parseSpacing(value?: number | [number, number] | [number, number, number, number]): [number, number, number, number] {
  if (value === undefined) return [0, 0, 0, 0]
  if (typeof value === 'number') return [value, value, value, value]
  if (value.length === 2) return [value[0], value[1], value[0], value[1]]
  return value
}

/**
 * 事件处理器类型
 */
export type EventHandler = (event: CanvasEvent) => void

/**
 * Canvas 事件对象
 */
export interface CanvasEvent {
  type: string
  target: CanvasNode
  x: number
  y: number
  stopPropagation: () => void
  _stopped?: boolean
}

/**
 * Canvas 节点 - 所有可渲染元素的基类
 */
export class CanvasNode {
  // 节点类型
  type: string = 'view'
  // 样式
  style: NodeStyle = {}
  // 子节点
  children: CanvasNode[] = []
  // 父节点
  parent: CanvasNode | null = null
  // 计算后的布局
  layout: LayoutBox = { x: 0, y: 0, width: 0, height: 0 }
  // 事件监听器
  private _listeners: Map<string, EventHandler[]> = new Map()
  // hover 状态
  isHovered: boolean = false
  // hover 时的样式覆盖
  hoverStyle?: Partial<NodeStyle>

  constructor(style?: NodeStyle) {
    if (style) this.style = style
  }

  /**
   * 添加子节点
   */
  append(...nodes: CanvasNode[]): this {
    for (const node of nodes) {
      node.parent = this
      this.children.push(node)
    }
    return this
  }

  /**
   * 移除子节点
   */
  remove(node: CanvasNode): this {
    const idx = this.children.indexOf(node)
    if (idx !== -1) {
      this.children.splice(idx, 1)
      node.parent = null
    }
    return this
  }

  /**
   * 注册事件监听
   */
  on(event: string, handler: EventHandler): this {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, [])
    }
    this._listeners.get(event)!.push(handler)
    return this
  }

  /**
   * 移除事件监听
   */
  off(event: string, handler: EventHandler): this {
    const handlers = this._listeners.get(event)
    if (handlers) {
      const idx = handlers.indexOf(handler)
      if (idx !== -1) handlers.splice(idx, 1)
    }
    return this
  }

  /**
   * 触发事件
   */
  emit(event: string, e: CanvasEvent): void {
    const handlers = this._listeners.get(event)
    if (handlers) {
      for (const handler of handlers) {
        handler(e)
        if (e._stopped) break
      }
    }
  }

  /**
   * 获取当前生效的样式（考虑 hover 状态）
   */
  getComputedStyle(): NodeStyle {
    if (this.isHovered && this.hoverStyle) {
      return { ...this.style, ...this.hoverStyle }
    }
    return this.style
  }
}

/**
 * 文本节点
 */
export class TextNode extends CanvasNode {
  type = 'text'
  text: string

  constructor(text: string, style?: NodeStyle) {
    super(style)
    this.text = text
  }
}

/**
 * 按钮节点 - 带有默认样式的可交互节点
 */
export class ButtonNode extends CanvasNode {
  type = 'button'
  text: string

  constructor(text: string, style?: NodeStyle) {
    super({
      padding: [8, 16],
      background: '#42b883',
      color: '#ffffff',
      fontSize: 14,
      fontWeight: 'bold',
      borderRadius: 6,
      cursor: 'pointer',
      ...style
    })
    this.text = text
    // 默认 hover 效果
    this.hoverStyle = { background: '#3aa876' }
  }
}
