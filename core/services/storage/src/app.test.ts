import { describe, expect, it } from 'vitest'
import buildApp from './app'
import { stripFiniteKeyword } from './http/finite'

describe('public app', () => {
  it('registers shared Blob response handling', async () => {
    const app = buildApp()

    try {
      await app.ready()

      expect(app.hasPlugin('blob-response')).toBe(true)
    } finally {
      await app.close()
    }
  })

  it('installs finite validation on the production Fastify instance', async () => {
    const app = buildApp()

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/render/image/public/avatars/cat.png?width=1e999',
      })

      expect(response.statusCode).toBe(400)
      expect(response.json().message).toContain('finite')
    } finally {
      await app.close()
    }
  })

  it('public routes resolve correctly', async () => {
    const app = buildApp()

    try {
      const responseVersion = await app.inject({
        method: 'GET',
        url: '/version',
      })

      expect(responseVersion.statusCode).toBe(200)
      expect(responseVersion.body).toBe('0.0.0')

      const responseStatus = await app.inject({
        method: 'GET',
        url: '/status',
      })

      expect(responseStatus.statusCode).toBe(200)
      expect(responseStatus.body).toBe('')

      const responseJwks = await app.inject({
        method: 'GET',
        url: '/.well-known/jwks.json',
      })

      expect(responseJwks.statusCode).toBe(200)
      expect(responseJwks.json()).toEqual({ keys: [] })
    } finally {
      await app.close()
    }
  })

  it('does not expose the internal finite keyword in OpenAPI', async () => {
    const app = buildApp({ exposeDocs: true })

    try {
      await app.ready()

      const spec = app.swagger()
      expect(stripFiniteKeyword(spec)).toEqual(spec)

      const response = await app.inject({
        method: 'GET',
        url: '/render/image/public/avatars/cat.png?width=Infinity',
      })
      expect(response.statusCode).toBe(400)
      expect(response.json().message).toContain('finite')
    } finally {
      await app.close()
    }
  })

  it('documents lifecycle configuration as a dedicated bucket subresource', async () => {
    const app = buildApp({ exposeDocs: true })

    try {
      await app.ready()
      const spec = app.swagger()
      const lifecycleSchema = {
        content: {
          'application/json': {
            schema: {
              properties: {
                rules: { type: 'array' },
              },
            },
          },
        },
      }
      const lifecycleRequestProperty = {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                properties: {
                  lifecycle_configuration: expect.anything(),
                },
              },
            },
          },
        },
      }

      expect(spec.paths?.['/bucket/']?.post).toBeDefined()
      expect(spec.paths?.['/bucket/']?.post).not.toMatchObject(lifecycleRequestProperty)
      expect(spec.paths?.['/bucket/{bucketId}']?.put).toBeDefined()
      expect(spec.paths?.['/bucket/{bucketId}']?.put).not.toMatchObject(lifecycleRequestProperty)
      expect(spec.paths?.['/bucket/{bucketId}/lifecycle']?.put).toMatchObject({
        description:
          'The full configuration replaces any existing policy. Semantic validation failures use the REST InvalidParameter error contract.',
        requestBody: lifecycleSchema,
      })
      expect(spec.paths?.['/bucket/{bucketId}/lifecycle']?.get).toMatchObject({
        responses: { 200: lifecycleSchema },
      })
      expect(spec.paths?.['/bucket/{bucketId}/lifecycle']?.delete).toMatchObject({
        responses: {
          200: {
            content: {
              'application/json': {
                schema: {
                  properties: {
                    message: { type: 'string' },
                  },
                  required: ['message'],
                },
              },
            },
          },
        },
      })
      expect(spec.paths?.['/bucket/{bucketId}/lifecycle']?.delete?.responses).not.toHaveProperty(
        '204'
      )
      expect(spec.paths?.['/bucket/{bucketId}']?.get?.parameters ?? []).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ in: 'query', name: 'include' })])
      )
      expect(spec.paths?.['/bucket/{bucketId}']?.get?.responses?.['200']).not.toMatchObject({
        content: {
          'application/json': {
            schema: { properties: { lifecycle_configuration: expect.anything() } },
          },
        },
      })
    } finally {
      await app.close()
    }
  })
})
