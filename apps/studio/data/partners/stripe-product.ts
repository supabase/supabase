import { constructHeaders, fetchHandler } from 'data/fetchers'
import { API_URL } from 'lib/constants'
const BASE_API_URL = API_URL?.replace('/platform', '') ?? API_URL

export interface AccountRequestDetails {
  id: string
  email: string
  name?: string
  scopes?: string[]
  status: string
  orchestrator: {
    type: string
    stripe?: { organisation?: string; account: string }
  }
  expires_at: string
  email_matches: boolean
}

export async function getAccountRequest(arId: string): Promise<AccountRequestDetails> {
  const safeArId = encodeURIComponent(arId)
  const headers = await constructHeaders()
  const response = await fetchHandler(
    `${BASE_API_URL}/partners/stripe/product/provisioning/account_requests/${safeArId}`,
    { headers }
  )

  const body = await response.json()
  if (!response.ok) {
    throw new Error(body?.message || `Failed to fetch account request: ${response.status}`)
  }

  return body
}

export async function confirmAccountRequest(
  arId: string
): Promise<{ success: boolean; organization_slug: string }> {
  const safeArId = encodeURIComponent(arId)
  const headers = await constructHeaders()
  headers.set('Content-Type', 'application/json')

  const response = await fetchHandler(
    `${BASE_API_URL}/partners/stripe/product/provisioning/account_requests/${safeArId}/confirm`,
    {
      method: 'POST',
      headers,
    }
  )

  const body = await response.json()
  if (!response.ok) {
    throw new Error(body?.message || `Failed to confirm account request: ${response.status}`)
  }

  return body
}
