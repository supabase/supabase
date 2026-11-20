import { describe, expect, it } from 'vitest'

import {
  buildDirectPostgresConnectionUri,
  buildLogicalBackupShellScript,
  DB_PASSWORD_PLACEHOLDER,
} from '../../components/layouts/ProjectLayout/LogicalBackupCliInstructions.utils'

describe('buildDirectPostgresConnectionUri', () => {
  it('builds a valid postgresql URI from settings', () => {
    const uri = buildDirectPostgresConnectionUri({
      db_user: 'postgres',
      db_host: 'db.abcdef.supabase.co',
      db_port: 5432,
      db_name: 'postgres',
    })
    expect(uri).toBe(
      `postgresql://postgres:${DB_PASSWORD_PLACEHOLDER}@db.abcdef.supabase.co:5432/postgres`
    )
  })

  it('includes a non-default port', () => {
    const uri = buildDirectPostgresConnectionUri({
      db_user: 'postgres',
      db_host: 'db.abcdef.supabase.co',
      db_port: 6543,
      db_name: 'postgres',
    })
    expect(uri).toContain(':6543/')
  })
})

describe('buildLogicalBackupShellScript', () => {
  const testUri = `postgresql://postgres:${DB_PASSWORD_PLACEHOLDER}@db.abcdef.supabase.co:5432/postgres`

  it('wraps the connection URI in single quotes to prevent shell expansion', () => {
    const script = buildLogicalBackupShellScript(testUri)
    for (const line of script.split('\n')) {
      expect(line).toContain(`'${testUri}'`)
    }
  })

  it('dumps roles, schema, and data in that order as three commands', () => {
    const lines = buildLogicalBackupShellScript(testUri).split('\n')
    expect(lines).toHaveLength(3)
    const [roles, schema, data] = lines
    expect(roles).toContain('--role-only')
    expect(roles).toContain('-f roles.sql')
    expect(schema).toContain('-f schema.sql')
    expect(data).toContain('--data-only')
    expect(data).toContain('-f data.sql')
  })

  it('excludes storage vector tables from the data dump', () => {
    const [, , data] = buildLogicalBackupShellScript(testUri).split('\n')
    expect(data).toContain('-x "storage.buckets_vectors"')
    expect(data).toContain('-x "storage.vector_indexes"')
  })

  it('does not include npx supabase login', () => {
    const script = buildLogicalBackupShellScript(testUri)
    expect(script).not.toContain('supabase login')
  })
})
