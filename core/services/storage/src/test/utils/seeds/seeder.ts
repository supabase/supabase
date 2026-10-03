import { PgPersistence } from '@internal/testing/seeder'
import { Pool, PoolConfig } from 'pg'
import { BucketsSeeder } from './bucket'

export class TestUtils {
  private persistence: PgPersistence
  private bucketsSeeder: BucketsSeeder

  constructor(pgConfig: PoolConfig | string | Pool) {
    this.persistence = new PgPersistence(pgConfig)
    this.bucketsSeeder = new BucketsSeeder(this.persistence)
  }

  get buckets(): BucketsSeeder {
    return this.bucketsSeeder
  }

  /**
   * Runs the seeding operations:
   * 1. Executes the provided seeding function within a transaction.
   * 2. After seeding, performs batch inserts for all collected records.
   * @param operation - The seeding operations to execute.
   */
  async runSeeder(operation: () => Promise<void>): Promise<void> {
    await this.bucketsSeeder.runInTransaction(async () => {
      await operation()
    })
    await this.bucketsSeeder.batchInsertAll()
  }

  /**
   * Destroys the pg pool to close database connections.
   */
  async destroy(): Promise<void> {
    await this.persistence.destroy()
  }
}
