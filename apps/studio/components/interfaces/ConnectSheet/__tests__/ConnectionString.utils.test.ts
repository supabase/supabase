import { describe, expect, test } from 'vitest'

import {
  appendConnectionStringParams,
  applyTemporaryAccessToConnectionString,
  applyTemporaryAccessToPooler,
  buildConnectionParameters,
  buildConnectionStringWithPassword,
  buildJdbcString,
  buildPsqlCommand,
  buildSafeConnectionString,
  DEFAULT_PORT,
  parseConnectionParams,
  PASSWORD_PLACEHOLDER,
  resolveConnectionString,
  shouldAddTemporaryAccessPoolerOption,
  TOKEN_PASSWORD_PLACEHOLDER,
} from '../ConnectionString.utils'

describe('parseConnectionParams', () => {
  test('returns hidden defaults for an empty string', () => {
    expect(parseConnectionParams('')).toEqual({
      host: 'hidden',
      port: DEFAULT_PORT,
      user: 'hidden',
      database: 'hidden',
      search: '',
    })
  })

  test('returns hidden defaults for an unparseable URL', () => {
    expect(parseConnectionParams('not a url')).toEqual({
      host: 'hidden',
      port: DEFAULT_PORT,
      user: 'hidden',
      database: 'hidden',
      search: '',
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
      search: '',
    })
  })

  test('keeps the query string in search', () => {
    const uri =
      'postgresql://postgres:[YOUR-PASSWORD]@db.proj.supabase.co:5432/postgres?sslmode=require&sslnegotiation=direct'
    expect(parseConnectionParams(uri).search).toBe('?sslmode=require&sslnegotiation=direct')
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

describe('appendConnectionStringParams', () => {
  test('joins with ? when the URI has no query string', () => {
    expect(appendConnectionStringParams('postgresql://u@h:5432/db', 'pgbouncer=true')).toBe(
      'postgresql://u@h:5432/db?pgbouncer=true'
    )
  })

  test('joins with & when the URI already has a query string', () => {
    expect(
      appendConnectionStringParams('postgresql://u@h:5432/db?sslmode=require', 'pgbouncer=true')
    ).toBe('postgresql://u@h:5432/db?sslmode=require&pgbouncer=true')
  })

  test('returns the URI unchanged for empty inputs', () => {
    expect(appendConnectionStringParams('', 'pgbouncer=true')).toBe('')
    expect(appendConnectionStringParams('postgresql://u@h:5432/db', '')).toBe(
      'postgresql://u@h:5432/db'
    )
  })
})

describe('buildPsqlCommand', () => {
  const params = {
    host: 'db.proj.supabase.co',
    port: '5432',
    user: 'postgres',
    database: 'postgres',
    search: '',
  }

  test('uses flag form when there is no query string', () => {
    expect(buildPsqlCommand(params)).toBe(
      'psql -h db.proj.supabase.co -p 5432 -d postgres -U postgres'
    )
  })

  test('falls back to the URI form when the query string must be carried', () => {
    expect(buildPsqlCommand({ ...params, search: '?sslmode=require&sslnegotiation=direct' })).toBe(
      'psql "postgresql://postgres@db.proj.supabase.co:5432/postgres?sslmode=require&sslnegotiation=direct"'
    )
  })
})

describe('buildJdbcString', () => {
  const params = {
    host: 'db.proj.supabase.co',
    port: '5432',
    user: 'postgres',
    database: 'postgres',
    search: '',
  }

  test('builds the base string without extra params', () => {
    expect(buildJdbcString(params)).toBe(
      `jdbc:postgresql://db.proj.supabase.co:5432/postgres?user=postgres&password=${PASSWORD_PLACEHOLDER}`
    )
  })

  test('appends the query string using pgJDBC casing for sslnegotiation', () => {
    expect(buildJdbcString({ ...params, search: '?sslmode=require&sslnegotiation=direct' })).toBe(
      `jdbc:postgresql://db.proj.supabase.co:5432/postgres?user=postgres&password=${PASSWORD_PLACEHOLDER}&sslmode=require&sslNegotiation=direct`
    )
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
        search: '',
      })
    ).toEqual([
      { key: 'host', value: 'h' },
      { key: 'port', value: '5432' },
      { key: 'database', value: 'd' },
      { key: 'user', value: 'u' },
    ])
  })
})

describe('applyTemporaryAccessToConnectionString', () => {
  test('rewrites a direct URI user and password placeholder', () => {
    const uri = `postgresql://postgres:${PASSWORD_PLACEHOLDER}@db.proj.supabase.co:5432/postgres?sslmode=require`

    expect(applyTemporaryAccessToConnectionString('', { role: 'analytics' })).toBe('')
    expect(applyTemporaryAccessToConnectionString(uri, { role: '' })).toBe(uri)
    expect(applyTemporaryAccessToConnectionString(uri, { role: 'analytics' })).toBe(
      `postgresql://analytics:${TOKEN_PASSWORD_PLACEHOLDER}@db.proj.supabase.co:5432/postgres?sslmode=require`
    )
  })

  test('appends jit on shared pooler URIs once', () => {
    const uri = `postgresql://postgres.projref:${PASSWORD_PLACEHOLDER}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`
    const withJit = applyTemporaryAccessToConnectionString(uri, {
      role: 'analytics',
      addPoolerJitOption: true,
    })

    expect(withJit).toBe(
      `postgresql://analytics.projref:${TOKEN_PASSWORD_PLACEHOLDER}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?options=-c%20jit%3dtrue`
    )
    expect(
      applyTemporaryAccessToConnectionString(withJit, {
        role: 'analytics',
        addPoolerJitOption: true,
      })
    ).toBe(withJit)
  })
})

describe('applyTemporaryAccessToPooler', () => {
  test('rewrites every URI slot and only adds jit on shared pooler strings', () => {
    const rewritten = applyTemporaryAccessToPooler(
      {
        transactionShared: `postgresql://postgres.proj:${PASSWORD_PLACEHOLDER}@pooler:6543/postgres`,
        sessionShared: `postgresql://postgres.proj:${PASSWORD_PLACEHOLDER}@pooler:5432/postgres`,
        transactionDedicated: `postgresql://postgres.proj:${PASSWORD_PLACEHOLDER}@dedicated:6543/postgres`,
        sessionDedicated: `postgresql://postgres:${PASSWORD_PLACEHOLDER}@db.host:5432/postgres`,
        ipv4SupportedForDedicatedPooler: true,
        direct: `postgresql://postgres:${PASSWORD_PLACEHOLDER}@db.host:5432/postgres`,
      },
      'analytics'
    )

    expect(rewritten.direct).toBe(
      `postgresql://analytics:${TOKEN_PASSWORD_PLACEHOLDER}@db.host:5432/postgres`
    )
    expect(rewritten.transactionShared).toContain('options=-c%20jit%3dtrue')
    expect(rewritten.sessionShared).toContain('options=-c%20jit%3dtrue')
    expect(rewritten.transactionDedicated).not.toContain('jit')
    expect(rewritten.sessionDedicated).not.toContain('jit')
  })
})

describe('shouldAddTemporaryAccessPoolerOption', () => {
  test('is true only for shared pooler connections', () => {
    expect(
      shouldAddTemporaryAccessPoolerOption({
        connectionMethod: 'direct',
        useSharedPooler: false,
        hasDedicatedPooler: true,
      })
    ).toBe(false)
    expect(
      shouldAddTemporaryAccessPoolerOption({
        connectionMethod: 'session',
        useSharedPooler: false,
        hasDedicatedPooler: true,
      })
    ).toBe(true)
    expect(
      shouldAddTemporaryAccessPoolerOption({
        connectionMethod: 'transaction',
        useSharedPooler: true,
        hasDedicatedPooler: true,
      })
    ).toBe(true)
    expect(
      shouldAddTemporaryAccessPoolerOption({
        connectionMethod: 'transaction',
        useSharedPooler: false,
        hasDedicatedPooler: true,
      })
    ).toBe(false)
    expect(
      shouldAddTemporaryAccessPoolerOption({
        connectionMethod: 'transaction',
        useSharedPooler: false,
        hasDedicatedPooler: false,
      })
    ).toBe(true)
  })
})
