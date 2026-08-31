import {
  ApiKey,
  ApiKeyType,
  ApplyMigrationOptions,
  DatabaseOperations,
  DebuggingOperations,
  DevelopmentOperations,
  ExecuteSqlOptions,
  QueryLogsOptions,
} from '@supabase/mcp-server-supabase/platform'
import { isFeatureEnabled, type Feature } from 'common/enabled-features'
import { getEnabledFeaturesOverrideDisabledList } from 'common/enabled-features/overrides'

import { DEFAULT_EXPOSED_SCHEMAS } from './constants'
import { generateTypescriptTypes } from './generate-types'
import { getLints } from './lints'
import { retrieveAnalyticsData } from './logs'
import { applyAndTrackMigrations, listMigrationVersions } from './migrations'
import { executeQuery } from './query'
import { getProjectSettings } from './settings'
import { ResponseError } from '@/types'

export type GetDatabaseOperationsOptions = {
  headers?: HeadersInit
}

export type GetDevelopmentOperationsOptions = {
  headers?: HeadersInit
}

export type GetDebuggingOperationsOptions = {
  headers?: HeadersInit
}

export function getDatabaseOperations({
  headers,
}: GetDatabaseOperationsOptions): DatabaseOperations {
  return {
    async executeSql<T>(_projectRef: string, options: ExecuteSqlOptions) {
      const { query, parameters, read_only: readOnly } = options

      const { data, error } = await executeQuery<T>({ query, parameters, headers, readOnly })

      if (error) {
        throw error
      }

      return data
    },
    async listMigrations() {
      const { data, error } = await listMigrationVersions({ headers })

      if (error) {
        throw error
      }

      return data
    },
    async applyMigration(_projectRef: string, options: ApplyMigrationOptions) {
      const { query, name } = options
      const { error } = await applyAndTrackMigrations({ query, name, headers })

      if (error) {
        throw error
      }
    },
  }
}

export function getDevelopmentOperations({
  headers,
}: GetDevelopmentOperationsOptions): DevelopmentOperations {
  return {
    async getProjectUrl(_projectRef) {
      const settings = getProjectSettings()
      return `${settings.app_config.protocol}://${settings.app_config.endpoint}`
    },
    async getPublishableKeys(_projectRef) {
      if (process.env.SUPABASE_PUBLISHABLE_KEY) {
        const publishableKeysArray: ApiKey[] = [
          {
            api_key: process.env.SUPABASE_PUBLISHABLE_KEY,
            name: 'publishable',
            type: 'publishable' as ApiKeyType,
          },
        ]
        return publishableKeysArray
      }

      const settings = getProjectSettings()
      const anonKey = settings.service_api_keys.find((key) => key.name === 'anon key')

      if (!anonKey) {
        throw new Error('Anon key not found in project settings')
      }

      const publishableKeysArray: ApiKey[] = [
        {
          api_key: anonKey.api_key,
          name: anonKey.name,
          type: 'legacy' as ApiKeyType,
        },
      ]
      return publishableKeysArray
    },
    async generateTypescriptTypes(_projectRef) {
      const response = await generateTypescriptTypes({ headers })

      if (response instanceof ResponseError) {
        throw response
      }

      return response
    },
  }
}

// Logs are disabled by default for self-hosted; enabled via the
// `docker-compose.logs.yml` override, which sets ENABLED_FEATURES_LOGS_ALL=true.
function assertLogsEnabled() {
  const disabledFeatures = getEnabledFeaturesOverrideDisabledList(process.env) as Feature[]

  if (!isFeatureEnabled('logs:all', disabledFeatures)) {
    throw new Error(
      'Logs are disabled on this instance. Enable the `docker-compose.logs.yml` override to query logs.'
    )
  }
}

export function getDebuggingOperations({
  headers,
}: GetDebuggingOperationsOptions): DebuggingOperations {
  return {
    // Self-hosted logs are served by Logflare, which speaks BigQuery SQL.
    logsDialect: 'bigquery',
    // `query_logs` replaces `get_logs` on self-hosted. Declaring `queryLogs`
    // makes the MCP server hide `get_logs` from clients (see `getDebuggingTools`
    // in @supabase/mcp-server-supabase), so this method is never reached over
    // MCP. The `DebuggingOperations` interface still requires it, so it throws
    // defensively rather than serving logs.
    async getLogs() {
      throw new Error('get_logs is not supported on self-hosted; use query_logs instead.')
    },
    async queryLogs(projectRef: string, options: QueryLogsOptions) {
      assertLogsEnabled()

      // Pass the model's SQL straight through to the Logflare `logs.all`
      // endpoint, which accepts an arbitrary `sql` param.
      const { data, error } = await retrieveAnalyticsData({
        name: 'logs.all',
        projectRef,
        params: {
          sql: options.sql,
          iso_timestamp_start: options.iso_timestamp_start,
          iso_timestamp_end: options.iso_timestamp_end,
        },
      })

      if (error) {
        throw error
      }

      return data
    },
    async getSecurityAdvisors(_projectRef) {
      const { data, error } = await getLints({
        headers,
        exposedSchemas: DEFAULT_EXPOSED_SCHEMAS,
      })

      if (error) {
        throw error
      }

      return data.filter((lint) => lint.categories.includes('SECURITY'))
    },
    async getPerformanceAdvisors(_projectRef) {
      const { data, error } = await getLints({
        headers,
        exposedSchemas: DEFAULT_EXPOSED_SCHEMAS,
      })

      if (error) {
        throw error
      }

      return data.filter((lint) => lint.categories.includes('PERFORMANCE'))
    },
  }
}
