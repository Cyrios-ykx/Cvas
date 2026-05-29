/**
 * Vuvas 全局错误处理
 *
 * 提供统一的错误捕获、格式化和上报机制
 * 解决 Canvas 环境下错误被静默吞掉的问题
 *
 * 使用方式：
 * ```ts
 * import { setErrorHandler, setWarnHandler } from 'vuvas'
 *
 * // 自定义错误处理
 * setErrorHandler((err, context) => {
 *   console.error(`[${context}]`, err)
 *   // 上报到监控平台...
 * })
 * ```
 */

// ============================================================
// 类型定义
// ============================================================

/** 错误来源上下文 */
export enum ErrorSource {
  /** 组件渲染 */
  RENDER = 'render',
  /** 组件 setup */
  SETUP = 'setup',
  /** 事件回调 */
  EVENT_HANDLER = 'event handler',
  /** 生命周期钩子 */
  LIFECYCLE = 'lifecycle hook',
  /** 调度器任务 */
  SCHEDULER = 'scheduler',
  /** watch 回调 */
  WATCH = 'watch callback',
  /** 响应式副作用 */
  EFFECT = 'reactive effect',
  /** 原生事件监听 */
  NATIVE_EVENT = 'native event listener',
  /** 未知来源 */
  UNKNOWN = 'unknown'
}

/** 错误处理器函数签名 */
export type ErrorHandler = (err: unknown, source: ErrorSource, info?: string) => void

/** 警告处理器函数签名 */
export type WarnHandler = (msg: string, source?: string) => void

// ============================================================
// 全局处理器
// ============================================================

/** 用户自定义错误处理器 */
let userErrorHandler: ErrorHandler | null = null

/** 用户自定义警告处理器 */
let userWarnHandler: WarnHandler | null = null

/**
 * 设置全局错误处理器
 * 类似 Vue 的 app.config.errorHandler
 */
export function setErrorHandler(handler: ErrorHandler | null): void {
  userErrorHandler = handler
}

/**
 * 设置全局警告处理器
 * 类似 Vue 的 app.config.warnHandler
 */
export function setWarnHandler(handler: WarnHandler | null): void {
  userWarnHandler = handler
}

// ============================================================
// 核心错误处理
// ============================================================

/**
 * 处理捕获到的错误
 * 优先调用用户自定义处理器，否则使用默认的控制台输出
 */
export function handleError(err: unknown, source: ErrorSource, info?: string): void {
  // 调用用户自定义处理器
  if (userErrorHandler) {
    try {
      userErrorHandler(err, source, info)
      return
    } catch (handlerErr) {
      // 错误处理器自身出错，降级到默认处理
      console.error('[Vuvas] errorHandler 自身抛出了错误:', handlerErr)
    }
  }

  // 默认处理：格式化输出到控制台
  defaultErrorHandler(err, source, info)
}

/**
 * 处理警告信息
 */
export function handleWarn(msg: string, source?: string): void {
  if (userWarnHandler) {
    try {
      userWarnHandler(msg, source)
      return
    } catch (handlerErr) {
      console.error('[Vuvas] warnHandler 自身抛出了错误:', handlerErr)
    }
  }

  // 默认警告输出
  const prefix = source ? `[Vuvas][${source}]` : '[Vuvas]'
  console.warn(`${prefix} ${msg}`)
}

/**
 * 安全执行函数，捕获并处理错误
 * 用于包装用户回调（事件处理器、生命周期钩子等）
 */
export function callWithErrorHandling<T>(
  fn: (...args: any[]) => T,
  source: ErrorSource,
  args?: any[],
  info?: string
): T | undefined {
  try {
    return args ? fn(...args) : fn()
  } catch (err) {
    handleError(err, source, info)
    return undefined
  }
}

/**
 * 安全执行异步函数
 */
export async function callWithAsyncErrorHandling<T>(
  fn: (...args: any[]) => T | Promise<T>,
  source: ErrorSource,
  args?: any[],
  info?: string
): Promise<T | undefined> {
  try {
    const result = args ? fn(...args) : fn()
    if (result instanceof Promise) {
      return await result
    }
    return result
  } catch (err) {
    handleError(err, source, info)
    return undefined
  }
}

// ============================================================
// 默认错误处理器
// ============================================================

/**
 * 默认错误处理：格式化输出到控制台
 * 提供清晰的错误上下文信息
 */
function defaultErrorHandler(err: unknown, source: ErrorSource, info?: string): void {
  const header = `\n🚨 [Vuvas Error] in ${source}`
  const detail = info ? `  → ${info}` : ''

  // 使用 console.group 分组显示
  console.group(`%c${header}`, 'color: #f56c6c; font-weight: bold;')

  if (detail) {
    console.log(`%c${detail}`, 'color: #909399;')
  }

  if (err instanceof Error) {
    console.error(err)
  } else {
    console.error('Error value:', err)
  }

  console.groupEnd()
}

// ============================================================
// 全局未捕获错误监听
// ============================================================

let globalListenersInstalled = false

/**
 * 安装全局错误监听器
 * 捕获 unhandledrejection 和 error 事件
 * 在 createVuvasApp 时自动调用
 */
export function installGlobalErrorListeners(): void {
  if (globalListenersInstalled) return
  globalListenersInstalled = true

  // 捕获未处理的 Promise rejection（调度器中的错误会走这里）
  window.addEventListener('unhandledrejection', (event) => {
    // 检查是否是 Vuvas 内部的错误（通过标记判断）
    const err = event.reason
    if (err && (err as any).__vuvas_source) {
      event.preventDefault() // 阻止默认的控制台输出（我们自己处理）
      handleError(err, (err as any).__vuvas_source, (err as any).__vuvas_info)
    }
  })

  // 捕获同步错误（requestAnimationFrame 中的错误会走这里）
  window.addEventListener('error', (event) => {
    const err = event.error
    if (err && (err as any).__vuvas_source) {
      event.preventDefault()
      handleError(err, (err as any).__vuvas_source, (err as any).__vuvas_info)
    }
  })
}

/**
 * 为错误对象附加 Vuvas 上下文标记
 * 用于全局监听器识别来源
 */
export function markError(err: unknown, source: ErrorSource, info?: string): unknown {
  if (err && typeof err === 'object') {
    (err as any).__vuvas_source = source
    ;(err as any).__vuvas_info = info
  }
  return err
}
