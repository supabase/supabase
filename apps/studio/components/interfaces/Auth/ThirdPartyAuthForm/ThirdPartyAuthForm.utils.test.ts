import { describe, expect, it } from 'vitest'

import {
  getIntegrationType,
  getIntegrationTypeLabel,
  isValidOidcIssuerUrl,
} from './ThirdPartyAuthForm.utils'
import type { ThirdPartyAuthIntegration } from '@/data/third-party-auth/integrations-query'

const buildIntegration = (oidcIssuerUrl: string): ThirdPartyAuthIntegration => ({
  id: '00000000-0000-0000-0000-000000000000',
  type: 'oidc',
  oidc_issuer_url: oidcIssuerUrl,
  inserted_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
})

describe('isValidOidcIssuerUrl', () => {
  it.each([
    'https://login.example.com',
    'https://login.example.com/',
    'https://example.com/realms/my-realm',
    'https://login.example.com:8443/tenant',
  ])('accepts %s', (value) => {
    expect(isValidOidcIssuerUrl(value)).toBe(true)
  })

  it.each([
    '',
    'login.example.com',
    'http://login.example.com',
    'ftp://login.example.com',
    'https://',
    'https://login.example.com?tenant=a',
    'https://login.example.com/#fragment',
    'https://user:pass@login.example.com',
    'not a url',
  ])('rejects %j', (value) => {
    expect(isValidOidcIssuerUrl(value)).toBe(false)
  })
})

describe('getIntegrationType', () => {
  it('detects known providers from the issuer URL', () => {
    expect(getIntegrationType(buildIntegration('https://securetoken.google.com/my-project'))).toBe(
      'firebase'
    )
    expect(getIntegrationType(buildIntegration('https://acme.auth0.com'))).toBe('auth0')
  })

  it('falls back to custom for any other issuer', () => {
    expect(getIntegrationType(buildIntegration('https://login.example.com'))).toBe('custom')
    expect(getIntegrationType(undefined)).toBe('custom')
  })

  it('labels a Scalekit environment host as Scalekit', () => {
    expect(getIntegrationType(buildIntegration('https://yourorg.scalekit.com'))).toBe('scalekit')
    expect(getIntegrationType(buildIntegration('https://yourorg.scalekit.cloud'))).toBe('scalekit')
    expect(getIntegrationTypeLabel('scalekit')).toBe('Scalekit')
  })

  it('leaves a Scalekit custom domain as Custom OIDC', () => {
    expect(getIntegrationType(buildIntegration('https://auth.yourapp.ai'))).toBe('custom')
  })
})

describe('getIntegrationTypeLabel', () => {
  it('labels custom issuers as Custom OIDC', () => {
    expect(getIntegrationTypeLabel('custom')).toBe('Custom OIDC')
  })
})
