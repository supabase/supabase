import { StorageBackendError } from '@internal/errors'
import { SYNC_JOB_ID } from '@internal/queue/constants'
import { vi } from 'vitest'

const { createStorage, loggerError, loggerInfo, loggerWarn, logEvent, S3Backend } = vi.hoisted(
  () => ({
    createStorage: vi.fn(),
    loggerError: vi.fn(),
    loggerInfo: vi.fn(),
    loggerWarn: vi.fn(),
    logEvent: vi.fn(),
    S3Backend: class {},
  })
)

vi.mock('../../../config', () => ({
  getConfig: () => ({ storageS3Bucket: 'test-storage' }),
}))

vi.mock('../base-event', () => ({
  BaseEvent: class {
    static createStorage = createStorage
  },
}))

vi.mock('@internal/monitoring', () => ({
  logger: { error: loggerError, info: loggerInfo, warn: loggerWarn },
  logSchema: { event: logEvent },
}))

vi.mock('@storage/backend', async () => {
  const { isMissingBackendObject } = await import('../../backend/adapter')
  return { S3Backend, isMissingBackendObject }
})

import { BackupObjectEvent } from './backup-object'

const job = {
  id: 'backup-object-job',
  data: {
    tenant: { ref: 'tenant-a', host: 'tenant-a.example.test' },
    bucketId: 'bucket-a',
    name: 'object-a',
    version: 'version-a',
    size: 1,
  },
} as Parameters<typeof BackupObjectEvent.handle>[0]

const deleteJob = { ...job, data: { ...job.data, deleteOriginal: true } }
const backupKey = '__internal/tenant-a/bucket-a/object-a/version-a'
const missingSource = Object.assign(new Error('source missing'), {
  name: 'NoSuchKey',
  $metadata: { httpStatusCode: 404 },
})

describe('BackupObjectEvent', () => {
  const backup = vi.fn()
  const deleteObject = vi.fn()
  const headObject = vi.fn()
  const destroyConnection = vi.fn()

  beforeEach(() => {
    vi.resetAllMocks()
    const backend = Object.assign(new S3Backend(), {
      backup,
      deleteObject,
      headObject,
    })

    createStorage.mockResolvedValue({
      backend,
      db: { destroyConnection },
      location: {
        getKeyLocation: vi.fn().mockReturnValue('tenant-a/bucket-a/object-a'),
      },
    })
  })

  it('disposes the connection when skipping a non-S3 backend', async () => {
    createStorage.mockResolvedValue({
      backend: {},
      db: { destroyConnection },
      location: {
        getKeyLocation: vi.fn().mockReturnValue('tenant-a/bucket-a/object-a'),
      },
    })

    await expect(BackupObjectEvent.handle(job)).resolves.toBeUndefined()

    expect(destroyConnection).toHaveBeenCalledExactlyOnceWith()
    expect(logEvent).not.toHaveBeenCalled()
    expect(backup).not.toHaveBeenCalled()
    expect(headObject).not.toHaveBeenCalled()
  })

  it('rejects backup failures after logging them and disposing its database connection', async () => {
    const failure = new Error('backup failed')
    backup.mockRejectedValue(failure)

    await expect(BackupObjectEvent.handle(job)).rejects.toBe(failure)

    expect(loggerError).toHaveBeenCalledWith(
      expect.objectContaining({
        error: failure,
        jobId: 'backup-object-job',
        event: 'BackupObject',
      }),
      '[Admin]: BackupObjectEvent tenant-a/bucket-a/object-a - FAILED'
    )
    expect(destroyConnection).toHaveBeenCalledTimes(1)
  })

  it('logs synchronous backup failures and completes without deleting the source', async () => {
    const failure = Object.assign(new Error('Access denied'), {
      name: 'AccessDenied',
      $metadata: { httpStatusCode: 403 },
    })
    backup.mockRejectedValue(failure)

    await expect(
      BackupObjectEvent.handle({ ...deleteJob, id: SYNC_JOB_ID })
    ).resolves.toBeUndefined()

    expect(loggerError).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ error: failure, jobId: SYNC_JOB_ID, event: 'BackupObject' }),
      '[Admin]: BackupObjectEvent tenant-a/bucket-a/object-a - FAILED'
    )
    expect(deleteObject).not.toHaveBeenCalled()
    expect(destroyConnection).toHaveBeenCalledTimes(1)
  })

  it('backs up and then deletes the source', async () => {
    await expect(BackupObjectEvent.handle(deleteJob)).resolves.toBeUndefined()

    expect(backup).toHaveBeenCalledExactlyOnceWith({
      sourceBucket: 'test-storage',
      destinationBucket: 'test-storage',
      sourceKey: 'tenant-a/bucket-a/object-a/version-a',
      destinationKey: backupKey,
      size: job.data.size,
    })
    expect(deleteObject).toHaveBeenCalledExactlyOnceWith(
      'test-storage',
      'tenant-a/bucket-a/object-a',
      'version-a'
    )
    expect(headObject).not.toHaveBeenCalled()
  })

  it('accepts an existing backup when a retry finds the source already deleted', async () => {
    backup.mockRejectedValue(missingSource)
    headObject.mockResolvedValue({ size: job.data.size })

    await expect(BackupObjectEvent.handle(deleteJob)).resolves.toBeUndefined()

    expect(headObject).toHaveBeenCalledExactlyOnceWith('test-storage', backupKey, undefined, {
      confirmMissing: true,
    })
    expect(loggerInfo).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ backupKey, outcome: 'already_backed_up' }),
      expect.any(String)
    )
    expect(deleteObject).not.toHaveBeenCalled()
  })

  it('warns and completes when both the source and backup are missing', async () => {
    backup.mockRejectedValue(missingSource)
    headObject.mockRejectedValue(StorageBackendError.fromError(missingSource))

    await expect(BackupObjectEvent.handle(deleteJob)).resolves.toBeUndefined()

    expect(loggerWarn).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ backupKey, outcome: 'source_and_backup_missing' }),
      expect.any(String)
    )
    expect(loggerError).not.toHaveBeenCalled()
    expect(deleteObject).not.toHaveBeenCalled()
  })

  it.each([
    ['NoSuchBucket', 404],
    ['NoSuchKey', 503],
  ])('rejects %s/%s from the copy without checking for a backup', async (name, status) => {
    const failure = Object.assign(new Error(name), { name, $metadata: { httpStatusCode: status } })
    backup.mockRejectedValue(failure)

    await expect(BackupObjectEvent.handle(deleteJob)).rejects.toBe(failure)

    expect(headObject).not.toHaveBeenCalled()
  })

  it('rejects when the backup cannot be confirmed missing', async () => {
    const failure = StorageBackendError.fromError(
      Object.assign(new Error('NotFound'), { name: 'NotFound', $metadata: { httpStatusCode: 404 } })
    )
    backup.mockRejectedValue(missingSource)
    headObject.mockRejectedValue(failure)

    await expect(BackupObjectEvent.handle(deleteJob)).rejects.toBe(failure)

    expect(loggerWarn).not.toHaveBeenCalled()
  })

  it('rejects a missing source for backup-only jobs', async () => {
    backup.mockRejectedValue(missingSource)

    await expect(BackupObjectEvent.handle(job)).rejects.toBe(missingSource)

    expect(headObject).not.toHaveBeenCalled()
  })
})
