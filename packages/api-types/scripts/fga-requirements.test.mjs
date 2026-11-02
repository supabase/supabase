import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildFgaRequirements,
  getKnownFgaPermissions,
  renderFgaRequirements,
} from './fga-requirements.mjs'

const known = new Set(['a_read', 'a_write', 'b_read'])

const platformSpec = {
  components: {
    schemas: {
      CreateScopedAccessTokenBody: {
        properties: { permissions: { items: { enum: ['a_read', 'a_write', 'b_read'] } } },
      },
    },
  },
}

test('getKnownFgaPermissions reads the permission enum from whichever spec has it', () => {
  const permissions = getKnownFgaPermissions([
    { name: 'api-v1', spec: { paths: {} } },
    { name: 'platform', spec: platformSpec },
  ])

  assert.deepEqual(permissions, known)
})

test('getKnownFgaPermissions throws when no spec has the permission enum', () => {
  assert.throws(
    () => getKnownFgaPermissions([{ name: 'api-v1', spec: { paths: {} } }]),
    /Could not find the list of FGA permissions/
  )
})

test('buildFgaRequirements preserves OR-of-AND groups and ignores non-method keys', () => {
  const requirements = buildFgaRequirements(
    [
      {
        name: 'api-v1',
        spec: {
          paths: {
            '/v1/z/{ref}': {
              parameters: [{ 'x-fga-permissions': [['a_read']] }],
              summary: 'ignored',
              get: { 'x-fga-permissions': [['b_read', 'a_read'], ['a_write']] },
              post: {},
            },
            '/v1/a': { delete: { 'x-fga-permissions': [['a_write']] } },
          },
        },
      },
    ],
    known
  )

  assert.deepEqual(requirements, {
    'DELETE /v1/a': [['a_write']],
    'GET /v1/z/{ref}': [['b_read', 'a_read'], ['a_write']],
  })
  assert.deepEqual(Object.keys(requirements), ['DELETE /v1/a', 'GET /v1/z/{ref}'])
})

test('buildFgaRequirements sorts keys across specifications', () => {
  const requirements = buildFgaRequirements(
    [
      {
        name: 'platform',
        spec: { paths: { '/platform/x': { get: { 'x-fga-permissions': [['a_read']] } } } },
      },
      {
        name: 'api-v1',
        spec: { paths: { '/v1/x': { get: { 'x-fga-permissions': [['a_read']] } } } },
      },
    ],
    known
  )

  assert.deepEqual(Object.keys(requirements), ['GET /platform/x', 'GET /v1/x'])
})

test('buildFgaRequirements rejects malformed requirements', () => {
  for (const value of [[[]], 'a_read', ['a_read'], [[1]], [['a_read'], []]]) {
    assert.throws(
      () =>
        buildFgaRequirements(
          [
            {
              name: 'api-v1',
              spec: { paths: { '/v1/x': { get: { 'x-fga-permissions': value } } } },
            },
          ],
          known
        ),
      /Invalid x-fga-permissions for GET \/v1\/x in the api-v1 specification/
    )
  }
})

test('buildFgaRequirements omits endpoints with an empty annotation', () => {
  const requirements = buildFgaRequirements(
    [
      {
        name: 'api-v1',
        spec: {
          paths: {
            '/v1/open': { get: { 'x-fga-permissions': [] } },
            '/v1/gated': { get: { 'x-fga-permissions': [['a_read']] } },
          },
        },
      },
    ],
    known
  )

  assert.deepEqual(requirements, { 'GET /v1/gated': [['a_read']] })
})

test('buildFgaRequirements rejects unknown permissions', () => {
  assert.throws(
    () =>
      buildFgaRequirements(
        [
          {
            name: 'api-v2',
            spec: { paths: { '/v2/x': { put: { 'x-fga-permissions': [['nope']] } } } },
          },
        ],
        known
      ),
    /Unknown FGA permission "nope".*PUT \/v2\/x in the api-v2 specification/
  )
})

test('buildFgaRequirements rejects an endpoint that appears in two specifications', () => {
  const spec = { paths: { '/v1/x': { get: { 'x-fga-permissions': [['a_read']] } } } }

  assert.throws(
    () =>
      buildFgaRequirements(
        [
          { name: 'api-v1', spec },
          { name: 'platform', spec },
        ],
        known
      ),
    /Duplicate endpoint GET \/v1\/x.*api-v1 and platform/
  )
})

test('renderFgaRequirements emits a const TypeScript module', () => {
  const source = renderFgaRequirements({ 'GET /v1/x': [['a_read'], ['a_write', 'b_read']] })

  assert.match(source, /Do not edit by hand/)
  assert.match(
    source,
    /export const fgaRequirements = \{\n {2}"GET \/v1\/x": \[\["a_read"\],\["a_write","b_read"\]\],\n\} as const/
  )
  assert.match(source, /export type FgaRequirements = typeof fgaRequirements/)
  assert.match(source, /export type FgaGuardedEndpoint = keyof FgaRequirements/)
})
