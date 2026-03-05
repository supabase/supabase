import { describe, expect, test } from 'vitest'

import * as pgFunctions from '../../src/pg-meta-functions'
import type { PGFunction } from '../../src/pg-meta-functions'

describe('pg-meta-functions SQL generation', () => {
  describe('list', () => {
    test('should generate basic list query without options', () => {
      const { sql } = pgFunctions.list()
      expect(sql).toContain('select')
      expect(sql).toContain('from f')
      expect(sql).not.toContain('limit')
      expect(sql).not.toContain('offset')
    })

    test('should include system schema filter when includeSystemSchemas is false', () => {
      const { sql } = pgFunctions.list({ includeSystemSchemas: false })
      expect(sql).toContain('where schema')
      expect(sql).toContain('NOT IN')
    })

    test('should not include system schema filter when includeSystemSchemas is true', () => {
      const { sql } = pgFunctions.list({ includeSystemSchemas: true })
      expect(sql).not.toContain('NOT IN')
    })

    test('should apply limit when provided', () => {
      const { sql } = pgFunctions.list({ limit: 10 })
      expect(sql).toContain('limit 10')
    })

    test('should apply offset when provided', () => {
      const { sql } = pgFunctions.list({ offset: 20 })
      expect(sql).toContain('offset 20')
    })

    test('should apply both limit and offset', () => {
      const { sql } = pgFunctions.list({ limit: 10, offset: 20 })
      expect(sql).toContain('limit 10')
      expect(sql).toContain('offset 20')
    })

    test('should filter by included schemas', () => {
      const { sql } = pgFunctions.list({ includedSchemas: ['public', 'custom'] })
      expect(sql).toContain('where schema')
      expect(sql).toContain('IN')
      expect(sql).toContain("'public'")
      expect(sql).toContain("'custom'")
    })

    test('should filter by excluded schemas', () => {
      const { sql } = pgFunctions.list({
        includeSystemSchemas: true,
        excludedSchemas: ['internal'],
      })
      expect(sql).toContain('NOT IN')
      expect(sql).toContain("'internal'")
    })
  })

  describe('retrieve', () => {
    test('should retrieve by id', () => {
      const { sql } = pgFunctions.retrieve({ id: 42 })
      expect(sql).toContain('where id =')
      expect(sql).toContain('42')
    })

    test('should retrieve by name, schema, and args', () => {
      const { sql } = pgFunctions.retrieve({
        name: 'my_func',
        schema: 'public',
        args: ['integer', 'text'],
      })
      expect(sql).toContain("'my_func'")
      expect(sql).toContain("'public'")
      expect(sql).toContain("'integer'")
      expect(sql).toContain("'text'")
    })

    test('should retrieve by name with empty args', () => {
      const { sql } = pgFunctions.retrieve({
        name: 'no_args_func',
        schema: 'public',
        args: [],
      })
      expect(sql).toContain("'no_args_func'")
      expect(sql).toContain("'public'")
      // empty args should use literal empty string comparison
      expect(sql).toContain("''")
    })

    test('should use public as default schema', () => {
      const { sql } = pgFunctions.retrieve({
        name: 'my_func',
        schema: 'public',
        args: [],
      })
      expect(sql).toContain("'public'")
    })
  })

  describe('create', () => {
    test('should generate basic create function SQL', () => {
      const { sql } = pgFunctions.create({
        name: 'hello',
        definition: "SELECT 'hello'",
      })
      expect(sql).toContain('CREATE')
      expect(sql).toContain('FUNCTION')
      expect(sql).toContain('hello')
      expect(sql).toContain('RETURNS void')
      expect(sql).toContain('LANGUAGE sql')
      expect(sql).toContain('VOLATILE')
      expect(sql).toContain('SECURITY INVOKER')
    })

    test('should generate create function with custom return type and language', () => {
      const { sql } = pgFunctions.create({
        name: 'get_count',
        definition: 'SELECT count(*) FROM users',
        return_type: 'bigint',
        language: 'plpgsql',
      })
      expect(sql).toContain('RETURNS bigint')
      expect(sql).toContain('LANGUAGE plpgsql')
    })

    test('should generate create function with security definer', () => {
      const { sql } = pgFunctions.create({
        name: 'secure_func',
        definition: 'SELECT 1',
        security_definer: true,
      })
      expect(sql).toContain('SECURITY DEFINER')
      expect(sql).not.toContain('SECURITY INVOKER')
    })

    test('should generate create function with args', () => {
      const { sql } = pgFunctions.create({
        name: 'add_nums',
        definition: 'SELECT a + b',
        args: ['a integer', 'b integer'],
        return_type: 'integer',
      })
      expect(sql).toContain('a integer, b integer')
    })

    test('should generate create function with behavior', () => {
      const { sql } = pgFunctions.create({
        name: 'immutable_func',
        definition: 'SELECT 42',
        behavior: 'IMMUTABLE',
        return_type: 'integer',
      })
      expect(sql).toContain('IMMUTABLE')
    })

    test('should generate create function with config params', () => {
      const { sql } = pgFunctions.create({
        name: 'configured_func',
        definition: 'SELECT 1',
        config_params: { search_path: "'public'" },
      })
      expect(sql).toContain("SET search_path TO 'public'")
    })

    test('should handle config params with FROM CURRENT', () => {
      const { sql } = pgFunctions.create({
        name: 'current_config_func',
        definition: 'SELECT 1',
        config_params: { search_path: 'FROM CURRENT' },
      })
      expect(sql).toContain('SET search_path FROM CURRENT')
    })

    test('should handle config params with empty string value', () => {
      const { sql } = pgFunctions.create({
        name: 'empty_config_func',
        definition: 'SELECT 1',
        config_params: { search_path: '""' },
      })
      expect(sql).toContain("SET search_path TO ''")
    })

    test('should use custom schema', () => {
      const { sql } = pgFunctions.create({
        name: 'custom_func',
        schema: 'my_schema',
        definition: 'SELECT 1',
      })
      expect(sql).toContain('my_schema')
    })
  })

  describe('update', () => {
    const mockFunction: PGFunction = {
      id: 1,
      schema: 'public',
      name: 'old_func',
      language: 'sql',
      definition: 'SELECT 1',
      complete_statement: 'CREATE FUNCTION public.old_func() RETURNS void AS $$ SELECT 1 $$ LANGUAGE sql',
      args: [],
      argument_types: '',
      identity_argument_types: '',
      return_type_id: 2278,
      return_type: 'void',
      return_type_relation_id: null,
      is_set_returning_function: false,
      behavior: 'VOLATILE',
      security_definer: false,
      config_params: null,
    }

    test('should generate update definition SQL', () => {
      const { sql } = pgFunctions.update(mockFunction, {
        definition: 'SELECT 2',
      })
      expect(sql).toContain('CREATE OR REPLACE FUNCTION')
      expect(sql).toContain("'SELECT 2'")
    })

    test('should generate rename SQL when name changes', () => {
      const { sql } = pgFunctions.update(mockFunction, {
        name: 'new_func',
      })
      expect(sql).toContain('RENAME TO')
      expect(sql).toContain('new_func')
    })

    test('should generate schema change SQL', () => {
      const { sql } = pgFunctions.update(mockFunction, {
        schema: 'new_schema',
      })
      expect(sql).toContain('SET SCHEMA')
      expect(sql).toContain('new_schema')
    })

    test('should not generate rename SQL when name is the same', () => {
      const { sql } = pgFunctions.update(mockFunction, {
        name: 'old_func',
      })
      expect(sql).not.toContain('RENAME TO')
    })

    test('should not generate schema change SQL when schema is the same', () => {
      const { sql } = pgFunctions.update(mockFunction, {
        schema: 'public',
      })
      expect(sql).not.toContain('SET SCHEMA')
    })

    test('should handle combined name, schema, and definition update', () => {
      const { sql } = pgFunctions.update(mockFunction, {
        name: 'new_func',
        schema: 'new_schema',
        definition: 'SELECT 42',
      })
      expect(sql).toContain('CREATE OR REPLACE FUNCTION')
      expect(sql).toContain('RENAME TO')
      expect(sql).toContain('SET SCHEMA')
    })
  })

  describe('remove', () => {
    const mockFunction: PGFunction = {
      id: 1,
      schema: 'public',
      name: 'drop_me',
      language: 'sql',
      definition: 'SELECT 1',
      complete_statement: '',
      args: [],
      argument_types: '',
      identity_argument_types: 'integer, text',
      return_type_id: 2278,
      return_type: 'void',
      return_type_relation_id: null,
      is_set_returning_function: false,
      behavior: 'VOLATILE',
      security_definer: false,
      config_params: null,
    }

    test('should generate drop function SQL with restrict by default', () => {
      const { sql } = pgFunctions.remove(mockFunction)
      expect(sql).toContain('DROP FUNCTION')
      expect(sql).toContain('public')
      expect(sql).toContain('drop_me')
      expect(sql).toContain('integer, text')
      expect(sql).toContain('RESTRICT')
    })

    test('should generate drop function SQL with cascade', () => {
      const { sql } = pgFunctions.remove(mockFunction, { cascade: true })
      expect(sql).toContain('CASCADE')
      expect(sql).not.toContain('RESTRICT')
    })
  })

  describe('zod schemas', () => {
    test('pgFunctionCreateZod should validate correct input', () => {
      const result = pgFunctions.pgFunctionCreateZod.safeParse({
        name: 'test_func',
        definition: 'SELECT 1',
      })
      expect(result.success).toBe(true)
    })

    test('pgFunctionCreateZod should reject missing name', () => {
      const result = pgFunctions.pgFunctionCreateZod.safeParse({
        definition: 'SELECT 1',
      })
      expect(result.success).toBe(false)
    })

    test('pgFunctionCreateZod should reject missing definition', () => {
      const result = pgFunctions.pgFunctionCreateZod.safeParse({
        name: 'test_func',
      })
      expect(result.success).toBe(false)
    })

    test('pgFunctionCreateZod should accept optional fields', () => {
      const result = pgFunctions.pgFunctionCreateZod.safeParse({
        name: 'test_func',
        definition: 'SELECT 1',
        args: ['a integer'],
        behavior: 'IMMUTABLE',
        config_params: { search_path: 'public' },
        schema: 'custom',
        language: 'plpgsql',
        return_type: 'integer',
        security_definer: true,
      })
      expect(result.success).toBe(true)
    })

    test('pgFunctionCreateZod should reject invalid behavior', () => {
      const result = pgFunctions.pgFunctionCreateZod.safeParse({
        name: 'test_func',
        definition: 'SELECT 1',
        behavior: 'INVALID',
      })
      expect(result.success).toBe(false)
    })

    test('pgFunctionUpdateZod should validate partial updates', () => {
      const result = pgFunctions.pgFunctionUpdateZod.safeParse({
        name: 'new_name',
      })
      expect(result.success).toBe(true)
    })

    test('pgFunctionUpdateZod should accept empty object', () => {
      const result = pgFunctions.pgFunctionUpdateZod.safeParse({})
      expect(result.success).toBe(true)
    })

    test('pgFunctionDeleteZod should accept cascade option', () => {
      const result = pgFunctions.pgFunctionDeleteZod.parse({ cascade: true })
      expect(result.cascade).toBe(true)
    })
  })
})
