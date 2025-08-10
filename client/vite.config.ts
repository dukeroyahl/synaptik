import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig((/* _mode */) => {
  const env = (globalThis as any).process?.env || {};
  const analyze = env.ANALYZE === 'true';
  return {
    plugins: [
      react(),
      analyze && visualizer({
        filename: 'dist/bundle-report.html',
        template: 'treemap',
        gzipSize: true,
        brotliSize: true,
        open: false
      })
    ].filter(Boolean),
    build: {
      sourcemap: analyze
    },
    server: {
      port: parseInt(env.VITE_PORT || '5173'),
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8060',
          changeOrigin: true,
        },
      },
    },
  }
})
