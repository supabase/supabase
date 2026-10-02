import { Migration } from 'postgres-migrations/dist/types'
import { MigrationTransformer } from './transformer'

const CONCURRENT_INDEX_FIND = 'INDEX CONCURRENTLY'
const CONCURRENT_INDEX_REPLACE = 'INDEX'
const DISABLE_TRANSACTION_STRING = '-- postgres-migrations disable-transaction'

export class DisableConcurrentIndexTransformer implements MigrationTransformer {
  transform(migration: Migration): Migration {
    if (!migration.sql.includes(CONCURRENT_INDEX_FIND)) {
      return migration
    }

    return {
      ...migration,
      // strip concurrently, and remove disable-transaction in sql and contents
      sql: migration.sql
        .replaceAll(CONCURRENT_INDEX_FIND, CONCURRENT_INDEX_REPLACE)
        .replace(DISABLE_TRANSACTION_STRING, ''),
      contents: migration.contents
        .replaceAll(CONCURRENT_INDEX_FIND, CONCURRENT_INDEX_REPLACE)
        .replace(DISABLE_TRANSACTION_STRING, ''),
    }
  }
}
