import { describe, expect, test } from 'vitest'

import {
  buildVercelInstallRouteQuery,
  getErrorMessage,
  hasVercelDeployButtonSignals,
  resolveVercelInstallSource,
} from '@/lib/integrations/vercel-install.utils'

describe('getErrorMessage', () => {
  test('returns the message from an Error instance', () => {
    expect(getErrorMessage(new Error('Something went wrong'))).toBe('Something went wrong')
  })

  test('returns the message from an error-like object', () => {
    expect(getErrorMessage({ message: 'Request failed' })).toBe('Request failed')
  })

  test('returns undefined for non-string object messages', () => {
    expect(getErrorMessage({ message: 404 })).toBeUndefined()
  })

  test('returns undefined for primitive and empty inputs', () => {
    expect(getErrorMessage('Request failed')).toBeUndefined()
    expect(getErrorMessage(null)).toBeUndefined()
    expect(getErrorMessage(undefined)).toBeUndefined()
  })
})

describe('buildVercelInstallRouteQuery', () => {
  test('only keeps deploy-button destination params', () => {
    expect(
      buildVercelInstallRouteQuery({
        source: 'deploy-button',
        organizationSlug: 'acme',
        currentProjectId: 'vercel-project',
        externalId: 'github-repo',
        next: 'https://vercel.com/callback',
        configurationId: 'configuration-id',
      })
    ).toStrictEqual({
      organizationSlug: 'acme',
      currentProjectId: 'vercel-project',
      externalId: 'github-repo',
      next: 'https://vercel.com/callback',
    })
  })

  test('keeps marketplace params and passes through deploy-button ids when present', () => {
    expect(
      buildVercelInstallRouteQuery({
        source: 'marketplace',
        organizationSlug: 'acme',
        configurationId: 'configuration-id',
        currentProjectId: 'vercel-project',
        externalId: 'github-repo',
        next: 'https://vercel.com/callback',
      })
    ).toStrictEqual({
      organizationSlug: 'acme',
      configurationId: 'configuration-id',
      currentProjectId: 'vercel-project',
      externalId: 'github-repo',
      next: 'https://vercel.com/callback',
    })
  })

  test('removes undefined params', () => {
    expect(
      buildVercelInstallRouteQuery({
        source: 'external',
        organizationSlug: 'acme',
        configurationId: undefined,
        next: undefined,
      })
    ).toStrictEqual({ organizationSlug: 'acme' })
  })

  test('only keeps organizationSlug when source is undefined', () => {
    expect(
      buildVercelInstallRouteQuery({
        source: undefined,
        organizationSlug: 'acme',
        configurationId: 'configuration-id',
        currentProjectId: 'vercel-project',
        externalId: 'github-repo',
        next: 'https://vercel.com/callback',
      })
    ).toStrictEqual({ organizationSlug: 'acme' })
  })
})

describe('hasVercelDeployButtonSignals', () => {
  test('requires both currentProjectId and externalId', () => {
    expect(
      hasVercelDeployButtonSignals({
        currentProjectId: 'prj_123',
        externalId: 'https://github.com/org/repo',
      })
    ).toBe(true)
    expect(hasVercelDeployButtonSignals({ currentProjectId: 'prj_123' })).toBe(false)
    expect(hasVercelDeployButtonSignals({ externalId: 'https://github.com/org/repo' })).toBe(false)
    expect(hasVercelDeployButtonSignals({})).toBe(false)
  })
})

describe('resolveVercelInstallSource', () => {
  test('overrides marketplace and external when deploy-button signals are present', () => {
    expect(
      resolveVercelInstallSource({
        source: 'marketplace',
        currentProjectId: 'prj_123',
        externalId: 'https://github.com/org/repo',
      })
    ).toBe('deploy-button')
    expect(
      resolveVercelInstallSource({
        source: 'external',
        currentProjectId: 'prj_123',
        externalId: 'https://github.com/org/repo',
      })
    ).toBe('deploy-button')
  })

  test('keeps the declared source when deploy-button signals are incomplete', () => {
    expect(
      resolveVercelInstallSource({
        source: 'marketplace',
        currentProjectId: 'prj_123',
      })
    ).toBe('marketplace')
    expect(resolveVercelInstallSource({ source: 'deploy-button' })).toBe('deploy-button')
    expect(resolveVercelInstallSource({ source: undefined })).toBeUndefined()
  })
})
