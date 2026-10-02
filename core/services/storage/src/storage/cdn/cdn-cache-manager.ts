import { ERRORS } from '@internal/errors'
import { Agent } from 'undici'

import { getConfig } from '../../config'

const { cdnPurgeEndpointURL, cdnPurgeEndpointKey } = getConfig()

const CDN_PURGE_TIMEOUT_MS = 10_000
const CDN_PURGE_CONNECT_TIMEOUT_MS = 3_000
const CDN_PURGE_HEADERS_BODY_TIMEOUT_MS = CDN_PURGE_TIMEOUT_MS - CDN_PURGE_CONNECT_TIMEOUT_MS

const dispatcher = new Agent({
  connections: 200,
  keepAliveTimeout: 30_000,
  keepAliveMaxTimeout: 30_000,
  connectTimeout: CDN_PURGE_CONNECT_TIMEOUT_MS,
  headersTimeout: CDN_PURGE_HEADERS_BODY_TIMEOUT_MS,
  bodyTimeout: CDN_PURGE_HEADERS_BODY_TIMEOUT_MS,
})

const defaultHeaders = new Headers({
  'Content-Type': 'application/json',
  ...(cdnPurgeEndpointKey ? { Authorization: `Bearer ${cdnPurgeEndpointKey}` } : {}),
})

const cdnPurgeUrl = cdnPurgeEndpointURL ? resolvePurgeUrl(cdnPurgeEndpointURL) : undefined

interface BasePurgeInput {
  tenant: string
}

interface PurgeObjectInput extends BasePurgeInput {
  type: 'object'
  bucket: string
  objectName: string
}

interface PurgeBucketInput extends BasePurgeInput {
  type: 'bucket'
  bucket: string
}

interface PurgeTenantInput extends BasePurgeInput {
  type: 'tenant'
}

interface PurgeObjectTransformsInput extends BasePurgeInput {
  type: 'object-transforms'
  bucket: string
  objectName: string
}

interface PurgeBucketTransformsInput extends BasePurgeInput {
  type: 'bucket-transforms'
  bucket: string
}

interface PurgeTenantTransformsInput extends BasePurgeInput {
  type: 'tenant-transforms'
}

export type PurgeCacheInput =
  | PurgeObjectInput
  | PurgeBucketInput
  | PurgeTenantInput
  | PurgeObjectTransformsInput
  | PurgeBucketTransformsInput
  | PurgeTenantTransformsInput

function resolvePurgeUrl(baseURL: string) {
  const url = new URL(baseURL)
  url.pathname = url.pathname.endsWith('/') ? `${url.pathname}purge` : `${url.pathname}/purge`
  url.search = ''
  url.hash = ''

  return url.toString()
}

async function assertOkResponse(response: Response) {
  if (response.ok) {
    return
  }

  throw new Error(`Request failed with status code ${response.status}`)
}

export class CdnCacheManager {
  async purge(opts: PurgeCacheInput) {
    if (!cdnPurgeUrl) {
      throw ERRORS.MissingParameter('CDN_PURGE_ENDPOINT_URL is not set')
    }

    // Build request body based on purge type
    const requestBody: Record<string, unknown> = {
      type: opts.type,
      tenant: {
        ref: opts.tenant,
      },
    }

    if ('bucket' in opts) {
      requestBody.bucketId = opts.bucket
    }

    if ('objectName' in opts) {
      requestBody.objectName = opts.objectName
    }

    // Purge cache
    try {
      const requestInit: RequestInit & { dispatcher: Agent } = {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify(requestBody),
        dispatcher,
        signal: AbortSignal.timeout(CDN_PURGE_TIMEOUT_MS),
      }

      const response = await fetch(cdnPurgeUrl, requestInit)

      try {
        await assertOkResponse(response)
      } finally {
        await response.body?.cancel().catch(() => {})
      }
    } catch (e) {
      throw ERRORS.InternalError(
        e instanceof Error ? e : new Error(String(e)),
        'Error purging cache'
      )
    }
  }

  isConfigured() {
    return Boolean(cdnPurgeUrl)
  }
}
