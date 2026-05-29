/**
 * Vuvas Source Map 生成器
 *
 * 为 .vuvas 单文件组件生成 Source Map，
 * 使得调试时能够映射回原始 .vuvas 文件的对应行号。
 *
 * 基于 VLQ 编码的 Source Map v3 规范实现。
 */

// ============================================================
// Source Map 类型定义
// ============================================================

/** Source Map v3 格式 */
export interface RawSourceMap {
  version: 3
  file?: string
  sourceRoot?: string
  sources: string[]
  sourcesContent?: (string | null)[]
  names: string[]
  mappings: string
}

// ============================================================
// VLQ 编码
// ============================================================

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/**
 * 将数字编码为 VLQ（Variable-Length Quantity）格式
 */
function encodeVLQ(value: number): string {
  let result = ''
  // 将负数转为正数（最低位为符号位）
  let vlq = value < 0 ? ((-value) << 1) + 1 : value << 1

  do {
    let digit = vlq & 0x1f // 取低 5 位
    vlq >>>= 5
    if (vlq > 0) {
      digit |= 0x20 // 设置续位标志
    }
    result += BASE64_CHARS[digit]
  } while (vlq > 0)

  return result
}

// ============================================================
// Source Map 构建器
// ============================================================

/** 映射段 */
interface MappingSegment {
  /** 生成代码的列号 */
  generatedColumn: number
  /** 源文件索引 */
  sourceIndex: number
  /** 源文件行号（0-based） */
  originalLine: number
  /** 源文件列号（0-based） */
  originalColumn: number
}

/**
 * Source Map 构建器
 * 用于逐步构建 Source Map 映射关系
 */
export class SourceMapBuilder {
  private sources: string[] = []
  private sourcesContent: (string | null)[] = []
  private names: string[] = []
  private mappings: MappingSegment[][] = [] // 每行一个数组
  private currentLine: MappingSegment[] = []

  constructor(private file?: string) {
    this.mappings.push(this.currentLine)
  }

  /**
   * 添加源文件
   * @returns 源文件索引
   */
  addSource(source: string, content?: string): number {
    const idx = this.sources.indexOf(source)
    if (idx !== -1) return idx
    this.sources.push(source)
    this.sourcesContent.push(content ?? null)
    return this.sources.length - 1
  }

  /**
   * 添加映射段
   */
  addMapping(
    generatedColumn: number,
    sourceIndex: number,
    originalLine: number,
    originalColumn: number
  ): void {
    this.currentLine.push({
      generatedColumn,
      sourceIndex,
      originalLine,
      originalColumn
    })
  }

  /**
   * 换行（生成代码的新行）
   */
  newLine(): void {
    this.currentLine = []
    this.mappings.push(this.currentLine)
  }

  /**
   * 生成 Source Map 对象
   */
  build(): RawSourceMap {
    return {
      version: 3,
      file: this.file,
      sources: this.sources,
      sourcesContent: this.sourcesContent,
      names: this.names,
      mappings: this.encodeMappings()
    }
  }

  /**
   * 生成 Source Map JSON 字符串
   */
  toJSON(): string {
    return JSON.stringify(this.build())
  }

  /**
   * 生成内联 Source Map（data URL）
   */
  toInlineComment(): string {
    const json = this.toJSON()
    const base64 = btoa(unescape(encodeURIComponent(json)))
    return `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${base64}`
  }

  /**
   * 编码所有映射为 VLQ 字符串
   */
  private encodeMappings(): string {
    let previousGeneratedColumn = 0
    let previousSourceIndex = 0
    let previousOriginalLine = 0
    let previousOriginalColumn = 0

    const lines: string[] = []

    for (const line of this.mappings) {
      previousGeneratedColumn = 0
      const segments: string[] = []

      // 按列号排序
      const sorted = [...line].sort((a, b) => a.generatedColumn - b.generatedColumn)

      for (const segment of sorted) {
        let encoded = ''

        // 生成列号（相对于上一个段）
        encoded += encodeVLQ(segment.generatedColumn - previousGeneratedColumn)
        previousGeneratedColumn = segment.generatedColumn

        // 源文件索引
        encoded += encodeVLQ(segment.sourceIndex - previousSourceIndex)
        previousSourceIndex = segment.sourceIndex

        // 源文件行号
        encoded += encodeVLQ(segment.originalLine - previousOriginalLine)
        previousOriginalLine = segment.originalLine

        // 源文件列号
        encoded += encodeVLQ(segment.originalColumn - previousOriginalColumn)
        previousOriginalColumn = segment.originalColumn

        segments.push(encoded)
      }

      lines.push(segments.join(','))
    }

    return lines.join(';')
  }
}

// ============================================================
// SFC Source Map 生成辅助
// ============================================================

/**
 * 为 SFC 编译结果生成 Source Map
 *
 * 映射策略：
 * - <script setup> 内容 → 映射到原始 .vuvas 文件的对应行
 * - <template> 编译结果 → 映射到 template 块的起始行
 * - <style> 编译结果 → 映射到 style 块的起始行
 */
export function generateSFCSourceMap(
  filename: string,
  source: string,
  compiledCode: string,
  scriptLoc?: { start: number; end: number },
  templateLoc?: { start: number; end: number }
): RawSourceMap {
  const builder = new SourceMapBuilder(filename + '.js')
  const sourceIdx = builder.addSource(filename, source)

  const compiledLines = compiledCode.split('\n')

  // 简单映射策略：逐行映射
  // 找到 script 内容在编译结果中的位置
  let inSetup = false
  let scriptLineOffset = scriptLoc ? scriptLoc.start + 1 : 0 // +1 跳过 <script setup> 标签行
  let currentOriginalLine = 0

  for (let i = 0; i < compiledLines.length; i++) {
    const line = compiledLines[i]

    // 检测是否进入 setup 函数体
    if (line.includes('setup()')) {
      inSetup = true
      currentOriginalLine = scriptLineOffset
      builder.addMapping(0, sourceIdx, scriptLineOffset, 0)
      builder.newLine()
      continue
    }

    // 在 setup 函数体内，映射到原始 script 行
    if (inSetup && !line.includes('return') && line.trim() !== '}') {
      builder.addMapping(0, sourceIdx, currentOriginalLine, 0)
      currentOriginalLine++
    } else if (line.includes('// 模板编译结果') && templateLoc) {
      // 模板编译结果映射到 template 块
      builder.addMapping(0, sourceIdx, templateLoc.start, 0)
    } else {
      // 其他行映射到文件开头
      builder.addMapping(0, sourceIdx, 0, 0)
    }

    if (i < compiledLines.length - 1) {
      builder.newLine()
    }
  }

  return builder.build()
}
