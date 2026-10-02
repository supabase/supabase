import { DBMigration } from './types'

type MigrationName = keyof typeof DBMigration

interface MigrationResetFloor {
  migration: MigrationName
  activatedBy: MigrationName
  schemaCheck: string
  errorMessage: string
}

export const MIGRATION_RESET_FLOORS = [
  {
    // Replaying storage-schema would recreate the legacy unique bucket/name index.
    migration: 'storage-schema',
    activatedBy: 'drop-bucketid-objname-index',
    // 0002 creates both. A table without its index means replay would recreate uniqueness.
    schemaCheck: `
      SELECT (
        to_regclass('storage.objects') IS NOT NULL
        AND to_regclass('storage.bucketid_objname') IS NULL
      ) AS reset_floor_active
    `,
    errorMessage:
      'Cannot replay storage-schema: storage.objects exists without the legacy bucketid_objname index; use markCompletedTillMigration to skip it',
  },
] as const satisfies readonly MigrationResetFloor[]
