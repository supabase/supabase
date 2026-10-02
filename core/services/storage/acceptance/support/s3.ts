import {
  AbortMultipartUploadCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListMultipartUploadsCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3'
import { getAcceptanceConfig, requireConfigValue } from './config'
import { hasHeader } from './headers'

export function createAcceptanceS3Client(
  credentials: { accessKeyId?: string; secretAccessKey?: string } = {}
) {
  const config = getAcceptanceConfig()

  const client = new S3Client({
    credentials: {
      accessKeyId: requireConfigValue(
        credentials.accessKeyId ?? config.s3AccessKeyId,
        'ACCEPTANCE_S3_ACCESS_KEY_ID'
      ),
      secretAccessKey: requireConfigValue(
        credentials.secretAccessKey ?? config.s3SecretAccessKey,
        'ACCEPTANCE_S3_SECRET_ACCESS_KEY'
      ),
    },
    endpoint: config.s3Endpoint,
    forcePathStyle: config.forcePathStyle,
    region: config.region,
  })

  const forwardedHost = config.forwardedHost

  if (forwardedHost) {
    client.middlewareStack.add(
      (next) => async (args) => {
        const request = args.request as { headers?: Record<string, string> } | undefined

        if (request?.headers && !hasHeader(request.headers, 'x-forwarded-host')) {
          request.headers['x-forwarded-host'] = forwardedHost
        }

        return next(args)
      },
      {
        name: 'acceptanceForwardedHost',
        step: 'build',
      }
    )
  }

  return client
}

export async function cleanupS3Bucket(client: S3Client, bucketName: string) {
  await abortMultipartUploads(client, bucketName).catch(() => undefined)
  await deleteAllObjects(client, bucketName).catch(() => undefined)
  await client.send(new DeleteBucketCommand({ Bucket: bucketName })).catch(() => undefined)
}

export async function cleanupS3Object(client: S3Client, bucketName: string, key: string) {
  await client
    .send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }))
    .catch(() => undefined)
}

async function deleteAllObjects(client: S3Client, bucketName: string) {
  let continuationToken: string | undefined

  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        ContinuationToken: continuationToken,
      })
    )
    const keys = page.Contents?.map((object) => object.Key).filter(Boolean) as string[] | undefined

    if (keys?.length) {
      await client.send(
        new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: {
            Objects: keys.map((Key) => ({ Key })),
            Quiet: true,
          },
        })
      )
    }

    continuationToken = page.NextContinuationToken
  } while (continuationToken)
}

async function abortMultipartUploads(client: S3Client, bucketName: string) {
  let keyMarker: string | undefined
  let uploadIdMarker: string | undefined

  do {
    const page = await client.send(
      new ListMultipartUploadsCommand({
        Bucket: bucketName,
        KeyMarker: keyMarker,
        UploadIdMarker: uploadIdMarker,
      })
    )

    for (const upload of page.Uploads ?? []) {
      if (upload.Key && upload.UploadId) {
        await client
          .send(
            new AbortMultipartUploadCommand({
              Bucket: bucketName,
              Key: upload.Key,
              UploadId: upload.UploadId,
            })
          )
          .catch(() => undefined)
      }
    }

    keyMarker = page.NextKeyMarker
    uploadIdMarker = page.NextUploadIdMarker
  } while (keyMarker || uploadIdMarker)
}
