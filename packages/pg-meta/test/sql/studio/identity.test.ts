import { expect, test } from 'vitest'

import { getUpdateIdentitySequenceSQL } from '../../../src'

test('quotes schema and table for pg_get_serial_sequence so uppercase names resolve', () => {
  const sql = getUpdateIdentitySequenceSQL({ schema: 'App', table: 'Users', column: 'Id' })

  expect(sql).toContain(`pg_get_serial_sequence('"App"."Users"', 'Id')`)
})

test('leaves lowercase identifiers unquoted, matching the FROM clause below it', () => {
  const sql = getUpdateIdentitySequenceSQL({ schema: 'public', table: 'people', column: 'id' })

  expect(sql).toContain(`pg_get_serial_sequence('public.people', 'id')`)
  expect(sql).toContain('FROM public.people')
})
