import {
  CreateBucketCommand,
  CreateMultipartUploadCommand,
  HeadObjectCommand,
  ListPartsCommand,
} from '@aws-sdk/client-s3'
import { describeAcceptance } from '../support/config'
import { uniqueBucketName, uniqueObjectKey } from '../support/resources'
import { cleanupS3Bucket, createAcceptanceS3Client } from '../support/s3'
import {
  sendAwsChunkedPutObject,
  sendAwsChunkedTrailerModeWithoutTrailer,
  sendAwsChunkedUploadPart,
} from '../support/sigv4'

describeAcceptance(
  'S3 SigV4 wire contract',
  {
    destructive: true,
    profiles: ['wire'],
    requires: ['wire'],
  },
  () => {
    it('accepts aws-chunked PutObject and persists decoded content length', async () => {
      const client = createAcceptanceS3Client()
      const bucketName = uniqueBucketName('wire')
      const key = uniqueObjectKey('chunked', 'bin')
      const payload = Buffer.alloc(123, 1)

      try {
        await client.send(new CreateBucketCommand({ Bucket: bucketName }))
        const response = await sendAwsChunkedPutObject({ bucketName, key, payload })

        expect(response.status).toBe(200)

        const head = await client.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }))
        expect(head.ContentLength).toBe(payload.length)
      } finally {
        await cleanupS3Bucket(client, bucketName)
        client.destroy()
      }
    })

    it('accepts aws-chunked UploadPart and lists the uploaded part', async () => {
      const client = createAcceptanceS3Client()
      const bucketName = uniqueBucketName('wiremp')
      const key = uniqueObjectKey('chunked-part', 'bin')
      const payload = Buffer.alloc(123, 2)

      try {
        await client.send(new CreateBucketCommand({ Bucket: bucketName }))
        const multipart = await client.send(
          new CreateMultipartUploadCommand({
            Bucket: bucketName,
            Key: key,
          })
        )
        const uploadId = expectUploadId(multipart.UploadId)

        const response = await sendAwsChunkedUploadPart({
          bucketName,
          key,
          partNumber: 1,
          payload,
          uploadId,
        })

        expect(response.status).toBe(200)

        const parts = await client.send(
          new ListPartsCommand({
            Bucket: bucketName,
            Key: key,
            UploadId: uploadId,
          })
        )
        expect(parts.Parts?.map((part) => part.PartNumber)).toEqual([1])
      } finally {
        await cleanupS3Bucket(client, bucketName)
        client.destroy()
      }
    })

    it('rejects trailer-mode aws-chunked PutObject when the trailer block is missing', async () => {
      const client = createAcceptanceS3Client()
      const bucketName = uniqueBucketName('wiretr')
      const key = uniqueObjectKey('trailer', 'bin')
      const payload = Buffer.alloc(123, 3)

      try {
        await client.send(new CreateBucketCommand({ Bucket: bucketName }))
        const response = await sendAwsChunkedTrailerModeWithoutTrailer({
          bucketName,
          key,
          payload,
        })

        expect(response.status).toBeGreaterThanOrEqual(400)
        await expect(
          client.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }))
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
  }
)

function expectUploadId(uploadId: string | undefined): string {
  if (!uploadId) {
    throw new Error('CreateMultipartUpload did not return UploadId')
  }

  return uploadId
}
