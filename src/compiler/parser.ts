/**
 * Vuvas 模板编译器 - 语法分析器
 * 将 Token 流转为 AST
 */

import { TokenType, type Token } from './tokenizer'

// ============================================================
// AST 节点定义
// ============================================================

/** AST 节点类型 */
export const enum ASTNodeType {
  ELEMENT = 'element',
  TEXT = 'text',
  INTERPOLATION = 'interpolation',
  COMMENT = 'comment'
}

/** AST 元素节点 */
export interface ASTElement {
  type: ASTNodeType.ELEMENT
  tag: string
  props: ASTAttribute[]
  children: ASTNode[]
  directives: ASTDirective[]
}

/** AST 文本节点 */
export interface ASTText {
  type: ASTNodeType.TEXT
  content: string
}

/** AST 插值节点 {{ expr }} */
export interface ASTInterpolation {
  type: ASTNodeType.INTERPOLATION
  expression: string
}

/** AST 属性 */
export interface ASTAttribute {
  name: string
  value: string
  /** 是否为动态绑定（:prop） */
  dynamic: boolean
}

/** AST 指令 */
export interface ASTDirective {
  name: string       // if, for, show, model 等
  expression: string // 指令表达式
  arg?: string       // 指令参数（如 v-on:click 中的 click）
  modifiers?: string[] // 修饰符
}

/** AST 节点联合类型 */
export type ASTNode = ASTElement | ASTText | ASTInterpolation

// ============================================================
// Parser
// ============================================================

/**
 * 语法分析器：将 Token 流转为 AST
 */
export function parse(tokens: Token[]): ASTNode[] {
  let i = 0

  function parseNodes(stopTag?: string): ASTNode[] {
    const result: ASTNode[] = []

    while (i < tokens.length) {
      const token = tokens[i]

      // 遇到关闭标签，停止
      if (token.type === TokenType.TAG_CLOSE) {
        if (token.value === stopTag) {
          i++
          return result
        }
        throw new Error(`[Vuvas Compiler] 不匹配的关闭标签: </${token.value}>，期望 </${stopTag}>`)
      }

      // 文本节点
      if (token.type === TokenType.TEXT) {
        result.push({ type: ASTNodeType.TEXT, content: token.value })
        i++
        continue
      }

      // 插值表达式
      if (token.type === TokenType.INTERPOLATION) {
        result.push({ type: ASTNodeType.INTERPOLATION, expression: token.value })
        i++
        continue
      }

      // 元素节点
      if (token.type === TokenType.TAG_OPEN) {
        result.push(parseElement())
        continue
      }

      i++
    }

    return result
  }

  function parseElement(): ASTElement {
    const tagToken = tokens[i]
    i++

    const tag = tagToken.value
    const props: ASTAttribute[] = []
    const directives: ASTDirective[] = []

    // 解析属性
    while (i < tokens.length && tokens[i].type === TokenType.ATTR_NAME) {
      const attrName = tokens[i].value
      i++

      let attrValue = ''
      if (i < tokens.length && tokens[i].type === TokenType.ATTR_VALUE) {
        attrValue = tokens[i].value
        i++
      }

      // 解析指令和特殊属性
      if (attrName.startsWith('v-')) {
        const directive = parseDirective(attrName, attrValue)
        directives.push(directive)
      } else if (attrName.startsWith('@')) {
        directives.push({ name: 'on', arg: attrName.slice(1), expression: attrValue })
      } else if (attrName.startsWith(':')) {
        props.push({ name: attrName.slice(1), value: attrValue, dynamic: true })
      } else {
        props.push({ name: attrName, value: attrValue, dynamic: false })
      }
    }

    // 自闭合标签
    if (i < tokens.length && tokens[i].type === TokenType.TAG_SELF_CLOSE) {
      i++
      return { type: ASTNodeType.ELEMENT, tag, props, children: [], directives }
    }

    // 普通标签结束 >
    if (i < tokens.length && tokens[i].type === TokenType.TAG_END) {
      i++
    }

    // 自闭合 HTML 标签
    const selfClosingTags = ['img', 'br', 'hr', 'input']
    if (selfClosingTags.includes(tag)) {
      return { type: ASTNodeType.ELEMENT, tag, props, children: [], directives }
    }

    // 解析子节点
    const children = parseNodes(tag)

    return { type: ASTNodeType.ELEMENT, tag, props, children, directives }
  }

  return parseNodes()
}

/**
 * 解析指令
 */
function parseDirective(raw: string, expression: string): ASTDirective {
  const withoutV = raw.slice(2)
  const parts = withoutV.split(':')
  const name = parts[0].split('.')[0]
  const arg = parts[1]?.split('.')[0]
  const modifiers = withoutV.split('.').slice(1)

  return { name, expression, arg, modifiers: modifiers.length > 0 ? modifiers : undefined }
}
