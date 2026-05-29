import { defineConfig } from 'vite'
import { resolve } from 'path'
import { vuvasPlugin } from './src/compiler/vite-plugin'

export default defineConfig({
  // GitHub Pages 部署时使用 /Vuvas/ 路径，本地开发使用 /
  base: process.env.BASE_URL || '/',
  plugins: [vuvasPlugin()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'vuvas': resolve(__dirname, 'src')
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        demo: resolve(__dirname, 'demo.html'),
        sfc: resolve(__dirname, 'sfc.html'),
        benchmark: resolve(__dirname, 'benchmarks/index.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
