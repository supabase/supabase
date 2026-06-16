import { describe, expect, test } from 'vitest'

import {
  getAuthorizeRequestId,
  getDestinationForReturnTo,
  getOAuthAppDestination,
} from './sign-in-destinations'

describe('sign-in destinations', () => {
  test('resolves the CLI destination from its returnTo path', () => {
    expect(getDestinationForReturnTo('/cli/login')?.id).toBe('cli')
    expect(getDestinationForReturnTo('/cli/login?session_id=abc&public_key=def')?.id).toBe('cli')
  })

  test('does not resolve a destination for unbranded or missing returnTo paths', () => {
    expect(getDestinationForReturnTo('/organizations')).toBeUndefined()
    expect(getDestinationForReturnTo('/cli/login-other')).toBeUndefined()
    expect(getDestinationForReturnTo('/authorize?auth_id=123')).toBeUndefined()
    expect(getDestinationForReturnTo(undefined)).toBeUndefined()
  })

  test('extracts the auth_id from an OAuth consent returnTo path', () => {
    expect(getAuthorizeRequestId('/authorize?auth_id=abc123')).toBe('abc123')
    expect(getAuthorizeRequestId('/authorize?auth_id=abc123&organization_slug=org')).toBe('abc123')
    expect(getAuthorizeRequestId('/authorize')).toBeUndefined()
    expect(getAuthorizeRequestId('/authorize?auth_id=')).toBeUndefined()
    expect(getAuthorizeRequestId('/authorized?auth_id=abc123')).toBeUndefined()
    expect(getAuthorizeRequestId('/cli/login')).toBeUndefined()
    expect(getAuthorizeRequestId(undefined)).toBeUndefined()
  })

  test('brands an OAuth app destination with its icon or initial fallback', () => {
    const withIcon = getOAuthAppDestination({ name: 'Acme App', icon: 'https://acme.app/icon.png' })
    expect(withIcon.displayName).toBe('Acme App')
    expect(withIcon.icon).toBeDefined()

    const withoutIcon = getOAuthAppDestination({ name: 'Acme App', icon: null })
    expect(withoutIcon.icon).toBeUndefined()
  })
})
