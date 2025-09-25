import {
  ApplyMigrationOptions,
  DatabaseOperations,
  DevelopmentOperations,
  ExecuteSqlOptions,
  GenerateTypescriptTypesResult,
} from '@supabase/mcp-server-supabase/platform'
import { applyAndTrackMigrations, listMigrationVersions } from './migrations'
import { executeQuery } from './query'

export type GetDatabaseOperationsOptions = {
  headers?: HeadersInit
}

export function getDatabaseOperations({
  headers,
}: GetDatabaseOperationsOptions): DatabaseOperations {
  return {
    async executeSql<T>(_projectRef: string, options: ExecuteSqlOptions) {
      const { query } = options
      const { data, error } = await executeQuery<T>({ query, headers })

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

export function getDevelopmentOperations(): DevelopmentOperations {
  return {
    getProjectUrl: function (_projectRef) {
      throw new Error('Function not implemented.')
    },
    getAnonKey: function (_projectRef) {
      throw new Error('Function not implemented.')
    },
    generateTypescriptTypes: function (_projectRef) {
      throw new Error('Function not implemented.')
    },
  }
}
