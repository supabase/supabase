import type { DBMigration } from '@internal/database/migrations'
import dotenv from 'dotenv'
import { SignJWT } from 'jose'

export type StorageBackendType = 'file' | 's3'
export type VectorBucketProvider = 's3' | 'pgvector'
export type IcebergCatalogAuthType = 'sigv4' | 'token'
export type DatabaseEngine = 'postgres' | 'multigres'
export type StorageS3ChecksumConfig = 'WHEN_SUPPORTED' | 'WHEN_REQUIRED'
const DEFAULT_S3_UPLOAD_PART_SIZE = 16 * 1024 * 1024
const MIN_S3_UPLOAD_PART_SIZE = 5 * 1024 * 1024
export enum MultitenantMigrationStrategy {
  PROGRESSIVE = 'progressive',
  ON_REQUEST = 'on_request',
  FULL_FLEET = 'full_fleet',
}

export interface JwksConfigKeyBase {
  kid?: string
  kty: string
  alg?: string
}

export interface JwksConfigKeyOCT extends JwksConfigKeyBase {
  k: string
  kty: 'oct'
}

export interface JwksConfigKeyRSA extends JwksConfigKeyBase {
  k: string
  kty: 'RSA'
  n: string
  e: string
}

export interface JwksConfigKeyEC extends JwksConfigKeyBase {
  k: string
  kty: 'EC'
  crv: string
  x: string
  y: string
}

export interface JwksConfigKeyOKP extends JwksConfigKeyBase {
  k: string
  kty: 'OKP'
  crv: string
  x: string
}

export type JwksConfigKey = JwksConfigKeyOCT | JwksConfigKeyRSA | JwksConfigKeyEC | JwksConfigKeyOKP

// The key types that are supported for signing urls
export type UrlSigningJwksConfigKey = JwksConfigKeyOCT | JwksConfigKeyEC

// The key type used when generating a new url signing jwk
export const URL_SIGNING_JWK_TYPES = ['HS512', 'ES256'] as const
export type UrlSigningJwkType = (typeof URL_SIGNING_JWK_TYPES)[number]

// jwtAlgorithm must stay HMAC-only: the legacy flat jwtSecret signing/verification path (used when a tenant has no jwks configured)
// treats the secret as raw symmetric key material, which only supports HMAC algorithms
export const JWT_ALGORITHMS = ['HS256', 'HS384', 'HS512'] as const
export type JwtAlgorithm = (typeof JWT_ALGORITHMS)[number]

export interface JwksConfig {
  readonly keys: readonly JwksConfigKey[]
  readonly urlSigningKey?: UrlSigningJwksConfigKey
}

export function freezeJwksConfig(jwks: JwksConfig): JwksConfig {
  Object.freeze(jwks.keys)
  return Object.freeze(jwks)
}

type StorageConfigType = {
  serviceName: string
  isProduction: boolean
  version: string
  numWorkers: number
  exposeDocs: boolean
  keepAliveTimeout: number
  headersTimeout: number
  adminApiKeys: string
  adminRequestIdHeader?: string
  adminReturnTenantSensitiveData: boolean
  encryptionKey: string
  uploadFileSizeLimit: number
  uploadFileSizeLimitStandard?: number
  storageFilePath?: string
  storageFileEtagAlgorithm: 'mtime' | 'md5'
  storageS3InternalTracesEnabled?: boolean
  storageS3MaxSockets: number
  storageS3RequestChecksumCalculation?: StorageS3ChecksumConfig
  storageS3ResponseChecksumValidation?: StorageS3ChecksumConfig
  storageS3UploadPartSize: number
  storageS3UploadQueueSize: number
  storageS3Bucket: string
  storageS3Endpoint?: string
  storageS3PrivateAssetEndpoint?: string
  storageS3ForcePathStyle?: boolean
  storageS3Region: string
  storageS3ClientTimeout: number
  storageLifecycleEnabled: boolean
  isMultitenant: boolean
  jwtSecret: string
  jwtAlgorithm: JwtAlgorithm
  jwtCachingEnabled: boolean
  jwtJWKS?: JwksConfig
  urlSigningJwkType: UrlSigningJwkType
  multitenantDatabaseUrl?: string
  multitenantDatabasePoolUrl?: string
  multitenantMaxConnections: number
  multitenantDatabaseQueryTimeout: number
  dbAnonRole: string
  dbAuthenticatedRole: string
  dbServiceRole: string
  dbInstallRoles: boolean
  dbRefreshMigrationHashesOnMismatch: boolean
  dbSuperUser: string
  dbSearchPath: string
  dbMigrationStrategy: MultitenantMigrationStrategy
  dbMigrationFreezeAt?: keyof typeof DBMigration
  dbPostgresVersion?: string
  databaseURL: string
  databaseSSLRootCert?: string
  databaseEngine: DatabaseEngine
  databasePoolURL?: string
  databaseMaxConnections: number
  databaseFreePoolAfterInactivity: number
  databaseTlsSessionResumption: boolean
  databasePoolDrainTimeout: number
  databaseConnectionTimeout: number
  databaseEnableQueryCancellation: boolean
  databaseHealthcheckUnscoped: boolean
  databaseStatementTimeout: number
  databaseApplicationName: string
  region: string
  requestHardLimitsEnabled: boolean
  requestTraceHeader?: string
  requestEtagHeaders: string[]
  responseSMaxAge: number
  responseStaleWhileRevalidate: number
  responseStaleIfError: number
  anonKeyAsync: Promise<string>
  serviceKeyAsync: Promise<string>
  emptyBucketMax: number
  storageBackendType: StorageBackendType
  tenantId: string
  requestXForwardedHostRegExp?: string
  requestAllowXForwardedPrefix?: boolean
  storagePublicUrl?: string
  logLevel: string
  logflareEnabled?: boolean
  logflareApiKey?: string
  logflareSourceToken?: string
  logflareBatchSize: number
  pgQueueEnable: boolean
  pgQueueEnableWorkers?: boolean
  pgQueueReadWriteTimeout: number
  pgQueueMaxConnections: number
  pgQueueConnectionURL?: string
  pgQueueDeleteAfterHours?: number
  pgQueueDeleteAfterDays?: number
  pgQueueArchiveCompletedAfterSeconds?: number
  pgQueueRetentionDays?: number
  pgQueueConcurrentTasksPerQueue: number
  webhookURL?: string
  webhookApiKey?: string
  webhookQueuePullInterval?: number
  webhookQueueTeamSize?: number
  webhookQueueConcurrency?: number
  webhookMaxConnections: number
  webhookQueueMaxFreeSockets: number
  adminDeleteQueueTeamSize?: number
  adminDeleteConcurrency?: number
  imageTransformationEnabled: boolean
  imgProxyURL?: string
  imgProxyRequestTimeout: number
  imgProxyHttpMaxSockets: number
  imgProxyHttpKeepAlive: number
  imgLimits: {
    size: {
      min: number
      max: number
    }
  }
  postgrestForwardHeaders?: string
  adminPort: number
  port: number
  host: string
  rateLimiterEnabled: boolean
  rateLimiterDriver: 'memory' | 'redis' | string
  rateLimiterRedisUrl?: string
  rateLimiterSkipOnError?: boolean
  rateLimiterRenderPathMaxReqSec: number
  rateLimiterRedisConnectTimeout: number
  rateLimiterRedisCommandTimeout: number
  uploadSignedUrlExpirationTime: number
  tusUrlExpiryMs: number
  tusMaxConcurrentUploads: number
  tusPath: string
  tusPartSize: number
  tusUseFileVersionSeparator: boolean
  tusAllowS3Tags: boolean
  tusLockType: 'postgres' | 's3'
  s3ProtocolEnabled: boolean
  s3ProtocolPrefix: string
  s3ProtocolAllowForwardedHeader: boolean
  s3ProtocolEnforceRegion: boolean
  s3ProtocolAccessKeyId?: string
  s3ProtocolAccessKeySecret?: string
  s3ProtocolNonCanonicalHostHeader?: string
  tracingEnabled?: boolean
  tracingMode?: string
  tracingTimeMinDuration: number
  tracingReturnServerTimings: boolean
  tracingFeatures?: {
    upload: boolean
  }
  prometheusMetricsEnabled: boolean
  profilingAutomaticEnabled: boolean
  profilingS3Bucket?: string
  profilingS3Region: string
  profilingS3Endpoint?: string
  profilingS3ForcePathStyle: boolean
  profilingCaptureSeconds: number
  profilingCpuIntervalMicros: number
  profilingTriggerElu: number
  profilingMaxElu: number
  profilingTriggerDelayP99Ms: number
  profilingSevereDelayP99Ms: number
  profilingCooldownSeconds: number
  profilingMaxCapturesPerHour: number
  tenantPoolCacheMaxEntries: number
  otelMetricsEnabled: boolean
  otlpMetricsEndpoint?: string
  otelMetricsTemporality: 'DELTA' | 'CUMULATIVE'
  otelMetricsExportIntervalMs: number
  cdnPurgeEndpointURL?: string
  cdnPurgeEndpointKey?: string

  icebergEnabled: boolean
  icebergWarehouse: string
  icebergShards: string[]
  icebergCatalogUrl: string
  icebergCatalogAuthType: IcebergCatalogAuthType
  icebergCatalogToken?: string
  icebergMaxNamespaceCount: number
  icebergMaxTableCount: number
  icebergMaxCatalogsCount: number
  icebergBucketDetectionSuffix: string
  icebergBucketDetectionMode: 'BUCKET' | 'FULL_PATH'
  icebergS3DeleteEnabled: boolean

  vectorEnabled: boolean
  vectorBucketProvider: VectorBucketProvider
  vectorS3Buckets: string[]
  vectorBucketRegion?: string
  vectorDatabaseURL?: string
  vectorDatabaseCreate: boolean
  vectorStoreMigrationsEnabled: boolean
  vectorMaxBucketsCount: number
  vectorMaxIndexesCount: number
}

function getOptionalConfigFromEnv(key: string, fallback?: string): string | undefined {
  const envValue = process.env[key]

  if (!envValue && fallback) {
    return getOptionalConfigFromEnv(fallback)
  }

  return envValue
}

function getConfigFromEnv(key: string, fallbackEnv?: string): string {
  const value = getOptionalConfigFromEnv(key)
  if (!value) {
    if (fallbackEnv) {
      return getConfigFromEnv(fallbackEnv)
    }

    throw new Error(`${key} is undefined`)
  }
  return value
}

export function normalizeDatabaseEngine(engine: string | null | undefined): DatabaseEngine {
  if (engine === null || engine === undefined || engine === '') {
    return 'postgres'
  }

  if (engine === 'postgres' || engine === 'multigres') {
    return engine
  }

  throw new Error(`Invalid database engine "${engine}". Expected "postgres" or "multigres".`)
}

function normalizeStorageS3ChecksumConfig(
  value: string | undefined,
  envKey: string
): StorageS3ChecksumConfig | undefined {
  if (!value) {
    return undefined
  }

  const normalizedValue = value.toUpperCase()
  if (normalizedValue === 'WHEN_SUPPORTED' || normalizedValue === 'WHEN_REQUIRED') {
    return normalizedValue
  }

  throw new Error(`Invalid ${envKey} "${value}". Expected "WHEN_SUPPORTED" or "WHEN_REQUIRED".`)
}

export function normalizeEnumValue<T extends string>(
  value: string | undefined,
  allowedValues: readonly T[],
  fallback: T,
  label: string
): T {
  if (!value) {
    return fallback
  }

  if ((allowedValues as readonly string[]).includes(value)) {
    return value as T
  }

  throw new Error(`Invalid ${label} "${value}". Expected one of: ${allowedValues.join(', ')}.`)
}

function getOptionalIfMultitenantConfigFromEnv(key: string, fallback?: string): string | undefined {
  return getOptionalConfigFromEnv('MULTI_TENANT', 'IS_MULTITENANT') === 'true'
    ? getOptionalConfigFromEnv(key, fallback)
    : getConfigFromEnv(key, fallback)
}

let config: StorageConfigType | undefined
let envPaths = ['.env']

export function setEnvPaths(paths: string[]) {
  envPaths = paths
}

export function mergeConfig(newConfig: Partial<StorageConfigType>) {
  if (newConfig.jwtJWKS) {
    freezeJwksConfig(newConfig.jwtJWKS)
  }
  config = { ...config, ...(newConfig as Required<StorageConfigType>) }
}

export function getConfig(options?: { reload?: boolean }): StorageConfigType {
  if (config && !options?.reload) {
    return config
  }

  envPaths.map((envPath) => dotenv.config({ path: envPath, override: false }))

  const isMultitenant = getOptionalConfigFromEnv('MULTI_TENANT', 'IS_MULTITENANT') === 'true'
  config = {
    serviceName: getOptionalConfigFromEnv('SERVICE_NAME') || 'storage_api',
    numWorkers: envNumber(getOptionalConfigFromEnv('WORKERS_NUM'), 1),
    isProduction: process.env.NODE_ENV === 'production',
    exposeDocs: getOptionalConfigFromEnv('EXPOSE_DOCS') !== 'false',
    isMultitenant,
    // Tenant
    tenantId: isMultitenant
      ? ''
      : getOptionalConfigFromEnv('PROJECT_REF') ||
        getOptionalConfigFromEnv('TENANT_ID') ||
        'storage-single-tenant',

    // Server
    region: getOptionalConfigFromEnv('SERVER_REGION', 'REGION') || 'not-specified',
    version: getOptionalConfigFromEnv('VERSION') || '0.0.0',
    keepAliveTimeout: parseInt(getOptionalConfigFromEnv('SERVER_KEEP_ALIVE_TIMEOUT') || '61', 10),
    headersTimeout: parseInt(getOptionalConfigFromEnv('SERVER_HEADERS_TIMEOUT') || '65', 10),
    host: getOptionalConfigFromEnv('SERVER_HOST', 'HOST') || '0.0.0.0',
    port: Number(getOptionalConfigFromEnv('SERVER_PORT', 'PORT')) || 5000,
    adminPort: Number(getOptionalConfigFromEnv('SERVER_ADMIN_PORT', 'ADMIN_PORT')) || 5001,

    // Request
    requestXForwardedHostRegExp: getOptionalConfigFromEnv(
      'REQUEST_X_FORWARDED_HOST_REGEXP',
      'X_FORWARDED_HOST_REGEXP'
    ),
    requestAllowXForwardedPrefix:
      getOptionalConfigFromEnv('REQUEST_ALLOW_X_FORWARDED_PATH') === 'true',
    requestHardLimitsEnabled: getOptionalConfigFromEnv('REQUEST_HARD_LIMITS_ENABLED') === 'true',
    storagePublicUrl: getOptionalConfigFromEnv('STORAGE_PUBLIC_URL'),
    requestTraceHeader: getOptionalConfigFromEnv('REQUEST_TRACE_HEADER', 'REQUEST_ID_HEADER'),
    requestEtagHeaders: getOptionalConfigFromEnv('REQUEST_ETAG_HEADERS')?.trim().split(',') || [
      'if-none-match',
    ],
    responseSMaxAge: parseInt(getOptionalConfigFromEnv('RESPONSE_S_MAXAGE') || '0', 10),
    responseStaleWhileRevalidate: envNonNegativeInteger(
      getOptionalConfigFromEnv('RESPONSE_STALE_WHILE_REVALIDATE'),
      0
    ),
    responseStaleIfError: envNonNegativeInteger(
      getOptionalConfigFromEnv('RESPONSE_STALE_IF_ERROR'),
      0
    ),

    // Admin
    adminApiKeys: getOptionalConfigFromEnv('SERVER_ADMIN_API_KEYS', 'ADMIN_API_KEYS') || '',
    adminRequestIdHeader: getOptionalConfigFromEnv(
      'REQUEST_TRACE_HEADER',
      'REQUEST_ADMIN_TRACE_HEADER'
    ),
    adminReturnTenantSensitiveData:
      getOptionalConfigFromEnv('ADMIN_RETURN_TENANT_SENSITIVE_DATA') !== 'false',

    encryptionKey: getOptionalConfigFromEnv('AUTH_ENCRYPTION_KEY', 'ENCRYPTION_KEY') || '',
    jwtSecret: getOptionalIfMultitenantConfigFromEnv('AUTH_JWT_SECRET', 'PGRST_JWT_SECRET') || '',
    jwtAlgorithm: normalizeEnumValue(
      getOptionalConfigFromEnv('AUTH_JWT_ALGORITHM', 'PGRST_JWT_ALGORITHM'),
      JWT_ALGORITHMS,
      'HS256',
      'jwt algorithm'
    ),
    jwtCachingEnabled: getOptionalConfigFromEnv('JWT_CACHING_ENABLED') === 'true',
    urlSigningJwkType: normalizeEnumValue(
      getOptionalConfigFromEnv('AUTH_URL_SIGNING_JWK_TYPE'),
      URL_SIGNING_JWK_TYPES,
      'HS512',
      'url signing key type'
    ),

    // Upload
    uploadFileSizeLimit: Number(
      getOptionalConfigFromEnv('UPLOAD_FILE_SIZE_LIMIT', 'FILE_SIZE_LIMIT')
    ),
    uploadFileSizeLimitStandard: parseInt(
      getOptionalConfigFromEnv(
        'UPLOAD_FILE_SIZE_LIMIT_STANDARD',
        'FILE_SIZE_LIMIT_STANDARD_UPLOAD'
      ) || '0'
    ),
    uploadSignedUrlExpirationTime: parseInt(
      getOptionalConfigFromEnv(
        'UPLOAD_SIGNED_URL_EXPIRATION_TIME',
        'SIGNED_UPLOAD_URL_EXPIRATION_TIME'
      ) || '60'
    ),

    // Upload - TUS
    tusPath: getOptionalConfigFromEnv('TUS_URL_PATH') || '/upload/resumable',
    tusPartSize: parseInt(getOptionalConfigFromEnv('TUS_PART_SIZE') || '50', 10),
    tusUrlExpiryMs: parseInt(
      getOptionalConfigFromEnv('TUS_URL_EXPIRY_MS') || (1000 * 60 * 60).toString(),
      10
    ),
    tusMaxConcurrentUploads: parseInt(
      getOptionalConfigFromEnv('TUS_MAX_CONCURRENT_UPLOADS') || '500',
      10
    ),
    tusUseFileVersionSeparator:
      getOptionalConfigFromEnv('TUS_USE_FILE_VERSION_SEPARATOR') === 'true',
    tusAllowS3Tags: getOptionalConfigFromEnv('TUS_ALLOW_S3_TAGS') !== 'false',
    tusLockType: getOptionalConfigFromEnv('TUS_LOCK_TYPE') || 'postgres',

    // S3 Protocol
    s3ProtocolEnabled: getOptionalConfigFromEnv('S3_PROTOCOL_ENABLED') !== 'false',
    s3ProtocolPrefix: getOptionalConfigFromEnv('S3_PROTOCOL_PREFIX') || '',
    s3ProtocolAllowForwardedHeader:
      getOptionalConfigFromEnv('S3_ALLOW_FORWARDED_HEADER') === 'true',
    s3ProtocolEnforceRegion: getOptionalConfigFromEnv('S3_PROTOCOL_ENFORCE_REGION') === 'true',
    s3ProtocolAccessKeyId: getOptionalConfigFromEnv('S3_PROTOCOL_ACCESS_KEY_ID'),
    s3ProtocolAccessKeySecret: getOptionalConfigFromEnv('S3_PROTOCOL_ACCESS_KEY_SECRET'),
    s3ProtocolNonCanonicalHostHeader: getOptionalConfigFromEnv(
      'S3_PROTOCOL_NON_CANONICAL_HOST_HEADER'
    ),
    // Storage
    storageBackendType: getOptionalConfigFromEnv('STORAGE_BACKEND') as StorageBackendType,
    emptyBucketMax: parseInt(getOptionalConfigFromEnv('STORAGE_EMPTY_BUCKET_MAX') || '200000', 10),
    storageLifecycleEnabled: getOptionalConfigFromEnv('STORAGE_LIFECYCLE_ENABLED') === 'true',

    // Storage - File
    storageFilePath: getOptionalConfigFromEnv(
      'STORAGE_FILE_BACKEND_PATH',
      'FILE_STORAGE_BACKEND_PATH'
    ),
    storageFileEtagAlgorithm: getOptionalConfigFromEnv('STORAGE_FILE_ETAG_ALGORITHM') || 'md5',

    // Storage - S3
    storageS3MaxSockets: parseInt(
      getOptionalConfigFromEnv('STORAGE_S3_MAX_SOCKETS', 'GLOBAL_S3_MAX_SOCKETS') || '200',
      10
    ),
    storageS3RequestChecksumCalculation: normalizeStorageS3ChecksumConfig(
      getOptionalConfigFromEnv('STORAGE_S3_REQUEST_CHECKSUM_CALCULATION'),
      'STORAGE_S3_REQUEST_CHECKSUM_CALCULATION'
    ),
    storageS3ResponseChecksumValidation: normalizeStorageS3ChecksumConfig(
      getOptionalConfigFromEnv('STORAGE_S3_RESPONSE_CHECKSUM_VALIDATION'),
      'STORAGE_S3_RESPONSE_CHECKSUM_VALIDATION'
    ),
    storageS3UploadPartSize: Math.max(
      envNumber(getOptionalConfigFromEnv('STORAGE_S3_UPLOAD_PART_SIZE')) ??
        DEFAULT_S3_UPLOAD_PART_SIZE,
      MIN_S3_UPLOAD_PART_SIZE
    ),
    storageS3UploadQueueSize:
      envNumber(getOptionalConfigFromEnv('STORAGE_S3_UPLOAD_QUEUE_SIZE')) ?? 2,
    storageS3InternalTracesEnabled:
      getOptionalConfigFromEnv('STORAGE_S3_ENABLED_METRICS') === 'true',
    storageS3Bucket: getOptionalConfigFromEnv('STORAGE_S3_BUCKET', 'GLOBAL_S3_BUCKET'),
    storageS3Endpoint: getOptionalConfigFromEnv('STORAGE_S3_ENDPOINT', 'GLOBAL_S3_ENDPOINT'),
    storageS3PrivateAssetEndpoint: getOptionalConfigFromEnv(
      'STORAGE_S3_PRIVATE_ASSET_ENDPOINT',
      'GLOBAL_S3_PRIVATE_ASSET_ENDPOINT'
    ),
    storageS3ForcePathStyle:
      getOptionalConfigFromEnv('STORAGE_S3_FORCE_PATH_STYLE', 'GLOBAL_S3_FORCE_PATH_STYLE') ===
      'true',
    storageS3Region: getOptionalConfigFromEnv('STORAGE_S3_REGION', 'REGION') as string,
    storageS3ClientTimeout: Number(getOptionalConfigFromEnv('STORAGE_S3_CLIENT_TIMEOUT') || `0`),

    // Watt profiling uses a dedicated bucket/client and ELU-gated capture windows.
    profilingAutomaticEnabled: getOptionalConfigFromEnv('PROFILING_AUTOMATIC_ENABLED') === 'true',
    profilingS3Bucket: getOptionalConfigFromEnv('PROFILING_S3_BUCKET'),
    profilingS3Region:
      getOptionalConfigFromEnv('PROFILING_S3_REGION') ||
      (getOptionalConfigFromEnv('STORAGE_S3_REGION', 'REGION') as string),
    profilingS3Endpoint:
      getOptionalConfigFromEnv('PROFILING_S3_ENDPOINT') ||
      getOptionalConfigFromEnv('STORAGE_S3_ENDPOINT', 'GLOBAL_S3_ENDPOINT'),
    profilingS3ForcePathStyle:
      (getOptionalConfigFromEnv('PROFILING_S3_FORCE_PATH_STYLE') ||
        getOptionalConfigFromEnv('STORAGE_S3_FORCE_PATH_STYLE', 'GLOBAL_S3_FORCE_PATH_STYLE')) ===
      'true',
    profilingCaptureSeconds: envIntegerInRange(
      getOptionalConfigFromEnv('PROFILING_CAPTURE_SECONDS'),
      30,
      1,
      300
    ),
    profilingCpuIntervalMicros: envIntegerInRange(
      getOptionalConfigFromEnv('PROFILING_CPU_INTERVAL_MICROS'),
      33_000,
      1_000,
      1_000_000
    ),
    profilingTriggerElu: envSampleRate(getOptionalConfigFromEnv('PROFILING_TRIGGER_ELU'), 0.55),
    profilingMaxElu: envSampleRate(getOptionalConfigFromEnv('PROFILING_MAX_ELU'), 0.8),
    // Event-loop-delay capture triggers action only when watt health.maxEventLoopDelayP99 is set.
    profilingTriggerDelayP99Ms: envPositiveInteger(
      getOptionalConfigFromEnv('PROFILING_TRIGGER_DELAY_P99_MS'),
      150
    ),
    profilingSevereDelayP99Ms: envPositiveInteger(
      getOptionalConfigFromEnv('PROFILING_SEVERE_DELAY_P99_MS'),
      1_000
    ),
    profilingCooldownSeconds: envNonNegativeInteger(
      getOptionalConfigFromEnv('PROFILING_COOLDOWN_SECONDS'),
      300
    ),
    profilingMaxCapturesPerHour: envNonNegativeInteger(
      getOptionalConfigFromEnv('PROFILING_MAX_CAPTURES_PER_HOUR'),
      6
    ),

    // DB - Migrations
    dbAnonRole: getOptionalConfigFromEnv('DB_ANON_ROLE') || 'anon',
    dbServiceRole: getOptionalConfigFromEnv('DB_SERVICE_ROLE') || 'service_role',
    dbAuthenticatedRole: getOptionalConfigFromEnv('DB_AUTHENTICATED_ROLE') || 'authenticated',
    dbInstallRoles: getOptionalConfigFromEnv('DB_INSTALL_ROLES') === 'true',
    dbRefreshMigrationHashesOnMismatch: !(
      getOptionalConfigFromEnv('DB_ALLOW_MIGRATION_REFRESH') === 'false'
    ),
    dbSuperUser: getOptionalConfigFromEnv('DB_SUPER_USER') || 'postgres',
    dbMigrationStrategy: getOptionalConfigFromEnv('DB_MIGRATIONS_STRATEGY') || 'on_request',
    dbMigrationFreezeAt: getOptionalConfigFromEnv('DB_MIGRATIONS_FREEZE_AT') as
      | keyof typeof DBMigration
      | undefined,

    // Database - Connection
    dbSearchPath: getOptionalConfigFromEnv('DATABASE_SEARCH_PATH', 'DB_SEARCH_PATH') || '',
    dbPostgresVersion: getOptionalConfigFromEnv('DATABASE_POSTGRES_VERSION'),
    multitenantDatabaseUrl: getOptionalConfigFromEnv(
      'DATABASE_MULTITENANT_URL',
      'MULTITENANT_DATABASE_URL'
    ),
    multitenantDatabasePoolUrl: getOptionalConfigFromEnv(
      'DATABASE_MULTITENANT_POOL_URL',
      'MULTITENANT_DATABASE_POOL_URL'
    ),
    multitenantMaxConnections: envNumber(
      getOptionalConfigFromEnv(
        'DATABASE_MULTITENANT_MAX_CONNECTIONS',
        'MULTITENANT_DATABASE_MAX_CONNECTIONS'
      ),
      10
    ),
    multitenantDatabaseQueryTimeout: envNumber(
      getOptionalConfigFromEnv('DATABASE_MULTITENANT_QUERY_TIMEOUT'),
      10_000
    ),
    databaseSSLRootCert: getOptionalConfigFromEnv('DATABASE_SSL_ROOT_CERT'),
    databaseEngine: normalizeDatabaseEngine(getOptionalConfigFromEnv('DATABASE_ENGINE')),
    databaseURL: getOptionalIfMultitenantConfigFromEnv('DATABASE_URL') || '',
    databasePoolURL: getOptionalConfigFromEnv('DATABASE_POOL_URL') || '',
    databaseMaxConnections: parseInt(
      getOptionalConfigFromEnv('DATABASE_MAX_CONNECTIONS') || '20',
      10
    ),
    databaseFreePoolAfterInactivity: parseInt(
      getOptionalConfigFromEnv('DATABASE_FREE_POOL_AFTER_INACTIVITY') || (1000 * 60).toString(),
      10
    ),
    databaseTlsSessionResumption:
      getOptionalConfigFromEnv('DATABASE_TLS_SESSION_RESUMPTION') === 'true',
    databasePoolDrainTimeout: envBoundedPositiveInteger(
      getOptionalConfigFromEnv('DATABASE_POOL_DRAIN_TIMEOUT'),
      30_000,
      MAX_TIMER_DELAY_MS
    ),
    databaseConnectionTimeout: parseInt(
      getOptionalConfigFromEnv('DATABASE_CONNECTION_TIMEOUT') || '3000',
      10
    ),
    databaseEnableQueryCancellation:
      getOptionalConfigFromEnv('DATABASE_ENABLE_QUERY_CANCELLATION') === 'true',
    databaseHealthcheckUnscoped:
      getOptionalConfigFromEnv('DATABASE_HEALTHCHECK_UNSCOPED') === 'true',
    databaseStatementTimeout: parseInt(
      getOptionalConfigFromEnv('DATABASE_STATEMENT_TIMEOUT') || '30000',
      10
    ),
    databaseApplicationName:
      getOptionalConfigFromEnv('DATABASE_APPLICATION_NAME') ||
      `Supabase Storage API ${getOptionalConfigFromEnv('VERSION') || '0.0.0'}`,
    // CDN
    cdnPurgeEndpointURL: getOptionalConfigFromEnv('CDN_PURGE_ENDPOINT_URL'),
    cdnPurgeEndpointKey: getOptionalConfigFromEnv('CDN_PURGE_ENDPOINT_KEY'),

    // Monitoring
    logLevel: getOptionalConfigFromEnv('LOG_LEVEL') || 'info',
    logflareEnabled: getOptionalConfigFromEnv('LOGFLARE_ENABLED') === 'true',
    logflareApiKey: getOptionalConfigFromEnv('LOGFLARE_API_KEY'),
    logflareSourceToken: getOptionalConfigFromEnv('LOGFLARE_SOURCE_TOKEN'),
    logflareBatchSize: parseInt(getOptionalConfigFromEnv('LOGFLARE_BATCH_SIZE') || '200', 10),
    tenantPoolCacheMaxEntries: envBoundedPositiveInteger(
      getOptionalConfigFromEnv('TENANT_POOL_CACHE_MAX_ENTRIES'),
      16_384,
      MAX_TENANT_CACHE_ENTRIES
    ),
    tracingEnabled: getOptionalConfigFromEnv('TRACING_ENABLED') === 'true',
    tracingMode: getOptionalConfigFromEnv('TRACING_MODE') ?? 'basic',
    tracingTimeMinDuration: parseFloat(
      getOptionalConfigFromEnv('TRACING_SERVER_TIME_MIN_DURATION') ?? '100.0'
    ),
    tracingReturnServerTimings:
      getOptionalConfigFromEnv('TRACING_RETURN_SERVER_TIMINGS') === 'true',
    tracingFeatures: {
      upload: getOptionalConfigFromEnv('TRACING_FEATURE_UPLOAD') === 'true',
    },

    // OpenTelemetry Metrics
    prometheusMetricsEnabled: getOptionalConfigFromEnv('PROMETHEUS_METRICS_ENABLED') === 'true',
    otelMetricsEnabled: getOptionalConfigFromEnv('OTEL_METRICS_ENABLED') === 'true',
    otlpMetricsEndpoint: getOptionalConfigFromEnv(
      'OTEL_EXPORTER_OTLP_METRICS_ENDPOINT',
      'OTEL_EXPORTER_OTLP_ENDPOINT'
    ),
    otelMetricsTemporality: getOptionalConfigFromEnv('OTEL_METRICS_TEMPORALITY') || 'CUMULATIVE',
    otelMetricsExportIntervalMs: parseInt(
      getOptionalConfigFromEnv('OTEL_METRICS_EXPORT_INTERVAL_MS') || '60000',
      10
    ),

    // Queue
    pgQueueEnable: getOptionalConfigFromEnv('PG_QUEUE_ENABLE', 'ENABLE_QUEUE_EVENTS') === 'true',
    pgQueueEnableWorkers: getOptionalConfigFromEnv('PG_QUEUE_WORKERS_ENABLE') !== 'false',
    pgQueueReadWriteTimeout:
      envNumber(getOptionalConfigFromEnv('PG_QUEUE_READ_WRITE_TIMEOUT')) ?? 5000,
    pgQueueMaxConnections: Number(getOptionalConfigFromEnv('PG_QUEUE_MAX_CONNECTIONS')) || 4,
    pgQueueConnectionURL: getOptionalConfigFromEnv('PG_QUEUE_CONNECTION_URL'),
    pgQueueDeleteAfterDays: parseInt(
      getOptionalConfigFromEnv('PG_QUEUE_DELETE_AFTER_DAYS') || '2',
      10
    ),
    pgQueueDeleteAfterHours:
      envNumber(getOptionalConfigFromEnv('PG_QUEUE_DELETE_AFTER_HOURS')) || undefined,
    pgQueueArchiveCompletedAfterSeconds: parseInt(
      getOptionalConfigFromEnv('PG_QUEUE_ARCHIVE_COMPLETED_AFTER_SECONDS') || '7200',
      10
    ),
    pgQueueRetentionDays: parseInt(getOptionalConfigFromEnv('PG_QUEUE_RETENTION_DAYS') || '2', 10),
    pgQueueConcurrentTasksPerQueue: parseInt(
      getOptionalConfigFromEnv('PG_QUEUE_CONCURRENT_TASKS_PER_QUEUE') || '50',
      10
    ),

    // Webhooks
    webhookURL: getOptionalConfigFromEnv('WEBHOOK_URL'),
    webhookApiKey: getOptionalConfigFromEnv('WEBHOOK_API_KEY'),
    webhookQueuePullInterval: parseInt(
      getOptionalConfigFromEnv('WEBHOOK_QUEUE_PULL_INTERVAL') || '700'
    ),
    webhookQueueTeamSize: parseInt(getOptionalConfigFromEnv('QUEUE_WEBHOOKS_TEAM_SIZE') || '50'),
    webhookQueueConcurrency: parseInt(getOptionalConfigFromEnv('QUEUE_WEBHOOK_CONCURRENCY') || '5'),
    webhookMaxConnections: parseInt(
      getOptionalConfigFromEnv('QUEUE_WEBHOOK_MAX_CONNECTIONS') || '500'
    ),
    webhookQueueMaxFreeSockets: parseInt(
      getOptionalConfigFromEnv('QUEUE_WEBHOOK_MAX_FREE_SOCKETS') || '20'
    ),
    adminDeleteQueueTeamSize: parseInt(
      getOptionalConfigFromEnv('QUEUE_ADMIN_DELETE_TEAM_SIZE') || '50'
    ),
    adminDeleteConcurrency: parseInt(
      getOptionalConfigFromEnv('QUEUE_ADMIN_DELETE_CONCURRENCY') || '5'
    ),

    // Image Transformation
    imageTransformationEnabled:
      getOptionalConfigFromEnv('IMAGE_TRANSFORMATION_ENABLED', 'ENABLE_IMAGE_TRANSFORMATION') ===
      'true',
    imgProxyRequestTimeout: parseInt(
      getOptionalConfigFromEnv('IMGPROXY_REQUEST_TIMEOUT') || '15',
      10
    ),
    imgProxyHttpMaxSockets: parseInt(
      getOptionalConfigFromEnv('IMGPROXY_HTTP_MAX_SOCKETS') || '5000',
      10
    ),
    imgProxyHttpKeepAlive: parseInt(
      getOptionalConfigFromEnv('IMGPROXY_HTTP_KEEP_ALIVE_TIMEOUT') || '61',
      10
    ),
    imgProxyURL: getOptionalConfigFromEnv('IMGPROXY_URL'),
    imgLimits: {
      size: {
        min: parseInt(
          getOptionalConfigFromEnv('IMAGE_TRANSFORMATION_LIMIT_MIN_SIZE', 'IMG_LIMITS_MIN_SIZE') ||
            '1',
          10
        ),
        max: parseInt(
          getOptionalConfigFromEnv('IMAGE_TRANSFORMATION_LIMIT_MAX_SIZE', 'IMG_LIMITS_MAX_SIZE') ||
            '2000',
          10
        ),
      },
    },

    // Rate Limiting
    rateLimiterEnabled:
      getOptionalConfigFromEnv('RATE_LIMITER_ENABLED', 'ENABLE_RATE_LIMITER') === 'true',
    rateLimiterSkipOnError: getOptionalConfigFromEnv('RATE_LIMITER_SKIP_ON_ERROR') === 'true',
    rateLimiterDriver: getOptionalConfigFromEnv('RATE_LIMITER_DRIVER') || 'memory',
    rateLimiterRedisUrl: getOptionalConfigFromEnv('RATE_LIMITER_REDIS_URL'),
    rateLimiterRenderPathMaxReqSec: parseInt(
      getOptionalConfigFromEnv('RATE_LIMITER_RENDER_PATH_MAX_REQ_SEC') || '5',
      10
    ),
    rateLimiterRedisConnectTimeout: parseInt(
      getOptionalConfigFromEnv('RATE_LIMITER_REDIS_CONNECT_TIMEOUT') || '2',
      10
    ),
    rateLimiterRedisCommandTimeout: parseInt(
      getOptionalConfigFromEnv('RATE_LIMITER_REDIS_COMMAND_TIMEOUT') || '2',
      10
    ),

    icebergEnabled: getOptionalConfigFromEnv('ICEBERG_ENABLED') === 'true',
    icebergWarehouse: getOptionalConfigFromEnv('ICEBERG_WAREHOUSE') || '',
    icebergShards: getOptionalConfigFromEnv('ICEBERG_SHARDS')?.trim().split(',') || [],
    icebergCatalogUrl:
      getOptionalConfigFromEnv('ICEBERG_CATALOG_URL') ||
      `https://s3tables.ap-southeast-1.amazonaws.com/iceberg/v1`,

    icebergBucketDetectionSuffix:
      getOptionalConfigFromEnv('ICEBERG_BUCKET_DETECTION_SUFFIX') || `--table-s3`,
    icebergBucketDetectionMode:
      getOptionalConfigFromEnv('ICEBERG_BUCKET_DETECTION_MODE') || `BUCKET`,
    icebergCatalogAuthType: getOptionalConfigFromEnv('ICEBERG_CATALOG_AUTH_TYPE') || `sigv4`,
    icebergCatalogToken: getOptionalConfigFromEnv('ICEBERG_CATALOG_AUTH_TOKEN'),
    icebergMaxCatalogsCount: parseInt(getOptionalConfigFromEnv('ICEBERG_MAX_CATALOGS') || '2', 10),
    icebergMaxNamespaceCount: parseInt(
      getOptionalConfigFromEnv('ICEBERG_MAX_NAMESPACES') || '25',
      10
    ),
    icebergMaxTableCount: parseInt(getOptionalConfigFromEnv('ICEBERG_MAX_TABLES') || '10', 10),
    icebergS3DeleteEnabled: getOptionalConfigFromEnv('ICEBERG_S3_DELETE_ENABLED') === 'true',

    vectorEnabled: getOptionalConfigFromEnv('VECTOR_ENABLED') === 'true',
    vectorBucketProvider: (getOptionalConfigFromEnv('VECTOR_BUCKET_PROVIDER') ||
      's3') as VectorBucketProvider,
    vectorS3Buckets:
      getOptionalConfigFromEnv('VECTOR_S3_BUCKETS')
        ?.split(',')
        .map((s) => s.trim())
        .filter(Boolean) || [],
    vectorBucketRegion: getOptionalConfigFromEnv('VECTOR_BUCKET_REGION') || undefined,
    vectorDatabaseURL: getOptionalConfigFromEnv('VECTOR_DATABASE_URL') || undefined,
    vectorDatabaseCreate: getOptionalConfigFromEnv('VECTOR_DATABASE_CREATE') !== 'false',
    vectorStoreMigrationsEnabled:
      getOptionalConfigFromEnv('VECTOR_STORE_MIGRATIONS_ENABLED') === 'true',
    vectorMaxBucketsCount: parseInt(getOptionalConfigFromEnv('VECTOR_MAX_BUCKETS') || '10', 10),
    vectorMaxIndexesCount: parseInt(getOptionalConfigFromEnv('VECTOR_MAX_INDEXES') || '20', 10),
  } as StorageConfigType

  if (
    config.profilingS3Bucket &&
    config.storageS3Bucket &&
    config.profilingS3Bucket === config.storageS3Bucket
  ) {
    throw new Error('PROFILING_S3_BUCKET must be different from the normal storage data bucket')
  }

  if (config.profilingMaxElu <= config.profilingTriggerElu) {
    throw new Error('PROFILING_MAX_ELU must be greater than PROFILING_TRIGGER_ELU')
  }

  if (config.profilingSevereDelayP99Ms <= config.profilingTriggerDelayP99Ms) {
    throw new Error(
      'PROFILING_SEVERE_DELAY_P99_MS must be greater than PROFILING_TRIGGER_DELAY_P99_MS'
    )
  }

  const serviceKey = getOptionalConfigFromEnv('SERVICE_KEY') || ''
  if (!config.isMultitenant && !serviceKey) {
    config.serviceKeyAsync = new SignJWT({ role: config.dbServiceRole })
      .setIssuedAt()
      .setExpirationTime('10y')
      .setProtectedHeader({ alg: 'HS256' })
      .sign(new TextEncoder().encode(config.jwtSecret))
  } else {
    config.serviceKeyAsync = Promise.resolve(serviceKey)
  }

  const anonKey = getOptionalConfigFromEnv('ANON_KEY') || ''
  if (!config.isMultitenant && !anonKey) {
    config.anonKeyAsync = new SignJWT({ role: config.dbAnonRole })
      .setIssuedAt()
      .setExpirationTime('10y')
      .setProtectedHeader({ alg: 'HS256' })
      .sign(new TextEncoder().encode(config.jwtSecret))
  } else {
    config.anonKeyAsync = Promise.resolve(anonKey)
  }

  const jwtJWKS = getOptionalConfigFromEnv('JWT_JWKS') || null

  if (jwtJWKS) {
    try {
      config.jwtJWKS = freezeJwksConfig(JSON.parse(jwtJWKS))
    } catch {
      throw new Error('Unable to parse JWT_JWKS value to JSON')
    }
  }

  return config
}

function envNumber(value: string | undefined, defaultValue?: number): number | undefined {
  if (!value) {
    return defaultValue
  }
  const parsed = parseInt(value, 10)
  if (isNaN(parsed)) {
    return defaultValue
  }
  return parsed
}

function envPositiveInteger(value: string | undefined, defaultValue: number): number {
  const parsed = envNumber(value, defaultValue)

  return parsed && parsed > 0 ? parsed : defaultValue
}

const MAX_TIMER_DELAY_MS = 2 ** 31 - 1
const MAX_TENANT_CACHE_ENTRIES = 65_536

function envBoundedPositiveInteger(
  value: string | undefined,
  defaultValue: number,
  maximum: number
): number {
  if (!value || !/^[1-9]\d*$/.test(value)) {
    return defaultValue
  }

  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= maximum ? parsed : defaultValue
}

function envNonNegativeInteger(value: string | undefined, defaultValue: number): number {
  const parsed = envNumber(value, defaultValue)

  return parsed !== undefined && parsed >= 0 ? parsed : defaultValue
}

function envIntegerInRange(
  value: string | undefined,
  defaultValue: number,
  minimum: number,
  maximum: number
): number {
  if (!value) return defaultValue
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : defaultValue
}

function envSampleRate(value: string | undefined, defaultValue: number): number {
  if (!value) {
    return defaultValue
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return defaultValue
  }

  return Math.min(Math.max(parsed, 0), 1)
}
