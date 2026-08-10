import { describe, expect, it } from 'vitest'

import {
  getAuthConfigDriftSummary,
  getAuthFieldConfigPath,
  getAuthFieldConfigState,
} from './github-config-drift'

const githubConfig = {
  auth: {
    email: { enable_signup: true },
    sms: { enable_confirmations: false },
    external: {
      github: { enabled: true, client_id: 'github-client', secret: 'do-not-compare' },
    },
  },
}

describe('GitHub config drift', () => {
  it('maps global and external Auth API fields to config paths', () => {
    expect(getAuthFieldConfigPath('DISABLE_SIGNUP')).toBe('auth.enable_signup')
    expect(getAuthFieldConfigPath('EXTERNAL_ANONYMOUS_USERS_ENABLED')).toBe(
      'auth.enable_anonymous_sign_ins'
    )
    expect(getAuthFieldConfigPath('SECURITY_MANUAL_LINKING_ENABLED')).toBe(
      'auth.enable_manual_linking'
    )
    expect(getAuthFieldConfigPath('MAILER_AUTOCONFIRM')).toBe(
      'auth.email.enable_confirmations'
    )
    expect(getAuthFieldConfigPath('SITE_URL')).toBe('auth.site_url')
    expect(getAuthFieldConfigPath('URI_ALLOW_LIST')).toBe('auth.additional_redirect_urls')
    expect(getAuthFieldConfigPath('EXTERNAL_GITHUB_ENABLED')).toBe('auth.external.github.enabled')
    expect(getAuthFieldConfigPath('EXTERNAL_LINKEDIN_OIDC_CLIENT_ID')).toBe(
      'auth.external.linkedin_oidc.client_id'
    )
  })

  it('marks matching dashboard values as managed', () => {
    expect(
      getAuthFieldConfigState({
        fieldName: 'EXTERNAL_GITHUB_CLIENT_ID',
        dashboardValue: 'github-client',
        githubConfig,
      })
    ).toEqual({
      status: 'managed',
      configPath: 'auth.external.github.client_id',
      githubValue: 'github-client',
    })
  })

  it('compares redirect URLs as a trimmed, deduplicated, order-insensitive set', () => {
    const config = {
      auth: {
        additional_redirect_urls: [
          'https://app.example.com/auth/callback',
          'https://preview.example.com/auth/callback',
        ],
      },
    }

    expect(
      getAuthFieldConfigState({
        fieldName: 'URI_ALLOW_LIST',
        dashboardValue:
          ' https://preview.example.com/auth/callback,https://app.example.com/auth/callback,https://app.example.com/auth/callback ',
        githubConfig: config,
      })
    ).toMatchObject({ status: 'managed' })

    expect(
      getAuthFieldConfigState({
        fieldName: 'URI_ALLOW_LIST',
        dashboardValue: 'https://app.example.com/auth/callback',
        githubConfig: config,
      })
    ).toMatchObject({ status: 'drifted' })
  })

  it('treats matching site URLs as managed', () => {
    expect(
      getAuthFieldConfigState({
        fieldName: 'SITE_URL',
        dashboardValue: 'https://app.example.com',
        githubConfig: { auth: { site_url: 'https://app.example.com' } },
      })
    ).toMatchObject({ status: 'managed' })
  })

  it('marks different dashboard values as drifted', () => {
    expect(
      getAuthFieldConfigState({
        fieldName: 'EXTERNAL_GITHUB_ENABLED',
        dashboardValue: false,
        githubConfig,
      })
    ).toMatchObject({ status: 'drifted', githubValue: true })
  })

  it('compares the normalized phone-confirmation form value', () => {
    expect(
      getAuthFieldConfigState({
        fieldName: 'SMS_AUTOCONFIRM',
        dashboardValue: false,
        githubConfig,
      })
    ).toMatchObject({ status: 'managed', githubValue: false })
  })

  it('does not classify secrets or absent config fields', () => {
    expect(
      getAuthFieldConfigState({
        fieldName: 'EXTERNAL_GITHUB_SECRET',
        dashboardValue: 'masked',
        githubConfig,
        isSecret: true,
      })
    ).toEqual({ status: 'unmanaged' })
    expect(
      getAuthFieldConfigState({
        fieldName: 'EXTERNAL_GITLAB_ENABLED',
        dashboardValue: false,
        githubConfig,
      })
    ).toEqual({ status: 'unmanaged' })
  })

  it('treats missing fields with known defaults as governed by code-owned config', () => {
    expect(
      getAuthFieldConfigState({
        fieldName: 'SITE_URL',
        dashboardValue: 'https://app.example.com',
        githubConfig: { config_source: 'code', auth: {} },
      })
    ).toEqual({
      status: 'drifted',
      configPath: 'auth.site_url',
      githubValue: 'http://localhost:3000',
    })

    expect(
      getAuthFieldConfigState({
        fieldName: 'URI_ALLOW_LIST',
        dashboardValue: 'https://app.example.com/callback',
        githubConfig: { config_source: 'code', auth: {} },
      })
    ).toEqual({
      status: 'drifted',
      configPath: 'auth.additional_redirect_urls',
      githubValue: [],
    })
  })

  it('leaves missing fields unmanaged when the current environment uses the default', () => {
    expect(
      getAuthFieldConfigState({
        fieldName: 'SITE_URL',
        dashboardValue: 'http://localhost:3000',
        githubConfig: { config_source: 'code', auth: {} },
      })
    ).toEqual({ status: 'unmanaged' })

    expect(
      getAuthFieldConfigState({
        fieldName: 'URI_ALLOW_LIST',
        dashboardValue: '',
        githubConfig: { config_source: 'code', auth: {} },
      })
    ).toEqual({ status: 'unmanaged' })
  })

  it('does not audit missing fields unless the root config declares code ownership', () => {
    for (const config_source of [undefined, 'remote']) {
      expect(
        getAuthFieldConfigState({
          fieldName: 'SITE_URL',
          dashboardValue: 'https://app.example.com',
          githubConfig: { config_source, auth: {} },
        })
      ).toEqual({ status: 'unmanaged' })
    }
  })

  it('does not infer a governed state for fields without a known hosted default', () => {
    expect(
      getAuthFieldConfigState({
        fieldName: 'EXTERNAL_GITHUB_ENABLED',
        dashboardValue: true,
        githubConfig: { config_source: 'code', auth: {} },
      })
    ).toEqual({ status: 'unmanaged' })

    expect(
      getAuthFieldConfigState({
        fieldName: 'EXTERNAL_GITHUB_SECRET',
        dashboardValue: 'masked',
        githubConfig: { config_source: 'code', auth: {} },
      })
    ).toEqual({ status: 'unmanaged' })
  })

  it('preserves true drift semantics for paths that are present in config', () => {
    expect(
      getAuthFieldConfigState({
        fieldName: 'SITE_URL',
        dashboardValue: 'https://live.example.com',
        githubConfig: {
          config_source: 'code',
          auth: { site_url: 'https://config.example.com' },
        },
      })
    ).toEqual({
      status: 'drifted',
      configPath: 'auth.site_url',
      githubValue: 'https://config.example.com',
    })
  })

  it('summarizes only confirmed non-secret drift', () => {
    const summary = getAuthConfigDriftSummary({
      dashboardConfig: {
        EXTERNAL_EMAIL_ENABLED: true,
        EXTERNAL_GITHUB_ENABLED: false,
        EXTERNAL_GITHUB_CLIENT_ID: 'github-client',
        EXTERNAL_GITHUB_SECRET: 'different-secret',
      },
      githubConfig,
    })

    expect(summary.managedCount).toBe(2)
    expect(summary.driftedFields).toEqual([
      {
        fieldName: 'EXTERNAL_GITHUB_ENABLED',
        configPath: 'auth.external.github.enabled',
        dashboardValue: false,
        githubValue: true,
      },
    ])
  })

  it('summarizes missing code-owned values against their known defaults', () => {
    expect(
      getAuthConfigDriftSummary({
        dashboardConfig: {
          SITE_URL: 'https://live.example.com',
          URI_ALLOW_LIST: 'https://live.example.com/callback',
        },
        githubConfig: { config_source: 'code', auth: {} },
      })
    ).toEqual({
      managedCount: 0,
      driftedFields: [
        {
          fieldName: 'SITE_URL',
          configPath: 'auth.site_url',
          dashboardValue: 'https://live.example.com',
          githubValue: 'http://localhost:3000',
        },
        {
          fieldName: 'URI_ALLOW_LIST',
          configPath: 'auth.additional_redirect_urls',
          dashboardValue: 'https://live.example.com/callback',
          githubValue: [],
        },
      ],
    })
  })

  it('does not report drift until both configurations are available', () => {
    expect(
      getAuthConfigDriftSummary({ dashboardConfig: { EXTERNAL_GITHUB_ENABLED: false } })
    ).toEqual({ managedCount: 0, driftedFields: [] })
  })

  it('normalizes raw dashboard values that use inverse form semantics', () => {
    expect(
      getAuthConfigDriftSummary({
        dashboardConfig: { SMS_AUTOCONFIRM: true },
        githubConfig,
      })
    ).toEqual({ managedCount: 1, driftedFields: [] })
  })

  it('matches global boolean settings using config semantics', () => {
    expect(
      getAuthConfigDriftSummary({
        dashboardConfig: {
          DISABLE_SIGNUP: false,
          EXTERNAL_ANONYMOUS_USERS_ENABLED: true,
          SECURITY_MANUAL_LINKING_ENABLED: false,
          MAILER_AUTOCONFIRM: false,
        },
        githubConfig: {
          auth: {
            enable_signup: true,
            enable_anonymous_sign_ins: true,
            enable_manual_linking: false,
            email: { enable_confirmations: true },
          },
        },
      })
    ).toEqual({ managedCount: 4, driftedFields: [] })
  })

  it('reports global boolean drift with inverse API fields normalized for display', () => {
    expect(
      getAuthConfigDriftSummary({
        dashboardConfig: {
          DISABLE_SIGNUP: true,
          EXTERNAL_ANONYMOUS_USERS_ENABLED: false,
          SECURITY_MANUAL_LINKING_ENABLED: true,
          MAILER_AUTOCONFIRM: true,
        },
        githubConfig: {
          auth: {
            enable_signup: true,
            enable_anonymous_sign_ins: true,
            enable_manual_linking: false,
            email: { enable_confirmations: true },
          },
        },
      })
    ).toEqual({
      managedCount: 0,
      driftedFields: [
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
          dashboardValue: true,
          githubValue: false,
        },
        {
          fieldName: 'MAILER_AUTOCONFIRM',
          configPath: 'auth.email.enable_confirmations',
          dashboardValue: false,
          githubValue: true,
        },
      ],
    })
  })
})
