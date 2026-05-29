/**
 * Vuvas 响应式系统 - 核心实现
 * 参考 Vue3 @vue/reactivity 的设计思想
 *
 * 核心概念：
 * - effect: 副作用函数，当依赖的响应式数据变化时自动重新执行
 * - reactive: 将对象变为响应式（Proxy 代理）
 * - ref: 将基本类型值包装为响应式引用
 * - computed: 计算属性，惰性求值 + 缓存
 */

// ============================================================
// 依赖追踪系统
// ============================================================

/** 当前正在执行的 effect */
let activeEffect: ReactiveEffect | null = null
/** effect 栈（支持嵌套 effect） */
const effectStack: ReactiveEffect[] = []

/** 响应式副作用函数 */
export class ReactiveEffect {
  /** 是否激活 */
  active: boolean = true
  /** 该 effect 的所有依赖集合（用于清理） */
  deps: Set<ReactiveEffect>[] = []
  /** 调度器：控制 effect 的执行时机 */
  scheduler?: () => void

  constructor(
    public fn: () => any,
    scheduler?: () => void
  ) {
    this.scheduler = scheduler
  }

  /** 执行副作用函数 */
  run(): any {
    if (!this.active) return this.fn()

    // 避免重复收集
    if (effectStack.includes(this)) return

    try {
      // 清理旧依赖
      this.cleanup()
      // 入栈
      effectStack.push(this)
      activeEffect = this
      // 执行函数，触发 getter 收集依赖
      return this.fn()
    } finally {
      // 出栈
      effectStack.pop()
      activeEffect = effectStack[effectStack.length - 1] || null
    }
  }

  /** 清理所有依赖关系 */
  cleanup(): void {
    for (const dep of this.deps) {
      dep.delete(this)
    }
    this.deps.length = 0
  }

  /** 停止该 effect */
  stop(): void {
    if (this.active) {
      this.cleanup()
      this.active = false
    }
  }
}

// ============================================================
// 依赖收集与触发
// ============================================================

/** 全局依赖映射：target -> key -> effects */
const targetMap = new WeakMap<object, Map<string | symbol, Set<ReactiveEffect>>>()

/** 收集依赖 */
export function track(target: object, key: string | symbol): void {
  if (!activeEffect) return

  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }

  let dep = depsMap.get(key)
  if (!dep) {
    dep = new Set()
    depsMap.set(key, dep)
  }

  if (!dep.has(activeEffect)) {
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
  }
}

/** 触发更新 */
export function trigger(target: object, key: string | symbol): void {
  const depsMap = targetMap.get(target)
  if (!depsMap) return

  const dep = depsMap.get(key)
  if (!dep) return

  // 复制一份避免无限循环
  const effects = new Set(dep)
  effects.forEach(effect => {
    // 避免自身触发自身
    if (effect === activeEffect) return
    if (effect.scheduler) {
      effect.scheduler()
    } else {
      effect.run()
    }
  })
}

// ============================================================
// effect API
// ============================================================

export interface EffectOptions {
  /** 调度器 */
  scheduler?: () => void
  /** 是否立即执行 */
  lazy?: boolean
}

/**
 * 创建响应式副作用
 * 当内部访问的响应式数据变化时，自动重新执行
 */
export function effect(fn: () => any, options?: EffectOptions): ReactiveEffect {
  const _effect = new ReactiveEffect(fn, options?.scheduler)

  // 默认立即执行一次
  if (!options?.lazy) {
    _effect.run()
  }

  return _effect
}

// ============================================================
// reactive API
// ============================================================

/** 已代理对象的缓存 */
const reactiveMap = new WeakMap<object, object>()

/**
 * 将对象变为响应式
 * 返回 Proxy 代理对象，访问属性时自动收集依赖，修改属性时自动触发更新
 */
export function reactive<T extends object>(target: T): T {
  // 避免重复代理
  if (reactiveMap.has(target)) {
    return reactiveMap.get(target) as T
  }

  const proxy = new Proxy(target, {
    get(target, key, receiver) {
      // 收集依赖
      track(target, key)
      const result = Reflect.get(target, key, receiver)
      // 深层响应式：如果值是对象，递归代理
      if (result !== null && typeof result === 'object') {
        return reactive(result)
      }
      return result
    },
    set(target, key, value, receiver) {
      const oldValue = (target as any)[key]
      const result = Reflect.set(target, key, value, receiver)
      // 值变化时触发更新
      if (oldValue !== value) {
        trigger(target, key)
      }
      return result
    },
    deleteProperty(target, key) {
      const hadKey = key in target
      const result = Reflect.deleteProperty(target, key)
      if (hadKey && result) {
        trigger(target, key)
      }
      return result
    }
  })

  reactiveMap.set(target, proxy)
  return proxy as T
}

// ============================================================
// ref API
// ============================================================

/** ref 标识符 */
const RefFlag = '__v_isRef'

export interface Ref<T = any> {
  value: T
  [RefFlag]: true
}

/**
 * 创建响应式引用
 * 将基本类型值包装为 { value: T } 的响应式对象
 */
export function ref<T>(value: T): Ref<T> {
  if (isRef(value)) return value as any

  const refObj = {
    [RefFlag]: true as const,
    _value: value,
    get value(): T {
      track(refObj, 'value')
      return refObj._value
    },
    set value(newValue: T) {
      if (newValue !== refObj._value) {
        refObj._value = newValue
        trigger(refObj, 'value')
      }
    }
  }

  return refObj as any as Ref<T>
}

/** 判断是否为 ref */
export function isRef(value: any): value is Ref {
  return value && value[RefFlag] === true
}

/** 解包 ref（如果是 ref 返回 .value，否则返回原值） */
export function unref<T>(ref: T | Ref<T>): T {
  return isRef(ref) ? ref.value : ref
}

// ============================================================
// computed API
// ============================================================

/**
 * 创建计算属性
 * 惰性求值 + 缓存，只有依赖变化时才重新计算
 */
export function computed<T>(getter: () => T): Ref<T> {
  let cached: T
  let dirty = true

  const _effect = new ReactiveEffect(getter, () => {
    // 依赖变化时标记为脏，下次访问时重新计算
    if (!dirty) {
      dirty = true
      trigger(computedRef, 'value')
    }
  })

  const computedRef = {
    [RefFlag]: true as const,
    get value(): T {
      track(computedRef, 'value')
      if (dirty) {
        cached = _effect.run()
        dirty = false
      }
      return cached
    }
  }

  return computedRef as any as Ref<T>
}

// ============================================================
// watch API
// ============================================================

export type WatchSource<T> = Ref<T> | (() => T)
export type WatchCallback<T> = (newValue: T, oldValue: T | undefined) => void

export interface WatchOptions {
  immediate?: boolean
}

/**
 * 侦听响应式数据变化
 */
export function watch<T>(
  source: WatchSource<T>,
  callback: WatchCallback<T>,
  options?: WatchOptions
): () => void {
  // 获取值的函数
  const getter = isRef(source) ? () => (source as Ref<T>).value : source as () => T

  let oldValue: T | undefined

  const job = () => {
    const newValue = _effect.run()
    if (newValue !== oldValue) {
      callback(newValue, oldValue)
      oldValue = newValue
    }
  }

  const _effect = new ReactiveEffect(getter, job)

  if (options?.immediate) {
    job()
  } else {
    oldValue = _effect.run()
  }

  // 返回停止函数
  return () => _effect.stop()
}

/**
 * 立即执行并追踪依赖的侦听器
 */
export function watchEffect(fn: () => void): () => void {
  const _effect = new ReactiveEffect(fn)
  _effect.run()
  return () => _effect.stop()
}
