import {
  buildBeginStatement,
  normalizeIsolationLevel,
  normalizeStatement,
  normalizeStatementTimeoutMs,
  quoteIdentifier,
  quoteQualifiedIdentifier,
} from './sql'

describe('quoteIdentifier', () => {
  it('quotes valid PostgreSQL identifiers', () => {
    expect(quoteIdentifier('storage')).toBe('"storage"')
    expect(quoteIdentifier('_tenant_1')).toBe('"_tenant_1"')
  })

  it('rejects identifiers that require escaping or qualification', () => {
    expect(() => quoteIdentifier('tenant-id')).toThrow('Invalid PostgreSQL identifier')
    expect(() => quoteIdentifier('storage.objects')).toThrow('Invalid PostgreSQL identifier')
    expect(() => quoteIdentifier('"id"')).toThrow('Invalid PostgreSQL identifier')
  })
})

describe('quoteQualifiedIdentifier', () => {
  it('quotes schema-qualified PostgreSQL identifiers', () => {
    expect(quoteQualifiedIdentifier('storage.objects')).toBe('"storage"."objects"')
  })

  it('rejects unqualified or over-qualified table names', () => {
    expect(() => quoteQualifiedIdentifier('objects')).toThrow('Invalid PostgreSQL table name')
    expect(() => quoteQualifiedIdentifier('storage.objects.extra')).toThrow(
      'Invalid PostgreSQL table name'
    )
  })
})

describe('normalizeStatement', () => {
  it('normalizes text and values without cloning existing statements', () => {
    expect(normalizeStatement('SELECT $1', ['value'])).toEqual({
      text: 'SELECT $1',
      values: ['value'],
    })

    const statement = { text: 'SELECT 1', values: [] }
    expect(normalizeStatement(statement)).toBe(statement)
  })
})

describe('transaction SQL', () => {
  it('builds supported BEGIN modes and ignores unsupported isolation levels', () => {
    expect(buildBeginStatement()).toBe('BEGIN')
    expect(buildBeginStatement({ isolation: 'repeatable read', readOnly: true })).toBe(
      'BEGIN ISOLATION LEVEL REPEATABLE READ, READ ONLY'
    )
    expect(buildBeginStatement({ isolation: 'unsupported' })).toBe('BEGIN')
    expect(normalizeIsolationLevel('SERIALIZABLE')).toBe('SERIALIZABLE')
  })

  it('normalizes statement timeouts to finite positive values', () => {
    expect(normalizeStatementTimeoutMs(4321)).toBe(4321)
    expect(normalizeStatementTimeoutMs(0)).toBeUndefined()
    expect(normalizeStatementTimeoutMs(Number.POSITIVE_INFINITY)).toBeUndefined()
  })
})
