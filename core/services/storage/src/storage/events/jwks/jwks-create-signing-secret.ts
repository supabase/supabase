import { JWK_ALGORITHM_FALLBACK } from '@internal/auth/jwks'
import { jwksManager } from '@internal/database'
import { logger, logSchema } from '@internal/monitoring'
import { BasePayload } from '@internal/queue'
import { Job, Queue, SendOptions, WorkOptions } from 'pg-boss'
import { UrlSigningJwkType } from '../../../config'
import { BaseEvent } from '../base-event'

interface JwksCreateSigningSecretPayload extends BasePayload {
  tenantId: string
  keyType: UrlSigningJwkType
}

export class JwksCreateSigningSecret extends BaseEvent<JwksCreateSigningSecretPayload> {
  static queueName = 'tenants-jwks-create-v2'

  static getQueueOptions(): Queue {
    return {
      name: this.queueName,
      policy: 'exactly_once',
    } as const
  }

  static getWorkerOptions(): WorkOptions {
    return {
      includeMetadata: true,
    }
  }

  static getSendOptions(payload: JwksCreateSigningSecretPayload): SendOptions {
    return {
      expireInHours: 2,
      singletonKey: payload.tenantId,
      retryLimit: 3,
      retryDelay: 5,
      priority: 10,
    }
  }

  static async handle(job: Job<JwksCreateSigningSecretPayload>) {
    const { tenantId, sbReqId, keyType } = job.data

    try {
      const { kid } = await jwksManager.generateUrlSigningJwk(
        tenantId,
        keyType || JWK_ALGORITHM_FALLBACK
      )

      logSchema.info(
        logger,
        `[Jwks] create new url signing secret (${kid}) for tenant ${tenantId}`,
        {
          type: 'jwks',
          project: tenantId,
          sbReqId,
        }
      )
    } catch (e) {
      logSchema.error(
        logger,
        `[Jwks] create new url signing secret failed for tenant ${tenantId}`,
        {
          type: 'jwks',
          error: e,
          project: tenantId,
          sbReqId,
        }
      )
      throw e
    }
  }
}
