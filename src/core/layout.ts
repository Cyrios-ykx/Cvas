import { CanvasNode, TextNode, ButtonNode, parseSpacing, type LayoutBox } from './node'
import { layoutRow, layoutColumn, layoutWrap } from './layout-flex'

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
      const contentHeight = this.measureContentHeight(root, rootWidth)
      rootHeight = Math.max(contentHeight, containerHeight)
    }

    root.layout = { x: 0, y: 0, width: rootWidth, height: rootHeight }
    this.layoutNode(root)
  }

  /**
   * 增量布局：仅重新计算标记为 _layoutDirty 的子树
   * @returns 是否执行了布局计算
   */
  computeLayoutIfNeeded(root: CanvasNode, containerWidth: number, containerHeight: number): boolean {
    if (!root._layoutDirty) {
      return false
    }
    this.computeLayout(root, containerWidth, containerHeight)
    this.clearDirtyFlags(root)
    return true
  }

  /**
   * 递归清除所有节点的脏标记
   */
  private clearDirtyFlags(node: CanvasNode): void {
    node._layoutDirty = false
    node._visualDirty = false
    for (const child of node.children) {
      if (child._layoutDirty || child._visualDirty) {
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

    // 委托到具体的布局实现
    if (flexWrap === 'wrap') {
      layoutWrap(node.children, childSizes, contentX, contentY, contentWidth, contentHeight, direction, justify, align, gap)
    } else if (direction === 'row') {
      layoutRow(node.children, childSizes, contentX, contentY, contentWidth, contentHeight, justify, align, gap)
    } else {
      layoutColumn(node.children, childSizes, contentX, contentY, contentWidth, contentHeight, justify, align, gap)
    }

    // 递归处理子节点的子节点
    for (const child of node.children) {
      this.layoutNode(child)
    }
  }

  /**
   * 测量节点的期望尺寸（递归）
   * 优化：使用 _measureCache 缓存未变化节点的测量结果
   */
  private measureNode(node: CanvasNode, availableWidth: number, availableHeight: number): { width: number; height: number } {
    // 缓存命中
    if (!node._layoutDirty && node._measureCache) {
      return node._measureCache
    }

    const style = node.getComputedStyle()

    // 快速路径：width 和 height 都已明确指定
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

    // 文本节点 / 按钮节点：根据文本内容计算尺寸
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

    if (style.height === undefined && style.heightPercent === undefined) {
      if (node.children.length === 0) {
        height = 40
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

    const childSizes = node.children.map(child =>
      this.measureNode(child, contentWidth, Infinity)
    )

    if (direction === 'column') {
      const totalChildHeight = childSizes.reduce((sum, s) => sum + s.height, 0)
      const totalGap = gap * (node.children.length - 1)
      return totalChildHeight + totalGap + pt + pb
    } else {
      const maxChildHeight = childSizes.reduce((max, s) => Math.max(max, s.height), 0)
      return maxChildHeight + pt + pb
    }
  }

  /**
   * 估算文本宽度
   */
  private estimateTextWidth(text: string, fontSize: number, fontWeight?: string): number {
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
}
