import {
  ApplyMigrationOptions,
  DatabaseOperations,
  DevelopmentOperations,
  ExecuteSqlOptions,
} from '@supabase/mcp-server-supabase/platform'
import { applyAndTrackMigrations, listMigrationVersions } from './migrations'
import { executeQuery } from './query'
import { getProjectSettings } from './settings'
import { generateTypescriptTypes } from './generate-types'
import { ResponseError } from 'types'

export type GetDatabaseOperationsOptions = {
  headers?: HeadersInit
}

export type GetDevelopmentOperationsOptions = {
  headers?: HeadersInit
}

export function getDatabaseOperations({
  headers,
}: GetDatabaseOperationsOptions): DatabaseOperations {
  return {
    async executeSql<T>(_projectRef: string, options: ExecuteSqlOptions) {
      const { query, read_only: readOnly } = options
      const { data, error } = await executeQuery<T>({ query, headers, readOnly })

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
    async getAnonKey(_projectRef) {
      const settings = getProjectSettings()
      const anonKey = settings.service_api_keys.find((key) => key.name === 'anon key')

      if (!anonKey) {
        throw new Error('Anon key not found in project settings')
      }

      return anonKey.api_key
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
