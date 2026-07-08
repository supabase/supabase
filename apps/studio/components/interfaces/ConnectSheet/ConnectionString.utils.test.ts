import { describe, expect, test } from 'vitest'

import {
  buildConnectionParameters,
  buildConnectionStringWithPassword,
  buildSafeConnectionString,
  DEFAULT_PORT,
  parseConnectionParams,
  PASSWORD_PLACEHOLDER,
  resolveConnectionString,
} from './ConnectionString.utils'

describe('parseConnectionParams', () => {
  test('returns hidden defaults for an empty string', () => {
    expect(parseConnectionParams('')).toEqual({
      host: 'hidden',
      port: DEFAULT_PORT,
      user: 'hidden',
      database: 'hidden',
    })
  })

  test('returns hidden defaults for an unparseable URL', () => {
    expect(parseConnectionParams('not a url')).toEqual({
      host: 'hidden',
      port: DEFAULT_PORT,
      user: 'hidden',
      database: 'hidden',
    })
  })

  test('parses a platform-shaped connection string', () => {
    const uri =
      'postgresql://postgres.projref:[YOUR-PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres'
    expect(parseConnectionParams(uri)).toEqual({
      host: 'aws-0-eu-west-1.pooler.supabase.com',
      port: '6543',
      user: 'postgres.projref',
      database: 'postgres',
    })
  })

  test('decodes percent-encoded bracket placeholders in the user info', () => {
    // The URL parser percent-encodes the `[`/`]` in self-hosted's POOLER_TENANT_ID placeholder.
    // parseConnectionParams must decode so the displayed user matches what we wrote.
    const uri =
      'postgresql://postgres.[POOLER_TENANT_ID]:[YOUR-PASSWORD]@supabase.example.com:6543/postgres'
    expect(parseConnectionParams(uri).user).toBe('postgres.[POOLER_TENANT_ID]')
  })
})

describe('buildSafeConnectionString', () => {
  test('returns empty string when input is empty', () => {
    expect(buildSafeConnectionString('', parseConnectionParams(''))).toBe('')
  })

  test('rebuilds the URL with PASSWORD_PLACEHOLDER and the parsed params (round-trips brackets)', () => {
    const uri =
      'postgresql://postgres.[POOLER_TENANT_ID]:[YOUR-PASSWORD]@supabase.example.com:6543/postgres'
    const params = parseConnectionParams(uri)
    const safe = buildSafeConnectionString(uri, params)
    expect(safe).toBe(
      `postgresql://postgres.[POOLER_TENANT_ID]:${PASSWORD_PLACEHOLDER}@supabase.example.com:6543/postgres`
    )
  })

  test('preserves search params from the original URL', () => {
    const uri = 'postgresql://postgres.proj:[YOUR-PASSWORD]@host:5432/postgres?sslmode=require'
    const params = parseConnectionParams(uri)
    expect(buildSafeConnectionString(uri, params)).toContain('?sslmode=require')
  })
})

describe('buildConnectionStringWithPassword', () => {
  test('returns the original string when input or password is empty', () => {
    const uri = `postgresql://postgres:${PASSWORD_PLACEHOLDER}@localhost:5432/postgres`

    expect(buildConnectionStringWithPassword('', 'password')).toBe('')
    expect(buildConnectionStringWithPassword(uri, '')).toBe(uri)
  })

  test('replaces every password placeholder with the encoded password', () => {
    const uri = `postgresql://postgres:${PASSWORD_PLACEHOLDER}@localhost:5432/postgres?password=${PASSWORD_PLACEHOLDER}`

    expect(buildConnectionStringWithPassword(uri, 'p@ss/word#1')).toBe(
      'postgresql://postgres:p%40ss%2Fword%231@localhost:5432/postgres?password=p%40ss%2Fword%231'
    )
  })
})

describe('resolveConnectionString', () => {
  const pooler = {
    transactionShared: 'tx-shared',
    sessionShared: 'session-shared',
    transactionDedicated: 'tx-dedicated',
    sessionDedicated: 'session-dedicated',
    ipv4SupportedForDedicatedPooler: true,
    direct: 'direct-uri',
  }

  test('returns empty string when pooler bag is undefined', () => {
    expect(
      resolveConnectionString({
        connectionMethod: 'direct',
        useSharedPooler: false,
        connectionStringPooler: undefined,
      })
    ).toBe('')
  })

  test('direct method returns the direct URI', () => {
    expect(
      resolveConnectionString({
        connectionMethod: 'direct',
        useSharedPooler: false,
        connectionStringPooler: pooler,
      })
    ).toBe('direct-uri')
  })

  test('session method returns sessionShared', () => {
    expect(
      resolveConnectionString({
        connectionMethod: 'session',
        useSharedPooler: false,
        connectionStringPooler: pooler,
      })
    ).toBe('session-shared')
  })

  test('transaction prefers dedicated when available and useSharedPooler is false', () => {
    expect(
      resolveConnectionString({
        connectionMethod: 'transaction',
        useSharedPooler: false,
        connectionStringPooler: pooler,
      })
    ).toBe('tx-dedicated')
  })

  test('transaction falls back to shared when useSharedPooler is true', () => {
    expect(
      resolveConnectionString({
        connectionMethod: 'transaction',
        useSharedPooler: true,
        connectionStringPooler: pooler,
      })
    ).toBe('tx-shared')
  })

  test('transaction falls back to shared when no dedicated pooler exists', () => {
    expect(
      resolveConnectionString({
        connectionMethod: 'transaction',
        useSharedPooler: false,
        connectionStringPooler: { ...pooler, transactionDedicated: undefined },
      })
    ).toBe('tx-shared')
  })
})

describe('buildConnectionParameters', () => {
  test('produces host/port/database/user rows in display order', () => {
    expect(
      buildConnectionParameters({
        host: 'h',
        port: '5432',
        user: 'u',
        database: 'd',
      })
    ).toEqual([
      { key: 'host', value: 'h' },
      { key: 'port', value: '5432' },
      { key: 'database', value: 'd' },
      { key: 'user', value: 'u' },
    ])
  })
})
