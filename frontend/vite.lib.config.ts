import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

/**
 * 库模式配置：构建 npm 包（@stumed/my-admin-ui）
 * 导出组件、hooks、API 函数、类型定义
 */
export default defineConfig({
  plugins: [
    react(),
    dts({
      rollupTypes: true,
      tsconfigPath: './tsconfig.json',
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rollupOptions: {
      // 外部依赖不打包进库
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react-router-dom',
        '@tanstack/react-query',
        '@tanstack/react-form',
        'axios',
        'dayjs',
        'lucide-react',
        'sonner',
        'react-dropzone',
        'react-error-boundary',
        'react-hook-form',
        'clsx',
        'tailwind-merge',
        'class-variance-authority',
        /^@radix-ui\//,
        /^@dnd-kit\//,
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react-router-dom': 'ReactRouterDOM',
        },
      },
    },
    // 提取 CSS 到单独文件
    cssCodeSplit: false,
  },
})
