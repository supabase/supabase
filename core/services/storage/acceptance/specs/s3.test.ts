import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CopyObjectCommand,
  CreateBucketCommand,
  CreateMultipartUploadCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetBucketLocationCommand,
  GetBucketVersioningCommand,
  GetObjectCommand,
  GetObjectTaggingCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListBucketsCommand,
  ListMultipartUploadsCommand,
  ListObjectsCommand,
  ListObjectsV2Command,
  ListPartsCommand,
  PutObjectCommand,
  UploadPartCommand,
  UploadPartCopyCommand,
} from '@aws-sdk/client-s3'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { describeAcceptance } from '../support/config'
import { createAcceptanceHeaders } from '../support/http'
import { uniqueBucketName, uniqueObjectKey } from '../support/resources'
import { cleanupS3Bucket, createAcceptanceS3Client } from '../support/s3'

describeAcceptance(
  'S3 protocol contract',
  {
    destructive: true,
    profiles: ['smoke', 'core'],
  },
  () => {
    it('creates a bucket, writes, reads, lists, copies, and deletes an object', async () => {
      const client = createAcceptanceS3Client()
      const bucketName = uniqueBucketName('s3')
      const key = uniqueObjectKey('s3')
      const copyKey = uniqueObjectKey('s3-copy')
      const payload = Buffer.from('acceptance-s3-object')
      const metadata = {
        acceptance: 's3',
        contract: 'metadata',
      }

      try {
        const created = await client.send(
          new CreateBucketCommand({
            ACL: 'public-read',
            Bucket: bucketName,
          })
        )
        expect(created.Location).toBeTruthy()

        await client.send(
          new PutObjectCommand({
            Body: payload,
            Bucket: bucketName,
            ContentType: 'text/plain',
            Key: key,
            Metadata: metadata,
          })
        )

        const head = await client.send(
          new HeadObjectCommand({
            Bucket: bucketName,
            Key: key,
          })
        )
        expect(head.ContentLength).toBe(payload.length)
        expect(head.ContentType).toBe('text/plain')
        expect(head.Metadata).toMatchObject(metadata)

        const downloaded = await client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
          })
        )
        expect(await downloaded.Body?.transformToString()).toBe(payload.toString())
        expect(downloaded.Metadata).toMatchObject(metadata)

        // TODO: test that tags can be added and retrieved once tag support is implemented
        const tagging = await client.send(
          new GetObjectTaggingCommand({
            Bucket: bucketName,
            Key: key,
          })
        )
        expect(tagging.TagSet ?? []).toEqual([])

        const listed = await client.send(
          new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: key.split('/')[0],
          })
        )
        expect(listed.Contents?.map((object) => object.Key)).toContain(key)

        await client.send(
          new CopyObjectCommand({
            Bucket: bucketName,
            CopySource: `${bucketName}/${key}`,
            Key: copyKey,
          })
        )
        const copied = await client.send(
          new HeadObjectCommand({
            Bucket: bucketName,
            Key: copyKey,
          })
        )
        expect(copied.ContentLength).toBe(payload.length)

        const existingDelete = await client.send(
          new DeleteObjectCommand({ Bucket: bucketName, Key: key })
        )
        expect(existingDelete.$metadata.httpStatusCode).toBe(204)
        const copiedDelete = await client.send(
          new DeleteObjectCommand({ Bucket: bucketName, Key: copyKey })
        )
        expect(copiedDelete.$metadata.httpStatusCode).toBe(204)
        const missingDelete = await client.send(
          new DeleteObjectCommand({ Bucket: bucketName, Key: uniqueObjectKey('missing', 'txt') })
        )
        expect(missingDelete.$metadata.httpStatusCode).toBe(204)
      } finally {
        await cleanupS3Bucket(client, bucketName)
        client.destroy()
      }
    })

    it('uploads an object through a presigned POST form', async () => {
      const client = createAcceptanceS3Client()
      const bucketName = uniqueBucketName('s3post')
      const key = uniqueObjectKey('post-form')
      const payload = Buffer.from('acceptance-s3-post-form')

      try {
        await client.send(new CreateBucketCommand({ Bucket: bucketName }))

        const signedPost = await createPresignedPost(client, {
          Bucket: bucketName,
          Expires: 300,
          Fields: {
            'Content-Type': 'text/plain',
            'X-Amz-Meta-Acceptance': 'post-form',
          },
          Key: key,
        })

        const formData = new FormData()
        for (const [field, value] of Object.entries(signedPost.fields)) {
          formData.set(field, value)
        }
        formData.set('file', new Blob([payload], { type: 'text/plain' }), 'post-form.txt')

        let response: Response | undefined
        try {
          response = await fetch(signedPost.url, {
            body: formData,
            headers: createAcceptanceHeaders(),
            method: 'POST',
          })
          expect(response.status).toBe(200)
        } finally {
          await response?.body?.cancel()
        }

        const head = await client.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }))
        expect(head.ContentLength).toBe(payload.length)
        expect(head.ContentType).toBe('text/plain')
        expect(head.Metadata).toMatchObject({ acceptance: 'post-form' })
      } finally {
        await cleanupS3Bucket(client, bucketName)
        client.destroy()
      }
    })

    it('completes a multipart upload and exposes uploaded parts', async () => {
      const client = createAcceptanceS3Client()
      const bucketName = uniqueBucketName('s3mp')
      const key = uniqueObjectKey('multipart', 'bin')
      const partPayloads = [Buffer.alloc(5 * 1024 * 1024, 7), Buffer.alloc(1024 * 1024, 8)]
      const totalPayloadLength = partPayloads.reduce((total, payload) => total + payload.length, 0)
      const metadata = {
        acceptance: 'multipart',
        contract: 'metadata',
      }

      try {
        await client.send(new CreateBucketCommand({ Bucket: bucketName }))
        const multipart = await client.send(
          new CreateMultipartUploadCommand({
            Bucket: bucketName,
            ContentType: 'application/octet-stream',
            Key: key,
            Metadata: metadata,
          })
        )
        expect(multipart.UploadId).toBeTruthy()

        const uploadedParts = []
        for (const [index, payload] of partPayloads.entries()) {
          const partNumber = index + 1
          const part = await client.send(
            new UploadPartCommand({
              Body: payload,
              Bucket: bucketName,
              ContentLength: payload.length,
              Key: key,
              PartNumber: partNumber,
              UploadId: multipart.UploadId,
            })
          )
          expect(part.ETag).toBeTruthy()
          uploadedParts.push({ ETag: part.ETag, PartNumber: partNumber })
        }

        const parts = await client.send(
          new ListPartsCommand({
            Bucket: bucketName,
            Key: key,
            UploadId: multipart.UploadId,
          })
        )
        expect(parts.Parts?.map((listedPart) => listedPart.PartNumber)).toEqual([1, 2])

        await client.send(
          new CompleteMultipartUploadCommand({
            Bucket: bucketName,
            Key: key,
            MultipartUpload: {
              Parts: uploadedParts,
            },
            UploadId: multipart.UploadId,
          })
        )

        const head = await client.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }))
        expect(head.ContentLength).toBe(totalPayloadLength)
        expect(head.Metadata).toMatchObject(metadata)
      } finally {
        await cleanupS3Bucket(client, bucketName)
        client.destroy()
      }
    })

    it('honors conditional GET validators for object caching', async () => {
      const client = createAcceptanceS3Client()
      const bucketName = uniqueBucketName('s3cond')
      const key = uniqueObjectKey('conditional')
      const payload = Buffer.from('acceptance-s3-conditional-get')

      try {
        await client.send(new CreateBucketCommand({ Bucket: bucketName }))
        await client.send(
          new PutObjectCommand({
            Body: payload,
            Bucket: bucketName,
            ContentType: 'text/plain',
            Key: key,
          })
        )

        const head = await client.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }))
        expect(head.ETag).toBeTruthy()
        expect(head.LastModified).toBeInstanceOf(Date)

        const staleCache = await client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            IfNoneMatch: '"not-the-current-etag"',
            Key: key,
          })
        )
        expect(await staleCache.Body?.transformToString()).toBe(payload.toString())

        await expect(
          client.send(
            new GetObjectCommand({
              Bucket: bucketName,
              IfNoneMatch: head.ETag,
              Key: key,
            })
          )
        ).rejects.toMatchObject({
          $metadata: {
            httpStatusCode: 304,
          },
        })

        // S3 compares If-Modified-Since against the object's sub-second mtime while Last-Modified
        // is floored to the whole second, and (per RFC 2616) treats a date later than the server's
        // current time as invalid (serving a normal 200). Wait so the server clock advances, then
        // use Last-Modified+1s: strictly after the true mtime (not modified -> 304) yet not a
        // future date.
        await new Promise((resolve) => setTimeout(resolve, 2500))
        await expect(
          client.send(
            new GetObjectCommand({
              Bucket: bucketName,
              IfModifiedSince: new Date((head.LastModified?.getTime() ?? Date.now()) + 1000),
              Key: key,
            })
          )
        ).rejects.toMatchObject({
          $metadata: {
            httpStatusCode: 304,
          },
        })
      } finally {
        await cleanupS3Bucket(client, bucketName)
        client.destroy()
      }
    })

    it('returns the S3 404 contract for HeadObject on a missing key', async () => {
      const client = createAcceptanceS3Client()
      const bucketName = uniqueBucketName('s3head')
      const missingKey = uniqueObjectKey('missing-head')

      try {
        await client.send(new CreateBucketCommand({ Bucket: bucketName }))

        await expect(
          client.send(new HeadObjectCommand({ Bucket: bucketName, Key: missingKey }))
        ).rejects.toMatchObject({
          $metadata: {
            httpStatusCode: 404,
          },
        })
      } finally {
        await cleanupS3Bucket(client, bucketName)
        client.destroy()
      }
    })

    it('correctly handles objects with special characters in key', async () => {
      const client = createAcceptanceS3Client()
      const bucketName = uniqueBucketName('s3chars')
      const keyFullyValid = uniqueObjectKey("test!$&'() *+,:;=@ing", 'bin')
      const keyInvalid = uniqueObjectKey('test[]^|ing', 'bin')

      const payload = Buffer.from('acceptance-s3-char-key')

      try {
        await client.send(new CreateBucketCommand({ Bucket: bucketName }))

        // storage api rejects []^| but does not hit a signature rejection due to escaping
        await expect(
          client.send(
            new PutObjectCommand({
              Body: payload,
              Bucket: bucketName,
              ContentType: 'application/octet-stream',
              Key: keyInvalid,
            })
          )
        ).rejects.toThrow('Invalid key: ' + keyInvalid)

        await client.send(
          new PutObjectCommand({
            Body: payload,
            Bucket: bucketName,
            ContentType: 'application/octet-stream',
            Key: keyFullyValid,
          })
        )

        const downloaded = await client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: keyFullyValid,
          })
        )
        expect(await downloaded.Body?.transformToString()).toBe(payload.toString())

        const listed = await client.send(
          new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: keyFullyValid.split('/')[0],
          })
        )
        expect(listed.Contents?.map((object) => object.Key)).toContain(keyFullyValid)

        const deleted = await client.send(
          new DeleteObjectCommand({ Bucket: bucketName, Key: keyFullyValid })
        )
        expect(deleted.$metadata.httpStatusCode).toBe(204)
      } finally {
        await cleanupS3Bucket(client, bucketName)
        client.destroy()
      }
    })
  }
)

describeAcceptance(
  'extended S3 protocol contract',
  {
    destructive: true,
    profiles: ['core'],
  },
  () => {
    it('covers bucket metadata, list-v1, range reads, bulk delete, empty-bucket deletion, upload-part-copy, and abort', async () => {
      const client = createAcceptanceS3Client()
      const bucketName = uniqueBucketName('s3x')
      const prefix = uniqueObjectKey('s3-prefix').replace(/\.txt$/, '')
      const keyA = `${prefix}/a.txt`
      const keyB = `${prefix}/b.txt`
      const keyC = `${prefix}/nested/c.txt`
      const metadataReplacedKey = `${prefix}/metadata-replaced.txt`
      const copiedPartKey = `${prefix}/copied-part.txt`
      const copiedWholePartKey = `${prefix}/copied-whole-part.txt`
      const copiedInvalidRangeKey = `${prefix}/copied-invalid-range.txt`
      const abortedKey = `${prefix}/aborted.txt`
      const payload = Buffer.from('acceptance-s3-extended-object')

      try {
        await client.send(new CreateBucketCommand({ Bucket: bucketName }))

        await client.send(new HeadBucketCommand({ Bucket: bucketName }))
        const buckets = await client.send(new ListBucketsCommand({}))
        expect(buckets.Buckets?.map((bucket) => bucket.Name)).toContain(bucketName)

        const location = await client.send(new GetBucketLocationCommand({ Bucket: bucketName }))
        expect(location.LocationConstraint ?? '').toBeTypeOf('string')

        const versioning = await client.send(new GetBucketVersioningCommand({ Bucket: bucketName }))
        expect([undefined, 'Suspended']).toContain(versioning.Status)

        await expect(
          client.send(new CreateBucketCommand({ Bucket: bucketName }))
        ).rejects.toMatchObject({
          $metadata: {
            httpStatusCode: 409,
          },
        })

        await client.send(
          new PutObjectCommand({
            Body: payload,
            Bucket: bucketName,
            CacheControl: 'max-age=77',
            ContentType: 'text/plain',
            Key: keyA,
          })
        )
        await client.send(new PutObjectCommand({ Body: 'b', Bucket: bucketName, Key: keyB }))
        await client.send(new PutObjectCommand({ Body: 'c', Bucket: bucketName, Key: keyC }))

        await expect(
          client.send(new DeleteBucketCommand({ Bucket: bucketName }))
        ).rejects.toMatchObject({
          $metadata: {
            httpStatusCode: 409,
          },
        })

        const keyAHead = await client.send(new HeadObjectCommand({ Bucket: bucketName, Key: keyA }))
        expect(keyAHead.CacheControl).toBe('max-age=77')

        const firstPage = await client.send(
          new ListObjectsV2Command({
            Bucket: bucketName,
            MaxKeys: 2,
            Prefix: `${prefix}/`,
          })
        )
        expect(firstPage.Contents?.map((object) => object.Key)).toEqual([keyA, keyB])
        expect(firstPage.IsTruncated).toBe(true)
        expect(firstPage.NextContinuationToken).toBeTruthy()

        const secondPage = await client.send(
          new ListObjectsV2Command({
            Bucket: bucketName,
            ContinuationToken: firstPage.NextContinuationToken,
            MaxKeys: 2,
            Prefix: `${prefix}/`,
          })
        )
        expect(secondPage.Contents?.map((object) => object.Key)).toEqual([keyC])
        expect(secondPage.IsTruncated).toBe(false)

        const startAfter = await client.send(
          new ListObjectsV2Command({
            Bucket: bucketName,
            MaxKeys: 1,
            Prefix: `${prefix}/`,
            StartAfter: keyA,
          })
        )
        expect(startAfter.Contents?.map((object) => object.Key)).toEqual([keyB])

        const ranged = await client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: keyA,
            Range: 'bytes=0-9',
          })
        )
        expect(await ranged.Body?.transformToString()).toBe(payload.subarray(0, 10).toString())
        expect(ranged.ContentRange).toBe(`bytes 0-9/${payload.length}`)

        const expires = new Date('2030-01-01T00:00:00Z')
        const overridden = await client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: keyA,
            ResponseCacheControl: 'no-cache, no-store',
            ResponseContentDisposition: 'attachment; filename="acceptance.txt"',
            ResponseContentEncoding: 'identity',
            ResponseContentLanguage: 'en-US',
            ResponseContentType: 'application/octet-stream',
            ResponseExpires: expires,
          })
        )
        expect(overridden.CacheControl).toBe('no-cache, no-store')
        expect(overridden.ContentDisposition).toBe('attachment; filename="acceptance.txt"')
        expect(overridden.ContentEncoding).toBe('identity')
        expect(overridden.ContentLanguage).toBe('en-US')
        expect(overridden.ContentType).toBe('application/octet-stream')
        expect(overridden.ExpiresString).toBe(expires.toUTCString())
        await overridden.Body?.transformToByteArray()

        const suffixRange = await client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: keyA,
            Range: 'bytes=-5',
          })
        )
        expect(await suffixRange.Body?.transformToString()).toBe(payload.subarray(-5).toString())
        expect(suffixRange.ContentRange).toBe(
          `bytes ${payload.length - 5}-${payload.length - 1}/${payload.length}`
        )

        const openEndedRange = await client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: keyA,
            Range: `bytes=${payload.length - 5}-`,
          })
        )
        expect(await openEndedRange.Body?.transformToString()).toBe(
          payload.subarray(payload.length - 5).toString()
        )
        expect(openEndedRange.ContentRange).toBe(
          `bytes ${payload.length - 5}-${payload.length - 1}/${payload.length}`
        )

        await expect(
          client.send(
            new GetObjectCommand({
              Bucket: bucketName,
              Key: keyA,
              Range: `bytes=${payload.length}-`,
            })
          )
        ).rejects.toMatchObject({
          $metadata: {
            httpStatusCode: 416,
          },
        })

        const listedV1 = await client.send(
          new ListObjectsCommand({
            Bucket: bucketName,
            Delimiter: '/',
            Prefix: `${prefix}/`,
          })
        )
        expect(listedV1.Contents?.map((object) => object.Key)).toEqual(
          expect.arrayContaining([keyA, keyB])
        )
        expect(listedV1.CommonPrefixes?.map((object) => object.Prefix)).toContain(
          `${prefix}/nested/`
        )

        await client.send(
          new CopyObjectCommand({
            Bucket: bucketName,
            CacheControl: 'max-age=91',
            ContentType: 'application/json',
            CopySource: `${bucketName}/${keyA}`,
            Key: metadataReplacedKey,
            Metadata: {
              copied: 'yes',
            },
            MetadataDirective: 'REPLACE',
          })
        )
        const metadataReplaced = await client.send(
          new HeadObjectCommand({ Bucket: bucketName, Key: metadataReplacedKey })
        )
        expect(metadataReplaced.CacheControl).toBe('max-age=91')
        expect(metadataReplaced.ContentType).toBe('application/json')
        expect(metadataReplaced.Metadata).toMatchObject({ copied: 'yes' })

        const multipartCopy = await client.send(
          new CreateMultipartUploadCommand({
            Bucket: bucketName,
            Key: copiedPartKey,
          })
        )
        const copiedPart = await client.send(
          new UploadPartCopyCommand({
            Bucket: bucketName,
            CopySource: `${bucketName}/${keyA}`,
            CopySourceRange: 'bytes=0-9',
            Key: copiedPartKey,
            PartNumber: 1,
            UploadId: multipartCopy.UploadId,
          })
        )
        expect(copiedPart.CopyPartResult?.ETag).toBeTruthy()
        await client.send(
          new CompleteMultipartUploadCommand({
            Bucket: bucketName,
            Key: copiedPartKey,
            MultipartUpload: {
              Parts: [{ ETag: copiedPart.CopyPartResult?.ETag, PartNumber: 1 }],
            },
            UploadId: multipartCopy.UploadId,
          })
        )
        const copiedPartHead = await client.send(
          new HeadObjectCommand({ Bucket: bucketName, Key: copiedPartKey })
        )
        expect(copiedPartHead.ContentLength).toBe(10)

        const wholePartCopy = await client.send(
          new CreateMultipartUploadCommand({
            Bucket: bucketName,
            Key: copiedWholePartKey,
          })
        )
        const wholeCopiedPart = await client.send(
          new UploadPartCopyCommand({
            Bucket: bucketName,
            CopySource: `${bucketName}/${keyA}`,
            Key: copiedWholePartKey,
            PartNumber: 1,
            UploadId: wholePartCopy.UploadId,
          })
        )
        expect(wholeCopiedPart.CopyPartResult?.ETag).toBeTruthy()
        await client.send(
          new CompleteMultipartUploadCommand({
            Bucket: bucketName,
            Key: copiedWholePartKey,
            MultipartUpload: {
              Parts: [{ ETag: wholeCopiedPart.CopyPartResult?.ETag, PartNumber: 1 }],
            },
            UploadId: wholePartCopy.UploadId,
          })
        )
        const copiedWholePartHead = await client.send(
          new HeadObjectCommand({ Bucket: bucketName, Key: copiedWholePartKey })
        )
        expect(copiedWholePartHead.ContentLength).toBe(payload.length)

        const invalidRangeCopy = await client.send(
          new CreateMultipartUploadCommand({
            Bucket: bucketName,
            Key: copiedInvalidRangeKey,
          })
        )
        await expect(
          client.send(
            new UploadPartCopyCommand({
              Bucket: bucketName,
              CopySource: `${bucketName}/${keyA}`,
              CopySourceRange: 'bytes=-5',
              Key: copiedInvalidRangeKey,
              PartNumber: 1,
              UploadId: invalidRangeCopy.UploadId,
            })
          )
        ).rejects.toMatchObject({
          $metadata: {
            httpStatusCode: 400,
          },
        })
        await client.send(
          new AbortMultipartUploadCommand({
            Bucket: bucketName,
            Key: copiedInvalidRangeKey,
            UploadId: invalidRangeCopy.UploadId,
          })
        )

        const aborted = await client.send(
          new CreateMultipartUploadCommand({
            Bucket: bucketName,
            Key: abortedKey,
          })
        )
        await client.send(
          new AbortMultipartUploadCommand({
            Bucket: bucketName,
            Key: abortedKey,
            UploadId: aborted.UploadId,
          })
        )
        const activeUploads = await client.send(
          new ListMultipartUploadsCommand({ Bucket: bucketName, Prefix: abortedKey })
        )
        expect(activeUploads.Uploads ?? []).toHaveLength(0)

        const bulkMissingKey = uniqueObjectKey('bulk-missing', 'txt')
        const bulkDelete = await client.send(
          new DeleteObjectsCommand({
            Bucket: bucketName,
            Delete: {
              Objects: [
                keyA,
                keyB,
                keyC,
                metadataReplacedKey,
                copiedPartKey,
                copiedWholePartKey,
                bulkMissingKey,
              ].map((Key) => ({ Key })),
            },
          })
        )
        expect(bulkDelete.Deleted?.map((object) => object.Key)).toEqual(
          expect.arrayContaining([
            keyA,
            keyB,
            keyC,
            metadataReplacedKey,
            copiedPartKey,
            copiedWholePartKey,
            bulkMissingKey,
          ])
        )
        expect(bulkDelete.Deleted).toHaveLength(7)
        expect(bulkDelete.Errors ?? []).toEqual([])

        await client.send(new DeleteBucketCommand({ Bucket: bucketName }))
      } finally {
        await cleanupS3Bucket(client, bucketName)
        client.destroy()
      }
    })
  }
)

describeAcceptance(
  'S3 protocol pagination and range edges',
  {
    destructive: true,
    profiles: ['core'],
  },
  () => {
    it('orders and paginates ListMultipartUploads by returned KeyMarker', async () => {
      const client = createAcceptanceS3Client()
      const bucketName = uniqueBucketName('s3mpls')
      const sharedPrefix = uniqueObjectKey('mpshare').replace(/\.txt$/, '')
      const keyA = `${sharedPrefix}/a.bin`
      const keyB = `${sharedPrefix}/b.bin`
      const uploadIds: { Key: string; UploadId: string }[] = []

      try {
        await client.send(new CreateBucketCommand({ Bucket: bucketName }))

        for (const Key of [keyA, keyB]) {
          const created = await client.send(
            new CreateMultipartUploadCommand({ Bucket: bucketName, Key })
          )
          if (!created.UploadId) {
            throw new Error(`CreateMultipartUpload returned no UploadId for ${Key}`)
          }
          uploadIds.push({ Key, UploadId: created.UploadId })
        }

        // The pg implementation orders by `key COLLATE "C", created_at`, so an
        // unbounded list must surface both uploads with the lexicographically
        // smaller key first.
        const all = await client.send(
          new ListMultipartUploadsCommand({
            Bucket: bucketName,
            Prefix: `${sharedPrefix}/`,
          })
        )
        expect(all.Uploads?.map((upload) => upload.Key)).toEqual([keyA, keyB])
        expect(all.IsTruncated).toBe(false)

        const truncated = await client.send(
          new ListMultipartUploadsCommand({
            Bucket: bucketName,
            Prefix: `${sharedPrefix}/`,
            MaxUploads: 1,
          })
        )
        expect(truncated.IsTruncated).toBe(true)
        expect(truncated.Uploads?.map((upload) => upload.Key)).toEqual([keyA])
        expect(truncated.NextKeyMarker).toBeTruthy()
        expect(truncated.NextUploadIdMarker).toBeTruthy()

        const secondPage = await client.send(
          new ListMultipartUploadsCommand({
            Bucket: bucketName,
            KeyMarker: truncated.NextKeyMarker,
            MaxUploads: 1,
            Prefix: `${sharedPrefix}/`,
          })
        )
        expect(secondPage.KeyMarker).toBe(truncated.NextKeyMarker)
        expect(secondPage.IsTruncated).toBe(false)
        expect(secondPage.Uploads?.map((upload) => upload.Key)).toEqual([keyB])
      } finally {
        for (const { Key, UploadId } of uploadIds) {
          await client
            .send(new AbortMultipartUploadCommand({ Bucket: bucketName, Key, UploadId }))
            .catch(() => undefined)
        }
        await cleanupS3Bucket(client, bucketName)
        client.destroy()
      }
    })

    it('paginates ListParts via PartNumberMarker', async () => {
      const client = createAcceptanceS3Client()
      const bucketName = uniqueBucketName('s3parts')
      const key = uniqueObjectKey('parts', 'bin')
      const partPayload = Buffer.alloc(5 * 1024 * 1024, 9)
      let activeUploadId: string | undefined

      try {
        await client.send(new CreateBucketCommand({ Bucket: bucketName }))
        const multipart = await client.send(
          new CreateMultipartUploadCommand({ Bucket: bucketName, Key: key })
        )
        activeUploadId = multipart.UploadId
        if (!activeUploadId) {
          throw new Error('CreateMultipartUpload did not return UploadId')
        }

        for (const partNumber of [1, 2]) {
          await client.send(
            new UploadPartCommand({
              Body: partPayload,
              Bucket: bucketName,
              ContentLength: partPayload.length,
              Key: key,
              PartNumber: partNumber,
              UploadId: activeUploadId,
            })
          )
        }

        // Listing with MaxParts=1 must mark the response truncated and expose a
        // NextPartNumberMarker. The follow-up request must skip the first part
        // and surface only the second.
        const firstPage = await client.send(
          new ListPartsCommand({
            Bucket: bucketName,
            Key: key,
            MaxParts: 1,
            UploadId: activeUploadId,
          })
        )
        expect(firstPage.IsTruncated).toBe(true)
        expect(firstPage.Parts?.map((part) => part.PartNumber)).toEqual([1])
        expect(firstPage.NextPartNumberMarker).toBeTruthy()

        const secondPage = await client.send(
          new ListPartsCommand({
            Bucket: bucketName,
            Key: key,
            MaxParts: 10,
            PartNumberMarker: firstPage.NextPartNumberMarker,
            UploadId: activeUploadId,
          })
        )
        expect(secondPage.IsTruncated).toBe(false)
        expect(secondPage.Parts?.map((part) => part.PartNumber)).toEqual([2])
      } finally {
        if (activeUploadId) {
          await client
            .send(
              new AbortMultipartUploadCommand({
                Bucket: bucketName,
                Key: key,
                UploadId: activeUploadId,
              })
            )
            .catch(() => undefined)
        }
        await cleanupS3Bucket(client, bucketName)
        client.destroy()
      }
    })

    it('honors suffix and last-N range requests, and returns 416 when out of range', async () => {
      const client = createAcceptanceS3Client()
      const bucketName = uniqueBucketName('s3range')
      const key = uniqueObjectKey('ranged', 'bin')
      const payload = Buffer.from('0123456789abcdef')

      try {
        await client.send(new CreateBucketCommand({ Bucket: bucketName }))
        await client.send(
          new PutObjectCommand({
            Body: payload,
            Bucket: bucketName,
            ContentType: 'application/octet-stream',
            Key: key,
          })
        )

        // bytes=N- (suffix-from): expect bytes 4 onwards.
        const fromOffset = await client.send(
          new GetObjectCommand({ Bucket: bucketName, Key: key, Range: 'bytes=4-' })
        )
        expect(await fromOffset.Body?.transformToString()).toBe(payload.subarray(4).toString())
        expect(fromOffset.ContentRange).toBe(`bytes 4-${payload.length - 1}/${payload.length}`)

        // bytes=-N (last-N): expect last 5 bytes.
        const lastN = await client.send(
          new GetObjectCommand({ Bucket: bucketName, Key: key, Range: 'bytes=-5' })
        )
        expect(await lastN.Body?.transformToString()).toBe(payload.subarray(-5).toString())
        expect(lastN.ContentRange).toBe(
          `bytes ${payload.length - 5}-${payload.length - 1}/${payload.length}`
        )

        // Out-of-bounds request → 416 Range Not Satisfiable.
        await expect(
          client.send(
            new GetObjectCommand({
              Bucket: bucketName,
              Key: key,
              Range: 'bytes=10000-20000',
            })
          )
        ).rejects.toMatchObject({
          $metadata: {
            httpStatusCode: 416,
          },
        })
      } finally {
        await cleanupS3Bucket(client, bucketName)
        client.destroy()
      }
    })

    it('lists v2 with delimiter + StartAfter past a sibling, exposing later common prefixes only', async () => {
      const client = createAcceptanceS3Client()
      const bucketName = uniqueBucketName('s3v2start')
      const prefix = uniqueObjectKey('v2start').replace(/\.txt$/, '')
      const aKey = `${prefix}/a/leaf.txt`
      const bKey = `${prefix}/b/leaf.txt`
      const cKey = `${prefix}/c/leaf.txt`

      try {
        await client.send(new CreateBucketCommand({ Bucket: bucketName }))

        for (const Key of [aKey, bKey, cKey]) {
          await client.send(new PutObjectCommand({ Body: Key, Bucket: bucketName, Key }))
        }

        const firstPage = await client.send(
          new ListObjectsV2Command({
            Bucket: bucketName,
            Delimiter: '/',
            MaxKeys: 1,
            Prefix: `${prefix}/`,
          })
        )
        expect(firstPage.IsTruncated).toBe(true)
        expect(firstPage.KeyCount).toBe(1)
        expect(firstPage.CommonPrefixes?.map((entry) => entry.Prefix)).toEqual([`${prefix}/a/`])
        expect(firstPage.Contents ?? []).toEqual([])
        expect(firstPage.NextContinuationToken).toBeTruthy()

        const secondPage = await client.send(
          new ListObjectsV2Command({
            Bucket: bucketName,
            ContinuationToken: firstPage.NextContinuationToken,
            Delimiter: '/',
            MaxKeys: 1,
            Prefix: `${prefix}/`,
          })
        )
        expect(secondPage.IsTruncated).toBe(true)
        expect(secondPage.KeyCount).toBe(1)
        expect(secondPage.CommonPrefixes?.map((entry) => entry.Prefix)).toEqual([`${prefix}/b/`])
        expect(secondPage.Contents ?? []).toEqual([])

        // StartAfter `${prefix}/a/zzzzz` is lexicographically beyond every leaf
        // in the `a/` folder. The storage.search_v2 path must then surface only
        // the later common prefixes (`b/` and `c/`), not `a/`.
        const listed = await client.send(
          new ListObjectsV2Command({
            Bucket: bucketName,
            Delimiter: '/',
            Prefix: `${prefix}/`,
            StartAfter: `${prefix}/a/zzzzz`,
          })
        )
        const prefixes = (listed.CommonPrefixes ?? []).map((entry) => entry.Prefix).filter(Boolean)
        expect(prefixes).toEqual([`${prefix}/b/`, `${prefix}/c/`])
        expect(listed.Contents ?? []).toEqual([])
      } finally {
        await cleanupS3Bucket(client, bucketName)
        client.destroy()
      }
    })
  }
)
