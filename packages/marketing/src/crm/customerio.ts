import 'server-only'

export interface CustomerIOConfig {
  siteId: string
  apiKey: string
}

export class CustomerIOClient {
  private baseUrl = 'https://track.customer.io/api/v1'
  private auth: string

  constructor(config: CustomerIOConfig) {
    if (!config.siteId) throw new Error('CustomerIOClient: siteId is required')
    if (!config.apiKey) throw new Error('CustomerIOClient: apiKey is required')

    this.auth = btoa(`${config.siteId}:${config.apiKey}`)
  }

  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT',
    body?: unknown
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        Authorization: `Basic ${this.auth}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Customer.io API request failed: ${response.status} - ${errorText}`)
    }
  }

  async identify(email: string, attributes: Record<string, unknown> = {}): Promise<void> {
    await this.makeRequest(`/customers/${encodeURIComponent(email)}`, 'PUT', {
      email,
      ...attributes,
    })
  }

  async track(
    email: string,
    event: string,
    properties: Record<string, unknown> = {}
  ): Promise<void> {
    await this.makeRequest(`/customers/${encodeURIComponent(email)}/events`, 'POST', {
      name: event,
      data: properties,
      timestamp: Math.floor(Date.now() / 1000),
    })
  }
}
