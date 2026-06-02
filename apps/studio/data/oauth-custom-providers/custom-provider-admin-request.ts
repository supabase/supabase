import { getOrRefreshTemporaryApiKey } from '@/data/api-keys/temp-api-keys-utils'
import { handleError } from '@/data/fetchers'

/**
 * Keeps the structural `custom:` prefix literal while still encoding the
 * user-controlled slug, e.g. `custom:naver` -> `custom:naver`,
 * `custom:my provider` -> `custom:my%20provider`.
 */
function encodeCustomProviderIdentifier(identifier: string) {
  const slug = identifier.replace(/^custom:/i, '')
  return `custom:${encodeURIComponent(slug)}`
}

function extractErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object') {
    if ('msg' in payload && typeof payload.msg === 'string') return payload.msg
    if ('message' in payload && typeof payload.message === 'string') return payload.message
    if ('error_description' in payload && typeof payload.error_description === 'string') {
      return payload.error_description
    }
  }
  return fallback
}

/**
 * Performs a raw request against the GoTrue custom-providers admin endpoint.
 *
 * We bypass the auth-js SDK's `customProviders.updateProvider` / `deleteProvider`
 * helpers here because they run the identifier through `encodeURIComponent`
 * (supabase-js#2383), which turns the required `custom:` prefix into `custom%3A`.
 * The GoTrue endpoint does not decode the path segment, so the encoded colon
 * fails its `identifier must start with 'custom:'` validation.
 *
 * TODO: remove this and return to the SDK helpers once GoTrue decodes the
 * custom-provider path segment (supabase-js#2383).
 */
export async function customProviderAdminRequest({
  method,
  projectRef,
  clientEndpoint,
  identifier,
  body,
}: {
  method: 'PUT' | 'DELETE'
  projectRef: string
  clientEndpoint: string
  identifier: string
  body?: unknown
}) {
  const { apiKey } = await getOrRefreshTemporaryApiKey(projectRef)
  const path = encodeCustomProviderIdentifier(identifier)

  const response = await fetch(`${clientEndpoint}/auth/v1/admin/custom-providers/${path}`, {
    method,
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })

  if (!response.ok) {
    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      // response had no JSON body
    }
    handleError({
      message: extractErrorMessage(payload, `Request failed with status ${response.status}`),
      code: response.status,
    })
  }

  if (method === 'DELETE') return null

  try {
    return await response.json()
  } catch {
    return null
  }
}
