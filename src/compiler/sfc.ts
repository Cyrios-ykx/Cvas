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

import { generateSFCSourceMap, type RawSourceMap } from './sourcemap'

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
  /** Source Map */
  map: RawSourceMap | null
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
 *     return () => h('view', ...) // 编译后的渲染函数
 *   }
 * })
 * ```
 */
export function compileSFC(source: string, filename?: string, options?: { sourceMap?: boolean }): SFCCompileResult {
  const descriptor = parseSFC(source, filename)
  const enableSourceMap = options?.sourceMap !== false

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

    // 重写 import：将 from 'vuvas' 的导入合并处理
    const vuvasImports: Set<string> = new Set(['defineComponent', 'h', 'compile', 'unref'])
    const otherImports: string[] = []

    for (const imp of imports) {
      // 匹配 import { xxx } from 'vuvas'
      const vuvasMatch = imp.match(/^import\s+\{([^}]+)\}\s+from\s+['"]vuvas['"]$/)
      if (vuvasMatch) {
        // 提取导入的标识符
        const names = vuvasMatch[1].split(',').map(s => s.trim()).filter(Boolean)
        names.forEach(n => vuvasImports.add(n))
      } else {
        otherImports.push(imp)
      }
    }

    // 生成合并后的 vuvas import
    code += `import { ${Array.from(vuvasImports).join(', ')} } from 'vuvas'\n`
    if (otherImports.length > 0) {
      code += otherImports.join('\n') + '\n'
    }
    code += '\n'

    // 处理 <style>（生成样式对象，在 setup 外部）
    let styleVarCode = ''
    const styleVarNames: string[] = []
    if (descriptor.styles.length > 0) {
      const styleResult = generateStyleObject(descriptor.styles)
      styleVarCode = styleResult.code
      styleVarNames.push(...styleResult.varNames)
    }

    if (styleVarCode) {
      code += styleVarCode + '\n\n'
    }

    // 从 script body 中提取所有顶层变量/函数声明的名称
    const setupVarNames = extractDeclaredNames(scriptBody)
    // 合并样式变量名
    const allVarNames = [...setupVarNames, ...styleVarNames]

    // 生成模板的渲染函数代码
    let renderCode = '() => null'
    if (descriptor.template) {
      renderCode = generateInlineRender(descriptor.template.content, allVarNames)
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

  // 生成 Source Map
  let map: RawSourceMap | null = null
  if (enableSourceMap && filename) {
    try {
      map = generateSFCSourceMap(
        filename,
        source,
        code,
        descriptor.script?.loc,
        descriptor.template?.loc
      )
    } catch {
      // Source Map 生成失败不影响编译
    }
  }

  return { code, descriptor, map }
}

/**
 * 从 script body 中提取所有顶层声明的变量/函数名
 * 支持 const, let, var, function 声明
 */
function extractDeclaredNames(scriptBody: string): string[] {
  const names: string[] = []

  // 只提取顶层声明的变量（不提取嵌套在函数/箭头函数/computed 内部的局部变量）
  // 通过追踪花括号/圆括号深度来判断是否在顶层
  const lines = scriptBody.split('\n')
  let depth = 0

  for (const line of lines) {
    // 计算该行之前的深度变化
    for (const ch of line) {
      if (ch === '{' || ch === '(') depth++
      else if (ch === '}' || ch === ')') depth--
    }

    // 只在顶层（depth <= 0 或该行开始时 depth 为 0）提取声明
    // 重新计算：逐字符扫描该行，在扫描到声明关键字时检查当前深度
    // 简化方案：只匹配行首（可能有空格）的声明
    if (depth <= 0 || line.match(/^(?:const|let|var|function)\s/)) {
      // 此行可能是顶层声明
    }
  }

  // 更精确的实现：逐字符追踪深度
  names.length = 0
  let braceDepth = 0
  let parenDepth = 0
  let i = 0
  const src = scriptBody

  while (i < src.length) {
    const ch = src[i]

    // 跳过字符串
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch
      i++
      while (i < src.length) {
        if (src[i] === '\\') { i += 2; continue }
        if (src[i] === quote) { i++; break }
        if (quote === '`' && src[i] === '$' && src[i + 1] === '{') {
          // 模板字符串中的表达式，简单跳过
        }
        i++
      }
      continue
    }

    // 跳过单行注释
    if (ch === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') i++
      continue
    }

    // 跳过多行注释
    if (ch === '/' && src[i + 1] === '*') {
      i += 2
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++
      i += 2
      continue
    }

    // 追踪深度
    if (ch === '{') { braceDepth++; i++; continue }
    if (ch === '}') { braceDepth--; i++; continue }
    if (ch === '(') { parenDepth++; i++; continue }
    if (ch === ')') { parenDepth--; i++; continue }

    // 只在顶层（braceDepth === 0 且 parenDepth === 0）匹配声明
    if (braceDepth === 0 && parenDepth === 0) {
      // 匹配 const/let/var 声明
      const varMatch = src.slice(i).match(/^(?:const|let|var)\s+(\w+)/)
      if (varMatch) {
        names.push(varMatch[1])
        i += varMatch[0].length
        continue
      }

      // 匹配 function 声明
      const funcMatch = src.slice(i).match(/^function\s+(\w+)/)
      if (funcMatch) {
        names.push(funcMatch[1])
        i += funcMatch[0].length
        continue
      }
    }

    i++
  }

  return names
}

/**
 * 生成内联渲染函数代码
 * 将模板编译为 () => h(...) 形式
 *
 * 直接在编译期将模板转为 h() 调用，无需运行时编译
 * 自动为插值表达式添加 unref() 解包
 */
function generateInlineRender(template: string, setupVars: string[]): string {
  // 生成运行时编译的渲染函数
  // compile 函数已通过顶部 import 从 'vuvas' 引入
  // 运行时会在浏览器中执行 compile 将模板编译为 h() 调用
  // 通过 _ctx 对象将 setup 中的变量传递给渲染函数（render 内部使用 with(_ctx)）
  const escapedTemplate = JSON.stringify(template)

  // 构造 _ctx 对象：将所有 setup 变量和样式变量传入，对 ref/computed 自动解包
  const ctxEntries = setupVars.map(v => `${v}: unref(${v})`).join(', ')

  return `() => {
      const _ctx = { ${ctxEntries}, h }
      const { render: _render } = compile(${escapedTemplate})
      const _nodes = _render(_ctx, h).filter(Boolean)
      return _nodes.length === 1 ? _nodes[0] : h('view', null, _nodes)
    }`
}

/**
 * 生成样式对象代码（作为模块级变量）
 * 将 CSS-like 语法转为 JS 样式对象
 */
function generateStyleObject(styles: SFCStyleBlock[]): { code: string; varNames: string[] } {
  let code = '// 样式定义\n'
  const varNames: string[] = []

  for (const style of styles) {
    const rules = parseCSSRules(style.content)
    for (const [selector, properties] of Object.entries(rules)) {
      // 将 .containerStyle 转为 const containerStyle = {...}
      const varName = selector.startsWith('.') ? selector.slice(1) : `__style_${selector}__`
      code += `const ${varName} = ${JSON.stringify(properties)}\n`
      varNames.push(varName)
    }
  }

  return { code, varNames }
}

/**
 * 生成样式代码（旧版兼容）
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

      // 尝试转为数字或数字数组
      const numValue = Number(value)
      if (!isNaN(numValue)) {
        properties[camelProp] = numValue
      } else {
        // 尝试解析为数字数组（如 padding: 8 16 → [8, 16]）
        const parts = value.split(/\s+/)
        if (parts.length > 1 && parts.every(p => !isNaN(Number(p)))) {
          properties[camelProp] = parts.map(Number) as any
        } else {
          properties[camelProp] = value
        }
      }
    }

    rules[selector] = properties
  }

  return rules
}
