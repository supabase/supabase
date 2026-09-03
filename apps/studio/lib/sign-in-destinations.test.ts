import { describe, expect, test } from 'vitest'

import { getDestinationById } from './sign-in-destinations'

describe('sign-in destinations', () => {
  test('resolves a registered destination from its id', () => {
    expect(getDestinationById('cli')?.id).toBe('cli')
    expect(getDestinationById('cli')?.displayName).toBe('Supabase CLI')
  })

  test('does not resolve a destination for unknown or missing ids', () => {
    expect(getDestinationById('organizations')).toBeUndefined()
    expect(getDestinationById('oauth-app')).toBeUndefined()
    expect(getDestinationById('')).toBeUndefined()
    expect(getDestinationById(undefined)).toBeUndefined()
  })
})
