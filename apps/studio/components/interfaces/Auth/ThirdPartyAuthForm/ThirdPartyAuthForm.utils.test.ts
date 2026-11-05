import { describe, expect, it } from 'vitest'

import {
  findCiOidcProviders,
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
})

describe('getIntegrationTypeLabel', () => {
  it('labels custom issuers as Custom OIDC', () => {
    expect(getIntegrationTypeLabel('custom')).toBe('Custom OIDC')
  })
})

describe('findCiOidcProviders', () => {
  const issuers: Array<[string, string]> = [
    ['https://token.actions.githubusercontent.com', 'GitHub Actions'],
    ['https://token.actions.githubusercontent.com/my-enterprise', 'GitHub Actions'],
    ['https://gitlab.com', 'GitLab.com'],
    ['https://oidc.circleci.com/org/0c1d2e3f-0000-1111-2222-333344445555', 'CircleCI'],
    [
      'https://api.bitbucket.org/2.0/workspaces/my-workspace/pipelines-config/identity/oidc',
      'Bitbucket Pipelines',
    ],
    ['https://agent.buildkite.com', 'Buildkite'],
    ['https://app.terraform.io', 'HCP Terraform'],
    ['https://vstoken.dev.azure.com/0c1d2e3f-0000-1111-2222-333344445555', 'Azure DevOps'],
    ['https://token.builds.bitrise.io', 'Bitrise'],
    ['https://oidc.codefresh.io', 'Codefresh'],
    ['https://my-org.semaphoreci.com', 'Semaphore'],
    ['https://app.harness.io/ng/api/oidc/account/AbCdEf123', 'Harness'],
    ['https://my-account.app.spacelift.io', 'Spacelift'],
  ]

  it.each(issuers)('matches the issuer %s', (issuerUrl, name) => {
    expect(findCiOidcProviders({ issuerUrl })).toEqual([name])
  })

  it.each([
    ['https://token.actions.githubusercontent.com/.well-known/jwks', 'GitHub Actions'],
    [
      'https://token.actions.githubusercontent.com/my-enterprise/.well-known/jwks',
      'GitHub Actions',
    ],
    ['https://gitlab.com/oauth/discovery/keys', 'GitLab.com'],
    ['https://oidc.circleci.com/org/my-org-id/.well-known/jwks-pub.json', 'CircleCI'],
    [
      'https://api.bitbucket.org/2.0/workspaces/my-workspace/pipelines-config/identity/oidc/keys.json',
      'Bitbucket Pipelines',
    ],
    ['https://agent.buildkite.com/.well-known/jwks.json', 'Buildkite'],
    ['https://app.terraform.io/.well-known/jwks', 'HCP Terraform'],
    ['https://vstoken.dev.azure.com/my-org-id/.well-known/jwks', 'Azure DevOps'],
    ['https://token.builds.bitrise.io/.well-known/jwks.json', 'Bitrise'],
    ['https://oidc.codefresh.io/.well-known/jwks', 'Codefresh'],
    ['https://my-org.semaphoreci.com/.well-known/jwks.json', 'Semaphore'],
    ['https://app.harness.io/ng/api/oidc/account/AbCdEf123/.well-known/jwks', 'Harness'],
    ['https://my-account.app.spacelift.io/.well-known/jwks', 'Spacelift'],
  ])('matches the JWKS URL %s', (jwksUrl, name) => {
    expect(findCiOidcProviders({ jwksUrl })).toEqual([name])
  })

  it.each([
    'https://token.actions.githubusercontent.com/',
    'https://token.actions.githubusercontent.com///',
    '  https://token.actions.githubusercontent.com  ',
    'HTTPS://TOKEN.ACTIONS.GITHUBUSERCONTENT.COM',
    'https://token.actions.githubusercontent.com:443',
    'https://token.actions.githubusercontent.com?x=1',
  ])('normalizes whitespace, case, default port, and trailing slashes in %j', (issuerUrl) => {
    expect(findCiOidcProviders({ issuerUrl })).toEqual(['GitHub Actions'])
  })

  it('keeps the case of per-tenant path segments', () => {
    expect(
      findCiOidcProviders({ issuerUrl: 'https://app.harness.io/ng/api/oidc/account/AbCdEf123/' })
    ).toEqual(['Harness'])
    expect(
      findCiOidcProviders({ issuerUrl: 'https://APP.HARNESS.IO/NG/api/oidc/account/AbCdEf123' })
    ).toEqual([])
  })

  it('returns every provider that matches the issuer or the JWKS URL', () => {
    expect(
      findCiOidcProviders({
        issuerUrl: 'https://gitlab.com',
        jwksUrl: 'https://app.terraform.io/.well-known/jwks',
      })
    ).toEqual(['GitLab.com', 'HCP Terraform'])
  })

  it.each([
    'https://login.example.com',
    'https://gitlab.com.evil.example',
    'https://evilgitlab.com',
    'https://token.actions.githubusercontent.com.evil.example',
    'https://evil.example/token.actions.githubusercontent.com',
    'https://gitlab.com@evil.example',
    'https://gitlab.com/group',
    'https://gitlab.com/oauth/discovery/keys',
    'https://token.actions.githubusercontent.com/.well-known/jwks',
    'https://token.actions.githubusercontent.com/a/b',
    'http://gitlab.com',
    'https://gitlab.com:8443',
    'https://oidc.circleci.com',
    'https://oidc.circleci.com/org',
    'https://oidc.circleci.com/org/',
    'https://oidc.circleci.com/org/my-org-id/extra',
    'https://oidc.circleci.com.evil.example/org/my-org-id',
    'https://evil.example/https://oidc.circleci.com/org/my-org-id',
    'https://api.bitbucket.org/2.0/workspaces/my-workspace',
    'https://api.bitbucket.org/2.0/workspaces//pipelines-config/identity/oidc',
    'https://vstoken.dev.azure.com',
    'https://vstoken.dev.azure.com.evil.example/my-org-id',
    'https://semaphoreci.com',
    'https://a.b.semaphoreci.com',
    'https://my-org.semaphoreci.com.evil.example',
    'https://my-account.spacelift.io',
    'https://app.spacelift.io',
    'https://app.harness.io',
    'https://app.harness.io/ng/api/oidc/account',
    'gitlab.com',
    'not a url',
    '',
  ])('does not match the issuer %j', (issuerUrl) => {
    expect(findCiOidcProviders({ issuerUrl })).toEqual([])
  })

  it.each([
    'https://token.actions.githubusercontent.com',
    'https://gitlab.com/oauth/discovery/keys/extra',
    'https://gitlab.com/OAuth/discovery/keys',
    'https://gitlab.com.evil.example/oauth/discovery/keys',
    'https://evil.example/oauth/discovery/keys',
    'https://agent.buildkite.com/.well-known/jwks',
    'https://oidc.circleci.com/org/my-org-id',
    'https://oidc.circleci.com/org//.well-known/jwks-pub.json',
    'https://login.example.com/.well-known/jwks',
  ])('does not match the JWKS URL %j', (jwksUrl) => {
    expect(findCiOidcProviders({ jwksUrl })).toEqual([])
  })

  it('returns an empty list for missing values', () => {
    expect(findCiOidcProviders({})).toEqual([])
    expect(findCiOidcProviders({ issuerUrl: null, jwksUrl: undefined })).toEqual([])
  })
})
