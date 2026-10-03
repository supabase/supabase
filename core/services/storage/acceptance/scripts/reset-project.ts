/**
 * Wipes every storage/analytics/vector bucket in the target project so acceptance tests
 * can run against a clean slate. Admin API resources (tenants, etc.) are out of scope.
 *
 * Usage:
 *   tsx --env-file=.env.acceptance-staging acceptance/scripts/reset-project.ts [--yes]
 *
 * Reads the same ACCEPTANCE_* variables as the rest of the acceptance suite
 * Requires ACCEPTANCE_SERVICE_KEY
 * pass --yes to actually delete anything, otherwise runs in dry-run mode.
 */
import { setTimeout as delay } from 'node:timers/promises'
import { getAcceptanceConfig } from '../support/config'
import { AcceptanceHttpClient, createRestClient } from '../support/http'
import { requireServiceKey } from '../support/resources'

const CONCURRENCY = 5
const LIST_PAGE_SIZE = 1000
const EMPTY_BUCKET_POLL_INTERVAL_MS = 2000
const EMPTY_BUCKET_POLL_TIMEOUT_MS = 5 * 60 * 1000

const confirmed = process.argv.includes('--yes') && process.env.ACCEPTANCE_ALLOW_DESTRUCTIVE

interface StorageBucket {
  id: string
}

interface AnalyticsBucket {
  name: string
}

interface ListObjectsV2Response {
  folders?: unknown[]
  objects?: unknown[]
}

interface VectorListBucketsResponse {
  nextToken?: string
  vectorBuckets?: Array<{ vectorBucketName?: string }>
}

interface VectorListIndexesResponse {
  indexes?: Array<{ indexName?: string }>
  nextToken?: string
}

async function main() {
  const config = getAcceptanceConfig()
  const token = requireServiceKey(config)
  const client = createRestClient()

  console.log(`Target: ${config.baseUrl}`)
  console.log(
    confirmed
      ? 'Mode: LIVE (--yes passed, resources will be deleted)'
      : 'Mode: DRY RUN (pass --yes and ensure ACCEPTANCE_ALLOW_DESTRUCTIVE is set to actually delete anything)'
  )
  if (config.rlsBucket) {
    console.log(`Preserving RLS fixture bucket: ${config.rlsBucket} (emptied, not deleted)`)
  }
  console.log()

  await resetStorageBuckets(client, token, config.rlsBucket)
  await resetAnalyticsBuckets(client, token)
  await resetVectorBuckets(client, token)

  console.log('\nDone.')
}

async function resetStorageBuckets(
  client: AcceptanceHttpClient,
  token: string,
  preserveBucketId: string | undefined
) {
  const buckets = await listAllPages<StorageBucket>((limit, offset) =>
    client
      .request<StorageBucket[]>('GET', `/bucket?limit=${limit}&offset=${offset}`, {
        expectedStatus: 200,
        token,
      })
      .then((res) => res.json ?? [])
  )
  console.log(`Storage buckets: ${buckets.length}`)

  await mapWithConcurrency(buckets, CONCURRENCY, async (bucket) => {
    const preserve = bucket.id === preserveBucketId
    console.log(`  [storage] emptying ${bucket.id}${preserve ? ' (preserving bucket)' : ''}`)

    if (confirmed) {
      await emptyStorageBucketAndWait(client, token, bucket.id)
    }

    if (preserve) {
      return
    }

    console.log(`  [storage] deleting ${bucket.id}`)
    if (confirmed) {
      await client.request('DELETE', `/bucket/${bucket.id}`, {
        expectedStatus: [200, 400, 404],
        token,
      })
    }
  })
}

async function emptyStorageBucketAndWait(
  client: AcceptanceHttpClient,
  token: string,
  bucketId: string
) {
  await client.request('POST', `/bucket/${bucketId}/empty`, {
    expectedStatus: 200,
    token,
  })

  const deadline = Date.now() + EMPTY_BUCKET_POLL_TIMEOUT_MS
  for (;;) {
    const listing = await client.request<ListObjectsV2Response>(
      'POST',
      `/object/list-v2/${bucketId}`,
      {
        body: { limit: 1 },
        expectedStatus: 200,
        token,
      }
    )
    const isEmpty =
      (listing.json?.folders?.length ?? 0) === 0 && (listing.json?.objects?.length ?? 0) === 0
    if (isEmpty) {
      return
    }
    if (Date.now() > deadline) {
      throw new Error(`Timed out waiting for bucket ${bucketId} to empty`)
    }
    await delay(EMPTY_BUCKET_POLL_INTERVAL_MS)
  }
}

async function resetAnalyticsBuckets(client: AcceptanceHttpClient, token: string) {
  const buckets = await listAllPages<AnalyticsBucket>((limit, offset) =>
    client
      .request<AnalyticsBucket[]>('GET', `/iceberg/bucket?limit=${limit}&offset=${offset}`, {
        expectedStatus: 200,
        token,
      })
      .then((res) => res.json ?? [])
  )
  console.log(`Analytics (Iceberg) buckets: ${buckets.length}`)

  // Deleting an analytics bucket queues an async job that cascades the delete to its
  // namespaces and tables, so there's nothing to empty/poll here - just delete the bucket.
  await mapWithConcurrency(buckets, CONCURRENCY, async (bucket) => {
    console.log(`  [analytics] deleting ${bucket.name}`)
    if (confirmed) {
      await client.request('DELETE', `/iceberg/bucket/${bucket.name}`, {
        expectedStatus: [200, 400, 404],
        token,
      })
    }
  })
}

async function resetVectorBuckets(client: AcceptanceHttpClient, token: string) {
  const buckets: string[] = []
  let nextToken: string | undefined

  do {
    const page = await client.request<VectorListBucketsResponse>(
      'POST',
      '/vector/ListVectorBuckets',
      {
        body: { maxResults: 500, nextToken },
        expectedStatus: 200,
        token,
      }
    )
    for (const bucket of page.json?.vectorBuckets ?? []) {
      if (bucket.vectorBucketName) {
        buckets.push(bucket.vectorBucketName)
      }
    }
    nextToken = page.json?.nextToken
  } while (nextToken)

  console.log(`Vector buckets: ${buckets.length}`)

  await mapWithConcurrency(buckets, CONCURRENCY, async (vectorBucketName) => {
    let indexToken: string | undefined

    do {
      const page = await client.request<VectorListIndexesResponse>('POST', '/vector/ListIndexes', {
        body: { maxResults: 500, nextToken: indexToken, vectorBucketName },
        expectedStatus: 200,
        token,
      })

      for (const index of page.json?.indexes ?? []) {
        if (!index.indexName) {
          continue
        }
        console.log(`  [vector] deleting index ${vectorBucketName}/${index.indexName}`)
        if (confirmed) {
          await client.request('POST', '/vector/DeleteIndex', {
            body: { indexName: index.indexName, vectorBucketName },
            expectedStatus: [200, 400, 404],
            token,
          })
        }
      }

      indexToken = page.json?.nextToken
    } while (indexToken)

    console.log(`  [vector] deleting bucket ${vectorBucketName}`)
    if (confirmed) {
      await client.request('POST', '/vector/DeleteVectorBucket', {
        body: { vectorBucketName },
        expectedStatus: [200, 400, 404],
        token,
      })
    }
  })
}

/** Fetches limit/offset pages via `fetchPage` until a short page signals the end. */
async function listAllPages<T>(
  fetchPage: (limit: number, offset: number) => Promise<T[]>
): Promise<T[]> {
  const items: T[] = []
  let offset = 0

  for (;;) {
    const page = await fetchPage(LIST_PAGE_SIZE, offset)
    items.push(...page)
    if (page.length < LIST_PAGE_SIZE) {
      return items
    }
    offset += LIST_PAGE_SIZE
  }
}

async function mapWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  const queue = [...items]
  const errors: unknown[] = []

  async function worker() {
    for (;;) {
      const item = queue.shift()
      if (item === undefined) {
        return
      }
      try {
        await fn(item)
      } catch (error) {
        errors.push(error)
        console.error('  error:', error)
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()))

  if (errors.length > 0) {
    throw new Error(`${errors.length} resource(s) failed to reset (see errors above)`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
