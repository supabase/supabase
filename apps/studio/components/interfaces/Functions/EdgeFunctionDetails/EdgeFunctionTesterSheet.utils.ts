import type { APIKey } from '@/data/api-keys/api-keys-query'

interface BuildEdgeFunctionTestHeadersArgs {
  publishableKey?: APIKey
  serviceKey?: APIKey
  testAuthorization?: string
  customHeaders: Record<string, string>
}

export function buildEdgeFunctionTestHeaders({
  publishableKey,
  serviceKey,
  testAuthorization,
  customHeaders,
}: BuildEdgeFunctionTestHeadersArgs) {
  const generatedHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (publishableKey?.api_key) {
    generatedHeaders.apikey = publishableKey.api_key
  }

  const hasCustomAuthorization = Object.keys(customHeaders).some(
    (key) => key.toLowerCase() === 'authorization' || key.toLowerCase() === 'x-test-authorization'
  )

  if (!hasCustomAuthorization) {
    if (testAuthorization) {
      generatedHeaders['x-test-authorization'] = testAuthorization
    } else if (!publishableKey?.api_key && serviceKey?.api_key) {
      generatedHeaders['x-test-authorization'] = `Bearer ${serviceKey.api_key}`
    }
  }

  return {
    ...generatedHeaders,
    ...customHeaders,
  }
}
