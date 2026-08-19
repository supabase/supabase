import { describe, expect, it } from 'vitest'

import { convertProjectConfigToGitHubConfig } from './github-config-convert'

describe('convertProjectConfigToGitHubConfig', () => {
  it('returns an empty object when no dashboard config is provided', () => {
    expect(convertProjectConfigToGitHubConfig()).toEqual({})
  })

  it('maps registered fields onto their nested config.toml path', () => {
    const result = convertProjectConfigToGitHubConfig({
      auth: {
        site_url: 'https://example.com',
        disable_signup: false,
        mailer_otp_length: 6,
      },
      api: {
        max_rows: 1000,
      },
    })

    expect(result).toEqual({
      auth: {
        site_url: 'https://example.com',
        enable_signup: true,
        email: { otp_length: 6 },
      },
      api: { max_rows: 1000 },
    })
  })

  it('inverts booleans that config.toml expresses the opposite way', () => {
    const result = convertProjectConfigToGitHubConfig({
      auth: { disable_signup: true },
    })

    expect(result).toEqual({ auth: { enable_signup: false } })
  })

  it('omits secret-looking fields and fields without a registry entry', () => {
    const result = convertProjectConfigToGitHubConfig({
      auth: {
        sms_twilio_auth_token: 'super-secret',
        some_unregistered_field: 'value',
      },
    })

    expect(result).toEqual({})
  })

  it('skips sections that are absent from the dashboard config', () => {
    const result = convertProjectConfigToGitHubConfig({ database: { some_field: 'x' } })
    expect(result).toEqual({})
  })

  describe('auth.additional_redirect_urls', () => {
    it('splits the comma-separated list, then dedupes, trims and sorts it', () => {
      const result = convertProjectConfigToGitHubConfig({
        auth: { uri_allow_list: 'https://b.com, https://a.com ,https://b.com' },
      })

      expect(result).toEqual({
        auth: { additional_redirect_urls: ['https://a.com', 'https://b.com'] },
      })
    })

    it('maps an empty list to an empty array, not to an absent field', () => {
      const result = convertProjectConfigToGitHubConfig({ auth: { uri_allow_list: '' } })

      expect(result).toEqual({ auth: { additional_redirect_urls: [] } })
    })

    it('omits the field when the dashboard has no list at all', () => {
      const result = convertProjectConfigToGitHubConfig({ auth: { site_url: 'https://a.com' } })

      expect(result).toEqual({ auth: { site_url: 'https://a.com' } })
    })
  })

  it('leaves order-sensitive comma lists in their original order', () => {
    // Only the redirect allow-list is a set — `extra_search_path` order is meaningful to Postgres.
    const result = convertProjectConfigToGitHubConfig({
      api: { db_extra_search_path: 'public, extensions, auth' },
    })

    expect(result).toEqual({ api: { extra_search_path: ['public', 'extensions', 'auth'] } })
  })
})
