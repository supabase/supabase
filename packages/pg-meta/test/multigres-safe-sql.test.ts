import { expect, test } from 'vitest'

import pgMeta from '../src/index'

// Servers that statically check DO blocks (such as Multigres) only accept a
// dynamic EXECUTE whose statement they can prove is fixed. Without that proof
// they reject the whole block with "EXECUTE of a runtime-built statement …".
// Two shapes break the proof, and the generated SQL must avoid both:
//   - parentheses around the payload: `execute(format(…))`
//   - a `%s` conversion in a format string, which substitutes raw text
// `%I`, `%L` and `%%` are fine.
const expectAnalyzableExecutes = (sql: string) => {
  expect(sql).not.toMatch(/\bexecute\s*\(/i)

  const formatStrings = [...sql.matchAll(/\bexecute\s+format\(\s*(E?'(?:[^']|'')*')/gi)].map(
    (m) => m[1]
  )
  for (const formatString of formatStrings) {
    const conversions = [...formatString.matchAll(/%(?:\d+\$)?([A-Za-z%])/g)].map((m) => m[1])
    expect(
      conversions.every((c) => ['I', 'L', '%'].includes(c)),
      formatString
    ).toBe(true)
  }
  return formatStrings.length
}

test('table privilege grant and revoke SQL has analyzable EXECUTEs', () => {
  const grant = pgMeta.tablePrivileges.grant([
    { relationId: 1, grantee: 'anon', privilegeType: 'SELECT' },
    { relationId: 1, grantee: 'authenticated', privilegeType: 'ALL', isGrantable: true },
    { relationId: 2, grantee: 'public', privilegeType: 'INSERT' },
    { relationId: 2, grantee: "it's a role", privilegeType: 'UPDATE' },
  ]).sql
  const revoke = pgMeta.tablePrivileges.revoke([
    { relationId: 1, grantee: 'anon', privilegeType: 'DELETE' },
    { relationId: 2, grantee: 'public', privilegeType: 'SELECT' },
  ]).sql

  expect(expectAnalyzableExecutes(grant)).toBe(4)
  expect(expectAnalyzableExecutes(revoke)).toBe(2)
  // A quote in the grantee can't break out of the format string.
  expect(grant).toContain(`"it''s a role"`)
})

test('publication update SQL has analyzable EXECUTEs', () => {
  const variants = [
    {},
    { tables: null },
    { tables: [] },
    { tables: ['public.t', 'bare', 'a.b.c'] },
    { name: 'renamed', owner: 'postgres', publish_insert: true },
  ]
  for (const params of variants) {
    const { sql } = pgMeta.publications.update(1, params)
    expect(expectAnalyzableExecutes(sql), JSON.stringify(params)).toBeGreaterThan(0)
  }
})

test('column privilege grant and revoke SQL has analyzable EXECUTEs', () => {
  const grant = pgMeta.columnPrivileges.grant([
    { columnId: '1.1', grantee: 'anon', privilegeType: 'SELECT' },
    { columnId: '1.2', grantee: 'public', privilegeType: 'UPDATE', isGrantable: true },
  ]).sql
  const revoke = pgMeta.columnPrivileges.revoke([
    { columnId: '1.1', grantee: "it's a role", privilegeType: 'SELECT' },
  ]).sql

  expect(expectAnalyzableExecutes(grant)).toBe(2)
  expect(expectAnalyzableExecutes(revoke)).toBe(1)
  expect(revoke).toContain(`"it''s a role"`)
})

test('schema update and remove SQL has analyzable EXECUTEs', () => {
  expect(
    expectAnalyzableExecutes(pgMeta.schemas.update({ id: 1 }, { name: 'a', owner: 'b' }).sql)
  ).toBe(2)
  // Both branches of the cascade choice are present, each with a fixed statement.
  expect(expectAnalyzableExecutes(pgMeta.schemas.remove({ id: 1 }, { cascade: true }).sql)).toBe(2)
  expect(expectAnalyzableExecutes(pgMeta.schemas.remove({ name: 's' }).sql)).toBe(2)
})

test('role update and remove SQL has analyzable EXECUTEs', () => {
  const update = pgMeta.roles.update(
    { id: 1 },
    { name: 'renamed', canLogin: true, connectionLimit: 5, validUntil: '2030-01-01' }
  ).sql
  expect(expectAnalyzableExecutes(update)).toBe(2)
  expect(expectAnalyzableExecutes(pgMeta.roles.update({ id: 1 }, { canLogin: false }).sql)).toBe(1)
  expect(expectAnalyzableExecutes(pgMeta.roles.remove({ id: 1 }, { ifExists: true }).sql)).toBe(1)
})
