/**
 * Vuvas 单文件组件（SFC）解析器
 *
 * 解析 .vuvas 单文件组件格式：
 *
 * ```vuvas
 * <template>
 *   <view :style="style">
 *     <text>{{ message }}</text>
 *   </view>
 * </template>
 *
 * <script setup>
 * import { ref } from 'vuvas'
 * const message = ref('Hello Vuvas!')
 * </script>
 *
 * <style scoped>
 * view { backgroundColor: #fff; padding: 20; }
 * text { fontSize: 16; color: #333; }
 * </style>
 * ```
 */

// ============================================================
// SFC 描述符
// ============================================================

/** SFC 解析结果 */
export interface SFCDescriptor {
  /** 文件名 */
  filename: string
  /** template 块 */
  template: SFCBlock | null
  /** script 块 */
  script: SFCScriptBlock | null
  /** style 块列表（可以有多个） */
  styles: SFCStyleBlock[]
}

/** 基础块 */
export interface SFCBlock {
  /** 块内容 */
  content: string
  /** 块属性 */
  attrs: Record<string, string | true>
  /** 源码中的起始行号 */
  loc: { start: number; end: number }
}

/** script 块 */
export interface SFCScriptBlock extends SFCBlock {
  /** 是否为 <script setup> */
  setup: boolean
  /** lang 属性（ts, js 等） */
  lang?: string
}

/** style 块 */
export interface SFCStyleBlock extends SFCBlock {
  /** 是否 scoped */
  scoped: boolean
  /** lang 属性（css, scss 等） */
  lang?: string
}

// ============================================================
// SFC 解析器
// ============================================================

/**
 * 解析 .vuvas 单文件组件
 *
 * @param source - 文件源码
 * @param filename - 文件名（用于错误提示）
 */
export function parseSFC(source: string, filename: string = 'anonymous.vuvas'): SFCDescriptor {
  const descriptor: SFCDescriptor = {
    filename,
    template: null,
    script: null,
    styles: []
  }

  const lines = source.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()

    // 匹配 <template>
    if (line.match(/^<template(\s|>)/)) {
      const block = parseBlock(lines, i, 'template')
      descriptor.template = {
        content: block.content,
        attrs: block.attrs,
        loc: block.loc
      }
      i = block.loc.end + 1
      continue
    }

    // 匹配 <script> 或 <script setup>
    if (line.match(/^<script(\s|>)/)) {
      const block = parseBlock(lines, i, 'script')
      const isSetup = 'setup' in block.attrs
      const lang = typeof block.attrs.lang === 'string' ? block.attrs.lang : undefined
      descriptor.script = {
        content: block.content,
        attrs: block.attrs,
        loc: block.loc,
        setup: isSetup,
        lang
      }
      i = block.loc.end + 1
      continue
    }

    // 匹配 <style>
    if (line.match(/^<style(\s|>)/)) {
      const block = parseBlock(lines, i, 'style')
      const isScoped = 'scoped' in block.attrs
      const lang = typeof block.attrs.lang === 'string' ? block.attrs.lang : undefined
      descriptor.styles.push({
        content: block.content,
        attrs: block.attrs,
        loc: block.loc,
        scoped: isScoped,
        lang
      })
      i = block.loc.end + 1
      continue
    }

    i++
  }

  return descriptor
}

/**
 * 解析一个块（template/script/style）
 */
function parseBlock(
  lines: string[],
  startLine: number,
  tagName: string
): { content: string; attrs: Record<string, string | true>; loc: { start: number; end: number } } {
  // 解析开始标签的属性
  const openTag = lines[startLine].trim()
  const attrs = parseTagAttrs(openTag, tagName)

  // 查找结束标签
  const closeTag = `</${tagName}>`
  let endLine = startLine + 1
  while (endLine < lines.length) {
    if (lines[endLine].trim() === closeTag) {
      break
    }
    endLine++
  }

  if (endLine >= lines.length) {
    throw new Error(`[Vuvas SFC] 未找到 </${tagName}> 关闭标签`)
  }

  // 提取内容（不包含开始和结束标签行）
  const contentLines = lines.slice(startLine + 1, endLine)
  const content = contentLines.join('\n')

  return {
    content,
    attrs,
    loc: { start: startLine, end: endLine }
  }
}

/**
 * 解析标签上的属性
 * 例如: <script setup lang="ts"> -> { setup: true, lang: "ts" }
 */
function parseTagAttrs(openTag: string, tagName: string): Record<string, string | true> {
  const attrs: Record<string, string | true> = {}

  // 去掉 < 和 > 以及标签名
  const match = openTag.match(new RegExp(`^<${tagName}\\s*(.*)>$`))
  if (!match) return attrs

  const attrStr = match[1].trim()
  if (!attrStr) return attrs

  // 简单的属性解析
  const attrRegex = /(\w[\w-]*)(?:=(?:"([^"]*)"|'([^']*)'))?/g
  let m: RegExpExecArray | null
  while ((m = attrRegex.exec(attrStr)) !== null) {
    const name = m[1]
    const value = m[2] ?? m[3]
    attrs[name] = value !== undefined ? value : true
  }

  return attrs
}

// ============================================================
// SFC 编译器（将 SFC 编译为可执行模块）
// ============================================================

/** SFC 编译结果 */
export interface SFCCompileResult {
  /** 编译后的 JS 代码 */
  code: string
  /** 解析后的描述符 */
  descriptor: SFCDescriptor
}

/**
 * 编译 .vuvas 单文件组件为 JS 模块代码
 *
 * 生成的代码结构：
 * ```js
 * import { defineComponent, h, ref, ... } from 'vuvas'
 * // <script setup> 内容
 * export default defineComponent({
 *   setup() {
 *     // script setup 内容
 *     return () => { /* 编译后的渲染函数 *\/ }
 *   }
 * })
 * ```
 */
export function compileSFC(source: string, filename?: string): SFCCompileResult {
  const descriptor = parseSFC(source, filename)

  let code = ''

  // 处理 <script setup>
  if (descriptor.script?.setup) {
    const scriptContent = descriptor.script.content

    // 提取 import 语句
    const importRegex = /^import\s+.+$/gm
    const imports: string[] = []
    const scriptBody = scriptContent.replace(importRegex, (match) => {
      imports.push(match)
      return ''
    }).trim()

    // 生成 import 语句
    code += imports.join('\n')
    if (imports.length > 0) code += '\n\n'

    // 确保导入了 defineComponent 和 h
    if (!imports.some(imp => imp.includes('defineComponent'))) {
      code = `import { defineComponent, h } from 'vuvas'\n` + code
    }

    // 生成模板的渲染函数代码
    let renderCode = 'null'
    if (descriptor.template) {
      // 这里生成内联渲染函数
      renderCode = generateInlineRender(descriptor.template.content)
    }

    // 生成组件定义
    code += `export default defineComponent({\n`
    code += `  name: ${JSON.stringify(filename || 'Anonymous')},\n`
    code += `  setup() {\n`
    // 缩进 script body
    code += scriptBody.split('\n').map(line => `    ${line}`).join('\n')
    code += '\n\n'
    code += `    return ${renderCode}\n`
    code += `  }\n`
    code += `})\n`
  } else if (descriptor.script) {
    // 普通 <script>，直接使用
    code = descriptor.script.content
  }

  // 处理 <style>（生成样式对象）
  if (descriptor.styles.length > 0) {
    const styleCode = generateStyleCode(descriptor.styles)
    code += '\n' + styleCode
  }

  return { code, descriptor }
}

/**
 * 生成内联渲染函数代码
 * 将模板编译为 () => h(...) 形式
 */
function generateInlineRender(template: string): string {
  // 复用编译器的 compile 逻辑
  // 这里简化处理：生成一个箭头函数
  return `() => {\n      // 模板编译结果（运行时编译）\n      const { compile } = require('vuvas')\n      const { render } = compile(${JSON.stringify(template)})\n      return render({ /* ctx */ }, h)\n    }`
}

/**
 * 生成样式代码
 * 将 CSS-like 语法转为 Vuvas 样式对象
 */
function generateStyleCode(styles: SFCStyleBlock[]): string {
  let code = '// 样式定义\n'
  code += 'const __styles__ = {}\n'

  for (const style of styles) {
    const rules = parseCSSRules(style.content)
    for (const [selector, properties] of Object.entries(rules)) {
      code += `__styles__[${JSON.stringify(selector)}] = ${JSON.stringify(properties)}\n`
    }
  }

  return code
}

/**
 * 简单的 CSS 规则解析器
 * 将 CSS-like 语法解析为 { selector: { prop: value } }
 */
function parseCSSRules(css: string): Record<string, Record<string, string | number>> {
  const rules: Record<string, Record<string, string | number>> = {}

  // 匹配 selector { ... }
  const ruleRegex = /([^{]+)\{([^}]*)\}/g
  let match: RegExpExecArray | null

  while ((match = ruleRegex.exec(css)) !== null) {
    const selector = match[1].trim()
    const body = match[2].trim()
    const properties: Record<string, string | number> = {}

    // 解析属性
    const propPairs = body.split(';').filter(s => s.trim())
    for (const pair of propPairs) {
      const colonIdx = pair.indexOf(':')
      if (colonIdx === -1) continue
      const prop = pair.slice(0, colonIdx).trim()
      const value = pair.slice(colonIdx + 1).trim()

      // 将 CSS 属性名转为 camelCase
      const camelProp = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())

      // 尝试转为数字
      const numValue = Number(value)
      properties[camelProp] = isNaN(numValue) ? value : numValue
    }

    rules[selector] = properties
  }

  return rules
}
