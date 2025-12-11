import {
  ApiKey,
  ApiKeyType,
  ApplyMigrationOptions,
  DatabaseOperations,
  DebuggingOperations,
  DevelopmentOperations,
  ExecuteSqlOptions,
  GetLogsOptions,
} from '@supabase/mcp-server-supabase/platform'
import { ResponseError } from 'types'
import { generateTypescriptTypes } from './generate-types'
import { getLints } from './lints'
import { getLogQuery, retrieveAnalyticsData } from './logs'
import { applyAndTrackMigrations, listMigrationVersions } from './migrations'
import { executeQuery } from './query'
import { getProjectSettings } from './settings'

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
      const settings = getProjectSettings()
      const anonKey = settings.service_api_keys.find((key) => key.name === 'anon key')

      if (!anonKey) {
        throw new Error('Anon key not found in project settings')
      }

      // For self-hosted, only the legacy anon key is available and returned here.
      // There is currently no publishable key variable in self-hosted configuration,
      // and the migration to new publishable keys requires additional Auth and service setup.
      const publishableKeysArray: ApiKey[] = [
        {
          api_key: anonKey.api_key,
          name: anonKey.name,
          type: 'anon' as ApiKeyType,
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

export function getDebuggingOperations({
  headers,
}: GetDebuggingOperationsOptions): DebuggingOperations {
  return {
    async getLogs(projectRef: string, options: GetLogsOptions) {
      const sql = getLogQuery(options.service)

      const { data, error } = await retrieveAnalyticsData({
        name: 'logs.all',
        projectRef,
        params: {
          sql,
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
      const { data, error } = await getLints({ headers })

      if (error) {
        throw error
      }

      return data.filter((lint) => lint.categories.includes('SECURITY'))
    },
    async getPerformanceAdvisors(_projectRef) {
      const { data, error } = await getLints({ headers })

      if (error) {
        throw error
      }

      return data.filter((lint) => lint.categories.includes('PERFORMANCE'))
    },
  }
}
