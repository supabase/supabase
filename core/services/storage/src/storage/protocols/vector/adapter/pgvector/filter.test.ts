import { translateFilter, translateFilterToPositionalPlaceholders } from './filter'

function eqSql(column: string, field: number, scalar: number, array: number, value: number) {
  return (
    `(${column}->>$${field} = $${scalar} OR ` +
    `EXISTS (SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(${column}->$${array}) = 'array' THEN ${column}->$${array} ELSE '[]'::jsonb END) AS elem(value) WHERE elem.value#>>'{}' = $${value}))`
  )
}

function neSql(
  column: string,
  type: number,
  array: number,
  value: number,
  field: number,
  scalar: number
) {
  return (
    `(CASE WHEN jsonb_typeof(${column}->$${type}) = 'array' THEN NOT ` +
    `EXISTS (SELECT 1 FROM jsonb_array_elements(${column}->$${array}) AS elem(value) WHERE elem.value#>>'{}' = $${value}) ` +
    `ELSE ${column}->>$${field} <> $${scalar} END)`
  )
}

function inSql(column: string, field: number, scalar: number, array: number, value: number) {
  return (
    `(${column}->>$${field} = ANY($${scalar}) OR ` +
    `EXISTS (SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(${column}->$${array}) = 'array' THEN ${column}->$${array} ELSE '[]'::jsonb END) AS elem(value) WHERE elem.value#>>'{}' = ANY($${value})))`
  )
}

function ninSql(
  column: string,
  type: number,
  array: number,
  value: number,
  field: number,
  scalar: number
) {
  return (
    `(CASE WHEN jsonb_typeof(${column}->$${type}) = 'array' THEN NOT ` +
    `EXISTS (SELECT 1 FROM jsonb_array_elements(${column}->$${array}) AS elem(value) WHERE elem.value#>>'{}' = ANY($${value})) ` +
    `ELSE ${column}->>$${field} <> ALL($${scalar}) END)`
  )
}

describe('translateFilter (pgvector / JSONB)', () => {
  describe('implicit equality', () => {
    it('string', () => {
      expect(translateFilter({ category: 'foo' })).toEqual({
        sql: eqSql('metadata', 1, 2, 3, 4),
        params: ['category', 'foo', 'category', 'foo'],
      })
    })
    it('number', () => {
      expect(translateFilter({ n: 5 })).toEqual({
        sql: eqSql('metadata', 1, 2, 3, 4),
        params: ['n', '5', 'n', '5'],
      })
    })
    it('boolean', () => {
      expect(translateFilter({ active: true })).toEqual({
        sql: eqSql('metadata', 1, 2, 3, 4),
        params: ['active', 'true', 'active', 'true'],
      })
    })
    it('preserves embedded quotes via parameter (no manual escaping needed)', () => {
      expect(translateFilter({ title: "it's" })).toEqual({
        sql: eqSql('metadata', 1, 2, 3, 4),
        params: ['title', "it's", 'title', "it's"],
      })
    })
    it('matches primitive filters against list-valued metadata', () => {
      expect(translateFilter({ category: 'documentary' })).toEqual({
        sql: eqSql('metadata', 1, 2, 3, 4),
        params: ['category', 'documentary', 'category', 'documentary'],
      })
    })
  })

  describe('accepts arbitrary metadata key strings', () => {
    it('keys with hyphens', () => {
      expect(translateFilter({ 'user-id': 'abc' })).toEqual({
        sql: eqSql('metadata', 1, 2, 3, 4),
        params: ['user-id', 'abc', 'user-id', 'abc'],
      })
    })
    it('keys with dots', () => {
      expect(translateFilter({ 'my.key': 'v' })).toEqual({
        sql: eqSql('metadata', 1, 2, 3, 4),
        params: ['my.key', 'v', 'my.key', 'v'],
      })
    })
    it('keys with spaces', () => {
      expect(translateFilter({ 'a b c': 'v' })).toEqual({
        sql: eqSql('metadata', 1, 2, 3, 4),
        params: ['a b c', 'v', 'a b c', 'v'],
      })
    })
    it('keys that look hostile are still passed as parameters', () => {
      expect(translateFilter({ "'; DROP TABLE x;--": 'v' })).toEqual({
        sql: eqSql('metadata', 1, 2, 3, 4),
        params: ["'; DROP TABLE x;--", 'v', "'; DROP TABLE x;--", 'v'],
      })
    })
  })

  describe('field operators', () => {
    it('$eq', () => {
      expect(translateFilter({ category: { $eq: 'foo' } })).toEqual({
        sql: eqSql('metadata', 1, 2, 3, 4),
        params: ['category', 'foo', 'category', 'foo'],
      })
    })
    it('$ne', () => {
      expect(translateFilter({ category: { $ne: 'foo' } })).toEqual({
        sql: neSql('metadata', 1, 2, 3, 4, 5),
        params: ['category', 'category', 'foo', 'category', 'foo'],
      })
    })
    it('$gt guards with jsonb_typeof + numeric cast', () => {
      expect(translateFilter({ n: { $gt: 5 } })).toEqual({
        sql: "(jsonb_typeof(metadata->$1) = 'number' AND (metadata->>$2)::numeric > $3)",
        params: ['n', 'n', 5],
      })
    })
    it('$gte', () => {
      expect(translateFilter({ n: { $gte: 5 } })).toEqual({
        sql: "(jsonb_typeof(metadata->$1) = 'number' AND (metadata->>$2)::numeric >= $3)",
        params: ['n', 'n', 5],
      })
    })
    it('$lt', () => {
      expect(translateFilter({ n: { $lt: 5 } })).toEqual({
        sql: "(jsonb_typeof(metadata->$1) = 'number' AND (metadata->>$2)::numeric < $3)",
        params: ['n', 'n', 5],
      })
    })
    it('$lte', () => {
      expect(translateFilter({ n: { $lte: 5 } })).toEqual({
        sql: "(jsonb_typeof(metadata->$1) = 'number' AND (metadata->>$2)::numeric <= $3)",
        params: ['n', 'n', 5],
      })
    })
    it('$in uses ANY with array param', () => {
      expect(translateFilter({ tag: { $in: ['a', 'b', 'c'] } })).toEqual({
        sql: inSql('metadata', 1, 2, 3, 4),
        params: ['tag', ['a', 'b', 'c'], 'tag', ['a', 'b', 'c']],
      })
    })
    it('$nin uses <> ALL with array param', () => {
      expect(translateFilter({ tag: { $nin: ['a', 'b'] } })).toEqual({
        sql: ninSql('metadata', 1, 2, 3, 4, 5),
        params: ['tag', 'tag', ['a', 'b'], 'tag', ['a', 'b']],
      })
    })
    it('$exists true uses jsonb_exists (function form avoids positional `?` ambiguity)', () => {
      expect(translateFilter({ tag: { $exists: true } })).toEqual({
        sql: 'jsonb_exists(metadata, $1)',
        params: ['tag'],
      })
    })
    it('$exists false negates', () => {
      expect(translateFilter({ tag: { $exists: false } })).toEqual({
        sql: 'NOT jsonb_exists(metadata, $1)',
        params: ['tag'],
      })
    })
  })

  describe('multi-operator on single field', () => {
    it('combines $gt and $lt with AND', () => {
      expect(translateFilter({ n: { $gt: 1, $lt: 10 } })).toEqual({
        sql:
          "((jsonb_typeof(metadata->$1) = 'number' AND (metadata->>$2)::numeric > $3) AND " +
          "(jsonb_typeof(metadata->$4) = 'number' AND (metadata->>$5)::numeric < $6))",
        params: ['n', 'n', 1, 'n', 'n', 10],
      })
    })
  })

  describe('multi-field (implicit AND)', () => {
    it('joins clauses with AND', () => {
      expect(translateFilter({ a: 1, b: 'x' })).toEqual({
        sql: `${eqSql('metadata', 1, 2, 3, 4)} AND ${eqSql('metadata', 5, 6, 7, 8)}`,
        params: ['a', '1', 'a', '1', 'b', 'x', 'b', 'x'],
      })
    })
  })

  describe('logical operators', () => {
    it('$and', () => {
      expect(translateFilter({ $and: [{ a: 1 }, { b: 'x' }] })).toEqual({
        sql: `(${eqSql('metadata', 1, 2, 3, 4)}) AND (${eqSql('metadata', 5, 6, 7, 8)})`,
        params: ['a', '1', 'a', '1', 'b', 'x', 'b', 'x'],
      })
    })
    it('$or', () => {
      expect(translateFilter({ $or: [{ a: 1 }, { b: 'x' }] })).toEqual({
        sql: `(${eqSql('metadata', 1, 2, 3, 4)}) OR (${eqSql('metadata', 5, 6, 7, 8)})`,
        params: ['a', '1', 'a', '1', 'b', 'x', 'b', 'x'],
      })
    })
    it('nested $and within $or', () => {
      expect(translateFilter({ $or: [{ $and: [{ a: 1 }, { b: 2 }] }, { c: 3 }] })).toEqual({
        sql: `((${eqSql('metadata', 1, 2, 3, 4)}) AND (${eqSql('metadata', 5, 6, 7, 8)})) OR (${eqSql('metadata', 9, 10, 11, 12)})`,
        params: ['a', '1', 'a', '1', 'b', '2', 'b', '2', 'c', '3', 'c', '3'],
      })
    })
    it('deeply nested mix', () => {
      expect(
        translateFilter({ $and: [{ $or: [{ a: 1 }, { b: 2 }] }, { c: { $gte: 5 } }] })
      ).toEqual({
        sql:
          `((${eqSql('metadata', 1, 2, 3, 4)}) OR (${eqSql('metadata', 5, 6, 7, 8)})) AND ` +
          "((jsonb_typeof(metadata->$9) = 'number' AND (metadata->>$10)::numeric >= $11))",
        params: ['a', '1', 'a', '1', 'b', '2', 'b', '2', 'c', 'c', 5],
      })
    })
  })

  describe('column override', () => {
    it('uses provided column reference', () => {
      expect(translateFilter({ a: 1 }, 'v.metadata')).toEqual({
        sql: eqSql('v.metadata', 1, 2, 3, 4),
        params: ['a', '1', 'a', '1'],
      })
    })
  })

  describe('positional placeholder conversion', () => {
    it('expands reused numbered placeholders into positional bindings', () => {
      expect(translateFilterToPositionalPlaceholders({ category: 'cats' })).toEqual({
        sql:
          '(metadata->>? = ? OR ' +
          "EXISTS (SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(metadata->?) = 'array' THEN metadata->? ELSE '[]'::jsonb END) AS elem(value) WHERE elem.value#>>'{}' = ?))",
        params: ['category', 'cats', 'category', 'category', 'cats'],
      })
    })
  })

  describe('invalid inputs', () => {
    it('rejects non-object', () => {
      expect(() => translateFilter('foo' as never)).toThrow()
      expect(() => translateFilter([] as never)).toThrow()
      expect(() => translateFilter(null as never)).toThrow()
    })
    it('rejects empty filter', () => {
      expect(() => translateFilter({})).toThrow()
    })
    it('rejects empty $and / $or', () => {
      expect(() => translateFilter({ $and: [] })).toThrow()
      expect(() => translateFilter({ $or: [] })).toThrow()
    })
    it('rejects logical operator mixed with field key', () => {
      expect(() => translateFilter({ $and: [{ a: 1 }], b: 2 } as never)).toThrow()
    })
    it('rejects unknown $-prefix at field position', () => {
      expect(() => translateFilter({ $weird: 1 } as never)).toThrow()
    })
    it('rejects unknown field operator', () => {
      expect(() => translateFilter({ a: { $weird: 1 } } as never)).toThrow()
    })
    it('rejects empty operator object', () => {
      expect(() => translateFilter({ a: {} as never })).toThrow()
    })
    it('rejects $in / $nin with empty array', () => {
      expect(() => translateFilter({ a: { $in: [] } })).toThrow()
      expect(() => translateFilter({ a: { $nin: [] } })).toThrow()
    })
    it('rejects $exists with non-boolean', () => {
      expect(() => translateFilter({ a: { $exists: 'yes' as never } })).toThrow()
    })
    it('rejects $gt with non-number', () => {
      expect(() => translateFilter({ a: { $gt: 'x' as never } })).toThrow()
    })
    it('rejects NaN / Infinity', () => {
      expect(() => translateFilter({ a: NaN })).toThrow()
      expect(() => translateFilter({ a: Infinity })).toThrow()
    })
    it('rejects column reference with semicolons', () => {
      expect(() => translateFilter({ a: 1 }, 'evil; drop')).toThrow()
    })
    it('rejects column reference with injection in earlier segment', () => {
      // Previously vulnerable: regex only checked the last segment after the
      // dot. Now the full reference must match identifier-segments.
      expect(() => translateFilter({ a: 1 }, 't; DROP TABLE x --.metadata')).toThrow()
    })
  })
})
