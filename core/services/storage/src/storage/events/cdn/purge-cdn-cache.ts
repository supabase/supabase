import { logger, logSchema } from '@internal/monitoring'
import { BasePayload } from '@internal/queue'
import { CdnCacheManager, PurgeCacheInput } from '@storage/cdn/cdn-cache-manager'
import { Job, Queue, SendOptions, WorkOptions } from 'pg-boss'
import { BaseEvent } from '../base-event'

export interface PurgeCdnCachePayload extends BasePayload {
  purgeOptions: PurgeCacheInput
}

const cdnCacheManager = new CdnCacheManager()

export class PurgeCdnCache extends BaseEvent<PurgeCdnCachePayload> {
  static queueName = 'cdn:purge-cache'

  static getQueueOptions(): Queue {
    return {
      name: this.queueName,
      policy: 'exactly_once',
    }
  }

  static getWorkerOptions(): WorkOptions {
    return {
      includeMetadata: true,
    }
  }

  static getSendOptions(payload: PurgeCdnCachePayload): SendOptions {
    const { purgeOptions } = payload
    const singletonKey = [
      purgeOptions.type,
      purgeOptions.tenant,
      'bucket' in purgeOptions ? purgeOptions.bucket : undefined,
      'objectName' in purgeOptions ? purgeOptions.objectName : undefined,
    ]
      .filter(Boolean)
      .join('/')

    return {
      singletonKey,
      retryLimit: 5,
      retryDelay: 5,
      priority: 10,
    }
  }

  static async handle(job: Job<PurgeCdnCachePayload>) {
    if (!cdnCacheManager.isConfigured()) {
      // exit early if cdn cache manager is not configured (missing CDN_PURGE_ENDPOINT_URL)
      return
    }

    try {
      await cdnCacheManager.purge(job.data.purgeOptions)
    } catch (e) {
      logSchema.error(logger, '[CDN] Failed to purge cache', {
        type: 'cdn',
        error: e,
        project: job.data.tenant.ref,
        sbReqId: job.data.sbReqId,
        metadata: JSON.stringify(job.data.purgeOptions),
      })
      throw e
    }
  }
}
