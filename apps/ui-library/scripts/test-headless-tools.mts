import assert from 'node:assert/strict'

import { blocks } from '../registry/blocks.ts'
import { testInstalledFunction } from './installed-function.mts'

const block = blocks.find((item) => item.name === 'headless-app-tanstack')!
assert(!block.registryDependencies?.some((dependency) => dependency.endsWith('/mcp-server.json')))

await testInstalledFunction({
  files: block.files!.filter((file) => file.target?.startsWith('~/supabase/')),
  functionName: 'mcp-server',
  tests: { 'tasks.test.ts': 'headless-task-tools.test.mts' },
  commands: [
    ['check', '--frozen', 'index.ts'],
    ['test', '--frozen', 'tasks.test.ts'],
  ],
})
