import { cpSync, existsSync } from 'node:fs'
import { join } from 'node:path'

// Mirrors `pnpm run codegen:examples` so the test suite is self-contained.
// CodeSample.test.ts reads fixtures from apps/docs/examples/_internal/fixtures/,
// which are sourced from the repo-root examples/ directory. Without this,
// `npx vitest`, `pnpm test:local`, or IDE single-test runs all fail with ENOENT
// because they bypass the `pretest` npm lifecycle hook.
export default function setup() {
  const source = join(import.meta.dirname, '..', '..', 'examples')
  const dest = join(import.meta.dirname, 'examples')
  if (!existsSync(source)) {
    throw new Error(`Expected repo-root examples directory at ${source}`)
  }
  cpSync(source, dest, { recursive: true })
}
