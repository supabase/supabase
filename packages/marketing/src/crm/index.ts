import 'server-only'

import { CustomerIOClient, type CustomerIOConfig } from './customerio'
import { HubSpotClient, type HubSpotConfig } from './hubspot'

export type { CustomerIOConfig } from './customerio'
export type { HubSpotConfig } from './hubspot'
export { CustomerIOClient } from './customerio'
export { HubSpotClient } from './hubspot'

// --- Provider config types ---

interface HubSpotProviderConfig {
  hubspot: HubSpotConfig
  customerio?: never
}

interface CustomerIOProviderConfig {
  hubspot?: never
  customerio: CustomerIOConfig
}

interface BothProvidersConfig {
  hubspot: HubSpotConfig
  customerio: CustomerIOConfig
}

export type CRMConfig = HubSpotProviderConfig | CustomerIOProviderConfig | BothProvidersConfig

// --- Event option types per provider ---

interface HubSpotEventFields {
  /** Fields submitted to HubSpot form (key = HubSpot field name, value = field value) */
  hubspotFields: Record<string, string>
  /** HubSpot form context */
  context?: { pageUri?: string; pageName?: string }
  /** Legal consent text for HubSpot */
  consent?: string
}

interface CustomerIOEventFields {
  /** Event name for Customer.io tracking */
  event: string
  /** Properties attached to the Customer.io event */
  properties?: Record<string, unknown>
  /** Profile attributes to set on the Customer.io contact */
  customerioProfile?: Record<string, unknown>
}

type BaseEventOptions = {
  /** Email used as identifier */
  email: string
}

type SubmitEventFor<T extends CRMConfig> = BaseEventOptions &
  (T extends { hubspot: HubSpotConfig } ? HubSpotEventFields : Partial<HubSpotEventFields>) &
  (T extends { customerio: CustomerIOConfig }
    ? CustomerIOEventFields
    : Partial<CustomerIOEventFields>)

export class CRMClient<T extends CRMConfig = CRMConfig> {
  private hubspot: HubSpotClient | null
  private customerio: CustomerIOClient | null

  constructor(config: T) {
    this.hubspot = config.hubspot ? new HubSpotClient(config.hubspot) : null
    this.customerio = config.customerio ? new CustomerIOClient(config.customerio) : null
  }

  /**
   * Submit an event to configured providers in parallel.
   * Required fields are determined by which providers were configured.
   */
  async submitEvent(options: SubmitEventFor<T>): Promise<{ errors: Error[] }> {
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

    await Promise.all(promises)

    return { errors }
  }
}
