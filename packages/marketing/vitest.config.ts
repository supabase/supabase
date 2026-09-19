import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Everything under test here is pure logic, so no DOM environment is needed.
  test: { environment: 'node' },
})
