import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { generateTypes } from './verify-production-types.mjs'

const specifications = [{ name: 'api-v1', url: 'https://example.com/api/v1-json' }]

test('generateTypes fetches specifications and generates types straight into the given directory', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'api-types-generate-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const temporaryDirectory = join(directory, 'fetched')
  const generatedTypesDirectory = join(directory, 'output')
  await mkdir(temporaryDirectory)
  await mkdir(generatedTypesDirectory)
  const runCalls = []

  await generateTypes(specifications, {
    temporaryDirectory,
    generatedTypesDirectory,
    fetchImpl: async (url) => ({ ok: true, text: async () => `spec from ${url}` }),
    runImpl: async (command, args) => {
      runCalls.push([command, args])
      if (args.includes('--find-config-path')) return { stdout: '/repo/.prettierrc\n' }
      return { stdout: '' }
    },
  })

  const specification = await readFile(join(temporaryDirectory, 'api-v1.json'), 'utf8')
  assert.match(specification, /v1-json/)

  const redocly = await readFile(join(temporaryDirectory, 'redocly.yaml'), 'utf8')
  assert.match(redocly, new RegExp(`output: ${generatedTypesDirectory}/api-v1.d.ts`))

  assert.equal(runCalls.length, 3)
  assert.deepEqual(runCalls[0][0], 'pnpm')
  assert.ok(runCalls[0][1].includes('openapi-typescript'))
  assert.ok(runCalls[1][1].includes('--find-config-path'))
  assert.ok(runCalls[2][1].includes('--write'))
  assert.ok(runCalls[2][1].includes(join(generatedTypesDirectory, 'api-v1.d.ts')))
})
