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

  it('applies the normalizeDashboardValue transform for inverted booleans', () => {
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
})
