import { logger, logSchema } from '@internal/monitoring'
import { BasePayload } from '@internal/queue'
import { Job, SendOptions, WorkOptions } from 'pg-boss'
import { getConfig } from '../../../config'
import { withOptionalVersion } from '../../backend'
import { Storage } from '../../index'
import { BaseEvent } from '../base-event'

export interface ObjectDeleteEvent extends BasePayload {
  name: string
  bucketId: string
  version?: string
}

const { storageS3Bucket } = getConfig()

export class ObjectAdminDelete extends BaseEvent<ObjectDeleteEvent> {
  static queueName = 'object:admin:delete'

  static getWorkerOptions(): WorkOptions {
    return {}
  }

  static getSendOptions(): SendOptions {
    return {
      priority: 10,
      expireInSeconds: 30,
    }
  }

  static async handle(job: Job<ObjectDeleteEvent>) {
    let storage: Storage | undefined = undefined

    try {
      storage = await this.createStorage(job.data)
      const version = job.data.version

      const s3Key = storage.location.getKeyLocation({
        tenantId: job.data.tenant.ref,
        bucketId: job.data.bucketId,
        objectName: job.data.name,
      })

      logSchema.event(logger, `[Admin]: ObjectAdminDelete ${s3Key}`, {
        jobId: job.id,
        type: 'event',
        event: 'ObjectAdminDelete',
        payload: JSON.stringify(job.data),
        objectPath: s3Key,
        resources: [`${job.data.bucketId}/${job.data.name}`],
        tenantId: job.data.tenant.ref,
        project: job.data.tenant.ref,
        reqId: job.data.reqId,
        sbReqId: job.data.sbReqId,
      })

      await storage.backend.deleteObjects(storageS3Bucket, [
        withOptionalVersion(s3Key, version),
        withOptionalVersion(s3Key, version) + '.info',
      ])
    } catch (e) {
      const s3Key = `${job.data.tenant.ref}/${job.data.bucketId}/${job.data.name}`

      logger.error(
        {
          error: e,
          jobId: job.id,
          type: 'event',
          event: 'ObjectAdminDelete',
          payload: JSON.stringify(job.data),
          objectPath: s3Key,
          objectVersion: job.data.version,
          tenantId: job.data.tenant.ref,
          project: job.data.tenant.ref,
          reqId: job.data.reqId,
          sbReqId: job.data.sbReqId,
        },
        `[Admin]: ObjectAdminDelete ${s3Key} - FAILED`
      )
      throw e
    } finally {
      if (storage) {
        storage.db.destroyConnection()
      }
    }
  }
}
