import { ErrorCode } from '@internal/errors'
import type { FastifyInstance } from 'fastify'
import { vi } from 'vitest'
import { errorSchema } from '../../schemas/error'

const icebergRouteModules = ['./bucket', './catalog', './namespace', './table']
const icebergProbeRouteModule = './bucket'

describe('iceberg routes', () => {
  afterEach(() => {
    vi.doUnmock('../../../config')
    vi.doUnmock('@internal/database')
    vi.doUnmock('../../plugins')
    vi.doUnmock('../../error-handler')
    icebergRouteModules.forEach((modulePath) => vi.doUnmock(modulePath))
    vi.resetModules()
  })

  it.each([
    {
      icebergEnabled: true,
      isMultitenant: true,
      shouldMountRoutes: true,
      shouldRegisterTenantGuard: true,
    },
    {
      icebergEnabled: false,
      isMultitenant: true,
      shouldMountRoutes: true,
      shouldRegisterTenantGuard: true,
    },
    {
      icebergEnabled: true,
      isMultitenant: false,
      shouldMountRoutes: true,
      shouldRegisterTenantGuard: false,
    },
    {
      icebergEnabled: false,
      isMultitenant: false,
      shouldMountRoutes: false,
      shouldRegisterTenantGuard: false,
    },
  ])('mounts routes: $shouldMountRoutes and tenant guard: $shouldRegisterTenantGuard', async ({
    icebergEnabled,
    isMultitenant,
    shouldMountRoutes,
    shouldRegisterTenantGuard,
  }) => {
    const { app, registerJwtAuthMock, requireTenantFeatureMock } = await loadRoutes({
      icebergEnabled,
      isMultitenant,
    })

    try {
      if (shouldMountRoutes) {
        expect(registerJwtAuthMock).toHaveBeenCalled()
      } else {
        expect(registerJwtAuthMock).not.toHaveBeenCalled()
      }

      if (shouldRegisterTenantGuard) {
        expect(requireTenantFeatureMock).toHaveBeenCalledWith('icebergCatalog')
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
  ])('returns $expectedStatusCode from an iceberg route when tenant feature enabled is $hasFeature', async ({
    expectedBody,
    expectedStatusCode,
    hasFeature,
  }) => {
    const tenantHasFeatureMock = vi.fn().mockResolvedValue(hasFeature)
    const { app } = await loadRoutes({
      icebergEnabled: true,
      isMultitenant: true,
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
      expect(tenantHasFeatureMock).toHaveBeenCalledWith('tenant-a', 'icebergCatalog')
    } finally {
      await app.close()
    }
  })
})

async function loadRoutes({
  icebergEnabled,
  isMultitenant,
  tenantHasFeatureMock = vi.fn(),
  useRealTenantFeatureGuard = false,
}: {
  icebergEnabled: boolean
  isMultitenant: boolean
  tenantHasFeatureMock?: ReturnType<typeof vi.fn>
  useRealTenantFeatureGuard?: boolean
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
        icebergEnabled,
        isMultitenant,
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
        db: noopPlugin,
        icebergRestCatalog: noopPlugin,
        registerJwtAuth: registerJwtAuthMock,
        requireTenantFeature,
        storage: noopPlugin,
      }
    }

    return {
      db: noopPlugin,
      icebergRestCatalog: noopPlugin,
      registerJwtAuth: registerJwtAuthMock,
      requireTenantFeature: requireTenantFeatureMock.mockReturnValue(noopPlugin),
      storage: noopPlugin,
    }
  })
  vi.doMock('../../error-handler', () => ({
    setErrorHandler: vi.fn(),
  }))
  icebergRouteModules.forEach((modulePath) => {
    vi.doMock(modulePath, () => ({
      default: modulePath === icebergProbeRouteModule ? probeRoute : noopPlugin,
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
