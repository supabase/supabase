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
      githubConfig: { auth: {} },
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
      githubConfig: { auth: {} },
    })
    expect(drifted.driftedFields).toHaveLength(1)
    expect(drifted.driftedFields[0].githubValue).toBe('http://localhost:3000')
  })
})
