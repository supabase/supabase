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
      name: 'wasm_fdw',
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
      name: 'wasm_fdw',
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
    wrapper: {
      id: 42,
      name: 'bigquery_fdw',
      server_name: 'selected_bigquery_server',
      server_options: ['sa_key_id=123e4567-e89b-12d3-a456-426614174000'],
    },
    wrapperMeta: {
      name: 'bigquery_fdw',
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
  // Secrets are deleted by the id already stored on the server's own option
  // value - never by a guessed name, since that naming convention has changed
  // more than once across this feature's history (see next two tests).
  expect(sql).toContain(
    "delete from vault.secrets where id = '123e4567-e89b-12d3-a456-426614174000'::uuid"
  )
  expect(sql).toContain(
    "delete from vault.secrets where key_id = '123e4567-e89b-12d3-a456-426614174000'"
  )
  expect(sql).not.toContain('where name =')
})

test('skips secret cleanup entirely when an encrypted option was never set', () => {
  const sql = getDeleteFDWSql({
    wrapper: {
      id: 42,
      name: 'bigquery_fdw',
      server_name: 'selected_bigquery_server',
      server_options: [],
    },
    wrapperMeta: {
      name: 'bigquery_fdw',
      handlerName: 'big_query_fdw_handler',
      validatorName: 'big_query_fdw_validator',
      server: { options: [{ name: 'sa_key_id', encrypted: true }] },
    },
  })

  expect(sql).not.toContain('vault.secrets')
  expect(sql).not.toContain('pgsodium')
})

test('secret cleanup is deterministic regardless of which era the wrapper was created in', () => {
  // Older wrappers may have named their secrets after the FDW or a
  // wrapper_name-based convention that no longer exists in the app - this must
  // not matter, since cleanup never guesses a name.
  const sql = getDeleteFDWSql({
    wrapper: {
      id: 42,
      name: 'some_legacy_custom_fdw_name',
      server_name: 'some_legacy_custom_fdw_name_server',
      server_options: ['sa_key_id=123e4567-e89b-12d3-a456-426614174000'],
    },
    wrapperMeta: {
      name: 'bigquery_fdw',
      handlerName: 'big_query_fdw_handler',
      validatorName: 'big_query_fdw_validator',
      server: { options: [{ name: 'sa_key_id', encrypted: true }] },
    },
  })

  expect(sql).toContain(
    "delete from vault.secrets where id = '123e4567-e89b-12d3-a456-426614174000'::uuid"
  )
})

test('editing a server does not raise even when other servers share the same FDW', () => {
  const sql = getUpdateFDWSql({
    wrapper: {
      id: 42,
      name: 'bigquery_fdw',
      server_name: 'selected_bigquery_server',
      server_options: ['project_id=old-project'],
    },
    wrapperMeta: {
      name: 'bigquery_fdw',
      handlerName: 'big_query_fdw_handler',
      validatorName: 'big_query_fdw_validator',
      server: { options: [{ name: 'project_id', encrypted: false }] },
    },
    formState: {
      wrapper_name: 'bigquery_fdw',
      server_name: 'selected_bigquery_server',
      project_id: 'new-project',
    },
    tables: [],
  })

  // A server can be edited regardless of whether other servers share its FDW -
  // the update only ever targets this server's own name, options, and tables.
  expect(sql).not.toContain('raise exception')
  expect(sql).not.toContain('cannot be edited here')
  expect(sql).toContain(
    "alter server selected_bigquery_server\n          options (set project_id 'new-project')"
  )
})

test('updating a wrapper alters the server and FDW instead of dropping and recreating them', () => {
  const sql = getUpdateFDWSql({
    wrapper: {
      id: 42,
      name: 'bigquery_fdw',
      server_name: 'bigquery_server',
      server_options: ['project_id=old-project'],
      tables: [],
    },
    wrapperMeta: {
      name: 'bigquery_fdw',
      handlerName: 'big_query_fdw_handler',
      validatorName: 'big_query_fdw_validator',
      server: { options: [{ name: 'project_id', encrypted: false }] },
    },
    formState: {
      wrapper_name: 'bigquery_fdw',
      server_name: 'bigquery_server',
      project_id: 'new-project',
    },
    tables: [],
  })

  expect(sql).toContain(
    "alter server bigquery_server\n          options (set project_id 'new-project')"
  )
  expect(sql).not.toContain('drop server')
  expect(sql).not.toContain('drop foreign data wrapper')
  expect(sql).not.toContain('create foreign data wrapper')
})

test('the FDW is never renamed or recreated, since it is shared across every server of its type', () => {
  const sql = getUpdateFDWSql({
    wrapper: {
      id: 42,
      name: 'bigquery_fdw',
      server_name: 'bigquery_server',
      server_options: [],
      tables: [],
    },
    wrapperMeta: {
      name: 'bigquery_fdw',
      handlerName: 'big_query_fdw_handler',
      validatorName: 'big_query_fdw_validator',
      server: { options: [] },
    },
    formState: {
      wrapper_name: 'bigquery_fdw',
      server_name: 'bigquery_server',
    },
    tables: [],
  })

  expect(sql).not.toContain('rename to')
  expect(sql).not.toContain('create foreign data wrapper')
  expect(sql).not.toContain('drop foreign data wrapper')
})

test('renaming a server emits a rename statement before any clause targeting the new name', () => {
  const sql = getUpdateFDWSql({
    wrapper: {
      id: 42,
      name: 'bigquery_fdw',
      server_name: 'old_server_name',
      server_options: ['project_id=old-project'],
      tables: [],
    },
    wrapperMeta: {
      name: 'bigquery_fdw',
      handlerName: 'big_query_fdw_handler',
      validatorName: 'big_query_fdw_validator',
      server: { options: [{ name: 'project_id', encrypted: false }] },
    },
    formState: {
      wrapper_name: 'bigquery_fdw',
      server_name: 'new_server_name',
      project_id: 'new-project',
    },
    tables: [],
  })

  expect(sql).toContain('alter server old_server_name rename to new_server_name')
  expect(sql).toContain(
    "alter server new_server_name\n          options (set project_id 'new-project')"
  )
  expect(sql).not.toContain('alter server old_server_name\n          options')
  expect(sql.indexOf('rename to')).toBeLessThan(sql.indexOf('options (set project_id'))
})

test('adding a server option not previously set uses ADD, not SET', () => {
  const sql = getUpdateFDWSql({
    wrapper: {
      id: 42,
      name: 'bigquery_fdw',
      server_name: 'bigquery_server',
      server_options: [],
      tables: [],
    },
    wrapperMeta: {
      name: 'bigquery_fdw',
      handlerName: 'big_query_fdw_handler',
      validatorName: 'big_query_fdw_validator',
      server: { options: [{ name: 'project_id', encrypted: false }] },
    },
    formState: {
      wrapper_name: 'bigquery_fdw',
      server_name: 'bigquery_server',
      project_id: 'a-project',
    },
    tables: [],
  })

  expect(sql).toContain("add project_id 'a-project'")
})

test('clearing a server option uses DROP', () => {
  const sql = getUpdateFDWSql({
    wrapper: {
      id: 42,
      name: 'bigquery_fdw',
      server_name: 'bigquery_server',
      server_options: ['project_id=a-project'],
      tables: [],
    },
    wrapperMeta: {
      name: 'bigquery_fdw',
      handlerName: 'big_query_fdw_handler',
      validatorName: 'big_query_fdw_validator',
      server: { options: [{ name: 'project_id', encrypted: false }] },
    },
    formState: {
      wrapper_name: 'bigquery_fdw',
      server_name: 'bigquery_server',
      project_id: '',
    },
    tables: [],
  })

  expect(sql).toContain('drop project_id')
})

test('an encrypted option that already has a secret is updated in place via vault.update_secret', () => {
  const sql = getUpdateFDWSql({
    wrapper: {
      id: 42,
      name: 'bigquery_fdw',
      server_name: 'bigquery_server',
      server_options: ['sa_key_id=123e4567-e89b-12d3-a456-426614174000'],
      tables: [],
    },
    wrapperMeta: {
      name: 'bigquery_fdw',
      handlerName: 'big_query_fdw_handler',
      validatorName: 'big_query_fdw_validator',
      server: { options: [{ name: 'sa_key_id', encrypted: true }] },
    },
    formState: {
      wrapper_name: 'bigquery_fdw',
      server_name: 'bigquery_server',
      sa_key_id: 'new-secret-value',
    },
    tables: [],
  })

  expect(sql).toContain('vault.update_secret')
  expect(sql).not.toContain('vault.create_secret')
  expect(sql).not.toContain('delete from vault.secrets')
})

test('foreign table diffing: creates new tables, drops removed tables, and skips unchanged tables', () => {
  const sql = getUpdateFDWSql({
    wrapper: {
      id: 42,
      name: 'bigquery_fdw',
      server_name: 'bigquery_server',
      server_options: [],
      tables: [
        {
          id: 1,
          schema: 'public',
          name: 'unchanged_table',
          columns: [{ name: 'id', type: 'text' }],
          options: ['table=unchanged_table'],
        },
        {
          id: 2,
          schema: 'public',
          name: 'removed_table',
          columns: [{ name: 'id', type: 'text' }],
          options: ['table=removed_table'],
        },
      ],
    },
    wrapperMeta: {
      name: 'bigquery_fdw',
      handlerName: 'big_query_fdw_handler',
      validatorName: 'big_query_fdw_validator',
      server: { options: [] },
    },
    formState: {
      wrapper_name: 'bigquery_fdw',
      server_name: 'bigquery_server',
    },
    tables: [
      {
        id: 1,
        schema_name: 'public',
        table_name: 'unchanged_table',
        columns: [{ name: 'id', type: 'text' }],
        is_new_schema: false,
        table: 'unchanged_table',
      },
      {
        schema_name: 'public',
        table_name: 'new_table',
        columns: [{ name: 'id', type: 'text' }],
        is_new_schema: false,
        table: 'new_table',
      },
    ],
  })

  expect(sql).toContain('create foreign table public.new_table')
  expect(sql).toContain('drop foreign table if exists public.removed_table')
  expect(sql).not.toContain('unchanged_table (')
  expect(sql).not.toContain('drop foreign table if exists public.unchanged_table')
})

test('foreign table diffing: a table without an id is always treated as new, even if its schema/name match an existing table', () => {
  const sql = getUpdateFDWSql({
    wrapper: {
      id: 42,
      name: 'bigquery_fdw',
      server_name: 'bigquery_server',
      server_options: [],
      tables: [
        {
          id: 1,
          schema: 'public',
          name: 'orders',
          columns: [{ name: 'id', type: 'text' }],
          options: [],
        },
      ],
    },
    wrapperMeta: {
      name: 'bigquery_fdw',
      handlerName: 'big_query_fdw_handler',
      validatorName: 'big_query_fdw_validator',
      server: { options: [] },
    },
    formState: {
      wrapper_name: 'bigquery_fdw',
      server_name: 'bigquery_server',
    },
    tables: [
      {
        schema_name: 'public',
        table_name: 'orders',
        columns: [{ name: 'id', type: 'text' }],
        is_new_schema: false,
      },
    ],
  })

  expect(sql).toContain('create foreign table public.orders')
  expect(sql).toContain('drop foreign table if exists public.orders')
})

test('foreign table diffing: renaming a table emits an explicit ALTER ... RENAME instead of drop and recreate', () => {
  const sql = getUpdateFDWSql({
    wrapper: {
      id: 42,
      name: 'bigquery_fdw',
      server_name: 'bigquery_server',
      server_options: [],
      tables: [
        {
          id: 1,
          schema: 'public',
          name: 'accounts',
          columns: [{ name: 'id', type: 'text' }],
          options: [],
        },
      ],
    },
    wrapperMeta: {
      name: 'bigquery_fdw',
      handlerName: 'big_query_fdw_handler',
      validatorName: 'big_query_fdw_validator',
      server: { options: [] },
    },
    formState: {
      wrapper_name: 'bigquery_fdw',
      server_name: 'bigquery_server',
    },
    tables: [
      {
        id: 1,
        schema_name: 'public',
        table_name: 'wot',
        columns: [{ name: 'id', type: 'text' }],
        is_new_schema: false,
      },
    ],
  })

  expect(sql).toContain('alter foreign table public.accounts rename to wot')
  expect(sql).not.toContain('create foreign table')
  expect(sql).not.toContain('drop foreign table')
})

test('foreign table diffing: moving a table to a new schema emits SET SCHEMA before any rename', () => {
  const sql = getUpdateFDWSql({
    wrapper: {
      id: 42,
      name: 'bigquery_fdw',
      server_name: 'bigquery_server',
      server_options: [],
      tables: [
        {
          id: 1,
          schema: 'public',
          name: 'accounts',
          columns: [{ name: 'id', type: 'text' }],
          options: [],
        },
      ],
    },
    wrapperMeta: {
      name: 'bigquery_fdw',
      handlerName: 'big_query_fdw_handler',
      validatorName: 'big_query_fdw_validator',
      server: { options: [] },
    },
    formState: {
      wrapper_name: 'bigquery_fdw',
      server_name: 'bigquery_server',
    },
    tables: [
      {
        id: 1,
        schema_name: 'stripe',
        table_name: 'wot',
        columns: [{ name: 'id', type: 'text' }],
        is_new_schema: false,
      },
    ],
  })

  expect(sql).toContain('alter foreign table public.accounts set schema stripe')
  expect(sql).toContain('alter foreign table stripe.accounts rename to wot')
  expect(sql.indexOf('set schema')).toBeLessThan(sql.indexOf('rename to'))
})

test('foreign table diffing: retyping a column drops and re-adds it, since ALTER COLUMN TYPE is unsupported for foreign tables', () => {
  const sql = getUpdateFDWSql({
    wrapper: {
      id: 42,
      name: 'bigquery_fdw',
      server_name: 'bigquery_server',
      server_options: [],
      tables: [
        {
          id: 1,
          schema: 'public',
          name: 'orders',
          columns: [{ name: 'amount', type: 'integer' }],
          options: [],
        },
      ],
    },
    wrapperMeta: {
      name: 'bigquery_fdw',
      handlerName: 'big_query_fdw_handler',
      validatorName: 'big_query_fdw_validator',
      server: { options: [] },
    },
    formState: {
      wrapper_name: 'bigquery_fdw',
      server_name: 'bigquery_server',
    },
    tables: [
      {
        id: 1,
        schema_name: 'public',
        table_name: 'orders',
        columns: [{ name: 'amount', type: 'numeric' }],
        is_new_schema: false,
      },
    ],
  })

  expect(sql).toContain('alter foreign table public.orders\n          drop column amount')
  expect(sql).toContain('alter foreign table public.orders\n          add column amount numeric')
})

test('editing an existing foreign table excludes catalog fields from its options', () => {
  const sql = getUpdateFDWSql({
    wrapper: { id: 42, name: 'bigquery_fdw', server_name: 'bigquery_server' },
    wrapperMeta: {
      name: 'bigquery_fdw',
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
