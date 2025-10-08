'use client'

import { FlagValues } from 'flags/react'
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react'

import { components } from 'api-types'
import { useUser } from './auth'
import { getFlags as getDefaultConfigCatFlags } from './configcat'
import { hasConsented } from './consent-state'
import { get, post } from './fetchWrappers'
import { ensurePlatformSuffix } from './helpers'

type TrackFeatureFlagVariables = components['schemas']['TelemetryFeatureFlagBody']
export type CallFeatureFlagsResponse = components['schemas']['TelemetryCallFeatureFlagsResponse']

export async function getFeatureFlags(API_URL: string) {
  try {
    const data = await get(`${ensurePlatformSuffix(API_URL)}/telemetry/feature-flags`)
    return data as CallFeatureFlagsResponse
  } catch (error: any) {
    if (error.message.includes('Failed to fetch')) {
      console.error('Failed to fetch PH flags: API is not available')
    }
    throw error
  }
}

export async function trackFeatureFlag(API_URL: string, body: TrackFeatureFlagVariables) {
  const consent = hasConsented()

  if (!consent) return undefined
  await post(`${ensurePlatformSuffix(API_URL)}/telemetry/feature-flags/track`, { body })
}

export type FeatureFlagContextType = {
  API_URL?: string
  configcat: { [key: string]: boolean | number | string | null }
  posthog: CallFeatureFlagsResponse
  hasLoaded?: boolean
}

export const FeatureFlagContext = createContext<FeatureFlagContextType>({
  API_URL: undefined,
  configcat: {},
  posthog: {},
  hasLoaded: false,
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
  enabled = true,
  getConfigCatFlags,
  children,
}: PropsWithChildren<{
  API_URL?: string
  /** Accepts either `boolean` which controls all feature flags or `{ cc: boolean, ph: boolean }` for individual providers */
  enabled?: boolean | { cc: boolean; ph: boolean }
  /** Custom fetcher for ConfigCat flags if passing in custom attributes */
  getConfigCatFlags?: (
    userEmail?: string
  ) => Promise<{ settingKey: string; settingValue: boolean | number | string | null | undefined }[]>
}>) => {
  const user = useUser()

  const [store, setStore] = useState<FeatureFlagContextType>({
    API_URL,
    configcat: {},
    posthog: {},
    hasLoaded: false,
  })

  useEffect(() => {
    let mounted = true

    async function processFlags() {
      if (!enabled) return

      const loadPHFlags =
        (enabled === true || (typeof enabled === 'object' && enabled.ph)) && !!API_URL
      const loadCCFlags = enabled === true || (typeof enabled === 'object' && enabled.cc)

      let flagStore: FeatureFlagContextType = { configcat: {}, posthog: {} }

      // Run both async operations in parallel
      const [flags, flagValues] = await Promise.all([
        loadPHFlags ? getFeatureFlags(API_URL) : Promise.resolve({}),
        loadCCFlags
          ? typeof getConfigCatFlags === 'function'
            ? getConfigCatFlags(user?.email)
            : getDefaultConfigCatFlags(user?.email)
          : Promise.resolve([]),
      ])

      // Process PostHog flags if loaded
      if (Object.keys(flags).length > 0) {
        flagStore.posthog = flags
      }

      // Process ConfigCat flags if loaded
      if (flagValues.length > 0) {
        let overridesCookieValue: Record<string, boolean> = {}
        try {
          const cookies = getCookies()
          overridesCookieValue = JSON.parse(cookies['vercel-flag-overrides'])
        } catch {}

        flagValues.forEach((item) => {
          flagStore['configcat'][item.settingKey] =
            overridesCookieValue[item.settingKey] ??
            (item.settingValue === null ? null : item.settingValue ?? false)
        })
      }

      flagStore.hasLoaded = true

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
  }, [enabled, user?.email])

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

const isObjectEmpty = (obj: Object) => {
  return Object.keys(obj).length === 0
}

export function useFlag<T = boolean>(name: string) {
  const flagStore = useFeatureFlags()

  const store = flagStore.configcat

  if (!isObjectEmpty(store) && store[name] === undefined) {
    console.error(`Flag key "${name}" does not exist in ConfigCat flag store`)
    return false
  }
  return store[name] as T
}
