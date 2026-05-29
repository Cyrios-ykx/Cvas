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
// Tokenizer（词法分析）
// ============================================================

/** Token 类型 */
const enum TokenType {
  TAG_OPEN,       // <div
  TAG_CLOSE,      // </div>
  TAG_SELF_CLOSE, // />
  ATTR_NAME,      // class
  ATTR_VALUE,     // "hello"
  TEXT,           // 普通文本
  INTERPOLATION,  // {{ expr }}
  TAG_END         // >
}

interface Token {
  type: TokenType
  value: string
}

/**
 * 词法分析器：将模板字符串转为 Token 流
 */
function tokenize(template: string): Token[] {
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

// ============================================================
// Parser（语法分析）
// ============================================================

/**
 * 语法分析器：将 Token 流转为 AST
 */
function parse(tokens: Token[]): ASTNode[] {
  let i = 0
  const nodes: ASTNode[] = []

  function parseNodes(stopTag?: string): ASTNode[] {
    const result: ASTNode[] = []

    while (i < tokens.length) {
      const token = tokens[i]

      // 遇到关闭标签，停止
      if (token.type === TokenType.TAG_CLOSE) {
        if (token.value === stopTag) {
          i++ // 消费关闭标签
          return result
        }
        // 不匹配的关闭标签，报错
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
    i++ // 消费 TAG_OPEN

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
        // v-if, v-for, v-show, v-model 等
        const directive = parseDirective(attrName, attrValue)
        directives.push(directive)
      } else if (attrName.startsWith('@')) {
        // @click -> v-on:click
        directives.push({
          name: 'on',
          arg: attrName.slice(1),
          expression: attrValue
        })
      } else if (attrName.startsWith(':')) {
        // :prop -> 动态绑定
        props.push({ name: attrName.slice(1), value: attrValue, dynamic: true })
      } else {
        // 普通属性
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

    // 自闭合 HTML 标签（无需关闭标签）
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
  // v-on:click.prevent -> name: 'on', arg: 'click', modifiers: ['prevent']
  const withoutV = raw.slice(2) // 去掉 v-
  const parts = withoutV.split(':')
  const name = parts[0].split('.')[0]
  const arg = parts[1]?.split('.')[0]
  const modifiers = withoutV.split('.').slice(1)

  return { name, expression, arg, modifiers: modifiers.length > 0 ? modifiers : undefined }
}

// ============================================================
// Code Generator（代码生成）
// ============================================================

/**
 * 将 AST 编译为渲染函数代码字符串
 */
function generate(nodes: ASTNode[]): string {
  const code = nodes.map(node => genNode(node)).join(', ')
  return `function render(_ctx) {\n  with(_ctx) {\n    return [${code}]\n  }\n}`
}

/** 生成单个节点的代码 */
function genNode(node: ASTNode): string {
  switch (node.type) {
    case ASTNodeType.ELEMENT:
      return genElement(node)
    case ASTNodeType.TEXT:
      return `h('text', null, ${JSON.stringify(node.content)})`
    case ASTNodeType.INTERPOLATION:
      return `h('text', null, String(${node.expression}))`
  }
}

/** 生成元素节点代码 */
function genElement(node: ASTElement): string {
  const tag = JSON.stringify(node.tag)

  // 生成 props
  const propsEntries: string[] = []
  for (const prop of node.props) {
    if (prop.dynamic) {
      propsEntries.push(`${JSON.stringify(prop.name)}: ${prop.value}`)
    } else {
      propsEntries.push(`${JSON.stringify(prop.name)}: ${JSON.stringify(prop.value)}`)
    }
  }

  // 生成事件绑定
  for (const dir of node.directives) {
    if (dir.name === 'on' && dir.arg) {
      const eventName = 'on' + dir.arg.charAt(0).toUpperCase() + dir.arg.slice(1)
      propsEntries.push(`${JSON.stringify(eventName)}: ${dir.expression}`)
    }
  }

  // v-model 双向绑定
  const vModel = node.directives.find(d => d.name === 'model')
  if (vModel) {
    // 绑定值
    propsEntries.push(`"value": ${vModel.expression}`)
    // 绑定 onInput 事件更新值
    // 支持修饰符：.number, .trim
    let updateExpr = `$event`
    if (vModel.modifiers?.includes('number')) {
      updateExpr = `Number($event)`
    }
    if (vModel.modifiers?.includes('trim')) {
      updateExpr = `$event.trim()`
    }
    propsEntries.push(`"onInput": ($event) => { ${vModel.expression} = ${updateExpr} }`)
  }

  const propsStr = propsEntries.length > 0 ? `{ ${propsEntries.join(', ')} }` : 'null'

  // 处理 v-if
  const vIf = node.directives.find(d => d.name === 'if')
  // 处理 v-for
  const vFor = node.directives.find(d => d.name === 'for')
  // 处理 v-show
  const vShow = node.directives.find(d => d.name === 'show')

  // 生成子节点
  let childrenStr = ''
  if (node.children.length > 0) {
    // 对于 text/button 类型，将子内容拼接为字符串（因为 TextNode/ButtonNode 是叶子节点）
    if (node.tag === 'text' || node.tag === 'button') {
      const textParts = node.children.map(c => {
        if (c.type === ASTNodeType.TEXT) return JSON.stringify(c.content)
        if (c.type === ASTNodeType.INTERPOLATION) return `String(${(c as ASTInterpolation).expression})`
        return '""'
      })
      childrenStr = textParts.join(' + ')
    } else {
      const childCodes = node.children.map(c => genNode(c))
      childrenStr = `[${childCodes.join(', ')}]`
    }
  }

  let code = `h(${tag}, ${propsStr}${childrenStr ? ', ' + childrenStr : ''})`

  // v-show: 通过 style.display 控制
  if (vShow) {
    code = `(${vShow.expression}) ? ${code} : h(${tag}, { style: { display: 'none' } })`
  }

  // v-if: 条件渲染
  if (vIf) {
    code = `(${vIf.expression}) ? ${code} : null`
  }

  // v-for: 列表渲染
  if (vFor) {
    const forMatch = vFor.expression.match(/(.+)\s+in\s+(.+)/)
    if (forMatch) {
      const [, itemExpr, listExpr] = forMatch
      // 支持 (item, index) in list
      const itemMatch = itemExpr.trim().match(/^\(?\s*(\w+)\s*(?:,\s*(\w+))?\s*\)?$/)
      if (itemMatch) {
        const [, item, index] = itemMatch
        const indexParam = index ? `, ${index}` : ''
        code = `...${listExpr.trim()}.map((${item}${indexParam}) => ${code})`
      }
    }
  }

  return code
}

// ============================================================
// 编译器公共 API
// ============================================================

/** 编译结果 */
export interface CompileResult {
  /** AST */
  ast: ASTNode[]
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
 * 从代码字符串创建渲染函数
 */
function createRenderFunction(code: string): (ctx: Record<string, any>, hFn: Function) => any[] {
  // 使用 Function 构造器创建渲染函数
  // 注入 h 函数到上下文中
  const fn = new Function('h', `return ${code}`)
  const renderFn = fn() // 获取内部的 render 函数

  return (ctx: Record<string, any>, hFn: Function) => {
    // 将 h 注入到上下文
    const fullCtx = { ...ctx, h: hFn }
    return renderFn(fullCtx)
  }
}

/**
 * 仅解析模板为 AST（不生成代码）
 * 用于工具链和调试
 */
export function parseTemplate(template: string): ASTNode[] {
  const tokens = tokenize(template.trim())
  return parse(tokens)
}
