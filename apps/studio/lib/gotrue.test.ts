import { describe, expect, it } from 'vitest'

import {
  buildSignUpReturnPath,
  DEFAULT_FALLBACK_PATH,
  DEFAULT_SIGNUP_RETURN_PATH,
  getSignUpReturnTo,
  validateReturnTo,
} from './gotrue'

describe('getSignUpReturnTo', () => {
  it('defaults to /new when returnTo is missing', () => {
    expect(getSignUpReturnTo(undefined)).toBe(DEFAULT_SIGNUP_RETURN_PATH)
    expect(getSignUpReturnTo('')).toBe(DEFAULT_SIGNUP_RETURN_PATH)
  })

  it('rewrites /org and /organizations to /new', () => {
    expect(getSignUpReturnTo('/org')).toBe(DEFAULT_SIGNUP_RETURN_PATH)
    expect(getSignUpReturnTo('/organizations')).toBe(DEFAULT_SIGNUP_RETURN_PATH)
  })

  it('rewrites org list paths while preserving query params', () => {
    expect(getSignUpReturnTo('/org?foo=bar')).toBe('/new?foo=bar')
    expect(getSignUpReturnTo('/organizations?foo=bar')).toBe('/new?foo=bar')
  })

  it('preserves explicit destinations including invite paths', () => {
    expect(getSignUpReturnTo('/join?token=abc')).toBe('/join?token=abc')
    expect(getSignUpReturnTo('/project/ref')).toBe('/project/ref')
  })

  it('uses the first value when returnTo is an array', () => {
    expect(getSignUpReturnTo(['/join?token=abc', '/other'])).toBe('/join?token=abc')
    expect(getSignUpReturnTo(['/org'])).toBe(DEFAULT_SIGNUP_RETURN_PATH)
    expect(getSignUpReturnTo(['/organizations'])).toBe(DEFAULT_SIGNUP_RETURN_PATH)
  })
})

describe('buildSignUpReturnPath', () => {
  it('defaults to /new when returnTo is missing', () => {
    // @ts-ignore
    delete window.location
    // @ts-ignore
    window.location = { search: '' }

    expect(buildSignUpReturnPath(undefined)).toBe(DEFAULT_SIGNUP_RETURN_PATH)
  })

  it('rewrites /org and /organizations to /new', () => {
    // @ts-ignore
    delete window.location
    // @ts-ignore
    window.location = { search: '' }

    expect(buildSignUpReturnPath('/org')).toBe(DEFAULT_SIGNUP_RETURN_PATH)
    expect(buildSignUpReturnPath('/organizations')).toBe(DEFAULT_SIGNUP_RETURN_PATH)
  })

  it('rewrites org list paths while preserving query params', () => {
    // @ts-ignore
    delete window.location
    // @ts-ignore
    window.location = { search: '' }

    expect(buildSignUpReturnPath('/org?foo=bar')).toBe('/new?foo=bar')
    expect(buildSignUpReturnPath('/organizations?foo=bar')).toBe('/new?foo=bar')
  })

  it('preserves invite returnTo paths', () => {
    // @ts-ignore
    delete window.location
    // @ts-ignore
    window.location = { search: '' }

    expect(buildSignUpReturnPath('/join?token=abc')).toBe('/join?token=abc')
  })

  it('falls back to /new for invalid returnTo values', () => {
    // @ts-ignore
    delete window.location
    // @ts-ignore
    window.location = { search: '' }

    expect(buildSignUpReturnPath('https://evil.com')).toBe(DEFAULT_SIGNUP_RETURN_PATH)
    expect(buildSignUpReturnPath('//evil.com')).toBe(DEFAULT_SIGNUP_RETURN_PATH)
  })

  it('strips returnTo from the current location search params', () => {
    // @ts-ignore
    delete window.location
    // @ts-ignore
    window.location = { search: '?returnTo=/org&foo=bar' }

    expect(buildSignUpReturnPath('/new')).toBe('/new?foo=bar')
  })

  it('uses the first value when returnTo is an array', () => {
    // @ts-ignore
    delete window.location
    // @ts-ignore
    window.location = { search: '' }

    expect(buildSignUpReturnPath(['/join?token=abc', '/other'])).toBe('/join?token=abc')
  })
})

describe('validateReturnTo', () => {
  const fallback = DEFAULT_FALLBACK_PATH

  it('should return the path if it is a valid internal path', () => {
    expect(validateReturnTo('/dashboard')).toBe('/dashboard')
    expect(validateReturnTo('/settings/profile')).toBe('/settings/profile')
    expect(validateReturnTo('/projects?id=123')).toBe('/projects?id=123')
  })

  it('should return fallback if given an external URL', () => {
    expect(validateReturnTo('https://example.com')).toBe(fallback)
    expect(validateReturnTo('http://malicious-site.com')).toBe(fallback)
    expect(validateReturnTo('//evil.com')).toBe(fallback)
  })

  it('should return fallback for potentially malicious paths', () => {
    expect(validateReturnTo('/%2e%2e/etc/passwd')).toBe(fallback)
    expect(validateReturnTo('/..')).toBe(fallback)
    expect(validateReturnTo('/@evil/path')).toBe(fallback)
    expect(validateReturnTo('/$malicious')).toBe(fallback)
  })

  it('should use custom fallback when provided', () => {
    const customFallback = '/custom-fallback'
    expect(validateReturnTo('https://example.com', customFallback)).toBe(customFallback)
    expect(validateReturnTo('/%2e%2e/etc/passwd', customFallback)).toBe(customFallback)
  })

  it('should handle paths with query parameters correctly', () => {
    expect(validateReturnTo('/dashboard?param1=value1&param2=value2')).toBe(
      '/dashboard?param1=value1&param2=value2'
    )
  })

  it('should handle nextjs dynamic path js', () => {
    expect(
      validateReturnTo(
        '%2F%5B%5Bx%5D%5Djavascript%3Aalert(%22H4CK3D%22)%2F%5By%5D%2F%5B%5Bx%5D%5D%2F%5By%5D%3Fx%26y'
      )
    ).toBe(fallback)
    expect(
      validateReturnTo(
        '/%2F%5B%5Bx%5D%5Djavascript%3Aalert(%22H4CK3D%22)%2F%5By%5D%2F%5B%5Bx%5D%5D%2F%5By%5D%3Fx%26y'
      )
    ).toBe(fallback)
  })
})
