import type { TenantConnection } from '@internal/database'
import { getConfig, mergeConfig } from '../config'

vi.hoisted(() => {
  process.env.PG_QUEUE_ENABLE = 'true'
})

const { serviceKeyAsync, tenantId } = getConfig()

mergeConfig({
  pgQueueEnable: true,
  requestTraceHeader: 'trace-id',
})

import { getPostgresConnection, getServiceKeyUser } from '@internal/database'
import { Obj } from '@storage/schemas'
import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import FormData from 'form-data'
import fs from 'fs'
import type { MockInstance } from 'vitest'
import app from '../app'
import { ObjectAdminDeleteAllBefore } from '../storage/events/objects/object-admin-delete-all-before'
import { mockQueue, useMockObject } from './common'

describe('Webhooks', () => {
  useMockObject()

  let pg: TenantConnection
  beforeAll(async () => {
    const superUser = await getServiceKeyUser(tenantId)
    pg = await getPostgresConnection({
      tenantId,
      superUser,
      user: superUser,
      host: 'localhost',
    })
  })

  let appInstance: FastifyInstance
  let sendSpy: MockInstance
  beforeEach(() => {
    const mocks = mockQueue()
    sendSpy = mocks.sendSpy
    appInstance = app()
  })

  afterEach(async () => {
    await appInstance.close()
    vi.clearAllMocks()
  })

  it('will emit a webhook upon object creation', async () => {
    const form = new FormData()

    const authorization = `Bearer ${await serviceKeyAsync}`
    form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
    const headers = Object.assign({}, form.getHeaders(), {
      authorization,
    })

    const fileName = (Math.random() + 1).toString(36).substring(7)

    const response = await appInstance.inject({
      method: 'POST',
      url: `/object/bucket6/public/${fileName}.png`,
      headers,
      payload: form,
    })
    expect(response.statusCode).toBe(200)
    expect(sendSpy).toHaveBeenCalledTimes(1)
    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'webhooks',
        options: expect.objectContaining({
          deadLetter: 'webhooks-dead-letter',
          expireInSeconds: expect.any(Number),
        }),
        data: expect.objectContaining({
          $version: 'v1',
          event: expect.objectContaining({
            type: 'ObjectCreated:Post',
            $version: 'v1',
            applyTime: expect.any(Number),
            payload: expect.objectContaining({
              bucketId: 'bucket6',
              metadata: expect.objectContaining({
                cacheControl: 'no-cache',
                contentLength: 3746,
                eTag: 'abc',
                lastModified: expect.any(Date),
                httpStatusCode: 200,
                mimetype: 'image/png',
                size: 3746,
              }),
              name: `public/${fileName}.png`,
              uploadType: 'standard',
              tenant: expect.objectContaining({
                ref: 'bjhaohmqunupljrqypxz',
              }),
            }),
          }),
          tenant: expect.objectContaining({
            ref: 'bjhaohmqunupljrqypxz',
          }),
        }),
      })
    )
  })

  it('keeps trace reqId separate from sbReqId in queued webhook payloads', async () => {
    const form = new FormData()

    const authorization = `Bearer ${await serviceKeyAsync}`
    form.append('file', fs.createReadStream(`./src/test/assets/sadcat.jpg`))
    const headers = Object.assign({}, form.getHeaders(), {
      authorization,
      'trace-id': 'trace-123',
      'sb-request-id': 'sb-req-123',
    })

    const fileName = (Math.random() + 1).toString(36).substring(7)

    const response = await appInstance.inject({
      method: 'POST',
      url: `/object/bucket6/public/${fileName}.png`,
      headers,
      payload: form,
    })

    expect(response.statusCode).toBe(200)
    expect(sendSpy).toHaveBeenCalledTimes(1)
    const queuedWebhook = sendSpy.mock.calls[0][0].data

    expect(queuedWebhook).not.toHaveProperty('sbReqId') // not top level
    expect(queuedWebhook.event.payload.reqId).toEqual(expect.any(String))
    expect(queuedWebhook.event.payload.sbReqId).toBe('sb-req-123')
    expect(queuedWebhook.event.payload.reqId).not.toBe(queuedWebhook.event.payload.sbReqId)
  })

  it('will emit a webhook upon object deletion', async () => {
    const obj = await createObject(pg, 'bucket6')

    const authorization = `Bearer ${await serviceKeyAsync}`
    const response = await appInstance.inject({
      method: 'DELETE',
      url: `/object/bucket6/${obj.name}`,
      headers: {
        authorization,
      },
    })
    expect(response.statusCode).toBe(200)
    expect(sendSpy).toHaveBeenCalledTimes(1)

    expect(sendSpy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        name: 'webhooks',
        options: expect.objectContaining({
          deadLetter: 'webhooks-dead-letter',
          expireInSeconds: expect.any(Number),
        }),
        data: expect.objectContaining({
          $version: 'v1',
          event: expect.objectContaining({
            $version: 'v1',
            type: 'ObjectRemoved:Delete',
            applyTime: expect.any(Number),
            payload: expect.objectContaining({
              bucketId: 'bucket6',
              name: obj.name,
              tenant: {
                host: undefined,
                ref: 'bjhaohmqunupljrqypxz',
              },
              reqId: expect.any(String),
            }),
          }),
          tenant: {
            host: undefined,
            ref: 'bjhaohmqunupljrqypxz',
          },
        }),
      })
    )
  })

  it('will emit a webhook upon object moved', async () => {
    const obj = await createObject(pg, 'bucket6')

    const authorization = `Bearer ${await serviceKeyAsync}`
    const response = await appInstance.inject({
      method: 'POST',
      url: `/object/move`,
      headers: {
        authorization,
      },
      payload: {
        bucketId: 'bucket6',
        sourceKey: obj.name,
        destinationKey: `${obj.name}-moved`,
      },
    })

    expect(response.statusCode).toBe(200)
    expect(sendSpy).toHaveBeenCalledTimes(3)

    expect(sendSpy).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        name: 'webhooks',
        options: expect.objectContaining({
          deadLetter: 'webhooks-dead-letter',
          expireInSeconds: expect.any(Number),
        }),
        data: expect.objectContaining({
          $version: 'v1',
          event: expect.objectContaining({
            $version: 'v1',
            type: 'ObjectRemoved:Move',
            applyTime: expect.any(Number),
            payload: expect.objectContaining({
              bucketId: 'bucket6',
              metadata: expect.objectContaining({
                cacheControl: 'no-cache',
                contentLength: 3746,
                eTag: 'abc',
                lastModified: expect.any(String),
                httpStatusCode: 200,
                mimetype: 'image/png',
                size: 3746,
              }),
              name: obj.name,
              version: expect.any(String),
              tenant: {
                host: undefined,
                ref: 'bjhaohmqunupljrqypxz',
              },
              reqId: expect.any(String),
            }),
          }),
          tenant: {
            host: undefined,
            ref: 'bjhaohmqunupljrqypxz',
          },
        }),
      })
    )

    expect(sendSpy).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        name: 'webhooks',
        options: expect.objectContaining({
          deadLetter: 'webhooks-dead-letter',
          expireInSeconds: expect.any(Number),
        }),
        data: expect.objectContaining({
          $version: 'v1',
          event: expect.objectContaining({
            $version: 'v1',
            type: 'ObjectCreated:Move',
            applyTime: expect.any(Number),
            payload: expect.objectContaining({
              bucketId: 'bucket6',
              version: expect.any(String),
              metadata: expect.objectContaining({
                cacheControl: 'no-cache',
                contentLength: 3746,
                eTag: 'abc',
                lastModified: expect.any(Date),
                httpStatusCode: 200,
                mimetype: 'image/png',
                size: 3746,
              }),
              name: `${obj.name}-moved`,
              oldObject: {
                bucketId: 'bucket6',
                name: obj.name,
                reqId: expect.any(String),
                version: expect.any(String),
              },
              tenant: {
                host: undefined,
                ref: 'bjhaohmqunupljrqypxz',
              },
              reqId: expect.any(String),
            }),
          }),
          tenant: {
            host: undefined,
            ref: 'bjhaohmqunupljrqypxz',
          },
        }),
      })
    )
  })

  it('will emit destination bucket in ObjectCreated:Move payload for cross-bucket moves', async () => {
    const obj = await createObject(pg, 'bucket6')
    const destinationKey = `${obj.name}-moved-${randomUUID()}`

    const authorization = `Bearer ${await serviceKeyAsync}`
    const response = await appInstance.inject({
      method: 'POST',
      url: `/object/move`,
      headers: {
        authorization,
      },
      payload: {
        bucketId: 'bucket6',
        sourceKey: obj.name,
        destinationBucket: 'bucket2',
        destinationKey,
      },
    })

    expect(response.statusCode).toBe(200)
    expect(sendSpy).toHaveBeenCalledTimes(3)
    expect(sendSpy).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        data: expect.objectContaining({
          event: expect.objectContaining({
            type: 'ObjectCreated:Move',
            payload: expect.objectContaining({
              bucketId: 'bucket2',
              name: destinationKey,
              oldObject: expect.objectContaining({
                bucketId: 'bucket6',
                name: obj.name,
              }),
            }),
          }),
        }),
      })
    )
  })

  it('will emit a webhook upon object copied', async () => {
    const obj = await createObject(pg, 'bucket6')

    const authorization = `Bearer ${await serviceKeyAsync}`
    const response = await appInstance.inject({
      method: 'POST',
      url: `/object/copy`,
      headers: {
        authorization,
      },
      payload: {
        bucketId: 'bucket6',
        sourceKey: obj.name,
        destinationKey: `${obj.name}-copied`,
      },
    })

    expect(response.statusCode).toBe(200)
    expect(sendSpy).toHaveBeenCalledTimes(1)

    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'webhooks',
        options: expect.objectContaining({
          deadLetter: 'webhooks-dead-letter',
          expireInSeconds: expect.any(Number),
        }),
        data: expect.objectContaining({
          $version: 'v1',
          event: expect.objectContaining({
            $version: 'v1',
            applyTime: expect.any(Number),
            type: 'ObjectCreated:Copy',
            payload: expect.objectContaining({
              bucketId: 'bucket6',
              metadata: expect.objectContaining({
                cacheControl: 'no-cache',
                contentLength: 3746,
                eTag: 'abc',
                lastModified: expect.any(Date),
                httpStatusCode: 200,
                mimetype: 'image/png',
                size: 3746,
              }),
              name: `${obj.name}-copied`,
              tenant: {
                host: undefined,
                ref: 'bjhaohmqunupljrqypxz',
              },
            }),
          }),
          tenant: {
            host: undefined,
            ref: 'bjhaohmqunupljrqypxz',
          },
        }),
      })
    )
  })

  it('will emit destination bucket in ObjectCreated:Copy payload for cross-bucket copies', async () => {
    const obj = await createObject(pg, 'bucket6')
    const destinationKey = `${obj.name}-copied-${randomUUID()}`

    const authorization = `Bearer ${await serviceKeyAsync}`
    const response = await appInstance.inject({
      method: 'POST',
      url: `/object/copy`,
      headers: {
        authorization,
      },
      payload: {
        bucketId: 'bucket6',
        sourceKey: obj.name,
        destinationBucket: 'bucket2',
        destinationKey,
      },
    })

    expect(response.statusCode).toBe(200)
    expect(sendSpy).toHaveBeenCalledTimes(1)
    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          event: expect.objectContaining({
            type: 'ObjectCreated:Copy',
            payload: expect.objectContaining({
              bucketId: 'bucket2',
              name: destinationKey,
            }),
          }),
        }),
      })
    )
  })

  it('will emit webhooks for each deleted object during empty bucket operation', async () => {
    const emptyTestBucketName = `bucket-empty-webhook-test-${randomUUID()}`
    const authorization = `Bearer ${await serviceKeyAsync}`

    // Create a dedicated bucket for this test
    await appInstance.inject({
      method: 'POST',
      url: `/bucket`,
      headers: {
        authorization,
      },
      payload: {
        name: emptyTestBucketName,
      },
    })

    const objectCreatedAt = new Date(Date.now() - 1_000)
    const objects = await Promise.all([
      createObject(pg, emptyTestBucketName, objectCreatedAt),
      createObject(pg, emptyTestBucketName, objectCreatedAt),
      createObject(pg, emptyTestBucketName, objectCreatedAt),
    ])

    const response = await appInstance.inject({
      method: 'POST',
      url: `/bucket/${emptyTestBucketName}/empty`,
      headers: {
        authorization,
      },
    })

    expect(response.statusCode).toBe(200)

    // Pass call invoked by empty on to the job handler to trigger the webhooks
    expect(sendSpy).toHaveBeenCalledTimes(1)
    const deleteJobCall = sendSpy.mock.calls[0][0]
    expect(deleteJobCall.name).toBe(ObjectAdminDeleteAllBefore.queueName)
    await ObjectAdminDeleteAllBefore.handle(deleteJobCall)

    // Check ObjectRemoved:Delete webhooks were sent as expected
    expect(sendSpy).toHaveBeenCalledTimes(1 + objects.length) // 1 for the delete job + 3 for webhooks
    objects.forEach((obj) => {
      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'webhooks',
          options: expect.objectContaining({
            deadLetter: 'webhooks-dead-letter',
            expireInSeconds: expect.any(Number),
          }),
          data: expect.objectContaining({
            $version: 'v1',
            event: expect.objectContaining({
              $version: 'v1',
              type: 'ObjectRemoved:Delete',
              applyTime: expect.any(Number),
              payload: expect.objectContaining({
                bucketId: emptyTestBucketName,
                name: obj.name,
                version: obj.version,
                metadata: obj.metadata,
                tenant: {
                  host: undefined,
                  ref: 'bjhaohmqunupljrqypxz',
                },
                reqId: expect.any(String),
              }),
            }),
            tenant: {
              host: undefined,
              ref: 'bjhaohmqunupljrqypxz',
            },
          }),
        })
      )
    })

    // Clean up: delete the bucket
    await appInstance.inject({
      method: 'DELETE',
      url: `/bucket/${emptyTestBucketName}`,
      headers: {
        authorization,
      },
    })
  })

  it('will emit webhook for single object deletion', async () => {
    const deleteTestBucketName = 'bucket-delete-object-webhook-test'
    const authorization = `Bearer ${await serviceKeyAsync}`

    // Create a dedicated bucket for this test
    await appInstance.inject({
      method: 'POST',
      url: `/bucket`,
      headers: {
        authorization,
      },
      payload: {
        name: deleteTestBucketName,
      },
    })

    // Create a single object
    const obj = await createObject(pg, deleteTestBucketName)

    // Delete the object via the deleteObject endpoint
    const response = await appInstance.inject({
      method: 'DELETE',
      url: `/object/${deleteTestBucketName}/${obj.name}`,
      headers: {
        authorization,
      },
    })

    expect(response.statusCode).toBe(200)

    // Check ObjectRemoved:Delete webhook was sent
    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'webhooks',
        options: expect.objectContaining({
          deadLetter: 'webhooks-dead-letter',
          expireInSeconds: expect.any(Number),
        }),
        data: expect.objectContaining({
          $version: 'v1',
          event: expect.objectContaining({
            $version: 'v1',
            type: 'ObjectRemoved:Delete',
            applyTime: expect.any(Number),
            payload: expect.objectContaining({
              bucketId: deleteTestBucketName,
              name: obj.name,
              version: obj.version,
              metadata: obj.metadata,
              tenant: {
                host: undefined,
                ref: tenantId,
              },
              reqId: expect.any(String),
            }),
          }),
          tenant: {
            host: undefined,
            ref: tenantId,
          },
        }),
      })
    )

    // Clean up: delete the bucket
    await appInstance.inject({
      method: 'DELETE',
      url: `/bucket/${deleteTestBucketName}`,
      headers: {
        authorization,
      },
    })
  })

  it('will emit webhooks for multiple object deletions', async () => {
    const deleteMultipleTestBucketName = 'bucket-delete-objects-webhook-test'
    const authorization = `Bearer ${await serviceKeyAsync}`

    // Create a dedicated bucket for this test
    await appInstance.inject({
      method: 'POST',
      url: `/bucket`,
      headers: {
        authorization,
      },
      payload: {
        name: deleteMultipleTestBucketName,
      },
    })

    // Create multiple objects
    const objects = await Promise.all([
      createObject(pg, deleteMultipleTestBucketName),
      createObject(pg, deleteMultipleTestBucketName),
      createObject(pg, deleteMultipleTestBucketName),
    ])

    // Delete the objects via the deleteObjects endpoint
    const response = await appInstance.inject({
      method: 'DELETE',
      url: `/object/${deleteMultipleTestBucketName}`,
      headers: {
        authorization,
        'Content-Type': 'application/json',
      },
      payload: {
        prefixes: objects.map((obj) => obj.name),
      },
    })

    expect(response.statusCode).toBe(200)

    // Check ObjectRemoved:Delete webhooks were sent for each object
    expect(sendSpy).toHaveBeenCalledTimes(objects.length)
    objects.forEach((obj) => {
      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'webhooks',
          options: expect.objectContaining({
            deadLetter: 'webhooks-dead-letter',
            expireInSeconds: expect.any(Number),
          }),
          data: expect.objectContaining({
            $version: 'v1',
            event: expect.objectContaining({
              $version: 'v1',
              type: 'ObjectRemoved:Delete',
              applyTime: expect.any(Number),
              payload: expect.objectContaining({
                bucketId: deleteMultipleTestBucketName,
                name: obj.name,
                version: obj.version,
                metadata: obj.metadata,
                tenant: {
                  host: undefined,
                  ref: tenantId,
                },
                reqId: expect.any(String),
              }),
            }),
            tenant: {
              host: undefined,
              ref: tenantId,
            },
          }),
        })
      )
    })

    // Clean up: delete the bucket
    await appInstance.inject({
      method: 'DELETE',
      url: `/bucket/${deleteMultipleTestBucketName}`,
      headers: {
        authorization,
      },
    })
  })
})

async function createObject(pg: TenantConnection, bucketId: string, createdAt?: Date) {
  const objectName = randomUUID()
  const tnx = await pg.transaction()
  const createdAtIso = createdAt?.toISOString()

  const result = await tnx.query<Obj>({
    text: `
      INSERT INTO objects (
        name,
        bucket_id,
        version,
        metadata,
        created_at,
        updated_at,
        last_accessed_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        COALESCE($5::timestamptz, now() - interval '1 second'),
        COALESCE($5::timestamptz, now() - interval '1 second'),
        COALESCE($5::timestamptz, now() - interval '1 second')
      )
      RETURNING *
    `,
    values: [
      objectName.toString(),
      bucketId,
      randomUUID(),
      {
        cacheControl: 'no-cache',
        contentLength: 3746,
        eTag: 'abc',
        lastModified: new Date(),
        httpStatusCode: 200,
        mimetype: 'image/png',
        size: 3746,
      },
      createdAtIso,
    ],
  })

  await tnx.commit()

  return result.rows[0]
}
