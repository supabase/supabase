import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = fileURLToPath(new URL('../', import.meta.url))

// Installs registry files into a temporary project at their targets, copies
// tests beside the Edge Function, and runs each Deno command there.
export async function testInstalledFunction({
  files,
  functionName,
  tests,
  commands,
}: {
  files: { path: string; target?: string }[]
  functionName: string
  // Installed file name → file in tests/.
  tests: Record<string, string>
  commands: string[][]
}) {
  const installRoot = await mkdtemp(join(tmpdir(), `${functionName}-`))
  try {
    const targets = files.map((file) => file.target!)
    assert.equal(new Set(targets).size, targets.length, 'Install targets must be unique')
    for (const file of files) {
      const destination = join(installRoot, file.target!.replace(/^~\//, ''))
      await mkdir(dirname(destination), { recursive: true })
      await copyFile(join(appRoot, file.path), destination)
    }

    const functionRoot = join(installRoot, 'supabase/functions', functionName)
    for (const [name, source] of Object.entries(tests)) {
      await copyFile(join(appRoot, 'tests', source), join(functionRoot, name))
    }

    const deno = process.env.DENO_BIN ?? 'deno'
    for (const args of commands) {
      const result = spawnSync(deno, args, { cwd: functionRoot, stdio: 'inherit' })
      if (result.error) throw result.error
      assert.equal(result.status, 0, `deno ${args.join(' ')} failed`)
    }
  } finally {
    await rm(installRoot, { recursive: true, force: true })
  }
}
