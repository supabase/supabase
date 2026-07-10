import { describe, expect, test } from 'vitest'

import {
  buildVercelInstallRouteQuery,
  getErrorMessage,
  getVercelInstallSource,
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

  test('only keeps marketplace destination params', () => {
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

describe('getVercelInstallSource', () => {
  test('returns supported Vercel install sources', () => {
    expect(getVercelInstallSource('deploy-button')).toBe('deploy-button')
    expect(getVercelInstallSource('marketplace')).toBe('marketplace')
    expect(getVercelInstallSource('external')).toBe('external')
  })

  test('returns undefined for unsupported sources', () => {
    expect(getVercelInstallSource('deploybutton')).toBeUndefined()
    expect(getVercelInstallSource(undefined)).toBeUndefined()
  })
})
