import { DBMigration } from '@internal/database/migrations/types'
import { ERRORS } from '@internal/errors'
import { loadMigrationFiles } from 'postgres-migrations'
import { getConfig } from '../../../config'

const { dbMigrationFreezeAt } = getConfig()

const migrationFilesCache = new Map<string, ReturnType<typeof loadMigrationFiles>>()

export function loadMigrationFilesCached(directory: string) {
  let promise = migrationFilesCache.get(directory)

  if (!promise) {
    promise = loadMigrationFiles(directory).catch((error) => {
      migrationFilesCache.delete(directory)
      throw error
    })
    migrationFilesCache.set(directory, promise)
  }

  return promise
}

export const localMigrationFiles = () => loadMigrationFilesCached('./migrations/tenant')

export async function lastLocalMigrationName() {
  const migrations = await localMigrationFiles()
  const latestMigration = migrations.at(-1)

  if (!latestMigration) {
    throw ERRORS.InternalError(undefined, 'No local migrations found')
  }

  if (!dbMigrationFreezeAt) {
    return latestMigration.name as keyof typeof DBMigration
  }

  const frozenMigration = migrations.find((m) => m.name === dbMigrationFreezeAt)
  if (!frozenMigration) {
    throw ERRORS.InternalError(undefined, `Migration ${dbMigrationFreezeAt} not found`)
  }
  return frozenMigration.name as keyof typeof DBMigration
}
