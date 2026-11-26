#!/usr/bin/env node
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { runResolveScopeCli } from '../../shared/resolve-scope-cli.ts'
import { resolveWwwScope } from '../utils/resolve-www-scope.ts'

runResolveScopeCli({
  label: 'www',
  repoRoot: join(dirname(fileURLToPath(import.meta.url)), '../../..'),
  resolveScope: resolveWwwScope,
}).catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
