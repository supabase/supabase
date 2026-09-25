import { describe, expect, it } from 'vitest'
import type { PGPolicy } from '@supabase/pg-meta'

import { createSQLPolicy } from './StoragePolicies.utils'
import type { PolicyFormField } from './StoragePolicies.types'

describe('StoragePolicies.utils createSQLPolicy', () => {
  const originalPolicy: PGPolicy = {
    id: 1,
    table_id: 10,
    name: 'Original policy name',
    schema: 'storage',
    table: 'objects',
    action: 'PERMISSIVE',
    command: 'UPDATE',
    definition: 'bucket_id = \'avatars\'',
    check: 'auth.uid() = owner',
    roles: ['authenticated'],
  }

  it('generates rename statement using original policy name in ALTER POLICY', () => {
    const updatedFormFields: PolicyFormField = {
      name: 'New policy name',
      schema: 'storage',
      table: 'objects',
      command: 'UPDATE',
      definition: 'bucket_id = \'avatars\'',
      check: 'auth.uid() = owner',
      roles: ['authenticated'],
    }

    const review = createSQLPolicy(updatedFormFields, originalPolicy)
    expect(review.statement).toContain('ALTER POLICY "Original policy name" ON "storage"."objects" RENAME TO "New policy name";')
  })

  it('updates expressions with valid SQL syntax', () => {
    const updatedFormFields: PolicyFormField = {
      name: 'Original policy name',
      schema: 'storage',
      table: 'objects',
      command: 'UPDATE',
      definition: 'bucket_id = \'photos\'',
      check: 'auth.uid() = owner',
      roles: ['authenticated'],
    }

    const review = createSQLPolicy(updatedFormFields, originalPolicy)
    expect(review.statement).toContain('ALTER POLICY "Original policy name" ON "storage"."objects" USING (bucket_id = \'photos\');')
  })

  it('does not generate invalid empty USING () or WITH CHECK () statements if expressions are empty', () => {
    const updatedFormFields: PolicyFormField = {
      name: 'Original policy name',
      schema: 'storage',
      table: 'objects',
      command: 'UPDATE',
      definition: '',
      check: '',
      roles: ['authenticated'],
    }

    const review = createSQLPolicy(updatedFormFields, originalPolicy)
    expect(review.statement).not.toContain('WITH CHECK ();')
    expect(review.statement).not.toContain('USING ();')
  })
})
