/**
 * Vuvas 模板编译器
 *
 * 将类 Vue 模板语法编译为渲染函数
 * 支持：
 * - {{ }} 插值表达式
 * - v-if / v-else 条件渲染
 * - v-for 列表渲染
 * - v-show 显示/隐藏
 * - @event 事件绑定
 * - :prop 动态属性绑定
 */

import { tokenize } from './tokenizer'
import { parse } from './parser'
import { generate, createRenderFunction } from './codegen'

// 重新导出类型和工具
export { tokenize } from './tokenizer'
export type { Token } from './tokenizer'
export { parse, ASTNodeType } from './parser'
export type { ASTNode, ASTElement, ASTText, ASTInterpolation, ASTAttribute, ASTDirective } from './parser'
export { generate, createRenderFunction } from './codegen'

// ============================================================
// 编译器公共 API
// ============================================================

/** 编译结果 */
export interface CompileResult {
  /** AST */
  ast: import('./parser').ASTNode[]
  /** 渲染函数代码 */
  code: string
  /** 渲染函数 */
  render: (ctx: Record<string, any>, h: Function) => any[]
}

/**
 * 编译模板
 * 将模板字符串编译为渲染函数
 *
 * @example
 * const { render } = compile(`
 *   <view :style="containerStyle">
 *     <text>{{ message }}</text>
 *     <button @click="handleClick">点击</button>
 *   </view>
 * `)
 */
export function compile(template: string): CompileResult {
  // 1. 词法分析
  const tokens = tokenize(template.trim())

  // 2. 语法分析
  const ast = parse(tokens)

  // 3. 代码生成
  const code = generate(ast)

  // 4. 创建渲染函数
  const render = createRenderFunction(code)

  return { ast, code, render }
}

/**
 * 仅解析模板为 AST（不生成代码）
 * 用于工具链和调试
 */
export function parseTemplate(template: string): import('./parser').ASTNode[] {
  const tokens = tokenize(template.trim())
  return parse(tokens)
}
