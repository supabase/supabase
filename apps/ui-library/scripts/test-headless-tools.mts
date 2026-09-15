import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { blocks } from '../registry/blocks.ts'

const appRoot = fileURLToPath(new URL('../', import.meta.url))
const installRoot = await mkdtemp(join(tmpdir(), 'headless-tools-'))

try {
  const block = blocks.find((item) => item.name === 'headless-app-tanstack')!
  const files = block.files!.filter((file) => file.target?.startsWith('~/supabase/'))
  const targets = files.map((file) => file.target!)
  assert.equal(new Set(targets).size, targets.length, 'Install targets must be unique')
  assert(!block.registryDependencies?.some((dependency) => dependency.endsWith('/mcp-server.json')))

  for (const file of files) {
    const destination = join(installRoot, file.target!.replace(/^~\//, ''))
    await mkdir(dirname(destination), { recursive: true })
    await copyFile(join(appRoot, file.path), destination)
  }

  const functionRoot = join(installRoot, 'supabase/functions/mcp-server')
  await copyFile(
    join(appRoot, 'tests/headless-task-tools.test.mts'),
    join(functionRoot, 'tasks.test.ts')
  )

  for (const args of [
    ['check', '--frozen', 'index.ts'],
    ['test', '--frozen', 'tasks.test.ts'],
  ]) {
    const result = spawnSync('deno', args, { cwd: functionRoot, stdio: 'inherit' })
    if (result.error) throw result.error
    assert.equal(result.status, 0, `deno ${args.join(' ')} failed`)
  }
} finally {
  await rm(installRoot, { recursive: true, force: true })
}
