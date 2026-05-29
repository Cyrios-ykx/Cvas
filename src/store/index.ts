/**
 * Vuvas 状态管理（类 Pinia）
 *
 * 轻量级全局状态管理方案：
 * - defineStore: 定义 store
 * - 响应式 state + getters + actions
 * - 支持组合式 API 风格
 * - 支持插件扩展
 *
 * 使用方式：
 * ```ts
 * import { defineStore } from 'vuvas'
 *
 * const useCounterStore = defineStore('counter', () => {
 *   const count = ref(0)
 *   const doubled = computed(() => count.value * 2)
 *   function increment() { count.value++ }
 *   return { count, doubled, increment }
 * })
 *
 * // 在组件中使用
 * const counter = useCounterStore()
 * counter.increment()
 * ```
 */

import { reactive, ref, type Ref } from '../reactivity'

// ============================================================
// 类型定义
// ============================================================

/** Store 定义函数（组合式 API 风格） */
export type StoreSetup<T> = () => T

/** Store 实例 */
export interface StoreInstance<T = any> {
  /** Store ID */
  $id: string
  /** 重置到初始状态 */
  $reset: () => void
  /** 批量更新 state */
  $patch: (partialState: Partial<T> | ((state: T) => void)) => void
  /** 订阅 state 变化 */
  $subscribe: (callback: (mutation: StoreMutation, state: T) => void) => () => void
  /** 订阅 action 调用 */
  $onAction: (callback: (context: ActionContext) => void) => () => void
}

/** State 变更记录 */
export interface StoreMutation {
  /** 变更类型 */
  type: 'direct' | 'patch'
  /** Store ID */
  storeId: string
  /** 变更的 key */
  events?: string[]
}

/** Action 上下文 */
export interface ActionContext {
  /** Action 名称 */
  name: string
  /** Store ID */
  storeId: string
  /** Action 参数 */
  args: any[]
  /** Action 完成后回调 */
  after: (callback: () => void) => void
  /** Action 出错时回调 */
  onError: (callback: (error: Error) => void) => void
}

/** Store 插件 */
export type StorePlugin = (context: { store: any; id: string }) => Record<string, any> | void

// ============================================================
// Store 注册表
// ============================================================

/** 全局 Store 注册表 */
const storeRegistry = new Map<string, any>()
/** 全局插件列表 */
const globalPlugins: StorePlugin[] = []

// ============================================================
// defineStore
// ============================================================

/**
 * 定义一个 Store（组合式 API 风格）
 *
 * @param id - Store 唯一标识
 * @param setup - 组合式 setup 函数
 * @returns useStore 函数
 */
export function defineStore<T extends Record<string, any>>(
  id: string,
  setup: StoreSetup<T>
): () => T & StoreInstance<T> {
  // 返回 useStore 函数
  return function useStore(): T & StoreInstance<T> {
    // 如果已经创建过，直接返回缓存
    if (storeRegistry.has(id)) {
      return storeRegistry.get(id)
    }

    // 执行 setup 函数获取 store 内容
    const setupResult = setup()

    // 订阅者列表
    const subscribers: ((mutation: StoreMutation, state: T) => void)[] = []
    const actionSubscribers: ((context: ActionContext) => void)[] = []

    // 保存初始状态快照（用于 $reset）
    const initialState: Record<string, any> = {}
    for (const [key, value] of Object.entries(setupResult)) {
      if (isRef(value)) {
        initialState[key] = (value as any).value
      }
    }

    // 包装 actions（添加订阅通知）
    const wrappedResult: Record<string, any> = {}
    for (const [key, value] of Object.entries(setupResult)) {
      if (typeof value === 'function') {
        // 包装 action
        wrappedResult[key] = (...args: any[]) => {
          const afterCallbacks: (() => void)[] = []
          const errorCallbacks: ((error: Error) => void)[] = []

          const context: ActionContext = {
            name: key,
            storeId: id,
            args,
            after: (cb) => afterCallbacks.push(cb),
            onError: (cb) => errorCallbacks.push(cb)
          }

          // 通知 action 订阅者
          for (const sub of actionSubscribers) {
            sub(context)
          }

          try {
            const result = (value as Function)(...args)
            // 处理异步 action
            if (result instanceof Promise) {
              return result.then((res: any) => {
                afterCallbacks.forEach(cb => cb())
                return res
              }).catch((err: Error) => {
                errorCallbacks.forEach(cb => cb(err))
                throw err
              })
            }
            afterCallbacks.forEach(cb => cb())
            return result
          } catch (err) {
            errorCallbacks.forEach(cb => cb(err as Error))
            throw err
          }
        }
      } else {
        wrappedResult[key] = value
      }
    }

    // 创建 store 实例方法
    const storeInstance: StoreInstance<T> = {
      $id: id,

      $reset: () => {
        for (const [key, value] of Object.entries(setupResult)) {
          if (isRef(value) && key in initialState) {
            (value as any).value = initialState[key]
          }
        }
        notifySubscribers('direct')
      },

      $patch: (partialOrFn) => {
        if (typeof partialOrFn === 'function') {
          partialOrFn(wrappedResult as T)
        } else {
          for (const [key, value] of Object.entries(partialOrFn)) {
            const storeValue = (setupResult as any)[key]
            if (isRef(storeValue)) {
              storeValue.value = value
            }
          }
        }
        notifySubscribers('patch')
      },

      $subscribe: (callback) => {
        subscribers.push(callback)
        return () => {
          const idx = subscribers.indexOf(callback)
          if (idx !== -1) subscribers.splice(idx, 1)
        }
      },

      $onAction: (callback) => {
        actionSubscribers.push(callback)
        return () => {
          const idx = actionSubscribers.indexOf(callback)
          if (idx !== -1) actionSubscribers.splice(idx, 1)
        }
      }
    }

    function notifySubscribers(type: 'direct' | 'patch') {
      const mutation: StoreMutation = { type, storeId: id }
      for (const sub of subscribers) {
        sub(mutation, wrappedResult as T)
      }
    }

    // 合并 store 内容和实例方法
    const store = Object.assign(wrappedResult, storeInstance)

    // 执行全局插件
    for (const plugin of globalPlugins) {
      const pluginResult = plugin({ store, id })
      if (pluginResult) {
        Object.assign(store, pluginResult)
      }
    }

    // 缓存 store
    storeRegistry.set(id, store)

    return store as T & StoreInstance<T>
  }
}

// ============================================================
// 辅助函数
// ============================================================

/** 判断是否为 ref */
function isRef(value: any): boolean {
  return value && value.__v_isRef === true
}

/**
 * 注册全局 Store 插件
 *
 * @example
 * addStorePlugin(({ store, id }) => {
 *   // 持久化插件
 *   const saved = localStorage.getItem(id)
 *   if (saved) store.$patch(JSON.parse(saved))
 *   store.$subscribe((_, state) => {
 *     localStorage.setItem(id, JSON.stringify(state))
 *   })
 * })
 */
export function addStorePlugin(plugin: StorePlugin): void {
  globalPlugins.push(plugin)
}

/**
 * 获取已注册的 Store（按 ID）
 */
export function getStore<T = any>(id: string): T | undefined {
  return storeRegistry.get(id)
}

/**
 * 清除所有 Store 缓存（用于测试）
 */
export function clearStores(): void {
  storeRegistry.clear()
}
