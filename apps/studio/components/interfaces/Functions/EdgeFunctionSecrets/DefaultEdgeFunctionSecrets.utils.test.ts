import { describe, expect, it } from 'vitest'

import {
  DEFAULT_EDGE_FUNCTION_SECRETS,
  getVisibleDefaultEdgeFunctionSecrets,
  isInternalEdgeFunctionSecret,
} from './DefaultEdgeFunctionSecrets.utils'

describe('isInternalEdgeFunctionSecret', () => {
  it.each(['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_THIS_DOES_NOT_EXIST_YET'])(
    'treats SUPABASE_-prefixed names as internal (%s)',
    (name) => {
      expect(isInternalEdgeFunctionSecret(name)).toBe(true)
    }
  )

  it.each(['SB_REGION', 'SB_EXECUTION_ID', 'DENO_DEPLOYMENT_ID'])(
    'treats hardcoded default name %s as internal',
    (name) => {
      expect(isInternalEdgeFunctionSecret(name)).toBe(true)
    }
  )

  it.each(['MY_API_KEY', 'STRIPE_SECRET', 'sb_region', 'DENO_OTHER_VAR'])(
    'treats user-defined name %s as not internal',
    (name) => {
      expect(isInternalEdgeFunctionSecret(name)).toBe(false)
    }
  )
})

describe('getVisibleDefaultEdgeFunctionSecrets', () => {
  const runtimeNames = DEFAULT_EDGE_FUNCTION_SECRETS.filter((secret) => secret.isRuntime).map(
    (secret) => secret.name
  )
  const staticNames = DEFAULT_EDGE_FUNCTION_SECRETS.filter((secret) => !secret.isRuntime).map(
    (secret) => secret.name
  )

  it('always includes runtime secrets', () => {
    const result = getVisibleDefaultEdgeFunctionSecrets(new Set())
    for (const name of runtimeNames) {
      expect(result.map((secret) => secret.name)).toContain(name)
    }
  })

  it('falls back to the full hardcoded list when API returned no static defaults', () => {
    const result = getVisibleDefaultEdgeFunctionSecrets(new Set())
    expect(result.map((secret) => secret.name)).toEqual([...staticNames, ...runtimeNames])
  })

  it('shows only the static defaults present in the API response', () => {
    const apiNames = new Set(['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'MY_USER_SECRET'])
    const result = getVisibleDefaultEdgeFunctionSecrets(apiNames)

    expect(result.map((secret) => secret.name)).toEqual([
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      ...runtimeNames,
    ])
  })

  it('does not surface user-defined secret names from the API set', () => {
    const apiNames = new Set(['SUPABASE_URL', 'MY_USER_SECRET'])
    const result = getVisibleDefaultEdgeFunctionSecrets(apiNames)
    expect(result.map((secret) => secret.name)).not.toContain('MY_USER_SECRET')
  })
})
