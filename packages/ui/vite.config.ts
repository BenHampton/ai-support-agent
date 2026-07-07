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
    }
  }
})
