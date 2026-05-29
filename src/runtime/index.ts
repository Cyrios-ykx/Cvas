/**
 * Vuvas 组件系统
 *
 * 核心概念：
 * - defineComponent: 定义组件
 * - setup(): 组件初始化函数（Composition API）
 * - 生命周期钩子: onMounted, onUpdated, onUnmounted
 * - props / emit: 组件通信
 * - provide / inject: 跨层级依赖注入
 * - slot: 插槽内容分发
 */

import { type VNode, h, createNode, patch } from './vnode'
import { ReactiveEffect, reactive } from '../reactivity'
import { queueJob } from '../scheduler'
import { handleError, callWithErrorHandling, ErrorSource } from '../error'

// ============================================================
// 组件实例
// ============================================================

/** 当前正在设置的组件实例 */
let currentInstance: ComponentInstance | null = null

/** 插槽函数类型 */
export type Slot = (...args: any[]) => VNode[]

/** 组件实例 */
export interface ComponentInstance {
  /** 组件唯一标识 */
  uid: number
  /** 组件定义 */
  type: ComponentDef
  /** 响应式 props */
  props: Record<string, any>
  /** emit 函数 */
  emit: (event: string, ...args: any[]) => void
  /** 插槽 */
  slots: Record<string, Slot>
  /** setup 返回的渲染函数 */
  render: (() => VNode) | null
  /** 当前 VNode 树 */
  vnode: VNode | null
  /** 副作用 */
  effect: ReactiveEffect | null
  /** 是否已挂载 */
  isMounted: boolean
  /** 生命周期钩子 */
  mounted: (() => void)[]
  updated: (() => void)[]
  unmounted: (() => void)[]
  /** provide 数据（原型链继承） */
  provides: Record<string | symbol, any>
  /** 父组件实例 */
  parent: ComponentInstance | null
}

let uid = 0

/** 创建组件实例 */
function createComponentInstance(
  def: ComponentDef,
  props: Record<string, any>,
  parent: ComponentInstance | null
): ComponentInstance {
  const instance: ComponentInstance = {
    uid: uid++,
    type: def,
    props: reactive(props),
    emit: () => {},
    slots: {},
    render: null,
    vnode: null,
    effect: null,
    isMounted: false,
    mounted: [],
    updated: [],
    unmounted: [],
    // provide 继承父组件的 provides（原型链）
    provides: parent ? Object.create(parent.provides) : {},
    parent
  }
  return instance
}

// ============================================================
// Props 校验
// ============================================================

/** Props 声明（支持简单数组和详细对象两种形式） */
export type PropsDef = string[] | Record<string, PropOptions>

/** 单个 prop 的选项 */
export interface PropOptions {
  /** 类型（用于校验） */
  type?: Function | Function[]
  /** 是否必填 */
  required?: boolean
  /** 默认值 */
  default?: any
  /** 自定义校验函数 */
  validator?: (value: any) => boolean
}

/**
 * 解析并校验 props
 * 根据组件的 props 声明，从传入的 rawProps 中提取并校验
 */
function resolveProps(
  rawProps: Record<string, any>,
  propsDef?: PropsDef
): Record<string, any> {
  const resolved: Record<string, any> = {}

  if (!propsDef) {
    // 没有声明 props，全部透传
    return { ...rawProps }
  }

  if (Array.isArray(propsDef)) {
    // 简单数组形式：['title', 'count']
    for (const key of propsDef) {
      resolved[key] = rawProps[key]
    }
  } else {
    // 详细对象形式
    for (const key of Object.keys(propsDef)) {
      const opt = propsDef[key]
      let value = rawProps[key]

      // 默认值
      if (value === undefined && opt.default !== undefined) {
        value = typeof opt.default === 'function' ? opt.default() : opt.default
      }

      // 必填校验
      if (opt.required && value === undefined) {
        console.warn(`[Vuvas] 缺少必填 prop: "${key}"`)
      }

      // 类型校验
      if (value !== undefined && opt.type) {
        const types = Array.isArray(opt.type) ? opt.type : [opt.type]
        const valid = types.some(t => {
          if (t === String) return typeof value === 'string'
          if (t === Number) return typeof value === 'number'
          if (t === Boolean) return typeof value === 'boolean'
          if (t === Array) return Array.isArray(value)
          if (t === Object) return typeof value === 'object' && value !== null
          return value instanceof t
        })
        if (!valid) {
          console.warn(`[Vuvas] prop "${key}" 类型校验失败`)
        }
      }

      // 自定义校验
      if (value !== undefined && opt.validator && !opt.validator(value)) {
        console.warn(`[Vuvas] prop "${key}" 自定义校验失败`)
      }

      resolved[key] = value
    }
  }

  return resolved
}

// ============================================================
// 组件定义
// ============================================================

/** 组件定义 */
export interface ComponentDef {
  /** 组件名称 */
  name?: string
  /** props 声明 */
  props?: PropsDef
  /** emits 声明（用于文档和校验） */
  emits?: string[]
  /** setup 函数 */
  setup: (props: Record<string, any>, ctx: SetupContext) => (() => VNode) | Record<string, any>
}

/** setup 上下文 */
export interface SetupContext {
  /** 触发事件 */
  emit: (event: string, ...args: any[]) => void
  /** 插槽 */
  slots: Record<string, Slot>
  /** 非 props 的属性 */
  attrs: Record<string, any>
}

/**
 * 定义组件
 * 类似 Vue3 的 defineComponent
 */
export function defineComponent(def: ComponentDef): ComponentDef {
  return def
}

// ============================================================
// 组件挂载与更新
// ============================================================

/**
 * 挂载组件，返回根 CanvasNode
 */
export function mountComponent(
  def: ComponentDef,
  props: Record<string, any> = {},
  options?: {
    emitHandler?: (event: string, ...args: any[]) => void
    slots?: Record<string, Slot>
    parent?: ComponentInstance | null
  }
): { instance: ComponentInstance; node: import('../core/node').CanvasNode } {
  const parent = options?.parent ?? currentInstance

  // 解析并校验 props
  const resolvedProps = resolveProps(props, def.props)
  const instance = createComponentInstance(def, resolvedProps, parent)

  // 设置 emit（带校验）
  instance.emit = (event: string, ...args: any[]) => {
    // emits 声明校验
    if (def.emits && !def.emits.includes(event)) {
      console.warn(`[Vuvas] 组件 "${def.name || 'Anonymous'}" 触发了未声明的事件: "${event}"`)
    }
    options?.emitHandler?.(event, ...args)
  }

  // 设置插槽
  instance.slots = options?.slots || {}

  // 计算 attrs（不在 props 声明中的属性）
  const attrs: Record<string, any> = {}
  const declaredProps = Array.isArray(def.props) ? def.props : Object.keys(def.props || {})
  for (const key of Object.keys(props)) {
    if (!declaredProps.includes(key)) {
      attrs[key] = props[key]
    }
  }

  // 执行 setup
  currentInstance = instance
  const setupResult = def.setup(instance.props, {
    emit: instance.emit,
    slots: instance.slots,
    attrs
  })
  currentInstance = null

  // setup 返回渲染函数
  if (typeof setupResult === 'function') {
    instance.render = setupResult as () => VNode
  }

  if (!instance.render) {
    throw new Error(`[Vuvas] 组件 ${def.name || 'Anonymous'} 的 setup 必须返回渲染函数`)
  }

  // 创建响应式副作用，驱动组件更新
  let node: import('../core/node').CanvasNode | null = null

  const updateFn = () => {
    try {
      if (!instance.isMounted) {
        // 首次挂载
        const vnode = instance.render!()
        node = createNode(vnode)
        instance.vnode = vnode
        instance.isMounted = true

        // 触发 onMounted
        for (const fn of instance.mounted) {
          callWithErrorHandling(fn, ErrorSource.LIFECYCLE, undefined, `onMounted in <${def.name || 'Anonymous'}>`)
        }
      } else {
        // 更新
        const prevVNode = instance.vnode!
        const nextVNode = instance.render!()
        node = patch(prevVNode, nextVNode)
        instance.vnode = nextVNode

        // 触发 onUpdated
        for (const fn of instance.updated) {
          callWithErrorHandling(fn, ErrorSource.LIFECYCLE, undefined, `onUpdated in <${def.name || 'Anonymous'}>`)
        }
      }
    } catch (err) {
      handleError(err, ErrorSource.RENDER, `component <${def.name || 'Anonymous'}>`)
    }
  }

  // 使用调度器批量更新
  instance.effect = new ReactiveEffect(updateFn, () => {
    queueJob(updateFn)
  })

  // 首次执行
  instance.effect.run()

  return { instance, node: node! }
}

/**
 * 卸载组件
 */
export function unmountComponent(instance: ComponentInstance): void {
  for (const fn of instance.unmounted) {
    callWithErrorHandling(fn, ErrorSource.LIFECYCLE, undefined, `onUnmounted in <${instance.type.name || 'Anonymous'}>`)
  }
  instance.effect?.stop()
  instance.isMounted = false
}

// ============================================================
// provide / inject
// ============================================================

/**
 * provide - 向后代组件提供数据
 * 只能在 setup() 中调用
 */
export function provide<T>(key: string | symbol, value: T): void {
  if (!currentInstance) {
    console.warn('[Vuvas] provide() 只能在 setup() 中调用')
    return
  }

  const provides = currentInstance.provides

  // 如果当前 provides 和父级相同（继承来的），创建自己的副本
  const parentProvides = currentInstance.parent?.provides
  if (provides === parentProvides) {
    currentInstance.provides = Object.create(parentProvides || {})
  }

  currentInstance.provides[key as string] = value
}

/**
 * inject - 注入祖先组件提供的数据
 * 只能在 setup() 中调用
 */
export function inject<T>(key: string | symbol, defaultValue?: T): T | undefined {
  if (!currentInstance) {
    console.warn('[Vuvas] inject() 只能在 setup() 中调用')
    return defaultValue
  }

  const provides = currentInstance.parent?.provides
  if (provides && (key as string) in provides) {
    return provides[key as string] as T
  }

  if (defaultValue !== undefined) {
    return defaultValue
  }

  console.warn(`[Vuvas] inject "${String(key)}" 未找到对应的 provide`)
  return undefined
}

// ============================================================
// 生命周期钩子
// ============================================================

/**
 * 获取当前组件实例（仅在 setup 中可用）
 */
export function getCurrentInstance(): ComponentInstance | null {
  return currentInstance
}

/**
 * onMounted - 组件挂载后执行
 */
export function onMounted(fn: () => void): void {
  if (currentInstance) {
    currentInstance.mounted.push(fn)
  }
}

/**
 * onUpdated - 组件更新后执行
 */
export function onUpdated(fn: () => void): void {
  if (currentInstance) {
    currentInstance.updated.push(fn)
  }
}

/**
 * onUnmounted - 组件卸载后执行
 */
export function onUnmounted(fn: () => void): void {
  if (currentInstance) {
    currentInstance.unmounted.push(fn)
  }
}

// ============================================================
// 辅助函数
// ============================================================

/**
 * 渲染插槽内容
 * 在组件的 render 函数中使用，渲染父组件传入的插槽
 */
export function renderSlot(
  slots: Record<string, Slot>,
  name: string = 'default',
  props?: Record<string, any>
): VNode[] {
  const slot = slots[name]
  if (slot) {
    return slot(props)
  }
  return []
}

// 重新导出 VNode 相关
export { h, createNode, patch } from './vnode'
export type { VNode, VNodeProps } from './vnode'
