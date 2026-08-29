import { expect, test } from 'vitest'

import { buildFunctionPrivilegesSql, buildTablePrivilegesSql } from '../../../src'

// Regression coverage for the dollar-quote (`$$`) collision in the
// two `DO $$ ... $$;` blocks emitted by `buildTablePrivilegesSql`
// and `buildFunctionPrivilegesSql`.
//
// Pre-fix behaviour: both bodies read `nspname` and `relname` (or
// `proname`) from `pg_class` / `pg_namespace` and pass them
// through `format('... %I.%I ...', nspname, relname)`. When any of
// those catalog values contains the literal `$$`, the rendered
// `format()` argument closes the outer `do $$` delimiter early
// and the statement fails with `syntax error at or near "..."`.
//
// Post-fix behaviour: the DO block uses a `$pg_meta$` delimiter
// (or `$pg_meta_1$`/etc. if any input contains the literal
// `$pg_meta$`) and the generated SQL round-trips cleanly through
// Postgres.

test('buildTablePrivilegesSql: uses a non-$$ DO-block delimiter', () => {
  const sql = buildTablePrivilegesSql([1, 2, 3], 'grant')

  expect(sql).not.toMatch(/do\s*\$\$\s/)
  expect(sql).toMatch(/do\s*\$pg_meta/)

  // Opener and closer must match.
  const openMatch = sql.match(/do\s*(\$pg_meta(?:_\d+)?\$)/)
  expect(openMatch).not.toBeNull()
  expect(sql).toContain(`end ${openMatch![1]};`)
})

test('buildTablePrivilegesSql: empty oids produces empty SQL (unchanged)', () => {
  // Regression guard: the helper should not run when the oids
  // array is empty (no DO block emitted at all).
  const sql = buildTablePrivilegesSql([], 'grant')
  expect(sql).toBe('')
})

test('buildFunctionPrivilegesSql: uses a non-$$ DO-block delimiter', () => {
  const sql = buildFunctionPrivilegesSql(['public.my_func'], 'grant')

  expect(sql).not.toMatch(/do\s*\$\$\s/)
  expect(sql).toMatch(/do\s*\$pg_meta/)

  const openMatch = sql.match(/do\s*(\$pg_meta(?:_\d+)?\$)/)
  expect(openMatch).not.toBeNull()
  expect(sql).toContain(`end ${openMatch![1]};`)
})

test('buildFunctionPrivilegesSql: schemaNames input containing $$ does not collide', () => {
  // A schema.name input that itself contains the literal `$$`.
  // The helper must pick `$pg_meta_1$` (or higher) so the body's
  // `literal('weird$$schema_name')` substring does not close the
  // outer delimiter.
  const sql = buildFunctionPrivilegesSql(['weird$$schema.my$$func'], 'grant')

  expect(sql).not.toMatch(/do\s*\$\$\s/)
  expect(sql).not.toMatch(/do\s*\$pg_meta\$$/) // base delimiter collides; must skip
  expect(sql).toMatch(/do\s*\$pg_meta_\d+\$/)
})

test('buildFunctionPrivilegesSql: input containing $pg_meta$ picks a higher delimiter', () => {
  // Adversarial: the input contains the base delimiter text. The
  // helper must skip past it and pick `$pg_meta_1$`.
  const sql = buildFunctionPrivilegesSql(['$pg_meta$.my_func'], 'grant')

  expect(sql).toMatch(/do\s*\$pg_meta_1\$/)
})

test('buildFunctionPrivilegesSql: empty schemaNames produces empty SQL (unchanged)', () => {
  // Regression guard: no DO block emitted when the input list is
  // empty.
  const sql = buildFunctionPrivilegesSql([], 'grant')
  expect(sql).toBe('')
})
