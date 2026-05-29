/**
 * Vuvas 模板编译器 - 词法分析器
 * 将模板字符串转为 Token 流
 */

// ============================================================
// Token 类型定义
// ============================================================

/** Token 类型 */
export const enum TokenType {
  TAG_OPEN,       // <div
  TAG_CLOSE,      // </div>
  TAG_SELF_CLOSE, // />
  ATTR_NAME,      // class
  ATTR_VALUE,     // "hello"
  TEXT,           // 普通文本
  INTERPOLATION,  // {{ expr }}
  TAG_END         // >
}

export interface Token {
  type: TokenType
  value: string
}

/**
 * 词法分析器：将模板字符串转为 Token 流
 */
export function tokenize(template: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < template.length) {
    // 插值表达式 {{ }}
    if (template[i] === '{' && template[i + 1] === '{') {
      const end = template.indexOf('}}', i + 2)
      if (end === -1) throw new Error('[Vuvas Compiler] 未闭合的插值表达式 {{')
      tokens.push({ type: TokenType.INTERPOLATION, value: template.slice(i + 2, end).trim() })
      i = end + 2
      continue
    }

    // 关闭标签 </tag>
    if (template[i] === '<' && template[i + 1] === '/') {
      const end = template.indexOf('>', i)
      if (end === -1) throw new Error('[Vuvas Compiler] 未闭合的关闭标签')
      const tag = template.slice(i + 2, end).trim()
      tokens.push({ type: TokenType.TAG_CLOSE, value: tag })
      i = end + 1
      continue
    }

    // 开始标签 <tag
    if (template[i] === '<') {
      i++
      // 跳过空白
      while (i < template.length && /\s/.test(template[i])) i++

      // 读取标签名
      let tag = ''
      while (i < template.length && /[a-zA-Z0-9\-]/.test(template[i])) {
        tag += template[i]
        i++
      }
      tokens.push({ type: TokenType.TAG_OPEN, value: tag })

      // 读取属性
      while (i < template.length && template[i] !== '>' && !(template[i] === '/' && template[i + 1] === '>')) {
        // 跳过空白
        while (i < template.length && /\s/.test(template[i])) i++
        if (template[i] === '>' || (template[i] === '/' && template[i + 1] === '>')) break

        // 读取属性名
        let attrName = ''
        while (i < template.length && !/[\s=\/>]/.test(template[i])) {
          attrName += template[i]
          i++
        }

        if (attrName) {
          tokens.push({ type: TokenType.ATTR_NAME, value: attrName })

          // 跳过空白
          while (i < template.length && /\s/.test(template[i])) i++

          // 有值的属性
          if (template[i] === '=') {
            i++ // 跳过 =
            while (i < template.length && /\s/.test(template[i])) i++

            let attrValue = ''
            const quote = template[i]
            if (quote === '"' || quote === "'") {
              i++ // 跳过开引号
              while (i < template.length && template[i] !== quote) {
                attrValue += template[i]
                i++
              }
              i++ // 跳过闭引号
            } else {
              // 无引号属性值
              while (i < template.length && !/[\s\/>]/.test(template[i])) {
                attrValue += template[i]
                i++
              }
            }
            tokens.push({ type: TokenType.ATTR_VALUE, value: attrValue })
          }
        }
      }

      // 自闭合标签 />
      if (template[i] === '/' && template[i + 1] === '>') {
        tokens.push({ type: TokenType.TAG_SELF_CLOSE, value: '' })
        i += 2
      } else if (template[i] === '>') {
        tokens.push({ type: TokenType.TAG_END, value: '' })
        i++
      }
      continue
    }

    // 普通文本
    let text = ''
    while (i < template.length && template[i] !== '<' && !(template[i] === '{' && template[i + 1] === '{')) {
      text += template[i]
      i++
    }
    if (text) {
      // 保留有意义的文本（去除纯空白行，但保留单行内的空格）
      const trimmed = text.replace(/^\s*\n\s*/g, '').replace(/\s*\n\s*$/g, '')
      if (trimmed) {
        tokens.push({ type: TokenType.TEXT, value: trimmed })
      }
    }
  }

  return tokens
}
