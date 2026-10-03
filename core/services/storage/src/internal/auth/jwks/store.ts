export interface JWKStoreItem {
  id: string
  content: string
  kind: string
  active: boolean
}

export interface PaginatedTenantItem {
  id: string
  cursor_id: number
}

export interface JWKSManagerStore<TRX> {
  /**
   * Run operations in a transaction
   * @param callback
   */
  transaction<T>(callback: (trx: TRX) => Promise<T>): Promise<T>

  /**
   * Adds a jwk to the database
   * @param tenant_id owning tenant
   * @param content serialized and encrypted jwk content
   * @param kind the kind identifier for this jwk
   * @param idempotent inserts idempotent. Depends on a unique index for the provided kind
   * @param trx optional transaction to use for this query
   */
  insert(
    tenantId: string,
    encryptedJwk: string,
    kind: string,
    idempotent?: boolean,
    trx?: TRX
  ): Promise<string>

  /**
   * Promotes a standby-kind jwk to the active kind, demoting the current active-kind jwk (if any)
   * @param tenantId
   * @param targetId id of the standby-kind jwk to promote
   * @param activeKind the kind that marks the currently active jwk
   * @param standbyKind the kind that marks a promotable standby jwk
   * @param trx optional transaction to use for this query
   */
  swapStandbyActiveKey(
    tenantId: string,
    targetId: string,
    activeKind: string,
    standbyKind: string,
    trx?: TRX
  ): Promise<{ swapped: boolean; demotedId: string | null }>

  /**
   * Gets a single jwk by id, regardless of active state
   * @param tenantId
   * @param id
   * @param trx optional transaction to use for this query
   */
  getById(tenantId: string, id: string, trx?: TRX): Promise<JWKStoreItem | undefined>

  /**
   * Sets the active value for a jwk by id
   * @param tenantId
   * @param id
   * @param newState
   * @param excludeKind if the jwk currently has this kind, the toggle is refused (no-op); pass null for no restriction
   * @param trx optional transaction to use for this query
   */
  toggleActive(
    tenantId: string,
    id: string,
    newState: boolean,
    excludeKind: string | null,
    trx?: TRX
  ): Promise<boolean>

  /**
   * Lists all active jwks for the specified tenant
   * @param tenantId
   * @param kind optional filter by kind
   */
  listActive(tenantId: string, kind?: string, trx?: TRX): Promise<JWKStoreItem[]>

  /**
   * Lists all jwks for the specified tenant, regardless of active state
   * @param tenantId
   * @param trx optional transaction to use for this query
   */
  list(tenantId: string, trx?: TRX): Promise<JWKStoreItem[]>

  /**
   * Lists tenants that do not have a jwk of the specified kind
   * @param kind
   * @param batchSize
   * @param lastCursor
   */
  listTenantsWithoutKindPaginated(
    kind: string,
    batchSize: number,
    lastCursor?: number
  ): Promise<PaginatedTenantItem[]>
}
