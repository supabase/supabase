import pg from 'pg'

import { decryptString, encryptString, isEncrypted, isSensitiveConfigKey } from './crypto.js'
import { env } from './env.js'

export const pool = new pg.Pool({ connectionString: env.databaseUrl })

export type ConfigValue = string | number | boolean | null

export type Queryable = Pick<pg.Pool, 'query'>

export async function withTransaction<T>(fn: (tx: Queryable) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('begin')
    const result = await fn(client)
    await client.query('commit')
    return result
  } catch (err) {
    await client.query('rollback')
    throw err
  } finally {
    client.release()
  }
}

export async function migrate(): Promise<void> {
  await pool.query(`
    create schema if not exists management;
    create table if not exists management.auth_config (
      key text primary key,
      value jsonb not null,
      updated_at timestamptz not null default now()
    );
    create table if not exists management.email_templates (
      template_type text primary key,
      source text not null,
      source_format text not null default 'html',
      rendered_html text not null,
      updated_at timestamptz not null default now()
    );
  `)
}

function serializeConfigValue(key: string, value: ConfigValue): string {
  return isSensitiveConfigKey(key)
    ? JSON.stringify(encryptString(JSON.stringify(value), key))
    : JSON.stringify(value)
}

function deserializeConfigValue(key: string, value: unknown): ConfigValue {
  if (isSensitiveConfigKey(key) && typeof value === 'string' && isEncrypted(value)) {
    return JSON.parse(decryptString(value, key))
  }
  return value as ConfigValue
}

export async function getAllConfig(db: Queryable = pool): Promise<Record<string, ConfigValue>> {
  const { rows } = await db.query('select key, value from management.auth_config')
  const out: Record<string, ConfigValue> = {}
  for (const row of rows) {
    out[row.key] = deserializeConfigValue(row.key, row.value)
  }
  return out
}

export async function upsertConfig(
  entries: Record<string, ConfigValue>,
  db?: Queryable
): Promise<void> {
  const keys = Object.keys(entries)
  if (keys.length === 0) return
  const run = async (tx: Queryable) => {
    for (const key of keys) {
      const value = entries[key]
      if (value === null) {
        await tx.query('delete from management.auth_config where key = $1', [key])
      } else {
        await tx.query(
          `insert into management.auth_config (key, value) values ($1, $2::jsonb)
           on conflict (key) do update set value = excluded.value, updated_at = now()`,
          [key, serializeConfigValue(key, value)]
        )
      }
    }
  }
  if (db) await run(db)
  else await withTransaction(run)
}

export async function deleteConfig(keys: string[], db: Queryable = pool): Promise<void> {
  if (keys.length === 0) return
  await db.query('delete from management.auth_config where key = any($1)', [keys])
}

export type EmailTemplate = {
  template_type: string
  source: string
  source_format: 'html' | 'react'
  rendered_html: string
}

export async function getEmailTemplate(
  templateType: string,
  db: Queryable = pool
): Promise<EmailTemplate | null> {
  const { rows } = await db.query(
    'select template_type, source, source_format, rendered_html from management.email_templates where template_type = $1',
    [templateType]
  )
  return rows[0] ?? null
}

export async function getAllEmailTemplates(db: Queryable = pool): Promise<EmailTemplate[]> {
  const { rows } = await db.query(
    'select template_type, source, source_format, rendered_html from management.email_templates'
  )
  return rows
}

export async function upsertEmailTemplate(
  template: EmailTemplate,
  db: Queryable = pool
): Promise<void> {
  await db.query(
    `insert into management.email_templates (template_type, source, source_format, rendered_html)
     values ($1, $2, $3, $4)
     on conflict (template_type) do update
       set source = excluded.source,
           source_format = excluded.source_format,
           rendered_html = excluded.rendered_html,
           updated_at = now()`,
    [template.template_type, template.source, template.source_format, template.rendered_html]
  )
}

export async function deleteEmailTemplate(
  templateType: string,
  db: Queryable = pool
): Promise<void> {
  await db.query('delete from management.email_templates where template_type = $1', [
    templateType,
  ])
}
