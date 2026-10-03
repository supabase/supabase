const acceptanceProfiles = ['smoke', 'core', 'full', 'wire'] as const
const vectorBucketProviders = ['s3', 'pgvector'] as const

export type AcceptanceProfile = (typeof acceptanceProfiles)[number]
export type AcceptanceVectorBucketProvider = (typeof vectorBucketProviders)[number]

export type AcceptanceCapability =
  | 'admin'
  | 'cdn'
  | 'cdnEdge'
  | 'iceberg'
  | 'render'
  | 'rlsSetup'
  | 'tus'
  | 'vector'
  | 'wire'

export interface AcceptanceConfig {
  adminApiKey?: string
  adminUrl?: string
  adminReturnSensitiveData: boolean
  adminDatabaseUrlOverride?: string
  allowDestructive: boolean
  anonKey?: string
  authenticatedKey?: string
  baseUrl: string
  capabilities: Record<AcceptanceCapability, boolean>
  forcePathStyle: boolean
  forwardedHost?: string
  profile: AcceptanceProfile
  region: string
  resourcePrefix: string
  rlsBucket?: string
  rlsReadObject?: string
  rlsWritePrefix?: string
  runId: string
  s3AccessKeyId?: string
  s3Endpoint: string
  s3SecretAccessKey?: string
  serviceKey?: string
  supportsPathEdges: boolean
  storageBackend?: string
  target: 'local' | 'remote'
  tenantId?: string
  tlsRejectUnauthorized: boolean
  tusEndpoint: string
  vectorBucketProvider: AcceptanceVectorBucketProvider
}

export interface AcceptanceSelection {
  destructive?: boolean
  profiles: AcceptanceProfile[]
  requires?: AcceptanceCapability[]
}

let cachedConfig: AcceptanceConfig | undefined

export function getAcceptanceConfig(): AcceptanceConfig {
  if (!cachedConfig) {
    cachedConfig = buildAcceptanceConfig()
  }

  return cachedConfig
}

export function resetAcceptanceConfigForTests() {
  cachedConfig = undefined
}

export function shouldRunAcceptance(selection: AcceptanceSelection): boolean {
  const config = getAcceptanceConfig()

  if (!profileIncludes(config.profile, selection.profiles)) {
    return false
  }

  if (selection.destructive && config.target === 'remote' && !config.allowDestructive) {
    return false
  }

  return (selection.requires ?? []).every((capability) => config.capabilities[capability])
}

export function describeAcceptance(
  name: string,
  selection: AcceptanceSelection,
  factory: () => void,
  timeout?: number
) {
  const runner = shouldRunAcceptance(selection) ? describe : describe.skip
  runner(name, factory, timeout)
}

export function requireConfigValue(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required acceptance configuration: ${name}`)
  }

  return value
}

export function joinUrl(baseUrl: string, route: string): string {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  const normalizedRoute = route.replace(/^\/+/, '')
  return new URL(normalizedRoute, normalizedBase).toString()
}

export function encodePathSegments(value: string): string {
  return value
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

function buildAcceptanceConfig(): AcceptanceConfig {
  const profile = normalizeProfile(readOption('profile') ?? envOption('ACCEPTANCE_PROFILE'))
  const target = normalizeTarget(readOption('target') ?? envOption('ACCEPTANCE_TARGET'))
  const explicitBaseUrl = readOption('base-url') ?? envOption('ACCEPTANCE_BASE_URL')
  const defaultBaseUrl = target === 'local' ? 'http://127.0.0.1:5000' : undefined
  if (!explicitBaseUrl && !defaultBaseUrl) {
    throw new Error('ACCEPTANCE_BASE_URL is required for non-local acceptance targets')
  }

  const baseUrl = trimTrailingSlash(explicitBaseUrl ?? defaultBaseUrl ?? '')
  const s3Endpoint = trimTrailingSlash(
    readOption('s3-endpoint') ?? envOption('ACCEPTANCE_S3_ENDPOINT') ?? joinUrl(baseUrl, '/s3')
  )
  const tusEndpoint = trimTrailingSlash(
    readOption('tus-endpoint') ??
      envOption('ACCEPTANCE_TUS_ENDPOINT') ??
      joinUrl(baseUrl, '/upload/resumable')
  )
  const adminUrl = optionalTrim(readOption('admin-url') ?? envOption('ACCEPTANCE_ADMIN_URL'))
  const adminCapabilityOption = boolOptionValue(
    'enable-admin',
    envOption('ACCEPTANCE_ENABLE_ADMIN')
  )
  const adminReturnSensitiveData = boolOptionDefaultTrue(
    'enable-admin-sensitive-data',
    envOption('ACCEPTANCE_ADMIN_RETURN_TENANT_SENSITIVE_DATA')
  )
  const runId = sanitizeRunId(
    readOption('run-id') ??
      envOption('ACCEPTANCE_RUN_ID') ??
      new Date()
        .toISOString()
        .replace(/[-:.TZ]/g, '')
        .slice(0, 14)
  )
  const resourcePrefix = sanitizeResourcePrefix(
    readOption('resource-prefix') ?? envOption('ACCEPTANCE_RESOURCE_PREFIX') ?? `acc-${runId}`
  )
  const adminApiKey = readOption('admin-api-key') ?? envOption('ACCEPTANCE_ADMIN_API_KEY')
  const hasAdminConfig = Boolean(adminUrl && adminApiKey)
  const adminCapabilityEnabled =
    adminCapabilityOption !== false && (adminCapabilityOption === true || hasAdminConfig)
  const storageBackend = optionalLower(envOption('STORAGE_BACKEND'))
  const vectorBucketProvider = normalizeVectorBucketProvider(envOption('VECTOR_BUCKET_PROVIDER'))
  const cdnEnabled = boolOption('enable-cdn', process.env.ACCEPTANCE_ENABLE_CDN)

  const config: AcceptanceConfig = {
    adminApiKey,
    adminUrl,
    adminReturnSensitiveData,
    adminDatabaseUrlOverride: envOption('ACCEPTANCE_ADMIN_DATABASE_URL_OVERRIDE'),
    allowDestructive: boolOption('allow-destructive', envOption('ACCEPTANCE_ALLOW_DESTRUCTIVE')),
    anonKey: envOption('ACCEPTANCE_ANON_KEY'),
    authenticatedKey: envOption('ACCEPTANCE_AUTHENTICATED_KEY'),
    baseUrl,
    capabilities: {
      admin: adminCapabilityEnabled && hasAdminConfig,
      cdn: cdnEnabled,
      cdnEdge: cdnEnabled && target === 'remote',
      iceberg: boolOption('enable-iceberg', process.env.ACCEPTANCE_ENABLE_ICEBERG),
      render: boolOption('enable-render', process.env.ACCEPTANCE_ENABLE_RENDER),
      rlsSetup: boolOption('enable-rls-setup', process.env.ACCEPTANCE_ENABLE_RLS_SETUP),
      tus: boolOptionDefaultTrue('enable-tus', envOption('ACCEPTANCE_ENABLE_TUS')),
      vector: boolOption('enable-vector', process.env.ACCEPTANCE_ENABLE_VECTOR),
      wire:
        boolOption('enable-wire', process.env.ACCEPTANCE_ENABLE_WIRE) ||
        profile === 'wire' ||
        profile === 'full',
    },
    forcePathStyle: boolOptionDefaultTrue(
      's3-force-path-style',
      envOption('ACCEPTANCE_S3_FORCE_PATH_STYLE')
    ),
    forwardedHost: optionalTrim(
      readOption('x-forwarded-host') ?? envOption('ACCEPTANCE_X_FORWARDED_HOST')
    ),
    profile,
    region: readOption('region') ?? envOption('ACCEPTANCE_REGION') ?? 'us-east-1',
    resourcePrefix,
    rlsBucket: envOption('ACCEPTANCE_RLS_BUCKET') ?? (target === 'local' ? 'bucket2' : undefined),
    rlsReadObject: envOption('ACCEPTANCE_RLS_READ_OBJECT'),
    rlsWritePrefix:
      envOption('ACCEPTANCE_RLS_WRITE_PREFIX') ??
      (target === 'local' ? 'authenticated' : undefined),
    runId,
    s3AccessKeyId: envOption('ACCEPTANCE_S3_ACCESS_KEY_ID'),
    s3Endpoint,
    s3SecretAccessKey: envOption('ACCEPTANCE_S3_SECRET_ACCESS_KEY'),
    serviceKey: envOption('ACCEPTANCE_SERVICE_KEY'),
    storageBackend,
    supportsPathEdges:
      target === 'local' && storageBackend !== undefined && storageBackend !== 's3',
    target,
    tenantId: envOption('ACCEPTANCE_TENANT_ID'),
    tlsRejectUnauthorized: boolOptionDefaultTrue(
      'tls-reject-unauthorized',
      envOption('ACCEPTANCE_TLS_REJECT_UNAUTHORIZED')
    ),
    tusEndpoint,
    vectorBucketProvider,
  }

  if (config.target === 'remote' && config.allowDestructive && !config.resourcePrefix) {
    throw new Error('Remote destructive acceptance runs require ACCEPTANCE_RESOURCE_PREFIX')
  }

  return config
}

function profileIncludes(current: AcceptanceProfile, requested: AcceptanceProfile[]) {
  if (current === 'full') {
    return true
  }

  if (current === 'core') {
    return requested.includes('smoke') || requested.includes('core')
  }

  if (current === 'wire') {
    return requested.includes('smoke') || requested.includes('wire')
  }

  return requested.includes('smoke')
}

function normalizeProfile(value: string | undefined): AcceptanceProfile {
  if (isAcceptanceProfile(value)) {
    return value
  }

  return 'smoke'
}

function isAcceptanceProfile(value: string | undefined): value is AcceptanceProfile {
  return acceptanceProfiles.includes(value as AcceptanceProfile)
}

function normalizeTarget(value: string | undefined): AcceptanceConfig['target'] {
  return value === 'remote' ? 'remote' : 'local'
}

function normalizeVectorBucketProvider(value: string | undefined): AcceptanceVectorBucketProvider {
  const normalized = optionalLower(value) ?? 's3'
  if (vectorBucketProviders.includes(normalized as AcceptanceVectorBucketProvider)) {
    return normalized as AcceptanceVectorBucketProvider
  }

  throw new Error(`Unsupported VECTOR_BUCKET_PROVIDER: ${value}`)
}

function boolOption(cliName: string, envValue: string | undefined): boolean {
  return boolOptionValue(cliName, envValue) === true
}

function boolOptionDefaultTrue(cliName: string, envValue: string | undefined): boolean {
  const value = boolOptionValue(cliName, envValue)

  return value === undefined ? true : value
}

function boolOptionValue(cliName: string, envValue: string | undefined): boolean | undefined {
  const cliValue = readOption(cliName)
  const value = cliValue ?? envValue

  if (value === undefined) {
    return undefined
  }

  return value === '1' || value === 'true' || value === 'yes'
}

function envOption(name: string): string | undefined {
  const value = process.env[name]
  if (value === undefined || value === '') {
    return undefined
  }

  return value
}

function readOption(name: string): string | undefined {
  const flag = `--${name}`
  const argv = process.argv
  const equalsPrefix = `${flag}=`

  for (let index = 0; index < argv.length; index++) {
    const item = argv[index]
    if (item === flag) {
      return argv[index + 1]
    }
    if (item.startsWith(equalsPrefix)) {
      return item.slice(equalsPrefix.length)
    }
  }

  return undefined
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

function optionalTrim(value: string | undefined): string | undefined {
  if (!value) {
    return undefined
  }

  return trimTrailingSlash(value)
}

function optionalLower(value: string | undefined): string | undefined {
  return value?.toLowerCase()
}

function sanitizeRunId(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 24) || 'run'
  )
}

function sanitizeResourcePrefix(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32) || 'resource'
  )
}
