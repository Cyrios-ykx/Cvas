import { CanvasNode, TextNode, ButtonNode, parseSpacing, type LayoutBox } from './node'

/**
 * 布局引擎 - 简化版 Flexbox 实现
 * 负责计算每个节点的最终位置和尺寸
 *
 * 核心流程：
 * 1. 自底向上测量（measure）：计算每个节点的期望尺寸
 * 2. 自顶向下布局（layout）：根据父容器约束分配最终位置
 */
export class LayoutEngine {
  /**
   * 计算整棵节点树的布局
   */
  computeLayout(root: CanvasNode, containerWidth: number, containerHeight: number): void {
    const rootWidth = root.style.width ?? containerWidth

    // 根节点高度：如果未指定，先用内容自适应高度，再取与视口高度的较大值
    let rootHeight: number
    if (root.style.height !== undefined) {
      rootHeight = root.style.height
    } else {
      // 先测量内容高度
      const contentHeight = this.measureContentHeight(root, rootWidth)
      rootHeight = Math.max(contentHeight, containerHeight)
    }

    root.layout = {
      x: 0,
      y: 0,
      width: rootWidth,
      height: rootHeight
    }
    this.layoutNode(root)
  }

  /**
   * 递归计算节点布局
   */
  private layoutNode(node: CanvasNode): void {
    const style = node.getComputedStyle()
    const [pt, pr, pb, pl] = parseSpacing(style.padding)
    const layout = node.layout

    // 内容区域
    const contentX = layout.x + pl
    const contentY = layout.y + pt
    const contentWidth = layout.width - pl - pr
    const contentHeight = layout.height - pt - pb

    if (node.children.length === 0) return

    const direction = style.flexDirection || 'column'
    const justify = style.justifyContent || 'flex-start'
    const align = style.alignItems || 'stretch'
    const gap = style.gap || 0

    // 计算子节点尺寸（递归测量）
    const childSizes = node.children.map(child => this.measureNode(child, contentWidth, contentHeight))

    if (direction === 'row') {
      this.layoutRow(node.children, childSizes, contentX, contentY, contentWidth, contentHeight, justify, align, gap)
    } else {
      this.layoutColumn(node.children, childSizes, contentX, contentY, contentWidth, contentHeight, justify, align, gap)
    }

    // 递归处理子节点的子节点
    for (const child of node.children) {
      this.layoutNode(child)
    }
  }

  /**
   * 测量节点的期望尺寸（递归）
   * 如果节点没有指定尺寸，则根据子节点内容自动计算
   */
  private measureNode(node: CanvasNode, availableWidth: number, availableHeight: number): { width: number; height: number } {
    const style = node.getComputedStyle()
    const [pt, pr, pb, pl] = parseSpacing(style.padding)

    let width = style.width ?? 0
    let height = style.height ?? 0

    // 文本节点 / 按钮节点：根据文本内容计算尺寸
    if (node instanceof TextNode || node instanceof ButtonNode) {
      const text = node instanceof TextNode ? node.text : (node as ButtonNode).text
      const fontSize = style.fontSize || 14
      const textWidth = this.estimateTextWidth(text, fontSize, style.fontWeight)
      if (!style.width) width = textWidth + pl + pr
      if (!style.height) height = fontSize * 1.5 + pt + pb
      return { width, height }
    }

    // 容器节点：根据子节点计算自适应尺寸
    if (style.width === undefined) {
      width = availableWidth
    }

    // 如果没有指定高度，需要根据子节点内容计算
    if (style.height === undefined) {
      if (node.children.length === 0) {
        height = 40 // 无子节点的空容器默认高度
      } else {
        height = this.measureContentHeight(node, width)
      }
    }

    return { width, height }
  }

  /**
   * 根据子节点内容计算容器的自适应高度
   */
  private measureContentHeight(node: CanvasNode, containerWidth: number): number {
    const style = node.getComputedStyle()
    const [pt, pr, pb, pl] = parseSpacing(style.padding)
    const direction = style.flexDirection || 'column'
    const gap = style.gap || 0

    const contentWidth = containerWidth - pl - pr

    // 递归测量所有子节点
    const childSizes = node.children.map(child =>
      this.measureNode(child, contentWidth, Infinity)
    )

    if (direction === 'column') {
      // 纵向排列：高度 = 所有子节点高度之和 + gap + padding
      const totalChildHeight = childSizes.reduce((sum, s) => sum + s.height, 0)
      const totalGap = gap * (node.children.length - 1)
      return totalChildHeight + totalGap + pt + pb
    } else {
      // 横向排列：高度 = 最高子节点的高度 + padding
      const maxChildHeight = childSizes.reduce((max, s) => Math.max(max, s.height), 0)
      return maxChildHeight + pt + pb
    }
  }

  /**
   * 估算文本宽度
   */
  private estimateTextWidth(text: string, fontSize: number, fontWeight?: string): number {
    // 中文字符宽度约等于 fontSize，英文约 0.6 * fontSize
    let width = 0
    for (const char of text) {
      if (char.charCodeAt(0) > 127) {
        width += fontSize
      } else {
        width += fontSize * 0.6
      }
    }
    if (fontWeight === 'bold') width *= 1.05
    return width
  }

  /**
   * 水平方向布局（row）
   */
  private layoutRow(
    children: CanvasNode[],
    sizes: { width: number; height: number }[],
    x: number, y: number,
    width: number, height: number,
    justify: string, align: string, gap: number
  ): void {
    const totalChildWidth = sizes.reduce((sum, s) => sum + s.width, 0)
    const totalGap = gap * (children.length - 1)
    const freeSpace = width - totalChildWidth - totalGap

    // 计算起始 x 位置
    let currentX = x
    let spaceBetween = 0

    switch (justify) {
      case 'center':
        currentX = x + freeSpace / 2
        break
      case 'flex-end':
        currentX = x + freeSpace
        break
      case 'space-between':
        spaceBetween = children.length > 1 ? freeSpace / (children.length - 1) : 0
        break
      case 'space-around':
        const spaceAround = freeSpace / children.length
        currentX = x + spaceAround / 2
        spaceBetween = spaceAround
        break
    }

    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      const size = sizes[i]

      // 计算 y 位置（交叉轴对齐）
      let childY = y
      const childHeight = align === 'stretch' ? height : size.height
      switch (align) {
        case 'center':
          childY = y + (height - childHeight) / 2
          break
        case 'flex-end':
          childY = y + height - childHeight
          break
      }

      child.layout = {
        x: currentX,
        y: childY,
        width: size.width,
        height: childHeight
      }

      currentX += size.width + gap + (justify === 'space-between' || justify === 'space-around' ? spaceBetween : 0)
    }
  }

  /**
   * 垂直方向布局（column）
   */
  private layoutColumn(
    children: CanvasNode[],
    sizes: { width: number; height: number }[],
    x: number, y: number,
    width: number, height: number,
    justify: string, align: string, gap: number
  ): void {
    const totalChildHeight = sizes.reduce((sum, s) => sum + s.height, 0)
    const totalGap = gap * (children.length - 1)
    const freeSpace = height - totalChildHeight - totalGap

    // 计算起始 y 位置
    let currentY = y
    let spaceBetween = 0

    switch (justify) {
      case 'center':
        currentY = y + freeSpace / 2
        break
      case 'flex-end':
        currentY = y + freeSpace
        break
      case 'space-between':
        spaceBetween = children.length > 1 ? freeSpace / (children.length - 1) : 0
        break
      case 'space-around':
        const spaceAround = freeSpace / children.length
        currentY = y + spaceAround / 2
        spaceBetween = spaceAround
        break
    }

    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      const size = sizes[i]

      // 计算 x 位置（交叉轴对齐）
      let childX = x
      const childWidth = align === 'stretch' ? width : size.width
      switch (align) {
        case 'center':
          childX = x + (width - childWidth) / 2
          break
        case 'flex-end':
          childX = x + width - childWidth
          break
      }

      child.layout = {
        x: childX,
        y: currentY,
        width: childWidth,
        height: size.height
      }

      currentY += size.height + gap + (justify === 'space-between' || justify === 'space-around' ? spaceBetween : 0)
    }
  }
}
