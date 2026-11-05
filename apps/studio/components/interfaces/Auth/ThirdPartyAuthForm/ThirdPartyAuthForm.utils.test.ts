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
    ['https://token.actions.my-sub.ghe.com', 'GitHub Actions'],
    ['https://token.actions.my-sub.ghe.com/my-enterprise', 'GitHub Actions'],
    ['https://github.example.com/_services/token', 'GitHub Actions'],
    ['https://gitlab.com', 'GitLab CI/CD'],
    ['https://oidc.circleci.com', 'CircleCI'],
    ['https://oidc.circleci.com/org/0c1d2e3f-0000-1111-2222-333344445555', 'CircleCI'],
    [
      'https://api.bitbucket.org/2.0/workspaces/my-workspace/pipelines-config/identity/oidc',
      'Bitbucket Pipelines',
    ],
    ['https://agent.buildkite.com', 'Buildkite'],
    ['https://app.terraform.io', 'HCP Terraform'],
    ['https://my-org.semaphoreci.com', 'Semaphore'],
    ['https://vstoken.dev.azure.com/0c1d2e3f-0000-1111-2222-333344445555', 'Azure DevOps'],
    ['https://token.builds.bitrise.io', 'Bitrise'],
    ['https://oidc.codefresh.io', 'Codefresh'],
    ['https://app.harness.io/ng/api/oidc/account/AbCdEf123', 'Harness'],
    ['https://my-account.app.spacelift.io', 'Spacelift'],
  ]

  it.each(issuers)('matches the issuer %s', (issuerUrl, name) => {
    expect(findCiOidcProviders({ issuerUrl })).toEqual([name])
  })

  it.each([
    ['https://gitlab.com/oauth/discovery/keys', 'GitLab CI/CD'],
    [
      'https://api.bitbucket.org/2.0/workspaces/my-workspace/pipelines-config/identity/oidc/keys.json',
      'Bitbucket Pipelines',
    ],
    ['https://agent.buildkite.com/.well-known/jwks', 'Buildkite'],
    ['https://app.terraform.io/.well-known/jwks', 'HCP Terraform'],
  ])('matches the JWKS URL %s', (jwksUrl, name) => {
    expect(findCiOidcProviders({ jwksUrl })).toEqual([name])
  })

  it.each([
    'https://token.actions.githubusercontent.com/',
    'https://token.actions.githubusercontent.com///',
    '  https://token.actions.githubusercontent.com  ',
    'HTTPS://TOKEN.ACTIONS.GITHUBUSERCONTENT.COM',
    'https://token.actions.githubusercontent.com:443',
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
    ).toEqual(['GitLab CI/CD', 'HCP Terraform'])
  })

  it.each([
    'https://login.example.com',
    'https://integrations.vercel.com/my-integration-id',
    'https://gitlab.com.evil.example',
    'https://evilgitlab.com',
    'https://token.actions.githubusercontent.com.evil.example',
    'https://evil.example/token.actions.githubusercontent.com',
    'https://gitlab.com@evil.example',
    'https://user:pass@gitlab.com',
    'https://gitlab.com/group',
    'https://gitlab.com/oauth/discovery/keys',
    'https://token.actions.githubusercontent.com/.well-known/jwks',
    'https://token.actions.githubusercontent.com/a/b',
    'https://token.actions.ghe.com',
    'https://token.actions.my-sub.ghe.com.evil.example',
    'https://evil.example/_services/token/extra',
    'http://gitlab.com',
    'https://gitlab.com:8443',
    'https://gitlab.com?x=1',
    'https://gitlab.com/#fragment',
    'https://oidc.circleci.com/org',
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
    'https://token.actions.githubusercontent.com/.well-known/jwks',
    'https://gitlab.com/oauth/discovery/keys/extra',
    'https://gitlab.com/OAuth/discovery/keys',
    'https://gitlab.com.evil.example/oauth/discovery/keys',
    'https://evil.example/oauth/discovery/keys',
    'https://agent.buildkite.com/.well-known/jwks.json',
    'https://app.terraform.io/.well-known/jwks?x=1',
    'https://oidc.circleci.com/org/my-org-id/.well-known/jwks-pub.json',
    'https://login.example.com/.well-known/jwks',
  ])('does not match the JWKS URL %j', (jwksUrl) => {
    expect(findCiOidcProviders({ jwksUrl })).toEqual([])
  })

  it('returns an empty list for missing values', () => {
    expect(findCiOidcProviders({})).toEqual([])
    expect(findCiOidcProviders({ issuerUrl: null, jwksUrl: undefined })).toEqual([])
  })
})
