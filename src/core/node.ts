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
  flexWrap?: 'nowrap' | 'wrap'
  gap?: number
  flexGrow?: number
  flexShrink?: number

  // 百分比尺寸（0~1 表示百分比，如 0.5 = 50%）
  widthPercent?: number
  heightPercent?: number

  // 外观
  background?: string | { type: 'linear'; direction?: 'to right' | 'to bottom' | 'to left' | 'to top'; colors: string[] }
  color?: string
  fontSize?: number
  fontWeight?: 'normal' | 'bold'
  fontFamily?: string
  textAlign?: 'left' | 'center' | 'right'
  lineHeight?: number
  maxLines?: number
  textOverflow?: 'ellipsis' | 'clip'
  whiteSpace?: 'normal' | 'nowrap'
  borderRadius?: number
  border?: string
  borderColor?: string
  borderWidth?: number
  borderStyle?: 'solid' | 'dashed' | 'dotted'

  // 阴影
  shadowColor?: string
  shadowBlur?: number
  shadowOffsetX?: number
  shadowOffsetY?: number

  // 动画
  transition?: { property: string; duration: number; easing?: string }[]
  opacity?: number

  // 图片
  src?: string
  objectFit?: 'cover' | 'contain' | 'fill'

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
 * 影响布局计算的属性集合
 * 修改这些属性需要重新计算布局
 */
export const LAYOUT_AFFECTING_PROPS: Set<string> = new Set([
  'width', 'height', 'minWidth', 'minHeight',
  'padding', 'margin',
  'display', 'flexDirection', 'justifyContent', 'alignItems',
  'flexWrap', 'gap', 'flexGrow', 'flexShrink',
  'widthPercent', 'heightPercent',
  'fontSize', 'fontWeight', 'fontFamily', // 文本尺寸影响布局
  'lineHeight', 'maxLines', 'whiteSpace', 'textOverflow'
])

/**
 * 仅影响视觉渲染的属性集合
 * 修改这些属性只需要重绘，不需要重新布局
 */
export const VISUAL_ONLY_PROPS: Set<string> = new Set([
  'background', 'color', 'borderRadius', 'border',
  'borderColor', 'borderWidth', 'borderStyle',
  'shadowColor', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY',
  'opacity', 'objectFit', 'cursor', 'textAlign'
])

/**
 * 样式变更类型
 */
export const enum StyleChangeType {
  /** 无变更 */
  NONE = 0,
  /** 仅视觉变更（不需要重新布局） */
  VISUAL = 1,
  /** 布局变更（需要重新计算布局） */
  LAYOUT = 2
}

/**
 * 检测样式变更类型
 * 对比新旧样式，判断是否需要重新布局
 */
export function detectStyleChangeType(
  oldStyle: NodeStyle,
  newProps: Partial<NodeStyle>
): StyleChangeType {
  let changeType = StyleChangeType.NONE

  for (const key of Object.keys(newProps)) {
    const oldVal = (oldStyle as any)[key]
    const newVal = (newProps as any)[key]

    // 值没变，跳过
    if (oldVal === newVal) continue

    // 值变了，判断属性类型
    if (LAYOUT_AFFECTING_PROPS.has(key)) {
      return StyleChangeType.LAYOUT // 有布局属性变了，直接返回最高级别
    }

    changeType = StyleChangeType.VISUAL
  }

  return changeType
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
  // 布局是否需要重新计算（脏标记）
  _layoutDirty: boolean = true
  // 视觉是否需要重绘（脏标记）
  _visualDirty: boolean = true

  constructor(style?: NodeStyle) {
    if (style) this.style = style
  }

  /**
   * 智能样式更新
   * 自动检测变更类型，标记最小化的脏区域
   * @returns 变更类型（NONE / VISUAL / LAYOUT）
   */
  setStyle(newProps: Partial<NodeStyle>): StyleChangeType {
    const changeType = detectStyleChangeType(this.style, newProps)

    if (changeType === StyleChangeType.NONE) return changeType

    // 应用样式变更
    Object.assign(this.style, newProps)

    if (changeType === StyleChangeType.LAYOUT) {
      this._layoutDirty = true
      this._visualDirty = true
      // 布局变更需要向上冒泡标记父节点
      let p = this.parent
      while (p) {
        p._layoutDirty = true
        p = p.parent
      }
    } else {
      this._visualDirty = true
    }

    return changeType
  }

  /**
   * 批量更新样式（直接赋值，不做检测）
   * 用于已知只有视觉属性变更的场景，跳过检测开销
   */
  setVisualStyle(newProps: Partial<NodeStyle>): void {
    Object.assign(this.style, newProps)
    this._visualDirty = true
  }

  /**
   * 重置脏标记
   */
  clearDirty(): void {
    this._layoutDirty = false
    this._visualDirty = false
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

/**
 * 图片节点 - 在 Canvas 中绘制图片
 */
export class ImageNode extends CanvasNode {
  type = 'image'
  src: string
  private _image: HTMLImageElement | null = null
  private _loaded: boolean = false
  private _onLoad: (() => void) | null = null

  constructor(src: string, style?: NodeStyle) {
    super(style)
    this.src = src
    this.loadImage()
  }

  /**
   * 设置图片加载完成回调
   */
  onLoad(cb: () => void): this {
    this._onLoad = cb
    if (this._loaded) cb()
    return this
  }

  /**
   * 获取已加载的图片元素
   */
  getImage(): HTMLImageElement | null {
    return this._loaded ? this._image : null
  }

  /**
   * 加载图片
   */
  private loadImage(): void {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      this._image = img
      this._loaded = true
      this._onLoad?.()
    }
    img.onerror = () => {
      console.warn(`[Vuvas] 图片加载失败: ${this.src}`)
    }
    img.src = this.src
  }
}
