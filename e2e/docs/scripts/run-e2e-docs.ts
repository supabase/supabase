#!/usr/bin/env node
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { runSuite } from '../../shared/run-suite.ts'
import { resolveAllDocsPages, resolveDocsScope } from '../utils/resolve-docs-scope.ts'

runSuite({
  root: join(dirname(fileURLToPath(import.meta.url)), '..'),
  label: 'docs',
  devCommand: 'pnpm dev:docs',
  pagePathsEnv: 'DOCS_E2E_PAGE_PATHS',
  baseRefEnv: 'DOCS_E2E_BASE_REF',
  defaultBaseUrl: 'http://localhost:3001',
  project: 'pages',
  allProjects: ['pages', 'global-elements'],
  resolveScope: resolveDocsScope,
  resolveAllPages: resolveAllDocsPages,
}).catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
