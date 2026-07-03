import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

// this config is only ever loaded from the repo root (via `npm test`), so cwd is the repo root —
// avoids import.meta, which tsserver rejects here (no root tsconfig → defaults to CommonJS module)
export default defineConfig({
  resolve: {
    alias: { '@shared': resolve(process.cwd(), 'packages/shared') }
  },
  test: {
    environment: 'node',
    include: ['packages/**/*.test.ts'],
    // let the eval harness's afterAll scorecard print instead of being buffered
    disableConsoleIntercept: true
  }
})
