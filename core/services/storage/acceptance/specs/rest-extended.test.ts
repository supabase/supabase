import {
  describeAcceptance,
  encodePathSegments,
  getAcceptanceConfig,
  joinUrl,
} from '../support/config'
import { createAcceptanceHeaders, createRestClient } from '../support/http'
import {
  cleanupRestResources,
  createRestBucket,
  requireServiceKey,
  uniqueBucketName,
  uniqueObjectKey,
  uploadRestObject,
} from '../support/resources'

interface BucketResponse {
  allowed_mime_types?: string[] | null
  file_size_limit?: number | string | null
  id: string
  name: string
  public: boolean
}

interface ObjectInfoResponse {
  bucket_id?: string
  cache_control?: string | null
  content_type?: string | null
  metadata?: Record<string, unknown> | null
  name?: string
}

interface ErrorResponse {
  code?: string
  error?: string
  message?: string
  statusCode?: string
}

interface SignedUrlBatchItem {
  error: string | null
  path: string
  signedURL: string | null
}

interface SignedUploadResponse {
  token: string
  url: string
}

interface ListObjectsV1Item {
  name: string
}

interface ListObjectsV2Response {
  folders: Array<{ name: string }>
  hasNext?: boolean
  nextCursor?: string
  objects: Array<{ name: string }>
}

describeAcceptance(
  'extended REST bucket and object contract',
  {
    destructive: true,
    profiles: ['core'],
  },
  () => {
    it('preserves legacy auth errors for malformed and missing JWTs on protected routes', async () => {
      const client = createRestClient()

      const malformedJwt = await client.request<ErrorResponse>('GET', '/bucket', {
        expectedStatus: 400,
        token: 'not-a-jwt',
      })
      expect(malformedJwt.json?.error).toBe('Unauthorized')
      expect(malformedJwt.json?.statusCode).toBe('403')

      const missingAuth = await client.request<ErrorResponse>('GET', '/bucket', {
        expectedStatus: 400,
      })
      expect(missingAuth.json).toMatchObject({
        error: 'Error',
        statusCode: '400',
      })
      expect(missingAuth.json?.message).toContain('authorization')
    })

    it('lists, empties, and deletes an empty bucket', async () => {
      const config = getAcceptanceConfig()
      const client = createRestClient()
      const token = requireServiceKey()
      const bucketName = uniqueBucketName('empty')

      try {
        await createRestBucket(bucketName)

        const legacyList = await client.request<ListObjectsV1Item[]>(
          'POST',
          `/object/list/${bucketName}`,
          {
            body: {
              limit: 100,
              prefix: `${config.resourcePrefix}/`,
              sortBy: {
                column: 'name',
                order: 'asc',
              },
            },
            expectedStatus: 200,
            token,
          }
        )
        expect(legacyList.json).toEqual([])

        const listV2 = await client.request<ListObjectsV2Response>(
          'POST',
          `/object/list-v2/${bucketName}`,
          {
            body: {
              limit: 100,
              prefix: `${config.resourcePrefix}/`,
              sortBy: { column: 'name', order: 'asc' },
              with_delimiter: false,
            },
            expectedStatus: 200,
            token,
          }
        )
        expect(listV2.json?.objects).toEqual([])
        expect(listV2.json?.folders).toEqual([])
        expect(listV2.json?.hasNext).toBe(false)
        expect(listV2.json?.nextCursor).toBeUndefined()

        await client.request('POST', `/bucket/${bucketName}/empty`, {
          expectedStatus: 200,
          token,
        })
        await client.request('DELETE', `/bucket/${bucketName}`, {
          expectedStatus: 200,
          token,
        })
      } finally {
        await cleanupRestResources(bucketName, [], client)
      }
    })

    it('covers public missing-object, signed-upload token, duplicate bucket, and MIME policy errors', async () => {
      const config = getAcceptanceConfig()
      const client = createRestClient()
      const token = requireServiceKey(config)
      const bucketName = uniqueBucketName('resterr')
      const objectKey = uniqueObjectKey('rest-policy')
      const missingKey = `${objectKey}.missing`

      try {
        await createRestBucket(bucketName, { isPublic: true })

        const duplicateBucket = await client.request<ErrorResponse>('POST', '/bucket', {
          body: {
            id: bucketName,
            name: bucketName,
          },
          expectedStatus: 400,
          token,
        })
        expect(duplicateBucket.json?.statusCode).toBe('409')

        const missingPublicInfo = await client.request<ErrorResponse>(
          'GET',
          `/object/info/public/${bucketName}/${encodePathSegments(missingKey)}`,
          { expectedStatus: 400 }
        )
        expect(missingPublicInfo.json?.statusCode).toBe('404')

        const missingPublicHead = await client.request(
          'HEAD',
          `/object/public/${bucketName}/${encodePathSegments(missingKey)}`,
          { expectedStatus: 400 }
        )
        expect(missingPublicHead.body).toBe('')

        const invalidSignedUpload = await fetch(
          joinUrl(
            config.baseUrl,
            `/object/upload/sign/${bucketName}/${encodePathSegments(objectKey)}?token=not-a-jwt`
          ),
          {
            body: 'invalid-token-body',
            headers: createAcceptanceHeaders({
              'content-type': 'text/plain',
            }),
            method: 'PUT',
          }
        )
        try {
          expect(invalidSignedUpload.status).toBe(400)
        } finally {
          await invalidSignedUpload.body?.cancel()
        }

        await client.request('PUT', `/bucket/${bucketName}`, {
          body: {
            allowed_mime_types: ['text/plain'],
            public: true,
          },
          expectedStatus: 200,
          token,
        })

        const wrongMimeUpload = await client.request<ErrorResponse>(
          'POST',
          `/object/${bucketName}/${encodePathSegments(objectKey)}`,
          {
            body: 'wrong mime',
            expectedStatus: 400,
            headers: {
              'content-type': 'image/png',
              'x-upsert': 'true',
            },
            token,
          }
        )
        expect(wrongMimeUpload.json).toMatchObject({
          error: 'invalid_mime_type',
          statusCode: '415',
        })
      } finally {
        await cleanupRestResources(bucketName, [objectKey], client)
      }
    })

    it('covers bucket metadata, public/info reads, signed upload, copy, move, update, bulk delete, and list-v1', async () => {
      const config = getAcceptanceConfig()
      const client = createRestClient()
      const token = requireServiceKey(config)
      const bucketName = uniqueBucketName('restx')
      const objectKey = uniqueObjectKey('restx')
      const signedUploadKey = uniqueObjectKey('signed-upload')
      const copyKey = uniqueObjectKey('copy')
      const movedKey = uniqueObjectKey('moved')
      const payload = `acceptance-rest-extended-${config.runId}`
      const updatedPayload = `${payload}-updated`
      const signedPayload = `${payload}-signed`
      const trackedKeys = [objectKey, signedUploadKey, copyKey, movedKey]
      const httpRetries = config.target === 'remote' ? 10 : 0

      try {
        await createRestBucket(bucketName, { isPublic: false })

        const bucket = await client.request<BucketResponse>('GET', `/bucket/${bucketName}`, {
          expectedStatus: 200,
          token,
        })
        expect(bucket.json?.id).toBe(bucketName)
        expect(bucket.json?.public).toBe(false)

        const listedBuckets = await client.request<BucketResponse[]>(
          'GET',
          `/bucket?search=${bucketName}`,
          {
            expectedStatus: 200,
            token,
          }
        )
        expect(listedBuckets.json?.map((listed) => listed.id)).toContain(bucketName)

        await client.request('PUT', `/bucket/${bucketName}`, {
          body: {
            allowed_mime_types: ['text/plain'],
            file_size_limit: 1_000_000,
            public: true,
          },
          expectedStatus: 200,
          token,
        })

        await uploadRestObject(bucketName, objectKey, payload)

        const publicRead = await client.request(
          'GET',
          `/object/public/${bucketName}/${encodePathSegments(objectKey)}`,
          { expectedStatus: 200 }
        )
        expect(publicRead.body).toBe(payload)

        const publicHead = await client.request(
          'HEAD',
          `/object/public/${bucketName}/${encodePathSegments(objectKey)}`,
          { expectedStatus: 200 }
        )
        expect(Number(publicHead.headers.get('content-length'))).toBe(payload.length)

        const publicInfo = await client.request<ObjectInfoResponse>(
          'GET',
          `/object/info/public/${bucketName}/${encodePathSegments(objectKey)}`,
          { expectedStatus: 200 }
        )
        expect(publicInfo.json?.name).toBe(objectKey)

        const authInfo = await client.request<ObjectInfoResponse>(
          'GET',
          `/object/info/authenticated/${bucketName}/${encodePathSegments(objectKey)}`,
          { expectedStatus: 200, token }
        )
        expect(authInfo.json?.bucket_id).toBe(bucketName)

        const objectHead = await client.request(
          'HEAD',
          `/object/${bucketName}/${encodePathSegments(objectKey)}`,
          {
            expectedStatus: 200,
            token,
          }
        )
        expect(objectHead.body).toBe('')
        expect(Number(objectHead.headers.get('content-length'))).toBe(payload.length)
        expect(objectHead.headers.get('etag')).toBeTruthy()

        const objectInfoHead = await client.request(
          'HEAD',
          `/object/info/${bucketName}/${encodePathSegments(objectKey)}`,
          {
            expectedStatus: 200,
            token,
          }
        )
        expect(objectInfoHead.body).toBe('')
        expect(objectInfoHead.headers.get('etag')).toBeTruthy()

        const objectInfo = await client.request<ObjectInfoResponse>(
          'GET',
          `/object/info/${bucketName}/${encodePathSegments(objectKey)}`,
          { expectedStatus: 200, token }
        )
        expect(objectInfo.json?.name).toBe(objectKey)

        const missingObjectHead = await client.request(
          'HEAD',
          `/object/${bucketName}/${encodePathSegments(`${objectKey}.missing`)}`,
          {
            expectedStatus: [400, 404],
            token,
          }
        )
        expect(missingObjectHead.body).toBe('')

        const legacyList = await client.request<ListObjectsV1Item[]>(
          'POST',
          `/object/list/${bucketName}`,
          {
            body: {
              limit: 100,
              prefix: `${config.resourcePrefix}/`,
              sortBy: {
                column: 'name',
                order: 'asc',
              },
            },
            expectedStatus: 200,
            token,
          }
        )
        expect(legacyList.json?.map((object) => object.name)).toContain(
          objectKey.replace(`${config.resourcePrefix}/`, '')
        )

        const batchSigned = await client.request<SignedUrlBatchItem[]>(
          'POST',
          `/object/sign/${bucketName}`,
          {
            body: {
              expiresIn: 60,
              paths: [objectKey, `${objectKey}.missing`],
            },
            expectedStatus: 200,
            token,
          }
        )
        expect(batchSigned.json?.find((item) => item.path === objectKey)?.signedURL).toBeTruthy()

        const signedUpload = await client.request<SignedUploadResponse>(
          'POST',
          `/object/upload/sign/${bucketName}/${encodePathSegments(signedUploadKey)}`,
          {
            expectedStatus: 200,
            headers: {
              'content-type': 'text/plain',
              'x-upsert': 'true',
            },
            token,
          }
        )
        expect(signedUpload.json?.token).toBeTruthy()

        let signedUploadResponse: Response | undefined
        try {
          signedUploadResponse = await fetch(
            joinUrl(config.baseUrl, signedUpload.json?.url ?? ''),
            {
              body: signedPayload,
              headers: createAcceptanceHeaders({
                'content-type': 'text/plain',
              }),
              method: 'PUT',
            }
          )
          expect(signedUploadResponse.status).toBe(200)
        } finally {
          await signedUploadResponse?.body?.cancel()
        }

        await client.request('PUT', `/object/${bucketName}/${encodePathSegments(objectKey)}`, {
          body: updatedPayload,
          expectedStatus: 200,
          headers: {
            'content-type': 'text/plain',
          },
          token,
        })

        const updated = await client.request(
          'GET',
          `/object/authenticated/${bucketName}/${encodePathSegments(objectKey)}`,
          { expectedStatus: 200, token }
        )
        expect(updated.body).toBe(updatedPayload)

        await client.request('POST', '/object/copy', {
          body: {
            bucketId: bucketName,
            destinationKey: copyKey,
            sourceKey: objectKey,
          },
          expectedStatus: 200,
          headers: {
            'x-upsert': 'true',
          },
          token,
        })

        await client.request('POST', '/object/move', {
          body: {
            bucketId: bucketName,
            destinationKey: movedKey,
            sourceKey: copyKey,
          },
          expectedStatus: 200,
          token,
        })

        const moved = await client.request(
          'GET',
          `/object/authenticated/${bucketName}/${encodePathSegments(movedKey)}`,
          { expectedStatus: 200, token }
        )
        expect(moved.body).toBe(updatedPayload)

        await client.request(
          'GET',
          `/object/authenticated/${bucketName}/${encodePathSegments(copyKey)}`,
          { expectedStatus: [400, 404], token, retries: httpRetries }
        )

        const deleted = await client.request<unknown[]>('DELETE', `/object/${bucketName}`, {
          body: {
            prefixes: [signedUploadKey, movedKey],
          },
          expectedStatus: 200,
          token,
        })
        expect(deleted.json?.length).toBe(2)

        await client.request('DELETE', `/object/${bucketName}/${encodePathSegments(objectKey)}`, {
          expectedStatus: 200,
          token,
        })

        await client.request(
          'GET',
          `/object/authenticated/${bucketName}/${encodePathSegments(objectKey)}`,
          { expectedStatus: [400, 404], token, retries: httpRetries }
        )

        const missingHead = await client.request(
          'HEAD',
          `/object/${bucketName}/${encodePathSegments(objectKey)}`,
          { expectedStatus: [400, 404], token }
        )
        expect(missingHead.body).toBe('')
      } finally {
        await cleanupRestResources(bucketName, trackedKeys, client)
      }
    })

    it('covers metadata round trips, duplicate protection, pagination, search, and cross-bucket object mutations', async () => {
      const config = getAcceptanceConfig()
      const client = createRestClient()
      const token = requireServiceKey(config)
      const sourceBucket = uniqueBucketName('restdb')
      const destinationBucket = uniqueBucketName('restdst')
      const prefix = uniqueObjectKey('db-prefix').replace(/\.txt$/, '')
      const alphaKey = `${prefix}/alpha.txt`
      const bravoKey = `${prefix}/bravo.txt`
      const nestedKey = `${prefix}/nested/charlie.txt`
      const zuluKey = `${prefix}/zulu.txt`
      const copiedKey = `${prefix}/copied-alpha.txt`
      const movedKey = `${prefix}/moved-bravo.txt`
      const sourceKeys = [alphaKey, bravoKey, nestedKey, zuluKey]
      const destinationKeys = [copiedKey, movedKey]
      const alphaMetadata = {
        acceptance: 'rest-db',
        runId: config.runId,
        nested: { value: 'alpha' },
      }
      const httpRetries = config.target === 'remote' ? 10 : 0

      try {
        await createRestBucket(sourceBucket, { isPublic: false })
        await createRestBucket(destinationBucket, { isPublic: false })

        await client.request('POST', `/object/${sourceBucket}/${encodePathSegments(alphaKey)}`, {
          body: 'alpha-v1',
          expectedStatus: 200,
          headers: {
            'content-type': 'text/plain',
            'x-metadata': encodeMetadata(alphaMetadata),
            'x-upsert': 'true',
          },
          token,
        })

        const duplicate = await client.request<ErrorResponse>(
          'POST',
          `/object/${sourceBucket}/${encodePathSegments(alphaKey)}`,
          {
            body: 'alpha-duplicate',
            expectedStatus: 400,
            headers: {
              'content-type': 'text/plain',
            },
            token,
          }
        )
        expect(duplicate.json?.error).toBe('Duplicate')
        expect(duplicate.json?.statusCode).toBe('409')

        const alphaAfterDuplicate = await client.request(
          'GET',
          `/object/authenticated/${sourceBucket}/${encodePathSegments(alphaKey)}`,
          { expectedStatus: 200, token }
        )
        expect(alphaAfterDuplicate.body).toBe('alpha-v1')

        const alphaInfo = await client.request<ObjectInfoResponse>(
          'GET',
          `/object/info/authenticated/${sourceBucket}/${encodePathSegments(alphaKey)}`,
          { expectedStatus: 200, token }
        )
        expect(alphaInfo.json?.metadata).toMatchObject(alphaMetadata)

        await uploadRestObject(sourceBucket, bravoKey, 'bravo-v1')
        await uploadRestObject(sourceBucket, nestedKey, 'charlie-v1')
        await uploadRestObject(sourceBucket, zuluKey, 'zulu-v1')

        const firstPage = await client.request<ListObjectsV2Response>(
          'POST',
          `/object/list-v2/${sourceBucket}`,
          {
            body: {
              limit: 2,
              prefix: `${prefix}/`,
              sortBy: { column: 'name', order: 'asc' },
              with_delimiter: false,
            },
            expectedStatus: 200,
            token,
          }
        )
        expect(firstPage.json?.objects.map((object) => object.name)).toEqual([alphaKey, bravoKey])
        expect(firstPage.json?.hasNext).toBe(true)
        expect(firstPage.json?.nextCursor).toBeTruthy()

        const secondPage = await client.request<ListObjectsV2Response>(
          'POST',
          `/object/list-v2/${sourceBucket}`,
          {
            body: {
              cursor: firstPage.json?.nextCursor,
              limit: 2,
              prefix: `${prefix}/`,
              sortBy: { column: 'name', order: 'asc' },
              with_delimiter: false,
            },
            expectedStatus: 200,
            token,
          }
        )
        expect(secondPage.json?.objects.map((object) => object.name)).toEqual([nestedKey, zuluKey])
        expect(secondPage.json?.hasNext).toBe(false)

        const delimited = await client.request<ListObjectsV2Response>(
          'POST',
          `/object/list-v2/${sourceBucket}`,
          {
            body: {
              limit: 100,
              prefix: `${prefix}/`,
              sortBy: { column: 'name', order: 'asc' },
              with_delimiter: true,
            },
            expectedStatus: 200,
            token,
          }
        )
        expect(delimited.json?.objects.map((object) => object.name)).toEqual([
          alphaKey,
          bravoKey,
          zuluKey,
        ])
        expect(delimited.json?.folders.map((folder) => folder.name)).toEqual([`${prefix}/nested/`])

        const descending = await client.request<ListObjectsV2Response>(
          'POST',
          `/object/list-v2/${sourceBucket}`,
          {
            body: {
              limit: 1,
              prefix: `${prefix}/`,
              sortBy: { column: 'name', order: 'desc' },
              with_delimiter: false,
            },
            expectedStatus: 200,
            token,
          }
        )
        expect(descending.json?.objects.map((object) => object.name)).toEqual([zuluKey])

        const searched = await client.request<ListObjectsV1Item[]>(
          'POST',
          `/object/list/${sourceBucket}`,
          {
            body: {
              limit: 1,
              offset: 0,
              prefix,
              search: 'bravo',
              sortBy: {
                column: 'name',
                order: 'asc',
              },
            },
            expectedStatus: 200,
            token,
          }
        )
        expect(searched.json?.map((object) => object.name)).toEqual(['bravo.txt'])

        const conflictingMove = await client.request<ErrorResponse>('POST', '/object/move', {
          body: {
            bucketId: sourceBucket,
            destinationKey: zuluKey,
            sourceKey: alphaKey,
          },
          expectedStatus: 400,
          token,
        })
        expect(conflictingMove.json?.error).toBe('Duplicate')
        expect(conflictingMove.json?.statusCode).toBe('409')

        const alphaAfterConflictingMove = await client.request(
          'GET',
          `/object/authenticated/${sourceBucket}/${encodePathSegments(alphaKey)}`,
          { expectedStatus: 200, token }
        )
        expect(alphaAfterConflictingMove.body).toBe('alpha-v1')

        await client.request('POST', '/object/copy', {
          body: {
            bucketId: sourceBucket,
            copyMetadata: false,
            destinationBucket,
            destinationKey: copiedKey,
            metadata: {
              cacheControl: 'max-age=77',
              mimetype: 'text/plain',
            },
            sourceKey: alphaKey,
          },
          expectedStatus: 200,
          headers: {
            'x-metadata': encodeMetadata({ copied: 'yes', runId: config.runId }),
            'x-upsert': 'true',
          },
          token,
        })

        const copied = await client.request(
          'GET',
          `/object/authenticated/${destinationBucket}/${encodePathSegments(copiedKey)}`,
          { expectedStatus: 200, token }
        )
        expect(copied.body).toBe('alpha-v1')

        const copiedInfo = await client.request<ObjectInfoResponse>(
          'GET',
          `/object/info/authenticated/${destinationBucket}/${encodePathSegments(copiedKey)}`,
          { expectedStatus: 200, token }
        )
        expect(copiedInfo.json?.metadata).toMatchObject({ copied: 'yes', runId: config.runId })

        await client.request('POST', '/object/move', {
          body: {
            bucketId: sourceBucket,
            destinationBucket,
            destinationKey: movedKey,
            sourceKey: bravoKey,
          },
          expectedStatus: 200,
          token,
        })

        await client.request(
          'GET',
          `/object/authenticated/${sourceBucket}/${encodePathSegments(bravoKey)}`,
          { expectedStatus: [400, 404], token, retries: httpRetries }
        )

        const moved = await client.request(
          'GET',
          `/object/authenticated/${destinationBucket}/${encodePathSegments(movedKey)}`,
          { expectedStatus: 200, token }
        )
        expect(moved.body).toBe('bravo-v1')
      } finally {
        await cleanupRestResources(sourceBucket, sourceKeys, client)
        await cleanupRestResources(destinationBucket, destinationKeys, client)
      }
    })

    it('serves updated cache-control after copy overwrites object metadata', async () => {
      const client = createRestClient()
      const token = requireServiceKey()
      const bucketName = uniqueBucketName('copycache')
      const objectKey = uniqueObjectKey('copy-cache')
      const initialCacheControl = 'max-age=60'
      const updatedCacheControl = 'max-age=604800'
      const payload = 'cache-control-copy-body'

      try {
        await createRestBucket(bucketName, { isPublic: false })

        await client.request('POST', `/object/${bucketName}/${encodePathSegments(objectKey)}`, {
          body: payload,
          expectedStatus: 200,
          headers: {
            'cache-control': initialCacheControl,
            'content-type': 'text/plain',
            'x-upsert': 'true',
          },
          token,
        })

        const beforeCopy = await client.request(
          'GET',
          `/object/authenticated/${bucketName}/${encodePathSegments(objectKey)}`,
          { expectedStatus: 200, token }
        )
        expect(beforeCopy.body).toBe(payload)
        expect(cacheControlDirectives(beforeCopy.headers)).toContain(initialCacheControl)

        await client.request('POST', '/object/copy', {
          body: {
            bucketId: bucketName,
            copyMetadata: false,
            destinationKey: objectKey,
            metadata: {
              cacheControl: updatedCacheControl,
            },
            sourceKey: objectKey,
          },
          expectedStatus: 200,
          headers: {
            'x-upsert': 'true',
          },
          token,
        })

        const afterCopy = await client.request(
          'GET',
          `/object/authenticated/${bucketName}/${encodePathSegments(objectKey)}`,
          { expectedStatus: 200, token }
        )
        expect(afterCopy.body).toBe(payload)
        expect(cacheControlDirectives(afterCopy.headers)).toContain(updatedCacheControl)
        expect(afterCopy.headers.get('content-type')).toBe('text/plain')

        const info = await client.request<ObjectInfoResponse>(
          'GET',
          `/object/info/authenticated/${bucketName}/${encodePathSegments(objectKey)}`,
          { expectedStatus: 200, token }
        )
        expect(info.json?.cache_control).toBe(updatedCacheControl)
        expect(info.json?.content_type).toBe('text/plain')
      } finally {
        await cleanupRestResources(bucketName, [objectKey], client)
      }
    })

    it('enforces bucket file-size limits on REST uploads', async () => {
      const config = getAcceptanceConfig()
      const client = createRestClient()
      const token = requireServiceKey(config)
      const bucketName = uniqueBucketName('limit')
      const objectKey = uniqueObjectKey('too-large')

      try {
        await createRestBucket(bucketName, { fileSizeLimit: 10 })

        const response = await client.request<ErrorResponse>(
          'POST',
          `/object/${bucketName}/${encodePathSegments(objectKey)}`,
          {
            body: '12345678901234567890',
            expectedStatus: [400, 413],
            headers: {
              'content-type': 'text/plain',
              'x-upsert': 'true',
            },
            token,
          }
        )
        expect(response.json?.statusCode).toBe('413')
        expect(response.json?.error).toBe('Payload too large')
      } finally {
        await cleanupRestResources(bucketName, [objectKey], client)
      }
    })

    it('round-trips special-character object names through REST get and list routes', async () => {
      const config = getAcceptanceConfig()
      const client = createRestClient()
      const token = requireServiceKey(config)
      const bucketName = uniqueBucketName('special')
      const prefix = `${config.resourcePrefix}/special`
      const specialFileName = 'special file @+$,;=?.txt'
      const objectKey = `${prefix}/${specialFileName}`
      const payload = `acceptance-special-${config.runId}`

      try {
        await createRestBucket(bucketName)
        await uploadRestObject(bucketName, objectKey, payload)

        const downloaded = await client.request(
          'GET',
          `/object/authenticated/${bucketName}/${encodePathSegments(objectKey)}`,
          { expectedStatus: 200, token }
        )
        expect(downloaded.body).toBe(payload)

        const legacyList = await client.request<ListObjectsV1Item[]>(
          'POST',
          `/object/list/${bucketName}`,
          {
            body: {
              limit: 100,
              prefix,
              sortBy: {
                column: 'name',
                order: 'asc',
              },
            },
            expectedStatus: 200,
            token,
          }
        )
        expect(legacyList.json?.map((object) => object.name)).toContain(specialFileName)

        const listV2 = await client.request<ListObjectsV2Response>(
          'POST',
          `/object/list-v2/${bucketName}`,
          {
            body: {
              limit: 100,
              prefix: `${prefix}/`,
              sortBy: { column: 'name', order: 'asc' },
              with_delimiter: false,
            },
            expectedStatus: 200,
            token,
          }
        )
        expect(listV2.json?.objects.map((object) => object.name)).toContain(objectKey)
      } finally {
        await cleanupRestResources(bucketName, [objectKey], client)
      }
    })
  }
)

function encodeMetadata(metadata: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(metadata)).toString('base64')
}

// Gateway may prepend directives such as `public` to the origin value.
function cacheControlDirectives(headers: Headers): string[] {
  return (
    headers
      .get('cache-control')
      ?.split(',')
      .map((directive) => directive.trim()) ?? []
  )
}
