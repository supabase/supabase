import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  fetchOpenApiSpecifications,
  findMismatchedTypes,
  reportTypeDifferences,
} from './verify-production-types.mjs'

test('reports unified diffs in logs and appends an escaped, bounded Actions summary', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'api-types-report-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const typesDirectory = join(directory, 'committed')
  const generatedTypesDirectory = join(directory, 'production')
  const summaryPath = join(directory, 'summary.md')
  await mkdir(typesDirectory)
  await mkdir(generatedTypesDirectory)
  await writeFile(summaryPath, 'Existing summary\n')
  await writeFile(join(typesDirectory, 'api-v1.d.ts'), 'type A = string\n')
  await writeFile(join(generatedTypesDirectory, 'api-v1.d.ts'), 'type A = Array<number>\n')
  await writeFile(join(typesDirectory, 'platform.d.ts'), 'old\n')
  await writeFile(join(generatedTypesDirectory, 'platform.d.ts'), 'new\n'.repeat(20_000))
  const logs = []
  await reportTypeDifferences(['api-v1.d.ts', 'platform.d.ts'], {
    typesDirectory,
    generatedTypesDirectory,
    summaryPath,
    log: (value) => logs.push(value),
  })
  assert.equal(logs.length, 2)
  assert.match(logs[0], /--- committed\/api-v1.d.ts\n\+\+\+ production\/api-v1.d.ts/)
  assert.match(logs[0], /@@ -1 \+1 @@/)
  assert.match(logs[0], /-type A = string\n\+type A = Array<number>/)
  assert.ok(logs[1].length > 60_000)
  const summary = await readFile(summaryPath, 'utf8')
  assert.ok(summary.startsWith('Existing summary\n'))
  assert.match(summary, /Array&lt;number&gt;/)
  assert.match(summary, /### platform.d.ts/)
  assert.match(summary, /Diff preview truncated/)
  assert.ok(summary.length < 62_000)

  await reportTypeDifferences(['api-v1.d.ts'], {
    typesDirectory,
    generatedTypesDirectory,
    summaryPath: '',
    log: () => {},
  })
  await assert.rejects(
    reportTypeDifferences(['missing.d.ts'], {
      typesDirectory,
      generatedTypesDirectory,
      summaryPath: '',
      log: () => {},
    }),
    (error) => error.code === 2
  )
})

const specifications = [
  { name: 'api-v1', url: 'https://example.com/api/v1-json' },
  { name: 'platform', url: 'https://example.com/api/platform-json' },
]

test('writes fetched specifications and returns their Redocly configuration', async () => {
  const writes = []
  const config = await fetchOpenApiSpecifications(specifications, {
    temporaryDirectory: '/tmp/api-types',
    generatedTypesDirectory: '/tmp/api-types/types',
    fetchImpl: async (url) => ({
      ok: true,
      text: async () => `OpenAPI specification from ${url}`,
    }),
    writeFileImpl: async (path, content) => writes.push({ path, content }),
  })

  assert.deepEqual(writes, [
    {
      path: '/tmp/api-types/api-v1.json',
      content: 'OpenAPI specification from https://example.com/api/v1-json',
    },
    {
      path: '/tmp/api-types/platform.json',
      content: 'OpenAPI specification from https://example.com/api/platform-json',
    },
  ])
  assert.deepEqual(config, [
    '  api-v1:\n    root: /tmp/api-types/api-v1.json\n    x-openapi-ts:\n      output: /tmp/api-types/types/api-v1.d.ts',
    '  platform:\n    root: /tmp/api-types/platform.json\n    x-openapi-ts:\n      output: /tmp/api-types/types/platform.d.ts',
  ])
})

test('returns no mismatches when generated types match committed types', async () => {
  const mismatches = await findMismatchedTypes(specifications, {
    generatedTypesDirectory: '/generated',
    typesDirectory: '/committed',
    readFileImpl: async (path) =>
      path.includes('/generated/') ? 'generated type' : 'generated type',
  })

  assert.deepEqual(mismatches, [])
})

test('reports every generated type that differs from its committed counterpart', async () => {
  const mismatches = await findMismatchedTypes(specifications, {
    generatedTypesDirectory: '/generated',
    typesDirectory: '/committed',
    readFileImpl: async (path) => {
      if (path.endsWith('api-v1.d.ts')) return 'matching type'
      return path.includes('/generated/') ? 'new platform type' : 'committed platform type'
    },
  })

  assert.deepEqual(mismatches, ['platform.d.ts'])
})

test('rejects unsuccessful OpenAPI responses', async () => {
  await assert.rejects(
    fetchOpenApiSpecifications([specifications[0]], {
      temporaryDirectory: '/tmp/api-types',
      generatedTypesDirectory: '/tmp/api-types/types',
      fetchImpl: async () => ({ ok: false, status: 503 }),
      writeFileImpl: async () => assert.fail('does not write an unsuccessful response'),
    }),
    /Could not fetch api-v1 OpenAPI specification from https:\/\/example\.com\/api\/v1-json: 503\./
  )
})

test('rejects failed OpenAPI requests', async () => {
  await assert.rejects(
    fetchOpenApiSpecifications([specifications[0]], {
      temporaryDirectory: '/tmp/api-types',
      generatedTypesDirectory: '/tmp/api-types/types',
      fetchImpl: async () => {
        throw new Error('network unavailable')
      },
      writeFileImpl: async () => assert.fail('does not write a failed response'),
    }),
    /Could not fetch api-v1 OpenAPI specification from https:\/\/example\.com\/api\/v1-json\./
  )
})
