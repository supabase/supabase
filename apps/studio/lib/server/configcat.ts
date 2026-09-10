import { getClient, PollingMode, User } from '@configcat/sdk/node'

let serverClient: ReturnType<typeof getClient>

export type TrustedUserEmail = string & { readonly __trustedUserEmailBrand: never }

// Promotes an email to TrustedUserEmail. Only call this with an email whose origin is already
// verified — e.g. `claims.email` from a JWT that apiAuthenticate has confirmed — never with a
// raw request body/query param.
export function trustedUserEmail(email: string | undefined): TrustedUserEmail | undefined {
  return email as TrustedUserEmail | undefined
}

const STAFF_EMAIL_DOMAINS = ['supabase.com', 'supabase.io']

function isStaffEmail(email: string): boolean {
  const domain = email.slice(email.lastIndexOf('@') + 1).toLowerCase()
  return STAFF_EMAIL_DOMAINS.includes(domain)
}

function buildUser(userEmail?: TrustedUserEmail, customAttributes?: Record<string, string>) {
  const _customAttributes = {
    ...customAttributes,
    is_staff: (!!userEmail && isStaffEmail(userEmail)).toString(),
  }

  return new User(userEmail ?? 'anonymous', undefined, undefined, _customAttributes)
}

function getServerClient() {
  if (serverClient) return serverClient

  const proxyUrl = process.env.NEXT_PUBLIC_CONFIGCAT_PROXY_URL
  const sdkKey = process.env.NEXT_PUBLIC_CONFIGCAT_SDK_KEY

  if (!proxyUrl && !sdkKey) {
    console.log('Skipping server ConfigCat set up as env vars are not present')
    return undefined
  }

  try {
    if (proxyUrl) {
      serverClient = getClient('configcat-proxy/frontend-v2', PollingMode.LazyLoad, {
        baseUrl: proxyUrl,
      })
      return serverClient
    }

    if (sdkKey) {
      serverClient = getClient(sdkKey, PollingMode.LazyLoad)
      return serverClient
    }

    return undefined
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`Failed to get server ConfigCat client: ${message}`)
    return undefined
  }
}

export async function getServerFlags(
  userEmail?: TrustedUserEmail,
  customAttributes?: Record<string, string>
) {
  const client = getServerClient()

  if (!client) {
    return []
  }

  return client.getAllValuesAsync(buildUser(userEmail, customAttributes))
}
