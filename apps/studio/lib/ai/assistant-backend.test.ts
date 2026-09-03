import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  isAssistantBackendConfigured,
  isAssistantSupabaseBackendEnabled,
} from './assistant-backend'

describe('isAssistantSupabaseBackendEnabled', () => {
  it('returns false when not on platform', () => {
    expect(
      isAssistantSupabaseBackendEnabled({
        isPlatform: false,
        envEnabled: true,
        flag: true,
        isConfigured: true,
      })
    ).toBe(false)
  })

  it('returns false when URL/key/API URL are missing even if flag and env are on', () => {
    expect(
      isAssistantSupabaseBackendEnabled({
        isPlatform: true,
        envEnabled: true,
        flag: true,
        isConfigured: false,
      })
    ).toBe(false)
  })

  it('returns true when the env override is on', () => {
    expect(
      isAssistantSupabaseBackendEnabled({
        isPlatform: true,
        envEnabled: true,
        flag: false,
        isConfigured: true,
      })
    ).toBe(true)
  })

  it('returns true when the feature flag is true', () => {
    expect(
      isAssistantSupabaseBackendEnabled({
        isPlatform: true,
        envEnabled: false,
        flag: true,
        isConfigured: true,
      })
    ).toBe(true)
  })

  it('returns false when neither env nor flag is on', () => {
    expect(
      isAssistantSupabaseBackendEnabled({
        isPlatform: true,
        envEnabled: false,
        flag: false,
        isConfigured: true,
      })
    ).toBe(false)
  })

  it('treats a non-boolean flag as off', () => {
    expect(
      isAssistantSupabaseBackendEnabled({
        isPlatform: true,
        envEnabled: false,
        flag: 'true',
        isConfigured: true,
      })
    ).toBe(false)
  })
})

describe('isAssistantBackendConfigured', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns false when env vars are missing', () => {
    vi.stubEnv('NEXT_PUBLIC_ASSISTANT_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_ASSISTANT_PUBLISHABLE_KEY', '')
    vi.stubEnv('NEXT_PUBLIC_ASSISTANT_API_URL', '')
    expect(isAssistantBackendConfigured()).toBe(false)
  })

  it('returns false when only the URL and key are set', () => {
    vi.stubEnv('NEXT_PUBLIC_ASSISTANT_SUPABASE_URL', 'http://localhost:54321')
    vi.stubEnv('NEXT_PUBLIC_ASSISTANT_PUBLISHABLE_KEY', 'sb_publishable_test')
    vi.stubEnv('NEXT_PUBLIC_ASSISTANT_API_URL', '')
    expect(isAssistantBackendConfigured()).toBe(false)
  })

  it('returns true when supabase URL, publishable key, and API URL are set', () => {
    vi.stubEnv('NEXT_PUBLIC_ASSISTANT_SUPABASE_URL', 'http://localhost:54321/')
    vi.stubEnv('NEXT_PUBLIC_ASSISTANT_PUBLISHABLE_KEY', 'sb_publishable_test')
    vi.stubEnv('NEXT_PUBLIC_ASSISTANT_API_URL', 'http://localhost:8787/')
    expect(isAssistantBackendConfigured()).toBe(true)
  })
})
