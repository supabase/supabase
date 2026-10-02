import { getPostgresConnection, getServiceKeyUser } from '@internal/database'
import { createAgent } from '@internal/http'
import { logger } from '@internal/monitoring'
import { BasePayload, Event, Event as QueueBaseEvent, StaticThis } from '@internal/queue'
import { TenantLocation } from '@storage/locator'
import { getConfig } from '../../config'
import { createStorageBackend, StorageBackendAdapter } from '../backend'
import type { Database } from '../database'
import { StoragePgDB } from '../database'
import { Storage } from '../storage'

const { storageS3Bucket, storageS3MaxSockets, storageBackendType, region } = getConfig()

let storageBackend: StorageBackendAdapter | undefined = undefined
let Webhook: Awaited<typeof import('./lifecycle/webhook')>['Webhook'] | undefined = undefined

export abstract class BaseEvent<T extends Omit<BasePayload, '$version'>> extends QueueBaseEvent<T> {
  static onStart() {
    this.getOrCreateStorageBackend()
  }

  static onClose() {
    storageBackend?.close()
  }

  /**
   * Sends a message as a webhook
   * @param payload
   */
  static async sendWebhook<
    TPayload extends BasePayload & {
      bucketId: string
      name: string
    },
  >(this: StaticThis<TPayload>, payload: Omit<TPayload, '$version'>) {
    if (!Webhook) {
      Webhook = (await import('./lifecycle/webhook')).Webhook
    }
    const eventClass = this as typeof Event
    const eventType = eventClass.eventName()

    try {
      await Webhook.send({
        event: {
          type: eventType,
          region,
          $version: eventClass.version,
          applyTime: Date.now(),
          payload,
        },
        tenant: payload.tenant,
      })
    } catch (e) {
      logger.error(
        {
          error: e,
          sbReqId: payload.sbReqId,
          event: {
            type: eventType,
            $version: eventClass.version,
            applyTime: Date.now(),
            payload: JSON.stringify(payload),
          },
          tenant: payload.tenant,
        },
        `error sending webhook: ${eventType}`
      )
    }
  }

  protected static async createStorage(payload: BasePayload) {
    const adminUser = await getServiceKeyUser(payload.tenant.ref)
    const connectionOptions = {
      user: adminUser,
      superUser: adminUser,
      host: payload.tenant.host,
      tenantId: payload.tenant.ref,
      disableHostCheck: true,
    }

    const databaseOptions = {
      tenantId: payload.tenant.ref,
      host: payload.tenant.host,
      reqId: payload.reqId,
      sbReqId: payload.sbReqId,
    }

    const connection = await getPostgresConnection(connectionOptions)
    try {
      const db: Database = new StoragePgDB(connection, databaseOptions)
      return new Storage(this.getOrCreateStorageBackend(), db, new TenantLocation(storageS3Bucket))
    } catch (error) {
      connection.dispose()
      throw error
    }
  }

  protected static getOrCreateStorageBackend(monitor = false) {
    if (storageBackend) {
      return storageBackend
    }

    const httpAgent = createAgent('s3_worker', {
      maxSockets: storageS3MaxSockets,
    })

    storageBackend = createStorageBackend(storageBackendType, {
      httpAgent,
    })

    if (monitor) {
      httpAgent.monitor()
    }

    return storageBackend
  }
}
