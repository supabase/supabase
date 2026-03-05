import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@studio-data': resolve(__dirname, '../../apps/studio/data'),
    },
  },
})
