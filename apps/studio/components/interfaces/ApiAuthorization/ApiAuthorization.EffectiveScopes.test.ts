import { OAuthScope } from '@supabase/shared-types/out/constants'
import { describe, expect, test } from 'vitest'

import { resolveEffectiveScopes } from './ApiAuthorization.EffectiveScopes'

const REQUESTED = [OAuthScope.DATABASE_READ, OAuthScope.DATABASE_WRITE, OAuthScope.SECRETS_READ]
const DEVELOPER = { name: 'Developer' }

describe('resolveEffectiveScopes', () => {
  test('grants every requested scope when the role covers them', () => {
    expect(
      resolveEffectiveScopes({
        requested: REQUESTED,
        allowPartialGrants: true,
        preflight: { existing_grant: null, validation_failure: null },
      })
    ).toEqual({ _tag: 'full', scopes: REQUESTED })
  })

  test('splits granted and denied scopes for partial grants', () => {
    expect(
      resolveEffectiveScopes({
        requested: REQUESTED,
        allowPartialGrants: true,
        preflight: {
          existing_grant: null,
          validation_failure: {
            scope_target: 'all_projects',
            role: DEVELOPER,
            failed_scopes: [OAuthScope.SECRETS_READ],
          },
        },
      })
    ).toEqual({
      _tag: 'partial',
      granted: [OAuthScope.DATABASE_READ, OAuthScope.DATABASE_WRITE],
      denied: [OAuthScope.SECRETS_READ],
      roleName: 'Developer',
    })
  })

  test('blocks when the app does not allow partial grants', () => {
    expect(
      resolveEffectiveScopes({
        requested: REQUESTED,
        allowPartialGrants: false,
        preflight: {
          existing_grant: null,
          validation_failure: {
            scope_target: 'all_projects',
            role: DEVELOPER,
            failed_scopes: [OAuthScope.SECRETS_READ],
          },
        },
      })
    ).toEqual({ _tag: 'blocked', roleName: 'Developer', missing: [OAuthScope.SECRETS_READ] })
  })

  test('blocks when every requested scope fails, even with partial grants allowed', () => {
    expect(
      resolveEffectiveScopes({
        requested: REQUESTED,
        allowPartialGrants: true,
        preflight: {
          existing_grant: null,
          validation_failure: {
            scope_target: 'all_projects',
            role: DEVELOPER,
            failed_scopes: REQUESTED,
          },
        },
      })
    ).toEqual({ _tag: 'blocked', roleName: 'Developer', missing: REQUESTED })
  })

  test('blocks on organization-level failures without listing scopes', () => {
    expect(
      resolveEffectiveScopes({
        requested: REQUESTED,
        allowPartialGrants: true,
        preflight: {
          existing_grant: null,
          validation_failure: { scope_target: 'organization', role: { name: 'Read-only' } },
        },
      })
    ).toEqual({ _tag: 'blocked', roleName: 'Read-only', missing: [] })
  })

  test('unions failed scopes across project failures', () => {
    expect(
      resolveEffectiveScopes({
        requested: REQUESTED,
        allowPartialGrants: true,
        preflight: {
          existing_grant: null,
          validation_failure: {
            scope_target: 'projects',
            failures: [
              { ref: 'a', role: DEVELOPER, failed_scopes: [OAuthScope.SECRETS_READ] },
              { ref: 'b', role: DEVELOPER, failed_scopes: [OAuthScope.DATABASE_WRITE] },
            ],
          },
        },
      })
    ).toEqual({
      _tag: 'partial',
      granted: [OAuthScope.DATABASE_READ],
      denied: [OAuthScope.DATABASE_WRITE, OAuthScope.SECRETS_READ],
      roleName: 'Developer',
    })
  })
})
