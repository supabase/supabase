import 'server-only'

interface HubSpotField {
  objectTypeId: string
  name: string
  value: string
}

interface HubSpotSubmission {
  fields: HubSpotField[]
  context?: {
    pageUri?: string
    pageName?: string
  }
  legalConsentOptions?: {
    consent: {
      consentToProcess: boolean
      text: string
    }
  }
}

export interface HubSpotConfig {
  portalId: string
  formGuid: string
}

export class HubSpotClient {
  private portalId: string
  private formGuid: string

  constructor(config: HubSpotConfig) {
    if (!config.portalId) throw new Error('HubSpotClient: portalId is required')
    if (!config.formGuid) throw new Error('HubSpotClient: formGuid is required')

    this.portalId = config.portalId
    this.formGuid = config.formGuid
  }

  async submitForm(
    fields: Record<string, string>,
    options?: {
      pageUri?: string
      pageName?: string
      consent?: string
    }
  ): Promise<void> {
    // Field keys are plain HubSpot Contact property names (e.g. `firstname`)
    // by default. A key may instead be prefixed `{objectTypeId}/{property}`
    // (e.g. `0-2/name` for the Company object's `name` property) to target a
    // property on an object other than Contact — this mirrors how HubSpot
    // itself identifies associated-object fields in its own API error
    // messages ("Error in 'fields.0-2/name'...").
    const hubspotFields: HubSpotField[] = Object.entries(fields).map(([key, value]) => {
      const slashIndex = key.indexOf('/')
      if (slashIndex === -1) {
        return { objectTypeId: '0-1', name: key, value }
      }
      return {
        objectTypeId: key.slice(0, slashIndex),
        name: key.slice(slashIndex + 1),
        value,
      }
    })

    const body: HubSpotSubmission = {
      fields: hubspotFields,
    }

    if (options?.pageUri || options?.pageName) {
      body.context = {
        pageUri: options.pageUri,
        pageName: options.pageName,
      }
    }

    if (options?.consent) {
      body.legalConsentOptions = {
        consent: {
          consentToProcess: true,
          text: options.consent,
        },
      }
    }

    // portalId comes from env; formGuid is validated at the zod layer to a
    // UUID-like shape, but encodeURIComponent keeps this safe even if the
    // client is constructed from an untrusted source.
    const response = await fetch(
      `https://api.hsforms.com/submissions/v3/integration/submit/${encodeURIComponent(
        this.portalId
      )}/${encodeURIComponent(this.formGuid)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HubSpot form submission failed: ${response.status} - ${errorText}`)
    }
  }
}
