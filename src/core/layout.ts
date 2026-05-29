import { CanvasNode, TextNode, ButtonNode, parseSpacing, type LayoutBox } from './node'

/**
 * 布局引擎 - 简化版 Flexbox 实现
 * 负责计算每个节点的最终位置和尺寸
 *
 * 核心流程：
 * 1. 自底向上测量（measure）：计算每个节点的期望尺寸
 * 2. 自顶向下布局（layout）：根据父容器约束分配最终位置
 *
 * 优化策略：
 * - 增量布局：仅重新计算 _layoutDirty 标记为 true 的子树
 * - 跳过纯视觉变更：颜色/透明度等变更不触发布局计算
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
   * 增量布局：仅重新计算标记为 _layoutDirty 的子树
   * 如果没有任何节点需要重新布局，直接跳过
   * @returns 是否执行了布局计算
   */
  computeLayoutIfNeeded(root: CanvasNode, containerWidth: number, containerHeight: number): boolean {
    if (!root._layoutDirty) {
      return false // 无需重新布局
    }
    // 有脏节点，执行完整布局
    this.computeLayout(root, containerWidth, containerHeight)
    // 清除所有脏标记
    this.clearDirtyFlags(root)
    return true
  }

  /**
   * 递归清除所有节点的脏标记
   */
  private clearDirtyFlags(node: CanvasNode): void {
    node._layoutDirty = false
    for (const child of node.children) {
      if (child._layoutDirty) {
        this.clearDirtyFlags(child)
      }
    }
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
    const flexWrap = style.flexWrap || 'nowrap'

    // 计算子节点尺寸（递归测量）
    const childSizes = node.children.map(child => this.measureNode(child, contentWidth, contentHeight))

    // flexWrap 处理
    if (flexWrap === 'wrap') {
      this.layoutWrap(node.children, childSizes, contentX, contentY, contentWidth, contentHeight, direction, justify, align, gap)
    } else if (direction === 'row') {
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
   * flexWrap 布局：当子元素超出容器时自动换行
   */
  private layoutWrap(
    children: CanvasNode[],
    sizes: { width: number; height: number }[],
    x: number, y: number,
    width: number, height: number,
    direction: string, justify: string, align: string, gap: number
  ): void {
    if (direction === 'row') {
      // 水平方向换行
      const lines: { children: CanvasNode[]; sizes: { width: number; height: number }[]; lineHeight: number }[] = []
      let currentLine: { children: CanvasNode[]; sizes: { width: number; height: number }[]; lineHeight: number } = { children: [], sizes: [], lineHeight: 0 }
      let currentWidth = 0

      for (let i = 0; i < children.length; i++) {
        const childWidth = sizes[i].width
        const childHeight = sizes[i].height

        // 判断是否需要换行
        if (currentLine.children.length > 0 && currentWidth + gap + childWidth > width) {
          lines.push(currentLine)
          currentLine = { children: [], sizes: [], lineHeight: 0 }
          currentWidth = 0
        }

        currentLine.children.push(children[i])
        currentLine.sizes.push(sizes[i])
        currentLine.lineHeight = Math.max(currentLine.lineHeight, childHeight)
        currentWidth += (currentLine.children.length > 1 ? gap : 0) + childWidth
      }
      if (currentLine.children.length > 0) lines.push(currentLine)

      // 逐行布局
      let currentY = y
      for (const line of lines) {
        this.layoutRow(line.children, line.sizes, x, currentY, width, line.lineHeight, justify, align, gap)
        currentY += line.lineHeight + gap
      }
    } else {
      // 垂直方向换行（换列）
      const columns: { children: CanvasNode[]; sizes: { width: number; height: number }[]; colWidth: number }[] = []
      let currentCol: { children: CanvasNode[]; sizes: { width: number; height: number }[]; colWidth: number } = { children: [], sizes: [], colWidth: 0 }
      let currentHeight = 0

      for (let i = 0; i < children.length; i++) {
        const childWidth = sizes[i].width
        const childHeight = sizes[i].height

        if (currentCol.children.length > 0 && currentHeight + gap + childHeight > height) {
          columns.push(currentCol)
          currentCol = { children: [], sizes: [], colWidth: 0 }
          currentHeight = 0
        }

        currentCol.children.push(children[i])
        currentCol.sizes.push(sizes[i])
        currentCol.colWidth = Math.max(currentCol.colWidth, childWidth)
        currentHeight += (currentCol.children.length > 1 ? gap : 0) + childHeight
      }
      if (currentCol.children.length > 0) columns.push(currentCol)

      // 逐列布局
      let currentX = x
      for (const col of columns) {
        this.layoutColumn(col.children, col.sizes, currentX, y, col.colWidth, height, justify, align, gap)
        currentX += col.colWidth + gap
      }
    }
  }

  /**
   * 测量节点的期望尺寸（递归）
   * 如果节点没有指定尺寸，则根据子节点内容自动计算
   * 支持百分比尺寸和 auto 尺寸
   * 优化：使用 _measureCache 缓存未变化节点的测量结果
   */
  private measureNode(node: CanvasNode, availableWidth: number, availableHeight: number): { width: number; height: number } {
    // 缓存命中：如果节点未标记为脏且有缓存，直接返回
    if (!node._layoutDirty && node._measureCache) {
      return node._measureCache
    }

    const style = node.getComputedStyle()

    // 快速路径：width 和 height 都已明确指定（最常见的动画场景）
    if (style.width !== undefined && style.height !== undefined) {
      const result = { width: style.width, height: style.height }
      node._measureCache = result
      return result
    }

    const [pt, pr, pb, pl] = parseSpacing(style.padding)

    let width = style.width ?? 0
    let height = style.height ?? 0

    // 百分比尺寸处理
    if (style.widthPercent !== undefined) {
      width = availableWidth * style.widthPercent
    }
    if (style.heightPercent !== undefined) {
      height = availableHeight * style.heightPercent
    }

    // 文本节点 / 按钮节点：根据文本内容计算尺寸（auto 尺寸）
    if (node instanceof TextNode || node instanceof ButtonNode) {
      const text = node instanceof TextNode ? node.text : (node as ButtonNode).text
      const fontSize = style.fontSize || 14
      const textWidth = this.estimateTextWidth(text, fontSize, style.fontWeight)
      if (!style.width && style.widthPercent === undefined) width = textWidth + pl + pr
      if (!style.height && style.heightPercent === undefined) height = fontSize * 1.5 + pt + pb
      const result = { width, height }
      node._measureCache = result
      return result
    }

    // 容器节点：根据子节点计算自适应尺寸
    if (style.width === undefined && style.widthPercent === undefined) {
      width = availableWidth
    }

    // 如果没有指定高度，需要根据子节点内容计算
    if (style.height === undefined && style.heightPercent === undefined) {
      if (node.children.length === 0) {
        height = 40 // 无子节点的空容器默认高度
      } else {
        height = this.measureContentHeight(node, width)
      }
    }

    const result = { width, height }
    node._measureCache = result
    return result
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
   * 支持 flex-grow / flex-shrink
   */
  private layoutRow(
    children: CanvasNode[],
    sizes: { width: number; height: number }[],
    x: number, y: number,
    width: number, height: number,
    justify: string, align: string, gap: number
  ): void {
    const totalGap = gap * (children.length - 1)
    const totalChildWidth = sizes.reduce((sum, s) => sum + s.width, 0)
    let freeSpace = width - totalChildWidth - totalGap

    // flex-grow / flex-shrink 分配
    const finalWidths = sizes.map(s => s.width)
    if (freeSpace > 0) {
      // 有剩余空间，按 flexGrow 分配
      const totalGrow = children.reduce((sum, child) => sum + (child.style.flexGrow || 0), 0)
      if (totalGrow > 0) {
        for (let i = 0; i < children.length; i++) {
          const grow = children[i].style.flexGrow || 0
          if (grow > 0) {
            finalWidths[i] += (grow / totalGrow) * freeSpace
          }
        }
        freeSpace = 0
      }
    } else if (freeSpace < 0) {
      // 空间不足，按 flexShrink 收缩
      const totalShrink = children.reduce((sum, child, i) => {
        return sum + (child.style.flexShrink ?? 1) * sizes[i].width
      }, 0)
      if (totalShrink > 0) {
        const overflow = -freeSpace
        for (let i = 0; i < children.length; i++) {
          const shrink = children[i].style.flexShrink ?? 1
          const shrinkRatio = (shrink * sizes[i].width) / totalShrink
          finalWidths[i] -= shrinkRatio * overflow
          finalWidths[i] = Math.max(0, finalWidths[i])
        }
        freeSpace = 0
      }
    }

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
        width: finalWidths[i],
        height: childHeight
      }

      currentX += finalWidths[i] + gap + (justify === 'space-between' || justify === 'space-around' ? spaceBetween : 0)
    }
  }

  /**
   * 垂直方向布局（column）
   * 支持 flex-grow / flex-shrink
   */
  private layoutColumn(
    children: CanvasNode[],
    sizes: { width: number; height: number }[],
    x: number, y: number,
    width: number, height: number,
    justify: string, align: string, gap: number
  ): void {
    const totalGap = gap * (children.length - 1)
    const totalChildHeight = sizes.reduce((sum, s) => sum + s.height, 0)
    let freeSpace = height - totalChildHeight - totalGap

    // flex-grow / flex-shrink 分配
    const finalHeights = sizes.map(s => s.height)
    if (freeSpace > 0) {
      // 有剩余空间，按 flexGrow 分配
      const totalGrow = children.reduce((sum, child) => sum + (child.style.flexGrow || 0), 0)
      if (totalGrow > 0) {
        for (let i = 0; i < children.length; i++) {
          const grow = children[i].style.flexGrow || 0
          if (grow > 0) {
            finalHeights[i] += (grow / totalGrow) * freeSpace
          }
        }
        freeSpace = 0
      }
    } else if (freeSpace < 0) {
      // 空间不足，按 flexShrink 收缩
      const totalShrink = children.reduce((sum, child, i) => {
        return sum + (child.style.flexShrink ?? 1) * sizes[i].height
      }, 0)
      if (totalShrink > 0) {
        const overflow = -freeSpace
        for (let i = 0; i < children.length; i++) {
          const shrink = children[i].style.flexShrink ?? 1
          const shrinkRatio = (shrink * sizes[i].height) / totalShrink
          finalHeights[i] -= shrinkRatio * overflow
          finalHeights[i] = Math.max(0, finalHeights[i])
        }
        freeSpace = 0
      }
    }

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
        height: finalHeights[i]
      }

      currentY += finalHeights[i] + gap + (justify === 'space-between' || justify === 'space-around' ? spaceBetween : 0)
    }
  }
}
