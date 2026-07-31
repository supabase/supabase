import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createProjectSupabaseClient } from './project-supabase-client'
import * as apiKeysUtils from '@/data/api-keys/temp-api-keys-utils'

// Unlike project-supabase-client.test.ts, this file does not mock
// @supabase/supabase-js: the real client constructor must run.
vi.mock('@/data/api-keys/temp-api-keys-utils', () => ({
  getOrRefreshTemporaryApiKey: vi.fn(),
}))

// Supabase API key formats this client must accept.
const KEY_SHAPES = [
  ['temporary key', 'sb_temp_nonce1234567890ab_payload'],
  ['publishable key', 'sb_publishable_abc123'],
  ['secret key', 'sb_secret_abc123'],
  ['legacy JWT key', 'eyJhbGciOiJIUzI1NiJ9.payload.signature'],
]

describe('createProjectSupabaseClient key format contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each(KEY_SHAPES)('constructs a client with a %s', async (_label, apiKey) => {
    vi.mocked(apiKeysUtils.getOrRefreshTemporaryApiKey).mockResolvedValue({
      apiKey,
      expiryTimeMs: Date.now() + 3600000,
    })

    const client = await createProjectSupabaseClient('test-ref', 'https://test.supabase.co')

    expect(client).toBeDefined()
    expect(client.auth).toBeDefined()
  })
})
