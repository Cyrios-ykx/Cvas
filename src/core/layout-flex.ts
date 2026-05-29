/**
 * Vuvas 布局引擎 - Flex 布局实现
 * 包含 row / column / wrap 三种布局方向的具体实现
 */

import { CanvasNode } from './node'

/**
 * 水平方向布局（row）
 * 支持 flex-grow / flex-shrink
 */
export function layoutRow(
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
export function layoutColumn(
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

/**
 * flexWrap 布局：当子元素超出容器时自动换行
 */
export function layoutWrap(
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
      layoutRow(line.children, line.sizes, x, currentY, width, line.lineHeight, justify, align, gap)
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
      layoutColumn(col.children, col.sizes, currentX, y, col.colWidth, height, justify, align, gap)
      currentX += col.colWidth + gap
    }
  }
}
