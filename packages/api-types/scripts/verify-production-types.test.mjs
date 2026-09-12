import assert from 'node:assert/strict'
import test from 'node:test'

import { fetchOpenApiSpecifications, findMismatchedTypes } from './verify-production-types.mjs'

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
