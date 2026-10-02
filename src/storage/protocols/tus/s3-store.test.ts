import { HttpResponse } from '@smithy/protocol-http'
import { S3Store } from './s3-store'

class TestS3Store extends S3Store {
  getClient() {
    return this.client
  }
}

function createStore(
  handle: (request: unknown, options?: unknown) => Promise<{ response: HttpResponse }>,
  maxAttempts = 1
) {
  return new TestS3Store({
    s3ClientConfig: {
      bucket: 'test-bucket',
      region: 'us-east-1',
      endpoint: 'http://127.0.0.1:9000',
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
      },
      maxAttempts,
      requestHandler: { handle },
    },
  })
}

describe('S3Store', () => {
  test('removes the no-op logger middleware from the internal TUS client', () => {
    const store = createStore(vi.fn())

    expect(
      store
        .getClient()
        .middlewareStack.identify()
        .some((middleware) => middleware.includes('loggerMiddleware'))
    ).toBe(false)
  })

  test('preserves SDK retries after removing the logger middleware', async () => {
    const handle = vi
      .fn()
      .mockResolvedValueOnce({
        response: new HttpResponse({ statusCode: 500, headers: {}, body: new Uint8Array() }),
      })
      .mockResolvedValueOnce({
        response: new HttpResponse({ statusCode: 200, headers: {}, body: new Uint8Array() }),
      })
    const store = createStore(handle, 2)

    const result = await store.getClient().headBucket({ Bucket: 'test-bucket' })

    expect(handle).toHaveBeenCalledTimes(2)
    expect(result.$metadata).toMatchObject({ httpStatusCode: 200, attempts: 2 })
  })

  test('preserves SDK errors after removing the logger middleware', async () => {
    const expectedError = new Error('request failed')
    const handle = vi.fn().mockRejectedValue(expectedError)
    const store = createStore(handle)

    await expect(store.getClient().headBucket({ Bucket: 'test-bucket' })).rejects.toBe(
      expectedError
    )
    expect(expectedError).toMatchObject({
      $metadata: { attempts: 1, totalRetryDelay: 0 },
    })
  })
})
