import { expect, test } from 'vitest'

import { getCreateFDWSql, getDeleteFDWSql, getUpdateFDWSql } from '../../../src'
import { literal } from '../../../src/pg-format'

const baseArgs = {
  mode: 'skip' as const,
  tables: [],
  sourceSchema: '',
  targetSchema: '',
}

// A value with both a backslash and a single quote. literal() escapes it to a
// single E'...' literal; the old code then re-escaped the quotes and embedded
// it in the outer E'...' string, decoding the backslash twice.
const trickyValue = "ab\\cd'ef"

test('unencrypted server option values are passed as format() %L arguments', () => {
  const sql = getCreateFDWSql({
    ...baseArgs,
    wrapperMeta: {
      handlerName: 'wasm_fdw_handler',
      validatorName: 'wasm_fdw_validator',
      server: { options: [{ name: 'api_key', encrypted: false }] },
    },
    formState: { wrapper_name: 'my_wrapper', server_name: 'my_server', api_key: trickyValue },
  })

  // The option is emitted as a %L placeholder so format() escapes the value once.
  expect(sql).toContain('api_key %L')

  // The raw value reaches format() as a single-level literal() argument.
  expect(sql).toContain(literal(trickyValue))

  // Regression: the value must NOT be embedded as a double-escaped literal in the
  // outer E'...' string (literal(value).replace(/'/g, "''")), which corrupted
  // backslashes or aborted creation with "invalid Unicode escape".
  const doubleEscaped = literal(trickyValue).replace(/'/g, "''")
  expect(sql).not.toContain(doubleEscaped)
})

test('encrypted server options still resolve their value through Vault unchanged', () => {
  const sql = getCreateFDWSql({
    ...baseArgs,
    wrapperMeta: {
      handlerName: 'wasm_fdw_handler',
      validatorName: 'wasm_fdw_validator',
      server: { options: [{ name: 'api_secret', encrypted: true }] },
    },
    formState: { wrapper_name: 'my_wrapper', server_name: 'my_server', api_secret: 'shh' },
  })

  // Encrypted options keep the ''%s'' placeholder filled by the vault secret id.
  expect(sql).toContain("api_secret ''%s''")
  expect(sql).toContain('vault.create_secret')
})

test('deleting a wrapper row drops its server and preserves shared wrapper dependencies', () => {
  const sql = getDeleteFDWSql({
    wrapper: { id: 42, name: 'bigquery_fdw', server_name: 'selected_bigquery_server' },
    wrapperMeta: {
      handlerName: 'big_query_fdw_handler',
      validatorName: 'big_query_fdw_validator',
      server: { options: [{ name: 'sa_key_id', encrypted: true }] },
    },
  })

  expect(sql).toContain('where s.oid = 42')
  expect(sql).toContain("and s.srvname = ''selected_bigquery_server''")
  expect(sql).toContain("and w.fdwname = ''bigquery_fdw''")
  expect(sql.indexOf('raise exception')).toBeLessThan(sql.indexOf('drop server'))
  expect(sql).toContain('drop server if exists selected_bigquery_server cascade')
  expect(sql).toContain("where w.fdwname = 'bigquery_fdw'")
  expect(sql).toContain("execute format('drop foreign data wrapper if exists %I cascade'")
  expect(sql).not.toContain('drop foreign data wrapper if exists "bigquery_fdw" cascade')
  expect(sql).toContain("where fdwname = 'bigquery_fdw'")
})

test('editing a shared wrapper fails before any server is dropped', () => {
  const sql = getUpdateFDWSql({
    wrapper: { id: 42, name: 'bigquery_fdw', server_name: 'selected_bigquery_server' },
    wrapperMeta: {
      handlerName: 'big_query_fdw_handler',
      validatorName: 'big_query_fdw_validator',
      server: { options: [] },
    },
    formState: { wrapper_name: 'bigquery_fdw', server_name: 'selected_bigquery_server' },
    tables: [],
  })

  expect(sql).toContain("s.srvname <> 'selected_bigquery_server'")
  expect(sql.indexOf('raise exception')).toBeLessThan(sql.indexOf('drop server'))
})

test('editing an existing foreign table excludes catalog fields from its options', () => {
  const sql = getUpdateFDWSql({
    wrapper: { id: 42, name: 'bigquery_fdw', server_name: 'bigquery_server' },
    wrapperMeta: {
      handlerName: 'big_query_fdw_handler',
      validatorName: 'big_query_fdw_validator',
      server: { options: [{ name: 'project_id', encrypted: false }] },
    },
    formState: {
      wrapper_name: 'bigquery_fdw',
      server_name: 'bigquery_server',
      project_id: 'example-project',
    },
    tables: [
      {
        id: 171639,
        schema: 'qa_bq',
        schema_name: 'qa_bq',
        table_name: 'orders',
        columns: [{ name: 'id', type: 'text' }],
        is_new_schema: false,
        index: 0,
        table: 'orders',
        location: 'US',
      },
    ],
  })

  expect(sql).toContain('create foreign table qa_bq.orders')
  expect(sql).toContain('"table" \'orders\'')
  expect(sql).toContain("location 'US'")
  expect(sql).not.toContain('id 171639')
  expect(sql).not.toContain("schema 'qa_bq'")
})
