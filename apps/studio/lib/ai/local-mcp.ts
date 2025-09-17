import {
  ApplyMigrationOptions,
  DatabaseOperations,
  ExecuteSqlOptions,
} from '@supabase/mcp-server-supabase/platform'
import { fetchPost } from 'data/fetchers'
import { constructHeaders } from 'lib/api/apiHelpers'
import { PG_META_URL } from 'lib/constants/index'
import { NextApiRequest } from 'next'

export function getDatabaseOperations(req: NextApiRequest): DatabaseOperations {
  return {
    async executeSql<T>(_projectRef: string, options: ExecuteSqlOptions) {
      const { query } = options
      const headers = constructHeaders(req.headers)
      const response = await fetchPost(`${PG_META_URL}/query`, { query }, { headers })

      if (response.error) {
        const { code, message } = response.error
        throw new Error(`Error executing SQL: ${message} (code: ${code})`)
      }

      return response as T
    },
    async listMigrations(projectId: string) {
      throw new Error('Method not implemented.')
    },
    async applyMigration<T>(projectId: string, options: ApplyMigrationOptions) {
      throw new Error('Method not implemented.')
    },
  }
}
