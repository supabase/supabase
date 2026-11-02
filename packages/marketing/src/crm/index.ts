import 'server-only'

import { CustomerIOClient, type CustomerIOConfig } from './customerio'
import { HubSpotClient, type HubSpotConfig } from './hubspot'
import { NotionClient, type NotionConfig } from './notion'

export type { CustomerIOConfig } from './customerio'
export type { HubSpotConfig } from './hubspot'
export type { NotionConfig } from './notion'
export { CustomerIOClient } from './customerio'
export { HubSpotClient } from './hubspot'
export { NotionClient } from './notion'

export interface CRMConfig {
  hubspot?: HubSpotConfig
  customerio?: CustomerIOConfig
  notion?: NotionConfig
}

export interface CRMEventOptions {
  /** Email used as identifier */
  email: string
  /** Fields submitted to HubSpot form (key = HubSpot field name, value = field value) */
  hubspotFields?: Record<string, string>
  /** HubSpot form context */
  context?: { pageUri?: string; pageName?: string }
  /** Legal consent text for HubSpot */
  consent?: string
  /** Event name for Customer.io tracking */
  event?: string
  /** Properties attached to the Customer.io event */
  properties?: Record<string, unknown>
  /** Profile attributes to set on the Customer.io contact */
  customerioProfile?: Record<string, unknown>
  /** Notion page creation — values are keyed by Notion database column name */
  notion?: {
    databaseId: string
    properties: Record<string, unknown>
  }
}

export class CRMClient {
  private hubspot: HubSpotClient | null
  private customerio: CustomerIOClient | null
  private notion: NotionClient | null

  constructor(config: CRMConfig) {
    this.hubspot = config.hubspot ? new HubSpotClient(config.hubspot) : null
    this.customerio = config.customerio ? new CustomerIOClient(config.customerio) : null
    this.notion = config.notion ? new NotionClient(config.notion) : null
  }

  /**
   * Submit an event to configured providers in parallel.
   * Each provider is invoked only when both its client and its payload are present.
   */
  async submitEvent(options: CRMEventOptions): Promise<{ errors: Error[] }> {
    const promises: Promise<void>[] = []
    const errors: Error[] = []

    if (this.hubspot && options.hubspotFields) {
      const fields = { ...options.hubspotFields }
      if (!fields.email) fields.email = options.email

      promises.push(
        this.hubspot
          .submitForm(fields, {
            pageUri: options.context?.pageUri,
            pageName: options.context?.pageName,
            consent: options.consent,
          })
          .catch((err) => {
            errors.push(new Error(`HubSpot: ${err.message}`))
          })
      )
    }

    if (this.customerio && options.event) {
      promises.push(
        (async () => {
          try {
            if (options.customerioProfile) {
              await this.customerio!.identify(options.email, options.customerioProfile)
            }
            await this.customerio!.track(options.email, options.event!, {
              ...options.properties,
              email: options.email,
              submitted_at: new Date().toISOString(),
            })
          } catch (err: any) {
            errors.push(new Error(`Customer.io: ${err.message}`))
          }
        })()
      )
    }

    if (this.notion && options.notion) {
      const { databaseId, properties } = options.notion
      promises.push(
        this.notion.createDatabasePage(databaseId, properties).catch((err) => {
          errors.push(new Error(`Notion: ${err.message}`))
        })
      )
    }

    await Promise.all(promises)

    return { errors }
  }
}
