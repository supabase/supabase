import { DBMigration } from './types'

export function isDBMigrationName(value: unknown): value is keyof typeof DBMigration {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(DBMigration, value)
}
