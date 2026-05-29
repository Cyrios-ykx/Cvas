/**
 * Vuvas 应用入口
 *
 * 提供类似 Vue 的 createApp(Component).mount('#app') API
 * 将 .vuvas 组件挂载到 Canvas 上运行
 */

import { App } from './core'
import { mountComponent, type ComponentDef } from './runtime'
import { onSchedulerFlushed, offSchedulerFlushed } from './scheduler'
import { installGlobalErrorListeners, setErrorHandler, setWarnHandler, type ErrorHandler, type WarnHandler } from './error'

// ============================================================
// createVuvasApp
// ============================================================

/** Vuvas 应用实例 */
export interface VuvasAppInstance {
  /** 挂载到指定 Canvas */
  mount(selector: string): VuvasAppInstance
  /** 卸载应用 */
  unmount(): void
  /** 配置项 */
  config: {
    /** 全局错误处理器 */
    errorHandler: ErrorHandler | null
    /** 全局警告处理器 */
    warnHandler: WarnHandler | null
  }
  /** 底层 App 实例 */
  _app: App | null
}

/**
 * 创建 Vuvas 应用
 *
 * 接收一个 .vuvas 编译后的组件定义，返回可挂载的应用实例
 *
 * @example
 * ```ts
 * import App from './App.vuvas'
 * import { createVuvasApp } from 'vuvas'
 *
 * createVuvasApp(App).mount('#app')
 * ```
 */
export function createVuvasApp(rootComponent: ComponentDef, rootProps: Record<string, any> = {}): VuvasAppInstance {
  let app: App | null = null
  // 保存回调引用，确保 unmount 时能正确移除
  let scheduleRenderCb: (() => void) | null = null

  // 安装全局错误监听器
  installGlobalErrorListeners()

  const instance: VuvasAppInstance = {
    _app: null,

    // 配置项：支持设置错误/警告处理器
    config: {
      get errorHandler() { return null },
      set errorHandler(handler: ErrorHandler | null) {
        setErrorHandler(handler)
      },
      get warnHandler() { return null },
      set warnHandler(handler: WarnHandler | null) {
        setWarnHandler(handler)
      }
    },

    mount(selector: string): VuvasAppInstance {
      const canvas = document.querySelector(selector) as HTMLCanvasElement
      if (!canvas || canvas.tagName !== 'CANVAS') {
        throw new Error(`[Vuvas] 找不到 Canvas 元素: ${selector}`)
      }

      // 创建底层 App
      app = new App(canvas)
      instance._app = app

      // 注册调度器 flush 回调：组件更新完成后自动触发 Canvas 重渲染
      scheduleRenderCb = () => app?.scheduleRender()
      onSchedulerFlushed(scheduleRenderCb)

      // 通过 mountComponent 挂载根组件
      const { node } = mountComponent(rootComponent, rootProps)

      if (node) {
        app.mount(node)
      } else {
        console.error('[Vuvas] 根组件渲染失败：未返回有效节点')
      }

      return instance
    },

    unmount(): void {
      // 移除调度器回调
      if (scheduleRenderCb) {
        offSchedulerFlushed(scheduleRenderCb)
        scheduleRenderCb = null
      }
      app = null
      instance._app = null
    }
  }

  return instance
}
