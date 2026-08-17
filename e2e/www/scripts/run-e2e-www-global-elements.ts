#!/usr/bin/env node
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { runSuite } from '../../shared/run-suite.ts'

// A fixed page list, so nothing is resolved from the git diff.
runSuite({
  root: join(dirname(fileURLToPath(import.meta.url)), '..'),
  label: 'www global elements',
  devCommand: 'pnpm dev:www',
  defaultBaseUrl: 'http://localhost:3000',
  project: 'global-elements',
}).catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
