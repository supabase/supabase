import { randomUUID } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { describeAcceptance, encodePathSegments, getAcceptanceConfig } from '../support/config'
import { createRestClient } from '../support/http'
import {
  cleanupRestObjects,
  cleanupRestResources,
  createRestBucket,
  requireServiceKey,
  uniqueBucketName,
  uniqueObjectKey,
  uploadRestObject,
} from '../support/resources'

interface BucketResponse {
  id: string
  name: string
  public: boolean
}

interface ListObjectsV2Response {
  folders: Array<{ name: string }>
  hasNext?: boolean
  nextCursor?: string
  objects: Array<{ name: string; created_at?: string; updated_at?: string }>
}

interface ErrorResponse {
  error?: string
  message?: string
  statusCode?: string
}

const CURSOR_TIMESTAMP_SPACING_MS = 50

describeAcceptance(
  'database adapter behavior pinning',
  {
    destructive: true,
    profiles: ['core'],
  },
  () => {
    it('treats LIKE wildcards as literals in REST bucket search', async () => {
      const config = getAcceptanceConfig()
      const client = createRestClient()
      const token = requireServiceKey(config)

      // ILIKE wildcards (% and _) inside the search term must be escaped so they
      // match literally; otherwise an attacker could exfiltrate rows by searching `%`.
      const suffix = randomUUID().replace(/-/g, '').slice(0, 12)
      const literalUnderscore = `${config.resourcePrefix}-like-a_b-${suffix}`
        .toLowerCase()
        .slice(0, 63)
      const literalAny = `${config.resourcePrefix}-like-axb-${suffix}`.toLowerCase().slice(0, 63)
      const buckets = [literalUnderscore, literalAny]

      try {
        await createRestBucket(literalUnderscore)
        await createRestBucket(literalAny)

        // Searching for `a_b` with the underscore intentionally treated as literal
        // must match only the bucket containing `a_b`, not `axb`. Without escaping
        // both would match because `_` is a single-character LIKE wildcard.
        const underscoreSearch = await client.request<BucketResponse[]>(
          'GET',
          `/bucket?search=${encodeURIComponent(`like-a_b-${suffix}`)}`,
          { expectedStatus: 200, token }
        )
        const underscoreNames = (underscoreSearch.json ?? []).map((bucket) => bucket.id)
        expect(underscoreNames).toContain(literalUnderscore)
        expect(underscoreNames).not.toContain(literalAny)

        // A search composed entirely of `%` would match every bucket without
        // escaping; with escaping it cannot match any bucket name (`%` is not a
        // valid bucket character).
        const wildcardSearch = await client.request<BucketResponse[]>(
          'GET',
          `/bucket?search=${encodeURIComponent('%')}`,
          { expectedStatus: 200, token }
        )
        expect(wildcardSearch.json).toEqual([])
      } finally {
        for (const bucket of buckets) {
          await cleanupRestResources(bucket, [], client)
        }
      }
    })

    it('treats LIKE wildcards as literals in REST list-v2 prefix', async () => {
      const config = getAcceptanceConfig()
      const client = createRestClient()
      const token = requireServiceKey(config)
      const bucketName = uniqueBucketName('likeprefix')
      const suffix = randomUUID().replace(/-/g, '').slice(0, 8)
      const literalUnderscoreKey = `${config.resourcePrefix}/lp-${suffix}/foo_bar.txt`
      const literalAnyKey = `${config.resourcePrefix}/lp-${suffix}/fooxbar.txt`
      const objectKeys = [literalUnderscoreKey, literalAnyKey]

      try {
        await createRestBucket(bucketName, { isPublic: false })
        await uploadRestObject(bucketName, literalUnderscoreKey, 'a')
        await uploadRestObject(bucketName, literalAnyKey, 'b')

        // Listing with prefix `foo_b` must match only `foo_bar.txt`, not `fooxbar.txt`.
        // Without escaping `_` matches any single character and would return both.
        const literal = await client.request<ListObjectsV2Response>(
          'POST',
          `/object/list-v2/${bucketName}`,
          {
            body: {
              limit: 100,
              prefix: `${config.resourcePrefix}/lp-${suffix}/foo_b`,
              with_delimiter: false,
            },
            expectedStatus: 200,
            token,
          }
        )
        const literalNames = literal.json?.objects.map((object) => object.name) ?? []
        expect(literalNames).toEqual([literalUnderscoreKey])

        // Sanity: a wildcard (no escape) prefix would exfiltrate both keys; the
        // matched-set must be unchanged when we ask for the literal `_` prefix.
        const both = await client.request<ListObjectsV2Response>(
          'POST',
          `/object/list-v2/${bucketName}`,
          {
            body: {
              limit: 100,
              prefix: `${config.resourcePrefix}/lp-${suffix}/foo`,
              with_delimiter: false,
            },
            expectedStatus: 200,
            token,
          }
        )
        const bothNames = both.json?.objects.map((object) => object.name) ?? []
        expect(bothNames).toEqual(expect.arrayContaining([literalUnderscoreKey, literalAnyKey]))
      } finally {
        await cleanupRestResources(bucketName, objectKeys, client)
      }
    })

    it('round-trips list-v2 cursor pagination with sortBy.column=created_at desc', async () => {
      const config = getAcceptanceConfig()
      const client = createRestClient()
      const token = requireServiceKey(config)
      const bucketName = uniqueBucketName('cur')
      const suffix = randomUUID().replace(/-/g, '').slice(0, 8)
      const prefix = `${config.resourcePrefix}/cur-${suffix}`
      const orderedKeys = [
        `${prefix}/03-charlie.txt`,
        `${prefix}/01-alpha.txt`,
        `${prefix}/04-delta.txt`,
        `${prefix}/02-bravo.txt`,
      ]

      try {
        await createRestBucket(bucketName, { isPublic: false })

        // The adapter uses name as a tie-breaker, but this case needs distinct
        // timestamp values after the cursor's millisecond truncation so it proves
        // created_at ordering instead of name ordering.
        for (const key of orderedKeys) {
          await uploadRestObject(bucketName, key, key)
          await delay(CURSOR_TIMESTAMP_SPACING_MS)
        }

        const firstPage = await client.request<ListObjectsV2Response>(
          'POST',
          `/object/list-v2/${bucketName}`,
          {
            body: {
              limit: 2,
              prefix: `${prefix}/`,
              sortBy: { column: 'created_at', order: 'desc' },
              with_delimiter: false,
            },
            expectedStatus: 200,
            token,
          }
        )
        const firstNames = firstPage.json?.objects.map((object) => object.name) ?? []
        // descending by creation: newest first.
        expect(firstNames).toEqual([orderedKeys[3], orderedKeys[2]])
        expect(firstPage.json?.hasNext).toBe(true)
        expect(firstPage.json?.nextCursor).toBeTruthy()

        const secondPage = await client.request<ListObjectsV2Response>(
          'POST',
          `/object/list-v2/${bucketName}`,
          {
            body: {
              cursor: firstPage.json?.nextCursor,
              limit: 2,
              prefix: `${prefix}/`,
              sortBy: { column: 'created_at', order: 'desc' },
              with_delimiter: false,
            },
            expectedStatus: 200,
            token,
          }
        )
        const secondNames = secondPage.json?.objects.map((object) => object.name) ?? []
        expect(secondNames).toEqual([orderedKeys[1], orderedKeys[0]])
        expect(secondPage.json?.hasNext).toBe(false)
      } finally {
        await cleanupRestResources(bucketName, orderedKeys, client)
      }
    })

    it('round-trips list-v2 cursor pagination with sortBy.column=updated_at asc', async () => {
      const config = getAcceptanceConfig()
      const client = createRestClient()
      const token = requireServiceKey(config)
      const bucketName = uniqueBucketName('cur2')
      const suffix = randomUUID().replace(/-/g, '').slice(0, 8)
      const prefix = `${config.resourcePrefix}/cur2-${suffix}`
      const orderedKeys = [`${prefix}/k1.txt`, `${prefix}/k2.txt`, `${prefix}/k3.txt`]

      try {
        await createRestBucket(bucketName, { isPublic: false })

        // Keep updated_at values distinct after millisecond truncation so the
        // cursor exercises timestamp ordering, not just the name tie-breaker.
        for (const key of orderedKeys) {
          await uploadRestObject(bucketName, key, 'v')
          await delay(CURSOR_TIMESTAMP_SPACING_MS)
        }

        // Make the first key newest by updated_at while keeping its created_at
        // oldest. This proves the cursor follows updated_at, not insertion/name
        // order.
        await uploadRestObject(bucketName, orderedKeys[0], 'v2')
        await delay(CURSOR_TIMESTAMP_SPACING_MS)

        const expectedByUpdatedAt = [orderedKeys[1], orderedKeys[2], orderedKeys[0]]
        const firstPage = await client.request<ListObjectsV2Response>(
          'POST',
          `/object/list-v2/${bucketName}`,
          {
            body: {
              limit: 1,
              prefix: `${prefix}/`,
              sortBy: { column: 'updated_at', order: 'asc' },
              with_delimiter: false,
            },
            expectedStatus: 200,
            token,
          }
        )
        expect(firstPage.json?.objects.map((object) => object.name)).toEqual([
          expectedByUpdatedAt[0],
        ])
        expect(firstPage.json?.hasNext).toBe(true)

        const secondPage = await client.request<ListObjectsV2Response>(
          'POST',
          `/object/list-v2/${bucketName}`,
          {
            body: {
              cursor: firstPage.json?.nextCursor,
              limit: 10,
              prefix: `${prefix}/`,
              sortBy: { column: 'updated_at', order: 'asc' },
              with_delimiter: false,
            },
            expectedStatus: 200,
            token,
          }
        )
        expect(secondPage.json?.objects.map((object) => object.name)).toEqual([
          expectedByUpdatedAt[1],
          expectedByUpdatedAt[2],
        ])
        expect(secondPage.json?.hasNext).toBe(false)
      } finally {
        await cleanupRestResources(bucketName, orderedKeys, client)
      }
    })

    it('lists with delimiter exposes immediate children only (storage.search_v2 path)', async () => {
      const config = getAcceptanceConfig()
      const client = createRestClient()
      const token = requireServiceKey(config)
      const bucketName = uniqueBucketName('delim')
      const suffix = randomUUID().replace(/-/g, '').slice(0, 8)
      const prefix = `${config.resourcePrefix}/delim-${suffix}`
      const directKey = `${prefix}/file.txt`
      const nestedKey = `${prefix}/sub/file.txt`
      const deeperKey = `${prefix}/sub/deeper/file.txt`
      const objectKeys = [directKey, nestedKey, deeperKey]

      try {
        await createRestBucket(bucketName, { isPublic: false })
        await uploadRestObject(bucketName, directKey, 'd')
        await uploadRestObject(bucketName, nestedKey, 'n')
        await uploadRestObject(bucketName, deeperKey, 'x')

        // search_v2 collapses everything below the prefix's level into folders
        // and only returns objects sharing the exact level. Verify the nested
        // child is reported as a folder (`sub/`) and the direct file is reported
        // as an object — the deeper key must not surface.
        const listed = await client.request<ListObjectsV2Response>(
          'POST',
          `/object/list-v2/${bucketName}`,
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
        expect(listed.json?.objects.map((object) => object.name)).toEqual([directKey])
        expect(listed.json?.folders.map((folder) => folder.name)).toEqual([`${prefix}/sub/`])
      } finally {
        await cleanupRestResources(bucketName, objectKeys, client)
      }
    })

    it('rejects deletion of a non-empty bucket with ResourceNotEmpty', async () => {
      const config = getAcceptanceConfig()
      const client = createRestClient()
      const token = requireServiceKey(config)
      const bucketName = uniqueBucketName('nonempty')
      const objectKey = uniqueObjectKey('nonempty')
      const objectKeys = [objectKey]

      try {
        await createRestBucket(bucketName, { isPublic: false })
        await uploadRestObject(bucketName, objectKey, 'x')

        // Bucket deletion must check object count before issuing the FK-violating
        // DELETE; the storage layer normalises that into ResourceNotEmpty rather
        // than a raw FK exception (23503). The default REST error handler maps
        // non-500 statuses to 400 (preserving the original 409 inside the body).
        const denied = await client.request<ErrorResponse>('DELETE', `/bucket/${bucketName}`, {
          expectedStatus: 400,
          token,
        })
        expect(denied.json?.error).toBe('ResourceNotEmpty')
        expect(denied.json?.statusCode).toBe('409')
      } finally {
        await cleanupRestResources(bucketName, objectKeys, client)
      }
    })

    it('reports a missing object with the storage NoSuchKey contract', async () => {
      const config = getAcceptanceConfig()
      const client = createRestClient()
      const token = requireServiceKey(config)
      const bucketName = uniqueBucketName('missing')
      const objectKey = uniqueObjectKey('missing')

      try {
        await createRestBucket(bucketName, { isPublic: false })
        // The pg-backed findObject must propagate NoSuchKey for absent rows.
        // The default REST error handler maps non-500 statuses to 400 while the
        // body preserves the legacy storage error payload.
        const missingInfo = await client.request<ErrorResponse>(
          'GET',
          `/object/info/authenticated/${bucketName}/${encodePathSegments(objectKey)}`,
          { expectedStatus: 400, token }
        )
        expect(missingInfo.json).toMatchObject({
          error: 'not_found',
          message: 'Object not found',
          statusCode: '404',
        })

        // HEAD intentionally carries no body, but should keep the same legacy
        // user-facing HTTP status.
        const missing = await client.request(
          'HEAD',
          `/object/${bucketName}/${encodePathSegments(objectKey)}`,
          { expectedStatus: 400, token }
        )
        expect(missing.body).toBe('')
      } finally {
        await cleanupRestResources(bucketName, [], client)
      }
    })

    it('rejects copy without x-upsert when destination already exists', async () => {
      const config = getAcceptanceConfig()
      const client = createRestClient()
      const token = requireServiceKey(config)
      const bucketName = uniqueBucketName('copydup')
      const sourceKey = uniqueObjectKey('copy-src')
      const existingKey = uniqueObjectKey('copy-dst')
      const objectKeys = [sourceKey, existingKey]

      try {
        await createRestBucket(bucketName, { isPublic: false })
        await uploadRestObject(bucketName, sourceKey, 'src')
        await uploadRestObject(bucketName, existingKey, 'existing')

        // Copy without `x-upsert: true` onto an existing key relies on the
        // unique (name, bucket_id) constraint. The pg layer must surface 23505
        // as KeyAlreadyExists (storage code) — the REST handler then folds the
        // internal 409 into a 400 user status while keeping the body intact.
        // The `error` field carries the legacy `Duplicate` tag for clients.
        const denied = await client.request<ErrorResponse>('POST', '/object/copy', {
          body: {
            bucketId: bucketName,
            destinationKey: existingKey,
            sourceKey,
          },
          expectedStatus: 400,
          token,
        })
        expect(denied.json?.error).toBe('Duplicate')
        expect(denied.json?.statusCode).toBe('409')

        // The original destination object must still hold its previous content.
        const unchanged = await client.request(
          'GET',
          `/object/authenticated/${bucketName}/${encodePathSegments(existingKey)}`,
          { expectedStatus: 200, token }
        )
        expect(unchanged.body).toBe('existing')
      } finally {
        await cleanupRestResources(bucketName, objectKeys, client)
      }
    })

    it('preserves objects with literal underscore characters in their key', async () => {
      const config = getAcceptanceConfig()
      const client = createRestClient()
      const token = requireServiceKey(config)
      const bucketName = uniqueBucketName('keys')
      const suffix = randomUUID().replace(/-/g, '').slice(0, 8)
      const folder = `${config.resourcePrefix}/keys-${suffix}`
      const literalUnderscoreKey = `${folder}/a_b_c.txt`
      const objectKeys = [literalUnderscoreKey]

      try {
        await createRestBucket(bucketName, { isPublic: false })
        await uploadRestObject(bucketName, literalUnderscoreKey, 'underscore')

        // Round-trip: GET must return the object by exact key.
        const downloaded = await client.request(
          'GET',
          `/object/authenticated/${bucketName}/${encodePathSegments(literalUnderscoreKey)}`,
          { expectedStatus: 200, token }
        )
        expect(downloaded.body).toBe('underscore')

        // Listing without delimiter (no LIKE on user input besides escaped prefix)
        // returns the exact name including underscores, with no surrounding noise.
        const listed = await client.request<ListObjectsV2Response>(
          'POST',
          `/object/list-v2/${bucketName}`,
          {
            body: {
              limit: 100,
              prefix: `${folder}/`,
              with_delimiter: false,
            },
            expectedStatus: 200,
            token,
          }
        )
        expect(listed.json?.objects.map((object) => object.name)).toEqual([literalUnderscoreKey])
      } finally {
        await cleanupRestObjects(bucketName, objectKeys, client)
        await client
          .request('DELETE', `/bucket/${bucketName}`, {
            expectedStatus: [200, 400, 404],
            token,
          })
          .catch(() => undefined)
      }
    })
  }
)
