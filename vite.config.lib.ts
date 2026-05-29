import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

// 库模式构建配置 —— 用于打包发布到 npm
export default defineConfig({
  plugins: [
    dts({
      // 输出类型声明到 dist 目录
      outDir: 'dist/types',
      // 入口文件
      include: ['src/**/*.ts'],
      // 排除 demo 和测试文件
      exclude: ['demo/**', '**/*.test.ts', '**/*.spec.ts'],
      // 生成后将根入口的 .d.ts 复制到 dist 根目录
      rollupTypes: true,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        router: resolve(__dirname, 'src/router/index.ts'),
        store: resolve(__dirname, 'src/store/index.ts'),
        compiler: resolve(__dirname, 'src/compiler/index.ts'),
        animation: resolve(__dirname, 'src/animation/index.ts'),
        components: resolve(__dirname, 'src/components/index.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const ext = format === 'es' ? 'mjs' : 'cjs'
        return `${entryName}.${ext}`
      },
    },
    rollupOptions: {
      // 不打包的外部依赖（目前没有外部依赖）
      external: [],
      output: {
        // 保持模块结构，方便 tree-shaking
        preserveModules: false,
      },
    },
    // 输出目录
    outDir: 'dist',
    // 构建前清空输出目录
    emptyOutDir: true,
    // 生成 sourcemap
    sourcemap: true,
    // 最小化压缩（库模式建议关闭，让使用者自行压缩）
    minify: false,
  },
})
