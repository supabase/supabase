'use client'

import { components } from 'api-types'
import { FlagValues } from 'flags/react'
import { createContext, PropsWithChildren, useContext, useEffect, useRef, useState } from 'react'

import { useAuth } from './auth'
import { getFlags as getDefaultConfigCatFlags } from './configcat'
import { hasConsented } from './consent-state'
import { get, post } from './fetchWrappers'
import { ensurePlatformSuffix } from './helpers'
import { useParams } from './hooks'

type TrackFeatureFlagVariables = components['schemas']['TelemetryFeatureFlagBody']
export type CallFeatureFlagsResponse = components['schemas']['TelemetryCallFeatureFlagsResponse']

export async function getFeatureFlags(
  API_URL: string,
  options: { organizationSlug?: string; projectRef?: string } = {}
) {
  try {
    const url = new URL(`${ensurePlatformSuffix(API_URL)}/telemetry/feature-flags`)

    if (options.organizationSlug) {
      url.searchParams.set('organization_slug', options.organizationSlug)
    }

    if (options.projectRef) {
      url.searchParams.set('project_ref', options.projectRef)
    }

    const data = await get(url.toString())
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
  organizationSlug,
  projectRef,
  getConfigCatFlags,
  children,
}: PropsWithChildren<{
  API_URL?: string
  /** Accepts either `boolean` which controls all feature flags or `{ cc: boolean, ph: boolean }` for individual providers */
  enabled?: boolean | { cc: boolean; ph: boolean }
  organizationSlug?: string
  projectRef?: string
  /** Custom fetcher for ConfigCat flags if passing in custom attributes */
  getConfigCatFlags?: (
    userEmail?: string
  ) => Promise<{ settingKey: string; settingValue: boolean | number | string | null | undefined }[]>
}>) => {
  const { session, isLoading } = useAuth()
  const userEmail = session?.user?.email
  const params = useParams()
  const resolvedOrganizationSlug = organizationSlug ?? params.slug
  const resolvedProjectRef = projectRef ?? params.ref
  const lastSentGroupContextRef = useRef<string | null>(null)

  const [store, setStore] = useState<FeatureFlagContextType>({
    API_URL,
    configcat: {},
    posthog: {},
    hasLoaded: false,
  })

  useEffect(() => {
    let mounted = true

    async function ensureGroupContext() {
      if (!API_URL) return

      const userId = session?.user?.id
      if (!userId) return
      if (!hasConsented()) return

      if (!resolvedOrganizationSlug && !resolvedProjectRef) return

      const contextKey = [userId, resolvedOrganizationSlug ?? '', resolvedProjectRef ?? ''].join(
        '|'
      )
      if (lastSentGroupContextRef.current === contextKey) return

      try {
        await post(
          `${ensurePlatformSuffix(API_URL)}/telemetry/identify`,
          {
            user_id: userId,
            ...(resolvedOrganizationSlug && { organization_slug: resolvedOrganizationSlug }),
            ...(resolvedProjectRef && { project_ref: resolvedProjectRef }),
          },
          { headers: { Version: '2' } }
        )

        lastSentGroupContextRef.current = contextKey
      } catch {}
    }

    async function processFlags() {
      if (!enabled || isLoading) return

      const loadPHFlags =
        (enabled === true || (typeof enabled === 'object' && enabled.ph)) && !!API_URL
      const loadCCFlags = enabled === true || (typeof enabled === 'object' && enabled.cc)

      let flagStore: FeatureFlagContextType = { configcat: {}, posthog: {} }

      // Run both async operations in parallel
      const [flags, flagValues] = await Promise.all([
        loadPHFlags
          ? (async () => {
              await ensureGroupContext()
              return getFeatureFlags(API_URL, {
                organizationSlug: resolvedOrganizationSlug,
                projectRef: resolvedProjectRef,
              })
            })()
          : Promise.resolve({}),
        loadCCFlags
          ? typeof getConfigCatFlags === 'function'
            ? getConfigCatFlags(userEmail)
            : getDefaultConfigCatFlags(userEmail)
          : Promise.resolve([]),
      ])

      const isLocalDev = process.env.NODE_ENV === 'development'

      const safeParse = (
        value: string | undefined
      ): Record<string, boolean | number | string> => {
        if (!value) return {}
        try {
          return JSON.parse(value)
        } catch {
          return {}
        }
      }

      // Process PostHog flags if loaded
      if (Object.keys(flags).length > 0) {
        // Apply local dev overrides for PostHog flags
        if (isLocalDev) {
          try {
            const cookies = getCookies()
            const phOverrides = safeParse(cookies['x-ph-flag-overrides'])
            flagStore.posthog = { ...flags, ...phOverrides }
          } catch {
            flagStore.posthog = flags
          }
        } else {
          flagStore.posthog = flags
        }
      }

      // Process ConfigCat flags if loaded
      if (flagValues.length > 0) {
        let overridesCookieValue: Record<string, boolean | number | string> = {}

        try {
          const cookies = getCookies()
          // Merge overrides: vercel-flag-overrides first, then x-cc-flag-overrides (local only)
          // x-cc-flag-overrides takes precedence in local dev
          const vercelOverrides = safeParse(cookies['vercel-flag-overrides'])
          const ccOverrides = isLocalDev ? safeParse(cookies['x-cc-flag-overrides']) : {}

          overridesCookieValue = {
            ...vercelOverrides,
            ...ccOverrides, // local overrides take precedence
          }
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
  }, [
    enabled,
    isLoading,
    userEmail,
    API_URL,
    session?.user?.id,
    resolvedOrganizationSlug,
    resolvedProjectRef,
    getConfigCatFlags,
  ])

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

  // Flag store is empty means config cat is not loaded yet, return false
  if (isObjectEmpty(store)) {
    return false
  }

  if (store[name] === undefined) {
    console.error(`Flag key "${name}" does not exist in ConfigCat flag store`)
    return false
  }

  return store[name] as T
}
