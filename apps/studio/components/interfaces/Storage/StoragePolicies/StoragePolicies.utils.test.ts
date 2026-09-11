import type { PGPolicy } from '@supabase/pg-meta'
import { describe, expect, it } from 'vitest'

import { createPayloadForUpdatePolicy, createSQLPolicy } from './StoragePolicies.utils'
import type { PolicyFormField } from './StoragePolicies.types'

const mockOriginalPolicy: PGPolicy = {
  id: 123,
  name: 'original_policy_name',
  schema: 'storage',
  table: 'objects',
  table_id: 456,
  action: 'PERMISSIVE',
  command: 'SELECT',
  definition: "bucket_id = 'avatars'",
  check: 'auth.uid() = owner',
  roles: ['authenticated'],
}

describe('StoragePolicies.utils', () => {
  describe('createPayloadForUpdatePolicy', () => {
    it('sets definition and check to null when cleared', () => {
      const formFields: PolicyFormField = {
        id: 123,
        name: 'original_policy_name',
        schema: 'storage',
        table: 'objects',
        command: 'SELECT',
        definition: '',
        check: null,
        roles: ['authenticated'],
      }

      const payload = createPayloadForUpdatePolicy(formFields, mockOriginalPolicy)

      expect(payload).toEqual({
        id: 123,
        definition: null,
        check: null,
      })
    })

    it('creates untrustedSql fragments when definition/check are updated to non-empty values', () => {
      const formFields: PolicyFormField = {
        id: 123,
        name: 'original_policy_name',
        schema: 'storage',
        table: 'objects',
        command: 'SELECT',
        definition: "bucket_id = 'public'",
        check: 'auth.uid() = owner',
        roles: ['authenticated'],
      }

      const payload = createPayloadForUpdatePolicy(formFields, mockOriginalPolicy)

      expect(payload.id).toBe(123)
      expect(payload.definition).toBeDefined()
      expect(payload.check).toBeUndefined() // check unchanged
    })

    it('returns empty payload when fields are unchanged', () => {
      const formFields: PolicyFormField = {
        id: 123,
        name: 'original_policy_name',
        schema: 'storage',
        table: 'objects',
        command: 'SELECT',
        definition: "bucket_id = 'avatars'",
        check: 'auth.uid() = owner',
        roles: ['authenticated'],
      }

      const payload = createPayloadForUpdatePolicy(formFields, mockOriginalPolicy)

      expect(payload).toEqual({ id: 123 })
    })
  })

  describe('createSQLPolicy', () => {
    it('generates USING (NULL) and WITH CHECK (NULL) when expressions are cleared', () => {
      const formFields: PolicyFormField = {
        id: 123,
        name: 'original_policy_name',
        schema: 'storage',
        table: 'objects',
        command: 'SELECT',
        definition: '',
        check: '',
        roles: ['authenticated'],
      }

      const review = createSQLPolicy(formFields, mockOriginalPolicy)

      expect(review.statement).toBe(
        [
          'BEGIN;',
          '  ALTER POLICY "original_policy_name" ON "storage"."objects" USING (NULL);',
          '  ALTER POLICY "original_policy_name" ON "storage"."objects" WITH CHECK (NULL);',
          'COMMIT;',
        ].join('\n')
      )
    })

    it('uses original policy name in alter statements when renaming policy', () => {
      const formFields: PolicyFormField = {
        id: 123,
        name: 'new_policy_name',
        schema: 'storage',
        table: 'objects',
        command: 'SELECT',
        definition: "bucket_id = 'avatars'",
        check: 'auth.uid() = owner',
        roles: ['authenticated'],
      }

      const review = createSQLPolicy(formFields, mockOriginalPolicy)

      expect(review.statement).toBe(
        [
          'BEGIN;',
          '  ALTER POLICY "original_policy_name" ON "storage"."objects" RENAME TO "new_policy_name";',
          'COMMIT;',
        ].join('\n')
      )
    })
  })
})
