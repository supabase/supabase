import * as configcat from 'configcat-js'

let client: configcat.IConfigCatClient

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

async function getClient() {
  if (client) return client

  const proxyUrl = process.env.NEXT_PUBLIC_CONFIGCAT_PROXY_URL
  const sdkKey = process.env.NEXT_PUBLIC_CONFIGCAT_SDK_KEY

  if (!sdkKey && !proxyUrl) {
    console.log('Skipping ConfigCat set up as env vars are not present')
    return undefined
  }

  const options = { pollIntervalSeconds: 7 * 60 } // 7 minutes

  try {
    if (proxyUrl) {
      const proxyClient = configcat.getClient(
        'configcat-proxy/frontend-v2',
        configcat.PollingMode.AutoPoll,
        { ...options, baseUrl: proxyUrl }
      )
      const cacheState = await proxyClient.waitForReady()

      if (cacheState !== configcat.ClientCacheState.NoFlagData) {
        client = proxyClient
        return client
      }

      proxyClient.dispose()
    }

    if (sdkKey) {
      client = configcat.getClient(sdkKey, configcat.PollingMode.AutoPoll, options)
      return client
    }

    console.error('ConfigCat proxy unreachable and SDK key is missing')
    return undefined
  } catch (error: any) {
    console.error(`Failed to get ConfigCat client: ${error.message}`)
    return undefined
  }
}

export async function getFlags(userEmail: string = '', customAttributes?: Record<string, string>) {
  const client = await getClient()
  const _customAttributes = {
    ...customAttributes,
    is_staff: !!userEmail ? userEmail.includes('@supabase.').toString() : 'false',
  }

  if (!client) {
    return []
  }

  await client.waitForReady()

  if (userEmail) {
    return client.getAllValuesAsync(
      new configcat.User(userEmail, undefined, undefined, _customAttributes)
    )
  } else {
    return client.getAllValuesAsync(
      new configcat.User('anonymous', undefined, undefined, _customAttributes)
    )
  }
}
