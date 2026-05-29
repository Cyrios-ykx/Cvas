import { parseSpacing, type NodeStyle } from './node'

/**
 * 绘制文本（支持换行、对齐、省略号等）
 */
export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  style: NodeStyle
): void {
  const fontSize = style.fontSize || 14
  const fontWeight = style.fontWeight || 'normal'
  const fontFamily = style.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  const color = style.color || '#333333'
  const textAlign = style.textAlign || 'center'
  const lineHeight = style.lineHeight || fontSize * 1.4
  const maxLines = style.maxLines || 0
  const whiteSpace = style.whiteSpace || 'normal'
  const textOverflow = style.textOverflow || 'clip'

  // 透明度
  if (style.opacity !== undefined) {
    ctx.globalAlpha = style.opacity
  }

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
  ctx.fillStyle = color
  ctx.textBaseline = 'top'

  const [_pt, pr, _pb, pl] = parseSpacing(style.padding)
  const maxWidth = w - pl - pr

  // 计算文本 X 坐标
  let textX: number
  switch (textAlign) {
    case 'left':
      ctx.textAlign = 'left'
      textX = x + pl
      break
    case 'right':
      ctx.textAlign = 'right'
      textX = x + w - pr
      break
    default:
      ctx.textAlign = 'center'
      textX = x + w / 2
      break
  }

  // 不换行模式：单行绘制
  if (whiteSpace === 'nowrap') {
    ctx.textBaseline = 'middle'
    const textY = y + h / 2
    let displayText = text
    // 文本溢出处理
    if (ctx.measureText(text).width > maxWidth && textOverflow === 'ellipsis') {
      displayText = truncateText(ctx, text, maxWidth)
    }
    ctx.fillText(displayText, textX, textY, maxWidth)
    return
  }

  // 换行模式：将文本拆分为多行
  const lines = wrapText(ctx, text, maxWidth)

  // 限制最大行数
  let displayLines = lines
  if (maxLines > 0 && lines.length > maxLines) {
    displayLines = lines.slice(0, maxLines)
    // 最后一行添加省略号
    if (textOverflow === 'ellipsis') {
      const lastLine = displayLines[displayLines.length - 1]
      displayLines[displayLines.length - 1] = truncateText(ctx, lastLine + '...', maxWidth)
    }
  }

  // 计算起始 Y（垂直居中）
  const totalTextHeight = displayLines.length * lineHeight
  const startY = y + (h - totalTextHeight) / 2

  // 逐行绘制
  for (let i = 0; i < displayLines.length; i++) {
    const lineY = startY + i * lineHeight + lineHeight / 2
    ctx.textBaseline = 'middle'
    ctx.fillText(displayLines[i], textX, lineY, maxWidth)
  }

  // 恢复透明度
  if (style.opacity !== undefined) {
    ctx.globalAlpha = 1
  }
}

/**
 * 文本换行：将文本按宽度拆分为多行
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  // 先按换行符分割
  const paragraphs = text.split('\n')

  for (const paragraph of paragraphs) {
    if (ctx.measureText(paragraph).width <= maxWidth) {
      lines.push(paragraph)
      continue
    }

    // 逐字符计算换行
    let currentLine = ''
    for (const char of paragraph) {
      const testLine = currentLine + char
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = char
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) {
      lines.push(currentLine)
    }
  }

  return lines
}

/**
 * 截断文本并添加省略号
 */
function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  const ellipsis = '...'
  const ellipsisWidth = ctx.measureText(ellipsis).width

  if (ctx.measureText(text).width <= maxWidth) return text

  let truncated = ''
  for (const char of text) {
    if (ctx.measureText(truncated + char + ellipsis).width > maxWidth) {
      return truncated + ellipsis
    }
    truncated += char
  }
  return truncated + ellipsis
}
