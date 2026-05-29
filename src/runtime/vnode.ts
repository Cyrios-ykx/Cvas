/**
 * Vuvas 虚拟节点系统
 *
 * 核心概念：
 * - VNode: 虚拟节点，描述 UI 结构的轻量级 JS 对象
 * - h(): 创建 VNode 的工厂函数
 * - diff + patch: 对比新旧 VNode 树，最小化更新真实节点
 */

import { CanvasNode, TextNode, ButtonNode, ImageNode, type NodeStyle } from '../core/node'

// ============================================================
// VNode 类型定义
// ============================================================

/** VNode 类型标识 */
export const enum VNodeType {
  VIEW = 'view',
  TEXT = 'text',
  BUTTON = 'button',
  IMAGE = 'image',
  COMPONENT = 'component'
}

/** 虚拟节点 */
export interface VNode {
  /** 节点类型 */
  type: string
  /** 属性（样式、事件等） */
  props: VNodeProps
  /** 子节点 */
  children: VNode[]
  /** 文本内容（text/button 节点） */
  text?: string
  /** 图片地址（image 节点） */
  src?: string
  /** 对应的真实 CanvasNode（patch 后赋值） */
  el?: CanvasNode
  /** 唯一标识（用于 diff 优化） */
  key?: string | number
}

/** VNode 属性 */
export interface VNodeProps {
  /** 样式 */
  style?: NodeStyle
  /** hover 样式 */
  hoverStyle?: Partial<NodeStyle>
  /** 事件监听 */
  onClick?: (e: any) => void
  onMouseenter?: (e: any) => void
  onMouseleave?: (e: any) => void
  /** key */
  key?: string | number
  /** 其他属性 */
  [key: string]: any
}

// ============================================================
// h() 创建函数
// ============================================================

/**
 * 创建虚拟节点
 * 类似 Vue3 的 h() 函数
 *
 * @example
 * h('view', { style: { display: 'flex' } }, [
 *   h('text', { style: { fontSize: 16 } }, '你好'),
 *   h('button', { onClick: () => {} }, '点击')
 * ])
 */
export function h(
  type: string,
  props?: VNodeProps | null,
  children?: VNode[] | string
): VNode {
  const normalizedProps = props || {}
  let normalizedChildren: VNode[] = []
  let text: string | undefined

  if (typeof children === 'string') {
    text = children
  } else if (Array.isArray(children)) {
    normalizedChildren = children
  }

  return {
    type,
    props: normalizedProps,
    children: normalizedChildren,
    text,
    key: normalizedProps.key
  }
}

// ============================================================
// patch 更新系统
// ============================================================

/**
 * 将 VNode 渲染为真实 CanvasNode（首次挂载）
 */
export function createNode(vnode: VNode): CanvasNode {
  let node: CanvasNode

  switch (vnode.type) {
    case 'text':
      node = new TextNode(vnode.text || '', vnode.props.style)
      break
    case 'button':
      node = new ButtonNode(vnode.text || '', vnode.props.style)
      break
    case 'image':
      node = new ImageNode(vnode.src || '', vnode.props.style)
      break
    default:
      node = new CanvasNode(vnode.props.style)
      break
  }

  // 设置 hover 样式
  if (vnode.props.hoverStyle) {
    node.hoverStyle = vnode.props.hoverStyle
  }

  // 绑定事件
  bindEvents(node, vnode.props)

  // 递归创建子节点
  for (const child of vnode.children) {
    const childNode = createNode(child)
    node.append(childNode)
  }

  // 保存引用
  vnode.el = node
  return node
}

/**
 * diff + patch：对比新旧 VNode，最小化更新真实节点
 */
export function patch(oldVNode: VNode, newVNode: VNode): CanvasNode {
  const el = oldVNode.el!

  // 类型不同，直接替换
  if (oldVNode.type !== newVNode.type) {
    const newNode = createNode(newVNode)
    if (el.parent) {
      const parent = el.parent
      const idx = parent.children.indexOf(el)
      parent.children[idx] = newNode
      newNode.parent = parent
    }
    return newNode
  }

  // 类型相同，更新属性
  newVNode.el = el

  // 更新样式
  if (newVNode.props.style) {
    el.style = newVNode.props.style
  }

  // 更新 hover 样式
  if (newVNode.props.hoverStyle) {
    el.hoverStyle = newVNode.props.hoverStyle
  }

  // 更新文本
  if (newVNode.text !== undefined && newVNode.text !== oldVNode.text) {
    if (el instanceof TextNode || el instanceof ButtonNode) {
      el.text = newVNode.text
    }
  }

  // 更新事件（简化处理：直接重新绑定）
  updateEvents(el, oldVNode.props, newVNode.props)

  // diff 子节点
  patchChildren(oldVNode, newVNode, el)

  return el
}

/**
 * diff 子节点列表
 * 简化版：基于 key 的对比 + 最小化操作
 */
function patchChildren(oldVNode: VNode, newVNode: VNode, parent: CanvasNode): void {
  const oldChildren = oldVNode.children
  const newChildren = newVNode.children

  if (newChildren.length === 0) {
    // 新节点没有子节点，清空
    parent.children = []
    return
  }

  if (oldChildren.length === 0) {
    // 旧节点没有子节点，全部新增
    for (const child of newChildren) {
      const node = createNode(child)
      parent.append(node)
    }
    return
  }

  // 有 key 的情况：基于 key 匹配
  const oldKeyMap = new Map<string | number, number>()
  oldChildren.forEach((child, i) => {
    if (child.key !== undefined) {
      oldKeyMap.set(child.key, i)
    }
  })

  const newNodes: CanvasNode[] = []

  for (let i = 0; i < newChildren.length; i++) {
    const newChild = newChildren[i]
    let oldChild: VNode | undefined

    if (newChild.key !== undefined && oldKeyMap.has(newChild.key)) {
      // 通过 key 找到对应的旧节点
      const oldIdx = oldKeyMap.get(newChild.key)!
      oldChild = oldChildren[oldIdx]
    } else if (i < oldChildren.length && oldChildren[i].key === undefined) {
      // 没有 key，按索引匹配
      oldChild = oldChildren[i]
    }

    if (oldChild) {
      // 更新已有节点
      const node = patch(oldChild, newChild)
      newNodes.push(node)
    } else {
      // 创建新节点
      const node = createNode(newChild)
      newNodes.push(node)
    }
  }

  // 替换父节点的子节点列表
  parent.children = newNodes
  for (const node of newNodes) {
    node.parent = parent
  }
}

// ============================================================
// 事件绑定辅助
// ============================================================

/** 绑定事件 */
function bindEvents(node: CanvasNode, props: VNodeProps): void {
  if (props.onClick) node.on('click', props.onClick)
  if (props.onMouseenter) node.on('mouseenter', props.onMouseenter)
  if (props.onMouseleave) node.on('mouseleave', props.onMouseleave)
}

/** 更新事件（简化：移除旧的，绑定新的） */
function updateEvents(node: CanvasNode, oldProps: VNodeProps, newProps: VNodeProps): void {
  // 简化处理：如果事件引用变了，重新绑定
  if (oldProps.onClick !== newProps.onClick) {
    if (oldProps.onClick) node.off('click', oldProps.onClick)
    if (newProps.onClick) node.on('click', newProps.onClick)
  }
  if (oldProps.onMouseenter !== newProps.onMouseenter) {
    if (oldProps.onMouseenter) node.off('mouseenter', oldProps.onMouseenter)
    if (newProps.onMouseenter) node.on('mouseenter', newProps.onMouseenter)
  }
  if (oldProps.onMouseleave !== newProps.onMouseleave) {
    if (oldProps.onMouseleave) node.off('mouseleave', oldProps.onMouseleave)
    if (newProps.onMouseleave) node.on('mouseleave', newProps.onMouseleave)
  }
}
