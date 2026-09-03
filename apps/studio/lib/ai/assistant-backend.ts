import { useFlag } from 'common'

import { IS_PLATFORM } from '@/lib/constants'

function trimTrailingSlash(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed) return undefined
  return trimmed.replace(/\/$/, '')
}

export function getAssistantSupabaseUrl(): string | undefined {
  return trimTrailingSlash(process.env.NEXT_PUBLIC_ASSISTANT_SUPABASE_URL)
}

export function getAssistantPublishableKey(): string | undefined {
  return process.env.NEXT_PUBLIC_ASSISTANT_PUBLISHABLE_KEY?.trim() || undefined
}

export function getAssistantApiUrl(): string | undefined {
  return trimTrailingSlash(process.env.NEXT_PUBLIC_ASSISTANT_API_URL)
}

export function isAssistantBackendConfigured(): boolean {
  return Boolean(getAssistantSupabaseUrl() && getAssistantPublishableKey() && getAssistantApiUrl())
}

export function isAssistantSupabaseBackendEnabled({
  isPlatform,
  envEnabled,
  flag,
  isConfigured,
}: {
  isPlatform: boolean
  envEnabled: boolean
  flag: unknown
  isConfigured: boolean
}): boolean {
  if (!isConfigured) return false
  return isPlatform && (envEnabled || flag === true)
}

export function useAssistantSupabaseBackend() {
  // may log missing key — that's ok until the flag is registered in ConfigCat
  const flag = useFlag('assistantSupabaseBackend')
  const env = process.env.NEXT_PUBLIC_ASSISTANT_BACKEND === 'true'
  return isAssistantSupabaseBackendEnabled({
    isPlatform: IS_PLATFORM,
    envEnabled: env,
    flag,
    isConfigured: isAssistantBackendConfigured(),
  })
}

export function getAssistantOAuthStartUrl(orgSlug: string, returnTo: string): string | undefined {
  const apiUrl = getAssistantApiUrl()
  if (!apiUrl) return undefined
  const params = new URLSearchParams({ org_slug: orgSlug, return_to: returnTo })
  return `${apiUrl}/oauth/start?${params.toString()}`
}
