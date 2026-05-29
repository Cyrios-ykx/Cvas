/**
 * Vuvas SFC 预览入口
 *
 * 演示如何使用 createVuvasApp 挂载 .vuvas 组件
 * 用法：类似 Vue 的 createApp(App).mount('#app')
 */

import { createVuvasApp } from '../src'
import App from './App.vuvas'

console.log('[Vuvas SFC] 组件定义:', App)

try {
  // 创建应用并挂载到 Canvas
  createVuvasApp(App).mount('#app')
  console.log('[Vuvas SFC] 挂载成功')
} catch (e) {
  console.error('[Vuvas SFC] 挂载失败:', e)
}
