import { describe, expect, test } from 'vitest'

import pgPolicies from '../../src/pg-meta-policies'
import type { PGPolicy } from '../../src/pg-meta-policies'

describe('pg-meta-policies SQL generation', () => {
  describe('list', () => {
    test('should generate basic list query', () => {
      const { sql } = pgPolicies.list()
      expect(sql).toContain('select *')
      expect(sql).toContain('from policies')
    })

    test('should exclude system schemas by default', () => {
      const { sql } = pgPolicies.list()
      expect(sql).toContain('where schema')
      expect(sql).toContain('NOT IN')
    })

    test('should include system schemas when requested', () => {
      const { sql } = pgPolicies.list({ includeSystemSchemas: true })
      expect(sql).not.toContain('NOT IN')
    })

    test('should apply limit', () => {
      const { sql } = pgPolicies.list({ limit: 50 })
      expect(sql).toContain('limit 50')
    })

    test('should apply offset', () => {
      const { sql } = pgPolicies.list({ offset: 10 })
      expect(sql).toContain('offset 10')
    })

    test('should filter by included schemas', () => {
      const { sql } = pgPolicies.list({ includedSchemas: ['public'] })
      expect(sql).toContain("'public'")
      expect(sql).toContain('IN')
    })

    test('should filter by excluded schemas', () => {
      const { sql } = pgPolicies.list({
        includeSystemSchemas: true,
        excludedSchemas: ['private'],
      })
      expect(sql).toContain('NOT IN')
      expect(sql).toContain("'private'")
    })
  })

  describe('retrieve', () => {
    test('should retrieve by id', () => {
      const { sql } = pgPolicies.retrieve({ id: 123 })
      expect(sql).toContain('id = ')
      expect(sql).toContain('123')
    })

    test('should retrieve by name, schema, and table', () => {
      const { sql } = pgPolicies.retrieve({
        name: 'allow_read',
        schema: 'public',
        table: 'users',
      })
      expect(sql).toContain("name = 'allow_read'")
      expect(sql).toContain("schema = 'public'")
      expect(sql).toContain("table = 'users'")
    })
  })

  describe('create', () => {
    test('should generate basic create policy SQL', () => {
      const { sql } = pgPolicies.create({
        name: 'allow_select',
        table: 'users',
      })
      expect(sql).toContain('create policy')
      expect(sql).toContain('allow_select')
      expect(sql).toContain('public')
      expect(sql).toContain('users')
      expect(sql).toContain('PERMISSIVE')
      expect(sql).toContain('ALL')
    })

    test('should generate create policy with USING clause', () => {
      const { sql } = pgPolicies.create({
        name: 'rls_policy',
        table: 'posts',
        definition: 'auth.uid() = user_id',
      })
      expect(sql).toContain('using (auth.uid() = user_id)')
    })

    test('should generate create policy with WITH CHECK clause', () => {
      const { sql } = pgPolicies.create({
        name: 'insert_check',
        table: 'posts',
        check: 'auth.uid() = user_id',
        command: 'INSERT',
      })
      expect(sql).toContain('with check (auth.uid() = user_id)')
      expect(sql).toContain('INSERT')
    })

    test('should generate create policy with RESTRICTIVE action', () => {
      const { sql } = pgPolicies.create({
        name: 'restrict_policy',
        table: 'sensitive_data',
        action: 'RESTRICTIVE',
      })
      expect(sql).toContain('RESTRICTIVE')
    })

    test('should generate create policy with specific command', () => {
      const { sql } = pgPolicies.create({
        name: 'select_only',
        table: 'users',
        command: 'SELECT',
      })
      expect(sql).toContain('for SELECT')
    })

    test('should generate create policy with specific roles', () => {
      const { sql } = pgPolicies.create({
        name: 'admin_policy',
        table: 'users',
        roles: ['admin', 'superadmin'],
      })
      expect(sql).toContain('admin')
      expect(sql).toContain('superadmin')
    })

    test('should generate create policy with custom schema', () => {
      const { sql } = pgPolicies.create({
        name: 'custom_policy',
        schema: 'app',
        table: 'profiles',
      })
      expect(sql).toContain('app')
      expect(sql).toContain('profiles')
    })

    test('should generate create policy with both USING and WITH CHECK', () => {
      const { sql } = pgPolicies.create({
        name: 'full_policy',
        table: 'posts',
        definition: 'auth.uid() = author_id',
        check: 'auth.uid() = author_id',
        command: 'UPDATE',
      })
      expect(sql).toContain('using (auth.uid() = author_id)')
      expect(sql).toContain('with check (auth.uid() = author_id)')
    })
  })

  describe('update', () => {
    const policyId = { name: 'old_policy', schema: 'public', table: 'users' }

    test('should generate rename SQL', () => {
      const { sql } = pgPolicies.update(policyId, { name: 'new_policy' })
      expect(sql).toContain('RENAME TO')
      expect(sql).toContain('new_policy')
    })

    test('should generate update definition SQL', () => {
      const { sql } = pgPolicies.update(policyId, {
        definition: 'auth.uid() = id',
      })
      expect(sql).toContain('USING (auth.uid() = id)')
    })

    test('should generate update check SQL', () => {
      const { sql } = pgPolicies.update(policyId, {
        check: 'auth.uid() = id',
      })
      expect(sql).toContain('WITH CHECK (auth.uid() = id)')
    })

    test('should generate update roles SQL', () => {
      const { sql } = pgPolicies.update(policyId, {
        roles: ['authenticated', 'service_role'],
      })
      expect(sql).toContain('TO')
      expect(sql).toContain('authenticated')
      expect(sql).toContain('service_role')
    })

    test('should wrap updates in a transaction', () => {
      const { sql } = pgPolicies.update(policyId, {
        name: 'renamed',
        definition: 'true',
      })
      expect(sql).toContain('BEGIN;')
      expect(sql).toContain('COMMIT;')
    })

    test('should put rename last in transaction', () => {
      const { sql } = pgPolicies.update(policyId, {
        name: 'renamed',
        definition: 'true',
      })
      const renamePos = sql.indexOf('RENAME TO')
      const usingPos = sql.indexOf('USING')
      expect(usingPos).toBeLessThan(renamePos)
    })
  })

  describe('remove', () => {
    test('should generate drop policy SQL', () => {
      const { sql } = pgPolicies.remove({
        name: 'drop_policy',
        schema: 'public',
        table: 'users',
      })
      expect(sql).toContain('DROP POLICY')
      expect(sql).toContain('drop_policy')
      expect(sql).toContain('public')
      expect(sql).toContain('users')
    })
  })

  describe('zod schema', () => {
    test('should validate a valid policy object', () => {
      const result = pgPolicies.zod.safeParse({
        id: 1,
        schema: 'public',
        table: 'users',
        table_id: 100,
        name: 'test_policy',
        action: 'PERMISSIVE',
        roles: ['public'],
        command: 'SELECT',
        definition: 'true',
        check: null,
      })
      expect(result.success).toBe(true)
    })

    test('should reject invalid action', () => {
      const result = pgPolicies.zod.safeParse({
        id: 1,
        schema: 'public',
        table: 'users',
        table_id: 100,
        name: 'test_policy',
        action: 'INVALID',
        roles: ['public'],
        command: 'SELECT',
        definition: 'true',
        check: null,
      })
      expect(result.success).toBe(false)
    })

    test('should reject invalid command', () => {
      const result = pgPolicies.zod.safeParse({
        id: 1,
        schema: 'public',
        table: 'users',
        table_id: 100,
        name: 'test_policy',
        action: 'PERMISSIVE',
        roles: ['public'],
        command: 'UPSERT',
        definition: 'true',
        check: null,
      })
      expect(result.success).toBe(false)
    })

    test('should allow null definition and check', () => {
      const result = pgPolicies.zod.safeParse({
        id: 1,
        schema: 'public',
        table: 'users',
        table_id: 100,
        name: 'test_policy',
        action: 'PERMISSIVE',
        roles: [],
        command: 'ALL',
        definition: null,
        check: null,
      })
      expect(result.success).toBe(true)
    })
  })
})
