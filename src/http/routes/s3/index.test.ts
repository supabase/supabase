import { ErrorCode } from '@internal/errors'
import fastifyPlugin from 'fastify-plugin'
import { vi } from 'vitest'

describe('S3 tenant feature gating', () => {
  afterEach(() => {
    vi.doUnmock('../../../config')
    vi.doUnmock('@internal/database')
    vi.doUnmock('../../plugins')
    vi.resetModules()
  })

  it('returns an S3 XML 403 before downstream hooks when the tenant feature is disabled', async () => {
    const { app, downstreamHookMock, tenantHasFeatureMock } = await buildApp(false)

    try {
      const response = await app.inject({
        method: 'PUT',
        url: '/s3/videos/sbio-test.txt',
        headers: {
          'content-type': 'text/plain',
        },
        payload: 'test',
      })

      expect(response.statusCode).toBe(403)
      expect(response.headers['content-type']).toContain('application/xml')
      expect(response.payload).toBe(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<Error xmlns="http://s3.amazonaws.com/doc/2006-03-01/">' +
          '<Resource>videos/sbio-test.txt</Resource>' +
          `<Code>${ErrorCode.FeatureNotEnabled}</Code>` +
          '<Message>feature not enabled for this tenant</Message>' +
          '</Error>'
      )
      expect(tenantHasFeatureMock).toHaveBeenCalledWith('tenant-a', 's3Protocol')
      expect(downstreamHookMock).not.toHaveBeenCalled()
    } finally {
      await app.close()
    }
  })

  it('continues to downstream S3 hooks when the tenant feature is enabled', async () => {
    const { app, downstreamHookMock, tenantHasFeatureMock } = await buildApp(true)

    try {
      const response = await app.inject({
        method: 'PUT',
        url: '/s3/videos/sbio-test.txt',
        headers: {
          'content-type': 'text/plain',
        },
        payload: 'test',
      })

      expect(response.statusCode).toBe(204)
      expect(tenantHasFeatureMock).toHaveBeenCalledWith('tenant-a', 's3Protocol')
      expect(downstreamHookMock).toHaveBeenCalledOnce()
    } finally {
      await app.close()
    }
  })
})

async function buildApp(hasFeature: boolean) {
  const tenantHasFeatureMock = vi.fn().mockResolvedValue(hasFeature)
  const downstreamHookMock = vi.fn()
  const noopPlugin = async () => {}
  const downstreamPlugin = fastifyPlugin(async (fastify) => {
    fastify.addHook('onRequest', async (_request, reply) => {
      downstreamHookMock()
      return reply.status(204).send()
    })
  })

  vi.doMock('../../../config', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../../config')>()

    return {
      ...actual,
      getConfig: (options?: Parameters<typeof actual.getConfig>[0]) => ({
        ...actual.getConfig(options),
        isMultitenant: true,
        s3ProtocolEnabled: true,
      }),
    }
  })
  vi.doMock('@internal/database', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@internal/database')>()

    return {
      ...actual,
      tenantHasFeature: tenantHasFeatureMock,
    }
  })
  vi.doMock('../../plugins', async () => {
    const [{ requireTenantFeature }, { xmlParser }] = await Promise.all([
      import('../../plugins/tenant-feature'),
      import('../../plugins/xml'),
    ])

    return {
      db: noopPlugin,
      detectS3IcebergBucket: noopPlugin,
      icebergRestCatalog: noopPlugin,
      requireTenantFeature,
      signatureV4: downstreamPlugin,
      storage: noopPlugin,
      xmlParser,
    }
  })

  const { default: fastify } = await import('fastify')
  const { default: routes } = await import('./index')
  const app = fastify()

  app.addHook('onRequest', (request, _reply, done) => {
    request.tenantId = 'tenant-a'
    done()
  })
  await app.register(routes, { prefix: '/s3' })
  await app.ready()

  return { app, downstreamHookMock, tenantHasFeatureMock }
}
