import { describe, expect, it } from 'vitest'

import { getConfigDriftSummary } from './github-config-drift'

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
      dashboardConfig: { auth: { enable_signup: false } },
      githubConfig: { auth: { enable_signup: true } },
    })

    expect(summary.managedCount).toBe(0)
    expect(summary.driftedFields).toEqual([
      {
        section: 'auth',
        configPath: 'auth.enable_signup',
        settingHref: expect.any(Function),
        dashboardValue: false,
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
        { section: 'auth', configPath: 'auth.site_url', dashboardValue: 'https://example.com' },
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
        { section: 'auth', configPath: 'auth.site_url', dashboardValue: 'http://localhost:3000' },
      ],
    })

    const drifted = getConfigDriftSummary({
      dashboardConfig: { auth: { site_url: 'https://example.com' } },
      githubConfig: { auth: {}, config_source: 'code' },
    })
    expect(drifted.driftedFields).toHaveLength(1)
    expect(drifted.driftedFields[0].githubValue).toBe('http://localhost:3000')
  })

  describe('auth.additional_redirect_urls', () => {
    it('counts an identical list as managed', () => {
      const summary = getConfigDriftSummary({
        dashboardConfig: { auth: { additional_redirect_urls: ['https://a.com', 'https://b.com'] } },
        githubConfig: { auth: { additional_redirect_urls: ['https://a.com', 'https://b.com'] } },
      })

      expect(summary).toEqual({ managedCount: 1, driftedFields: [], unmanagedFields: [] })
    })

    it('counts a list that differs only in order as managed', () => {
      const summary = getConfigDriftSummary({
        // `convertProjectConfigToGitHubConfig` sorts the dashboard list and `normalizeGithubValue`
        // sorts the config.toml one, so ordering can never register as drift.
        dashboardConfig: { auth: { additional_redirect_urls: ['https://a.com', 'https://b.com'] } },
        githubConfig: { auth: { additional_redirect_urls: ['https://b.com', 'https://a.com'] } },
      })

      expect(summary).toEqual({ managedCount: 1, driftedFields: [], unmanagedFields: [] })
    })

    it('ignores duplicate and untrimmed entries in config.toml', () => {
      const summary = getConfigDriftSummary({
        dashboardConfig: { auth: { additional_redirect_urls: ['https://a.com'] } },
        githubConfig: {
          auth: { additional_redirect_urls: ['  https://a.com  ', 'https://a.com', ''] },
        },
      })

      expect(summary.managedCount).toBe(1)
      expect(summary.driftedFields).toEqual([])
    })

    it('reports a list the dashboard adds to as drifted, keeping the raw dashboard list', () => {
      const summary = getConfigDriftSummary({
        dashboardConfig: { auth: { additional_redirect_urls: ['https://a.com', 'https://b.com'] } },
        githubConfig: { auth: { additional_redirect_urls: ['https://a.com'] } },
      })

      expect(summary.driftedFields).toEqual([
        {
          section: 'auth',
          configPath: 'auth.additional_redirect_urls',
          settingHref: expect.any(Function),
          dashboardValue: ['https://a.com', 'https://b.com'],
          githubValue: ['https://a.com'],
        },
      ])
    })

    it('compares against the empty hosted default when code-owned config.toml is silent', () => {
      const atDefault = getConfigDriftSummary({
        dashboardConfig: { auth: { additional_redirect_urls: [] } },
        githubConfig: { auth: {}, config_source: 'code' },
      })
      expect(atDefault.managedCount).toBe(0)
      expect(atDefault.driftedFields).toEqual([])

      const drifted = getConfigDriftSummary({
        dashboardConfig: { auth: { additional_redirect_urls: ['https://a.com'] } },
        githubConfig: { auth: {}, config_source: 'code' },
      })
      expect(drifted.driftedFields).toHaveLength(1)
      expect(drifted.driftedFields[0].githubValue).toEqual([])
    })
  })
})
