import { isS3Error } from '@internal/errors'
import { logger, logSchema } from '@internal/monitoring'
import { BasePayload } from '@internal/queue'
import { SYNC_JOB_ID } from '@internal/queue/constants'
import { isMissingBackendObject, S3Backend } from '@storage/backend'
import { JobWithMetadata, Queue, SendOptions, WorkOptions } from 'pg-boss'
import { getConfig } from '../../../config'
import { BaseEvent } from '../base-event'

const { storageS3Bucket } = getConfig()

interface BackupObjectEventPayload extends BasePayload {
  name: string
  bucketId: string
  version: string
  size: number
  deleteOriginal?: boolean
}

export class BackupObjectEvent extends BaseEvent<BackupObjectEventPayload> {
  static queueName = 'backup-object'

  static getWorkerOptions(): WorkOptions {
    return {
      includeMetadata: true,
    }
  }

  static getQueueOptions(): Queue {
    return {
      name: this.queueName,
      policy: 'singleton',
    } as const
  }

  static getSendOptions(payload: BackupObjectEventPayload): SendOptions {
    return {
      singletonKey: `${payload.tenant.ref}/${payload.bucketId}/${payload.name}/${payload.version}`,
      retryLimit: 5,
      retryDelay: 5,
      priority: 10,
    }
  }

  static async handle(job: JobWithMetadata<BackupObjectEventPayload>) {
    const tenantId = job.data.tenant.ref
    const storage = await this.createStorage(job.data)

    const s3Key = storage.location.getKeyLocation({
      tenantId,
      bucketId: job.data.bucketId,
      objectName: job.data.name,
    })
    const backupKey = `__internal/${s3Key}/${job.data.version}`
    const logContext = {
      jobId: job.id,
      type: 'event' as const,
      event: 'BackupObject',
      objectPath: s3Key,
      objectVersion: job.data.version,
      backupKey,
      resources: [`${job.data.bucketId}/${job.data.name}`],
      tenantId,
      project: tenantId,
      reqId: job.data.reqId,
      sbReqId: job.data.sbReqId,
      payload: JSON.stringify(job.data),
    }

    try {
      if (!(storage.backend instanceof S3Backend)) {
        return
      }

      logSchema.event(logger, `[Admin]: BackupObject ${s3Key}`, logContext)

      try {
        await storage.backend.backup({
          sourceBucket: storageS3Bucket,
          destinationBucket: storageS3Bucket,
          sourceKey: `${s3Key}/${job.data.version}`,
          destinationKey: backupKey,
          size: job.data.size,
        })
      } catch (error) {
        if (
          !job.data.deleteOriginal ||
          !isS3Error(error) ||
          error.name !== 'NoSuchKey' ||
          error.$metadata.httpStatusCode !== 404
        ) {
          throw error
        }

        // A previous attempt may have deleted the source before losing its response.
        const backup = await storage.backend
          .headObject(storageS3Bucket, backupKey, undefined, { confirmMissing: true })
          .catch((backupError) => {
            if (!isMissingBackendObject(backupError)) throw backupError
          })
        if (!backup) {
          logger.warn(
            { ...logContext, outcome: 'source_and_backup_missing' },
            `[Admin]: BackupObjectEvent ${s3Key} - SKIPPED: source and backup are missing`
          )
          return
        }
        logger.info(
          { ...logContext, outcome: 'already_backed_up' },
          `[Admin]: BackupObjectEvent ${s3Key} - ALREADY BACKED UP`
        )
        return
      }

      if (job.data.deleteOriginal) {
        logSchema.event(logger, `[Admin]: DeleteOriginalObject ${s3Key}`, logContext)

        await storage.backend.deleteObject(storageS3Bucket, s3Key, job.data.version)
      }
    } catch (e) {
      logger.error({ ...logContext, error: e }, `[Admin]: BackupObjectEvent ${s3Key} - FAILED`)
      if (job.id !== SYNC_JOB_ID) throw e
    } finally {
      storage.db.destroyConnection()
    }
  }
}
