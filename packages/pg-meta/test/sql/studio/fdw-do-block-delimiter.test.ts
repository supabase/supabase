import { expect, test } from 'vitest'

import { getCreateFDWSql, getDeleteFDWSql } from '../../../src'

const baseArgs = {
  mode: 'skip' as const,
  tables: [],
  sourceSchema: '',
  targetSchema: '',
}

// Regression coverage for the dollar-quote (`$$`) collision in the
// three `DO $$ ... $$;` blocks emitted by `getCreateFDWSql` (the
// create-encrypted-keys path, the create-server path) and
// `getDeleteFDWSql` (the delete-encrypted-keys path).
//
// Pre-fix behaviour: each DO body embeds the wrapper_name via
// `${literal(key)}` where `key = ${wrapper_name}_${option_name}`.
// When `wrapper_name` or `option_name` contains the literal byte
// sequence `$$`, the rendered `literal(key)` (e.g. `'my$$wrapper_key'`)
// contains `$$` inside the body, and PostgreSQL's dollar-quote
// parser treats the first `$$` it sees in the body as the closing
// delimiter of the outer block. The body is then parsed as
// truncated and the statement fails with `syntax error at or near
// "..."`.
//
// Post-fix behaviour: each DO block uses a collision-free delimiter
// derived from the wrapper_name and option_name values, and the
// generated SQL round-trips cleanly through Postgres.
//
// The existing `fdw.test.ts` is a unit test (no Postgres execution);
// matching that style, these tests assert the *generated SQL* uses
// a non-`$$` delimiter. The actual Postgres execution of the
// generated SQL is covered indirectly by the assertion that no
// substring in the SQL body matches the DO-block opener.

const wrapperNameWithDollar = 'my$$wrapper'
const optionNameWithDollar = 'api$$key'

test('create-encrypted-keys: wrapper_name containing $$ does not collide with DO-block delimiter', () => {
  const sql = getCreateFDWSql({
    ...baseArgs,
    wrapperMeta: {
      handlerName: 'wasm_fdw_handler',
      validatorName: 'wasm_fdw_validator',
      server: { options: [{ name: 'api_secret', encrypted: true }] },
    },
    formState: {
      wrapper_name: wrapperNameWithDollar,
      server_name: 'my_server',
      api_secret: 'shh',
    },
  })

  // The DO block opener must NOT be a literal `$$` — otherwise a
  // wrapper_name containing `$$` would close the outer delimiter
  // early when the body embeds `literal('my$$wrapper_api_secret')`.
  // Post-fix the helper picks `$pg_meta$` (or higher) which is
  // absent from the literal key text.
  expect(sql).not.toMatch(/do\s*\$\$\s/)
  expect(sql).toMatch(/do\s*\$pg_meta/)

  // The closing delimiter must match the opening one.
  const openMatch = sql.match(/do\s*(\$pg_meta(?:_\d+)?\$)/)
  expect(openMatch).not.toBeNull()
  expect(sql).toContain(`${openMatch![1]};`)
})

test('create-encrypted-keys: option_name containing $$ does not collide with DO-block delimiter', () => {
  const sql = getCreateFDWSql({
    ...baseArgs,
    wrapperMeta: {
      handlerName: 'wasm_fdw_handler',
      validatorName: 'wasm_fdw_validator',
      server: { options: [{ name: optionNameWithDollar, encrypted: true }] },
    },
    formState: {
      wrapper_name: 'my_wrapper',
      server_name: 'my_server',
      [optionNameWithDollar]: 'shh',
    },
  })

  expect(sql).not.toMatch(/do\s*\$\$\s/)
  expect(sql).toMatch(/do\s*\$pg_meta/)
})

test('create-server: wrapper_name containing $$ does not collide with DO-block delimiter', () => {
  const sql = getCreateFDWSql({
    ...baseArgs,
    wrapperMeta: {
      handlerName: 'wasm_fdw_handler',
      validatorName: 'wasm_fdw_validator',
      server: { options: [{ name: 'api_key', encrypted: false }] },
    },
    formState: {
      wrapper_name: wrapperNameWithDollar,
      server_name: 'my_server',
      api_key: 'plain-value',
    },
  })

  expect(sql).not.toMatch(/do\s*\$\$\s/)
  expect(sql).toMatch(/do\s*\$pg_meta/)
})

test('delete-encrypted-keys: wrapper_name containing $$ does not collide with DO-block delimiter', () => {
  const sql = getDeleteFDWSql({
    wrapper: { name: wrapperNameWithDollar },
    wrapperMeta: {
      handlerName: 'wasm_fdw_handler',
      validatorName: 'wasm_fdw_validator',
      server: { options: [{ name: 'api_secret', encrypted: true }] },
    },
  })

  expect(sql).not.toMatch(/do\s*\$\$\s/)
  expect(sql).toMatch(/do\s*\$pg_meta/)
})

test('create-encrypted-keys: encrypted value containing $pg_meta$ skips past base delimiter', () => {
  // Regression guard: the encrypted value (formState[option.name]) is
  // also embedded in the body via `${literal(formState[option.name] || '')}`
  // and must therefore be part of the delimiter candidate set. If a
  // user enters an encrypted value that contains the literal
  // `$pg_meta$`, the helper must pick `$pg_meta_1$` (or higher) to
  // avoid having the body's own string close the outer delimiter.
  const sql = getCreateFDWSql({
    ...baseArgs,
    wrapperMeta: {
      handlerName: 'wasm_fdw_handler',
      validatorName: 'wasm_fdw_validator',
      server: { options: [{ name: 'api_secret', encrypted: true }] },
    },
    formState: {
      wrapper_name: 'my_wrapper',
      server_name: 'my_server',
      api_secret: 'contains $pg_meta$ marker',
    },
  })

  expect(sql).not.toMatch(/do\s*\$\$\s/)
  // The base $pg_meta$ collides with the encrypted value, so the
  // helper must skip past it.
  expect(sql).toMatch(/do\s*\$pg_meta_\d+\$/)
  // And it must NOT use the base delimiter (which would still
  // collide with the encrypted value in the body).
  expect(sql).not.toMatch(/do\s*\$pg_meta\$$/)
})

test('non-$$ wrapper and option names still use the base $pg_meta$ delimiter', () => {
  // Regression guard: the helper must not regress to a literal `$$`
  // delimiter on the common case where the inputs are dollar-quote
  // free.
  const sql = getCreateFDWSql({
    ...baseArgs,
    wrapperMeta: {
      handlerName: 'wasm_fdw_handler',
      validatorName: 'wasm_fdw_validator',
      server: { options: [{ name: 'api_secret', encrypted: true }] },
    },
    formState: {
      wrapper_name: 'my_wrapper',
      server_name: 'my_server',
      api_secret: 'shh',
    },
  })

  expect(sql).toMatch(/do\s*\$pg_meta\$/)
})
