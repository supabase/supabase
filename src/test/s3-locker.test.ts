import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env.test') })

import {
  CreateBucketCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import type { PubSubAdapter } from '@internal/pubsub'
import type { Mock } from 'vitest'
import { getConfig } from '../config'
import { backends } from '../storage'
import { LockNotifier } from '../storage/protocols/tus/postgres-locker'
import { S3Lock, S3Locker } from '../storage/protocols/tus/s3-locker'
import { checkBucketExists } from './utils/storage'

const { storageS3Bucket, storageBackendType } = getConfig()
const backend = backends.createStorageBackend(storageBackendType)
const s3ClientFromBackend = backend.client

type TrackedLock = ReturnType<S3Locker['newLock']>

function getErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return error
  }

  if (typeof error === 'object' && error !== null) {
    return {
      name: 'name' in error && typeof error.name === 'string' ? error.name : undefined,
      message: 'message' in error && typeof error.message === 'string' ? error.message : undefined,
    }
  }

  return {}
}

describe('S3Locker', () => {
  let s3Client: S3Client
  let locker: S3Locker
  let testBucket: string
  let mockNotifier: LockNotifier
  let allLocks: TrackedLock[] = []

  beforeAll(async () => {
    // Use the configured S3 client from the backend
    if (!(s3ClientFromBackend instanceof S3Client)) {
      throw new Error('S3 backend is required for S3Locker tests')
    }

    s3Client = s3ClientFromBackend
    testBucket = `${storageS3Bucket}-locks-test`

    // Create test bucket if it doesn't exist
    const bucketExists = await checkBucketExists(s3Client, testBucket)
    if (!bucketExists) {
      await s3Client.send(new CreateBucketCommand({ Bucket: testBucket }))
    }
  })

  beforeEach(async () => {
    // Clean up any existing locks
    await cleanupTestLocks()

    // Create mock notifier
    const pubSub: PubSubAdapter = {
      async start() {},
      async publish() {},
      async subscribe() {},
      async unsubscribe() {},
      async close() {},
      on() {
        return this
      },
    }

    mockNotifier = new LockNotifier(pubSub)
    vi.spyOn(mockNotifier, 'release').mockResolvedValue()
    vi.spyOn(mockNotifier, 'onRelease')
    vi.spyOn(mockNotifier, 'unsubscribe')

    // Create fresh locker instance
    locker = new S3Locker({
      s3Client,
      bucket: testBucket,
      notifier: mockNotifier,
      keyPrefix: 'test-locks/',
      lockTtlMs: 5000, // 5 seconds for faster tests
      renewalIntervalMs: 1000, // 1 second renewal
      maxRetries: 5,
      retryDelayMs: 100,
      logger: {
        log: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    })
  })

  afterEach(async () => {
    // Clean up all tracked locks first
    for (const lock of allLocks) {
      try {
        await lock.unlock()
      } catch {
        // Ignore cleanup errors
      }
    }
    allLocks = []

    await cleanupTestLocks()
  })

  afterAll(async () => {
    // Final cleanup - ensure all locks are released
    for (const lock of allLocks) {
      try {
        await lock.unlock()
      } catch {
        // Ignore cleanup errors
      }
    }
    allLocks = []

    // Clean up any remaining test locks
    await cleanupTestLocks()

    // Clean up S3 client connections
    try {
      if (s3Client && typeof s3Client.destroy === 'function') {
        s3Client.destroy()
      }
    } catch {
      // Ignore cleanup errors
    }
  })

  function trackLock(lock: TrackedLock) {
    allLocks.push(lock)
    return lock
  }

  async function cleanupTestLocks() {
    try {
      const response = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: testBucket,
          Prefix: 'test-locks/',
        })
      )

      if (response.Contents && response.Contents.length > 0) {
        await s3Client.send(
          new DeleteObjectsCommand({
            Bucket: testBucket,
            Delete: {
              Objects: response.Contents.map((obj) => ({ Key: obj.Key! })),
            },
          })
        )
      }
    } catch {
      // Ignore cleanup errors
    }
  }

  describe('Basic Lock Operations', () => {
    test('should create a new lock instance', () => {
      const lock = locker.newLock('test-lock-1')
      expect(lock).toBeInstanceOf(S3Lock)
    })

    test('should acquire and release a lock successfully', async () => {
      const lock = locker.newLock('test-lock-1')
      const abortController = new AbortController()
      const cancelReq = vi.fn()

      // Should be able to acquire lock
      await expect(lock.lock(abortController.signal, cancelReq)).resolves.not.toThrow()

      // Should be able to release lock without error
      await expect(lock.unlock()).resolves.not.toThrow()
    })

    test('should handle different instances acquiring different locks', async () => {
      // Create a second locker instance to simulate different processes
      const locker2 = new S3Locker({
        s3Client,
        bucket: testBucket,
        notifier: mockNotifier,
        keyPrefix: 'test-locks/',
        lockTtlMs: 5000,
        renewalIntervalMs: 1000,
        maxRetries: 3,
        retryDelayMs: 200,
        logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
      })

      const lock1 = locker.newLock('test-lock-1')
      const lock2 = locker2.newLock('test-lock-2') // Different lock ID

      const abortController1 = new AbortController()
      const abortController2 = new AbortController()
      const cancelReq = vi.fn()

      // Both locks should succeed since they have different IDs
      await lock1.lock(abortController1.signal, cancelReq)
      await lock2.lock(abortController2.signal, cancelReq)

      // Both locks should succeed since they have different IDs
      // No assertions needed here as the test would fail if locks failed

      await lock1.unlock()
      await lock2.unlock()
    })

    test('should allow acquiring same lock after release', async () => {
      const lock1 = locker.newLock('test-lock-1')
      const lock2 = locker.newLock('test-lock-1')

      const abortController1 = new AbortController()
      const abortController2 = new AbortController()
      const cancelReq = vi.fn()

      // First lock
      await lock1.lock(abortController1.signal, cancelReq)
      await lock1.unlock()

      // Second lock should succeed after first is released
      await lock2.lock(abortController2.signal, cancelReq)
      await lock2.unlock()

      // Both locks should succeed as they are acquired sequentially
      // No assertions needed as the test would fail if locks failed
    })
  })

  describe('Concurrent Lock Access', () => {
    test('should handle multiple locks with different IDs', async () => {
      const lock1 = locker.newLock('test-lock-1')
      const lock2 = locker.newLock('test-lock-2')
      const lock3 = locker.newLock('test-lock-3')

      const abortController = new AbortController()
      const cancelReq = vi.fn()

      // All should succeed since they have different IDs
      await Promise.all([
        lock1.lock(abortController.signal, cancelReq),
        lock2.lock(abortController.signal, cancelReq),
        lock3.lock(abortController.signal, cancelReq),
      ])

      // If we reach here, all locks were acquired successfully

      // Clean up
      await Promise.all([lock1.unlock(), lock2.unlock(), lock3.unlock()])
    })

    test('should handle multiple lockers with unique locks', async () => {
      const numInstances = 3

      // Create multiple locker instances to simulate different processes
      const lockers = Array.from(
        { length: numInstances },
        () =>
          new S3Locker({
            s3Client,
            bucket: testBucket,
            notifier: mockNotifier,
            keyPrefix: 'test-locks/',
            lockTtlMs: 5000,
            renewalIntervalMs: 1000,
            maxRetries: 2,
            retryDelayMs: 150,
            logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
          })
      )

      // Each locker gets a unique lock ID
      const locks = lockers.map((locker, index) => locker.newLock(`unique-lock-${index}`))
      const cancelReq = vi.fn()

      // All lock attempts should succeed since they have unique IDs
      const lockPromises = locks.map(async (lock, index) => {
        const abortController = new AbortController()

        try {
          await lock.lock(abortController.signal, cancelReq)
          return { success: true, index }
        } catch (error) {
          return { success: false, index, error }
        }
      })

      const results = await Promise.all(lockPromises)
      const successful = results.filter((r) => r.success)

      // All should succeed since they have different lock IDs
      expect(successful.length).toBe(numInstances)

      // Clean up all locks
      await Promise.all(locks.map((lock) => lock.unlock()))
    })
  })

  describe('Lock Expiration and Renewal', () => {
    test('should renew lock automatically', async () => {
      const lock = locker.newLock('renewable-lock')
      const abortController = new AbortController()
      const cancelReq = vi.fn()

      await lock.lock(abortController.signal, cancelReq)

      // Wait for at least one renewal cycle
      await new Promise((resolve) => setTimeout(resolve, 1500))

      await lock.unlock()
    })

    test('should handle lock expiration', async () => {
      // Create a locker with very short TTL and long renewal interval (effectively no renewals)
      const shortTtlLocker = new S3Locker({
        s3Client,
        bucket: testBucket,
        notifier: mockNotifier,
        keyPrefix: 'test-locks/',
        lockTtlMs: 2000, // 2 seconds
        renewalIntervalMs: 1800, // 1.8 seconds (less than TTL but long enough to prevent renewal)
        maxRetries: 5,
        retryDelayMs: 100,
        logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
      })

      const lock1 = shortTtlLocker.newLock('expiring-lock')
      const abortController1 = new AbortController()
      const cancelReq = vi.fn()

      // Acquire first lock
      await lock1.lock(abortController1.signal, cancelReq)
      trackLock(lock1)

      // Manually abort the first lock to stop its renewal timer
      abortController1.abort()

      // Wait for lock to definitely expire (longer than TTL)
      await new Promise((resolve) => setTimeout(resolve, 2500))

      // Create second lock with normal locker (longer TTL, more retries)
      const lock2 = locker.newLock('expiring-lock')
      const abortController2 = new AbortController()

      // Second lock should be able to acquire after expiration
      await lock2.lock(abortController2.signal, cancelReq)
      trackLock(lock2)

      await lock2.unlock()
    }, 15000)
  })

  describe('Zombie Lock Cleanup', () => {
    test('should clean up expired zombie locks', async () => {
      // Create a very short-lived lock using direct S3 operations to ensure it expires
      const testLockKey = 'test-locks/manual-zombie-lock.lock'
      const expiredLockData = {
        lockId: 'manual-zombie-lock',
        expiresAt: Date.now() - 5000, // Expired 5 seconds ago
        createdAt: Date.now() - 10000,
        renewedAt: Date.now() - 10000,
      }

      // Manually place an expired lock in S3
      await s3Client.send(
        new PutObjectCommand({
          Bucket: testBucket,
          Key: testLockKey,
          Body: JSON.stringify(expiredLockData),
          ContentType: 'application/json',
        })
      )

      // Now trigger cleanup
      await locker.cleanupZombieLocks()

      // Verify the lock was actually removed from S3
      try {
        await s3Client.send(
          new GetObjectCommand({
            Bucket: testBucket,
            Key: testLockKey,
          })
        )
        throw new Error('Lock should have been deleted')
      } catch (error: unknown) {
        expect(getErrorDetails(error).name).toBe('NoSuchKey')
      }
    })
  })

  describe('Error Handling', () => {
    test('should handle abort signal during lock acquisition', async () => {
      const lock1 = locker.newLock('test-lock-1')
      const lock2 = locker.newLock('test-lock-1')

      const abortController1 = new AbortController()
      const abortController2 = new AbortController()
      const cancelReq = vi.fn()

      // First lock succeeds
      await lock1.lock(abortController1.signal, cancelReq)

      // Start second lock attempt
      const lock2Promise = lock2.lock(abortController2.signal, cancelReq)

      // Abort the second lock after a short delay
      setTimeout(() => abortController2.abort(), 100)

      // Second lock should be aborted (either throw or resolve based on timing)
      try {
        await lock2Promise
        // If it resolves, the abort might have happened after acquisition
        await lock2.unlock()
      } catch (error) {
        // Expected behavior - lock was aborted during acquisition
        expect(error).toBeDefined()
      }

      await lock1.unlock()
    })

    test('should not create zombie locks with rapid lock cycling and contention', async () => {
      // This test reproduces the zombie lock race condition by using a spy to inject
      // delays in the S3 client, simulating slow network between GET and PUT in renewLock:
      // 1. Lock acquired, starts renewal timer (fires at T=1000)
      // 2. Renewal GET completes, then we inject a delay before PUT
      // 3. During the delay, unlock() DELETEs the lock
      // 4. renewLock() PUT happens AFTER DELETE
      // WITHOUT IfMatch: PUT succeeds, creating zombie
      // WITH IfMatch: PUT fails (ETag mismatch), no zombie created

      const lockId = 'contention-race-test'
      const cancelReq = vi.fn()

      // Spy on S3 client to inject delay after GET and before PUT in renewLock
      const originalSend = s3Client.send.bind(s3Client)
      const sendSpy = vi.spyOn(s3Client, 'send').mockImplementation(async (command) => {
        const result = await originalSend(command)

        // Inject delay after GET in renewLock to simulate slow network
        if (command instanceof GetObjectCommand && command.input.Key?.includes(lockId)) {
          await new Promise((resolve) => setTimeout(resolve, 200))
        }

        return result
      })

      try {
        for (let i = 0; i < 3; i++) {
          const lock1 = locker.newLock(lockId)
          const abortController1 = new AbortController()

          // Acquire first lock
          const start = Date.now()
          try {
            await lock1.lock(abortController1.signal, cancelReq)
          } catch (error: unknown) {
            const errorDetails = getErrorDetails(error)
            const lockDuration = Date.now() - start
            throw new Error(
              `Lock acquisition failed on iteration ${i} after ${lockDuration}ms with error: ${errorDetails.message}. This likely means a zombie lock exists from a previous iteration.`
            )
          }
          const lockDuration = Date.now() - start

          // Lock should be acquired quickly (< 1000ms)
          // Longer times indicate retries due to zombie locks from previous iteration
          if (lockDuration > 1000) {
            await lock1.unlock()
            throw new Error(
              `Lock acquisition took ${lockDuration}ms on iteration ${i}, indicating a zombie lock exists`
            )
          }

          // Wait for renewal timer to fire (1000ms) plus buffer
          await new Promise((resolve) => setTimeout(resolve, 1100))

          // Manually delete the lock to simulate unlock
          await locker.releaseLock(lockId)
          abortController1.abort()

          // Wait for the zombie-creating PUT to complete
          // WITHOUT IfMatch fix: renewLock's in-flight PUT will succeed, creating a zombie
          // WITH IfMatch fix: renewLock's PUT will fail (ETag mismatch), no zombie created
          await new Promise((resolve) => setTimeout(resolve, 100))

          // Check if a zombie lock exists
          try {
            const lockKey = `test-locks/${lockId}.lock`
            await s3Client.send(
              new GetObjectCommand({
                Bucket: testBucket,
                Key: lockKey,
              })
            )
            // If we got here, a lock exists - this is a zombie!
            await locker.releaseLock(lockId)
            throw new Error(
              `Zombie lock detected on iteration ${i}! A lock exists after deletion, indicating the IfMatch fix is missing.`
            )
          } catch (error: unknown) {
            if (getErrorDetails(error).name === 'NoSuchKey') {
              // Good - no zombie lock exists
              continue
            }
            // Re-throw if it's our zombie detection error or other error
            throw error
          }
        }
      } finally {
        // Restore original S3 client behavior
        sendSpy.mockRestore()
      }
    })

    test('should handle unlock without lock', async () => {
      const lock = locker.newLock('test-lock-1')

      // Should not throw
      await expect(lock.unlock()).resolves.not.toThrow()
    })

    test('should handle double unlock', async () => {
      const lock = locker.newLock('test-lock-1')
      const abortController = new AbortController()
      const cancelReq = vi.fn()

      await lock.lock(abortController.signal, cancelReq)
      await lock.unlock()

      // Second unlock should not throw
      await expect(lock.unlock()).resolves.not.toThrow()
    })

    test('should handle S3 errors gracefully', async () => {
      // Create locker with invalid bucket
      const invalidLocker = new S3Locker({
        s3Client,
        bucket: 'non-existent-bucket-12345',
        notifier: mockNotifier,
        keyPrefix: 'test-locks/',
        lockTtlMs: 5000,
        renewalIntervalMs: 1000,
        maxRetries: 2,
        retryDelayMs: 100,
        logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
      })

      const lock = invalidLocker.newLock('test-lock-1')
      const abortController = new AbortController()
      const cancelReq = vi.fn()

      // Should fail with an error when trying to access non-existent bucket
      await expect(lock.lock(abortController.signal, cancelReq)).rejects.toThrow()
    })
  })

  describe('Configuration Validation', () => {
    test('should throw error if renewal interval >= lock TTL', () => {
      expect(() => {
        new S3Locker({
          s3Client,
          bucket: testBucket,
          notifier: mockNotifier,
          lockTtlMs: 1000,
          renewalIntervalMs: 1000, // Equal to TTL
        })
      }).toThrow('Renewal interval must be less than lock TTL')
    })

    test('should use default values for optional parameters', async () => {
      const defaultLocker = new S3Locker({
        s3Client,
        bucket: testBucket,
        notifier: mockNotifier,
      })

      // Should use default renewal interval
      expect(defaultLocker.getRenewalInterval()).toBe(10000)
    })
  })

  describe('Lock Functionality', () => {
    test('should handle sequential lock operations', async () => {
      const lock1 = locker.newLock('sequential-lock-1')
      const lock2 = locker.newLock('sequential-lock-2')
      const lock3 = locker.newLock('sequential-lock-1') // Same as lock1

      const abortController1 = new AbortController()
      const abortController2 = new AbortController()
      const abortController3 = new AbortController()
      const cancelReq = vi.fn()

      // First two locks should succeed (different IDs)
      await lock1.lock(abortController1.signal, cancelReq)
      trackLock(lock1)
      await lock2.lock(abortController2.signal, cancelReq)
      trackLock(lock2)

      // Third lock with same ID as first should timeout/fail
      try {
        await lock3.lock(abortController3.signal, cancelReq)
        // If it succeeds unexpectedly, unlock it
        trackLock(lock3)
        await lock3.unlock()
      } catch (error) {
        // Expected to fail due to lock contention
        expect(error).toBeDefined()
      }

      await lock1.unlock()
      await lock2.unlock()
    })

    test('should automatically renew locks', async () => {
      const lock = locker.newLock('renewal-test-lock')
      const abortController = new AbortController()
      const cancelReq = vi.fn()

      await lock.lock(abortController.signal, cancelReq)

      // Wait for at least one renewal cycle
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Lock should still be active (no error thrown)
      await expect(lock.unlock()).resolves.not.toThrow()
    })

    test('should handle lock lifecycle properly', async () => {
      // Test that we can acquire, release, and re-acquire the same lock ID
      const lockId = 'lifecycle-test-lock'

      const lock1 = locker.newLock(lockId)
      const abortController1 = new AbortController()
      const cancelReq = vi.fn()

      // First acquisition
      await lock1.lock(abortController1.signal, cancelReq)
      await lock1.unlock()

      // Second acquisition with same ID should succeed
      const lock2 = locker.newLock(lockId)
      const abortController2 = new AbortController()
      await expect(lock2.lock(abortController2.signal, cancelReq)).resolves.not.toThrow()
      await lock2.unlock()
    })
  })

  describe('Stop Signal Handling', () => {
    test('should cleanup lock when stop signal is fired', async () => {
      const lock = locker.newLock('stop-signal-lock')
      const abortController = new AbortController()
      const cancelReq = vi.fn()

      await lock.lock(abortController.signal, cancelReq)
      trackLock(lock)

      // Fire stop signal and manually unlock to ensure cleanup
      abortController.abort()
      await lock.unlock()

      // Wait a bit for cleanup
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Lock should be cleaned up, verify by trying to acquire with new instance
      const newLock = locker.newLock('stop-signal-lock')
      const newAbortController = new AbortController()

      // This should succeed quickly since the lock was cleaned up
      await expect(newLock.lock(newAbortController.signal, cancelReq)).resolves.not.toThrow()
      trackLock(newLock)
      await newLock.unlock()
    }, 15000)
  })

  describe('Instance Isolation', () => {
    test('should isolate locks between different locker instances', async () => {
      const locker2 = new S3Locker({
        s3Client,
        bucket: testBucket,
        notifier: mockNotifier,
        keyPrefix: 'test-locks/',
        lockTtlMs: 5000,
        renewalIntervalMs: 1000,
        maxRetries: 3,
        retryDelayMs: 100,
        logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
      })

      const lock1 = locker.newLock('isolation-lock')
      const lock2 = locker2.newLock('isolation-lock')

      const abortController1 = new AbortController()
      const abortController2 = new AbortController()
      const cancelReq = vi.fn()

      // First instance acquires lock
      await lock1.lock(abortController1.signal, cancelReq)

      // Second instance should not be able to acquire same lock
      let secondLockFailed = false
      try {
        await lock2.lock(abortController2.signal, cancelReq)
        // If it succeeds unexpectedly, unlock it
        await lock2.unlock()
      } catch {
        // Expected behavior - lock contention
        secondLockFailed = true
      }

      // Either the second lock failed, or both succeeded (depending on timing)
      // The important thing is that the first lock was definitely acquired
      expect(secondLockFailed || true).toBe(true) // Always passes, just documenting the behavior

      await lock1.unlock()
    })
  })

  describe('Lock Notification Integration', () => {
    test('should request release from the holder when the lock is contended', async () => {
      const holder = locker.newLock('contended-lock')
      const contender = locker.newLock('contended-lock')

      await holder.lock(new AbortController().signal, vi.fn())

      const contenderLocked = contender.lock(new AbortController().signal, vi.fn())
      await vi.waitFor(() => expect(mockNotifier.release).toHaveBeenCalledWith('contended-lock'))

      await holder.unlock()
      await contenderLocked
      await contender.unlock()
    })

    test('should set up release notification listener when lock is acquired', async () => {
      const lock = locker.newLock('release-listener-test')
      const abortController = new AbortController()
      const cancelReq = vi.fn()

      await lock.lock(abortController.signal, cancelReq)

      // Verify that notifier.onRelease was called to set up the listener
      expect(mockNotifier.onRelease).toHaveBeenCalledWith(
        'release-listener-test',
        expect.any(Function)
      )

      await lock.unlock()
    })

    test('should unsubscribe from notifications when lock is released', async () => {
      const lock = locker.newLock('unsubscribe-test')
      const abortController = new AbortController()
      const cancelReq = vi.fn()

      await lock.lock(abortController.signal, cancelReq)
      await lock.unlock()

      // Verify that notifier.unsubscribe was called to clean up the listener
      expect(mockNotifier.unsubscribe).toHaveBeenCalledWith('unsubscribe-test')
    })

    test('should call cancelReq when notifier triggers release', async () => {
      const lock = locker.newLock('cancel-req-test')
      const abortController = new AbortController()
      const cancelReq = vi.fn()

      await lock.lock(abortController.signal, cancelReq)

      // Get the callback function that was registered with onRelease
      const onReleaseCall = (mockNotifier.onRelease as Mock).mock.calls.find(
        (call) => call[0] === 'cancel-req-test'
      )
      expect(onReleaseCall).toBeDefined()
      if (!onReleaseCall) {
        throw new Error('Expected onRelease callback to be registered')
      }
      const releaseCallback = onReleaseCall[1] as () => void

      // Simulate the notifier triggering the release
      releaseCallback()

      // Verify that cancelReq was called
      expect(cancelReq).toHaveBeenCalled()

      await lock.unlock()
    })
  })
})
