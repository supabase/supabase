import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getDevelopmentOperations } from './mcp'

vi.mock('./settings', () => ({
  getProjectSettings: vi.fn(),
}))

vi.mock('./generate-types', () => ({
  generateTypescriptTypes: vi.fn(),
}))

describe('api/self-hosted/mcp', () => {
  describe('getDevelopmentOperations.getPublishableKeys', () => {
    let getProjectSettingsMock: ReturnType<typeof vi.fn>

    beforeEach(async () => {
      vi.clearAllMocks()
      vi.unstubAllEnvs()
      const settings = await import('./settings')
      getProjectSettingsMock = vi.mocked(settings.getProjectSettings)
    })

    afterEach(() => {
      vi.unstubAllEnvs()
    })

    it('returns a publishable-typed key from SUPABASE_PUBLISHABLE_KEY when set', async () => {
      vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_abc')

      const ops = getDevelopmentOperations({})
      const keys = await ops.getPublishableKeys('default')

      expect(keys).toEqual([
        {
          api_key: 'sb_publishable_abc',
          name: 'publishable',
          type: 'publishable',
        },
      ])
      // When the env var is set we should short-circuit and never consult project settings.
      expect(getProjectSettingsMock).not.toHaveBeenCalled()
    })

    it('falls back to the anon key from project settings with type "legacy" when env var is unset', async () => {
      vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', '')
      getProjectSettingsMock.mockReturnValue({
        service_api_keys: [
          { api_key: 'service-key-value', name: 'service_role key', tags: 'service_role' },
          { api_key: 'anon-key-value', name: 'anon key', tags: 'anon' },
        ],
      })

      const ops = getDevelopmentOperations({})
      const keys = await ops.getPublishableKeys('default')

      expect(keys).toEqual([
        {
          api_key: 'anon-key-value',
          name: 'anon key',
          type: 'legacy',
        },
      ])
    })

    it('throws when env var is unset and the anon key is missing from project settings', async () => {
      vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', '')
      getProjectSettingsMock.mockReturnValue({
        service_api_keys: [
          { api_key: 'service-key-value', name: 'service_role key', tags: 'service_role' },
        ],
      })

      const ops = getDevelopmentOperations({})

      await expect(ops.getPublishableKeys('default')).rejects.toThrow(
        'Anon key not found in project settings'
      )
    })
  })
})
