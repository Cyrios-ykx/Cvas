/**
 * Vuvas 模板编译器 - 代码生成器
 * 将 AST 编译为渲染函数代码字符串
 */

import { ASTNodeType, type ASTNode, type ASTElement, type ASTInterpolation } from './parser'

// ============================================================
// Code Generator
// ============================================================

/**
 * 将 AST 编译为渲染函数代码字符串
 */
export function generate(nodes: ASTNode[]): string {
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
    propsEntries.push(`"value": ${vModel.expression}`)
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

  // 处理指令
  const vIf = node.directives.find(d => d.name === 'if')
  const vFor = node.directives.find(d => d.name === 'for')
  const vShow = node.directives.find(d => d.name === 'show')

  // 生成子节点
  let childrenStr = ''
  if (node.children.length > 0) {
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

  // v-show
  if (vShow) {
    code = `(${vShow.expression}) ? ${code} : h(${tag}, { style: { display: 'none' } })`
  }

  // v-if
  if (vIf) {
    code = `(${vIf.expression}) ? ${code} : null`
  }

  // v-for
  if (vFor) {
    const forMatch = vFor.expression.match(/(.+)\s+in\s+(.+)/)
    if (forMatch) {
      const [, itemExpr, listExpr] = forMatch
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

/**
 * 从代码字符串创建渲染函数
 */
export function createRenderFunction(code: string): (ctx: Record<string, any>, hFn: Function) => any[] {
  const fn = new Function('h', `return ${code}`)
  const renderFn = fn()

  return (ctx: Record<string, any>, hFn: Function) => {
    const fullCtx = { ...ctx, h: hFn }
    return renderFn(fullCtx)
  }
}
