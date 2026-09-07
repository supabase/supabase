import { components } from 'api-types'

import { AUTH_JWT_SECRET, POSTGRES_PORT } from './constants'
import { assertSelfHosted } from './util'
import { getDatabaseByRef, getEnvValue } from './registry'
import { PROJECT_DB_HOST, PROJECT_ENDPOINT, PROJECT_ENDPOINT_PROTOCOL } from '@/lib/constants/api'

type ProjectAppConfig = components['schemas']['ProjectSettingsResponse']['app_config'] & {
  protocol?: string
}

export type ProjectSettings = components['schemas']['ProjectSettingsResponse'] & {
  app_config?: ProjectAppConfig
  db_password?: string
  anon_key?: string
  service_key?: string
}

/**
 * Gets self-hosted project settings.
 *
 * When `ref` is provided and matches a registry entry the per-database
 * credentials are resolved from the registry. When `ref` is omitted it
 * resolves the 'default' registry entry if present. Falls back to the
 * env-var-based single-database config when the ref is not found.
 *
 * _Only call this from server-side self-hosted code._
 */
export function getProjectSettings(ref?: string): ProjectSettings {
  assertSelfHosted()

  // Resolve the target ref — no ref means default
  const targetRef = ref ?? 'default'
  const db = getDatabaseByRef(targetRef)

  if (db) {
    const anonKey = db.anon_key_env ? getEnvValue(db.anon_key_env) : ''
    const serviceKey = db.service_key_env ? getEnvValue(db.service_key_env) : ''

    return {
      app_config: {
        db_schema: 'public',
        endpoint: PROJECT_ENDPOINT,
        storage_endpoint: PROJECT_ENDPOINT,
        protocol: PROJECT_ENDPOINT_PROTOCOL,
      },
      cloud_provider: 'AWS',
      db_dns_name: '-',
      db_host: db.host,
      db_ip_addr_config: 'legacy',
      db_name: db.database,
      db_port: db.port,
      db_user: 'postgres',
      db_password: getEnvValue(db.password_env),
      anon_key: anonKey,
      service_key: serviceKey,
      inserted_at: db.created_at ?? '2021-08-02T06:40:40.646Z',
      jwt_secret: getEnvValue(db.jwt_secret_env),
      name: db.name,
      ref: db.ref,
      region: 'local',
      service_api_keys: [
        { api_key: anonKey, name: 'anon key', tags: 'anon' },
        { api_key: serviceKey, name: 'service_role key', tags: 'service_role' },
      ],
      ssl_enforced: false,
      status: 'ACTIVE_HEALTHY',
    }
  }

  // Fallback: env-var-based single-database config (original behaviour)
  const dbHost = process.env.POSTGRES_HOST ?? PROJECT_DB_HOST
  const dbPort = POSTGRES_PORT
  const dbPassword = process.env.POSTGRES_PASSWORD ?? ''
  const anonKey = process.env.SUPABASE_ANON_KEY ?? ''
  const serviceKey = process.env.SUPABASE_SERVICE_KEY ?? ''

  return {
    app_config: {
      db_schema: 'public',
      endpoint: PROJECT_ENDPOINT,
      storage_endpoint: PROJECT_ENDPOINT,
      protocol: PROJECT_ENDPOINT_PROTOCOL,
    },
    cloud_provider: 'AWS',
    db_dns_name: '-',
    db_host: dbHost,
    db_ip_addr_config: 'legacy',
    db_name: process.env.POSTGRES_DB ?? 'postgres',
    db_port: dbPort,
    db_user: 'postgres',
    db_password: dbPassword,
    anon_key: anonKey,
    service_key: serviceKey,
    inserted_at: '2021-08-02T06:40:40.646Z',
    jwt_secret: AUTH_JWT_SECRET,
    name: process.env.DEFAULT_PROJECT_NAME || 'Default Project',
    ref: 'default',
    region: 'local',
    service_api_keys: [
      { api_key: anonKey, name: 'anon key', tags: 'anon' },
      { api_key: serviceKey, name: 'service_role key', tags: 'service_role' },
    ],
    ssl_enforced: false,
    status: 'ACTIVE_HEALTHY',
  }
}
