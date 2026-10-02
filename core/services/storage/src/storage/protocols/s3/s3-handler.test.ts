import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { ERRORS, ErrorCode } from '@internal/errors'
import { MAX_HEADER_NAME_LENGTH } from '@internal/http/header'
import { S3ProtocolHandler } from '@storage/protocols/s3/s3-handler'
import { Readable } from 'stream'
import * as config from '../../../config'

describe('S3ProtocolHandler.getBucketLocation', () => {
  it('returns an empty location constraint when the storage region is not configured', async () => {
    const configured = config.getConfig()
    vi.resetModules()
    vi.doMock('../../../config', () => ({
      ...config,
      getConfig: () => ({ ...configured, storageS3Region: undefined }),
    }))

    try {
      const { S3ProtocolHandler: UnconfiguredRegionHandler } = await import('./s3-handler')
      const handler = new UnconfiguredRegionHandler({} as never, 'tenant-id')

      await expect(handler.getBucketLocation()).resolves.toEqual({
        responseBody: { LocationConstraint: '' },
      })
    } finally {
      vi.doUnmock('../../../config')
      vi.resetModules()
    }
  })
})

describe('S3ProtocolHandler.dbHeadObject', () => {
  it('emits empty user metadata values as valid S3 metadata headers', async () => {
    const findObject = vi.fn().mockResolvedValue({
      created_at: '2026-06-25T00:00:00.000Z',
      metadata: {
        eTag: '"etag"',
        mimetype: 'text/plain',
        size: '0',
      },
      updated_at: '2026-06-25T00:00:00.000Z',
      user_metadata: {
        color: 'blue',
        empty: '',
      },
    })
    const storage = {
      from: vi.fn(() => ({
        findObject,
      })),
    }
    const handler = new S3ProtocolHandler(storage as never, 'tenant-id')

    const response = await handler.dbHeadObject({
      Bucket: 'bucket',
      Key: 'object.txt',
    })

    expect(response.headers).toMatchObject({
      'x-amz-meta-color': 'blue',
      'x-amz-meta-empty': '',
    })
    expect(response.headers).not.toHaveProperty('x-amz-missing-meta')
  })

  it('counts metadata as missing when the emitted S3 metadata header name is too long', async () => {
    const prefix = 'x-amz-meta-'
    const key = 'a'.repeat(MAX_HEADER_NAME_LENGTH - prefix.length + 1)
    const findObject = vi.fn().mockResolvedValue({
      created_at: '2026-06-25T00:00:00.000Z',
      metadata: {
        eTag: '"etag"',
        mimetype: 'text/plain',
        size: '0',
      },
      updated_at: '2026-06-25T00:00:00.000Z',
      user_metadata: {
        [key]: 'value',
      },
    })
    const storage = {
      from: vi.fn(() => ({
        findObject,
      })),
    }
    const handler = new S3ProtocolHandler(storage as never, 'tenant-id')

    const response = await handler.dbHeadObject({
      Bucket: 'bucket',
      Key: 'object.txt',
    })

    expect(response.headers).toHaveProperty('x-amz-missing-meta', 1)
    expect(response.headers).not.toHaveProperty(prefix + key)
  })

  it('counts empty user metadata keys as missing', async () => {
    const findObject = vi.fn().mockResolvedValue({
      created_at: '2026-06-25T00:00:00.000Z',
      metadata: {
        eTag: '"etag"',
        mimetype: 'text/plain',
        size: '0',
      },
      updated_at: '2026-06-25T00:00:00.000Z',
      user_metadata: {
        '': 'value',
        color: 'blue',
      },
    })
    const storage = {
      from: vi.fn(() => ({
        findObject,
      })),
    }
    const handler = new S3ProtocolHandler(storage as never, 'tenant-id')

    const response = await handler.dbHeadObject({
      Bucket: 'bucket',
      Key: 'object.txt',
    })

    expect(response.headers).toMatchObject({
      'x-amz-meta-color': 'blue',
      'x-amz-missing-meta': 1,
    })
    expect(response.headers).not.toHaveProperty('x-amz-meta-')
  })

  it('emits Content-Length 0 for zero-byte objects stored with a numeric size', async () => {
    const findObject = vi.fn().mockResolvedValue({
      created_at: '2026-06-25T00:00:00.000Z',
      metadata: {
        eTag: '"etag"',
        mimetype: 'text/plain',
        size: 0,
      },
      updated_at: '2026-06-25T00:00:00.000Z',
    })
    const storage = {
      from: vi.fn(() => ({
        findObject,
      })),
    }
    const handler = new S3ProtocolHandler(storage as never, 'tenant-id')

    const response = await handler.dbHeadObject({
      Bucket: 'bucket',
      Key: 'empty.txt',
    })

    expect(response.headers['content-length']).toBe('0')
  })
})

describe('S3ProtocolHandler.getObject', () => {
  it('returns an upstream S3 304 as a not-modified response with its validators', async () => {
    const sdkError = async (
      statusCode: number,
      headers: Record<string, string>,
      body: string[],
      input: { IfNoneMatch: string }
    ) => {
      const client = new S3Client({
        region: 'us-east-1',
        credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
        requestHandler: {
          handle: async () => ({ response: { statusCode, headers, body: Readable.from(body) } }),
        },
      })
      try {
        return await client
          .send(new GetObjectCommand({ Bucket: 'b', Key: 'k', ...input }))
          .catch((e) => e)
      } finally {
        client.destroy()
      }
    }
    const notModified = await sdkError(
      304,
      {
        etag: '"current-etag"',
        'last-modified': 'Thu, 01 Jan 2026 00:00:00 GMT',
        'cache-control': 'max-age=60',
      },
      [],
      { IfNoneMatch: '"current-etag"' }
    )
    const preconditionFailed = await sdkError(
      412,
      { 'content-type': 'application/xml' },
      ['<Error><Code>PreconditionFailed</Code><Message>m</Message></Error>'],
      { IfNoneMatch: '"current-etag"' }
    )
    const backendGetObject = vi
      .fn()
      .mockRejectedValueOnce(notModified)
      .mockRejectedValueOnce(preconditionFailed)
    const storage = {
      backend: { getObject: backendGetObject },
      from: vi.fn(() => ({
        findObject: vi.fn().mockResolvedValue({ user_metadata: null, version: 'object-version' }),
      })),
      location: {
        getKeyLocation: vi.fn(() => 'tenant-id/bucket/object.txt'),
        getRootLocation: vi.fn(() => 'root-bucket'),
      },
    }
    const handler = new S3ProtocolHandler(storage as never, 'tenant-id')
    const command = { Bucket: 'bucket', Key: 'object.txt', IfNoneMatch: '"current-etag"' }

    await expect(handler.getObject(command)).resolves.toEqual({
      statusCode: 304,
      responseBody: undefined,
      headers: {
        'cache-control': 'max-age=60',
        etag: '"current-etag"',
        'last-modified': 'Thu, 01 Jan 2026 00:00:00 GMT',
      },
    })
    await expect(handler.getObject(command)).rejects.toBe(preconditionFailed)
  })

  it('preserves backend not-modified responses for cache validators', async () => {
    const backendGetObject = vi.fn().mockResolvedValue({
      body: undefined,
      httpStatusCode: 304,
      metadata: {
        cacheControl: 'no-cache',
        contentLength: 0,
        eTag: '"current-etag"',
        httpStatusCode: 304,
        lastModified: new Date(),
        mimetype: 'text/plain',
        size: 29,
      },
    })
    const findObject = vi.fn().mockResolvedValue({
      user_metadata: null,
      version: 'object-version',
    })
    const getRootLocation = vi.fn(() => 'root-bucket')
    const getKeyLocation = vi.fn(() => 'tenant-id/bucket/object.txt')
    const storage = {
      backend: {
        getObject: backendGetObject,
      },
      from: vi.fn(() => ({
        findObject,
      })),
      location: {
        getKeyLocation,
        getRootLocation,
      },
    }
    const handler = new S3ProtocolHandler(storage as never, 'tenant-id')

    const response = await handler.getObject({
      Bucket: 'bucket',
      IfNoneMatch: '"current-etag"',
      Key: 'object.txt',
    })

    expect(response.statusCode).toBe(304)
    expect(response.responseBody).toBeUndefined()
    expect(response.headers['content-length']).toBe('29')
    expect(backendGetObject).toHaveBeenCalledWith(
      'root-bucket',
      'tenant-id/bucket/object.txt',
      'object-version',
      {
        ifModifiedSince: undefined,
        ifNoneMatch: '"current-etag"',
        range: undefined,
      },
      undefined
    )
  })
})

describe('S3ProtocolHandler.listObjects', () => {
  it.each([
    {
      EncodingType: 'url' as const,
      delimiter: '%2F',
      prefix: 'root%20%21%27%2F',
      marker: 'root%20%21%27%2Fbefore',
    },
    {
      EncodingType: undefined,
      delimiter: '/',
      prefix: "root !'/",
      marker: "root !'/before",
    },
  ])('encodes list response fields only when EncodingType is url ($EncodingType)', async ({
    EncodingType,
    delimiter,
    prefix,
    marker,
  }) => {
    const findBucket = vi.fn().mockResolvedValue({ id: 'bucket' })
    const listObjectsV2 = vi.fn().mockResolvedValue({
      folders: [{ id: null, name: "root !'/" }],
      objects: [],
      hasNext: true,
      nextCursor: 'opaque-token',
      nextCursorKey: "root !'/",
    })
    const storage = {
      asSuperUser: vi.fn(() => ({ findBucket })),
      from: vi.fn(() => ({ listObjectsV2 })),
    }
    const handler = new S3ProtocolHandler(storage as never, 'tenant-id')

    const response = await handler.listObjects({
      Bucket: 'bucket',
      Delimiter: '/',
      EncodingType,
      Marker: "root !'/before",
      MaxKeys: 1,
    })

    expect(response.responseBody.ListBucketResult).toMatchObject({
      CommonPrefixes: [{ Prefix: prefix }],
      Delimiter: delimiter,
      EncodingType,
      IsTruncated: true,
      Marker: marker,
      NextMarker: prefix,
    })
  })
})

describe('S3ProtocolHandler.listObjectsV2', () => {
  it('RFC 3986 encodes list response fields when EncodingType is url', async () => {
    const findBucket = vi.fn().mockResolvedValue({ id: 'bucket' })
    const listObjectsV2 = vi.fn().mockResolvedValue({
      folders: [{ id: null, name: "root !'()*/folder/" }],
      objects: [
        {
          id: 'object-id',
          name: "root !'()*/file.txt",
          metadata: { eTag: 'etag', size: 1 },
        },
      ],
      hasNext: true,
      nextCursor: 'next-token+/=',
    })
    const storage = {
      asSuperUser: vi.fn(() => ({ findBucket })),
      from: vi.fn(() => ({ listObjectsV2 })),
    }
    const handler = new S3ProtocolHandler(storage as never, 'tenant-id')

    const response = await handler.listObjectsV2({
      Bucket: 'bucket',
      Prefix: "root !'()*/",
      Delimiter: '/',
      StartAfter: "root !'()*/before.txt",
      ContinuationToken: 'token+/=',
      EncodingType: 'url',
    })

    expect(listObjectsV2).toHaveBeenCalledWith({
      prefix: "root !'()*/",
      delimiter: '/',
      maxKeys: 1000,
      cursor: 'token+/=',
      startAfter: "root !'()*/before.txt",
      s3Compatible: true,
    })
    expect(response.responseBody.ListBucketResult).toMatchObject({
      Prefix: 'root%20%21%27%28%29%2A%2F',
      Delimiter: '%2F',
      StartAfter: 'root%20%21%27%28%29%2A%2Fbefore.txt',
      ContinuationToken: 'token+/=',
      NextContinuationToken: 'next-token+/=',
      CommonPrefixes: [{ Prefix: 'root%20%21%27%28%29%2A%2Ffolder%2F' }],
      Contents: [expect.objectContaining({ Key: 'root%20%21%27%28%29%2A%2Ffile.txt' })],
    })
  })
})

describe('S3ProtocolHandler list objects with MaxKeys 0', () => {
  const setup = () => {
    const findBucket = vi.fn().mockResolvedValue({ id: 'bucket' })
    const listObjectsV2 = vi.fn().mockResolvedValue({
      folders: [],
      objects: [{ id: 'object-id', name: 'file.txt', metadata: { eTag: 'etag', size: 1 } }],
      hasNext: false,
    })
    const storage = {
      asSuperUser: vi.fn(() => ({ findBucket })),
      from: vi.fn(() => ({ listObjectsV2 })),
    }
    return { findBucket, listObjectsV2, handler: new S3ProtocolHandler(storage as never, 'tenant') }
  }

  it('listObjectsV2 returns an empty, non-truncated page', async () => {
    const { findBucket, listObjectsV2, handler } = setup()

    const response = await handler.listObjectsV2({ Bucket: 'bucket', MaxKeys: 0 })

    expect(findBucket).toHaveBeenCalledWith('bucket')
    expect(listObjectsV2).not.toHaveBeenCalled()
    expect(response.responseBody.ListBucketResult).toMatchObject({
      MaxKeys: 0,
      KeyCount: 0,
      IsTruncated: false,
      Contents: [],
      CommonPrefixes: [],
    })
    expect(response.responseBody.ListBucketResult.NextContinuationToken).toBeUndefined()
  })

  it('listObjects returns an empty, non-truncated page', async () => {
    const { listObjectsV2, handler } = setup()

    const response = await handler.listObjects({ Bucket: 'bucket', MaxKeys: 0 })

    expect(listObjectsV2).not.toHaveBeenCalled()
    expect(response.responseBody.ListBucketResult).toMatchObject({
      MaxKeys: 0,
      IsTruncated: false,
      Contents: [],
      CommonPrefixes: [],
    })
  })

  it('still defaults to 1000 keys when MaxKeys is not provided', async () => {
    const { listObjectsV2, handler } = setup()

    await handler.listObjectsV2({ Bucket: 'bucket' })

    expect(listObjectsV2).toHaveBeenCalledWith(expect.objectContaining({ maxKeys: 1000 }))
  })
})

describe('S3ProtocolHandler.listMultipartUploads', () => {
  it('defaults MaxUploads to the S3 limit of 1000', async () => {
    const findBucket = vi.fn().mockResolvedValue({ id: 'bucket' })
    const listMultipartUploads = vi.fn().mockResolvedValue([])
    const storage = {
      asSuperUser: vi.fn(() => ({ findBucket })),
      db: { listMultipartUploads },
    }
    const handler = new S3ProtocolHandler(storage as never, 'tenant-id')

    const response = await handler.listMultipartUploads({ Bucket: 'bucket' })

    expect(listMultipartUploads).toHaveBeenCalledWith('bucket', {
      prefix: '',
      deltimeter: undefined,
      maxKeys: 1001,
      nextUploadKeyToken: undefined,
      nextUploadToken: undefined,
    })
    expect(response.responseBody.ListMultipartUploadsResult.MaxUploads).toBe(1000)
    expect(response.responseBody.ListMultipartUploadsResult.Bucket).toBe('bucket')
    expect(response.responseBody.ListMultipartUploadsResult).not.toHaveProperty('Name')
    expect(response.responseBody.ListMultipartUploadsResult).not.toHaveProperty('KeyCount')
  })

  it('preserves colons in multipart continuation key markers', async () => {
    const findBucket = vi.fn().mockResolvedValue({ id: 'bucket' })
    const listMultipartUploads = vi.fn().mockResolvedValue([])
    const storage = {
      asSuperUser: vi.fn(() => ({ findBucket })),
      db: { listMultipartUploads },
    }
    const handler = new S3ProtocolHandler(storage as never, 'tenant-id')
    const keyMarker = Buffer.from('l:folder:key.txt').toString('base64')

    await handler.listMultipartUploads({ Bucket: 'bucket', KeyMarker: keyMarker })

    expect(listMultipartUploads).toHaveBeenCalledWith('bucket', {
      prefix: '',
      deltimeter: undefined,
      maxKeys: 1001,
      nextUploadKeyToken: 'folder:key.txt',
      nextUploadToken: undefined,
    })
  })

  it.each([
    0,
    -1,
    1.5,
    1001,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ])('rejects invalid MaxUploads %s before querying storage', async (maxUploads) => {
    const findBucket = vi.fn().mockResolvedValue({ id: 'bucket' })
    const listMultipartUploads = vi.fn().mockResolvedValue([])
    const storage = {
      asSuperUser: vi.fn(() => ({ findBucket })),
      db: { listMultipartUploads },
    }
    const handler = new S3ProtocolHandler(storage as never, 'tenant-id')

    await expect(
      handler.listMultipartUploads({ Bucket: 'bucket', MaxUploads: maxUploads })
    ).rejects.toMatchObject({
      code: 'InvalidParameter',
      message: 'Invalid Parameter MaxUploads',
    })
    expect(findBucket).not.toHaveBeenCalled()
    expect(listMultipartUploads).not.toHaveBeenCalled()
  })

  it('RFC 3986 encodes multipart list response fields when EncodingType is url', async () => {
    const prefix = "root !'()*/"
    const findBucket = vi.fn().mockResolvedValue({ id: 'bucket' })
    const listMultipartUploads = vi.fn().mockResolvedValue([
      {
        id: 'folder-upload',
        key: `${prefix}folder/file.txt`,
      },
      {
        id: 'object-upload',
        key: `${prefix}file.txt`,
      },
    ])
    const storage = {
      asSuperUser: vi.fn(() => ({ findBucket })),
      db: { listMultipartUploads },
    }
    const handler = new S3ProtocolHandler(storage as never, 'tenant-id')

    const response = await handler.listMultipartUploads({
      Bucket: 'bucket',
      Prefix: prefix,
      Delimiter: '/',
      EncodingType: 'url',
    })

    expect(response.responseBody.ListMultipartUploadsResult).toMatchObject({
      Prefix: 'root%20%21%27%28%29%2A%2F',
      Delimiter: '%2F',
      CommonPrefixes: [{ Prefix: 'root%20%21%27%28%29%2A%2Ffolder%2F' }],
      Upload: [expect.objectContaining({ Key: 'root%20%21%27%28%29%2A%2Ffile.txt' })],
    })
  })

  it('removes a case-insensitive multipart prefix by length before finding folders', async () => {
    const findBucket = vi.fn().mockResolvedValue({ id: 'bucket' })
    const listMultipartUploads = vi.fn().mockResolvedValue([
      {
        id: 'folder-upload',
        key: 'root/photos/child/',
      },
    ])
    const storage = {
      asSuperUser: vi.fn(() => ({ findBucket })),
      db: { listMultipartUploads },
    }
    const handler = new S3ProtocolHandler(storage as never, 'tenant-id')

    const response = await handler.listMultipartUploads({
      Bucket: 'bucket',
      Prefix: 'Root/Photos/',
      Delimiter: '/',
    })

    expect(response.responseBody.ListMultipartUploadsResult.CommonPrefixes).toEqual([
      { Prefix: 'root/photos/child/' },
    ])
  })
})

describe('S3ProtocolHandler.deleteBucket', () => {
  it('reports a non-empty bucket with the S3 BucketNotEmpty error code', async () => {
    const storage = {
      deleteBucket: vi.fn().mockRejectedValue(ERRORS.BucketNotEmpty('bucket')),
    }
    const handler = new S3ProtocolHandler(storage as never, 'tenant-id')

    await expect(handler.deleteBucket('bucket')).rejects.toMatchObject({
      code: 'BucketNotEmpty',
      httpStatusCode: 409,
      message: 'The bucket you tried to delete is not empty',
    })
  })

  it('passes other errors through unchanged', async () => {
    const error = ERRORS.NoSuchBucket('bucket')
    const storage = { deleteBucket: vi.fn().mockRejectedValue(error) }
    const handler = new S3ProtocolHandler(storage as never, 'tenant-id')

    await expect(handler.deleteBucket('bucket')).rejects.toBe(error)
  })
})

describe('S3ProtocolHandler.abortMultipartUpload', () => {
  it('aborts multipart upload and deletes from database when backend succeeds', async () => {
    const uploadId = 'test-upload-id'
    const findMultipartUpload = vi.fn().mockResolvedValue({
      id: uploadId,
      version: 'test-version',
      user_metadata: { key: 'value' },
      metadata: { mimetype: 'text/plain' },
      bucket_id: 'bucket',
      key: 'object.txt',
    })
    const deleteMultipartUpload = vi.fn().mockResolvedValue(undefined)
    const testPermission = vi.fn().mockResolvedValue(undefined)
    const abortMultipartUpload = vi.fn().mockResolvedValue(undefined)
    const getKeyLocation = vi.fn(() => 'tenant-id/bucket/object.txt')

    const storage = {
      backend: {
        abortMultipartUpload,
      },
      db: {
        asSuperUser: vi.fn(() => ({
          findMultipartUpload,
          deleteMultipartUpload,
        })),
        testPermission,
      },
      location: {
        getKeyLocation,
      },
    }
    const handler = new S3ProtocolHandler(storage as never, 'tenant-id')

    const response = await handler.abortMultipartUpload({
      Bucket: 'bucket',
      Key: 'object.txt',
      UploadId: uploadId,
    })

    expect(response).toEqual({})
    expect(findMultipartUpload).toHaveBeenCalledWith(
      uploadId,
      'id,version,user_metadata,metadata,bucket_id,key'
    )
    expect(abortMultipartUpload).toHaveBeenCalled()
    expect(deleteMultipartUpload).toHaveBeenCalledWith(uploadId)
  })

  it('deletes from database when backend throws NoSuchUpload error', async () => {
    const uploadId = 'test-upload-id'
    const findMultipartUpload = vi.fn().mockResolvedValue({
      id: uploadId,
      version: 'test-version',
      user_metadata: null,
      metadata: null,
      bucket_id: 'bucket',
      key: 'object.txt',
    })
    const deleteMultipartUpload = vi.fn().mockResolvedValue(undefined)
    const testPermission = vi.fn().mockResolvedValue(undefined)
    const noSuchUploadError = {
      name: 'NoSuchUpload',
      message: 'The specified upload does not exist.',
      $metadata: {
        httpStatusCode: 404,
      },
    }
    const abortMultipartUpload = vi.fn().mockRejectedValue(noSuchUploadError)
    const getKeyLocation = vi.fn(() => 'tenant-id/bucket/object.txt')

    const storage = {
      backend: {
        abortMultipartUpload,
      },
      db: {
        asSuperUser: vi.fn(() => ({
          findMultipartUpload,
          deleteMultipartUpload,
        })),
        testPermission,
      },
      location: {
        getKeyLocation,
      },
    }
    const handler = new S3ProtocolHandler(storage as never, 'tenant-id')

    const response = await handler.abortMultipartUpload({
      Bucket: 'bucket',
      Key: 'object.txt',
      UploadId: uploadId,
    })

    expect(response).toEqual({})
    expect(findMultipartUpload).toHaveBeenCalledWith(
      uploadId,
      'id,version,user_metadata,metadata,bucket_id,key'
    )
    expect(abortMultipartUpload).toHaveBeenCalled()
    expect(deleteMultipartUpload).toHaveBeenCalledWith(uploadId)
  })

  it('throws error when backend throws non-NoSuchUpload error', async () => {
    const uploadId = 'test-upload-id'
    const findMultipartUpload = vi.fn().mockResolvedValue({
      id: uploadId,
      version: 'test-version',
      user_metadata: null,
      metadata: null,
      bucket_id: 'bucket',
      key: 'object.txt',
    })
    const deleteMultipartUpload = vi.fn().mockResolvedValue(undefined)
    const testPermission = vi.fn().mockResolvedValue(undefined)
    const otherError = {
      name: 'AccessDenied',
      message: 'Access Denied',
      $metadata: {
        httpStatusCode: 403,
      },
    }
    const abortMultipartUpload = vi.fn().mockRejectedValue(otherError)
    const getKeyLocation = vi.fn(() => 'tenant-id/bucket/object.txt')

    const storage = {
      backend: {
        abortMultipartUpload,
      },
      db: {
        asSuperUser: vi.fn(() => ({
          findMultipartUpload,
          deleteMultipartUpload,
        })),
        testPermission,
      },
      location: {
        getKeyLocation,
      },
    }
    const handler = new S3ProtocolHandler(storage as never, 'tenant-id')

    await expect(
      handler.abortMultipartUpload({
        Bucket: 'bucket',
        Key: 'object.txt',
        UploadId: uploadId,
      })
    ).rejects.toEqual(otherError)

    expect(findMultipartUpload).toHaveBeenCalledWith(
      uploadId,
      'id,version,user_metadata,metadata,bucket_id,key'
    )
    expect(abortMultipartUpload).toHaveBeenCalled()
    expect(deleteMultipartUpload).not.toHaveBeenCalled()
  })

  it.each([
    { bucket_id: 'other-bucket', key: 'object.txt', mismatch: 'bucket' },
    { bucket_id: 'bucket', key: 'other-key.txt', mismatch: 'key' },
  ])('returns NoSuchUpload when the UploadId belongs to a different $mismatch', async ({
    bucket_id,
    key,
  }) => {
    const uploadId = 'test-upload-id'
    const findMultipartUpload = vi.fn().mockResolvedValue({
      id: uploadId,
      version: 'test-version',
      user_metadata: null,
      metadata: null,
      bucket_id,
      key,
    })
    const deleteMultipartUpload = vi.fn().mockResolvedValue(undefined)
    const abortMultipartUpload = vi.fn().mockResolvedValue(undefined)

    const storage = {
      backend: {
        abortMultipartUpload,
      },
      db: {
        asSuperUser: vi.fn(() => ({
          findMultipartUpload,
          deleteMultipartUpload,
        })),
        testPermission: vi.fn().mockResolvedValue(undefined),
      },
      location: {
        getKeyLocation: vi.fn(() => 'tenant-id/bucket/object.txt'),
      },
    }
    const handler = new S3ProtocolHandler(storage as never, 'tenant-id')

    await expect(
      handler.abortMultipartUpload({
        Bucket: 'bucket',
        Key: 'object.txt',
        UploadId: uploadId,
      })
    ).rejects.toMatchObject({
      code: ErrorCode.NoSuchUpload,
      httpStatusCode: 404,
      message: 'Upload not found',
    })

    expect(abortMultipartUpload).not.toHaveBeenCalled()
    expect(deleteMultipartUpload).not.toHaveBeenCalled()
  })
})

describe('S3ProtocolHandler.completeMultiPartUpload', () => {
  it('returns NoSuchUpload when the UploadId belongs to a different key', async () => {
    const uploadId = 'test-upload-id'
    const findMultipartUpload = vi.fn().mockResolvedValue({
      id: uploadId,
      version: 'test-version',
      user_metadata: null,
      metadata: null,
      bucket_id: 'bucket',
      key: 'other-key.txt',
    })
    const deleteMultipartUpload = vi.fn().mockResolvedValue(undefined)
    const completeMultipartUpload = vi.fn()
    const headObject = vi.fn()

    const storage = {
      backend: {
        completeMultipartUpload,
        headObject,
      },
      db: {
        asSuperUser: vi.fn(() => ({
          findMultipartUpload,
          deleteMultipartUpload,
        })),
        testPermission: vi.fn().mockResolvedValue(undefined),
      },
      location: {
        getKeyLocation: vi.fn(),
      },
    }
    const handler = new S3ProtocolHandler(storage as never, 'tenant-id')

    await expect(
      handler.completeMultiPartUpload({
        Bucket: 'bucket',
        Key: 'object.txt',
        UploadId: uploadId,
      })
    ).rejects.toMatchObject({
      code: ErrorCode.NoSuchUpload,
      httpStatusCode: 404,
      message: 'Upload not found',
    })

    expect(completeMultipartUpload).not.toHaveBeenCalled()
    expect(headObject).not.toHaveBeenCalled()
    expect(deleteMultipartUpload).not.toHaveBeenCalled()
  })

  function createCompleteHandler() {
    const completeMultipartUpload = vi.fn().mockRejectedValue(new Error('backend reached'))
    const storage = {
      backend: { completeMultipartUpload },
      db: {
        asSuperUser: vi.fn(() => ({
          findMultipartUpload: vi.fn().mockResolvedValue({
            id: 'test-upload-id',
            version: 'test-version',
            user_metadata: null,
            metadata: null,
            bucket_id: 'bucket',
            key: 'object.txt',
          }),
        })),
        testPermission: vi.fn().mockResolvedValue(undefined),
      },
      location: {
        getKeyLocation: vi.fn(),
      },
    }
    const handler = new S3ProtocolHandler(storage as never, 'tenant-id')
    const complete = (list: number[]) =>
      handler.completeMultiPartUpload({
        Bucket: 'bucket',
        Key: 'object.txt',
        UploadId: 'test-upload-id',
        MultipartUpload: { Parts: list.map((n) => ({ PartNumber: n, ETag: 'etag' })) },
      })
    return { complete, completeMultipartUpload }
  }

  it.each([
    [[2, 1]],
    [[1, 1]],
    [[1, 2, 2]],
  ])('rejects part list %j with InvalidPartOrder before calling the backend', async (list) => {
    const { complete, completeMultipartUpload } = createCompleteHandler()

    await expect(complete(list)).rejects.toMatchObject({
      code: ErrorCode.InvalidPartOrder,
      httpStatusCode: 400,
    })

    expect(completeMultipartUpload).not.toHaveBeenCalled()
  })

  it.each([
    [[1, 3]],
    [[2, 10]],
  ])('passes numerically ascending parts %j to the backend', async (list) => {
    const { complete, completeMultipartUpload } = createCompleteHandler()

    await expect(complete(list)).rejects.toThrow('backend reached')

    expect(completeMultipartUpload).toHaveBeenCalledWith(
      expect.anything(),
      undefined,
      'test-upload-id',
      'test-version',
      list.map((PartNumber) => ({ PartNumber, ETag: 'etag' })),
      { removePrefix: true }
    )
  })
})

describe('S3ProtocolHandler.listParts', () => {
  it('returns NoSuchUpload when the UploadId belongs to a different key', async () => {
    const uploadId = 'test-upload-id'
    const findMultipartUpload = vi.fn().mockResolvedValue({
      id: uploadId,
      bucket_id: 'bucket',
      key: 'other-key.txt',
    })
    const listParts = vi.fn().mockResolvedValue([
      {
        part_number: 1,
        etag: '"etag"',
        created_at: '2026-09-14T00:00:00.000Z',
      },
    ])

    const storage = {
      db: {
        asSuperUser: vi.fn(() => ({
          findMultipartUpload,
        })),
        listParts,
      },
    }
    const handler = new S3ProtocolHandler(storage as never, 'tenant-id')

    await expect(
      handler.listParts({
        Bucket: 'bucket',
        Key: 'object.txt',
        UploadId: uploadId,
      })
    ).rejects.toMatchObject({
      code: ErrorCode.NoSuchUpload,
      httpStatusCode: 404,
      message: 'Upload not found',
    })

    expect(listParts).not.toHaveBeenCalled()
  })

  it('lists parts when Bucket and Key match the stored upload', async () => {
    const uploadId = 'test-upload-id'
    const findMultipartUpload = vi.fn().mockResolvedValue({
      id: uploadId,
      bucket_id: 'bucket',
      key: 'object.txt',
    })
    const listParts = vi.fn().mockResolvedValue([
      {
        part_number: 1,
        etag: '"etag"',
        created_at: '2026-09-14T00:00:00.000Z',
      },
    ])

    const storage = {
      db: {
        asSuperUser: vi.fn(() => ({
          findMultipartUpload,
        })),
        listParts,
      },
    }
    const handler = new S3ProtocolHandler(storage as never, 'tenant-id')

    const response = await handler.listParts({
      Bucket: 'bucket',
      Key: 'object.txt',
      UploadId: uploadId,
    })

    expect(findMultipartUpload).toHaveBeenCalledWith(uploadId, 'id,bucket_id,key')
    expect(listParts).toHaveBeenCalledWith(uploadId, {
      afterPart: undefined,
      maxParts: 1001,
    })
    expect(response).toEqual({
      responseBody: {
        ListPartsResult: {
          Bucket: 'bucket',
          Key: 'object.txt',
          UploadId: uploadId,
          PartNumberMarker: undefined,
          NextPartNumberMarker: undefined,
          MaxParts: 1000,
          IsTruncated: false,
          Part: [
            {
              PartNumber: 1,
              LastModified: '2026-09-14T00:00:00.000Z',
              ETag: '"etag"',
            },
          ],
        },
      },
    })
  })
})

describe('S3ProtocolHandler CopySource decoding', () => {
  const cases = [
    {
      name: 'an encoded source key',
      copySource: 'source-bucket/folder/my%20file%2B1%3F.txt',
      bucket: 'source-bucket',
      key: 'folder/my file+1?.txt',
    },
    {
      name: 'an encoded bucket with a leading slash',
      copySource: '/my%20bucket/file.txt',
      bucket: 'my bucket',
      key: 'file.txt',
    },
    {
      name: 'an encoded slash in the key',
      copySource: 'source-bucket/a%2Fb.txt',
      bucket: 'source-bucket',
      key: 'a/b.txt',
    },
    {
      name: 'an encoded bucket separator',
      copySource: 'source-bucket%2Ffolder%2Fmy%20file%2B1%3F.txt',
      bucket: 'source-bucket',
      key: 'folder/my file+1?.txt',
    },
    {
      name: 'an encoded leading slash and bucket separator',
      copySource: '%2Fsource-bucket%2Ffolder%2Fmy%20file%2B1%3F.txt',
      bucket: 'source-bucket',
      key: 'folder/my file+1?.txt',
    },
    {
      name: 'a literal percent escape decoded only once',
      copySource: 'source-bucket/a%252Fb.txt',
      bucket: 'source-bucket',
      key: 'a%2Fb.txt',
    },
    {
      name: 'a malformed percent escape',
      copySource: 'source-bucket/100%-done.txt',
      bucket: 'source-bucket',
      key: '100%-done.txt',
    },
    {
      name: 'valid and malformed escapes in different segments',
      copySource: 'source-bucket/folder%20name/100%-done.txt',
      bucket: 'source-bucket',
      key: 'folder name/100%-done.txt',
    },
  ]

  it.each(cases)('parses $name for CopyObject', async ({ copySource, bucket, key }) => {
    const copyObject = vi.fn().mockResolvedValue({
      eTag: '"etag"',
      lastModified: new Date('2026-06-25T00:00:00.000Z'),
    })
    const storage = {
      from: vi.fn(() => ({ copyObject })),
    }
    const handler = new S3ProtocolHandler(storage as never, 'tenant-id')

    await handler.copyObject({
      Bucket: 'dest',
      Key: 'copied.txt',
      CopySource: copySource,
    })

    expect(storage.from).toHaveBeenCalledWith(bucket)
    expect(copyObject).toHaveBeenCalledWith(expect.objectContaining({ sourceKey: key }))
  })

  it.each(cases)('parses $name for UploadPartCopy', async ({ copySource, bucket, key }) => {
    const findObject = vi.fn().mockRejectedValue(new Error('lookup stops the test'))
    const findMultipartUpload = vi.fn().mockResolvedValue({
      version: 'test-version',
      user_metadata: null,
      metadata: null,
      bucket_id: 'dest',
      key: 'copied.txt',
    })
    const storage = {
      db: { findObject, asSuperUser: vi.fn(() => ({ findMultipartUpload })) },
    }
    const handler = new S3ProtocolHandler(storage as never, 'tenant-id')

    await expect(
      handler.uploadPartCopy({
        Bucket: 'dest',
        Key: 'copied.txt',
        UploadId: 'upload-id',
        PartNumber: 1,
        CopySource: copySource,
      })
    ).rejects.toThrow('lookup stops the test')

    expect(findObject).toHaveBeenCalledWith(bucket, key, 'id,name,version,metadata')
  })
})

describe('S3ProtocolHandler.uploadPart', () => {
  it.each([
    { bucket_id: 'other-bucket', key: 'object.txt', mismatch: 'bucket' },
    { bucket_id: 'bucket', key: 'other-key.txt', mismatch: 'key' },
  ])('checks upload identity before looking up the bucket for a $mismatch mismatch', async ({
    bucket_id,
    key,
  }) => {
    const uploadId = 'test-upload-id'
    const findBucket = vi.fn().mockRejectedValue(ERRORS.NoSuchBucket('bucket'))
    const findMultipartUpload = vi.fn().mockResolvedValue({
      version: 'test-version',
      user_metadata: null,
      metadata: null,
      bucket_id,
      key,
    })
    const testPermission = vi.fn()
    const withTransaction = vi.fn()
    const uploadPart = vi.fn()

    const storage = {
      asSuperUser: vi.fn(() => ({
        findBucket,
      })),
      db: {
        tenantId: 'tenant-id',
        asSuperUser: vi.fn(() => ({
          findMultipartUpload,
          withTransaction,
        })),
        testPermission,
      },
      backend: {
        uploadPart,
      },
      location: {
        getKeyLocation: vi.fn(),
      },
    }
    const handler = new S3ProtocolHandler(storage as never, 'tenant-id')

    await expect(
      handler.uploadPart(
        {
          Bucket: 'bucket',
          Key: 'object.txt',
          UploadId: uploadId,
          PartNumber: 1,
          ContentLength: 1,
          Body: Readable.from(['a']),
        },
        {}
      )
    ).rejects.toMatchObject({
      code: ErrorCode.NoSuchUpload,
      httpStatusCode: 404,
      message: 'Upload not found',
    })

    expect(findBucket).not.toHaveBeenCalled()
    expect(testPermission).not.toHaveBeenCalled()
    expect(withTransaction).not.toHaveBeenCalled()
    expect(uploadPart).not.toHaveBeenCalled()
  })
})

describe('S3ProtocolHandler.uploadPartCopy', () => {
  it('returns NoSuchUpload before looking up the copy source or buckets when the UploadId belongs to a different key', async () => {
    const uploadId = 'test-upload-id'
    const findMultipartUpload = vi.fn().mockResolvedValue({
      version: 'test-version',
      user_metadata: null,
      metadata: null,
      bucket_id: 'bucket',
      key: 'other-key.txt',
    })
    const findObject = vi.fn().mockResolvedValue({ metadata: { size: 10 } })
    const withTransaction = vi.fn()

    const storage = {
      db: {
        findObject,
        asSuperUser: vi.fn(() => ({
          findMultipartUpload,
          withTransaction,
        })),
      },
    }
    const handler = new S3ProtocolHandler(storage as never, 'tenant-id')

    await expect(
      handler.uploadPartCopy({
        Bucket: 'bucket',
        Key: 'object.txt',
        UploadId: uploadId,
        PartNumber: 1,
        CopySource: 'private-bucket/secret.txt',
      })
    ).rejects.toMatchObject({ code: ErrorCode.NoSuchUpload, httpStatusCode: 404 })

    expect(findObject).not.toHaveBeenCalled()
    expect(withTransaction).not.toHaveBeenCalled()
  })
})
