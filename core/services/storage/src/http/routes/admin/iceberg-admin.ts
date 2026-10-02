import { multitenantPgExecutor } from '@internal/database'
import { DeleteIcebergResources } from '@storage/events/iceberg'
import { FastifyInstance } from 'fastify'
import { getConfig } from '../../../config'
import { registerApiKeyAuth } from '../../plugins/apikey'

const { isMultitenant, pgQueueEnable } = getConfig()

interface IcebergCatalogRow {
  id: string
  name: string
  tenant_id: string
  deleted_at: string
}

function getOrphanIcebergCatalogs() {
  return multitenantPgExecutor.query<IcebergCatalogRow>(
    `
      SELECT id, name, tenant_id, deleted_at
      FROM iceberg_catalogs
      WHERE deleted_at IS NOT NULL
        AND deleted_at < NOW() - INTERVAL '24 hours'
      ORDER BY deleted_at ASC
    `
  )
}

export default async function routes(fastify: FastifyInstance) {
  registerApiKeyAuth(fastify)

  fastify.get(
    '/iceberg/orphan-catalogs',
    { schema: { tags: ['iceberg'] } },
    async (_request, reply) => {
      if (!isMultitenant || !pgQueueEnable) {
        return reply
          .status(400)
          .send({ error: 'This endpoint only supports multitenant mode with the queue enabled' })
      }

      const { rows } = await getOrphanIcebergCatalogs()

      return reply.send({
        count: rows.length,
        items: rows,
      })
    }
  )

  fastify.delete(
    '/iceberg/orphan-catalogs',
    { schema: { tags: ['iceberg'] } },
    async (request, reply) => {
      if (!isMultitenant || !pgQueueEnable) {
        return reply
          .status(400)
          .send({ error: 'This endpoint only supports multitenant mode with the queue enabled' })
      }

      const { rows } = await getOrphanIcebergCatalogs()

      if (rows.length === 0) {
        return reply.status(404).send({
          error: 'No orphan catalogs found to cleanup',
        })
      }

      await DeleteIcebergResources.batchSend(
        rows.map(
          (catalog) =>
            new DeleteIcebergResources({
              catalogId: catalog.id,
              tenant: {
                ref: catalog.tenant_id,
                host: '', // Not needed for cleanup
              },
              sbReqId: request.sbReqId,
            })
        )
      )

      return reply.send({
        message: 'Cleanup jobs scheduled',
        count: rows.length,
        items: rows,
      })
    }
  )
}
