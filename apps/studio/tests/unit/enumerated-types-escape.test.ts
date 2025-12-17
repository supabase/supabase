import { describe, it, expect } from 'vitest'
import { escapeSqlString } from 'data/enumerated-types/utils'

describe('escapeSqlString', () => {
  it('should return unchanged string when no quotes present', () => {
    expect(escapeSqlString('hello')).toBe('hello')
    expect(escapeSqlString('test123')).toBe('test123')
    expect(escapeSqlString('')).toBe('')
  })

  it('should escape single quotes by doubling them', () => {
    expect(escapeSqlString("don't")).toBe("don''t")
    expect(escapeSqlString("it's")).toBe("it''s")
  })

  it('should escape multiple single quotes', () => {
    expect(escapeSqlString("it's a 'test'")).toBe("it''s a ''test''")
    expect(escapeSqlString("'''")).toBe("''''''")
  })

  it('should handle edge cases', () => {
    expect(escapeSqlString("'")).toBe("''")
    expect(escapeSqlString("''")).toBe("''''")
    expect(escapeSqlString("a'b'c")).toBe("a''b''c")
  })
})

describe('enum SQL generation', () => {
  it('should generate properly escaped CREATE TYPE SQL', () => {
    const values = ['normal', "don't", "it's a 'test'"]
    const escapedValues = values.map((x) => `'${escapeSqlString(x)}'`).join(', ')
    const sql = `create type "public"."my_enum" as enum (${escapedValues});`

    expect(sql).toBe(
      `create type "public"."my_enum" as enum ('normal', 'don''t', 'it''s a ''test''');`
    )
  })

  it('should generate properly escaped ALTER TYPE ADD VALUE SQL', () => {
    const value = "new't value"
    const sql = `alter type "public"."my_enum" add value '${escapeSqlString(value)}';`

    expect(sql).toBe(`alter type "public"."my_enum" add value 'new''t value';`)
  })

  it('should generate properly escaped ALTER TYPE RENAME VALUE SQL', () => {
    const original = "old'val"
    const updated = "new'val"
    const sql = `alter type "public"."my_enum" rename value '${escapeSqlString(original)}' to '${escapeSqlString(updated)}';`

    expect(sql).toBe(`alter type "public"."my_enum" rename value 'old''val' to 'new''val';`)
  })

  it('should generate properly escaped COMMENT ON TYPE SQL', () => {
    const description = "This is a 'test' description"
    const sql = `comment on type "public"."my_enum" is '${escapeSqlString(description)}';`

    expect(sql).toBe(`comment on type "public"."my_enum" is 'This is a ''test'' description';`)
  })
})
