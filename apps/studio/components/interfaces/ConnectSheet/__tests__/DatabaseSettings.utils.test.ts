import { describe, expect, test } from 'vitest'

import {
  buildConnectionStringPooler,
  getSelfHostedDirectStrings,
  getSelfHostedPoolerStrings,
} from '../DatabaseSettings.utils'
import type { DeploymentMode } from '@/hooks/misc/useDeploymentMode'

const platform: DeploymentMode = { isPlatform: true, isCli: false, isSelfHosted: false }
const cli: DeploymentMode = { isPlatform: false, isCli: true, isSelfHosted: false }
const selfHosted: DeploymentMode = { isPlatform: false, isCli: false, isSelfHosted: true }

// Minimal ConnectionStrings stub — only `uri` matters for buildConnectionStringPooler.
const makeStrings = (poolerUri: string, directUri: string) =>
  ({
    direct: {
      uri: directUri,
      psql: '',
      golang: '',
      jdbc: '',
      dotnet: '',
      nodejs: '',
      php: '',
      python: '',
      sqlalchemy: '',
    },
    pooler: {
      uri: poolerUri,
      psql: '',
      golang: '',
      jdbc: '',
      dotnet: '',
      nodejs: '',
      php: '',
      python: '',
      sqlalchemy: '',
    },
  }) as any

describe('getSelfHostedPoolerStrings', () => {
  test('uses POOLER_TENANT_ID and YOUR-PASSWORD placeholders', () => {
    const strings = getSelfHostedPoolerStrings('db.example.com', 6543)
    expect(strings.uri).toBe(
      'postgresql://postgres.[POOLER_TENANT_ID]:[YOUR-PASSWORD]@db.example.com:6543/postgres'
    )
  })

  test('threads host, port, and database name through every format', () => {
    const strings = getSelfHostedPoolerStrings('db.example.com', 5432, 'mydb')
    expect(strings.uri).toContain('db.example.com:5432/mydb')
    expect(strings.psql).toContain('db.example.com:5432/mydb')
    expect(strings.jdbc).toContain('db.example.com:5432/mydb')
    expect(strings.golang).toContain('host=db.example.com')
    expect(strings.golang).toContain('port=5432')
    expect(strings.golang).toContain('dbname=mydb')
    expect(strings.dotnet).toContain('Server=db.example.com')
    expect(strings.dotnet).toContain('Port=5432')
    expect(strings.dotnet).toContain('Database=mydb')
    expect(strings.nodejs).toBe(`DATABASE_URL=${strings.uri}`)
  })

  test('defaults database name to postgres', () => {
    const strings = getSelfHostedPoolerStrings('db.example.com', 6543)
    expect(strings.uri.endsWith('/postgres')).toBe(true)
  })
})

describe('getSelfHostedDirectStrings', () => {
  test('uses plain postgres user (no tenant id)', () => {
    const strings = getSelfHostedDirectStrings('db.example.com', 5432)
    expect(strings.uri).toBe('postgresql://postgres:[YOUR-PASSWORD]@db.example.com:5432/postgres')
  })

  test('threads host, port, and database name through every format', () => {
    const strings = getSelfHostedDirectStrings('db.example.com', 5432, 'mydb')
    expect(strings.uri).toContain('postgres:[YOUR-PASSWORD]@db.example.com:5432/mydb')
    expect(strings.jdbc).toContain('db.example.com:5432/mydb')
    expect(strings.golang).toContain('user=postgres\n')
    expect(strings.dotnet).toContain('User Id=postgres;')
  })
})

describe('buildConnectionStringPooler', () => {
  const sharedPlatform = makeStrings(
    'postgresql://postgres.proj:[YOUR-PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres',
    'postgresql://postgres:[YOUR-PASSWORD]@db.proj.supabase.co:5432/postgres'
  )
  const dedicatedPlatform = makeStrings(
    'postgresql://dedicated.proj:[YOUR-PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres',
    ''
  )
  const connectionInfo = { db_host: 'db.example.com', db_port: 5432 }

  test('platform: returns shared + dedicated pooler bag and direct URI', () => {
    const result = buildConnectionStringPooler({
      deploymentMode: platform,
      connectionInfo,
      connectionStringsShared: sharedPlatform,
      connectionStringsDedicated: dedicatedPlatform,
      ipv4Addon: true,
    })

    expect(result.transactionShared).toBe(sharedPlatform.pooler.uri)
    expect(result.sessionShared).toBe(sharedPlatform.pooler.uri.replace('6543', '5432'))
    expect(result.transactionDedicated).toBe(dedicatedPlatform.pooler.uri)
    expect(result.sessionDedicated).toBe(dedicatedPlatform.pooler.uri.replace('6543', '5432'))
    expect(result.ipv4SupportedForDedicatedPooler).toBe(true)
    expect(result.direct).toBe(sharedPlatform.direct.uri)
  })

  test('platform without IPv4 addon flips ipv4SupportedForDedicatedPooler', () => {
    const result = buildConnectionStringPooler({
      deploymentMode: platform,
      connectionInfo,
      connectionStringsShared: sharedPlatform,
      ipv4Addon: false,
    })
    expect(result.ipv4SupportedForDedicatedPooler).toBe(false)
    expect(result.transactionDedicated).toBeUndefined()
    expect(result.sessionDedicated).toBeUndefined()
  })

  test('CLI: collapses pooler URIs to the direct URI (no pooler in CLI)', () => {
    const directUri = sharedPlatform.direct.uri
    const result = buildConnectionStringPooler({
      deploymentMode: cli,
      connectionInfo,
      connectionStringsShared: sharedPlatform,
      ipv4Addon: false,
    })

    expect(result.direct).toBe(directUri)
    expect(result.transactionShared).toBe(directUri)
    expect(result.sessionShared).toBe(directUri)
    expect(result.transactionDedicated).toBeUndefined()
    expect(result.sessionDedicated).toBeUndefined()
    expect(result.ipv4SupportedForDedicatedPooler).toBe(false)
  })

  test('self-hosted: uses Supavisor placeholders on 6543/dbPort, direct on dbPort', () => {
    const result = buildConnectionStringPooler({
      deploymentMode: selfHosted,
      connectionInfo: { db_host: 'supabase.example.com', db_port: 5432 },
      connectionStringsShared: sharedPlatform,
      ipv4Addon: true,
    })

    expect(result.transactionShared).toBe(
      'postgresql://postgres.[POOLER_TENANT_ID]:[YOUR-PASSWORD]@supabase.example.com:6543/postgres'
    )
    expect(result.sessionShared).toBe(
      'postgresql://postgres.[POOLER_TENANT_ID]:[YOUR-PASSWORD]@supabase.example.com:5432/postgres'
    )
    expect(result.direct).toBe(
      'postgresql://postgres:[YOUR-PASSWORD]@supabase.example.com:5432/postgres'
    )
    expect(result.transactionDedicated).toBeUndefined()
    expect(result.sessionDedicated).toBeUndefined()
    // ipv4Addon=true must NOT leak into self-hosted: there's no dedicated pooler here
    expect(result.ipv4SupportedForDedicatedPooler).toBe(false)
  })

  test('self-hosted: falls back to port 5432 when db_port is unset', () => {
    const result = buildConnectionStringPooler({
      deploymentMode: selfHosted,
      connectionInfo: { db_host: 'supabase.example.com', db_port: 0 },
      connectionStringsShared: sharedPlatform,
      ipv4Addon: false,
    })
    expect(result.sessionShared).toContain(':5432/postgres')
    expect(result.direct).toContain(':5432/postgres')
  })
})
