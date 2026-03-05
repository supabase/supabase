import { describe, expect, test } from 'vitest'

import pgSchemas from '../../src/pg-meta-schemas'

describe('pg-meta-schemas SQL generation', () => {
  describe('list', () => {
    test('should generate basic list query excluding system schemas', () => {
      const { sql } = pgSchemas.list()
      expect(sql).toContain('not (n.nspname in')
    })

    test('should include system schemas when requested', () => {
      const { sql } = pgSchemas.list({ includeSystemSchemas: true })
      expect(sql).not.toContain('NOT IN')
    })

    test('should apply limit', () => {
      const { sql } = pgSchemas.list({ limit: 10 })
      expect(sql).toContain('limit 10')
    })

    test('should apply offset', () => {
      const { sql } = pgSchemas.list({ offset: 5 })
      expect(sql).toContain('offset 5')
    })
  })

  describe('retrieve', () => {
    test('should retrieve by id', () => {
      const { sql } = pgSchemas.retrieve({ id: 42 })
      expect(sql).toContain('42')
      expect(sql).toContain('n.oid')
    })

    test('should retrieve by name', () => {
      const { sql } = pgSchemas.retrieve({ name: 'public' })
      expect(sql).toContain("'public'")
      expect(sql).toContain('n.nspname')
    })
  })

  describe('create', () => {
    test('should generate create schema SQL', () => {
      const { sql } = pgSchemas.create({ name: 'new_schema' })
      expect(sql).toContain('create schema')
      expect(sql).toContain('new_schema')
    })

    test('should generate create schema with owner', () => {
      const { sql } = pgSchemas.create({ name: 'owned_schema', owner: 'admin' })
      expect(sql).toContain('create schema')
      expect(sql).toContain('owned_schema')
      expect(sql).toContain('authorization')
      expect(sql).toContain('admin')
    })

    test('should not include authorization when owner is undefined', () => {
      const { sql } = pgSchemas.create({ name: 'no_owner' })
      expect(sql).not.toContain('authorization')
    })
  })

  describe('update', () => {
    test('should generate update schema name SQL by id', () => {
      const { sql } = pgSchemas.update({ id: 1 }, { name: 'renamed' })
      expect(sql).toContain('renamed')
      expect(sql).toContain('rename to')
    })

    test('should generate update schema name SQL by name', () => {
      const { sql } = pgSchemas.update({ name: 'old_name' }, { name: 'new_name' })
      expect(sql).toContain("'old_name'")
      expect(sql).toContain("'new_name'")
    })

    test('should generate update schema owner SQL', () => {
      const { sql } = pgSchemas.update({ id: 1 }, { owner: 'new_owner' })
      expect(sql).toContain('alter schema')
      expect(sql).toContain('owner to')
      expect(sql).toContain('new_owner')
    })

    test('should handle both name and owner update', () => {
      const { sql } = pgSchemas.update({ id: 1 }, { name: 'new_name', owner: 'new_owner' })
      expect(sql).toContain('rename to')
      expect(sql).toContain('owner to')
    })

    test('should use regnamespace when looking up by name', () => {
      const { sql } = pgSchemas.update({ name: 'my_schema' }, { name: 'renamed' })
      expect(sql).toContain('regnamespace')
    })

    test('should use literal id when looking up by id', () => {
      const { sql } = pgSchemas.update({ id: 42 }, { name: 'renamed' })
      expect(sql).toContain('42')
    })
  })

  describe('remove', () => {
    test('should generate drop schema SQL by id', () => {
      const { sql } = pgSchemas.remove({ id: 1 })
      expect(sql).toContain('drop schema')
      expect(sql).toContain('restrict')
    })

    test('should generate drop schema SQL by name', () => {
      const { sql } = pgSchemas.remove({ name: 'temp_schema' })
      expect(sql).toContain('drop schema')
      expect(sql).toContain("'temp_schema'")
    })

    test('should generate drop schema SQL with cascade', () => {
      const { sql } = pgSchemas.remove({ id: 1 }, { cascade: true })
      expect(sql).toContain('cascade')
    })

    test('should default to restrict (no cascade)', () => {
      const { sql } = pgSchemas.remove({ id: 1 })
      expect(sql).toContain('restrict')
    })
  })

  describe('zod schema', () => {
    test('should validate a valid schema object', () => {
      const result = pgSchemas.zod.safeParse({
        id: 1,
        name: 'public',
        owner: 'postgres',
        comment: 'Standard public schema',
      })
      expect(result.success).toBe(true)
    })

    test('should allow null comment', () => {
      const result = pgSchemas.zod.safeParse({
        id: 1,
        name: 'public',
        owner: 'postgres',
        comment: null,
      })
      expect(result.success).toBe(true)
    })

    test('should reject missing required fields', () => {
      const result = pgSchemas.zod.safeParse({
        id: 1,
      })
      expect(result.success).toBe(false)
    })
  })
})
