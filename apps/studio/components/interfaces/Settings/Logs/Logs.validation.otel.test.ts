import { describe, expect, it } from 'vitest'

import { validateOtelLogQuery } from './Logs.validation.otel'

const errorMessages = (sql: string) => validateOtelLogQuery(sql).errors.map((e) => e.message)
const warningMessages = (sql: string) => validateOtelLogQuery(sql).warnings.map((w) => w.message)

describe('validateOtelLogQuery - empty input', () => {
  it('returns no issues for empty or whitespace queries', () => {
    expect(validateOtelLogQuery('')).toEqual({ errors: [], warnings: [] })
    expect(validateOtelLogQuery('   \n  ')).toEqual({ errors: [], warnings: [] })
  })

  it('ignores trailing semicolons after a valid query', () => {
    expect(validateOtelLogQuery('select 1;;')).toEqual({ errors: [], warnings: [] })
  })
})

describe('validateOtelLogQuery - valid SELECTs', () => {
  it('accepts the default OTEL query', () => {
    const result = validateOtelLogQuery(
      "select timestamp, event_message, log_attributes from logs where source = 'edge_logs' order by timestamp desc limit 5"
    )
    expect(result.errors).toEqual([])
    expect(result.warnings).toEqual([])
  })

  it('accepts log_attributes subscript access and aggregates', () => {
    const result = validateOtelLogQuery(
      "select timestamp, log_attributes['request.method'] as method, count(*) as c from logs where source = 'edge_logs' group by timestamp, method"
    )
    expect(result.errors).toEqual([])
    expect(result.warnings).toEqual([])
  })

  it('accepts WITH / CTE queries (unlike the BigQuery endpoint)', () => {
    const result = validateOtelLogQuery(
      "with errors as (select event_message from logs where source = 'postgres_logs') select * from errors"
    )
    expect(result.errors).toEqual([])
  })
})

describe('validateOtelLogQuery - statement allow-list', () => {
  it.each([
    ['insert into logs values (1)', 'INSERT'],
    ['drop table logs', 'DROP'],
    ['truncate table logs', 'TRUNCATE'],
    ['alter table logs delete where 1', 'ALTER'],
    ['create table t (id UInt64) engine = Memory', 'CREATE'],
    ['system reload config', 'SYSTEM'],
  ])('rejects %s as %s', (sql, label) => {
    const messages = errorMessages(sql)
    expect(messages).toHaveLength(1)
    expect(messages[0]).toContain(`${label} statements are not supported`)
  })

  it('rejects a SELECT followed by a destructive statement', () => {
    expect(errorMessages('select 1; drop table logs').join(' ')).toContain(
      'DROP statements are not supported'
    )
  })

  it('rejects multiple statements even when both are SELECTs', () => {
    expect(errorMessages('select 1; select 2')).toEqual([
      'Only a single query can be run at a time. Remove the extra statements separated by ";".',
    ])
  })

  it('does not emit schema warnings for a rejected query', () => {
    expect(validateOtelLogQuery('drop table not_a_source').warnings).toEqual([])
  })
})

describe('validateOtelLogQuery - syntax errors', () => {
  it('reports a syntax error with a position', () => {
    const { errors } = validateOtelLogQuery('select foo bar baz )(')
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Syntax error')
    expect(errors[0].line).toBe(1)
    expect(typeof errors[0].column).toBe('number')
  })
})

describe('validateOtelLogQuery - schema hints', () => {
  it('warns when querying a source name as a table', () => {
    const warnings = warningMessages('select event_message from edge_logs')
    expect(warnings.some((w) => w.includes('Logs live in the "logs" table'))).toBe(true)
  })

  it('warns on an unknown source value', () => {
    const warnings = warningMessages("select event_message from logs where source = 'edge_log'")
    expect(warnings.some((w) => w.includes('Unknown log source "edge_log"'))).toBe(true)
  })

  it('does not warn on a known source value', () => {
    const warnings = warningMessages("select event_message from logs where source = 'auth_logs'")
    expect(warnings).toEqual([])
  })

  it('warns on unknown sources inside an IN list but not known ones', () => {
    const warnings = warningMessages(
      "select event_message from logs where source in ('edge_logs', 'bogus_logs')"
    )
    expect(warnings.some((w) => w.includes('"bogus_logs"'))).toBe(true)
    expect(warnings.some((w) => w.includes('"edge_logs"'))).toBe(false)
  })

  it('does not warn on unknown values inside a NOT IN exclusion', () => {
    const warnings = warningMessages(
      "select event_message from logs where source not in ('edge_logs', 'bogus_logs')"
    )
    expect(warnings).toEqual([])
  })

  it('does not flag a CTE named after a source as a table', () => {
    const warnings = warningMessages(
      "with edge_logs as (select event_message from logs where source = 'postgres_logs') select * from edge_logs"
    )
    expect(warnings).toEqual([])
  })

  it('warns on an unknown column and suggests log_attributes', () => {
    const warnings = warningMessages("select foo from logs where source = 'edge_logs'")
    expect(warnings.some((w) => w.includes('Unknown column "foo"'))).toBe(true)
    expect(warnings.some((w) => w.includes("log_attributes['foo']"))).toBe(true)
  })

  it('does not flag query aliases referenced elsewhere', () => {
    const warnings = warningMessages(
      "select timestamp as ts, count(*) as total from logs where source = 'edge_logs' group by ts order by total"
    )
    expect(warnings).toEqual([])
  })

  it('does not flag known base columns', () => {
    const warnings = warningMessages(
      'select id, timestamp, event_message, source, severity_text, log_attributes from logs'
    )
    expect(warnings).toEqual([])
  })
})
