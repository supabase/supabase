import { JwksCreateSigningSecret } from '@storage/events'
import { getConfig, UrlSigningJwkType } from '../../../config'
import { jwksManager } from '../../database/tenant'
import { logger, logSchema } from '../../monitoring'

const { isMultitenant, pgQueueEnable } = getConfig()

export interface UrlSigningJwkGeneratorStatus {
  running: boolean
  sent: number
}

export class UrlSigningJwkGenerator {
  private static isRunning: boolean = false
  private static countSent: number = 0

  static getGenerationStatus(): UrlSigningJwkGeneratorStatus {
    return {
      running: UrlSigningJwkGenerator.isRunning,
      sent: UrlSigningJwkGenerator.countSent,
    }
  }

  /**
   * Generates url signing jwks for all tenants
   */
  static async generateUrlSigningJwksOnAllTenants({
    keyType,
    signal,
    sbReqId,
  }: {
    keyType: UrlSigningJwkType
    signal: AbortSignal
    sbReqId?: string
  }) {
    if (!pgQueueEnable || !isMultitenant || UrlSigningJwkGenerator.isRunning) {
      return
    }
    UrlSigningJwkGenerator.isRunning = true
    UrlSigningJwkGenerator.countSent = 0
    logSchema.info(logger, '[Jwks Generator] Generating url signing jwks for all tenants', {
      type: 'jwk-generator',
      sbReqId,
    })
    try {
      const tenants = jwksManager.listTenantsMissingUrlSigningJwk(signal)
      for await (const tenantBatch of tenants) {
        await JwksCreateSigningSecret.batchSend(
          tenantBatch.map((tenant) => {
            return new JwksCreateSigningSecret({
              tenantId: tenant,
              tenant: {
                host: '',
                ref: tenant,
              },
              keyType,
              sbReqId,
            })
          })
        )
        UrlSigningJwkGenerator.countSent += tenantBatch.length
      }

      logSchema.info(
        logger,
        `[Jwks Generator] Completed generation of url signing jwks for ${UrlSigningJwkGenerator.countSent} tenants`,
        {
          type: 'jwk-generator',
          sbReqId,
        }
      )
    } catch (e) {
      logSchema.error(logger, '[Jwks Generator] Error generating url signing jwks', {
        type: 'jwk-generator',
        error: e,
        metadata: JSON.stringify({
          completed: UrlSigningJwkGenerator.countSent,
        }),
        sbReqId,
      })
    }
    UrlSigningJwkGenerator.isRunning = false
  }
}
