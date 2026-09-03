import { describe, expect, it } from 'vitest'

import {
  createConfigurationDriftRows,
  groupMatchedConfigFields,
  groupUnmanagedConfigFields,
} from './ConfigurationDriftPage.utils'
import type {
  GitHubConfigDriftField,
  MatchedConfigField,
  UnmanagedConfigField,
} from './github-config-drift'

const PROJECT_REF = 'abcdefgh'

function driftField(overrides: Partial<GitHubConfigDriftField>): GitHubConfigDriftField {
  return {
    section: 'api',
    configPath: 'api.max_rows',
    settingHref: (projectRef) => `/project/${projectRef}/settings/api`,
    dashboardValue: 1000,
    githubValue: 500,
    ...overrides,
  }
}

function unmanagedField(overrides: Partial<UnmanagedConfigField>): UnmanagedConfigField {
  return {
    section: 'api',
    configPath: 'api.max_rows',
    dashboardValue: 1000,
    ...overrides,
  }
}

function matchedField(overrides: Partial<MatchedConfigField>): MatchedConfigField {
  return {
    section: 'api',
    configPath: 'api.max_rows',
    value: 1000,
    ...overrides,
  }
}

describe('createConfigurationDriftRows', () => {
  it('resolves the setting href against the project ref and marks the row as drifted', () => {
    const [row] = createConfigurationDriftRows([driftField({})], PROJECT_REF)

    expect(row.status).toBe('drifted')
    expect(row.settingHref).toBe('/project/abcdefgh/settings/api')
  })

  it('uses the hand-written label for a known config path', () => {
    const [row] = createConfigurationDriftRows(
      [driftField({ configPath: 'auth.enable_signup' })],
      PROJECT_REF
    )

    expect(row.settingLabel).toBe('New user signups')
  })

  it('labels an external auth provider field as "<provider> · <key>"', () => {
    const [row] = createConfigurationDriftRows(
      [driftField({ configPath: 'auth.external.google.client_id' })],
      PROJECT_REF
    )

    expect(row.settingLabel).toBe('Google · Client ID')
  })

  it('falls back to a title-cased last path segment for an unrecognized config path', () => {
    const [row] = createConfigurationDriftRows(
      [driftField({ configPath: 'some.unknown_setting' })],
      PROJECT_REF
    )

    expect(row.settingLabel).toBe('Unknown Setting')
  })

  it('builds a scalar diff, formatting booleans and empty values for display', () => {
    const [row] = createConfigurationDriftRows(
      [
        driftField({
          configPath: 'auth.enable_signup',
          dashboardValue: true,
          githubValue: false,
        }),
      ],
      PROJECT_REF
    )

    expect(row.valueDiff).toEqual({
      kind: 'scalar',
      dashboardValue: 'Enabled',
      configValue: 'Disabled',
    })
  })

  it('formats a missing scalar value as "Not set"', () => {
    const [row] = createConfigurationDriftRows(
      [driftField({ configPath: 'auth.site_url', dashboardValue: '', githubValue: undefined })],
      PROJECT_REF
    )

    expect(row.valueDiff).toEqual({
      kind: 'scalar',
      dashboardValue: 'Not set',
      configValue: 'Not set',
    })
  })

  it('builds a list diff for redirect URLs, normalizing and comparing entries', () => {
    const [row] = createConfigurationDriftRows(
      [
        driftField({
          configPath: 'auth.additional_redirect_urls',
          dashboardValue: ['https://a.com', 'https://b.com'],
          githubValue: ['  https://a.com  ', 'https://c.com'],
        }),
      ],
      PROJECT_REF
    )

    expect(row.valueDiff).toEqual({
      kind: 'list',
      onlyInDashboard: ['https://b.com'],
      onlyInConfig: ['https://c.com'],
    })
  })

  it('reports no diff entries when redirect URL lists are equal after normalization', () => {
    const [row] = createConfigurationDriftRows(
      [
        driftField({
          configPath: 'auth.additional_redirect_urls',
          dashboardValue: ['https://a.com'],
          githubValue: ['https://a.com', 'https://a.com'],
        }),
      ],
      PROJECT_REF
    )

    expect(row.valueDiff).toEqual({ kind: 'list', onlyInDashboard: [], onlyInConfig: [] })
  })
})

describe('groupUnmanagedConfigFields', () => {
  it('returns an empty array when there are no unmanaged fields', () => {
    expect(groupUnmanagedConfigFields([])).toEqual([])
  })

  it('groups fields from the same section into a single group', () => {
    const groups = groupUnmanagedConfigFields([
      unmanagedField({ configPath: 'api.max_rows', dashboardValue: 1000 }),
      unmanagedField({ configPath: 'api.enabled', dashboardValue: true }),
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0]).toEqual({
      section: 'api',
      sectionLabel: 'API',
      rows: [
        { configPath: 'api.max_rows', label: 'Max rows', value: '1000' },
        { configPath: 'api.enabled', label: 'API enabled', value: 'true' },
      ],
    })
  })

  it('orders groups by CONFIG_SECTIONS order, not by input order', () => {
    const groups = groupUnmanagedConfigFields([
      unmanagedField({ section: 'storage', configPath: 'storage.enabled', dashboardValue: true }),
      unmanagedField({ section: 'api', configPath: 'api.enabled', dashboardValue: true }),
    ])

    expect(groups.map((group) => group.section)).toEqual(['api', 'storage'])
  })

  it('formats an empty-value field as "Not set"', () => {
    const groups = groupUnmanagedConfigFields([
      unmanagedField({ configPath: 'auth.site_url', section: 'auth', dashboardValue: undefined }),
    ])

    expect(groups[0].rows[0].value).toBe('Not set')
  })

  it('joins a normalized redirect URL list with newlines', () => {
    const groups = groupUnmanagedConfigFields([
      unmanagedField({
        section: 'auth',
        configPath: 'auth.additional_redirect_urls',
        dashboardValue: ['https://b.com', '  https://a.com  ', 'https://a.com'],
      }),
    ])

    expect(groups[0].rows[0].value).toBe('https://a.com\nhttps://b.com')
  })
})

describe('groupMatchedConfigFields', () => {
  it('returns an empty array when there are no matched fields', () => {
    expect(groupMatchedConfigFields([])).toEqual([])
  })

  it('groups fields from the same section into a single group', () => {
    const groups = groupMatchedConfigFields([
      matchedField({ configPath: 'api.max_rows', value: 1000 }),
      matchedField({ configPath: 'api.enabled', value: true }),
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0]).toEqual({
      section: 'api',
      sectionLabel: 'API',
      rows: [
        { configPath: 'api.max_rows', label: 'Max rows', value: '1000' },
        { configPath: 'api.enabled', label: 'API enabled', value: 'true' },
      ],
    })
  })

  it('orders groups by CONFIG_SECTIONS order, not by input order', () => {
    const groups = groupMatchedConfigFields([
      matchedField({ section: 'storage', configPath: 'storage.enabled', value: true }),
      matchedField({ section: 'api', configPath: 'api.enabled', value: true }),
    ])

    expect(groups.map((group) => group.section)).toEqual(['api', 'storage'])
  })
})
