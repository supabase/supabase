import {
  ApplyMigrationOptions,
  DatabaseOperations,
  ExecuteSqlOptions,
} from '@supabase/mcp-server-supabase/platform'
import { executeQuery } from './query'
import { applyAndTrackMigrations, listMigrationVersions } from './migrations'

export type GetDatabaseOperationsOptions = {
  headers?: HeadersInit
}

export function getDatabaseOperations({
  headers,
}: GetDatabaseOperationsOptions): DatabaseOperations {
  return {
    async executeSql<T>(_projectRef: string, options: ExecuteSqlOptions) {
      const { query } = options
      const response = await executeQuery({ query, headers })

      if (response.error) {
        const { code, message } = response.error
        throw new Error(`Error executing SQL: ${message} (code: ${code})`)
      }

      return response as T
    },
    async listMigrations() {
      const response = await listMigrationVersions({ headers })

      if (response.error) {
        const { code, message } = response.error
        throw new Error(`Error listing migrations: ${message} (code: ${code})`)
      }

      return response as any
    },
    async applyMigration<T>(_projectRef: string, options: ApplyMigrationOptions) {
      const { query, name } = options
      const response = await applyAndTrackMigrations({ query, name, headers })

      if (response.error) {
        const { code, message } = response.error
        throw new Error(`Error applying migration: ${message} (code: ${code})`)
      }

      return response as T
    },
  }
}
