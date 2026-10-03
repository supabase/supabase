import * as tus from 'tus-js-client'
import {
  describeAcceptance,
  encodePathSegments,
  getAcceptanceConfig,
  joinUrl,
} from '../support/config'
import { createAcceptanceHeaders, createRestClient, withAcceptanceHeaders } from '../support/http'
import {
  cleanupRestResources,
  createRestBucket,
  requireServiceKey,
  uniqueBucketName,
  uniqueObjectKey,
} from '../support/resources'

interface SignedUploadResponse {
  token: string
  url: string
}

const tusVersion = '1.0.0'

describeAcceptance(
  'TUS resumable upload contract',
  {
    destructive: true,
    profiles: ['core'],
    requires: ['tus'],
  },
  () => {
    it('uploads an object through the resumable endpoint', async () => {
      const config = getAcceptanceConfig()
      const bucketName = uniqueBucketName('tus')
      const objectKey = uniqueObjectKey('tus')
      const payload = Buffer.from(`acceptance-tus-${config.runId}`)

      try {
        await createRestBucket(bucketName)
        await new Promise<void>((resolve, reject) => {
          const upload = new tus.Upload(payload, {
            chunkSize: payload.length,
            endpoint: config.tusEndpoint,
            headers: withAcceptanceHeaders({
              authorization: `Bearer ${requireServiceKey(config)}`,
              'x-upsert': 'true',
            }),
            metadata: {
              bucketName,
              cacheControl: '60',
              contentType: 'text/plain',
              objectName: objectKey,
            },
            onError: reject,
            onShouldRetry: () => false,
            onSuccess: () => resolve(),
            uploadDataDuringCreation: false,
          })

          upload.start()
        })

        const client = createRestClient()
        const downloaded = await client.request(
          'GET',
          `/object/authenticated/${bucketName}/${encodePathSegments(objectKey)}`,
          {
            expectedStatus: 200,
            token: requireServiceKey(config),
          }
        )
        expect(downloaded.body).toBe(payload.toString())
      } finally {
        await cleanupRestResources(bucketName, [objectKey])
      }
    })

    it('resumes chunked uploads through POST, HEAD, and PATCH', async () => {
      const config = getAcceptanceConfig()
      const bucketName = uniqueBucketName('tusresume')
      const objectKey = uniqueObjectKey('tus-resume')
      const payload = Buffer.from(`acceptance-tus-resume-${config.runId}`)

      try {
        await createRestBucket(bucketName)

        await uploadTusInChunks({
          chunks: [payload.subarray(0, 10), payload.subarray(10)],
          endpoint: config.tusEndpoint,
          headers: {
            authorization: `Bearer ${requireServiceKey(config)}`,
            'x-upsert': 'true',
          },
          metadata: {
            bucketName,
            cacheControl: '60',
            contentType: 'text/plain',
            objectName: objectKey,
          },
          totalLength: payload.length,
        })

        const client = createRestClient()
        const downloaded = await client.request(
          'GET',
          `/object/authenticated/${bucketName}/${encodePathSegments(objectKey)}`,
          {
            expectedStatus: 200,
            token: requireServiceKey(config),
          }
        )
        expect(downloaded.body).toBe(payload.toString())
      } finally {
        await cleanupRestResources(bucketName, [objectKey])
      }
    })

    it('accepts upload data during creation and resumes from the returned offset', async () => {
      const config = getAcceptanceConfig()
      const bucketName = uniqueBucketName('tuscreate')
      const objectKey = uniqueObjectKey('tus-create-with-data')
      const payload = Buffer.from(`acceptance-tus-create-with-data-${config.runId}`)
      const initialChunk = payload.subarray(0, 11)
      const remainingChunk = payload.subarray(initialChunk.length)
      const headers = withAcceptanceHeaders({
        authorization: `Bearer ${requireServiceKey(config)}`,
        'x-upsert': 'true',
      })

      try {
        await createRestBucket(bucketName)

        const uploadUrl = await createTusUpload({
          body: initialChunk,
          endpoint: config.tusEndpoint,
          expectedOffset: initialChunk.length,
          headers,
          metadata: {
            bucketName,
            cacheControl: '60',
            contentType: 'text/plain',
            objectName: objectKey,
          },
          totalLength: payload.length,
        })

        let offset = await getTusOffset(uploadUrl, headers)
        expect(offset).toBe(initialChunk.length)

        let patched: Response | undefined
        try {
          patched = await fetch(uploadUrl, {
            body: remainingChunk as unknown as BodyInit,
            headers: createAcceptanceHeaders({
              ...headers,
              'content-type': 'application/offset+octet-stream',
              'tus-resumable': tusVersion,
              'upload-offset': offset.toString(),
            }),
            method: 'PATCH',
          })
          expect(patched.status).toBe(204)
          offset = Number(patched.headers.get('upload-offset') ?? 0)
        } finally {
          await patched?.body?.cancel()
        }

        expect(offset).toBe(payload.length)

        const client = createRestClient()
        const downloaded = await client.request(
          'GET',
          `/object/authenticated/${bucketName}/${encodePathSegments(objectKey)}`,
          {
            expectedStatus: 200,
            token: requireServiceKey(config),
          }
        )
        expect(downloaded.body).toBe(payload.toString())
      } finally {
        await cleanupRestResources(bucketName, [objectKey])
      }
    })

    it('rejects PATCH requests whose Upload-Offset does not match the stored offset', async () => {
      const config = getAcceptanceConfig()
      const bucketName = uniqueBucketName('tusoffset')
      const objectKey = uniqueObjectKey('tus-offset')
      const payload = Buffer.from(`acceptance-tus-offset-${config.runId}`)
      const firstChunk = payload.subarray(0, 10)
      const remainingChunk = payload.subarray(firstChunk.length)
      const requestHeaders = withAcceptanceHeaders({
        authorization: `Bearer ${requireServiceKey(config)}`,
        'x-upsert': 'true',
      })

      try {
        await createRestBucket(bucketName)

        const uploadUrl = await createTusUpload({
          endpoint: config.tusEndpoint,
          headers: requestHeaders,
          metadata: {
            bucketName,
            cacheControl: '60',
            contentType: 'text/plain',
            objectName: objectKey,
          },
          totalLength: payload.length,
        })

        let firstPatch: Response | undefined
        try {
          firstPatch = await fetch(uploadUrl, {
            body: firstChunk as unknown as BodyInit,
            headers: createAcceptanceHeaders({
              ...requestHeaders,
              'content-type': 'application/offset+octet-stream',
              'tus-resumable': tusVersion,
              'upload-offset': '0',
            }),
            method: 'PATCH',
          })
          expect(firstPatch.status).toBe(204)
          expect(Number(firstPatch.headers.get('upload-offset'))).toBe(firstChunk.length)
        } finally {
          await firstPatch?.body?.cancel()
        }

        let conflict: Response | undefined
        try {
          conflict = await fetch(uploadUrl, {
            body: remainingChunk as unknown as BodyInit,
            headers: createAcceptanceHeaders({
              ...requestHeaders,
              'content-type': 'application/offset+octet-stream',
              'tus-resumable': tusVersion,
              'upload-offset': '0',
            }),
            method: 'PATCH',
          })
          expect(conflict.status).toBe(409)
          expect(await conflict.text()).toContain('Upload-Offset conflict')
        } finally {
          if (conflict && !conflict.bodyUsed) {
            await conflict.body?.cancel()
          }
        }

        const offsetAfterConflict = await getTusOffset(uploadUrl, requestHeaders)
        expect(offsetAfterConflict).toBe(firstChunk.length)

        let finalPatch: Response | undefined
        try {
          finalPatch = await fetch(uploadUrl, {
            body: remainingChunk as unknown as BodyInit,
            headers: createAcceptanceHeaders({
              ...requestHeaders,
              'content-type': 'application/offset+octet-stream',
              'tus-resumable': tusVersion,
              'upload-offset': offsetAfterConflict.toString(),
            }),
            method: 'PATCH',
          })
          expect(finalPatch.status).toBe(204)
          expect(Number(finalPatch.headers.get('upload-offset'))).toBe(payload.length)
        } finally {
          await finalPatch?.body?.cancel()
        }

        const client = createRestClient()
        const downloaded = await client.request(
          'GET',
          `/object/authenticated/${bucketName}/${encodePathSegments(objectKey)}`,
          {
            expectedStatus: 200,
            token: requireServiceKey(config),
          }
        )
        expect(downloaded.body).toBe(payload.toString())
      } finally {
        await cleanupRestResources(bucketName, [objectKey])
      }
    })

    it('returns 404 or 410 for HEAD on a non-existent upload resource', async () => {
      const config = getAcceptanceConfig()
      const uploadId = Buffer.from(
        `${uniqueBucketName('tushead')}/${uniqueObjectKey('tus-missing-upload')}/missing-version`
      ).toString('base64url')
      const uploadUrl = joinUrl(config.tusEndpoint, uploadId)
      const headers = withAcceptanceHeaders({
        authorization: `Bearer ${requireServiceKey(config)}`,
      })

      let response: Response | undefined
      try {
        response = await fetch(uploadUrl, {
          headers: createAcceptanceHeaders({
            ...headers,
            'tus-resumable': tusVersion,
          }),
          method: 'HEAD',
        })
        expect([404, 410]).toContain(response.status)
      } finally {
        await response?.body?.cancel()
      }
    })

    it('rejects uploads targeting a non-existent bucket', async () => {
      const config = getAcceptanceConfig()
      const bucketName = uniqueBucketName('tusmissing')
      const objectKey = uniqueObjectKey('tus-missing-bucket')

      const created = await createTusUploadResponse({
        endpoint: config.tusEndpoint,
        headers: withAcceptanceHeaders({
          authorization: `Bearer ${requireServiceKey(config)}`,
          'x-upsert': 'true',
        }),
        metadata: {
          bucketName,
          cacheControl: '60',
          contentType: 'text/plain',
          objectName: objectKey,
        },
        totalLength: 1,
      })

      expect([400, 404]).toContain(created.status)
      expect(await created.text()).toContain('Bucket not found')
    })

    it('rejects uploads exceeding the bucket file size limit', async () => {
      const config = getAcceptanceConfig()
      const bucketName = uniqueBucketName('tuslimit')
      const objectKey = uniqueObjectKey('tus-limit')

      try {
        await createRestBucket(bucketName, { fileSizeLimit: 1 })

        const created = await createTusUploadResponse({
          endpoint: config.tusEndpoint,
          headers: withAcceptanceHeaders({
            authorization: `Bearer ${requireServiceKey(config)}`,
            'x-upsert': 'true',
          }),
          metadata: {
            bucketName,
            cacheControl: '60',
            contentType: 'text/plain',
            objectName: objectKey,
          },
          totalLength: 2,
        })

        expect([400, 413]).toContain(created.status)
        expect(await created.text()).toContain('Maximum size exceeded')
      } finally {
        await cleanupRestResources(bucketName, [objectKey])
      }
    })

    it('terminates abandoned uploads through DELETE', async () => {
      const config = getAcceptanceConfig()
      const bucketName = uniqueBucketName('tusdelete')
      const objectKey = uniqueObjectKey('tus-delete')
      const headers = {
        authorization: `Bearer ${requireServiceKey(config)}`,
        'x-upsert': 'true',
      }

      try {
        await createRestBucket(bucketName)

        const uploadUrl = await createTusUpload({
          endpoint: config.tusEndpoint,
          headers,
          metadata: {
            bucketName,
            cacheControl: '60',
            contentType: 'text/plain',
            objectName: objectKey,
          },
          totalLength: 32,
        })

        let deleted: Response | undefined
        try {
          deleted = await fetch(uploadUrl, {
            headers: createAcceptanceHeaders({
              ...headers,
              'tus-resumable': tusVersion,
            }),
            method: 'DELETE',
          })
          expect(deleted.status).toBe(204)
        } finally {
          await deleted?.body?.cancel()
        }

        let afterDelete: Response | undefined
        try {
          afterDelete = await fetch(uploadUrl, {
            headers: createAcceptanceHeaders({
              ...headers,
              'tus-resumable': tusVersion,
            }),
            method: 'HEAD',
          })
          expect([404, 410]).toContain(afterDelete.status)
        } finally {
          await afterDelete?.body?.cancel()
        }
      } finally {
        await cleanupRestResources(bucketName, [objectKey])
      }
    })

    it('uploads through the signed TUS endpoint without an authorization header', async () => {
      const config = getAcceptanceConfig()
      const client = createRestClient()
      const bucketName = uniqueBucketName('tussign')
      const objectKey = uniqueObjectKey('tus-signed')
      const payload = Buffer.from(`acceptance-tus-signed-${config.runId}`)

      try {
        await createRestBucket(bucketName)

        const signedUpload = await client.request<SignedUploadResponse>(
          'POST',
          `/object/upload/sign/${bucketName}/${encodePathSegments(objectKey)}`,
          {
            expectedStatus: 200,
            headers: {
              'content-type': 'text/plain',
              'x-upsert': 'true',
            },
            token: requireServiceKey(config),
          }
        )

        await uploadTusInChunks({
          chunks: [payload],
          endpoint: joinUrl(config.tusEndpoint, 'sign'),
          headers: {
            'x-signature': signedUpload.json?.token ?? '',
          },
          metadata: {
            bucketName,
            cacheControl: '60',
            contentType: 'text/plain',
            objectName: objectKey,
          },
          totalLength: payload.length,
        })

        const downloaded = await client.request(
          'GET',
          `/object/authenticated/${bucketName}/${encodePathSegments(objectKey)}`,
          {
            expectedStatus: 200,
            token: requireServiceKey(config),
          }
        )
        expect(downloaded.body).toBe(payload.toString())
      } finally {
        await cleanupRestResources(bucketName, [objectKey])
      }
    })
  }
)

async function uploadTusInChunks({
  chunks,
  endpoint,
  headers,
  metadata,
  totalLength,
}: {
  chunks: Uint8Array[]
  endpoint: string
  headers: Record<string, string>
  metadata: Record<string, string>
  totalLength: number
}) {
  const requestHeaders = withAcceptanceHeaders(headers)
  const uploadUrl = await createTusUpload({
    endpoint,
    headers: requestHeaders,
    metadata,
    totalLength,
  })
  let offset = await getTusOffset(uploadUrl, requestHeaders)
  expect(offset).toBe(0)

  for (const chunk of chunks) {
    let patched: Response | undefined
    try {
      patched = await fetch(uploadUrl, {
        body: chunk as unknown as BodyInit,
        headers: createAcceptanceHeaders({
          ...requestHeaders,
          'content-type': 'application/offset+octet-stream',
          'tus-resumable': tusVersion,
          'upload-offset': offset.toString(),
        }),
        method: 'PATCH',
      })
      expect(patched.status).toBe(204)
      offset = Number(patched.headers.get('upload-offset') ?? offset + chunk.byteLength)
      expect(offset).toBeGreaterThan(0)
    } finally {
      await patched?.body?.cancel()
    }
  }

  expect(offset).toBe(totalLength)
}

async function createTusUpload({
  body,
  endpoint,
  expectedOffset,
  headers,
  metadata,
  totalLength,
}: {
  body?: BodyInit
  endpoint: string
  expectedOffset?: number
  headers: Record<string, string>
  metadata: Record<string, string>
  totalLength: number
}) {
  let options: Response | undefined
  try {
    options = await fetch(endpoint, {
      headers: createAcceptanceHeaders({
        'tus-resumable': tusVersion,
      }),
      method: 'OPTIONS',
    })
    expect([200, 204]).toContain(options.status)
    if (options.headers.has('cf-ray')) {
      // api gateway does not proxy OPTIONS calls so the tus headers are not included
      expect(options.headers.has('tus-version')).toBe(false)
    } else {
      // without gateway tus-version should be set
      expect(options.headers.get('tus-version')).toContain(tusVersion)
    }
  } finally {
    await options?.body?.cancel()
  }

  let created: Response | undefined
  try {
    created = await createTusUploadResponse({
      body,
      endpoint,
      headers,
      metadata,
      totalLength,
    })
    expect(created.status).toBe(201)
    if (expectedOffset !== undefined) {
      expect(Number(created.headers.get('upload-offset') ?? 0)).toBe(expectedOffset)
    }

    const location = created.headers.get('location')
    expect(location).toBeTruthy()

    return new URL(location ?? '', endpoint).toString()
  } finally {
    await created?.body?.cancel()
  }
}

async function createTusUploadResponse({
  body,
  endpoint,
  headers,
  metadata,
  totalLength,
}: {
  body?: BodyInit
  endpoint: string
  headers: Record<string, string>
  metadata: Record<string, string>
  totalLength: number
}) {
  return fetch(endpoint, {
    body,
    headers: createAcceptanceHeaders({
      ...headers,
      ...(body ? { 'content-type': 'application/offset+octet-stream' } : {}),
      'tus-resumable': tusVersion,
      'upload-length': totalLength.toString(),
      'upload-metadata': encodeTusMetadata(metadata),
    }),
    method: 'POST',
  })
}

async function getTusOffset(uploadUrl: string, headers: Record<string, string>) {
  let head: Response | undefined
  try {
    head = await fetch(uploadUrl, {
      headers: createAcceptanceHeaders({
        ...headers,
        'tus-resumable': tusVersion,
      }),
      method: 'HEAD',
    })
    expect(head.status).toBe(200)

    return Number(head.headers.get('upload-offset') ?? 0)
  } finally {
    await head?.body?.cancel()
  }
}

function encodeTusMetadata(metadata: Record<string, string>) {
  return Object.entries(metadata)
    .map(([key, value]) => `${key} ${Buffer.from(value).toString('base64')}`)
    .join(',')
}
