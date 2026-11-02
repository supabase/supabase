import { afterEach } from 'vitest'

// Pure-logic `.test.ts` files run in the node environment, where these DOM polyfills and
// Testing Library hooks are neither needed nor valid. Files that opt into jsdom with a
// `// @vitest-environment jsdom` docblock still get the full DOM setup.
if (typeof window !== 'undefined') {
  await import('@testing-library/jest-dom/vitest')
  await import('./polyfills')

  const { cleanup } = await import('@testing-library/react')
  afterEach(() => {
    cleanup()
  })
}
