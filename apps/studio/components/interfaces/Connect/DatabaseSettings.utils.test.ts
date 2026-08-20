import { describe, expect, test } from 'vitest'

import { getConnectionStrings } from './DatabaseSettings.utils'

const baseConnectionInfo = {
  db_user: 'postgres',
  db_port: 5432,
  db_host: 'gateway.example.com',
  db_name: 'postgres',
}

const noPooler = { connectionString: '', db_user: '', db_port: 0, db_host: '', db_name: '' }

describe('getConnectionStrings — direct host resolution', () => {
  test('uses db_host_direct for direct strings when provided', () => {
    const { direct } = getConnectionStrings({
      connectionInfo: { ...baseConnectionInfo, db_host_direct: 'mydb.internal' },
      poolingInfo: noPooler,
      metadata: {},
    })

    expect(direct.uri).toBe('postgresql://postgres:[YOUR-PASSWORD]@mydb.internal:5432/postgres')
    expect(direct.psql).toContain('-h mydb.internal')
    expect(direct.jdbc).toContain('mydb.internal:5432')
    // The gateway host must not leak into any direct string
    expect(direct.uri).not.toContain('gateway.example.com')
  })

  test('falls back to db_host when db_host_direct is unset', () => {
    const { direct } = getConnectionStrings({
      connectionInfo: baseConnectionInfo,
      poolingInfo: noPooler,
      metadata: {},
    })

    expect(direct.uri).toBe(
      'postgresql://postgres:[YOUR-PASSWORD]@gateway.example.com:5432/postgres'
    )
    expect(direct.psql).toContain('-h gateway.example.com')
  })
})
