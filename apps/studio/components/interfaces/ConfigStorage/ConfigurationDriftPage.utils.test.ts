import { describe, expect, it } from 'vitest'

import { createConfigurationDriftRows, formatAuthConfigValue } from './ConfigurationDriftPage.utils'

describe('configuration drift page utilities', () => {
  it('creates labels and setting links for URL and provider drift', () => {
    expect(
      createConfigurationDriftRows(
        [
          {
            fieldName: 'SITE_URL',
            configPath: 'auth.site_url',
            dashboardValue: 'https://live.example.com',
            githubValue: 'https://config.example.com',
          },
          {
            fieldName: 'EXTERNAL_GITHUB_CLIENT_ID',
            configPath: 'auth.external.github.client_id',
            dashboardValue: 'live-client',
            githubValue: 'config-client',
          },
        ],
        'project-ref'
      )
    ).toMatchObject([
      {
        settingLabel: 'Site URL',
        settingHref: '/project/project-ref/auth/url-configuration',
        valueDiff: {
          kind: 'scalar',
          dashboardValue: 'https://live.example.com',
          configValue: 'https://config.example.com',
        },
      },
      {
        settingLabel: 'GitHub · Client ID',
        settingHref: '/project/project-ref/auth/providers',
      },
    ])
  })

  it('labels global Auth settings and routes them to the providers page', () => {
    expect(
      createConfigurationDriftRows(
        [
          {
            fieldName: 'DISABLE_SIGNUP',
            configPath: 'auth.enable_signup',
            dashboardValue: false,
            githubValue: true,
          },
          {
            fieldName: 'EXTERNAL_ANONYMOUS_USERS_ENABLED',
            configPath: 'auth.enable_anonymous_sign_ins',
            dashboardValue: false,
            githubValue: true,
          },
          {
            fieldName: 'SECURITY_MANUAL_LINKING_ENABLED',
            configPath: 'auth.enable_manual_linking',
            dashboardValue: false,
            githubValue: true,
          },
          {
            fieldName: 'MAILER_AUTOCONFIRM',
            configPath: 'auth.email.enable_confirmations',
            dashboardValue: false,
            githubValue: true,
          },
        ],
        'project-ref'
      )
    ).toMatchObject([
      {
        settingLabel: 'New user signups',
        settingHref: '/project/project-ref/auth/providers',
      },
      {
        settingLabel: 'Anonymous sign-ins',
        settingHref: '/project/project-ref/auth/providers',
      },
      {
        settingLabel: 'Manual account linking',
        settingHref: '/project/project-ref/auth/providers',
      },
      {
        settingLabel: 'Email confirmations',
        settingHref: '/project/project-ref/auth/providers',
      },
    ])
  })

  it('formats redirect URLs as a sorted, deduplicated list', () => {
    expect(
      formatAuthConfigValue(
        'URI_ALLOW_LIST',
        ' https://b.example.com,https://a.example.com,https://b.example.com '
      )
    ).toBe('https://a.example.com\nhttps://b.example.com')
  })

  it('represents redirect URL drift as semantic additions on either side', () => {
    const [row] = createConfigurationDriftRows(
      [
        {
          fieldName: 'URI_ALLOW_LIST',
          configPath: 'auth.additional_redirect_urls',
          dashboardValue: 'https://shared.example.com, https://dashboard-only.example.com',
          githubValue: ['https://config-only.example.com', 'https://shared.example.com'],
        },
      ],
      'project-ref'
    )

    expect(row?.valueDiff).toEqual({
      kind: 'list',
      onlyInDashboard: ['https://dashboard-only.example.com'],
      onlyInConfig: ['https://config-only.example.com'],
    })
  })

  it('formats booleans semantically and empty values explicitly', () => {
    expect(formatAuthConfigValue('EXTERNAL_GITHUB_ENABLED', false)).toBe('Disabled')
    expect(formatAuthConfigValue('EXTERNAL_GITHUB_ENABLED', true)).toBe('Enabled')
    expect(formatAuthConfigValue('EXTERNAL_GITHUB_CLIENT_ID', '')).toBe('Not set')
    expect(formatAuthConfigValue('URI_ALLOW_LIST', [])).toBe('Not set')
  })
})
