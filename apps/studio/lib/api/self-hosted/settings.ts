import { components } from 'api-types'
import { PROJECT_ENDPOINT, PROJECT_ENDPOINT_PROTOCOL } from 'lib/constants/api'
import { assertSelfHosted } from './util'

type ProjectAppConfig = components['schemas']['ProjectSettingsResponse']['app_config'] & {
  protocol?: string
}

export type ProjectSettings = components['schemas']['ProjectSettingsResponse'] & {
  app_config?: ProjectAppConfig
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
    db_host: 'localhost',
    db_ip_addr_config: 'legacy' as const,
    db_name: 'postgres',
    db_port: 5432,
    db_user: 'postgres',
    inserted_at: '2021-08-02T06:40:40.646Z',
    jwt_secret:
      process.env.AUTH_JWT_SECRET ?? 'super-secret-jwt-token-with-at-least-32-characters-long',
    name: process.env.DEFAULT_PROJECT_NAME || 'Default Project',
    ref: 'default',
    region: 'ap-southeast-1',
    service_api_keys: [
      {
        api_key: process.env.SUPABASE_SERVICE_KEY ?? '',
        name: 'service_role key',
        tags: 'service_role',
      },
      {
        api_key: process.env.SUPABASE_ANON_KEY ?? '',
        name: 'anon key',
        tags: 'anon',
      },
    ],
    ssl_enforced: false,
    status: 'ACTIVE_HEALTHY',
  } satisfies ProjectSettings

  return response
}
