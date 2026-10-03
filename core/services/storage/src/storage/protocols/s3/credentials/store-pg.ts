import type { DatabaseExecutor } from '@internal/database'
import { getConfig } from '../../../../config'
import {
  S3Credentials,
  S3CredentialsManagerStore,
  S3CredentialsRaw,
  S3CredentialWithDescription,
} from './store'

const { multitenantDatabaseQueryTimeout } = getConfig()

export class S3CredentialsManagerStorePg implements S3CredentialsManagerStore {
  constructor(private db: DatabaseExecutor) {}

  async insert(tenantId: string, credential: S3CredentialWithDescription): Promise<string> {
    const credentials = await this.db.query<{ id: string }>(
      {
        text: `
          INSERT INTO tenants_s3_credentials (
            tenant_id,
            description,
            access_key,
            secret_key,
            claims
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `,
        values: [
          tenantId,
          credential.description,
          credential.accessKey,
          credential.secretKey,
          JSON.stringify(credential.claims),
        ],
      },
      { signal: AbortSignal.timeout(multitenantDatabaseQueryTimeout) }
    )

    return credentials.rows[0].id
  }

  async list(tenantId: string): Promise<S3CredentialsRaw[]> {
    const credentials = await this.db.query<S3CredentialsRaw>(
      {
        text: `
          SELECT id, description, access_key, created_at
          FROM tenants_s3_credentials
          WHERE tenant_id = $1
          ORDER BY created_at ASC
        `,
        values: [tenantId],
      },
      { signal: AbortSignal.timeout(multitenantDatabaseQueryTimeout) }
    )

    return credentials.rows
  }

  async getOneByAccessKey(tenantId: string, accessKey: string): Promise<S3Credentials> {
    const credentials = await this.db.query<S3Credentials>(
      {
        text: `
          SELECT
            access_key AS "accessKey",
            secret_key AS "secretKey",
            claims
          FROM tenants_s3_credentials
          WHERE tenant_id = $1
            AND access_key = $2
          LIMIT 1
        `,
        values: [tenantId, accessKey],
      },
      { signal: AbortSignal.timeout(multitenantDatabaseQueryTimeout) }
    )

    return credentials.rows[0]
  }

  async count(tenantId: string): Promise<number> {
    const result = await this.db.query<{ count: number }>(
      {
        text: `
          SELECT COUNT(id)::int AS count
          FROM tenants_s3_credentials
          WHERE tenant_id = $1
        `,
        values: [tenantId],
      },
      { signal: AbortSignal.timeout(multitenantDatabaseQueryTimeout) }
    )

    return result.rows[0]?.count || 0
  }

  async delete(tenantId: string, credentialId: string): Promise<number> {
    const result = await this.db.query(
      {
        text: `
          DELETE FROM tenants_s3_credentials
          WHERE tenant_id = $1
            AND id = $2
        `,
        values: [tenantId, credentialId],
      },
      { signal: AbortSignal.timeout(multitenantDatabaseQueryTimeout) }
    )

    return result.rowCount || 0
  }
}
