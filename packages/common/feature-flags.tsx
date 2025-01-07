import { FlagValues } from '@vercel/flags/react'
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react'

import { components } from 'api-types'
import { useUser } from './auth'
import { IS_PLATFORM, LOCAL_STORAGE_KEYS } from './constants'
import { get, post } from './fetchWrappers'

type TrackFeatureFlagVariables = components['schemas']['TelemetryFeatureFlagBodyDto']
export type CallFeatureFlagsResponse = components['schemas']['TelemetryCallFeatureFlagsResponseDto']

export async function getFeatureFlags(API_URL: string) {
  if (!IS_PLATFORM) return undefined
  const data = await get(`${API_URL}/telemetry/feature-flags`)

  return data as CallFeatureFlagsResponse
}

export async function trackFeatureFlag(API_URL: string, body: TrackFeatureFlagVariables) {
  const consent =
    (typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
      : null) === 'true'

  if (!consent || !IS_PLATFORM) return undefined
  await post(`${API_URL}/telemetry/feature-flags/track`, { body })
}

export type FeatureFlagContextType = {
  API_URL?: string
  configcat: { [key: string]: boolean | string }
  posthog: CallFeatureFlagsResponse
}

const FeatureFlagContext = createContext<FeatureFlagContextType>({
  API_URL: undefined,
  configcat: {},
  posthog: {},
})

function getCookies() {
  const pairs = document.cookie.split(';')
  let cookies: Record<string, string> = {}
  for (var i = 0; i < pairs.length; i++) {
    var [t_key, value] = pairs[i].split('=')
    const key = t_key.trim()

    cookies[key] = unescape(value)
  }
  return cookies
}

export const FeatureFlagProvider = ({
  API_URL,
  getConfigCatFlags,
  children,
}: PropsWithChildren<{
  API_URL: string
  getConfigCatFlags?: (
    userEmail?: string
  ) => Promise<{ settingKey: string; settingValue: boolean | number | string | null | undefined }[]>
}>) => {
  const user = useUser()

  const [store, setStore] = useState<FeatureFlagContextType>({
    API_URL,
    configcat: {},
    posthog: {},
  })

  useEffect(() => {
    let mounted = true

    async function processFlags() {
      if (!IS_PLATFORM) return

      const flagStore: FeatureFlagContextType = { configcat: {}, posthog: {} }

      // Load PH flags
      if (user?.email) {
        const flags = await getFeatureFlags(API_URL)
        if (flags) flagStore.posthog = flags
      }

      // Load ConfigCat flags
      if (typeof getConfigCatFlags === 'function') {
        const flagValues = await getConfigCatFlags(user?.email)
        let overridesCookieValue: Record<string, boolean> = {}
        try {
          const cookies = getCookies()
          overridesCookieValue = JSON.parse(cookies['vercel-flag-overrides'])
        } catch {}

        flagValues.forEach((item) => {
          flagStore['configcat'][item.settingKey] =
            overridesCookieValue[item.settingKey] ?? item.settingValue
        })
      }

      if (mounted) {
        setStore(flagStore)
      }
    }

    // [Joshen] getFlags get triggered everytime the tab refocuses but this should be okay
    // as per https://configcat.com/docs/sdk-reference/js/#polling-modes:
    // The polling downloads the config.json at the set interval and are stored in the internal cache
    // which subsequently all getValueAsync() calls are served from there
    processFlags()

    return () => {
      mounted = false
    }
  }, [user?.email])

  return (
    <FeatureFlagContext.Provider value={store}>
      {/* 
        [Joshen] Just support configcat flags in Vercel flags for now for simplicity
        although I think it should be fairly simply to support PH too 
      */}
      <FlagValues values={store.configcat} />
      {children}
    </FeatureFlagContext.Provider>
  )
}

export const useFeatureFlags = () => {
  return useContext(FeatureFlagContext)
}
