import { describe, expect, it } from 'vitest'

import { getAuthenticatorDbSchemasOverride } from './authenticator-role-config-query.utils'

describe('getAuthenticatorDbSchemasOverride', () => {
  it('returns null when the role has no config set', () => {
    expect(getAuthenticatorDbSchemasOverride(null)).toBeNull()
  })

  it('returns null when rolconfig has no pgrst.db_schemas entry', () => {
    expect(getAuthenticatorDbSchemasOverride(['search_path=public'])).toBeNull()
  })

  it('parses a single overridden schema', () => {
    expect(getAuthenticatorDbSchemasOverride(['pgrst.db_schemas=public'])).toEqual(['public'])
  })

  it('parses multiple overridden schemas', () => {
    expect(
      getAuthenticatorDbSchemasOverride([
        'search_path=public',
        'pgrst.db_schemas=public,custom_schema',
      ])
    ).toEqual(['public', 'custom_schema'])
  })

  it('trims whitespace around schema names', () => {
    expect(getAuthenticatorDbSchemasOverride(['pgrst.db_schemas=public, custom_schema'])).toEqual([
      'public',
      'custom_schema',
    ])
  })
})
