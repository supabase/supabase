import { randomUUID } from 'node:crypto'
import { AcceptanceConfig, encodePathSegments, getAcceptanceConfig } from './config'
import { AcceptanceHttpClient, createRestClient } from './http'

export function uniqueBucketName(kind: string): string {
  const config = getAcceptanceConfig()
  const suffix = randomUUID().replace(/-/g, '').slice(0, 16)
  return `${config.resourcePrefix}-${kind}-${suffix}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .slice(0, 63)
}

export function uniqueObjectKey(kind: string, extension = 'txt'): string {
  const config = getAcceptanceConfig()
  const suffix = randomUUID().replace(/-/g, '').slice(0, 16)
  return `${config.resourcePrefix}/${kind}-${suffix}.${extension}`
}

export async function createRestBucket(
  bucketName: string,
  options: { fileSizeLimit?: number | string | null; isPublic?: boolean } = {}
) {
  const config = getAcceptanceConfig()
  const client = createRestClient()

  await client.request('POST', '/bucket', {
    body: {
      file_size_limit: options.fileSizeLimit,
      id: bucketName,
      name: bucketName,
      public: options.isPublic ?? false,
    },
    expectedStatus: 200,
    token: requireServiceKey(config),
  })
}

export async function uploadRestObject(
  bucketName: string,
  objectKey: string,
  body: BodyInit,
  options: { contentType?: string } = {}
) {
  const config = getAcceptanceConfig()
  const client = createRestClient()

  await client.request('POST', `/object/${bucketName}/${encodePathSegments(objectKey)}`, {
    body,
    expectedStatus: 200,
    headers: {
      'content-type': options.contentType ?? 'text/plain',
      'x-upsert': 'true',
    },
    token: requireServiceKey(config),
  })
}

export async function cleanupRestResources(
  bucketName: string,
  objectKeys: string[],
  client: AcceptanceHttpClient = createRestClient()
) {
  await cleanupRestObjects(bucketName, objectKeys, client)

  await client
    .request('DELETE', `/bucket/${bucketName}`, {
      expectedStatus: [200, 400, 404],
      token: requireServiceKey(),
    })
    .catch(() => undefined)
}

export async function cleanupRestObjects(
  bucketName: string,
  objectKeys: string[],
  client: AcceptanceHttpClient = createRestClient()
) {
  const config = getAcceptanceConfig()
  const token = requireServiceKey(config)

  const deletionOrder = [...objectKeys].reverse()

  // Callers pass object keys in creation order; delete in LIFO order for cleanup.
  for (const objectKey of deletionOrder) {
    await client
      .request('DELETE', `/object/${bucketName}/${encodePathSegments(objectKey)}`, {
        expectedStatus: [200, 400, 404],
        token,
      })
      .catch(() => undefined)
  }
}

export function requireServiceKey(config: AcceptanceConfig = getAcceptanceConfig()) {
  if (!config.serviceKey) {
    throw new Error('ACCEPTANCE_SERVICE_KEY is required for this acceptance test')
  }

  return config.serviceKey
}
