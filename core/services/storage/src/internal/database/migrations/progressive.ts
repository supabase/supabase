import { areMigrationsUpToDate } from '@internal/database/migrations/migrate'
import { ErrorCode, isStorageError } from '@internal/errors'
import { RunMigrationsOnTenants } from '@storage/events'
import { getConfig } from '../../../config'
import { logger, logSchema } from '../../monitoring'
import { getTenantConfig, TenantMigrationStatus } from '../tenant'

const { dbMigrationFreezeAt } = getConfig()
const maxBatchSendBackoffMs = 60_000
const progressiveMigrationsMetadata = JSON.stringify({ strategy: 'progressive' })

export class ProgressiveMigrations {
  protected readonly tenants = new Set<string>()
  protected inFlightCreateJobs?: Promise<void>
  protected consecutiveBatchSendFailures = 0
  protected nextBatchSendAttemptAt = 0
  protected batchSendTimer: NodeJS.Timeout | undefined
  private shutdownSignal: AbortSignal | undefined

  constructor(protected readonly options: { maxSize: number; interval: number }) {}

  start(signal: AbortSignal) {
    this.shutdownSignal = signal

    signal.addEventListener('abort', () => {
      logSchema.info(logger, '[Migrations] Stopping', {
        type: 'migrations',
      })
      return this.drain()
    })
  }

  async drain() {
    await this.inFlightCreateJobs?.catch(() => {})
    this.resetBatchSendBackoff()
    return this.createJobsAndLogErrors(this.tenants.size)
  }

  addTenant(tenant: string) {
    if (this.tenants.has(tenant)) {
      return
    }

    this.tenants.add(tenant)

    if (this.inFlightCreateJobs) {
      return
    }

    if (this.tenants.size < this.options.maxSize) {
      this.scheduleNextBatch()
      return
    }

    if (this.isBatchSendBackoffActive()) {
      return
    }

    this.clearBatchSendSchedule()
    void this.createJobsAndLogErrors(this.options.maxSize)
  }

  protected createJobs(maxJobs: number) {
    if (this.inFlightCreateJobs) {
      return this.inFlightCreateJobs
    }

    this.inFlightCreateJobs = this.createJobsBatch(maxJobs).finally(() => {
      this.inFlightCreateJobs = undefined
    })

    return this.inFlightCreateJobs
  }

  private createJobsAndLogErrors(maxJobs: number) {
    return this.createJobs(maxJobs).catch((e) => {
      logSchema.error(logger, '[Migrations] Error creating migration jobs', {
        type: 'migrations',
        error: e,
        metadata: progressiveMigrationsMetadata,
      })
      this.scheduleNextBatch()
    })
  }

  protected async createJobsBatch(maxJobs: number) {
    if (this.isBatchSendBackoffActive()) {
      return
    }

    const tenantsBatch: string[] = []
    for (const tenant of this.tenants) {
      if (tenantsBatch.length >= maxJobs) {
        break
      }
      tenantsBatch.push(tenant)
    }

    const jobs = await Promise.allSettled(
      tenantsBatch.map(async (tenant) => {
        const tenantConfig = await getTenantConfig(tenant)
        const migrationsUpToDate = await areMigrationsUpToDate(tenant)

        if (migrationsUpToDate || tenantConfig.syncMigrationsDone) {
          return
        }

        const scheduleAt = new Date()
        scheduleAt.setMinutes(scheduleAt.getMinutes() + 5)
        const scheduleForLater =
          tenantConfig.migrationStatus === TenantMigrationStatus.FAILED_STALE
            ? scheduleAt
            : undefined

        return new RunMigrationsOnTenants({
          tenantId: tenant,
          scheduleAt: scheduleForLater,
          upToMigration: dbMigrationFreezeAt,
          tenant: {
            host: '',
            ref: tenant,
          },
        })
      })
    )

    const { retryableFailedTenants, sendableJobs } = this.classifyPreparedJobs(tenantsBatch, jobs)

    if (sendableJobs.length > 0) {
      try {
        await RunMigrationsOnTenants.batchSend(sendableJobs.map(({ job }) => job))
        this.resetBatchSendBackoff()
      } catch (e) {
        for (const { tenant } of sendableJobs) {
          retryableFailedTenants.add(tenant)
        }
        const retryDelayMs = this.deferBatchSendRetry()
        logSchema.error(logger, '[Migrations] Error sending migration jobs batch', {
          type: 'migrations',
          error: e,
          metadata: JSON.stringify({
            strategy: 'progressive',
            consecutiveFailures: this.consecutiveBatchSendFailures,
            retryDelayMs,
          }),
        })
      }
    }

    this.reconcileTenants(tenantsBatch, retryableFailedTenants)

    if (this.tenants.size === 0) {
      this.resetBatchSendBackoff()
    } else {
      this.scheduleNextBatch()
    }
  }

  private classifyPreparedJobs(
    tenantsBatch: string[],
    jobs: PromiseSettledResult<RunMigrationsOnTenants | undefined>[]
  ) {
    const retryableFailedTenants = new Set<string>()
    const sendableJobs: Array<{ tenant: string; job: RunMigrationsOnTenants }> = []

    for (const [index, job] of jobs.entries()) {
      const tenant = tenantsBatch[index]

      if (job.status === 'rejected') {
        const dropTenant = isStorageError(ErrorCode.TenantNotFound, job.reason)
        if (!dropTenant) {
          retryableFailedTenants.add(tenant)
        }
        logSchema.warning(
          logger,
          dropTenant
            ? `[Migrations] Failed to prepare migration job for tenant ${tenant}; dropping tenant from queue because it no longer exists`
            : `[Migrations] Failed to prepare migration job for tenant ${tenant}; keeping tenant queued for retry`,
          {
            type: 'migrations',
            error: job.reason,
            project: tenant,
            metadata: progressiveMigrationsMetadata,
          }
        )
        continue
      }

      if (job.value) {
        sendableJobs.push({ tenant, job: job.value })
      }
    }

    return { retryableFailedTenants, sendableJobs }
  }

  private reconcileTenants(tenantsBatch: string[], retryableFailedTenants: Set<string>) {
    for (const tenant of tenantsBatch) {
      this.tenants.delete(tenant)
      if (retryableFailedTenants.has(tenant)) {
        this.tenants.add(tenant)
      }
    }
  }

  protected now() {
    return performance.now()
  }

  protected random() {
    return Math.random()
  }

  private get baseDelayMs() {
    return Math.max(this.options.interval, 1)
  }

  private isBatchSendBackoffActive() {
    return this.now() < this.nextBatchSendAttemptAt
  }

  private deferBatchSendRetry() {
    this.consecutiveBatchSendFailures++

    const maximumDelayMs = Math.max(this.baseDelayMs, maxBatchSendBackoffMs)
    const upperDelayMs = Math.min(
      maximumDelayMs,
      this.baseDelayMs * 2 ** this.consecutiveBatchSendFailures
    )
    const lowerDelayMs = Math.max(this.baseDelayMs, Math.floor(upperDelayMs / 2))
    const retryDelayMs = Math.round(lowerDelayMs + (upperDelayMs - lowerDelayMs) * this.random())

    this.nextBatchSendAttemptAt = this.now() + retryDelayMs
    return retryDelayMs
  }

  private scheduleNextBatch() {
    if (
      this.tenants.size === 0 ||
      !this.shutdownSignal ||
      this.shutdownSignal.aborted ||
      this.batchSendTimer
    ) {
      return
    }

    const delayMs = this.isBatchSendBackoffActive()
      ? Math.max(this.nextBatchSendAttemptAt - this.now(), 1)
      : this.baseDelayMs

    const timer = setTimeout(() => {
      this.clearBatchSendSchedule()
      void this.createJobsAndLogErrors(this.options.maxSize)
    }, delayMs)
    this.batchSendTimer = timer
    timer.unref()
  }

  private clearBatchSendSchedule() {
    this.cancelBatchSendTimer()
    this.nextBatchSendAttemptAt = 0
  }

  private cancelBatchSendTimer() {
    if (this.batchSendTimer) {
      clearTimeout(this.batchSendTimer)
      this.batchSendTimer = undefined
    }
  }

  protected resetBatchSendBackoff() {
    this.clearBatchSendSchedule()
    this.consecutiveBatchSendFailures = 0
  }
}
