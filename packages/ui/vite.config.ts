/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  // load all .env vars (no prefix filter) so server-side config like BACKEND_URL is available
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@shared': path.resolve(__dirname, '../shared'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@pages': path.resolve(__dirname, 'src/pages')
      }
    },
    server: {
      port: parseInt(env.PORT ?? '5173'),
      proxy: {
        '/api': {
          target: env.BACKEND_URL ?? 'http://localhost:3001',
          rewrite: (p) => p.replace(/^\/api/, '')
        }
      }
    },
    // UI-only test config (jsdom + RTL); reuses resolve.alias above. Backend tests use the root
    // vitest.config.ts (node env) and match *.test.ts, so they don't pick up these *.test.tsx files.
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./vitest.setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      css: true
    }
  }
})
