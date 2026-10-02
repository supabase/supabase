import { type Features, tenantHasFeature } from '@internal/database'
import { ErrorCode, type StorageError } from '@internal/errors'
import type { FastifyRequest } from 'fastify'
import fastifyPlugin from 'fastify-plugin'

import { getConfig } from '../../config'

type TenantFeatureOptions = {
  formatter?: (error: StorageError, request: FastifyRequest) => unknown
}

/**
 * Requires a specific feature to be enabled for a given tenant.
 *
 * This only applies for multi-tenant applications.
 * For single-tenant, use environment variables to toggle features
 * @param feature
 */
export const requireTenantFeature = (feature: keyof Features, options?: TenantFeatureOptions) =>
  fastifyPlugin(
    async (fastify) => {
      const { isMultitenant } = getConfig()
      fastify.addHook('onRequest', async (request, reply) => {
        if (!isMultitenant) return

        const hasFeature = await tenantHasFeature(request.tenantId, feature)

        if (!hasFeature) {
          const error: StorageError = {
            error: 'FeatureNotEnabled',
            statusCode: '403',
            message: 'feature not enabled for this tenant',
            code: ErrorCode.FeatureNotEnabled,
          }

          return reply.status(403).send(options?.formatter?.(error, request) ?? error)
        }
      })
    },
    { name: 'tenant-feature-flags' }
  )
