import { ErrorCode } from '@internal/errors'
import type { FastifyInstance } from 'fastify'
import { vi } from 'vitest'
import { errorSchema } from '../../schemas/error'

const vectorCommandModules = [
  './create-bucket',
  './create-index',
  './delete-bucket',
  './delete-index',
  './delete-vectors',
  './get-bucket',
  './get-index',
  './get-vectors',
  './list-buckets',
  './list-indexes',
  './list-vectors',
  './put-vectors',
  './query-vectors',
]
const vectorProbeRouteModule = './create-bucket'

describe('vector routes', () => {
  afterEach(() => {
    vi.doUnmock('../../../config')
    vi.doUnmock('@internal/database')
    vi.doUnmock('../../plugins')
    vi.doUnmock('../../error-handler')
    vectorCommandModules.forEach((modulePath) => vi.doUnmock(modulePath))
    vi.resetModules()
  })

  it.each([
    {
      isMultitenant: true,
      shouldMountRoutes: true,
      shouldRegisterTenantGuard: true,
      vectorEnabled: true,
    },
    {
      isMultitenant: true,
      shouldMountRoutes: true,
      shouldRegisterTenantGuard: true,
      vectorEnabled: false,
    },
    {
      isMultitenant: false,
      shouldMountRoutes: true,
      shouldRegisterTenantGuard: false,
      vectorEnabled: true,
    },
    {
      isMultitenant: false,
      shouldMountRoutes: false,
      shouldRegisterTenantGuard: false,
      vectorEnabled: false,
    },
  ])('mounts routes: $shouldMountRoutes and tenant guard: $shouldRegisterTenantGuard', async ({
    isMultitenant,
    shouldMountRoutes,
    vectorEnabled,
    shouldRegisterTenantGuard,
  }) => {
    const { app, registerJwtAuthMock, requireTenantFeatureMock } = await loadRoutes({
      isMultitenant,
      vectorEnabled,
    })

    try {
      if (shouldMountRoutes) {
        expect(registerJwtAuthMock).toHaveBeenCalled()
      } else {
        expect(registerJwtAuthMock).not.toHaveBeenCalled()
      }

      if (shouldRegisterTenantGuard) {
        expect(requireTenantFeatureMock).toHaveBeenCalledWith('vectorBuckets')
      } else {
        expect(requireTenantFeatureMock).not.toHaveBeenCalled()
      }
    } finally {
      await app.close()
    }
  })

  it.each([
    {
      expectedBody: {
        error: 'FeatureNotEnabled',
        statusCode: '403',
        message: 'feature not enabled for this tenant',
        code: ErrorCode.FeatureNotEnabled,
      },
      expectedStatusCode: 403,
      hasFeature: false,
    },
    {
      expectedBody: { ok: true },
      expectedStatusCode: 200,
      hasFeature: true,
    },
  ])('returns $expectedStatusCode from a vector route when tenant feature enabled is $hasFeature', async ({
    expectedBody,
    expectedStatusCode,
    hasFeature,
  }) => {
    const tenantHasFeatureMock = vi.fn().mockResolvedValue(hasFeature)
    const { app } = await loadRoutes({
      isMultitenant: true,
      vectorEnabled: true,
      useRealTenantFeatureGuard: true,
      tenantHasFeatureMock,
    })

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/probe',
      })

      expect(response.statusCode).toBe(expectedStatusCode)
      expect(response.json()).toEqual(expectedBody)
      expect(tenantHasFeatureMock).toHaveBeenCalledWith('tenant-a', 'vectorBuckets')
    } finally {
      await app.close()
    }
  })
})

async function loadRoutes({
  isMultitenant,
  tenantHasFeatureMock = vi.fn(),
  useRealTenantFeatureGuard = false,
  vectorEnabled,
}: {
  isMultitenant: boolean
  tenantHasFeatureMock?: ReturnType<typeof vi.fn>
  useRealTenantFeatureGuard?: boolean
  vectorEnabled: boolean
}) {
  const registerJwtAuthMock = vi.fn()
  const requireTenantFeatureMock = vi.fn()
  const noopPlugin = async () => {}

  vi.doMock('../../../config', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../../config')>()

    return {
      ...actual,
      getConfig: (options?: Parameters<typeof actual.getConfig>[0]) => ({
        ...actual.getConfig(options),
        dbServiceRole: 'service_role',
        isMultitenant,
        vectorEnabled,
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
    if (useRealTenantFeatureGuard) {
      const { requireTenantFeature } = await import('../../plugins/tenant-feature')

      return {
        dbSuperUser: noopPlugin,
        enforceJwtRole: noopPlugin,
        registerJwtAuth: registerJwtAuthMock,
        requireTenantFeature,
        s3vector: noopPlugin,
        signatureV4: noopPlugin,
      }
    }

    return {
      dbSuperUser: noopPlugin,
      enforceJwtRole: noopPlugin,
      registerJwtAuth: registerJwtAuthMock,
      requireTenantFeature: requireTenantFeatureMock.mockReturnValue(noopPlugin),
      s3vector: noopPlugin,
      signatureV4: noopPlugin,
    }
  })
  vi.doMock('../../error-handler', () => ({
    setErrorHandler: vi.fn(),
  }))
  vectorCommandModules.forEach((modulePath) => {
    vi.doMock(modulePath, () => ({
      default: modulePath === vectorProbeRouteModule ? probeRoute : noopPlugin,
    }))
  })

  const { default: fastify } = await import('fastify')
  const { default: routes } = await import('./index')
  const app = fastify()
  app.addSchema(errorSchema)
  app.addHook('onRequest', (request, _reply, done) => {
    request.tenantId = 'tenant-a'
    done()
  })
  await app.register(routes)
  await app.ready()

  return { app, registerJwtAuthMock, requireTenantFeatureMock }
}

async function probeRoute(fastify: FastifyInstance) {
  fastify.get(
    '/probe',
    {
      schema: {
        response: {
          '4xx': { $ref: 'errorSchema#' },
        },
      },
    },
    async () => ({ ok: true })
  )
}
