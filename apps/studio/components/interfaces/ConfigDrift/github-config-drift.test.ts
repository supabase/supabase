import { describe, expect, it } from 'vitest'

import {
  formatGitHubConfigDecodeMessage,
  getConfigDriftSummary,
  type ConfigDriftResult,
  type GitHubConfigDriftSummary,
} from './github-config-drift'

/**
 * Asserts `result` is the `success` branch of `ConfigDriftResult` and returns its summary, so the
 * existing drift-comparison tests below can keep asserting on the summary shape directly.
 */
function summaryOf(result: ConfigDriftResult): GitHubConfigDriftSummary {
  if (result.status !== 'success') {
    throw new Error(`Expected a successful decode, got ${result.status}`)
  }
  return result.summary
}

describe('getConfigDriftSummary', () => {
  it('counts a matching field as managed', () => {
    const summary = summaryOf(
      getConfigDriftSummary({
        dashboardConfig: { api: { max_rows: 1000 } },
        githubConfig: { api: { max_rows: 1000 } },
      })
    )

    expect(summary).toEqual({
      driftedFields: [],
      matchedFields: [{ section: 'api', configPath: 'api.max_rows', value: 1000 }],
      unmanagedFields: [],
    })
  })

  it('reports a differing field as drifted, keeping raw (non-normalized) display values', () => {
    const summary = summaryOf(
      getConfigDriftSummary({
        dashboardConfig: { auth: { enable_signup: false } },
        githubConfig: { auth: { enable_signup: true } },
      })
    )

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
    const drifted = summaryOf(
      getConfigDriftSummary({
        dashboardConfig: { auth: { site_url: 'https://example.com' } },
        githubConfig: { auth: {} },
      })
    )
    expect(drifted.driftedFields).toHaveLength(1)
    // site_url defaults to http://127.0.0.1:3000
    expect(drifted.driftedFields[0].githubValue).toEqual('http://127.0.0.1:3000')
  })

  describe('auth.additional_redirect_urls', () => {
    it('counts an identical list as managed', () => {
      const summary = summaryOf(
        getConfigDriftSummary({
          dashboardConfig: {
            auth: { additional_redirect_urls: ['https://a.com', 'https://b.com'] },
          },
          githubConfig: { auth: { additional_redirect_urls: ['https://a.com', 'https://b.com'] } },
        })
      )

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
      const summary = summaryOf(
        getConfigDriftSummary({
          // `fromApiProjectConfig` sorts the dashboard list and `normalizeGithubValue` sorts the
          // config.toml one, so ordering can never register as drift.
          dashboardConfig: {
            auth: { additional_redirect_urls: ['https://a.com', 'https://b.com'] },
          },
          githubConfig: { auth: { additional_redirect_urls: ['https://b.com', 'https://a.com'] } },
        })
      )

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
      const summary = summaryOf(
        getConfigDriftSummary({
          dashboardConfig: { auth: { additional_redirect_urls: ['https://a.com'] } },
          githubConfig: {
            auth: { additional_redirect_urls: ['  https://a.com  ', 'https://a.com'] },
          },
        })
      )

      expect(summary.matchedFields).toHaveLength(1)
      expect(summary.driftedFields).toEqual([])
    })

    it('reports a list the dashboard adds to as drifted, keeping the raw dashboard list', () => {
      const summary = summaryOf(
        getConfigDriftSummary({
          dashboardConfig: {
            auth: { additional_redirect_urls: ['https://a.com', 'https://b.com'] },
          },
          githubConfig: { auth: { additional_redirect_urls: ['https://a.com'] } },
        })
      )

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
      const drifted = summaryOf(
        getConfigDriftSummary({
          dashboardConfig: { auth: { additional_redirect_urls: ['https://a.com'] } },
          githubConfig: { auth: {} },
        })
      )
      expect(drifted.driftedFields).toHaveLength(1)
      // additional_redirect_urls defaults to ['https://127.0.0.1:3000']
      expect(drifted.driftedFields[0].githubValue).toEqual(['https://127.0.0.1:3000'])
      expect(drifted.driftedFields[0].dashboardValue).toEqual(['https://a.com'])
    })
  })

  describe('invalid config.toml', () => {
    it('reports a wrong scalar type with its dotted path', () => {
      const result = getConfigDriftSummary({
        dashboardConfig: { api: { max_rows: 1000 } },
        githubConfig: { api: { max_rows: 'abc' } },
      })

      expect(result).toEqual({
        status: 'invalid-config',
        issues: [{ path: 'api.max_rows', message: 'Expected number' }],
      })
    })

    it('reports an explicit null the same way as a wrong scalar type', () => {
      const result = getConfigDriftSummary({
        dashboardConfig: { api: { max_rows: 1000 } },
        githubConfig: { api: { max_rows: null } },
      })

      expect(result).toEqual({
        status: 'invalid-config',
        issues: [{ path: 'api.max_rows', message: 'Expected number' }],
      })
    })

    it('reports a nested path', () => {
      const result = getConfigDriftSummary({
        dashboardConfig: { auth: { enable_signup: true } },
        githubConfig: { auth: { external: { github: { enabled: 'yes' } } } },
      })

      expect(result).toEqual({
        status: 'invalid-config',
        issues: [{ path: 'auth.external.github.enabled', message: 'Expected boolean' }],
      })
    })

    it('reports every bad field in one pass', () => {
      const result = getConfigDriftSummary({
        dashboardConfig: { api: { max_rows: 1000 } },
        githubConfig: { api: { max_rows: 'abc', port: 'x' } },
      })

      expect(result.status).toEqual('invalid-config')
      expect(result).toMatchObject({
        issues: expect.arrayContaining([
          { path: 'api.max_rows', message: 'Expected number' },
          { path: 'api.port', message: 'Expected number' },
        ]),
      })
      if (result.status === 'invalid-config') {
        expect(result.issues).toHaveLength(2)
      }
    })

    it('still decodes successfully when the document has unknown sections or keys', () => {
      const summary = summaryOf(
        getConfigDriftSummary({
          dashboardConfig: { api: { max_rows: 1000 } },
          githubConfig: { api: { max_rows: 1000, made_up_key: true }, made_up_section: {} },
        })
      )

      expect(summary.matchedFields).toEqual([
        { section: 'api', configPath: 'api.max_rows', value: 1000 },
      ])
    })
  })
})

describe('formatGitHubConfigDecodeMessage', () => {
  it('formats a single issue as one sentence', () => {
    const message = formatGitHubConfigDecodeMessage([
      { path: 'api.max_rows', message: 'Expected number' },
    ])

    expect(message).toEqual('config.toml has an invalid value at api.max_rows: expected number.')
  })

  it('formats multiple issues as a comma-separated list', () => {
    const message = formatGitHubConfigDecodeMessage([
      { path: 'api.max_rows', message: 'Expected number' },
      { path: 'api.port', message: 'Expected number' },
    ])

    expect(message).toEqual(
      'config.toml has invalid values: api.max_rows (expected number), api.port (expected number).'
    )
  })
})
