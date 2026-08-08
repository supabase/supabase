import { describe, expect, it } from 'vitest'

import { displayColumnType, normalizeFormatSchema } from './ColumnEditor.utils'

describe('ColumnEditor.utils', () => {
  describe('normalizeFormatSchema', () => {
    it('returns undefined for public and pg_catalog schemas', () => {
      expect(normalizeFormatSchema('public')).toBeUndefined()
      expect(normalizeFormatSchema('pg_catalog')).toBeUndefined()
    })

    it('preserves custom schema names', () => {
      expect(normalizeFormatSchema('custom_schema')).toBe('custom_schema')
    })
  })

  describe('displayColumnType', () => {
    it('formats public schema types unqualified', () => {
      expect(displayColumnType('text', 'public')).toBe('text')
      expect(displayColumnType('text', undefined)).toBe('text')
    })

    it('formats custom schema types quoted', () => {
      expect(displayColumnType('my_enum', 'custom_schema')).toBe('"custom_schema"."my_enum"')
    })

    it('handles array types correctly', () => {
      expect(displayColumnType('text', 'public', true)).toBe('text[]')
      expect(displayColumnType('my_enum', 'custom_schema', true)).toBe(
        '"custom_schema"."my_enum"[]'
      )
    })

    it('escapes embedded double quotes in identifiers', () => {
      expect(displayColumnType('my"type', 'custom"schema')).toBe('"custom""schema"."my""type"')
    })
  })
})
