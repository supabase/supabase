import crypto from 'node:crypto'
import { decrypt, encrypt } from '@internal/auth'
import {
  CACHE_LOOKUP_WITHOUT_METRICS,
  type CacheLookupOptions,
  createLruCache,
  DEFAULT_CACHE_PURGE_STALE_INTERVAL_MS,
  DEFAULT_CACHE_TTL_JITTER_RATIO,
  TENANT_S3_CREDENTIALS_CACHE_NAME,
} from '@internal/cache'
import { createInvalidatableSingleFlightByKey } from '@internal/concurrency'
import { ERRORS } from '@internal/errors'
import { isStringMessage, PubSubAdapter } from '@internal/pubsub'
import { getConfig } from '../../../../config'
import { S3Credentials, S3CredentialsManagerStore, S3CredentialsRaw } from './store'

const TENANTS_S3_CREDENTIALS_UPDATE_CHANNEL = 'tenants_s3_credentials_update'
// S3 credential entries are heavier and have a lower expected working-set
// cardinality than JWT payloads, so keep a tighter entry-count guardrail.
// Max 16,384 items. At ~0.5KB per credential, this uses roughly ~8MB of heap memory worst-case.
export const TENANT_S3_CREDENTIALS_CACHE_MAX_ITEMS = 16384
export const TENANT_S3_CREDENTIALS_CACHE_TTL_MS = 1000 * 60 * 60 // 1h

const tenantS3CredentialsCache = createLruCache<string, S3Credentials>(
  TENANT_S3_CREDENTIALS_CACHE_NAME,
  {
    max: TENANT_S3_CREDENTIALS_CACHE_MAX_ITEMS,
    ttl: TENANT_S3_CREDENTIALS_CACHE_TTL_MS,
    ttlJitterRatio: DEFAULT_CACHE_TTL_JITTER_RATIO,
    allowStale: false,
    purgeStaleIntervalMs: DEFAULT_CACHE_PURGE_STALE_INTERVAL_MS,
  }
)

const s3CredentialsSingleFlight = createInvalidatableSingleFlightByKey<S3Credentials>()

function deleteTenantS3CredentialsCache(cacheKey: string): void {
  s3CredentialsSingleFlight.invalidate(cacheKey)
  tenantS3CredentialsCache.delete(cacheKey)
}

export class S3CredentialsManager {
  private dbServiceRole: string

  constructor(private storage: S3CredentialsManagerStore) {
    const { dbServiceRole } = getConfig()
    this.dbServiceRole = dbServiceRole
  }

  /**
   * Keeps the in memory config cache up to date
   */
  async listenForTenantUpdate(pubSub: PubSubAdapter): Promise<void> {
    await pubSub.subscribe(TENANTS_S3_CREDENTIALS_UPDATE_CHANNEL, (cacheKey) => {
      if (!isStringMessage(cacheKey)) {
        return
      }

      deleteTenantS3CredentialsCache(cacheKey)
    })
  }

  /**
   * Create S3 Credential for a tenant
   * @param tenantId
   * @param data
   */
  async createS3Credentials(
    tenantId: string,
    data: { description: string; claims?: S3Credentials['claims'] }
  ) {
    const existingCount = await this.countS3Credentials(tenantId)

    if (existingCount >= 50) {
      throw ERRORS.MaximumCredentialsLimit()
    }

    const accessKey = crypto.randomBytes(32).toString('hex').slice(0, 32)
    const secretKey = crypto.randomBytes(64).toString('hex').slice(0, 64)

    if (data.claims) {
      delete data.claims.iss
      delete data.claims.issuer
      delete data.claims.exp
      delete data.claims.iat
    }

    const claims = {
      ...(data.claims || {}),
      role: data.claims?.role ?? this.dbServiceRole,
      issuer: `supabase.storage.${tenantId}`,
      sub: data.claims?.sub,
    }

    const id = await this.storage.insert(tenantId, {
      description: data.description,
      claims,
      accessKey,
      secretKey: encrypt(secretKey),
    })

    return {
      id,
      access_key: accessKey,
      secret_key: secretKey,
    }
  }

  async getS3CredentialsByAccessKey(
    tenantId: string,
    accessKey: string,
    options?: CacheLookupOptions
  ): Promise<S3Credentials> {
    const cacheKey = `${tenantId}:${accessKey}`
    const cachedCredentials = tenantS3CredentialsCache.get(cacheKey, options)

    if (cachedCredentials !== undefined) {
      return cachedCredentials
    }

    return s3CredentialsSingleFlight(cacheKey, {
      load: async () => {
        const data = await this.storage.getOneByAccessKey(tenantId, accessKey)

        if (!data) {
          throw ERRORS.MissingS3Credentials()
        }

        data.secretKey = decrypt(data.secretKey)

        return data
      },
      retry: () =>
        this.getS3CredentialsByAccessKey(tenantId, accessKey, CACHE_LOOKUP_WITHOUT_METRICS),
      commit: (data) => tenantS3CredentialsCache.set(cacheKey, data),
    })
  }

  deleteS3Credential(tenantId: string, credentialId: string): Promise<number> {
    return this.storage.delete(tenantId, credentialId)
  }

  listS3Credentials(tenantId: string): Promise<S3CredentialsRaw[]> {
    return this.storage.list(tenantId)
  }

  async countS3Credentials(tenantId: string) {
    return this.storage.count(tenantId)
  }
}
