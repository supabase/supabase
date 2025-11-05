import * as configcat from 'configcat-js'

let client: configcat.IConfigCatClient
const endpoint = '/configuration-files/configcat-proxy/frontend-v2/config_v6.json'

/**
 * To set up ConfigCat for another app
 * - Declare `FeatureFlagProvider` at the _app level
 * - Pass in `getFlags` as `getConfigCatFlags` into `FeatureFlagProvider`
 *   - [Joshen] Wondering if this should just be baked into FeatureFlagProvider, rather than passed as a prop
 * - Ensure that your app has the `NEXT_PUBLIC_CONFIGCAT_PROXY_URL` env var
 *   - [Joshen] Wondering if we can just set a default value for each env var, so can skip setting up env var in Vercel
 * - Verify that your flags are now loading by console logging `flagValues` in `FeatureFlagProvider`'s useEffect
 * - Can now use ConfigCat feature flags with the `useFlag` hook
 */

export const fetchHandler: typeof fetch = async (input, init) => {
  try {
    return await fetch(input, init)
  } catch (err: any) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      console.error(err)
      throw new Error('Unable to reach the server. Please check your network or try again later.')
    }
    throw err
  }
}

async function getClient() {
  if (client) return client

  if (!process.env.NEXT_PUBLIC_CONFIGCAT_SDK_KEY && !process.env.NEXT_PUBLIC_CONFIGCAT_PROXY_URL) {
    console.log('Skipping ConfigCat set up as env vars are not present')
    return undefined
  }

  const response = await fetchHandler(process.env.NEXT_PUBLIC_CONFIGCAT_PROXY_URL + endpoint)
  const options = { pollIntervalSeconds: 7 * 60 } // 7 minutes

  if (response.status !== 200) {
    if (!process.env.NEXT_PUBLIC_CONFIGCAT_SDK_KEY) {
      console.error('Failed to set up ConfigCat: SDK Key is missing')
      return undefined
    }

    // proxy is down, use default client
    client = configcat.getClient(
      process.env.NEXT_PUBLIC_CONFIGCAT_SDK_KEY ?? '',
      configcat.PollingMode.AutoPoll,
      options
    )
  } else {
    client = configcat.getClient('configcat-proxy/frontend-v2', configcat.PollingMode.AutoPoll, {
      ...options,
      baseUrl: process.env.NEXT_PUBLIC_CONFIGCAT_PROXY_URL,
    })
  }

  return client
}

export async function getFlags(userEmail: string = '', customAttributes?: Record<string, string>) {
  const client = await getClient()

  if (!client) {
    return []
  } else if (userEmail) {
    return client.getAllValuesAsync(
      new configcat.User(userEmail, undefined, undefined, customAttributes)
    )
  } else {
    return client.getAllValuesAsync(
      new configcat.User('anonymous', undefined, undefined, customAttributes)
    )
  }
}
