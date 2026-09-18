import { describe, expect, test } from 'vitest'

import * as pgTriggers from '../../src/pg-meta-triggers'

describe('pg-meta-triggers SQL generation', () => {
  describe('list', () => {
    test('should generate basic list query', () => {
      const { sql } = pgTriggers.list()
      expect(sql).toContain('select * from triggers')
    })

    test('should exclude system schemas by default', () => {
      const { sql } = pgTriggers.list()
      expect(sql).toContain('where schema')
      expect(sql).toContain('NOT IN')
    })

    test('should include system schemas when requested', () => {
      const { sql } = pgTriggers.list({ includeSystemSchemas: true })
      expect(sql).not.toContain('NOT IN')
    })

    test('should apply limit and offset', () => {
      const { sql } = pgTriggers.list({ limit: 25, offset: 50 })
      expect(sql).toContain('limit 25')
      expect(sql).toContain('offset 50')
    })

    test('should filter by included schemas', () => {
      const { sql } = pgTriggers.list({ includedSchemas: ['public', 'app'] })
      expect(sql).toContain('IN')
      expect(sql).toContain("'public'")
      expect(sql).toContain("'app'")
    })
  })

  describe('retrieve', () => {
    test('should retrieve by id', () => {
      const { sql } = pgTriggers.retrieve({ id: 99 })
      expect(sql).toContain('99')
    })

    test('should retrieve by name, schema, and table', () => {
      const { sql } = pgTriggers.retrieve({
        name: 'my_trigger',
        schema: 'public',
        table: 'orders',
      })
      expect(sql).toContain("'my_trigger'")
      expect(sql).toContain("'public'")
      expect(sql).toContain("'orders'")
    })
  })

  describe('create', () => {
    test('should generate basic AFTER INSERT trigger', () => {
      const { sql } = pgTriggers.create({
        name: 'after_insert_trigger',
        table: 'users',
        function_name: 'notify_user',
        activation: 'AFTER',
        events: ['INSERT'],
      })
      expect(sql).toContain('create trigger')
      expect(sql).toContain('after_insert_trigger')
      expect(sql).toContain('AFTER')
      expect(sql).toContain('INSERT')
      expect(sql).toContain('public')
      expect(sql).toContain('users')
      expect(sql).toContain('notify_user')
    })

    test('should generate BEFORE UPDATE trigger with ROW orientation', () => {
      const { sql } = pgTriggers.create({
        name: 'before_update',
        table: 'posts',
        function_name: 'validate_post',
        activation: 'BEFORE',
        events: ['UPDATE'],
        orientation: 'ROW',
      })
      expect(sql).toContain('BEFORE')
      expect(sql).toContain('UPDATE')
      expect(sql).toContain('for each ROW')
    })

    test('should generate trigger with STATEMENT orientation', () => {
      const { sql } = pgTriggers.create({
        name: 'statement_trigger',
        table: 'logs',
        function_name: 'audit_log',
        activation: 'AFTER',
        events: ['INSERT'],
        orientation: 'STATEMENT',
      })
      expect(sql).toContain('for each STATEMENT')
    })

    test('should generate trigger with multiple events', () => {
      const { sql } = pgTriggers.create({
        name: 'multi_event',
        table: 'items',
        function_name: 'handle_change',
        activation: 'AFTER',
        events: ['INSERT', 'UPDATE', 'DELETE'],
      })
      expect(sql).toContain('INSERT or UPDATE or DELETE')
    })

    test('should generate trigger with condition', () => {
      const { sql } = pgTriggers.create({
        name: 'conditional_trigger',
        table: 'orders',
        function_name: 'process_order',
        activation: 'AFTER',
        events: ['UPDATE'],
        condition: 'NEW.status = \'completed\'',
      })
      expect(sql).toContain("when (NEW.status = 'completed')")
    })

    test('should generate trigger with function args', () => {
      const { sql } = pgTriggers.create({
        name: 'args_trigger',
        table: 'events',
        function_name: 'process_event',
        function_args: ['arg1', 'arg2'],
        activation: 'AFTER',
        events: ['INSERT'],
      })
      expect(sql).toContain("'arg1'")
      expect(sql).toContain("'arg2'")
    })

    test('should generate trigger with custom function schema', () => {
      const { sql } = pgTriggers.create({
        name: 'custom_schema_trigger',
        table: 'data',
        function_schema: 'utils',
        function_name: 'handle_data',
        activation: 'BEFORE',
        events: ['INSERT'],
      })
      expect(sql).toContain('utils')
      expect(sql).toContain('handle_data')
    })

    test('should generate INSTEAD OF trigger', () => {
      const { sql } = pgTriggers.create({
        name: 'instead_trigger',
        table: 'view_data',
        function_name: 'handle_view_insert',
        activation: 'INSTEAD OF',
        events: ['INSERT'],
      })
      expect(sql).toContain('INSTEAD OF')
    })
  })

  describe('update', () => {
    const triggerId = { name: 'old_trigger', schema: 'public', table: 'users' }

    test('should generate rename SQL', () => {
      const { sql } = pgTriggers.update(triggerId, { name: 'new_trigger' })
      expect(sql).toContain('rename to')
      expect(sql).toContain('new_trigger')
    })

    test('should not generate rename SQL when name is the same', () => {
      const { sql } = pgTriggers.update(triggerId, { name: 'old_trigger' })
      expect(sql).not.toContain('rename to')
    })

    test('should generate enable trigger SQL for ORIGIN mode', () => {
      const { sql } = pgTriggers.update(triggerId, { enabled_mode: 'ORIGIN' })
      expect(sql).toContain('enable trigger')
      expect(sql).toContain('old_trigger')
    })

    test('should generate disable trigger SQL', () => {
      const { sql } = pgTriggers.update(triggerId, { enabled_mode: 'DISABLED' })
      expect(sql).toContain('disable trigger')
    })

    test('should generate REPLICA mode SQL', () => {
      const { sql } = pgTriggers.update(triggerId, { enabled_mode: 'REPLICA' })
      expect(sql).toContain('enable REPLICA trigger')
    })

    test('should generate ALWAYS mode SQL', () => {
      const { sql } = pgTriggers.update(triggerId, { enabled_mode: 'ALWAYS' })
      expect(sql).toContain('enable ALWAYS trigger')
    })

    test('should wrap in transaction', () => {
      const { sql } = pgTriggers.update(triggerId, { name: 'renamed' })
      expect(sql).toContain('begin;')
      expect(sql).toContain('commit;')
    })
  })

  describe('remove', () => {
    test('should generate drop trigger SQL', () => {
      const { sql } = pgTriggers.remove({
        name: 'drop_trigger',
        schema: 'public',
        table: 'users',
      })
      expect(sql).toContain('drop trigger')
      expect(sql).toContain('drop_trigger')
      expect(sql).toContain('public')
      expect(sql).toContain('users')
    })

    test('should generate drop trigger SQL without cascade by default', () => {
      const { sql } = pgTriggers.remove({
        name: 'drop_trigger',
        schema: 'public',
        table: 'users',
      })
      expect(sql).not.toContain('cascade')
    })

    test('should generate drop trigger SQL with cascade', () => {
      const { sql } = pgTriggers.remove(
        { name: 'drop_trigger', schema: 'public', table: 'users' },
        { cascade: true }
      )
      expect(sql).toContain('cascade')
    })
  })

  describe('zod schemas', () => {
    test('pgTriggerCreateZod should validate correct input', () => {
      const result = pgTriggers.pgTriggerCreateZod.safeParse({
        name: 'test_trigger',
        table: 'users',
        function_name: 'my_func',
        activation: 'AFTER',
        events: ['INSERT'],
      })
      expect(result.success).toBe(true)
    })

    test('pgTriggerCreateZod should apply default schema', () => {
      const result = pgTriggers.pgTriggerCreateZod.parse({
        name: 'test_trigger',
        table: 'users',
        function_name: 'my_func',
        activation: 'AFTER',
        events: ['INSERT'],
      })
      expect(result.schema).toBe('public')
      expect(result.function_schema).toBe('public')
    })

    test('pgTriggerCreateZod should reject invalid activation', () => {
      const result = pgTriggers.pgTriggerCreateZod.safeParse({
        name: 'test_trigger',
        table: 'users',
        function_name: 'my_func',
        activation: 'DURING',
        events: ['INSERT'],
      })
      expect(result.success).toBe(false)
    })

    test('pgTriggerCreateZod should reject invalid orientation', () => {
      const result = pgTriggers.pgTriggerCreateZod.safeParse({
        name: 'test_trigger',
        table: 'users',
        function_name: 'my_func',
        activation: 'AFTER',
        events: ['INSERT'],
        orientation: 'COLUMN',
      })
      expect(result.success).toBe(false)
    })

    test('pgTriggerUpdateZod should validate name update', () => {
      const result = pgTriggers.pgTriggerUpdateZod.safeParse({
        name: 'new_name',
      })
      expect(result.success).toBe(true)
    })

    test('pgTriggerUpdateZod should validate enabled_mode update', () => {
      const result = pgTriggers.pgTriggerUpdateZod.safeParse({
        enabled_mode: 'DISABLED',
      })
      expect(result.success).toBe(true)
    })

    test('pgTriggerUpdateZod should reject invalid enabled_mode', () => {
      const result = pgTriggers.pgTriggerUpdateZod.safeParse({
        enabled_mode: 'SOMETIMES',
      })
      expect(result.success).toBe(false)
    })

    test('pgTriggerZod should validate a complete trigger object', () => {
      const result = pgTriggers.pgTriggerZod.safeParse({
        id: 1,
        table_id: 100,
        enabled_mode: 'ORIGIN',
        function_args: [],
        name: 'test_trigger',
        table: 'users',
        schema: 'public',
        condition: null,
        orientation: 'ROW',
        activation: 'AFTER',
        events: ['INSERT', 'UPDATE'],
        function_name: 'my_func',
        function_schema: 'public',
      })
      expect(result.success).toBe(true)
    })
  })
})
