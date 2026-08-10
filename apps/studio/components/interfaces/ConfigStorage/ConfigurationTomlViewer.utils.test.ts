import { describe, expect, it } from 'vitest'

import { createTomlSourceLines } from './ConfigurationTomlViewer.utils'

describe('createTomlSourceLines', () => {
  it('marks base, environment, branch, inactive, and drifted values in the literal source', () => {
    const content = [
      '[auth]',
      'site_url = "https://base.example.com"',
      'enable_signup = false',
      '',
      '[env.preview.auth]',
      'site_url = "https://preview.example.com"',
      'enable_signup = true',
      '',
      '[env.preview.branches."jsm/test-1".auth]',
      'site_url = "https://branch.example.com"',
      '',
      '[env.production.auth]',
      'site_url = "https://production.example.com"',
    ].join('\n')

    const lines = createTomlSourceLines({
      content,
      target: 'preview',
      gitBranch: 'jsm/test-1',
      driftedFields: [
        {
          fieldName: 'SITE_URL',
          configPath: 'auth.site_url',
          githubValue: 'https://branch.example.com',
          dashboardValue: 'https://current.example.com',
        },
      ],
    })

    expect(lines[1].value).toMatchObject({
      configPath: 'auth.site_url',
      status: 'overridden',
      overriddenByLine: 10,
      overriddenByScope: 'jsm/test-1 branch override',
    })
    expect(lines[2].value).toMatchObject({
      configPath: 'auth.enable_signup',
      status: 'overridden',
      overriddenByLine: 7,
    })
    expect(lines[5].value).toMatchObject({ status: 'overridden', overriddenByLine: 10 })
    expect(lines[6].value).toMatchObject({
      status: 'applied',
      overridesLines: [3],
      overridesScopes: ['shared configuration'],
    })
    expect(lines[9].value).toMatchObject({
      status: 'drifted',
      overridesLines: [2, 6],
      dashboardValue: 'https://current.example.com',
    })
    expect(lines[9].isVisible).toBe(true)
    expect(lines[9].layer).toBe('branch')
    expect(lines[12].value).toMatchObject({ status: 'inactive' })
    expect(lines[11].isVisible).toBe(false)
    expect(lines[12].isVisible).toBe(false)
  })

  it('preserves comments and recognizes hashes inside strings', () => {
    const lines = createTomlSourceLines({
      content: '[auth]\nsite_url = "https://example.com/#callback" # keep this comment',
      target: 'production',
      driftedFields: [],
    })

    expect(lines[1].value).toMatchObject({
      rawValue: '"https://example.com/#callback"',
      status: 'applied',
    })
  })
})
