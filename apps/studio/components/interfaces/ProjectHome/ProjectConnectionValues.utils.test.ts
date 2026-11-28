import { describe, expect, test } from 'vitest'

import { getConnectionOptions } from './ProjectConnectionValues.utils'

const SESSION =
  'postgresql://postgres.ref:[YOUR-DATABASE-PASSWORD]@pooler.supabase.com:5432/postgres'
const TRANSACTION =
  'postgresql://postgres.ref:[YOUR-DATABASE-PASSWORD]@pooler.supabase.com:6543/postgres'
const DIRECT = 'postgresql://postgres:[YOUR-DATABASE-PASSWORD]@db.ref.supabase.co:5432/postgres'
const DEDICATED = 'postgresql://postgres:[YOUR-DATABASE-PASSWORD]@db.ref.supabase.co:6543/postgres'

describe('getConnectionOptions', () => {
  test('puts the session pooler first, since it is the string people copy most', () => {
    const options = getConnectionOptions({
      sessionShared: SESSION,
      transactionShared: TRANSACTION,
      direct: DIRECT,
      ipv4SupportedForDedicatedPooler: false,
    })

    expect(options.map((option) => option.label)).toEqual([
      'Session pooler',
      'Direct connection',
      'Transaction pooler',
    ])
  })

  test('offers the shared pooler as the IPv4 option when the project has a dedicated pooler', () => {
    const options = getConnectionOptions({
      sessionShared: SESSION,
      transactionShared: TRANSACTION,
      transactionDedicated: DEDICATED,
      direct: DIRECT,
      ipv4SupportedForDedicatedPooler: false,
    })

    expect(options.map(({ label, uri }) => [label, uri])).toEqual([
      ['Session pooler', SESSION],
      ['Direct connection', DIRECT],
      ['Transaction pooler', DEDICATED],
      ['Transaction pooler (IPv4)', TRANSACTION],
    ])
  })

  test('explains when to use each option, and flags IPv6-only ones unless the IPv4 add-on is on', () => {
    const base = {
      sessionShared: SESSION,
      transactionShared: TRANSACTION,
      direct: DIRECT,
    }
    const [, directWithoutAddon] = getConnectionOptions({
      ...base,
      ipv4SupportedForDedicatedPooler: false,
    })
    const [, directWithAddon] = getConnectionOptions({
      ...base,
      ipv4SupportedForDedicatedPooler: true,
    })

    expect(directWithoutAddon.description).toBe('For persistent servers and migrations. IPv6 only.')
    expect(directWithAddon.description).toBe('For persistent servers and migrations.')
  })

  test('offers a single option when every string resolves to the direct connection', () => {
    const options = getConnectionOptions({
      sessionShared: DIRECT,
      transactionShared: DIRECT,
      direct: DIRECT,
      ipv4SupportedForDedicatedPooler: false,
    })

    expect(options).toHaveLength(1)
    expect(options[0].uri).toBe(DIRECT)
  })

  test('returns nothing while connection details are loading', () => {
    expect(getConnectionOptions(undefined)).toEqual([])
  })
})
