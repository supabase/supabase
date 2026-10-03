import { decrypt, encrypt, generateES256JWK, generateHS512JWK } from '@internal/auth'
import {
  CACHE_LOOKUP_WITHOUT_METRICS,
  type CacheLookupOptions,
  createLruCache,
  DEFAULT_CACHE_PURGE_STALE_INTERVAL_MS,
  DEFAULT_CACHE_TTL_JITTER_RATIO,
  TENANT_JWKS_CACHE_NAME,
} from '@internal/cache'
import { createInvalidatableSingleFlightByKey } from '@internal/concurrency'
import { isStringMessage, PubSubAdapter } from '@internal/pubsub'
import {
  freezeJwksConfig,
  JwksConfig,
  UrlSigningJwksConfigKey,
  UrlSigningJwkType,
} from '../../../config'
import {
  JWK_KIND_STORAGE_URL_SIGNING,
  JWK_KIND_STORAGE_URL_STANDBY,
  TENANTS_JWKS_UPDATE_CHANNEL,
} from './constants'
import { JWKSManagerStore, JWKStoreItem } from './store'

export type JwkListItem = {
  kid: string
  kind: string
  type: string
  active: boolean
}

const tenantJwksSingleFlight = createInvalidatableSingleFlightByKey<JwksConfig>()
// Max 16,384 items. At ~2.5KB per JWKS, this uses roughly ~40MB of heap memory worst-case.
export const TENANT_JWKS_CACHE_MAX_ITEMS = 16384
export const TENANT_JWKS_CACHE_TTL_MS = 1000 * 60 * 60 // 1h

const tenantJwksConfigCache = createLruCache<string, JwksConfig>(TENANT_JWKS_CACHE_NAME, {
  max: TENANT_JWKS_CACHE_MAX_ITEMS,
  ttl: TENANT_JWKS_CACHE_TTL_MS,
  ttlJitterRatio: DEFAULT_CACHE_TTL_JITTER_RATIO,
  allowStale: false,
  purgeStaleIntervalMs: DEFAULT_CACHE_PURGE_STALE_INTERVAL_MS,
})

export function deleteTenantJwksConfig(tenantId: string): void {
  tenantJwksSingleFlight.invalidate(tenantId)
  tenantJwksConfigCache.delete(tenantId)
}

export class JWKSManager<TRX> {
  constructor(private storage: JWKSManagerStore<TRX>) {}

  /**
   * Keeps the in memory config cache up to date
   */
  async listenForTenantUpdate(pubSub: PubSubAdapter): Promise<void> {
    await pubSub.subscribe(TENANTS_JWKS_UPDATE_CHANNEL, (cacheKey) => {
      if (!isStringMessage(cacheKey)) {
        return
      }

      deleteTenantJwksConfig(cacheKey)
    })
  }

  /**
   * Generates a new URL signing JWK and stores it in the database if one does not already exist.
   * Only one active url signing jwk can exist, this function is idempotent and will create a new entry or return the kid of the existing
   * @param tenantId
   * @param trx optional transaction to add the jwk within
   */
  async generateUrlSigningJwk(
    tenantId: string,
    type: UrlSigningJwkType,
    trx?: TRX
  ): Promise<{ kid: string }> {
    const content = encrypt(JSON.stringify(await this.generateJwk(type)))
    const id = await this.storage.insert(tenantId, content, JWK_KIND_STORAGE_URL_SIGNING, true, trx)
    return { kid: id }
  }

  async generateUrlSigningStandbyJwk(
    tenantId: string,
    type: UrlSigningJwkType,
    trx?: TRX
  ): Promise<{ kid: string }> {
    const content = encrypt(JSON.stringify(await this.generateJwk(type)))
    const id = await this.storage.insert(
      tenantId,
      content,
      JWK_KIND_STORAGE_URL_STANDBY,
      false,
      trx
    )
    return { kid: id }
  }

  async swapUrlSigningStandbyJwk(tenantId: string, kid: string): Promise<boolean> {
    const { swapped } = await this.storage.swapStandbyActiveKey(
      tenantId,
      kid,
      JWK_KIND_STORAGE_URL_SIGNING,
      JWK_KIND_STORAGE_URL_STANDBY
    )
    return swapped
  }

  /**
   * Atomically rolls the URL signing JWK by deactivating the current key and creating a new one.
   * Does not read the current signing key up front: swap alone determines - under its own lock -
   * which key gets demoted and hands back its id, so concurrent rolls/swaps for the same tenant
   * can never act on a stale "current key" read from outside that lock.
   * @param tenantId
   */
  async rollUrlSigningJwk(
    tenantId: string,
    type: UrlSigningJwkType
  ): Promise<{ oldKid: string | null; newKid: string }> {
    return this.storage.transaction(async (trx) => {
      const { kid: newKid } = await this.generateUrlSigningStandbyJwk(tenantId, type, trx)

      // promotes newKid to the signing kind, demoting the current signing key (if any) to
      // standby - swap takes its own lock, so no separate locking is needed here
      const { demotedId } = await this.storage.swapStandbyActiveKey(
        tenantId,
        newKid,
        JWK_KIND_STORAGE_URL_SIGNING,
        JWK_KIND_STORAGE_URL_STANDBY,
        trx
      )

      if (demotedId) {
        // demotedId was just moved off the signing kind by the swap above, in this same transaction, so no exclusion is needed here
        await this.storage.toggleActive(tenantId, demotedId, false, null, trx)
      }

      return {
        oldKid: demotedId,
        newKid,
      }
    })
  }

  /**
   * Adds a new jwk that can be used for signing urls
   * @param tenantId
   * @param jwk jwk content
   * @param kind string used to identify the purpose or source of each jwk
   */
  async addJwk(tenantId: string, jwk: object, kind: string): Promise<{ kid: string }> {
    const id = await this.storage.insert(tenantId, encrypt(JSON.stringify(jwk)), kind)
    return { kid: id }
  }

  /**
   * Gets a single jwk by id, regardless of active state
   * @param tenantId
   * @param kid
   */
  getJwk(tenantId: string, kid: string): Promise<JWKStoreItem | undefined> {
    return this.storage.getById(tenantId, kid)
  }

  /**
   * Disables an existing jwk, is no longer valid for signed urls
   * @param tenantId
   * @param kid
   * @param newState
   * @param excludeKind if the jwk currently has this kind, the toggle is refused (no-op); pass null for no restriction
   */
  toggleJwkActive(
    tenantId: string,
    kid: string,
    newState: boolean,
    excludeKind: string | null
  ): Promise<boolean> {
    return this.storage.toggleActive(tenantId, kid, newState, excludeKind)
  }

  /**
   * Lists all jwks for a tenant, regardless of active state
   * @param tenantId
   */
  async listJwks(tenantId: string): Promise<JwkListItem[]> {
    const data = await this.storage.list(tenantId)
    return data.map(({ id, kind, content, active }) => {
      const jwk = JSON.parse(decrypt(content))
      return {
        kid: id,
        kind,
        type: jwk.kty,
        active,
      }
    })
  }

  /**
   * Queries the tenant jwks from the multi-tenant database and stores them in a local cache
   * for quick subsequent access. Only includes jwks marked as active
   * @param tenantId
   */
  async getJwksTenantConfig(tenantId: string, options?: CacheLookupOptions): Promise<JwksConfig> {
    const cachedJwks = tenantJwksConfigCache.get(tenantId, options)

    if (cachedJwks !== undefined) {
      return cachedJwks
    }

    return tenantJwksSingleFlight(tenantId, {
      load: async () => {
        const data = await this.storage.listActive(tenantId)

        let urlSigningKey: UrlSigningJwksConfigKey | undefined
        const keys = data.map(({ id, kind, content }) => {
          const jwk = JSON.parse(decrypt(content))
          jwk.kid = id
          const isUrlSigningKeyKind = kind === JWK_KIND_STORAGE_URL_SIGNING
          const isUsableSigningKey = (jwk.kty === 'oct' && jwk.k) || (jwk.kty === 'EC' && jwk.d)
          if (isUrlSigningKeyKind && isUsableSigningKey && !urlSigningKey) {
            urlSigningKey = jwk
          }
          return jwk
        })
        return freezeJwksConfig({ keys, urlSigningKey })
      },
      retry: () => this.getJwksTenantConfig(tenantId, CACHE_LOOKUP_WITHOUT_METRICS),
      commit: (jwksConfig) => tenantJwksConfigCache.set(tenantId, jwksConfig),
    })
  }

  /**
   * Gets a list of all tenants that do not have a signing url associated
   */
  async *listTenantsMissingUrlSigningJwk(
    signal: AbortSignal,
    batchSize = 200
  ): AsyncGenerator<string[]> {
    let lastCursor = 0

    while (!signal.aborted) {
      const data = await this.storage.listTenantsWithoutKindPaginated(
        JWK_KIND_STORAGE_URL_SIGNING,
        batchSize,
        lastCursor
      )
      if (data.length === 0) {
        break
      }

      lastCursor = data[data.length - 1].cursor_id
      yield data.map((tenant) => tenant.id)
    }
  }

  private generateJwk(type: UrlSigningJwkType) {
    switch (type) {
      case 'HS512':
        return generateHS512JWK()
      case 'ES256':
        return generateES256JWK()
      default:
        throw new Error('Invalid signing key type ' + type)
    }
  }
}
