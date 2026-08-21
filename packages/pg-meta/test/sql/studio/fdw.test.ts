import { expect, test } from 'vitest'

import { getCreateFDWSql } from '../../../src'
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
