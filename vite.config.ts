import { defineConfig } from 'vite'
import { resolve } from 'path'
import { vuvasPlugin } from './src/compiler/vite-plugin'

export default defineConfig({
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
        sfc: resolve(__dirname, 'sfc.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
