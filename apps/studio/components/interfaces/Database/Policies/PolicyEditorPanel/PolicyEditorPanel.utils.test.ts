import type { PGPolicy } from '@supabase/pg-meta'
import { describe, expect, it } from 'vitest'

import { generateUpdatePolicyPayload } from './PolicyEditorPanel.utils'

type PolicyFixture = Pick<PGPolicy, 'name' | 'roles' | 'command' | 'definition' | 'check'>

const mockPolicy = (overrides: Partial<PolicyFixture> = {}): PolicyFixture => ({
  name: 'my_policy',
  roles: ['authenticated'],
  command: 'DELETE',
  definition: 'user_id = auth.uid()',
  check: null,
  ...overrides,
})

const baseForm = {
  name: 'my_policy',
  roles: ['authenticated'],
  // The panel prefills editors with two leading spaces of indentation
  using: '  user_id = auth.uid()',
  check: undefined,
}

describe('generateUpdatePolicyPayload', () => {
  it('returns an empty payload when nothing changed', () => {
    expect(generateUpdatePolicyPayload(mockPolicy(), baseForm)).toEqual({})
  })

  it('includes the definition when a policy with a null definition gains a using expression', () => {
    const payload = generateUpdatePolicyPayload(mockPolicy({ definition: null }), {
      ...baseForm,
      using: 'true',
    })
    expect(payload).toEqual({ definition: 'true' })
  })

  it('includes the definition when the using expression changed', () => {
    const payload = generateUpdatePolicyPayload(mockPolicy(), { ...baseForm, using: 'true' })
    expect(payload).toEqual({ definition: 'true' })
  })

  it('omits the definition when the using expression is empty', () => {
    expect(generateUpdatePolicyPayload(mockPolicy(), { ...baseForm, using: '' })).toEqual({})
    expect(generateUpdatePolicyPayload(mockPolicy(), { ...baseForm, using: '   ' })).toEqual({})
    expect(generateUpdatePolicyPayload(mockPolicy(), { ...baseForm, using: undefined })).toEqual({})
  })

  it('includes the check when a policy with a null check gains a check expression', () => {
    const payload = generateUpdatePolicyPayload(mockPolicy({ command: 'UPDATE' }), {
      ...baseForm,
      check: 'is_admin()',
    })
    expect(payload).toEqual({ check: 'is_admin()' })
  })

  it('includes the check when the check expression changed', () => {
    const payload = generateUpdatePolicyPayload(
      mockPolicy({ command: 'UPDATE', check: 'is_admin()' }),
      { ...baseForm, check: 'is_owner()' }
    )
    expect(payload).toEqual({ check: 'is_owner()' })
  })

  it('omits the check when the check expression is unchanged or empty', () => {
    const withCheck = mockPolicy({ command: 'UPDATE', check: 'is_admin()' })
    expect(generateUpdatePolicyPayload(withCheck, { ...baseForm, check: '  is_admin()' })).toEqual(
      {}
    )
    expect(generateUpdatePolicyPayload(withCheck, { ...baseForm, check: '' })).toEqual({})
  })

  it('maps the using editor to the check field for INSERT policies', () => {
    const insertPolicy = mockPolicy({ command: 'INSERT', definition: null, check: null })
    const payload = generateUpdatePolicyPayload(insertPolicy, { ...baseForm, using: 'true' })
    expect(payload).toEqual({ check: 'true' })
  })

  it('never includes a definition for INSERT policies', () => {
    const insertPolicy = mockPolicy({ command: 'INSERT', definition: null, check: 'true' })
    const payload = generateUpdatePolicyPayload(insertPolicy, {
      ...baseForm,
      using: 'is_admin()',
      check: 'ignored',
    })
    expect(payload).toEqual({ check: 'is_admin()' })
  })

  it('omits the check for INSERT policies when the expression is unchanged', () => {
    const insertPolicy = mockPolicy({ command: 'INSERT', definition: null, check: 'true' })
    expect(generateUpdatePolicyPayload(insertPolicy, { ...baseForm, using: '  true' })).toEqual({})
  })

  it('includes the name and roles when they changed', () => {
    const payload = generateUpdatePolicyPayload(mockPolicy(), {
      ...baseForm,
      name: 'renamed_policy',
      roles: ['anon', 'authenticated'],
    })
    expect(payload).toEqual({ name: 'renamed_policy', roles: ['anon', 'authenticated'] })
  })
})
