import { describe, expect, it } from 'vitest'

import { getConfigDriftSummary } from './github-config-drift'

describe('getConfigDriftSummary', () => {
  it('counts a matching field as managed', () => {
    const summary = getConfigDriftSummary({
      dashboardConfig: { api: { max_rows: 1000 } },
      githubConfig: { api: { max_rows: 1000 } },
    })

    expect(summary).toEqual({
      driftedFields: [],
      matchedFields: [{ section: 'api', configPath: 'api.max_rows', value: 1000 }],
      unmanagedFields: [],
    })
  })

  it('reports a differing field as drifted, keeping raw (non-normalized) display values', () => {
    const summary = getConfigDriftSummary({
      dashboardConfig: { auth: { enable_signup: false } },
      githubConfig: { auth: { enable_signup: true } },
    })

    expect(summary.matchedFields).toEqual([])
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

  it('reports a field missing from config.toml as drifted against the hosted value', () => {
    const drifted = getConfigDriftSummary({
      dashboardConfig: { auth: { site_url: 'https://example.com' } },
      githubConfig: { auth: {} },
    })
    expect(drifted.driftedFields).toHaveLength(1)
    expect(drifted.driftedFields[0].githubValue).toBeUndefined()
  })

  describe('auth.additional_redirect_urls', () => {
    it('counts an identical list as managed', () => {
      const summary = getConfigDriftSummary({
        dashboardConfig: { auth: { additional_redirect_urls: ['https://a.com', 'https://b.com'] } },
        githubConfig: { auth: { additional_redirect_urls: ['https://a.com', 'https://b.com'] } },
      })

      expect(summary).toEqual({
        driftedFields: [],
        matchedFields: [
          {
            section: 'auth',
            configPath: 'auth.additional_redirect_urls',
            value: ['https://a.com', 'https://b.com'],
          },
        ],
        unmanagedFields: [],
      })
    })

    it('counts a list that differs only in order as managed', () => {
      const summary = getConfigDriftSummary({
        // `fromApiProjectConfig` sorts the dashboard list and `normalizeGithubValue` sorts the
        // config.toml one, so ordering can never register as drift.
        dashboardConfig: { auth: { additional_redirect_urls: ['https://a.com', 'https://b.com'] } },
        githubConfig: { auth: { additional_redirect_urls: ['https://b.com', 'https://a.com'] } },
      })

      expect(summary).toEqual({
        driftedFields: [],
        matchedFields: [
          {
            section: 'auth',
            configPath: 'auth.additional_redirect_urls',
            value: ['https://a.com', 'https://b.com'],
          },
        ],
        unmanagedFields: [],
      })
    })

    it('ignores duplicate and untrimmed entries in config.toml', () => {
      // `auth.additional_redirect_urls` is a registry "set"-equality field whose document-side
      // canonicalization re-joins-and-splits the array (mirroring a push/pull round trip), which
      // trims each entry — so padding and exact-duplicate entries never register as drift.
      const summary = getConfigDriftSummary({
        dashboardConfig: { auth: { additional_redirect_urls: ['https://a.com'] } },
        githubConfig: {
          auth: { additional_redirect_urls: ['  https://a.com  ', 'https://a.com'] },
        },
      })

      expect(summary.matchedFields).toHaveLength(1)
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

    it('reports a list missing from config.toml as drifted', () => {
      const drifted = getConfigDriftSummary({
        dashboardConfig: { auth: { additional_redirect_urls: ['https://a.com'] } },
        githubConfig: { auth: {} },
      })
      expect(drifted.driftedFields).toHaveLength(1)
      expect(drifted.driftedFields[0].githubValue).toBeUndefined()
    })
  })
})
