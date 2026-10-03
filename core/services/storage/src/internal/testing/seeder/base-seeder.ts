import { Persistence } from './persistence'

export abstract class Seeder {
  protected persistence: Persistence
  protected records: Map<string, object[]>

  constructor(persistence: Persistence) {
    this.persistence = persistence
    this.records = new Map()
  }

  /**
   * Retrieves all collected records.
   * @returns A map of table names to their respective records.
   */
  getAllRecords(): Map<string, object[]> {
    return this.records
  }

  /**
   * Runs the seeding operations within a transaction.
   * @param operation - The seeding operations to execute.
   */
  async runInTransaction(operation: () => Promise<void>): Promise<void> {
    try {
      await this.persistence.beginTransaction()
      await operation()
      await this.persistence.commitTransaction()
    } catch (error) {
      console.error('Error during seeding:', error)
      console.log('Rolling back transaction...')
      await this.persistence.rollbackTransaction()
      throw error
    }
  }

  /**
   * Performs batch inserts for all collected records.
   */
  async batchInsertAll(): Promise<void> {
    for (const [table, records] of this.records.entries()) {
      if (records.length > 0) {
        console.log(`Inserting ${records.length} records into ${table}...`)
        await this.persistence.insertBatch(table, records)
        console.log(`Inserted ${records.length} records into ${table}.`)
      }
    }
  }

  /**
   * Adds records to the internal collection for a specific table.
   * @param table - The table name.
   * @param records - The records to add.
   */
  protected addRecords<T extends object>(table: string, records: T[]): void {
    if (!this.records.has(table)) {
      this.records.set(table, [])
    }
    this.records.get(table)!.push(...records)
  }

  /**
   * Executes a raw SQL query.
   * @param query - The SQL query string.
   * @param bindings - Optional bindings for parameterized queries.
   * @returns The result of the query.
   */
  protected async rawQuery(query: string, bindings?: object[]): Promise<object> {
    return this.persistence.rawQuery(query, bindings)
  }

  /**
   * Generates a list of records based on count and a generator function.
   * Assigns UUIDs to each record.
   * @param count - Number of records to generate.
   * @param generator - Function to generate record data.
   * @returns An array of generated records with assigned IDs.
   */
  protected generateRecords<T extends { id?: string | null }>(
    count: number,
    generator: (n: number) => T
  ): T[] {
    return Array.from({ length: count }, (_, i) => ({
      ...generator(i + 1),
    }))
  }
}
