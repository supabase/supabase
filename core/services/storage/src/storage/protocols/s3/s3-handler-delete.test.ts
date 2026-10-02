import { ERRORS, ErrorCode } from '@internal/errors'
import { describe, expect, it, vi } from 'vitest'
import { S3ProtocolHandler } from './s3-handler'

function createHandler(
  remainingKeys: string[] = [],
  findBucket = vi.fn().mockResolvedValue({ id: 'bucket' }),
  deletedKeys: string[] = []
) {
  const deleteObjects = vi.fn().mockResolvedValue(deletedKeys.map((name) => ({ name })))
  const findObjects = vi.fn().mockResolvedValue(remainingKeys.map((name) => ({ name })))
  const scopedFrom = vi.fn(() => ({
    deleteObjects,
  }))
  const superUserFrom = vi.fn(() => ({
    findObjects,
  }))
  const storage = {
    asSuperUser: vi.fn(() => ({
      findBucket,
      from: superUserFrom,
    })),
    from: scopedFrom,
  }
  const handler = new S3ProtocolHandler(storage as never, 'tenant-id')

  return {
    deleteObjects,
    findBucket,
    findObjects,
    handler,
    scopedFrom,
    storage,
    superUserFrom,
  }
}

describe('S3ProtocolHandler.deleteObjects', () => {
  it('omits successful deletions from quiet responses while retaining errors', async () => {
    const { handler } = createHandler(['denied.txt'], undefined, ['allowed.txt'])

    const response = await handler.deleteObjects({
      Bucket: 'bucket',
      Delete: {
        Objects: [{ Key: 'allowed.txt' }, { Key: 'missing.txt' }, { Key: 'denied.txt' }],
        Quiet: true,
      },
    })

    expect(response.responseBody).toEqual({
      DeleteResult: {
        Deleted: [],
        Error: [{ Code: 'AccessDenied', Key: 'denied.txt', Message: 'Access Denied' }],
      },
    })
  })

  it('reports missing keys as deleted and existing keys blocked by RLS as AccessDenied', async () => {
    const { deleteObjects, findBucket, findObjects, handler } = createHandler(
      ['denied.txt'],
      undefined,
      ['allowed.txt']
    )

    const response = await handler.deleteObjects({
      Bucket: 'bucket',
      Delete: {
        Objects: [{ Key: 'allowed.txt' }, { Key: 'missing.txt' }, { Key: 'denied.txt' }],
      },
    })

    expect(findBucket).not.toHaveBeenCalled()
    expect(deleteObjects).toHaveBeenCalledWith(['allowed.txt', 'missing.txt', 'denied.txt'])
    expect(findObjects).toHaveBeenCalledWith(['missing.txt', 'denied.txt'], 'name')
    expect(response.responseBody).toEqual({
      DeleteResult: {
        Deleted: [{ Key: 'allowed.txt' }, { Key: 'missing.txt' }],
        Error: [{ Code: 'AccessDenied', Key: 'denied.txt', Message: 'Access Denied' }],
      },
    })
  })

  it('does not check the bucket again when requested keys were deleted', async () => {
    const { deleteObjects, findBucket, findObjects, handler } = createHandler([], undefined, [
      'allowed.txt',
    ])

    const response = await handler.deleteObjects({
      Bucket: 'bucket',
      Delete: {
        Objects: [{ Key: 'allowed.txt' }],
      },
    })

    expect(findBucket).not.toHaveBeenCalled()
    expect(deleteObjects).toHaveBeenCalledWith(['allowed.txt'])
    expect(findObjects).not.toHaveBeenCalled()
    expect(response.responseBody).toEqual({
      DeleteResult: {
        Deleted: [{ Key: 'allowed.txt' }],
        Error: [],
      },
    })
  })

  it('does not report keys as deleted when the bucket does not exist', async () => {
    const { deleteObjects, findBucket, findObjects, handler } = createHandler(
      [],
      vi.fn().mockRejectedValue(ERRORS.NoSuchBucket('missing-bucket'))
    )

    await expect(
      handler.deleteObjects({
        Bucket: 'missing-bucket',
        Delete: {
          Objects: [{ Key: 'missing.txt' }],
        },
      })
    ).rejects.toMatchObject({
      code: ErrorCode.NoSuchBucket,
    })

    expect(findBucket).toHaveBeenCalledWith('missing-bucket')
    expect(deleteObjects).toHaveBeenCalledWith(['missing.txt'])
    expect(findObjects).toHaveBeenCalledWith(['missing.txt'], 'name')
  })
})
