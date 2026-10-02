import { randomUUID } from 'node:crypto'
import { describeAcceptance, getAcceptanceConfig } from '../support/config'
import { createRestClient } from '../support/http'
import { requireServiceKey, uniqueBucketName } from '../support/resources'

interface IcebergBucket {
  id: string
  name: string
}

interface IcebergNamespaceList {
  namespaces?: string[][]
}

interface IcebergTableList {
  identifiers?: Array<{
    name: string
    namespace: string[]
  }>
}

interface IcebergCatalogConfig {
  defaults?: {
    prefix?: string
  }
  overrides?: {
    prefix?: string
  }
}

interface IcebergNamespaceResponse {
  namespace?: string[]
  properties?: Record<string, unknown>
}

interface IcebergTableResponse {
  metadata?: Record<string, unknown>
  'metadata-location'?: string
}

interface IcebergErrorResponse {
  error?: {
    code?: number
    message?: string
    type?: string
  }
}

describeAcceptance(
  'Iceberg catalog contract',
  {
    destructive: true,
    profiles: ['full'],
    requires: ['iceberg'],
  },
  () => {
    it('covers analytics buckets, catalog config, namespaces, and table lifecycle', async () => {
      const client = createRestClient()
      const token = requireServiceKey(getAcceptanceConfig())
      const bucketName = uniqueBucketName('ice')
      const suffix = randomUUID().replace(/-/g, '').slice(0, 12)
      const namespaceName = `ns${suffix}`
      const tableName = `tbl${suffix}`
      const secondTableName = `tblb${suffix}`
      let namespaceCreated = false
      let tableCreated = false
      let secondTableCreated = false

      try {
        const createdBucket = await client.request<IcebergBucket>('POST', '/iceberg/bucket', {
          body: {
            name: bucketName,
          },
          expectedStatus: 200,
          token,
        })
        expect(createdBucket.json?.name).toBe(bucketName)

        const buckets = await client.request<IcebergBucket[]>(
          'GET',
          `/iceberg/bucket?search=${bucketName}`,
          {
            expectedStatus: 200,
            token,
          }
        )
        expect(buckets.json?.map((bucket) => bucket.name)).toContain(bucketName)

        const catalogConfig = await client.request<IcebergCatalogConfig>(
          'GET',
          `/iceberg/v1/config?warehouse=${bucketName}`,
          {
            expectedStatus: 200,
            token,
          }
        )
        expect(catalogConfig.json?.defaults?.prefix).toBe(bucketName)
        expect(catalogConfig.json?.overrides?.prefix).toBe(bucketName)

        const missingWarehouse = await client.request<IcebergErrorResponse>(
          'GET',
          `/iceberg/v1/${bucketName}-missing/namespaces/${namespaceName}/tables/${tableName}`,
          {
            expectedStatus: 404,
            token,
          }
        )
        expect(missingWarehouse.json).toMatchObject({
          error: {
            code: 404,
            type: 'NoSuchCatalog',
          },
        })

        const createdNamespace = await client.request<IcebergNamespaceResponse>(
          'POST',
          `/iceberg/v1/${bucketName}/namespaces`,
          {
            body: {
              namespace: namespaceName,
              properties: {
                stable: 'kept',
                overwrite: 'old',
              },
            },
            expectedStatus: 200,
            token,
          }
        )
        namespaceCreated = true
        expect(createdNamespace.json?.namespace).toEqual([namespaceName])

        const headNamespace = await client.request(
          'HEAD',
          `/iceberg/v1/${bucketName}/namespaces/${namespaceName}`,
          {
            expectedStatus: 204,
            token,
          }
        )
        expect(headNamespace.body).toBe('')

        const namespace = await client.request<IcebergNamespaceResponse>(
          'GET',
          `/iceberg/v1/${bucketName}/namespaces/${namespaceName}`,
          {
            expectedStatus: 200,
            token,
          }
        )
        expect(namespace.json?.namespace).toEqual([namespaceName])

        const namespaces = await client.request<IcebergNamespaceList>(
          'GET',
          `/iceberg/v1/${bucketName}/namespaces`,
          {
            expectedStatus: 200,
            token,
          }
        )
        expect(namespaces.json?.namespaces?.flat()).toContain(namespaceName)

        const createdTable = await client.request<IcebergTableResponse>(
          'POST',
          `/iceberg/v1/${bucketName}/namespaces/${namespaceName}/tables`,
          {
            body: createTablePayload(tableName),
            expectedStatus: 200,
            token,
          }
        )
        tableCreated = true
        expect(createdTable.json?.metadata).toBeTruthy()
        expect(createdTable.json?.['metadata-location']).toBeTruthy()

        const createdSecondTable = await client.request<IcebergTableResponse>(
          'POST',
          `/iceberg/v1/${bucketName}/namespaces/${namespaceName}/tables`,
          {
            body: createTablePayload(secondTableName),
            expectedStatus: 200,
            token,
          }
        )
        secondTableCreated = true
        expect(createdSecondTable.json?.metadata).toBeTruthy()
        expect(createdSecondTable.json?.['metadata-location']).toBeTruthy()

        const tables = await client.request<IcebergTableList>(
          'GET',
          `/iceberg/v1/${bucketName}/namespaces/${namespaceName}/tables`,
          {
            expectedStatus: 200,
            token,
          }
        )
        expect(tables.json?.identifiers?.map((table) => table.name)).toEqual(
          expect.arrayContaining([tableName, secondTableName])
        )

        const limitedTables = await client.request<IcebergTableList>(
          'GET',
          `/iceberg/v1/${bucketName}/namespaces/${namespaceName}/tables?pageSize=1`,
          {
            expectedStatus: 200,
            token,
          }
        )
        expect(limitedTables.json?.identifiers).toHaveLength(1)

        const table = await client.request<IcebergTableResponse>(
          'GET',
          `/iceberg/v1/${bucketName}/namespaces/${namespaceName}/tables/${tableName}`,
          {
            expectedStatus: 200,
            token,
          }
        )
        expect(table.json?.metadata).toBeTruthy()
        expect(table.json?.['metadata-location']).toBeTruthy()

        const headTable = await client.request(
          'HEAD',
          `/iceberg/v1/${bucketName}/namespaces/${namespaceName}/tables/${tableName}`,
          {
            expectedStatus: 204,
            token,
          }
        )
        expect(headTable.body).toBe('')

        const committed = await client.request<IcebergTableResponse>(
          'POST',
          `/iceberg/v1/${bucketName}/namespaces/${namespaceName}/tables/${tableName}`,
          {
            body: {
              requirements: [],
              updates: [
                {
                  action: 'set-properties',
                  updates: { 'acceptance.commit': 'true' },
                },
              ],
            },
            expectedStatus: 200,
            token,
          }
        )
        expect(committed.json?.metadata).toBeTruthy()

        const conflictingCommit = await client.request<IcebergErrorResponse>(
          'POST',
          `/iceberg/v1/${bucketName}/namespaces/${namespaceName}/tables/${tableName}`,
          {
            body: {
              requirements: [
                {
                  type: 'assert-current-schema-id',
                  'current-schema-id': 999_999,
                },
              ],
              updates: [
                {
                  action: 'set-properties',
                  updates: { 'acceptance.commit': 'conflict' },
                },
              ],
            },
            expectedStatus: 409,
            token,
          }
        )
        expect(conflictingCommit.json?.error?.code).toBe(409)

        const missingNamespace = await client.request<IcebergErrorResponse>(
          'GET',
          `/iceberg/v1/${bucketName}/namespaces/missing${suffix}`,
          {
            expectedStatus: 404,
            token,
          }
        )
        expect(missingNamespace.json).toMatchObject({
          error: {
            code: 404,
            message: 'Namespace not found',
            type: 'NoSuchNamespaceException',
          },
        })

        const dropMissingNamespace = await client.request<IcebergErrorResponse>(
          'DELETE',
          `/iceberg/v1/${bucketName}/namespaces/missing${suffix}`,
          {
            expectedStatus: 404,
            token,
          }
        )
        expect(dropMissingNamespace.json).toMatchObject({
          error: {
            code: 404,
            message: 'Namespace not found',
            type: 'NoSuchNamespaceException',
          },
        })

        const missingTable = await client.request<IcebergErrorResponse>(
          'GET',
          `/iceberg/v1/${bucketName}/namespaces/${namespaceName}/tables/missing${suffix}`,
          {
            expectedStatus: 404,
            token,
          }
        )
        expect(missingTable.json).toMatchObject({
          error: {
            code: 404,
            message: 'Table not found',
            type: 'NoSuchTableException',
          },
        })

        const dropMissingTable = await client.request<IcebergErrorResponse>(
          'DELETE',
          `/iceberg/v1/${bucketName}/namespaces/${namespaceName}/tables/missing${suffix}`,
          {
            expectedStatus: 404,
            token,
          }
        )
        expect(dropMissingTable.json).toMatchObject({
          error: {
            code: 404,
            message: 'Table not found',
            type: 'NoSuchTableException',
          },
        })

        const duplicateTable = await client.request<IcebergErrorResponse>(
          'POST',
          `/iceberg/v1/${bucketName}/namespaces/${namespaceName}/tables`,
          {
            body: createTablePayload(tableName),
            expectedStatus: 409,
            token,
          }
        )
        expect(duplicateTable.json).toMatchObject({
          error: {
            code: 409,
            message: 'Table already exists',
            type: 'AlreadyExistsException',
          },
        })

        // The pg metastore upserts namespaces on conflict and merges metadata:
        // existing keys are preserved, colliding keys use the re-create value,
        // and new keys are added.
        const reCreated = await client.request<IcebergNamespaceResponse>(
          'POST',
          `/iceberg/v1/${bucketName}/namespaces`,
          {
            body: {
              namespace: namespaceName,
              properties: {
                overwrite: 'new',
                added: 'value',
              },
            },
            expectedStatus: 200,
            token,
          }
        )
        expect(reCreated.json?.namespace).toEqual([namespaceName])
        expect(reCreated.json?.properties).toMatchObject({
          stable: 'kept',
          overwrite: 'new',
          added: 'value',
        })

        const namespaceAfterRecreate = await client.request<IcebergNamespaceResponse>(
          'GET',
          `/iceberg/v1/${bucketName}/namespaces/${namespaceName}`,
          {
            expectedStatus: 200,
            token,
          }
        )
        expect(namespaceAfterRecreate.json?.namespace).toEqual([namespaceName])
        expect(namespaceAfterRecreate.json?.properties).toMatchObject({
          stable: 'kept',
          overwrite: 'new',
          added: 'value',
        })

        // Dropping a namespace that still owns tables must fail with the
        // storage-level resource-not-empty contract (HTTP 400 +
        // type=IcebergResourceNotEmpty per the iceberg error formatter).
        const dropNonEmpty = await client.request<IcebergErrorResponse>(
          'DELETE',
          `/iceberg/v1/${bucketName}/namespaces/${namespaceName}`,
          { expectedStatus: 400, token }
        )
        expect(dropNonEmpty.json).toMatchObject({
          error: {
            code: 400,
            type: 'IcebergResourceNotEmpty',
          },
        })
      } finally {
        if (secondTableCreated) {
          await client
            .request(
              'DELETE',
              `/iceberg/v1/${bucketName}/namespaces/${namespaceName}/tables/${secondTableName}`,
              {
                expectedStatus: [204, 400, 404],
                token,
              }
            )
            .catch(() => undefined)
        }

        if (tableCreated) {
          await client
            .request(
              'DELETE',
              `/iceberg/v1/${bucketName}/namespaces/${namespaceName}/tables/${tableName}`,
              {
                expectedStatus: [204, 400, 404],
                token,
              }
            )
            .catch(() => undefined)
        }

        if (namespaceCreated) {
          await client
            .request('DELETE', `/iceberg/v1/${bucketName}/namespaces/${namespaceName}`, {
              expectedStatus: [204, 400, 404],
              token,
            })
            .catch(() => undefined)
        }

        await client
          .request('DELETE', `/iceberg/bucket/${bucketName}`, {
            expectedStatus: [200, 400, 404],
            token,
          })
          .catch(() => undefined)
      }
    })
  }
)

function createTablePayload(tableName: string) {
  return {
    name: tableName,
    properties: {
      purpose: 'acceptance',
    },
    schema: {
      fields: [
        {
          id: 1,
          name: 'id',
          required: false,
          type: 'long',
        },
        {
          id: 2,
          name: 'name',
          required: false,
          type: 'string',
        },
      ],
      'identifier-field-ids': [],
      'schema-id': 0,
      type: 'struct',
    },
    spec: {
      fields: [],
      'spec-id': 0,
    },
    'stage-create': false,
    'write-order': {
      fields: [],
      'order-id': 0,
    },
  }
}
