// Utils ported from the SELECT conf website

import 'server-only'

interface CustomerioProfile {
  email: string
  firstName?: string
  lastName?: string
  [key: string]: unknown
}

interface CustomerioEvent {
  userId: string
  type: 'track'
  event: string
  properties: Record<string, unknown>
  timestamp: number
}

interface CustomerioCustomer {
  id: string
  email: string
  attributes: Record<string, unknown>
  created_at: number
  updated_at: number
}

export interface CustomerioSegment {
  id: number
  name: string
  description?: string
  created_at: number
  updated_at: number
}

interface TransactionalEmailRequest {
  transactional_message_id?: number | string
  template_id?: string
  to: string
  from?: string
  subject?: string
  body?: string
  message_data?: Record<string, unknown>
  identifiers?: {
    email?: string
    id?: string
  }
}

interface TransactionalEmailResponse {
  delivery_id: string
  queued_at: number
}

export class CustomerioTrackClient {
  private baseUrl = 'https://track.customer.io/api/v1'
  private auth: string

  constructor(
    private siteId: string,
    private apiKey: string
  ) {
    this.auth = btoa(`${siteId}:${apiKey}`)
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: unknown
  ): Promise<T> {
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
      console.error(`Customer.io API request failed: ${response.status} - ${errorText}`)
      console.error(`Request URL: ${this.baseUrl}${endpoint}`)
      console.error(`Request method: ${method}`)
      throw new Error(`Customer.io API request failed: ${response.status} - ${errorText}`)
    }

    if (response.headers.get('content-type')?.includes('application/json')) {
      return response.json()
    }

    return {} as T
  }

  async createOrUpdateProfile(
    email: string,
    attributes: Partial<CustomerioProfile> = {}
  ): Promise<void> {
    const profile = {
      email,
      ...attributes,
    }

    await this.makeRequest(`/customers/${encodeURIComponent(email)}`, 'PUT', profile)
  }

  async trackEvent(email: string, event: CustomerioEvent): Promise<void> {
    const { userId, ...eventPayload } = event
    void userId // Acknowledge unused variable

    const trackEventPayload = {
      name: eventPayload.event,
      data: eventPayload.properties,
      timestamp: eventPayload.timestamp,
    }

    await this.makeRequest(
      `/customers/${encodeURIComponent(email)}/events`,
      'POST',
      trackEventPayload
    )
  }

  isoToUnixTimestamp(isoString: string): number {
    return Math.floor(new Date(isoString).getTime() / 1000)
  }
}

export class CustomerioAppClient {
  private baseUrl = 'https://api.customer.io'
  private auth: string

  constructor(private apiKey: string) {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('Customer.io App API key is required')
    }
    this.auth = apiKey.trim()
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: unknown
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.auth}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Customer.io App API request failed: ${response.status} - ${errorText}`)
      console.error(`Request URL: ${this.baseUrl}${endpoint}`)
      console.error(`Request method: ${method}`)
      throw new Error(`Customer.io App API request failed: ${response.status} - ${errorText}`)
    }

    if (response.headers.get('content-type')?.includes('application/json')) {
      return response.json()
    }

    return {} as T
  }

  async getCustomer(email: string): Promise<CustomerioCustomer | null> {
    try {
      const response = await this.makeRequest<{
        results: CustomerioCustomer[]
      }>(`/v1/customers?email=${encodeURIComponent(email)}`, 'GET')

      // The API returns a results array, so we need to get the first customer
      if (response.results && response.results.length > 0) {
        return response.results[0]
      }

      return null
    } catch (error) {
      console.error('Customer.io customer lookup failed:', error)
      // If customer not found, return null instead of throwing
      if (error instanceof Error && error.message.includes('404')) {
        return null
      }
      throw error
    }
  }

  async getCustomerAttributes(email: string): Promise<Record<string, unknown> | null> {
    const customer = await this.getCustomer(email)
    if (!customer) {
      console.error('No customer found for email:', email)
      return null
    }

    if (!customer.id) {
      console.error('Customer found but has no ID:', customer)
      return null
    }

    console.log('Found customer with ID:', customer.id)

    // Now get the specific attributes for this customer
    try {
      const attributes = await this.makeRequest<Record<string, unknown>>(
        `/v1/customers/${customer.id}/attributes`,
        'GET'
      )
      return attributes
    } catch (error) {
      console.error('Failed to fetch customer attributes:', error)
      return null
    }
  }

  async getCustomerSegments(email: string): Promise<CustomerioSegment[]> {
    const customer = await this.getCustomer(email)
    if (!customer || !customer.id) {
      console.error('No customer found for email:', email)
      return []
    }

    try {
      const response = await this.makeRequest<{
        segments: CustomerioSegment[]
      }>(`/v1/customers/${customer.id}/segments`, 'GET')
      return response.segments || []
    } catch (error) {
      console.error('Failed to fetch customer segments:', error)
      return []
    }
  }

  async sendTransactionalEmail(
    request: TransactionalEmailRequest
  ): Promise<TransactionalEmailResponse> {
    try {
      const response = await this.makeRequest<TransactionalEmailResponse>(
        '/v1/send/email',
        'POST',
        request
      )
      return response
    } catch (error) {
      console.error('Failed to send transactional email:', error)
      throw error
    }
  }

  isoToUnixTimestamp(isoString: string): number {
    return Math.floor(new Date(isoString).getTime() / 1000)
  }
}
