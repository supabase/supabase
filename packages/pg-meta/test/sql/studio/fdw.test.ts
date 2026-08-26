import { expect, test } from 'vitest'

import { getCreateFDWSql } from '../../../src'
import { ident, literal } from '../../../src/pg-format'

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

// A legal Postgres identifier whose spelling collides with the fixed DO-block
// dollar-quote delimiter used before the delimiter became generated.
const dollarWrapper = { wrapper_name: 'x$pg_meta$y', server_name: 'my_server' }

test('DO-block delimiters avoid collision with user values containing dollar quotes', () => {
  const sql = getCreateFDWSql({
    ...baseArgs,
    wrapperMeta: {
      handlerName: 'wasm_fdw_handler',
      validatorName: 'wasm_fdw_validator',
      server: { options: [{ name: 'api_key', encrypted: false }] },
    },
    formState: { ...dollarWrapper, api_key: 'plain' },
  })

  // The base delimiter cannot be used when a value itself contains it.
  expect(sql).not.toContain('do $pg_meta$')
  // A collision-free suffix is picked instead.
  expect(sql).toContain('do $pg_meta_1$')
})

test('server and wrapper names are passed as format() arguments, not embedded in the E-string', () => {
  const sql = getCreateFDWSql({
    ...baseArgs,
    wrapperMeta: {
      handlerName: 'wasm_fdw_handler',
      validatorName: 'wasm_fdw_validator',
      server: { options: [{ name: 'api_key', encrypted: false }] },
    },
    formState: { wrapper_name: "wrap'per\\x", server_name: "serv'er", api_key: 'plain' },
  })

  // Names reach format() as %s arguments so quotes/backslashes in the names
  // never interact with the outer E'...' string.
  expect(sql).toContain(`E'create server %s foreign data wrapper %s options (`)

  const quotedServer = ident("serv'er")
  const quotedWrapper = ident("wrap'per\\x")
  expect(sql).toContain(quotedServer)
  expect(sql).toContain(quotedWrapper)
})
