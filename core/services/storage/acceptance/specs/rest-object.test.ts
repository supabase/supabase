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

interface CreateObjectResponse {
  Id?: string
  Key: string
}

interface SignedUploadUrlResponse {
  url: string
  token: string
}

interface ListObjectsV2Response {
  folders: Array<{ name: string }>
  hasNext?: boolean
  nextCursor?: string
  objects: Array<{ name: string }>
}

interface SignedUrlResponse {
  signedURL: string
}

describeAcceptance(
  'REST bucket and object contract',
  {
    destructive: true,
    profiles: ['smoke', 'core'],
  },
  () => {
    it('creates a bucket, uploads, reads, lists, signs, and deletes an object', async () => {
      const config = getAcceptanceConfig()
      const client = createRestClient()
      const bucketName = uniqueBucketName('rest')
      const objectKey = uniqueObjectKey('rest')
      const encodedObjectKey = encodePathSegments(objectKey)
      const payload = `acceptance-rest-${config.runId}`
      const objectKeys = [objectKey]

      try {
        await createRestBucket(bucketName, { isPublic: false })

        const upload = await client.request<CreateObjectResponse>(
          'POST',
          `/object/${bucketName}/${encodedObjectKey}`,
          {
            body: payload,
            expectedStatus: 200,
            headers: {
              'content-type': 'text/plain',
              'x-upsert': 'true',
            },
            token: requireServiceKey(config),
          }
        )

        expect(upload.json?.Key).toBe(`${bucketName}/${objectKey}`)
        expect(upload.json?.Id).toBeTruthy()

        const downloaded = await client.request(
          'GET',
          `/object/authenticated/${bucketName}/${encodedObjectKey}`,
          {
            expectedStatus: 200,
            token: requireServiceKey(config),
          }
        )
        expect(downloaded.body).toBe(payload)

        const listed = await client.request<ListObjectsV2Response>(
          'POST',
          `/object/list-v2/${bucketName}`,
          {
            body: {
              limit: 100,
              prefix: `${config.resourcePrefix}/`,
              with_delimiter: false,
            },
            expectedStatus: 200,
            token: requireServiceKey(config),
          }
        )
        expect(listed.json?.objects.map((object) => object.name)).toContain(objectKey)
        expect(listed.json?.folders).toEqual([])

        const signed = await client.request<SignedUrlResponse>(
          'POST',
          `/object/sign/${bucketName}/${encodedObjectKey}`,
          {
            body: {
              expiresIn: 60,
            },
            expectedStatus: 200,
            token: requireServiceKey(config),
          }
        )
        const signedUrl = joinUrl(config.baseUrl, signed.json?.signedURL ?? '')
        let signedResponse: Response | undefined
        try {
          signedResponse = await fetch(signedUrl, {
            headers: createAcceptanceHeaders(),
          })
          expect(signedResponse.status).toBe(200)
          expect(await signedResponse.text()).toBe(payload)
        } finally {
          if (signedResponse && !signedResponse.bodyUsed) {
            await signedResponse.body?.cancel()
          }
        }
      } finally {
        await cleanupRestResources(bucketName, objectKeys, client)
      }
    })
  }
)

describeAcceptance(
  'Signed URL scope isolation',
  {
    destructive: true,
    profiles: ['core'],
  },
  () => {
    it('does not allow a download token to upload, nor an upload token to download', async () => {
      const config = getAcceptanceConfig()
      const client = createRestClient()
      const bucketName = uniqueBucketName('scope')
      const objectKey = uniqueObjectKey('scope')
      const encodedObjectKey = encodePathSegments(objectKey)
      const payload = `acceptance-scope-${config.runId}`
      const objectKeys = [objectKey]

      try {
        await createRestBucket(bucketName, { isPublic: false })
        await uploadRestObject(bucketName, objectKey, payload)

        // Mint a download (read) signed URL and pull its token out of the query string
        const signedDownload = await client.request<SignedUrlResponse>(
          'POST',
          `/object/sign/${bucketName}/${encodedObjectKey}`,
          {
            body: { expiresIn: 60 },
            expectedStatus: 200,
            token: requireServiceKey(config),
          }
        )
        const downloadToken = new URL(
          joinUrl(config.baseUrl, signedDownload.json?.signedURL ?? '')
        ).searchParams.get('token')
        expect(downloadToken).toBeTruthy()

        // Mint an upload (write) signed URL and grab its token
        const signedUpload = await client.request<SignedUploadUrlResponse>(
          'POST',
          `/object/upload/sign/${bucketName}/${encodedObjectKey}`,
          {
            expectedStatus: 200,
            headers: { 'x-upsert': 'true' },
            token: requireServiceKey(config),
          }
        )
        const uploadToken = signedUpload.json?.token
        expect(uploadToken).toBeTruthy()

        // The download token must be rejected by the upload endpoint
        await client.request(
          'PUT',
          `/object/upload/sign/${bucketName}/${encodedObjectKey}?token=${downloadToken}`,
          {
            body: 'should-not-be-written',
            expectedStatus: 400,
            headers: { 'content-type': 'text/plain' },
          }
        )

        // The upload token must be rejected by the download endpoint
        await client.request(
          'GET',
          `/object/sign/${bucketName}/${encodedObjectKey}?token=${uploadToken}`,
          {
            expectedStatus: 400,
          }
        )

        // Sanity check: each token still works for its own scope
        await client.request(
          'GET',
          `/object/sign/${bucketName}/${encodedObjectKey}?token=${downloadToken}`,
          {
            expectedStatus: 200,
          }
        )
        await client.request(
          'PUT',
          `/object/upload/sign/${bucketName}/${encodedObjectKey}?token=${uploadToken}`,
          {
            body: payload,
            expectedStatus: 200,
            headers: { 'content-type': 'text/plain' },
          }
        )
      } finally {
        await cleanupRestResources(bucketName, objectKeys, client)
      }
    })
  }
)

describeAcceptance(
  'REST path edge contract',
  {
    destructive: true,
    profiles: ['core'],
  },
  () => {
    const pathEdgeIt = getAcceptanceConfig().supportsPathEdges ? it : it.skip

    pathEdgeIt(
      'preserves exact empty-segment object names in list-v2 when the backend accepts them',
      async () => {
        const bucketName = uniqueBucketName('path')
        const keys = [`${uniqueObjectKey('a')}/child.txt`, `${uniqueObjectKey('a')}///child.txt`]
        const client = createRestClient()

        try {
          await createRestBucket(bucketName)
          await uploadRestObject(bucketName, keys[0], 'one')
          await uploadRestObject(bucketName, keys[1], 'two')

          const listed = await client.request<ListObjectsV2Response>(
            'POST',
            `/object/list-v2/${bucketName}`,
            {
              body: {
                limit: 100,
                prefix: '',
                with_delimiter: false,
              },
              expectedStatus: 200,
              token: requireServiceKey(),
            }
          )

          expect(listed.json?.objects.map((object) => object.name)).toEqual(
            expect.arrayContaining(keys)
          )
        } finally {
          await cleanupRestResources(bucketName, keys, client)
        }
      }
    )
  }
)
