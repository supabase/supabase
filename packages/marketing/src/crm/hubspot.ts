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
    const hubspotFields: HubSpotField[] = Object.entries(fields).map(([name, value]) => ({
      objectTypeId: '0-1',
      name,
      value,
    }))

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

    const response = await fetch(
      `https://api.hsforms.com/submissions/v3/integration/submit/${this.portalId}/${this.formGuid}`,
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
