import assert from 'node:assert/strict'
import test from 'node:test'

import { generateFgaRequirements } from './generate-fga-requirements.mjs'

const specifications = [
  { name: 'api-v1', url: 'http://local/api/v1-json' },
  { name: 'api-v2', url: 'http://local/api/v2-json' },
  { name: 'platform', url: 'http://local/api/platform-json' },
]

const specs = {
  'http://local/api/v1-json': {
    paths: { '/v1/x': { get: { 'x-fga-permissions': [['a_read']] } } },
  },
  'http://local/api/v2-json': {
    paths: { '/v2/x': { get: { 'x-fga-permissions': [] } } },
  },
  'http://local/api/platform-json': {
    components: {
      schemas: {
        CreateScopedAccessTokenBody: {
          properties: { permissions: { items: { enum: ['a_read'] } } },
        },
      },
    },
    paths: {},
  },
}

test('generateFgaRequirements writes the rendered requirements', async () => {
  const writes = []

  await generateFgaRequirements({
    specifications,
    outputPath: '/out/fga-requirements.ts',
    fetchImpl: async (url) => ({ ok: true, text: async () => JSON.stringify(specs[url]) }),
    writeFileImpl: async (path, content) => writes.push([path, content]),
  })

  assert.equal(writes.length, 1)
  assert.equal(writes[0][0], '/out/fga-requirements.ts')
  assert.match(writes[0][1], /"GET \/v1\/x": \[\["a_read"\]\],/)
  assert.doesNotMatch(writes[0][1], /\/v2\/x/)
})

test('generateFgaRequirements rejects when a specification response is not OK', async () => {
  await assert.rejects(
    generateFgaRequirements({
      specifications,
      fetchImpl: async () => ({ ok: false, status: 503 }),
      writeFileImpl: async () => assert.fail('should not write'),
    }),
    /Could not fetch api-v1 OpenAPI specification from http:\/\/local\/api\/v1-json: 503/
  )
})

test('generateFgaRequirements rejects when a fetch fails', async () => {
  await assert.rejects(
    generateFgaRequirements({
      specifications,
      fetchImpl: async () => {
        throw new Error('ECONNREFUSED')
      },
      writeFileImpl: async () => assert.fail('should not write'),
    }),
    /Could not fetch api-v1 OpenAPI specification from http:\/\/local\/api\/v1-json/
  )
})
