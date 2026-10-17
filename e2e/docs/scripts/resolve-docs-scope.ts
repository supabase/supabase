#!/usr/bin/env node
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { runResolveScopeCli } from '../../shared/resolve-scope-cli.ts'
import { resolveDocsScope } from '../utils/resolve-docs-scope.ts'

runResolveScopeCli({
  label: 'docs',
  repoRoot: join(dirname(fileURLToPath(import.meta.url)), '../../..'),
  resolveScope: resolveDocsScope,
}).catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
