#!/usr/bin/env node
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { runSuite } from '../../shared/run-suite.ts'

// Fixed page list, so unlike `pnpm e2e:docs` this resolves nothing from git.
runSuite({
  root: join(dirname(fileURLToPath(import.meta.url)), '..'),
  label: 'docs',
  devCommand: 'pnpm dev:docs',
  defaultBaseUrl: 'http://localhost:3001',
  project: 'global-elements',
}).catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
