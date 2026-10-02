import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { ERRORS } from '@internal/errors'
import { Lock, Locker, RequestRelease } from '@tus/server'
import { LockNotifier } from './postgres-locker'

export interface S3LockerOptions {
  s3Client: S3Client
  bucket: string
  notifier: LockNotifier
  keyPrefix?: string
  lockTtlMs?: number
  renewalIntervalMs?: number
  maxRetries?: number
  retryDelayMs?: number
  logger?: Pick<Console, 'log' | 'warn' | 'error'>
}

interface LockMetadata {
  lockId: string
  expiresAt: number
  createdAt: number
  renewedAt: number
}

type LockerError = {
  name?: string
  message?: string
  $metadata?: {
    httpStatusCode?: number
  }
}

export class S3Locker implements Locker {
  private readonly s3Client: S3Client
  private readonly bucket: string
  private readonly keyPrefix: string
  private readonly lockTtlMs: number
  private readonly renewalIntervalMs: number
  private readonly maxRetries: number
  private readonly retryDelayMs: number
  private readonly logger: Pick<Console, 'log' | 'warn' | 'error'>
  private readonly notifier: LockNotifier

  constructor(options: S3LockerOptions) {
    this.s3Client = options.s3Client
    this.bucket = options.bucket
    this.notifier = options.notifier
    this.keyPrefix = options.keyPrefix || 'tus-locks/'
    this.lockTtlMs = options.lockTtlMs || 30000 // 30 seconds
    this.renewalIntervalMs = options.renewalIntervalMs || 10000 // 10 seconds
    this.maxRetries = options.maxRetries || 10
    this.retryDelayMs = options.retryDelayMs || 500
    this.logger = options.logger || console

    // Validate configuration
    if (this.renewalIntervalMs >= this.lockTtlMs) {
      throw new Error('Renewal interval must be less than lock TTL')
    }
  }

  newLock(id: string): Lock {
    return new S3Lock(id, this, this.notifier)
  }

  // Internal methods for S3Lock to access properties
  getRenewalInterval(): number {
    return this.renewalIntervalMs
  }

  getLogger(): Pick<Console, 'log' | 'warn' | 'error'> {
    return this.logger
  }

  async acquireLock(id: string, signal: AbortSignal): Promise<boolean> {
    const lockKey = this.getLockKey(id)
    const lockMetadata = this.createLockMetadata(id)

    for (let attempt = 0; attempt < this.maxRetries && !signal.aborted; attempt++) {
      try {
        // Try to create the lock with conditional put (IfNoneMatch)
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: lockKey,
            Body: JSON.stringify(lockMetadata),
            ContentType: 'application/json',
            IfNoneMatch: '*', // Only succeed if object doesn't exist
            Metadata: {
              lockId: id,
              expiresAt: lockMetadata.expiresAt.toString(),
            },
          })
        )
        return true
      } catch (error: unknown) {
        if (signal.aborted) {
          return false
        }

        // If lock already exists, check if it's expired or zombie
        if (hasErrorName(error, 'PreconditionFailed') || getHttpStatusCode(error) === 412) {
          const isExpired = await this.checkAndCleanupExpiredLock(lockKey, signal)
          await this.notifier.release(id)

          if (isExpired) {
            continue // Retry acquisition after cleanup
          }

          // Lock exists and is valid, request release and wait before retrying
          if (attempt < this.maxRetries - 1) {
            await this.sleep(this.retryDelayMs * (attempt + 1), signal)
          }
          continue
        }

        this.logger.error(`Lock acquisition failed for ${id}:`, getErrorMessage(error))
        throw error
      }
    }

    return false
  }

  async renewLock(id: string): Promise<boolean> {
    const lockKey = this.getLockKey(id)

    try {
      // Get current lock to verify ownership
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: lockKey,
        })
      )

      if (!response.Body) {
        return false
      }

      const body = await response.Body.transformToString()
      const currentLock: LockMetadata = JSON.parse(body)

      if (id !== currentLock.lockId) {
        return false
      }

      // Update expiration time
      const updatedLock: LockMetadata = {
        ...currentLock,
        expiresAt: Date.now() + this.lockTtlMs,
        renewedAt: Date.now(),
      }

      // Update the lock with new expiration (if it exists)
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: lockKey,
          Body: JSON.stringify(updatedLock),
          IfMatch: response.ETag,
          ContentType: 'application/json',
          Metadata: {
            lockId: id,
            expiresAt: updatedLock.expiresAt.toString(),
          },
        })
      )
      return true
    } catch (error: unknown) {
      if (hasErrorName(error, 'NoSuchKey') || hasErrorName(error, 'PreconditionFailed')) {
        return false
      }
      throw error
    }
  }

  async releaseLock(id: string): Promise<void> {
    const lockKey = this.getLockKey(id)

    try {
      // Only delete if we own the lock
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: lockKey,
        })
      )
    } catch (error: unknown) {
      // If lock doesn't exist, that's fine
      if (!hasErrorName(error, 'NoSuchKey')) {
        throw error
      }
    }
  }

  public async cleanupZombieLocks(): Promise<void> {
    try {
      let continuationToken: string | undefined

      do {
        const response = await this.s3Client.send(
          new ListObjectsV2Command({
            Bucket: this.bucket,
            Prefix: this.keyPrefix,
            ContinuationToken: continuationToken,
            MaxKeys: 1000,
          })
        )

        if (response.Contents) {
          const expiredLocks: string[] = []

          // Check each lock for expiration
          for (const object of response.Contents) {
            if (!object.Key) continue

            try {
              const lockResponse = await this.s3Client.send(
                new GetObjectCommand({
                  Bucket: this.bucket,
                  Key: object.Key,
                })
              )

              if (lockResponse.Body) {
                const body = await lockResponse.Body.transformToString()
                const lockMetadata: LockMetadata = JSON.parse(body)

                // Check if lock has expired
                if (Date.now() > lockMetadata.expiresAt) {
                  expiredLocks.push(object.Key)
                }
              }
            } catch (error: unknown) {
              // If we can't read the lock, it might be corrupted - clean it up
              if (hasErrorName(error, 'NoSuchKey')) {
                continue
              }
              this.logger.warn(
                `Failed to read lock ${object.Key}, marking for cleanup:`,
                getErrorMessage(error)
              )
              expiredLocks.push(object.Key)
            }
          }

          // Delete expired locks in batches of 1000 (S3 limit)
          for (let i = 0; i < expiredLocks.length; i += 1000) {
            const batch = expiredLocks.slice(i, i + 1000)

            try {
              await this.s3Client.send(
                new DeleteObjectsCommand({
                  Bucket: this.bucket,
                  Delete: {
                    Objects: batch.map((key) => ({ Key: key })),
                    Quiet: true,
                  },
                })
              )
              this.logger.log(`Cleaned up ${batch.length} expired locks in batch`)
            } catch (error) {
              this.logger.warn(`Failed to delete batch of expired locks:`, error)
            }
          }
        }

        continuationToken = response.NextContinuationToken
      } while (continuationToken)
    } catch (error) {
      this.logger.error(error)
    }
  }

  private getLockKey(id: string): string {
    return `${this.keyPrefix}${id}.lock`
  }

  private createLockMetadata(lockId: string): LockMetadata {
    const now = Date.now()
    return {
      lockId,
      expiresAt: now + this.lockTtlMs,
      createdAt: now,
      renewedAt: now,
    }
  }

  private async checkAndCleanupExpiredLock(lockKey: string, signal: AbortSignal): Promise<boolean> {
    if (signal.aborted) {
      return false
    }

    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: lockKey,
        })
      )

      if (!response.Body) {
        return true // Lock doesn't exist, can proceed
      }

      const body = await response.Body.transformToString()
      const lockMetadata: LockMetadata = JSON.parse(body)

      // Check if lock has expired
      if (Date.now() > lockMetadata.expiresAt) {
        // Lock is expired, delete it
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: lockKey,
          })
        )
        return true
      }

      return false // Lock is still valid
    } catch (error: unknown) {
      if (hasErrorName(error, 'NoSuchKey')) {
        return true // Lock doesn't exist
      }
      throw error
    }
  }

  private sleep(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new Error('Aborted'))
        return
      }

      const timeout = setTimeout(resolve, ms)
      const onAbort = () => {
        clearTimeout(timeout)
        signal.removeEventListener('abort', onAbort)
        reject(new Error('Aborted'))
      }
      signal.addEventListener('abort', onAbort, { once: true })
    })
  }
}

function hasErrorName(error: unknown, name: string): error is LockerError {
  return !!error && typeof error === 'object' && 'name' in error && error.name === name
}

function getHttpStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') {
    return undefined
  }

  return (error as LockerError).$metadata?.httpStatusCode
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (error && typeof error === 'object' && typeof (error as LockerError).message === 'string') {
    return (error as LockerError).message as string
  }

  return String(error)
}

export class S3Lock implements Lock {
  private renewalTimer?: NodeJS.Timeout
  private isLocked = false
  private abortHandler?: () => void

  constructor(
    private readonly id: string,
    private readonly locker: S3Locker,
    private readonly notifier: LockNotifier
  ) {}

  async lock(stopSignal: AbortSignal, cancelReq: RequestRelease): Promise<void> {
    // Set up abort handler to clean up in case of abort
    this.abortHandler = () => {
      this.cleanup()
    }
    stopSignal.addEventListener('abort', this.abortHandler, { once: true })

    try {
      const acquired = await this.locker.acquireLock(this.id, stopSignal)

      if (!acquired || stopSignal.aborted) {
        this.cleanup()
        throw ERRORS.LockTimeout()
      }

      this.isLocked = true

      // Start renewal timer
      this.startRenewal(cancelReq)

      // Listen for lock release requests from other instances
      this.notifier.onRelease(this.id, () => {
        return cancelReq()
      })
    } catch (error) {
      this.cleanup()
      throw error
    }
  }

  async unlock(): Promise<void> {
    if (!this.isLocked) {
      return
    }

    this.isLocked = false
    this.cleanup()

    try {
      await this.locker.releaseLock(this.id)
    } catch (error) {
      this.locker.getLogger().error('Failed to release S3 lock:', error)
    }
  }

  private startRenewal(cancelReq: RequestRelease): void {
    const renewalInterval = this.locker.getRenewalInterval()

    this.renewalTimer = setInterval(async () => {
      if (!this.isLocked) {
        this.stopRenewal()
        return
      }

      try {
        const renewed = await this.locker.renewLock(this.id)
        if (!renewed) {
          this.locker
            .getLogger()
            .warn(`Failed to renew lock for ${this.id}, lock may have been stolen or expired`)

          await cancelReq()
        }
      } catch {
        await cancelReq()
      }
    }, renewalInterval)
  }

  private stopRenewal(): void {
    if (this.renewalTimer) {
      clearInterval(this.renewalTimer)
      this.renewalTimer = undefined
    }
  }

  private cleanup(): void {
    this.stopRenewal()
    this.notifier.unsubscribe(this.id)

    // Clean up abort handler
    if (this.abortHandler) {
      this.abortHandler = undefined
    }
  }
}
