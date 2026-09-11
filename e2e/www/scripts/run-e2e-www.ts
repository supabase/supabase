#!/usr/bin/env node
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { runSuite } from '../../shared/run-suite.ts'
import { resolveAllWwwPages, resolveWwwScope } from '../utils/resolve-www-scope.ts'

runSuite({
  root: join(dirname(fileURLToPath(import.meta.url)), '..'),
  label: 'www',
  devCommand: 'pnpm dev:www',
  pagePathsEnv: 'WWW_E2E_PAGE_PATHS',
  baseRefEnv: 'WWW_E2E_BASE_REF',
  defaultBaseUrl: 'http://localhost:3000',
  resolveScope: resolveWwwScope,
  resolveAllPages: resolveAllWwwPages,
}).catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
