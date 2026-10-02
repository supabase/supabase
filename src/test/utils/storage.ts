import { CreateBucketCommand, HeadBucketCommand, S3Client } from '@aws-sdk/client-s3'
import {
  type DatabaseTransaction,
  type DatabaseTransactionalExecutor,
  getPostgresConnection,
  getServiceKeyUser,
  isDatabaseTransaction,
  type TenantConnection,
} from '@internal/database'
import { runMigrationsOnTenant } from '@internal/database/migrations'
import { isS3Error } from '@internal/errors'
import { createStorageBackend, StorageBackendAdapter } from '@storage/backend'
import { Database, StoragePgDB } from '@storage/database'
import { StorageObjectLocator, TenantLocation } from '@storage/locator'
import { ObjectScanner } from '@storage/scanner/scanner'
import { Storage } from '@storage/storage'
import { Uploader } from '@storage/uploader'
import { getConfig } from '../../config'

const { databaseURL, tenantId, storageBackendType, storageS3Bucket } = getConfig()

/**
 * Helper function to execute raw database operations in tests with storage.allow_delete_query set
 * This is needed because raw queries bypass the normal connection scope setting
 */
export async function withDeleteEnabled<T>(
  db: DatabaseTransactionalExecutor | DatabaseTransaction,
  fn: (db: DatabaseTransaction) => Promise<T>
): Promise<T> {
  const existingTransaction = isDatabaseTransaction(db)
  const tnx = existingTransaction ? db : await db.beginTransaction()
  try {
    await tnx.query(`SELECT set_config('storage.allow_delete_query', 'true', true)`)
    const result = await fn(tnx)
    if (!existingTransaction) {
      await tnx.commit()
    }
    return result
  } catch (e) {
    if (!existingTransaction) {
      await tnx.rollback()
    }
    throw e
  }
}

export function useStorage(
  options: { ensureMigrations?: boolean; operation?: () => string | undefined } = {}
) {
  let connection: TenantConnection
  let storage: Storage
  let adapter: StorageBackendAdapter
  let database: Database
  let scanner: ObjectScanner
  let uploader: Uploader
  let location: StorageObjectLocator

  beforeAll(async () => {
    if (options.ensureMigrations !== false) {
      await runMigrationsOnTenant({
        databaseUrl: databaseURL!,
        tenantId,
        waitForLock: true,
      })
    }

    const adminUser = await getServiceKeyUser(tenantId)
    const connectionOptions = {
      tenantId,
      user: adminUser,
      superUser: adminUser,
      host: 'localhost',
      disableHostCheck: true,
      operation: options.operation,
    }
    connection = await getPostgresConnection(connectionOptions)

    const databaseOptions = {
      tenantId,
      host: 'localhost',
    }
    database = new StoragePgDB(connection, databaseOptions)
    location = new TenantLocation(storageS3Bucket)
    adapter = createStorageBackend(storageBackendType)
    storage = new Storage(adapter, database, location)
    scanner = new ObjectScanner(storage)
    uploader = new Uploader(adapter, database, location)
  })

  afterAll(async () => {
    connection.dispose()
  })

  return {
    get random() {
      return {
        name(prefix: string) {
          return `${prefix}_${Math.random().toString(36).substring(2, 15)}`
        },
      }
    },
    get storage() {
      return storage
    },
    get adapter() {
      return adapter
    },
    get database() {
      return database
    },
    get scanner() {
      return scanner
    },
    get uploader() {
      return uploader
    },
  }
}

export function createBucketIfNotExists(bucket: string, client: S3Client) {
  return checkBucketExists(client, bucket).then((exists) => {
    if (!exists) {
      return createS3Bucket(bucket, client)
    }
  })
}

export function createS3Bucket(bucketName: string, client: S3Client) {
  const createBucketCommand = new CreateBucketCommand({
    Bucket: bucketName,
  })

  return client.send(createBucketCommand)
}

export const checkBucketExists = async (client: S3Client, bucket: string) => {
  const options = {
    Bucket: bucket,
  }

  try {
    await client.send(new HeadBucketCommand(options))
    return true
  } catch (error) {
    const err = error as Error

    if (err && isS3Error(err) && err.$metadata.httpStatusCode === 404) {
      return false
    }
    throw error
  }
}
