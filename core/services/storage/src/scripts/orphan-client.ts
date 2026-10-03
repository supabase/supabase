import { NdJsonTransform } from '@internal/streams/ndjson'
import path from 'path'
import { Readable } from 'stream'
import type { ReadableStream as NodeReadableStream } from 'stream/web'
import { OrphanStreamEvent, writeStreamToJsonArray } from './orphan-client-stream'

const DEFAULT_DELETE_LIMIT = 1000000

type OrphanAction = 'list' | 'delete'

interface OrphanClientConfig {
  adminUrl: string
  adminApiKey: string
  tenantId: string

  // bucket id to search, can handle multiple comma delimited buckets (aaa,bbb,ccc)
  bucketId: string

  // limits the number of delete operations to avoid overwhelming our queue
  deleteLimit: number

  // optional cutoff override for orphan list/delete requests
  before?: string
}

interface FetchOrphanStreamOptions {
  action: OrphanAction
  adminApiKey?: string
  adminUrl: string
  before?: string
  bucketId: string
  tenantId: string
}

interface WriteListOrphanStreamOptions {
  requestStream: Readable
  cancel: () => void
  filePath: string
}

interface WriteDeleteOrphanStreamOptions {
  requestStream: Readable
  cancel: () => void
  deleteLimit: number
  filePath: string
}

const FILE_PATH = (operation: string, tenantId: string, bucketId: string) =>
  `../../dist/${operation}-${tenantId}-${bucketId}-${Date.now()}-orphan-objects.json`

export function parseConfig(env: NodeJS.ProcessEnv): OrphanClientConfig | string {
  const { ADMIN_URL, ADMIN_API_KEY, TENANT_ID, BUCKET_ID, DELETE_LIMIT, ORPHAN_BEFORE } = env
  const rawDeleteLimit = DELETE_LIMIT?.trim() || String(DEFAULT_DELETE_LIMIT)
  const deleteLimit = Number.parseInt(rawDeleteLimit, 10)

  if (!ADMIN_URL) return 'Please provide an admin URL'
  if (!ADMIN_API_KEY) return 'Please provide an admin API key'
  if (!TENANT_ID) return 'Please provide a tenant ID'
  if (!BUCKET_ID) return 'Please provide a bucket ID'
  if (!/^\d+$/.test(rawDeleteLimit) || !Number.isSafeInteger(deleteLimit) || deleteLimit <= 0) {
    return 'Please provide a valid positive integer for DELETE_LIMIT'
  }

  return {
    adminUrl: ADMIN_URL,
    adminApiKey: ADMIN_API_KEY,
    tenantId: TENANT_ID,
    bucketId: BUCKET_ID,
    deleteLimit,
    before: ORPHAN_BEFORE,
  }
}

export function resolveAdminUrl(
  baseUrl: string,
  requestPath: string,
  query?: Record<string, string | undefined>
): URL {
  const url = new URL(`${baseUrl.replace(/\/+$/, '')}/${requestPath.replace(/^\/+/, '')}`)

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) {
      url.searchParams.set(key, value)
    }
  }

  return url
}

async function assertStreamResponse(response: Response, context: string) {
  if (!response.ok) {
    const body = await response.text()
    const details = body ? `: ${body}` : ''

    throw new Error(`${context} failed with ${response.status} ${response.statusText}${details}`)
  }

  if (!response.body) {
    throw new Error(`${context} returned an empty response body`)
  }
}

export async function fetchOrphanStream(options: FetchOrphanStreamOptions) {
  const requestPath = `/tenants/${options.tenantId}/buckets/${options.bucketId}/orphan-objects`
  const url = resolveAdminUrl(
    options.adminUrl,
    requestPath,
    options.action === 'list' ? { before: options.before } : undefined
  )
  const headers = new Headers()

  if (options.adminApiKey) {
    headers.set('ApiKey', options.adminApiKey)
  }

  const requestBody =
    options.action === 'delete'
      ? JSON.stringify({
          deleteS3Keys: true,
          before: options.before,
        })
      : undefined

  if (requestBody) {
    headers.set('Content-Type', 'application/json')
  }

  const controller = new AbortController()
  const response = await fetch(url, {
    method: options.action === 'list' ? 'GET' : 'DELETE',
    headers,
    body: requestBody,
    signal: controller.signal,
  })

  await assertStreamResponse(response, `${options.action.toUpperCase()} ${url}`)

  const stream = Readable.fromWeb(response.body as unknown as NodeReadableStream<Uint8Array>)
  let completed = false

  stream.once('end', () => {
    completed = true
  })

  stream.once('close', () => {
    if (!completed && !controller.signal.aborted) {
      controller.abort()
    }
  })

  return {
    stream,
    cancel: () => {
      if (!stream.destroyed) {
        stream.destroy()
      }

      if (!controller.signal.aborted) {
        controller.abort()
      }
    },
  }
}

export async function writeListOrphanStream(options: WriteListOrphanStreamOptions) {
  let cancelled = false
  const cancelRequest = () => {
    if (!cancelled) {
      cancelled = true
      options.cancel()
    }
  }

  const transformStream = new NdJsonTransform()
  options.requestStream.on('error', (err: Error) => {
    transformStream.emit('error', err)
  })

  const jsonStream = options.requestStream.pipe(transformStream)

  try {
    await writeStreamToJsonArray(jsonStream, options.filePath)
  } finally {
    cancelRequest()
  }
}

export async function writeDeleteOrphanStream(options: WriteDeleteOrphanStreamOptions) {
  let cancelled = false
  const cancelRequest = () => {
    if (!cancelled) {
      cancelled = true
      options.cancel()
    }
  }

  const transformStream = new NdJsonTransform()
  let deleteLimitReached = false

  options.requestStream.on('error', (err: Error) => {
    if (deleteLimitReached) {
      return
    }

    transformStream.emit('error', err)
  })

  const jsonStream = options.requestStream.pipe(transformStream)

  let itemCount = 0
  const limitedStream = Readable.from(
    (async function* () {
      for await (const chunk of jsonStream as AsyncIterable<OrphanStreamEvent>) {
        yield chunk

        if (chunk.event === 'data' && chunk.value && Array.isArray(chunk.value)) {
          itemCount += chunk.value.length

          if (itemCount >= options.deleteLimit) {
            deleteLimitReached = true
            console.log(
              `Delete limit of ${options.deleteLimit} reached. Stopping after this batch. Ensure these operations complete before queuing additional jobs.`
            )
            cancelRequest()
            return
          }
        }
      }
    })(),
    { objectMode: true }
  )

  try {
    await writeStreamToJsonArray(limitedStream, options.filePath)
  } finally {
    cancelRequest()
  }
}

function failCli(message: string) {
  process.exitCode = 1
  console.error(message)
  return false
}

export async function main(
  env: NodeJS.ProcessEnv = process.env,
  argv: string[] = process.argv
): Promise<boolean> {
  const action = argv[2]

  if (action !== 'list' && action !== 'delete') {
    return failCli('Please provide an action: list or delete')
  }

  const config = parseConfig(env)
  if (typeof config === 'string') {
    return failCli(config)
  }

  const buckets = config.bucketId
    .split(',')
    .map((bucketId) => bucketId.trim())
    .filter(Boolean)

  for (const bucket of buckets) {
    console.log(' ')
    console.log(`${action} items in bucket ${bucket}...`)
    if (action === 'list') {
      await listOrphans(config, bucket)
    } else {
      await deleteS3Orphans(config, bucket)
    }
  }

  return true
}

/**
 * List Orphan objects in a bucket
 * @param tenantId
 * @param bucketId
 */
async function listOrphans(config: OrphanClientConfig, bucketId: string) {
  const { stream: requestStream, cancel } = await fetchOrphanStream({
    action: 'list',
    adminApiKey: config.adminApiKey,
    adminUrl: config.adminUrl,
    before: config.before,
    bucketId,
    tenantId: config.tenantId,
  })

  await writeListOrphanStream({
    requestStream,
    cancel,
    filePath: path.resolve(__dirname, FILE_PATH('list', config.tenantId, bucketId)),
  })
}

/**
 * Deletes S3 orphan objects in a bucket
 * @param tenantId
 * @param bucketId
 */
async function deleteS3Orphans(config: OrphanClientConfig, bucketId: string) {
  const { stream: requestStream, cancel } = await fetchOrphanStream({
    action: 'delete',
    adminApiKey: config.adminApiKey,
    adminUrl: config.adminUrl,
    before: config.before,
    bucketId,
    tenantId: config.tenantId,
  })

  await writeDeleteOrphanStream({
    requestStream,
    cancel,
    deleteLimit: config.deleteLimit,
    filePath: path.resolve(__dirname, FILE_PATH('delete', config.tenantId, bucketId)),
  })
}

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  void main()
    .then((ok) => {
      if (ok) {
        console.log('Done')
      }
    })
    .catch((e) => {
      process.exitCode = 1
      console.error('Error:', e)
    })
}
