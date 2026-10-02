import { JWK_ALGORITHM_FALLBACK } from '@internal/auth/jwks'
import { jwksManager } from '@internal/database'
import { logger, logSchema } from '@internal/monitoring'
import { BasePayload } from '@internal/queue'
import { Job, Queue, SendOptions, WorkOptions } from 'pg-boss'
import { UrlSigningJwkType } from '../../../config'
import { BaseEvent } from '../base-event'

interface JwksRollUrlSigningKeyPayload extends BasePayload {
  tenantId: string
  keyType: UrlSigningJwkType
}

export class JwksRollUrlSigningKey extends BaseEvent<JwksRollUrlSigningKeyPayload> {
  static queueName = 'tenants-jwks-roll-url-signing-key-v1'

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

  static getSendOptions(payload: JwksRollUrlSigningKeyPayload): SendOptions {
    return {
      expireInHours: 2,
      singletonKey: `jwks_roll_url_signing_key_${payload.tenantId}`,
      retryLimit: 3,
      retryDelay: 5,
      priority: 10,
    }
  }

  static async shouldSend() {
    return true
  }

  static async handle(job: Job<JwksRollUrlSigningKeyPayload>) {
    const { tenantId, sbReqId, keyType } = job.data

    try {
      const { oldKid, newKid } = await jwksManager.rollUrlSigningJwk(
        tenantId,
        keyType || JWK_ALGORITHM_FALLBACK
      )

      logSchema.info(
        logger,
        `[Jwks] rolled url signing key for tenant ${tenantId} (old: ${oldKid}, new: ${newKid})`,
        {
          type: 'jwks',
          project: tenantId,
          sbReqId,
        }
      )
    } catch (e) {
      logSchema.error(logger, `[Jwks] roll url signing key failed for tenant ${tenantId}`, {
        type: 'jwks',
        error: e,
        project: tenantId,
        sbReqId,
      })
      throw e
    }
  }
}
