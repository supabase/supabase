import { QueryResultRow } from 'pg'
import type { DatabaseExecutor } from './connection'
import { quoteIdentifier } from './postgres/sql'
import { TenantCursorRow } from './tenant-store-pg'

export const MIGRATION_ADMIN_JOB_LIMIT = 2000

export class MigrationAdminStorePg {
  private readonly jobTable: string

  constructor(
    private db: DatabaseExecutor,
    pgBossSchema: string
  ) {
    this.jobTable = `${quoteIdentifier(pgBossSchema)}.job`
  }

  async listActiveJobs(queueName: string, limit: number): Promise<QueryResultRow[]> {
    const result = await this.query({
      text: `
        SELECT *
        FROM ${this.jobTable}
        WHERE state = 'active'
          AND name = $1
        ORDER BY created_on DESC
        LIMIT $2
      `,
      values: [queueName, limit],
    })

    return result.rows
  }

  async completeActiveJobs(queueName: string, limit: number): Promise<number> {
    const result = await this.query({
      text: `
        WITH jobs_to_update AS (
          SELECT id
          FROM ${this.jobTable}
          WHERE state = 'active'
            AND name = $1
          ORDER BY created_on DESC
          LIMIT $2
        )
        UPDATE ${this.jobTable} AS job
        SET state = 'completed'
        FROM jobs_to_update
        WHERE job.id = jobs_to_update.id
          AND job.state = 'active'
      `,
      values: [queueName, limit],
    })

    return result.rowCount || 0
  }

  async listTenantJobs(
    tenantId: string,
    queueName: string,
    limit: number
  ): Promise<QueryResultRow[]> {
    const result = await this.query({
      text: `
        SELECT *
        FROM ${this.jobTable}
        WHERE data->'tenant'->>'ref' = $1
          AND name = $2
        ORDER BY created_on DESC
        LIMIT $3
      `,
      values: [tenantId, queueName, limit],
    })

    return result.rows
  }

  async deleteTenantJobs(tenantId: string, queueName: string, limit: number): Promise<number> {
    const result = await this.query({
      text: `
        WITH jobs_to_delete AS (
          SELECT id
          FROM ${this.jobTable}
          WHERE data->'tenant'->>'ref' = $1
            AND name = $2
          ORDER BY created_on DESC
          LIMIT $3
        )
        DELETE FROM ${this.jobTable} AS job
        USING jobs_to_delete
        WHERE job.id = jobs_to_delete.id
      `,
      values: [tenantId, queueName, limit],
    })

    return result.rowCount || 0
  }

  async listFailedTenants(offset: number, limit: number): Promise<TenantCursorRow[]> {
    const result = await this.query<TenantCursorRow>({
      text: `
        SELECT id, cursor_id
        FROM tenants
        WHERE migrations_status = 'FAILED'
          AND cursor_id > $1
        ORDER BY cursor_id ASC
        LIMIT $2
      `,
      values: [offset, limit],
    })

    return result.rows
  }

  private query<T extends QueryResultRow = QueryResultRow>(
    statement: Parameters<DatabaseExecutor['query']>[0]
  ) {
    return this.db.query<T>(statement)
  }
}
