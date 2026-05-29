/**
 * vite-plugin-vuvas
 *
 * Vite 插件，用于处理 .vuvas 单文件组件
 *
 * 功能：
 * - 将 .vuvas 文件编译为 JS 模块
 * - 支持 HMR 热更新
 * - 支持 Source Map（基础）
 *
 * 使用方式：
 * ```ts
 * // vite.config.ts
 * import { defineConfig } from 'vite'
 * import vuvas from 'vuvas/vite'
 *
 * export default defineConfig({
 *   plugins: [vuvas()]
 * })
 * ```
 */

import { compileSFC } from './sfc'

/** 插件选项 */
export interface VuvasPluginOptions {
  /** 自定义文件扩展名（默认 .vuvas） */
  extension?: string
  /** 是否启用 HMR（默认 true） */
  hmr?: boolean
}

/**
 * 创建 Vuvas Vite 插件
 */
export function vuvasPlugin(options: VuvasPluginOptions = {}): any {
  const { extension = '.vuvas', hmr = true } = options
  const fileRegex = new RegExp(`\\${extension}$`)

  return {
    name: 'vite-plugin-vuvas',
    enforce: 'pre' as const,

    /**
     * 解析模块 ID
     * 让 Vite 识别 .vuvas 文件
     * 注意：只处理裸模块导入，相对/绝对路径由 Vite 自行解析
     */
    resolveId(id: string) {
      // 跳过带查询参数的（如 ?raw）
      if (id.includes('?')) return null
      // 跳过相对路径（Vite 会自行解析为绝对路径）
      if (id.startsWith('.')) return null
      // 跳过已经是绝对路径的
      if (id.startsWith('/') || id.includes(':')) return null
      if (fileRegex.test(id)) {
        return id
      }
      return null
    },

    /**
     * 转换 .vuvas 文件
     * 将 SFC 编译为 JS 模块
     */
    transform(code: string, id: string) {
      // 去掉查询参数后再匹配
      const cleanId = id.split('?')[0]
      if (!fileRegex.test(cleanId)) return null
      // 跳过 ?raw 等特殊导入
      if (id.includes('?')) return null

      try {
        const { code: compiledCode, map } = compileSFC(code, id, { sourceMap: true })

        // 添加 HMR 支持代码
        let output = compiledCode
        if (hmr) {
          output += generateHMRCode(id, null)
        }

        return {
          code: output,
          map: map || null
        }
      } catch (e: any) {
        this.error(`[vite-plugin-vuvas] 编译失败: ${id}\n${e.message}`)
        return null
      }
    },

    /**
     * 处理热更新
     */
    handleHotUpdate(ctx: any) {
      if (!fileRegex.test(ctx.file)) return

      // 通知客户端更新
      ctx.server.ws.send({
        type: 'custom',
        event: 'vuvas:update',
        data: {
          file: ctx.file,
          timestamp: Date.now()
        }
      })
    }
  }
}

/**
 * 生成 HMR 热更新代码
 */
function generateHMRCode(id: string, _descriptor: any): string {
  return `

// HMR 热更新支持
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule) {
      // 触发组件重新渲染
      __VUVAS_HMR_UPDATE__(${JSON.stringify(id)}, newModule.default)
    }
  })
}

// HMR 更新处理器（由运行时注入）
if (typeof __VUVAS_HMR_UPDATE__ === 'undefined') {
  globalThis.__VUVAS_HMR_UPDATE__ = (id, newDef) => {
    console.log('[Vuvas HMR] 组件已更新:', id)
  }
}
`
}

// 默认导出
export default vuvasPlugin
