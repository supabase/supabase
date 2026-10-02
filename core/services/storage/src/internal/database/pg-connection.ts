import type { Lease, LeaseDisposeReason } from '@internal/cache'
import { ERRORS } from '@internal/errors'
import { logger, logSchema } from '@internal/monitoring'
import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg'
import { getConfig } from '../../config'
import type {
  DatabaseExecutor,
  DatabaseQueryArgument,
  DatabaseStatement,
  DatabaseTransaction,
  DatabaseTransactionalExecutor,
  TenantConnection,
  TransactionOptions,
} from './connection'
import {
  PoolManager,
  PoolRebalanceOptions,
  PoolStats,
  type PoolStrategy,
  PoolStrategySettings,
  searchPath,
  TenantConnectionOptions,
} from './pool'
import { assertValidSignal } from './postgres/asserts'
import { cancelQuery } from './postgres/cancellation'
import {
  attachPoolErrorHandler,
  createAbortError,
  isConnectionStateError,
  isConnectionTimeoutError,
  isRetryableTransactionSetupError,
  markClientDisposable,
  shouldDisposeClient,
} from './postgres/pool-errors'
import { buildScopeStatement } from './postgres/scope'
import {
  buildBeginStatement,
  normalizeStatement,
  normalizeStatementTimeoutMs,
} from './postgres/sql'
import { getSslSettings } from './postgres/ssl'
import { installPostgresTypeParsers } from './postgres/type-parsers'
import {
  createTlsSessionSlot,
  installTlsSessionResumption,
  TlsSessionResumptionClient,
  type TlsSessionSlot,
} from './tls-session-resumption'

const {
  databaseApplicationName,
  databaseConnectionTimeout,
  databaseFreePoolAfterInactivity,
  databaseMaxConnections,
  databasePoolDrainTimeout,
  databaseSSLRootCert,
  databaseStatementTimeout,
  databaseTlsSessionResumption,
} = getConfig()

installPostgresTypeParsers()

interface PgTransactionOptions {
  searchPath?: string
  statementTimeoutMs?: number
  cacheScope?: object
}

type PgBeginTransactionOptions = TransactionOptions & PgTransactionOptions

const defaultStatementTimeoutMs = normalizeStatementTimeoutMs(databaseStatementTimeout)

// Shared frozen options for the common transaction() call without caller options.
const defaultBeginTransactionOptions: PgBeginTransactionOptions | undefined =
  defaultStatementTimeoutMs !== undefined
    ? Object.freeze({ statementTimeoutMs: defaultStatementTimeoutMs })
    : undefined
const externalPoolSearchPath = searchPath.join(',')
const defaultExternalPoolBeginTransactionOptions: PgBeginTransactionOptions = Object.freeze({
  ...defaultBeginTransactionOptions,
  searchPath: externalPoolSearchPath,
})

interface PgPoolErrorContext {
  message: string
  tenantId?: string
  project?: string
}

const poolDrainCheckIntervalMs = 200
const transactionSetupMaxAttempts = 11
const transactionSetupTotalBudgetMs = 3000
const transactionSetupRetryMinDelayMs = 50
const transactionSetupRetryMaxDelayMs = 200

export class PgPoolStrategy implements PoolStrategy {
  protected pool?: Pool
  protected tlsSession?: TlsSessionSlot
  private disposed = false
  private executor?: PgPoolExecutor
  private executorPool?: Pool

  constructor(protected readonly options: PoolStrategySettings) {}

  acquire(): PgPoolExecutor {
    const pool = this.getPool()
    if (!this.executor || this.executorPool !== pool) {
      this.executor = new PgPoolExecutor(pool)
      this.executorPool = pool
    }
    return this.executor
  }

  async dispose(reason: LeaseDisposeReason): Promise<void> {
    this.disposed = true
    const originalPool = this.pool
    this.executor = undefined
    this.executorPool = undefined

    if (!originalPool) {
      return
    }

    // Keep the physical pool visible to stats while it drains. Disposal blocks reuse.
    try {
      await this.drainPool(originalPool, reason)
    } finally {
      if (this.pool === originalPool) {
        this.pool = undefined
      }
    }
  }

  rebalance(options: PoolRebalanceOptions): void {
    if (this.disposed) {
      return
    }

    let capacityChanged = false

    if (options.clusterSize !== undefined && options.clusterSize !== 0) {
      capacityChanged = this.options.clusterSize !== options.clusterSize
      this.options.clusterSize = options.clusterSize
    }

    if (options.maxConnections !== undefined) {
      capacityChanged = capacityChanged || this.options.maxConnections !== options.maxConnections
      this.options.maxConnections = options.maxConnections
    }

    if (capacityChanged) {
      this.updatePoolMax()
    }
  }

  private updatePoolMax(): void {
    if (!this.pool) {
      return
    }

    const previousMax = this.pool.options.max
    const nextMax = this.getSettings().maxConnections
    if (nextMax === previousMax) {
      return
    }

    this.pool.options.max = nextMax
    if (nextMax > previousMax) {
      pulsePgPoolQueue(this.pool)
    }
  }

  getPoolStats(): PoolStats | null {
    if (!this.pool) {
      return null
    }

    return {
      used: Math.max(this.pool.totalCount - this.pool.idleCount, 0),
      total: this.pool.totalCount,
    }
  }

  protected getPool(): Pool {
    if (this.disposed) {
      throw ERRORS.InternalError(undefined, 'Cannot acquire from a disposed pool strategy')
    }

    if (!this.pool) {
      this.pool = this.createPool()
    }

    return this.pool
  }

  protected getSettings() {
    const numWorkers = Math.max(this.options.numWorkers ?? 1, 1)
    const clusterSize = this.options.clusterSize || 0
    let maxConnection = this.options.maxConnections || databaseMaxConnections

    const divisor = Math.max(clusterSize, 1) * numWorkers
    if (divisor > 1) {
      maxConnection = Math.ceil(maxConnection / divisor) || 1
    }

    return {
      ...this.options,
      idleTimeoutMillis: databaseFreePoolAfterInactivity,
      maxConnections: maxConnection,
      searchPath: this.options.isExternalPool ? undefined : searchPath,
    }
  }

  protected createPool(): Pool {
    const settings = this.getSettings()
    const sslSettings = getSslSettings({
      connectionString: settings.dbUrl,
      databaseSSLRootCert,
    })

    const ssl = sslSettings ? { ...sslSettings } : undefined
    if (databaseTlsSessionResumption && ssl) {
      this.tlsSession ??= createTlsSessionSlot()
      installTlsSessionResumption(ssl, this.tlsSession)
    }

    return attachPoolErrorHandler(
      new Pool({
        min: 0,
        max: settings.maxConnections,
        connectionString: settings.dbUrl,
        connectionTimeoutMillis: databaseConnectionTimeout,
        idleTimeoutMillis: settings.idleTimeoutMillis,
        ssl,
        Client: databaseTlsSessionResumption && ssl ? TlsSessionResumptionClient : undefined,
        application_name: databaseApplicationName,
        options: settings.searchPath
          ? `-c search_path=${settings.searchPath.join(',')}`
          : undefined,
      }),
      createPgPoolErrorHandler({
        message: '[PgPoolStrategy] Idle pg client error',
        tenantId: settings.tenantId,
        project: settings.tenantId,
      })
    )
  }

  private async drainPool(pool: Pool, reason: LeaseDisposeReason): Promise<void> {
    const startedAt = Date.now()
    const deadline = startedAt + databasePoolDrainTimeout

    // Match the legacy Knex pool drain: let queued acquires settle before ending.
    while ((pool.waitingCount ?? 0) > 0 && !isPoolEnding(pool)) {
      const remainingMs = deadline - Date.now()

      if (remainingMs <= 0) {
        this.logPoolDrainTimeout(pool, reason, Date.now() - startedAt)
        break
      }

      await wait(Math.min(poolDrainCheckIntervalMs, remainingMs))
    }

    if (isPoolEnding(pool)) {
      return
    }

    await pool.end()
  }

  private logPoolDrainTimeout(pool: Pool, reason: LeaseDisposeReason, elapsedMs: number): void {
    const metadata = {
      reason,
      drainTimeoutMs: databasePoolDrainTimeout,
      elapsedMs,
      ...getPoolWorkStats(pool),
    }

    logSchema.warning(logger, '[PgPoolStrategy] Timed out waiting for pg pool to drain', {
      type: 'db',
      tenantId: this.options.tenantId,
      project: this.options.tenantId,
      metadata: JSON.stringify(metadata),
    })
  }
}

function createPgPoolErrorHandler(context: PgPoolErrorContext): (error: Error) => void {
  return (error) => {
    logSchema.warning(logger, context.message, {
      type: 'db',
      tenantId: context.tenantId,
      project: context.project,
      error,
    })
  }
}

function getPoolWorkStats(pool: Pool): {
  waitingCount: number
  activeCount: number
  totalCount: number
  idleCount: number
} {
  const waitingCount = pool.waitingCount ?? 0
  const totalCount = pool.totalCount ?? 0
  const idleCount = pool.idleCount ?? 0

  return {
    waitingCount,
    activeCount: Math.max(totalCount - idleCount, 0),
    totalCount,
    idleCount,
  }
}

function isPoolEnding(pool: Pool): boolean {
  return Boolean(pool.ending || pool.ended)
}

function wait(timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, timeoutMs)
    timeout.unref?.()
  })
}

function pulsePgPoolQueue(pool: Pool): void {
  ;(pool as Pool & { _pulseQueue?: () => void })._pulseQueue?.()
}

export class PgPoolManager extends PoolManager<PgPoolStrategy> {
  protected newPool(settings: PoolStrategySettings): PgPoolStrategy {
    return new PgPoolStrategy(settings)
  }
}

class PgClientErrorTracker {
  private clientError?: Error

  constructor(private readonly client: PoolClient) {
    this.client.on('error', this.onError)
  }

  get error(): Error | undefined {
    return this.clientError
  }

  throwIfErrored(): void {
    if (this.clientError) {
      throw this.clientError
    }
  }

  releaseErrorForQuery(error: unknown): Error | undefined {
    if (this.clientError) {
      return this.clientError
    }

    if (shouldDisposeClient(error)) {
      return ensureError(error)
    }

    return undefined
  }

  releaseErrorForFinalizer(error: unknown): Error {
    return this.clientError ?? ensureError(error)
  }

  detach(): void {
    this.client.off('error', this.onError)
  }

  private readonly onError = (error: unknown): void => {
    const normalizedError = ensureError(error)
    markClientDisposable(normalizedError)

    if (!this.clientError) {
      this.clientError = normalizedError
    }
  }
}

export class PgPoolExecutor implements DatabaseTransactionalExecutor {
  constructor(private readonly pool: Pool) {}

  getCacheScope(): object {
    return this.pool
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    statement: string | DatabaseStatement,
    options?: DatabaseQueryArgument
  ): Promise<QueryResult<T>> {
    assertValidSignal(getQuerySignal(options))

    let client: PoolClient | undefined
    let clientErrorTracker: PgClientErrorTracker | undefined
    let releaseError: Error | undefined

    try {
      client = await this.pool.connect()
      clientErrorTracker = new PgClientErrorTracker(client)
      const result = await runPgQuery<T>(client, statement, options)
      clientErrorTracker.throwIfErrored()
      return result
    } catch (e) {
      if (!client) {
        if (isConnectionTimeoutError(e)) {
          throw ERRORS.DatabaseTimeout(e)
        }

        throw e
      }

      releaseError = clientErrorTracker?.releaseErrorForQuery(e)
      throw releaseError ?? e
    } finally {
      if (client && clientErrorTracker) {
        const trackedError = clientErrorTracker.error
        try {
          client.release(releaseError ?? trackedError)
        } finally {
          clientErrorTracker.detach()
        }
      }
    }
  }

  async beginTransaction(options?: PgBeginTransactionOptions): Promise<PgTransaction> {
    let client: PoolClient
    try {
      client = await this.pool.connect()
    } catch (e) {
      if (isConnectionTimeoutError(e)) {
        throw ERRORS.DatabaseTimeout(e)
      }

      throw e
    }

    const clientErrorTracker = new PgClientErrorTracker(client)
    const transaction = new PgTransaction(client, clientErrorTracker, {
      searchPath: options?.searchPath,
      statementTimeoutMs: options?.statementTimeoutMs ?? options?.timeout,
      cacheScope: this.getCacheScope(),
    })

    try {
      await transaction.runSetupQuery(buildBeginStatement(options))
      return transaction
    } catch (e) {
      if (!transaction.isCompleted()) {
        const releaseError = clientErrorTracker.releaseErrorForFinalizer(e)
        try {
          client.release(releaseError)
        } finally {
          clientErrorTracker.detach()
        }
      }
      throw e
    }
  }
}

export class PgTransaction implements DatabaseTransaction {
  private completed = false
  private pendingSearchPath?: string
  private pendingStatementTimeoutMs?: number
  private readonly cacheScope: object

  constructor(
    private readonly client: PoolClient,
    private readonly clientErrorTracker?: PgClientErrorTracker,
    options: PgTransactionOptions = {}
  ) {
    this.pendingSearchPath = options.searchPath || undefined
    this.pendingStatementTimeoutMs = normalizeStatementTimeoutMs(options.statementTimeoutMs)
    this.cacheScope = options.cacheScope ?? client
  }

  getCacheScope(): object {
    return this.cacheScope
  }

  isCompleted(): boolean {
    return this.completed
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    statement: string | DatabaseStatement,
    options?: DatabaseQueryArgument
  ): Promise<QueryResult<T>> {
    return this.runQuery(statement, options, true)
  }

  async runSetupQuery<T extends QueryResultRow = QueryResultRow>(
    statement: string | DatabaseStatement,
    options?: DatabaseQueryArgument
  ): Promise<QueryResult<T>> {
    // Setup statements must not consume deferred settings before scope can fold them in.
    return this.runQuery(statement, options, false)
  }

  // Hands deferred settings to the caller (setScope) so they can be folded
  // into its next statement instead of costing separate set_config round trips.
  takePendingStatementTimeoutMs(): number | undefined {
    const timeoutMs = this.pendingStatementTimeoutMs
    this.pendingStatementTimeoutMs = undefined
    return timeoutMs
  }

  takePendingSearchPath(): string | undefined {
    const pendingSearchPath = this.pendingSearchPath
    this.pendingSearchPath = undefined
    return pendingSearchPath
  }

  private async runQuery<T extends QueryResultRow = QueryResultRow>(
    statement: string | DatabaseStatement,
    options: DatabaseQueryArgument | undefined,
    applyPendingSettings: boolean
  ): Promise<QueryResult<T>> {
    if (this.completed) {
      throw new Error('Cannot query a completed transaction')
    }

    const signal = getQuerySignal(options)

    try {
      assertValidSignal(signal)

      if (
        applyPendingSettings &&
        (this.pendingSearchPath !== undefined || this.pendingStatementTimeoutMs !== undefined)
      ) {
        await this.applyPendingSettingsBeforeQuery(signal)
      }

      const result = await runPgQuery<T>(this.client, statement, options)
      this.clientErrorTracker?.throwIfErrored()
      return result
    } catch (e) {
      const releaseError =
        this.clientErrorTracker?.releaseErrorForQuery(e) ??
        (shouldDisposeClient(e) ? ensureError(e) : undefined)
      if (releaseError) {
        this.completed = true
        this.release(releaseError)
        throw releaseError
      }
      throw e
    }
  }

  async commit(): Promise<void> {
    if (this.completed) {
      return
    }

    let releaseError: Error | undefined
    try {
      await runPgQuery(this.client, 'COMMIT')
      this.clientErrorTracker?.throwIfErrored()
    } catch (e) {
      // A failed transaction finalizer leaves cleanup state uncertain, so release
      // with the error even for recoverable SQLSTATEs such as 40001 at COMMIT.
      releaseError = this.clientErrorTracker?.releaseErrorForFinalizer(e) ?? ensureError(e)
      throw e
    } finally {
      this.completed = true
      this.release(releaseError)
    }
  }

  async rollback(): Promise<void> {
    if (this.completed) {
      return
    }

    let releaseError: Error | undefined
    try {
      await runPgQuery(this.client, 'ROLLBACK')
      this.clientErrorTracker?.throwIfErrored()
    } catch (e) {
      // A failed transaction finalizer leaves cleanup state uncertain, so release
      // with the error even for recoverable SQLSTATEs.
      releaseError = this.clientErrorTracker?.releaseErrorForFinalizer(e) ?? ensureError(e)
      throw e
    } finally {
      this.completed = true
      this.release(releaseError)
    }
  }

  private release(releaseError?: Error): void {
    const trackedError = this.clientErrorTracker?.error
    try {
      this.client.release(releaseError ?? trackedError)
    } finally {
      this.clientErrorTracker?.detach()
    }
  }

  private async applyPendingSettingsBeforeQuery(signal?: AbortSignal): Promise<void> {
    const timeoutMs = this.takePendingStatementTimeoutMs()
    const pendingSearchPath = this.takePendingSearchPath()

    const values: string[] = []
    if (timeoutMs) {
      values.push(`${timeoutMs}ms`)
    }
    if (pendingSearchPath) {
      values.push(pendingSearchPath)
    }

    await runPgQuery(
      this.client,
      {
        text: getPendingSettingsSql(timeoutMs, pendingSearchPath),
        values,
      },
      signal ? { signal } : undefined
    )
  }
}

const noopRelease = () => {}
const serializedJwtPayloads = new WeakMap<object, string>()

function serializeJwtPayload(payload: object): string {
  let serialized = serializedJwtPayloads.get(payload)
  if (serialized === undefined) {
    serialized = JSON.stringify(payload)
    serializedJwtPayloads.set(payload, serialized)
  }
  return serialized
}

export class PgTenantConnection implements TenantConnection {
  static poolManager = new PgPoolManager()
  public readonly role: string
  public readonly pool: PgPoolStrategy
  private abortSignal?: AbortSignal
  private disposed = false
  private readonly headersPayload: string
  private userPayload?: string

  constructor(
    private readonly poolLease: Lease<PgPoolStrategy>,
    protected readonly options: TenantConnectionOptions,
    headersPayload?: string
  ) {
    this.pool = poolLease.value
    this.role = options.user.payload.role || 'anon'
    this.headersPayload = headersPayload ?? JSON.stringify(options.headers || {})
  }

  static async stop(): Promise<void> {
    const results = await PgTenantConnection.poolManager.destroyAll()
    const errors = results.flatMap((result) =>
      result.status === 'rejected' ? [result.reason] : []
    )
    if (errors.length > 0) {
      throw new AggregateError(errors, 'Failed to retire one or more tenant database pools')
    }
  }

  static create(options: TenantConnectionOptions): PgTenantConnection {
    return new this(PgTenantConnection.poolManager.getPool(options), options)
  }

  dispose(): void {
    if (this.disposed) {
      return
    }

    this.disposed = true
    this.poolLease.release()
  }

  setAbortSignal(signal: AbortSignal) {
    this.abortSignal = signal
  }

  getAbortSignal(): AbortSignal | undefined {
    return this.abortSignal
  }

  acquireExecutor(): PgPoolExecutor {
    this.assertNotDisposed()
    return this.pool.acquire()
  }

  getCacheScope(): object {
    return this.acquireExecutor().getCacheScope()
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    statement: string | DatabaseStatement,
    options?: DatabaseQueryArgument
  ): Promise<QueryResult<T>> {
    this.assertNotDisposed()
    return this.pool.acquire().query<T>(statement, options)
  }

  async beginTransaction(options?: TransactionOptions): Promise<PgTransaction> {
    return this.beginTransactionWithRetry(options)
  }

  asSuperUser() {
    this.assertNotDisposed()

    const tenantConnection = new PgTenantConnection(
      { value: this.pool, release: noopRelease },
      {
        ...this.options,
        user: this.options.superUser,
      },
      this.headersPayload
    )

    if (this.abortSignal) {
      tenantConnection.setAbortSignal(this.abortSignal)
    }

    return tenantConnection
  }

  async transaction(opts?: TransactionOptions): Promise<PgTransaction> {
    this.assertNotDisposed()

    try {
      const beginOptions = withDefaultTransactionSettings(opts, this.options.isExternalPool)
      return await this.beginTransactionWithRetry(beginOptions)
    } catch (e) {
      if (isConnectionTimeoutError(e)) {
        throw ERRORS.DatabaseTimeout(e)
      }

      throw e
    }
  }

  private async beginTransactionWithRetry(
    opts?: PgBeginTransactionOptions
  ): Promise<PgTransaction> {
    const startedAt = performance.now()
    let delayMs = transactionSetupRetryMinDelayMs

    for (let attempt = 1; ; attempt++) {
      try {
        return await this.beginTransactionForRequest(opts)
      } catch (e) {
        // Full jitter with exponential backoff: 50-100, 100-200, then 200ms.
        const sleepMs = Math.min(delayMs * (1 + Math.random()), transactionSetupRetryMaxDelayMs)
        const elapsedMs = performance.now() - startedAt

        if (
          !isRetryableTransactionSetupError(e) ||
          attempt >= transactionSetupMaxAttempts ||
          elapsedMs + sleepMs >= transactionSetupTotalBudgetMs
        ) {
          throw e
        }

        await wait(sleepMs)
        delayMs = Math.min(delayMs * 2, transactionSetupRetryMaxDelayMs)
      }
    }
  }

  private beginTransactionForRequest(opts?: PgBeginTransactionOptions): Promise<PgTransaction> {
    this.assertNotDisposed()
    if (this.abortSignal?.aborted) {
      throw createAbortError()
    }
    // PgPoolExecutor derives the deferred statement_timeout from options.timeout.
    return this.pool.acquire().beginTransaction(opts)
  }

  private assertNotDisposed(): void {
    if (this.disposed) {
      throw createDisposedTenantConnectionError()
    }
  }

  async setScope(tnx: DatabaseExecutor) {
    let statementTimeoutMs: number | undefined
    let pendingSearchPath: string | undefined
    if (tnx instanceof PgTransaction) {
      statementTimeoutMs = tnx.takePendingStatementTimeoutMs()
      pendingSearchPath = tnx.takePendingSearchPath()
    }

    await tnx.query(
      buildScopeStatement(
        this.options,
        this.role,
        this.getUserPayload(),
        this.headersPayload,
        statementTimeoutMs,
        pendingSearchPath
      )
    )
  }

  private getUserPayload(): string {
    this.userPayload ??= serializeJwtPayload(this.options.user.payload)
    return this.userPayload
  }
}

function getPendingSettingsSql(
  statementTimeoutMs: number | undefined,
  pendingSearchPath: string | undefined
): string {
  if (statementTimeoutMs && pendingSearchPath) {
    return "SELECT set_config('statement_timeout', $1, true), set_config('search_path', $2, true)"
  }

  if (statementTimeoutMs) {
    return "SELECT set_config('statement_timeout', $1, true)"
  }

  return "SELECT set_config('search_path', $1, true)"
}

function withDefaultTransactionSettings(
  options: TransactionOptions | undefined,
  isExternalPool: boolean | undefined
): PgBeginTransactionOptions | undefined {
  if (!isExternalPool) {
    return withDefaultStatementTimeout(options)
  }

  if (!options) {
    return defaultExternalPoolBeginTransactionOptions
  }

  return {
    ...options,
    statementTimeoutMs: options.timeout === undefined ? defaultStatementTimeoutMs : undefined,
    searchPath: externalPoolSearchPath,
  }
}

// PgPoolExecutor already derives the deferred statement_timeout from options.timeout,
// so options only need rewriting when the global default has to be injected.
function withDefaultStatementTimeout(
  options: TransactionOptions | undefined
): PgBeginTransactionOptions | undefined {
  if (!defaultBeginTransactionOptions || options?.timeout !== undefined) {
    return options
  }

  if (!options) {
    return defaultBeginTransactionOptions
  }

  return { ...options, statementTimeoutMs: defaultStatementTimeoutMs }
}

function createDisposedTenantConnectionError(): Error {
  return new Error('Cannot use a disposed PgTenantConnection')
}

function ensureError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

async function runPgQuery<T extends QueryResultRow = QueryResultRow>(
  client: PoolClient,
  statement: string | DatabaseStatement,
  options?: DatabaseQueryArgument
): Promise<QueryResult<T>> {
  const signal = Array.isArray(options) ? undefined : options?.signal
  const query = normalizeStatement(statement, Array.isArray(options) ? options : undefined)

  if (!signal) {
    try {
      return await client.query<T>(query.text, query.values)
    } catch (e) {
      if (isConnectionStateError(e)) {
        markClientDisposable(e)
      }
      throw e
    }
  }

  assertValidSignal(signal)

  let aborted = false
  let cancelPromise: Promise<void> | undefined
  let rejectAbort: ((error: Error) => void) | undefined
  const abortPromise = new Promise<never>((_, reject) => {
    rejectAbort = reject
  })

  const onAbort = () => {
    aborted = true
    cancelPromise = cancelQuery(client).catch(() => undefined)
    rejectAbort?.(createAbortError())
    rejectAbort = undefined
  }

  signal.addEventListener('abort', onAbort, { once: true })

  try {
    const queryPromise = client.query<T>(query.text, query.values)
    const result = await Promise.race([queryPromise, abortPromise])

    if (aborted) {
      throw createAbortError()
    }

    return result
  } catch (e) {
    if (aborted) {
      void cancelPromise
      throw createAbortError()
    }

    if (isConnectionStateError(e)) {
      markClientDisposable(e)
    }
    throw e
  } finally {
    signal.removeEventListener('abort', onAbort)
  }
}

function getQuerySignal(options?: DatabaseQueryArgument): AbortSignal | undefined {
  return Array.isArray(options) ? undefined : options?.signal
}
