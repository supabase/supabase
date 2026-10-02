import { Migration } from 'postgres-migrations/dist/types'

export interface MigrationTransformer {
  transform(input: Migration): Migration
}
