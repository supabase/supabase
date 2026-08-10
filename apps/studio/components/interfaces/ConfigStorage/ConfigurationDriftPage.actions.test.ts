import { describe, expect, it } from 'vitest'

import {
  createAuthConfigRestorePayload,
  createAuthConfigRestorePayloads,
} from './ConfigurationDriftPage.actions'
import type { GitHubConfigDriftField } from '@/lib/github-config-drift'

const field = (overrides: Partial<GitHubConfigDriftField>): GitHubConfigDriftField => ({
  fieldName: 'SITE_URL',
  configPath: 'auth.site_url',
  dashboardValue: 'https://live.example.com',
  githubValue: 'https://config.example.com',
  ...overrides,
})

describe('createAuthConfigRestorePayload', () => {
  it('creates a strict Site URL payload', () => {
    expect(createAuthConfigRestorePayload(field({}))).toEqual({
      ok: true,
      payload: { SITE_URL: 'https://config.example.com' },
    })
  })

  it('serializes redirect URL arrays for the Management API', () => {
    expect(
      createAuthConfigRestorePayload(
        field({
          fieldName: 'URI_ALLOW_LIST',
          configPath: 'auth.additional_redirect_urls',
          githubValue: [
            ' https://app.example.com/auth/callback ',
            'https://app.example.com/auth/callback',
            'https://preview.example.com/auth/callback',
          ],
        })
      )
    ).toEqual({
      ok: true,
      payload: {
        URI_ALLOW_LIST:
          'https://app.example.com/auth/callback,https://preview.example.com/auth/callback',
      },
    })
  })

  it('converts config confirmation semantics into the inverse backend field', () => {
    expect(
      createAuthConfigRestorePayload(
        field({
          fieldName: 'SMS_AUTOCONFIRM',
          configPath: 'auth.sms.enable_confirmations',
          githubValue: true,
        })
      )
    ).toEqual({ ok: true, payload: { SMS_AUTOCONFIRM: false } })
  })

  it.each([
    ['DISABLE_SIGNUP', 'auth.enable_signup', true, false],
    ['DISABLE_SIGNUP', 'auth.enable_signup', false, true],
    ['MAILER_AUTOCONFIRM', 'auth.email.enable_confirmations', true, false],
    ['MAILER_AUTOCONFIRM', 'auth.email.enable_confirmations', false, true],
  ])(
    'converts inverse config semantics for %s',
    (fieldName, configPath, githubValue, expectedApiValue) => {
      expect(createAuthConfigRestorePayload(field({ fieldName, configPath, githubValue }))).toEqual(
        { ok: true, payload: { [fieldName]: expectedApiValue } }
      )
    }
  )

  it.each([
    ['EXTERNAL_ANONYMOUS_USERS_ENABLED', 'auth.enable_anonymous_sign_ins', true],
    ['SECURITY_MANUAL_LINKING_ENABLED', 'auth.enable_manual_linking', false],
  ])(
    'restores direct global boolean %s without inversion',
    (fieldName, configPath, githubValue) => {
      expect(createAuthConfigRestorePayload(field({ fieldName, configPath, githubValue }))).toEqual(
        { ok: true, payload: { [fieldName]: githubValue } }
      )
    }
  )

  it('uses null for empty provider strings but preserves empty password requirements', () => {
    expect(
      createAuthConfigRestorePayload(
        field({
          fieldName: 'EXTERNAL_GITHUB_CLIENT_ID',
          configPath: 'auth.external.github.client_id',
          githubValue: '',
        })
      )
    ).toEqual({ ok: true, payload: { EXTERNAL_GITHUB_CLIENT_ID: null } })

    expect(
      createAuthConfigRestorePayload(
        field({
          fieldName: 'SMS_PROVIDER',
          configPath: 'auth.sms.provider',
          githubValue: '',
        })
      )
    ).toEqual({ ok: true, payload: { SMS_PROVIDER: null } })

    expect(
      createAuthConfigRestorePayload(
        field({
          fieldName: 'PASSWORD_REQUIRED_CHARACTERS',
          configPath: 'auth.password_requirements',
          githubValue: '',
        })
      )
    ).toEqual({ ok: true, payload: { PASSWORD_REQUIRED_CHARACTERS: '' } })
  })

  it('fails closed for secrets, unknown fields, mismatched paths, and invalid values', () => {
    expect(
      createAuthConfigRestorePayload(
        field({
          fieldName: 'EXTERNAL_GITHUB_SECRET',
          configPath: 'auth.external.github.secret',
          githubValue: 'secret',
        })
      )
    ).toMatchObject({ ok: false })

    expect(
      createAuthConfigRestorePayload(
        field({
          fieldName: 'UNKNOWN_FIELD',
          configPath: 'auth.unknown',
          githubValue: true,
        })
      )
    ).toMatchObject({ ok: false })

    expect(
      createAuthConfigRestorePayload(
        field({
          fieldName: 'SITE_URL',
          configPath: 'auth.external.github.enabled',
        })
      )
    ).toMatchObject({ ok: false })

    expect(
      createAuthConfigRestorePayload(
        field({
          fieldName: 'URI_ALLOW_LIST',
          configPath: 'auth.additional_redirect_urls',
          githubValue: 'https://not-an-array.example.com',
        })
      )
    ).toMatchObject({ ok: false })
  })
})

describe('createAuthConfigRestorePayloads', () => {
  it('combines the complete drift set into one Management API patch', () => {
    expect(
      createAuthConfigRestorePayloads([
        field({}),
        field({
          fieldName: 'URI_ALLOW_LIST',
          configPath: 'auth.additional_redirect_urls',
          githubValue: ['https://config.example.com/callback'],
        }),
      ])
    ).toEqual({
      ok: true,
      payload: {
        SITE_URL: 'https://config.example.com',
        URI_ALLOW_LIST: 'https://config.example.com/callback',
      },
    })
  })

  it('fails the complete restore when any setting is invalid', () => {
    expect(
      createAuthConfigRestorePayloads([
        field({}),
        field({ fieldName: 'UNKNOWN_FIELD', configPath: 'auth.unknown' }),
      ])
    ).toMatchObject({ ok: false })
  })
})
