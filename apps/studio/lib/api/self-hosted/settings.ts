import { components } from 'api-types'

import { AUTH_JWT_SECRET, POSTGRES_PORT } from './constants'
import { assertSelfHosted } from './util'
import {
  PROJECT_DB_HOST,
  PROJECT_DB_HOST_DIRECT,
  PROJECT_ENDPOINT,
  PROJECT_ENDPOINT_PROTOCOL,
} from '@/lib/constants/api'

type ProjectAppConfig = components['schemas']['ProjectSettingsResponse']['app_config'] & {
  protocol?: string
}

export type ProjectSettings = components['schemas']['ProjectSettingsResponse'] & {
  app_config?: ProjectAppConfig
  // Host advertised in the direct connection string. Distinct from `db_host`
  // (the public gateway host, where Supavisor is exposed): the operator can run
  // Postgres elsewhere (managed PG, a separate container) via POSTGRES_HOST.
  db_host_direct?: string
}

/**
 * Gets self-hosted project settings
 *
 * _Only call this from server-side self-hosted code._
 */
export function getProjectSettings() {
  assertSelfHosted()

  const response = {
    app_config: {
      db_schema: 'public',
      endpoint: PROJECT_ENDPOINT,
      storage_endpoint: PROJECT_ENDPOINT,
      // manually added to force the frontend to use the correct URL
      protocol: PROJECT_ENDPOINT_PROTOCOL,
    },
    cloud_provider: 'AWS',
    db_dns_name: '-',
    db_host: PROJECT_DB_HOST,
    db_host_direct: PROJECT_DB_HOST_DIRECT,
    db_ip_addr_config: 'legacy' as const,
    db_name: 'postgres',
    db_port: POSTGRES_PORT,
    db_user: 'postgres',
    inserted_at: '2021-08-02T06:40:40.646Z',
    jwt_secret: AUTH_JWT_SECRET,
    name: process.env.DEFAULT_PROJECT_NAME || 'Default Project',
    ref: 'default',
    region: 'local',
    service_api_keys: [
      {
        api_key: process.env.SUPABASE_ANON_KEY ?? '',
        name: 'anon key',
        tags: 'anon',
      },
      {
        api_key: process.env.SUPABASE_SERVICE_KEY ?? '',
        name: 'service_role key',
        tags: 'service_role',
      },
    ],
    ssl_enforced: false,
    status: 'ACTIVE_HEALTHY',
  } satisfies ProjectSettings

  return response
}
