export const JWT_CACHE_NAME = 'jwt' as const
export const JWT_SIGNING_KEY_CACHE_NAME = 'jwt_signing_key' as const
export const JWT_VERIFICATION_KEY_CACHE_NAME = 'jwt_verification_key' as const
export const PGVECTOR_METRIC_CACHE_NAME = 'pgvector_metric' as const
export const TENANT_CONFIG_CACHE_NAME = 'tenant_config' as const
export const TENANT_JWKS_CACHE_NAME = 'tenant_jwks' as const
export const TENANT_POOL_CACHE_NAME = 'tenant_pool' as const
export const TENANT_S3_CREDENTIALS_CACHE_NAME = 'tenant_s3_credentials' as const

export type CacheName =
  | typeof JWT_CACHE_NAME
  | typeof JWT_SIGNING_KEY_CACHE_NAME
  | typeof JWT_VERIFICATION_KEY_CACHE_NAME
  | typeof PGVECTOR_METRIC_CACHE_NAME
  | typeof TENANT_CONFIG_CACHE_NAME
  | typeof TENANT_JWKS_CACHE_NAME
  | typeof TENANT_POOL_CACHE_NAME
  | typeof TENANT_S3_CREDENTIALS_CACHE_NAME
