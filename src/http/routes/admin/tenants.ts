import { decrypt, encrypt } from '@internal/auth'
import {
  deleteTenantConfig,
  getTenantCapabilities,
  getTenantConfig,
  jwksManager,
  MIGRATION_ADMIN_JOB_LIMIT,
  MigrationAdminStorePg,
  multitenantPgExecutor,
  onTenantConfigChange,
  TenantConfigStorePg,
  TenantMigrationStatus,
} from '@internal/database'
import {
  isDBMigrationName,
  lastLocalMigrationName,
  progressiveMigrations,
  resetMigration,
  runMigrationsOnTenant,
  updateTenantMigrationsState,
} from '@internal/database/migrations'
import { StorageBackendError } from '@internal/errors'
import { logger, logSchema } from '@internal/monitoring'
import { PG_BOSS_SCHEMA } from '@internal/queue'
import { RunMigrationsOnTenants } from '@storage/events'
import { FastifyInstance, RequestGenericInterface } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { getConfig, JwksConfigKey, UrlSigningJwkType } from '../../../config'
import { dbSuperUser, storage } from '../../plugins'
import { registerApiKeyAuth } from '../../plugins/apikey'
import { registerJsonParserAllowingEmptyBody } from '../../plugins/empty-json-body'

const patchSchema = {
  body: {
    type: 'object',
    properties: {
      anonKey: { type: 'string' },
      databaseUrl: { type: 'string' },
      databasePoolUrl: { type: 'string', nullable: true },
      maxConnections: { type: 'number', finite: true },
      jwks: { type: 'object', nullable: true },
      fileSizeLimit: { type: 'number', finite: true },
      deleteObjectsLimit: { type: 'integer', finite: true, minimum: 1, nullable: true },
      jwtSecret: { type: 'string' },
      serviceKey: { type: 'string' },
      tracingMode: { type: 'string' },
      disableEvents: { type: 'array', items: { type: 'string' }, nullable: true },
      subscriptionTier: { type: 'string' },
      features: {
        type: 'object',
        properties: {
          imageTransformation: {
            type: 'object',
            properties: {
              enabled: { type: 'boolean' },
              maxResolution: { type: 'number', finite: true, nullable: true },
            },
          },
          purgeCache: {
            type: 'object',
            properties: {
              enabled: { type: 'boolean' },
            },
          },
          s3Protocol: {
            type: 'object',
            properties: {
              enabled: { type: 'boolean' },
            },
          },
          icebergCatalog: {
            type: 'object',
            properties: {
              enabled: { type: 'boolean' },
              maxNamespaces: { type: 'number', finite: true },
              maxTables: { type: 'number', finite: true },
              maxCatalogs: { type: 'number', finite: true },
            },
          },
          vectorBuckets: {
            type: 'object',
            properties: {
              enabled: { type: 'boolean' },
              maxBuckets: { type: 'number', finite: true },
              maxIndexes: { type: 'number', finite: true },
            },
          },
        },
      },
    },
  },
  optional: ['tracingMode', 'maxResolution'],
} as const

const schema = {
  body: {
    ...patchSchema.body,
    required: ['anonKey', 'databaseUrl', 'jwtSecret', 'serviceKey'],
  },
} as const

interface tenantPatchRequestInterface extends RequestGenericInterface {
  Body: FromSchema<typeof patchSchema.body>
  Params: {
    tenantId: string
  }
}

interface tenantRequestInterface extends RequestGenericInterface {
  Body: FromSchema<typeof schema.body>
  Params: {
    tenantId: string
  }
}

interface tenantDBInterface {
  id: string
  anon_key: string
  database_url: string
  database_pool_url?: string | null
  max_connections?: number
  jwt_secret: string
  jwks: { keys?: JwksConfigKey[] } | null
  service_key: string
  file_size_limit?: number
  delete_objects_limit?: number | null
  feature_s3_protocol?: boolean
  feature_purge_cache?: boolean
  feature_image_transformation?: boolean
  feature_iceberg_catalog?: boolean
  feature_iceberg_catalog_max_namespaces?: number | null
  feature_iceberg_catalog_max_tables?: number | null
  feature_iceberg_catalog_max_catalogs?: number | null
  image_transformation_max_resolution?: number | null
  feature_vector_buckets?: boolean
  feature_vector_buckets_max_buckets?: number
  feature_vector_buckets_max_indexes?: number
  disable_events?: string[] | null
  subscription_tier?: string | null
}

const { dbMigrationFreezeAt, adminReturnTenantSensitiveData, urlSigningJwkType } = getConfig()
const migrationQueueName = RunMigrationsOnTenants.getQueueName()
const tenantConfigStorePg = new TenantConfigStorePg(multitenantPgExecutor)
const migrationAdminStorePg = new MigrationAdminStorePg(multitenantPgExecutor, PG_BOSS_SCHEMA)
type TenantRow = tenantDBInterface & {
  migrations_status?: string | null
  migrations_version?: string | null
  tracing_mode?: string
}
type TenantRowPatch = Partial<tenantDBInterface> & {
  migrations_status?: string | null
  migrations_version?: string | null
  tracing_mode?: string
}
type TransactionAwareJwksManager = {
  generateUrlSigningJwk(
    tenantId: string,
    type: UrlSigningJwkType,
    trx?: unknown
  ): Promise<{ kid: string }>
}

async function markTenantMigrationsCompleted(tenantId: string) {
  await updateTenantMigrationsState(tenantId, {
    migration: dbMigrationFreezeAt,
    state: TenantMigrationStatus.COMPLETED,
  })
}

async function insertTenantAndGenerateJwk(tenantId: string, tenantInfo: TenantRow) {
  const trx = await multitenantPgExecutor.beginTransaction()
  try {
    await tenantConfigStorePg.insert(tenantInfo, trx)
    await generateUrlSigningJwkWithTransaction(tenantId, trx)
    await trx.commit()
  } catch (e) {
    await rollbackTenantTransactionSafely(trx, tenantId, e, 'insert tenant')
    throw e
  }
}

async function upsertTenantAndGenerateJwk(tenantId: string, tenantInfo: TenantRow) {
  const trx = await multitenantPgExecutor.beginTransaction()
  try {
    await tenantConfigStorePg.upsert(tenantInfo, trx)
    await generateUrlSigningJwkWithTransaction(tenantId, trx)
    await trx.commit()
  } catch (e) {
    await rollbackTenantTransactionSafely(trx, tenantId, e, 'upsert tenant')
    throw e
  }
}

function generateUrlSigningJwkWithTransaction(tenantId: string, trx: unknown) {
  return (jwksManager as TransactionAwareJwksManager).generateUrlSigningJwk(
    tenantId,
    urlSigningJwkType,
    trx
  )
}

async function rollbackTenantTransactionSafely(
  trx: Awaited<ReturnType<typeof multitenantPgExecutor.beginTransaction>>,
  tenantId: string,
  originalError: unknown,
  reason: string
) {
  try {
    await trx.rollback()
  } catch (rollbackError) {
    logSchema.warning(logger, '[AdminTenants] Failed to rollback transaction', {
      type: 'db',
      tenantId,
      project: tenantId,
      error: rollbackError,
      metadata: JSON.stringify({
        reason,
        originalError: String(originalError),
      }),
    })
  }
}

function listTenantRows() {
  return tenantConfigStorePg.list()
}

function getTenantRow(tenantId: string) {
  return tenantConfigStorePg.findById(tenantId)
}

function updateTenantRow(tenantId: string, tenantInfo: TenantRowPatch) {
  return tenantConfigStorePg.update(tenantId, tenantInfo)
}

function deleteTenantRow(tenantId: string) {
  return tenantConfigStorePg.delete(tenantId)
}

function getTenantMigrationsInfo(tenantId: string) {
  return tenantConfigStorePg.findMigrationsInfo(tenantId)
}

function getTenantDatabaseUrl(tenantId: string) {
  return tenantConfigStorePg.findDatabaseUrl(tenantId)
}

function listTenantMigrationJobs(tenantId: string) {
  return migrationAdminStorePg.listTenantJobs(
    tenantId,
    migrationQueueName,
    MIGRATION_ADMIN_JOB_LIMIT
  )
}

function deleteTenantMigrationJobs(tenantId: string) {
  return migrationAdminStorePg.deleteTenantJobs(
    tenantId,
    migrationQueueName,
    MIGRATION_ADMIN_JOB_LIMIT
  )
}

export default async function routes(fastify: FastifyInstance) {
  registerApiKeyAuth(fastify)

  fastify.get('/', { schema: { tags: ['tenant'] } }, async () => {
    const tenants = await listTenantRows()
    return tenants.map(
      ({
        id,
        anon_key,
        database_url,
        database_pool_url,
        max_connections,
        file_size_limit,
        delete_objects_limit,
        jwt_secret,
        jwks,
        service_key,
        feature_purge_cache,
        feature_image_transformation,
        feature_s3_protocol,
        feature_iceberg_catalog,
        feature_iceberg_catalog_max_catalogs,
        feature_iceberg_catalog_max_namespaces,
        feature_iceberg_catalog_max_tables,
        feature_vector_buckets,
        feature_vector_buckets_max_buckets,
        feature_vector_buckets_max_indexes,
        image_transformation_max_resolution,
        migrations_version,
        migrations_status,
        tracing_mode,
        disable_events,
        subscription_tier,
      }) => ({
        id,
        ...(adminReturnTenantSensitiveData
          ? {
              anonKey: decrypt(anon_key),
              databaseUrl: decrypt(database_url),
              databasePoolUrl: database_pool_url ? decrypt(database_pool_url) : undefined,
              jwtSecret: decrypt(jwt_secret),
              jwks: jwks || null,
              serviceKey: decrypt(service_key),
            }
          : {}),
        maxConnections: max_connections ? Number(max_connections) : undefined,
        fileSizeLimit: Number(file_size_limit),
        deleteObjectsLimit:
          delete_objects_limit === null ||
          delete_objects_limit === undefined ||
          delete_objects_limit <= 0
            ? undefined
            : Number(delete_objects_limit),
        migrationVersion: migrations_version,
        migrationStatus: migrations_status,
        tracingMode: tracing_mode,
        features: {
          imageTransformation: {
            enabled: feature_image_transformation,
            maxResolution: image_transformation_max_resolution,
          },
          purgeCache: {
            enabled: feature_purge_cache,
          },
          s3Protocol: {
            enabled: feature_s3_protocol,
          },
          icebergCatalog: {
            enabled: feature_iceberg_catalog,
            maxNamespaces: feature_iceberg_catalog_max_namespaces,
            maxTables: feature_iceberg_catalog_max_tables,
            maxCatalogs: feature_iceberg_catalog_max_catalogs,
          },
          vectorBuckets: {
            enabled: feature_vector_buckets,
            maxBuckets: feature_vector_buckets_max_buckets,
            maxIndexes: feature_vector_buckets_max_indexes,
          },
        },
        disableEvents: disable_events,
        subscriptionTier: subscription_tier ?? undefined,
      })
    )
  })

  fastify.get<tenantRequestInterface>(
    '/:tenantId',
    { schema: { tags: ['tenant'] } },
    async (request, reply) => {
      const tenant = await getTenantRow(request.params.tenantId)
      if (!tenant) {
        return reply.code(404).send()
      }
      const {
        anon_key,
        database_url,
        database_pool_url,
        max_connections,
        file_size_limit,
        delete_objects_limit,
        jwt_secret,
        jwks,
        service_key,
        feature_purge_cache,
        feature_s3_protocol,
        feature_image_transformation,
        feature_iceberg_catalog,
        feature_iceberg_catalog_max_catalogs,
        feature_iceberg_catalog_max_namespaces,
        feature_iceberg_catalog_max_tables,
        feature_vector_buckets,
        feature_vector_buckets_max_buckets,
        feature_vector_buckets_max_indexes,
        image_transformation_max_resolution,
        migrations_version,
        migrations_status,
        tracing_mode,
        disable_events,
        subscription_tier,
      } = tenant

      const capabilities = await getTenantCapabilities(request.params.tenantId)

      return {
        ...(adminReturnTenantSensitiveData
          ? {
              anonKey: decrypt(anon_key),
              databaseUrl: decrypt(database_url),
              databasePoolUrl:
                database_pool_url === null
                  ? null
                  : database_pool_url
                    ? decrypt(database_pool_url)
                    : undefined,
              jwtSecret: decrypt(jwt_secret),
              jwks,
              serviceKey: decrypt(service_key),
            }
          : {}),
        maxConnections: max_connections ? Number(max_connections) : undefined,
        fileSizeLimit: Number(file_size_limit),
        deleteObjectsLimit:
          delete_objects_limit === null ||
          delete_objects_limit === undefined ||
          delete_objects_limit <= 0
            ? undefined
            : Number(delete_objects_limit),
        capabilities,
        features: {
          imageTransformation: {
            enabled: feature_image_transformation,
            maxResolution: image_transformation_max_resolution,
          },
          purgeCache: {
            enabled: feature_purge_cache,
          },
          s3Protocol: {
            enabled: feature_s3_protocol,
          },
          icebergCatalog: {
            enabled: feature_iceberg_catalog,
            maxNamespaces: feature_iceberg_catalog_max_namespaces,
            maxTables: feature_iceberg_catalog_max_tables,
            maxCatalogs: feature_iceberg_catalog_max_catalogs,
          },
          vectorBuckets: {
            enabled: feature_vector_buckets,
            maxBuckets: feature_vector_buckets_max_buckets,
            maxIndexes: feature_vector_buckets_max_indexes,
          },
        },
        migrationVersion: migrations_version,
        migrationStatus: migrations_status,
        tracingMode: tracing_mode,
        disableEvents: disable_events,
        subscriptionTier: subscription_tier ?? undefined,
      }
    }
  )

  fastify.post<tenantRequestInterface>(
    '/:tenantId',
    { schema: { ...schema, tags: ['tenant'] } },
    async (request, reply) => {
      const { tenantId } = request.params
      const {
        anonKey,
        databaseUrl,
        fileSizeLimit,
        deleteObjectsLimit,
        jwtSecret,
        jwks,
        serviceKey,
        features,
        databasePoolUrl,
        maxConnections,
        tracingMode,
        disableEvents,
        subscriptionTier,
      } = request.body

      await insertTenantAndGenerateJwk(tenantId, {
        id: tenantId,
        anon_key: encrypt(anonKey),
        database_url: encrypt(databaseUrl),
        database_pool_url: databasePoolUrl ? encrypt(databasePoolUrl) : undefined,
        max_connections: maxConnections ? Number(maxConnections) : undefined,
        file_size_limit: fileSizeLimit,
        delete_objects_limit: deleteObjectsLimit,
        jwt_secret: encrypt(jwtSecret),
        jwks: jwks || null,
        service_key: encrypt(serviceKey),
        feature_image_transformation: features?.imageTransformation?.enabled ?? false,
        feature_purge_cache: features?.purgeCache?.enabled ?? false,
        feature_s3_protocol: features?.s3Protocol?.enabled ?? true,
        feature_iceberg_catalog: features?.icebergCatalog?.enabled ?? false,
        feature_iceberg_catalog_max_catalogs: features?.icebergCatalog?.maxCatalogs,
        feature_iceberg_catalog_max_namespaces: features?.icebergCatalog?.maxNamespaces,
        feature_iceberg_catalog_max_tables: features?.icebergCatalog?.maxTables,
        feature_vector_buckets: features?.vectorBuckets?.enabled ?? false,
        feature_vector_buckets_max_buckets: features?.vectorBuckets?.maxBuckets,
        feature_vector_buckets_max_indexes: features?.vectorBuckets?.maxIndexes,
        image_transformation_max_resolution:
          features?.imageTransformation?.maxResolution === null
            ? null
            : features?.imageTransformation?.maxResolution,
        migrations_version: null,
        migrations_status: null,
        tracing_mode: tracingMode,
        disable_events: disableEvents,
        subscription_tier: subscriptionTier,
      })

      try {
        await runMigrationsOnTenant({
          databaseUrl,
          tenantId,
          upToMigration: dbMigrationFreezeAt,
        })
        await markTenantMigrationsCompleted(tenantId)
      } catch {
        progressiveMigrations.addTenant(tenantId)
      }

      void onTenantConfigChange(tenantId)
      reply.code(201).send()
    }
  )

  fastify.patch<tenantPatchRequestInterface>(
    '/:tenantId',
    { schema: { ...patchSchema, tags: ['tenant'] } },
    async (request, reply) => {
      const {
        anonKey,
        databaseUrl,
        fileSizeLimit,
        deleteObjectsLimit,
        jwtSecret,
        jwks,
        serviceKey,
        features,
        databasePoolUrl,
        maxConnections,
        tracingMode,
        disableEvents,
        subscriptionTier,
      } = request.body
      const { tenantId } = request.params

      await updateTenantRow(tenantId, {
        anon_key: anonKey !== undefined ? encrypt(anonKey) : undefined,
        database_url: databaseUrl !== undefined ? encrypt(databaseUrl) : undefined,
        database_pool_url: databasePoolUrl
          ? encrypt(databasePoolUrl)
          : databasePoolUrl === null
            ? null
            : undefined,
        max_connections: maxConnections ? Number(maxConnections) : undefined,
        file_size_limit: fileSizeLimit,
        delete_objects_limit: deleteObjectsLimit,
        jwt_secret: jwtSecret !== undefined ? encrypt(jwtSecret) : undefined,
        jwks,
        service_key: serviceKey !== undefined ? encrypt(serviceKey) : undefined,
        feature_image_transformation: features?.imageTransformation?.enabled,
        feature_purge_cache: features?.purgeCache?.enabled,
        feature_s3_protocol: features?.s3Protocol?.enabled,
        feature_iceberg_catalog: features?.icebergCatalog?.enabled,
        feature_iceberg_catalog_max_catalogs: features?.icebergCatalog?.maxCatalogs,
        feature_iceberg_catalog_max_namespaces: features?.icebergCatalog?.maxNamespaces,
        feature_iceberg_catalog_max_tables: features?.icebergCatalog?.maxTables,
        feature_vector_buckets: features?.vectorBuckets?.enabled,
        feature_vector_buckets_max_buckets: features?.vectorBuckets?.maxBuckets,
        feature_vector_buckets_max_indexes: features?.vectorBuckets?.maxIndexes,
        image_transformation_max_resolution:
          features?.imageTransformation?.maxResolution === null
            ? null
            : features?.imageTransformation?.maxResolution,
        tracing_mode: tracingMode,
        disable_events: disableEvents,
        subscription_tier: subscriptionTier,
      })

      let migrationFailed = false
      try {
        if (databaseUrl) {
          await runMigrationsOnTenant({
            databaseUrl,
            tenantId,
            upToMigration: dbMigrationFreezeAt,
          })
          await markTenantMigrationsCompleted(tenantId)
        }
      } catch (e) {
        migrationFailed = true
        if (e instanceof Error) {
          request.executionError = e
        }
        await updateTenantMigrationsState(tenantId, { state: TenantMigrationStatus.FAILED })
      } finally {
        onTenantConfigChange(tenantId)
      }

      if (migrationFailed) {
        progressiveMigrations.addTenant(tenantId)
      }

      reply.code(204).send()
    }
  )

  fastify.put<tenantRequestInterface>(
    '/:tenantId',
    { schema: { ...schema, tags: ['tenant'] } },
    async (request, reply) => {
      const {
        anonKey,
        databaseUrl,
        fileSizeLimit,
        deleteObjectsLimit,
        jwtSecret,
        jwks,
        serviceKey,
        features,
        databasePoolUrl,
        maxConnections,
        tracingMode,
        disableEvents,
        subscriptionTier,
      } = request.body
      const { tenantId } = request.params

      const tenantInfo: tenantDBInterface & {
        tracing_mode?: string
      } = {
        id: tenantId,
        anon_key: encrypt(anonKey),
        database_url: encrypt(databaseUrl),
        jwt_secret: encrypt(jwtSecret),
        jwks: jwks || null,
        service_key: encrypt(serviceKey),
      }

      if (fileSizeLimit) {
        tenantInfo.file_size_limit = fileSizeLimit
      }

      if (typeof deleteObjectsLimit !== 'undefined') {
        tenantInfo.delete_objects_limit = deleteObjectsLimit
      }

      if (typeof features?.imageTransformation?.enabled !== 'undefined') {
        tenantInfo.feature_image_transformation = features?.imageTransformation?.enabled
      }

      if (typeof features?.purgeCache?.enabled !== 'undefined') {
        tenantInfo.feature_purge_cache = features?.purgeCache?.enabled
      }

      if (typeof features?.imageTransformation?.maxResolution !== 'undefined') {
        tenantInfo.image_transformation_max_resolution = features?.imageTransformation
          ?.maxResolution as number | undefined
      }

      if (typeof features?.s3Protocol?.enabled !== 'undefined') {
        tenantInfo.feature_s3_protocol = features?.s3Protocol?.enabled
      }

      if (databasePoolUrl !== undefined) {
        tenantInfo.database_pool_url = databasePoolUrl === null ? null : encrypt(databasePoolUrl)
      }

      if (maxConnections) {
        tenantInfo.max_connections = Number(maxConnections)
      }

      if (tracingMode) {
        tenantInfo.tracing_mode = tracingMode
      }

      if (subscriptionTier) {
        tenantInfo.subscription_tier = subscriptionTier
      }

      tenantInfo.feature_iceberg_catalog = features?.icebergCatalog?.enabled
      tenantInfo.feature_iceberg_catalog_max_namespaces = features?.icebergCatalog?.maxNamespaces
      tenantInfo.feature_iceberg_catalog_max_tables = features?.icebergCatalog?.maxTables
      tenantInfo.feature_iceberg_catalog_max_catalogs = features?.icebergCatalog?.maxCatalogs

      tenantInfo.feature_vector_buckets = features?.vectorBuckets?.enabled
      tenantInfo.feature_vector_buckets_max_buckets = features?.vectorBuckets?.maxBuckets
      tenantInfo.feature_vector_buckets_max_indexes = features?.vectorBuckets?.maxIndexes

      if (disableEvents !== undefined) {
        tenantInfo.disable_events = disableEvents
      }

      await upsertTenantAndGenerateJwk(tenantId, tenantInfo)

      let migrationFailed = false
      try {
        await runMigrationsOnTenant({
          databaseUrl,
          tenantId,
          upToMigration: dbMigrationFreezeAt,
        })
        await markTenantMigrationsCompleted(tenantId)
      } catch (e) {
        migrationFailed = true
        request.executionError = e as Error
        await updateTenantMigrationsState(tenantId, { state: TenantMigrationStatus.FAILED })
      } finally {
        onTenantConfigChange(tenantId)
      }

      if (migrationFailed) {
        progressiveMigrations.addTenant(tenantId)
      }

      reply.code(204).send()
    }
  )

  fastify.register(async (f) => {
    registerJsonParserAllowingEmptyBody(f)

    f.delete<tenantRequestInterface>(
      '/:tenantId',
      { schema: { tags: ['tenant'] } },
      async (request, reply) => {
        await deleteTenantRow(request.params.tenantId)
        deleteTenantConfig(request.params.tenantId)
        reply.code(204).send()
      }
    )
  })

  fastify.get<tenantRequestInterface>(
    '/:tenantId/migrations',
    { schema: { tags: ['tenant'] } },
    async (req, reply) => {
      const migrationsInfo = await getTenantMigrationsInfo(req.params.tenantId)

      if (!migrationsInfo) {
        reply.status(404).send({
          error: 'Tenant not found',
        })
        return
      }

      const latestMigration = dbMigrationFreezeAt || (await lastLocalMigrationName())

      reply.send({
        isLatest: latestMigration === migrationsInfo?.migrations_version,
        migrationsVersion: migrationsInfo?.migrations_version,
        migrationsStatus: migrationsInfo?.migrations_status,
      })
    }
  )

  fastify.post<tenantRequestInterface>(
    '/:tenantId/migrations',
    { schema: { tags: ['tenant'] } },
    async (req, reply) => {
      const tenantId = req.params.tenantId
      const migrationsInfo = await getTenantDatabaseUrl(req.params.tenantId)

      if (!migrationsInfo) {
        reply.status(404).send({
          error: 'Tenant not found',
        })
        return
      }

      const databaseUrl = decrypt(migrationsInfo.database_url)

      try {
        await runMigrationsOnTenant({
          databaseUrl,
          tenantId,
          upToMigration: dbMigrationFreezeAt,
        })
        await markTenantMigrationsCompleted(tenantId)
        return reply.send({
          migrated: true,
        })
      } catch (e) {
        req.executionError = e as Error

        if (e instanceof StorageBackendError) {
          return reply.status(e.httpStatusCode || 400).send({
            migrated: false,
            metadata: e.metadata,
            ...e.render(),
          })
        }

        return reply.status(400).send({
          migrated: false,
          error: JSON.stringify(e),
        })
      }
    }
  )

  fastify.post<tenantRequestInterface>(
    '/:tenantId/migrations/reset',
    { schema: { tags: ['tenant'] } },
    async (req, reply) => {
      const { untilMigration, markCompletedTillMigration } = req.body as Record<string, unknown>

      const { databaseUrl } = await getTenantConfig(req.params.tenantId)

      if (!isDBMigrationName(untilMigration)) {
        return reply.status(400).send({ message: 'Invalid migration' })
      }

      if (
        typeof markCompletedTillMigration === 'string' &&
        !isDBMigrationName(markCompletedTillMigration)
      ) {
        return reply.status(400).send({ message: 'Invalid migration' })
      }

      try {
        await resetMigration({
          tenantId: req.params.tenantId,
          databaseUrl,
          untilMigration,
          markCompletedTillMigration: isDBMigrationName(markCompletedTillMigration)
            ? markCompletedTillMigration
            : undefined,
        })

        return reply.send({ message: 'Migrations reset' })
      } catch (e) {
        req.executionError = e as Error
        return reply.status(400).send({ message: 'Failed to reset migration' })
      }
    }
  )

  fastify.get<tenantRequestInterface>(
    '/:tenantId/migrations/jobs',
    { schema: { tags: ['tenant'] } },
    async (req, reply) => {
      const data = await listTenantMigrationJobs(req.params.tenantId)

      reply.send(data)
    }
  )

  fastify.delete<tenantRequestInterface>(
    '/:tenantId/migrations/jobs',
    { schema: { tags: ['tenant'] } },
    async (req, reply) => {
      const data = await deleteTenantMigrationJobs(req.params.tenantId)

      reply.send(data)
    }
  )

  fastify.register(async (fastify) => {
    fastify.register(dbSuperUser, {
      disableHostCheck: true,
    })
    fastify.register(storage)

    fastify.get<tenantRequestInterface>(
      '/:tenantId/health',
      { schema: { tags: ['tenant'] } },
      async (req, res) => {
        try {
          await req.storage.healthcheck()
          return res.send({ healthy: true })
        } catch (e) {
          if (e instanceof Error) {
            req.executionError = e
          }
          return res.send({ healthy: false })
        }
      }
    )
  })
}
