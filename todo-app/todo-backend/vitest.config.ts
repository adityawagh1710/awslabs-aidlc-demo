import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    test: {
      environment: 'node',
      globals: false,
      env: loadEnv('test', process.cwd(), ''),
      envFile: '.env.test',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov'],
        include: ['src/**/*.ts'],
        exclude: ['src/types/**', 'src/**/*.d.ts'],
      },
      include: ['tests/**/*.test.ts'],
      testTimeout: 10000,
    },
  }
})
