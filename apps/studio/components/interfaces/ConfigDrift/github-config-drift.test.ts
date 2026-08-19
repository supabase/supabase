import { describe, expect, it } from 'vitest'

import { convertProjectConfigToGitHubConfig } from './github-config-convert'
import { getConfigDriftSummary } from './github-config-drift'

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

describe('getConfigDriftSummary', () => {
  it('counts a matching field as managed', () => {
    const summary = getConfigDriftSummary({
      dashboardConfig: { api: { max_rows: 1000 } },
      githubConfig: { api: { max_rows: 1000 } },
    })

    expect(summary).toEqual({ managedCount: 1, driftedFields: [], unmanagedFields: [] })
  })

  it('reports a differing field as drifted, keeping raw (non-normalized) display values', () => {
    const summary = getConfigDriftSummary({
      dashboardConfig: { auth: { disable_signup: true } },
      githubConfig: { auth: { enable_signup: true } },
    })

    expect(summary.managedCount).toBe(0)
    expect(summary.driftedFields).toEqual([
      {
        section: 'auth',
        fieldName: 'DISABLE_SIGNUP',
        configPath: 'auth.enable_signup',
        settingHref: expect.any(Function),
        dashboardValue: true,
        githubValue: true,
      },
    ])
  })

  it('reports a field absent from config.toml as unmanaged', () => {
    const summary = getConfigDriftSummary({
      dashboardConfig: { auth: { site_url: 'https://example.com' } },
      githubConfig: { auth: {} },
    })

    expect(summary).toEqual({
      managedCount: 0,
      driftedFields: [],
      unmanagedFields: [
        { section: 'auth', fieldName: 'SITE_URL', dashboardValue: 'https://example.com' },
      ],
    })
  })

  it('falls back to the hosted default when config.toml is code-owned and silent on the field', () => {
    const atDefault = getConfigDriftSummary({
      dashboardConfig: { auth: { site_url: 'http://localhost:3000' } },
      githubConfig: { auth: {}, config_source: 'code' },
    })
    expect(atDefault).toEqual({
      managedCount: 0,
      driftedFields: [],
      unmanagedFields: [
        { section: 'auth', fieldName: 'SITE_URL', dashboardValue: 'http://localhost:3000' },
      ],
    })

    const drifted = getConfigDriftSummary({
      dashboardConfig: { auth: { site_url: 'https://example.com' } },
      githubConfig: { auth: {}, config_source: 'code' },
    })
    expect(drifted.driftedFields).toHaveLength(1)
    expect(drifted.driftedFields[0].githubValue).toBe('http://localhost:3000')
  })
})
