import { randomUUID } from 'node:crypto'
import {
  type DatabaseTransaction,
  getPostgresConnection,
  getServiceKeyUser,
} from '@internal/database'
import { ListObjectsV2Result } from '@storage/object'
import { FastifyInstance } from 'fastify'
import app from '../app'
import { getConfig } from '../config'
import { Obj } from '../storage'
import { useMockObject, useMockQueue } from './common'
import { useStorage, withDeleteEnabled } from './utils/storage'

const { serviceKeyAsync, tenantId } = getConfig()
let appInstance: FastifyInstance
let serviceKey: string = ''

let tnx: DatabaseTransaction | undefined
async function getSuperuserPostgrestClient() {
  const superUser = await getServiceKeyUser(tenantId)

  const conn = await getPostgresConnection({
    superUser,
    user: superUser,
    tenantId,
    host: 'localhost',
  })
  tnx = await conn.transaction()

  return tnx
}

async function insertObjects(
  db: DatabaseTransaction,
  objects:
    | Array<Partial<Obj> & { bucket_id: string; name: string }>
    | (Partial<Obj> & { bucket_id: string; name: string })
) {
  const rows = Array.isArray(objects) ? objects : [objects]

  for (const row of rows) {
    const entries = Object.entries(row)
    await db.query({
      text: `
        INSERT INTO objects (${entries.map(([column]) => column).join(', ')})
        VALUES (${entries.map((_, index) => `$${index + 1}`).join(', ')})
      `,
      values: entries.map(([, value]) => value),
    })
  }
}

async function deleteObjectsByName(
  db: DatabaseTransaction,
  bucketId: string,
  names: string | string[]
) {
  await db.query({
    text: `
      DELETE FROM objects
      WHERE bucket_id = $1
        AND name = ANY($2::text[])
    `,
    values: [bucketId, Array.isArray(names) ? names : [names]],
  })
}

useMockObject()
useMockQueue()
const storageTest = useStorage()

beforeEach(() => {
  getConfig({ reload: true })
  appInstance = app()
})

afterEach(async () => {
  if (tnx && !tnx.isCompleted()) {
    await tnx.commit()
  }
  tnx = undefined
  await appInstance.close()
})

const LIST_V2_BUCKET = 'list-v2-sorting-test-bucket'

// Helper to convert a number into a 3-letter string (aaa ... zzz with some uppercase)
function toName(n: number): string {
  const a = 97 // 'a'
  const first = String.fromCharCode(a + (Math.floor(n / (26 * 26)) % 26))
  const second = String.fromCharCode(a + (Math.floor(n / 26) % 26))
  const third = String.fromCharCode(a + (n % 26))
  const name = first + second + third
  if (n >= 1 && n <= 3) {
    return name.toUpperCase()
  }
  return name
}

function createUpload(name: string, content: string) {
  return new File([content], name)
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const SORTED_OBJECTS: string[] = []
const SORTED_FOLDERS: string[] = []
const NESTED_OBJECTS: string[] = []
const PREFIX_OBJECTS: Record<string, { sorted: string[]; created: string[]; updated: string[] }> =
  {}
const TEST_PREFIX = 'aal'

// Generate sorted list of objects/folders
for (let i = 0; i < 30; i++) {
  const name = toName(i)
  if (i > 5) {
    SORTED_OBJECTS.push(name + '.txt')
  }
  if (i < 18) {
    const folder = name + '/'
    SORTED_FOLDERS.push(folder)

    const nestedCount = name === TEST_PREFIX ? 9 : 3
    for (let j = 0; j < nestedCount; j++) {
      const objectPath = `${folder}dummy-${name}-${j}.txt`
      NESTED_OBJECTS.push(objectPath)
      PREFIX_OBJECTS[folder] ??= { sorted: [], created: [], updated: [] }
      PREFIX_OBJECTS[folder].sorted.push(objectPath)
    }
  }
}

// Sort the arrays since uppercase letters may have changed the order
SORTED_OBJECTS.sort()
SORTED_FOLDERS.sort()
for (const folder of Object.keys(PREFIX_OBJECTS)) {
  PREFIX_OBJECTS[folder].sorted.sort()
}

// Combine all paths for creation
const ALL_PATHS = [...SORTED_OBJECTS, ...NESTED_OBJECTS].sort()

// Lists of objects and folders in sorted
const CREATION_ORDER_OBJECTS: string[] = []
const UPDATE_ORDER_OBJECTS: string[] = []
const CREATION_ORDER_FOLDERS: string[] = []
const CREATION_ORDER_ALL: string[] = []
const UPDATE_ORDER_ALL: string[] = []

beforeAll(async () => {
  serviceKey = await serviceKeyAsync
  appInstance = app()

  // Create bucket
  await appInstance.inject({
    method: 'POST',
    url: `/bucket`,
    headers: {
      authorization: `Bearer ${serviceKey}`,
    },
    payload: {
      name: LIST_V2_BUCKET,
    },
  })

  const shuffledPaths = shuffleArray(ALL_PATHS)

  // Create all objects in random order
  for (const path of shuffledPaths) {
    if (path.includes('/')) {
      // root folders in creation order
      const rootFolder = path.split('/')[0] + '/'
      if (!CREATION_ORDER_FOLDERS.includes(rootFolder)) {
        CREATION_ORDER_FOLDERS.push(rootFolder)
      }
      PREFIX_OBJECTS[rootFolder].created.push(path)
      PREFIX_OBJECTS[rootFolder].updated.push(path)
    } else {
      // root objects in creation order
      CREATION_ORDER_OBJECTS.push(path)
      UPDATE_ORDER_OBJECTS.push(path)
    }
    CREATION_ORDER_ALL.push(path)
    UPDATE_ORDER_ALL.push(path)
    await appInstance.inject({
      method: 'POST',
      url: `/object/${LIST_V2_BUCKET}/${path}`,
      payload: createUpload(path, 'test content'),
      headers: {
        authorization: serviceKey,
      },
    })
  }

  const headers = {
    authorization: serviceKey,
    'x-upsert': 'true',
  }

  // update a few objects to make updated_at different than created_at
  for (let i = 0; i < 10; i++) {
    const firstItem = UPDATE_ORDER_OBJECTS.shift()!
    await appInstance.inject({
      method: 'POST',
      url: `/object/${LIST_V2_BUCKET}/${firstItem}`,
      payload: createUpload(firstItem, 'test content'),
      headers,
    })
    UPDATE_ORDER_OBJECTS.push(firstItem)

    // re-arrange item in flat object list to updated order
    UPDATE_ORDER_ALL.splice(UPDATE_ORDER_ALL.indexOf(firstItem), 1)
    UPDATE_ORDER_ALL.push(firstItem)
  }

  // switch to Object.entries(PREFIX_OBJECTS) to test all prefixes
  const prefixRoot = TEST_PREFIX + '/'
  const obj = PREFIX_OBJECTS[prefixRoot]
  const firstPrefixItem = obj.updated.shift()!
  await appInstance.inject({
    method: 'POST',
    url: `/object/${LIST_V2_BUCKET}/${firstPrefixItem}`,
    payload: createUpload(firstPrefixItem, 'test content'),
    headers,
  })
  PREFIX_OBJECTS[prefixRoot].updated.push(firstPrefixItem)

  // re-arrange item in flat object list to updated order of nested item
  UPDATE_ORDER_ALL.splice(UPDATE_ORDER_ALL.indexOf(firstPrefixItem), 1)
  UPDATE_ORDER_ALL.push(firstPrefixItem)

  await appInstance.close()
}, 300000)

afterAll(async () => {
  appInstance = app()

  // Empty the bucket
  await appInstance.inject({
    method: 'POST',
    url: `/bucket/${LIST_V2_BUCKET}/empty`,
    headers: {
      authorization: `Bearer ${serviceKey}`,
    },
  })

  // Delete the bucket
  await appInstance.inject({
    method: 'DELETE',
    url: `/bucket/${LIST_V2_BUCKET}`,
    headers: {
      authorization: `Bearer ${serviceKey}`,
    },
  })

  await appInstance.close()
})

describe('objects - list v2 sorting tests', () => {
  const TEST_CASES = [
    // WITH DELIMITER
    {
      desc: 'with delimiter - default sorting (name asc)',
      options: {
        with_delimiter: true,
      },
      expected: { objects: SORTED_OBJECTS, folders: SORTED_FOLDERS },
    },
    {
      desc: 'with delimiter - name desc',
      options: {
        with_delimiter: true,
        sortBy: {
          column: 'name',
          order: 'desc',
        },
      },
      expected: {
        objects: SORTED_OBJECTS.slice().reverse(),
        folders: SORTED_FOLDERS.slice().reverse(),
      },
    },

    {
      desc: 'with delimiter - created asc',
      options: {
        with_delimiter: true,
        sortBy: {
          column: 'created_at',
          order: 'asc',
        },
      },
      expected: {
        get objects() {
          return CREATION_ORDER_OBJECTS
        },
        get folders() {
          return CREATION_ORDER_FOLDERS
        },
      },
    },
    {
      desc: 'with delimiter - created desc',
      options: {
        with_delimiter: true,
        sortBy: {
          column: 'created_at',
          order: 'desc',
        },
      },
      expected: {
        get objects() {
          return CREATION_ORDER_OBJECTS.slice().reverse()
        },
        get folders() {
          return CREATION_ORDER_FOLDERS.slice().reverse()
        },
      },
    },

    {
      desc: 'with delimiter - updated asc',
      options: {
        with_delimiter: true,
        sortBy: {
          column: 'updated_at',
          order: 'asc',
        },
      },
      expected: {
        get objects() {
          return UPDATE_ORDER_OBJECTS
        },
        get folders() {
          return CREATION_ORDER_FOLDERS
        },
      },
    },
    {
      desc: 'with delimiter - updated desc',
      options: {
        with_delimiter: true,
        sortBy: {
          column: 'updated_at',
          order: 'desc',
        },
      },
      expected: {
        get objects() {
          return UPDATE_ORDER_OBJECTS.slice().reverse()
        },
        get folders() {
          return CREATION_ORDER_FOLDERS.slice().reverse()
        },
      },
    },

    // WITHOUT DELIMITER
    {
      desc: 'without delimiter - default sorting (name asc)',
      options: {
        with_delimiter: false,
      },
      expected: { objects: ALL_PATHS, folders: [] },
    },
    {
      desc: 'without delimiter - name desc without delimiter',
      options: {
        with_delimiter: false,
        sortBy: {
          column: 'name',
          order: 'desc',
        },
      },
      expected: { objects: ALL_PATHS.slice().reverse(), folders: [] },
    },

    {
      desc: 'without delimiter - created asc',
      options: {
        with_delimiter: false,
        sortBy: {
          column: 'created_at',
          order: 'asc',
        },
      },
      expected: {
        get objects() {
          return CREATION_ORDER_ALL
        },
        folders: [],
      },
    },
    {
      desc: 'without delimiter - created desc',
      options: {
        with_delimiter: false,
        sortBy: {
          column: 'created_at',
          order: 'desc',
        },
      },
      expected: {
        get objects() {
          return CREATION_ORDER_ALL.slice().reverse()
        },
        folders: [],
      },
    },

    {
      desc: 'without delimiter - updated asc',
      options: {
        with_delimiter: false,
        sortBy: {
          column: 'updated_at',
          order: 'asc',
        },
      },
      expected: {
        get objects() {
          return UPDATE_ORDER_ALL
        },
        folders: [],
      },
    },
    {
      desc: 'without delimiter - updated desc',
      options: {
        with_delimiter: false,
        sortBy: {
          column: 'updated_at',
          order: 'desc',
        },
      },
      expected: {
        get objects() {
          return UPDATE_ORDER_ALL.slice().reverse()
        },
        folders: [],
      },
    },

    // WITH PREFIX
    {
      desc: `prefix - with delimiter - default sorting (name asc)`,
      options: {
        with_delimiter: true,
        prefix: TEST_PREFIX + '/',
      },
      expected: { objects: PREFIX_OBJECTS[TEST_PREFIX + '/'].sorted, folders: [] },
    },
    {
      desc: 'prefix - with delimiter - name desc',
      options: {
        with_delimiter: true,
        prefix: TEST_PREFIX + '/',
        sortBy: {
          column: 'name',
          order: 'desc',
        },
      },
      expected: {
        objects: PREFIX_OBJECTS[TEST_PREFIX + '/'].sorted.slice().reverse(),
        folders: [],
      },
    },

    {
      desc: 'prefix - with delimiter - created asc',
      options: {
        with_delimiter: true,
        prefix: TEST_PREFIX + '/',
        sortBy: {
          column: 'created_at',
          order: 'asc',
        },
      },
      expected: {
        get objects() {
          return PREFIX_OBJECTS[TEST_PREFIX + '/'].created
        },
        folders: [],
      },
    },
    {
      desc: 'prefix - with delimiter - created desc',
      options: {
        with_delimiter: true,
        prefix: TEST_PREFIX + '/',
        sortBy: {
          column: 'created_at',
          order: 'desc',
        },
      },
      expected: {
        get objects() {
          return PREFIX_OBJECTS[TEST_PREFIX + '/'].created.slice().reverse()
        },
        folders: [],
      },
    },

    {
      desc: 'prefix - with delimiter - updated asc',
      options: {
        with_delimiter: true,
        prefix: TEST_PREFIX + '/',
        sortBy: {
          column: 'updated_at',
          order: 'asc',
        },
      },
      expected: {
        get objects() {
          return PREFIX_OBJECTS[TEST_PREFIX + '/'].updated
        },
        folders: [],
      },
    },
    {
      desc: 'prefix - with delimiter - updated desc',
      options: {
        with_delimiter: true,
        prefix: TEST_PREFIX + '/',
        sortBy: {
          column: 'updated_at',
          order: 'desc',
        },
      },
      expected: {
        get objects() {
          return PREFIX_OBJECTS[TEST_PREFIX + '/'].updated.slice().reverse()
        },
        folders: [],
      },
    },

    {
      desc: 'prefix with slash - without delimiter',
      options: {
        with_delimiter: false,
        prefix: TEST_PREFIX + '/',
      },
      expected: { objects: PREFIX_OBJECTS[TEST_PREFIX + '/'].sorted, folders: [] },
    },

    {
      desc: 'prefix without slash - with delimiter',
      options: {
        with_delimiter: true,
        prefix: TEST_PREFIX,
      },
      expected: { objects: [TEST_PREFIX + '.txt'], folders: [TEST_PREFIX + '/'] },
    },

    {
      desc: 'prefix without slash - without delimiter',
      options: {
        with_delimiter: false,
        prefix: TEST_PREFIX,
      },
      expected: {
        objects: [TEST_PREFIX + '.txt', ...PREFIX_OBJECTS[TEST_PREFIX + '/'].sorted],
        folders: [],
      },
    },
  ]

  for (const { desc, options, expected } of TEST_CASES) {
    test(desc + ' in correct order with pagination', async () => {
      const limit = 5
      let cursor: string | undefined
      let pageCount = 0
      let lastObjectIdx = -1
      let lastFolderIdx = -1
      let hasNext = false

      // Paginate through all results
      do {
        const response = await appInstance.inject({
          method: 'POST',
          url: '/object/list-v2/' + LIST_V2_BUCKET,
          headers: {
            authorization: `Bearer ${serviceKey}`,
          },
          payload: {
            ...options,
            limit,
            cursor,
          },
        })

        const data = response.json<ListObjectsV2Result>()
        expect(response.statusCode).toBe(200)

        // Verify each object is the expected next one in sequence
        data.objects.forEach((obj) => {
          const expObj = expected.objects[++lastObjectIdx]
          expect(obj.name).toBe(expObj)
        })

        // Verify each folder is the expected next one in sequence
        data.folders.forEach((folder) => {
          const expFolder = expected.folders[++lastFolderIdx]
          expect(folder.name).toBe(expFolder)
        })
        pageCount++

        hasNext = data.hasNext ?? false
        if (!hasNext) {
          expect(data.nextCursor).toBeUndefined()
        } else {
          cursor = data.nextCursor as string
          expect(cursor).toBeDefined()
        }
      } while (hasNext)

      // Verify we processed all expected items
      expect(lastObjectIdx).toBe(expected.objects.length - 1)
      expect(lastFolderIdx).toBe(expected.folders.length - 1)
      expect(pageCount).toBe(Math.ceil((expected.objects.length + expected.folders.length) / limit))
    })
  }

  test('omits default list options from continuation tokens for rolling-deploy compatibility', async () => {
    const firstPage = await appInstance.inject({
      method: 'POST',
      url: `/object/list-v2/${LIST_V2_BUCKET}`,
      headers: {
        authorization: `Bearer ${serviceKey}`,
      },
      payload: {
        with_delimiter: false,
        limit: 1,
      },
    })

    expect(firstPage.statusCode).toBe(200)
    const cursor = firstPage.json<ListObjectsV2Result>().nextCursor
    expect(cursor).toBeDefined()
    const decodedCursor = Buffer.from(cursor!, 'base64').toString()
    expect(decodedCursor).not.toMatch(/(^|\n)o:/)
    expect(decodedCursor).not.toMatch(/(^|\n)c:/)
    expect(decodedCursor).not.toMatch(/(^|\n)n:/)
    expect(decodedCursor).not.toMatch(/(^|\n)d:/)
    expect(decodedCursor).not.toMatch(/(^|\n)e:/)

    const changedFilter = await appInstance.inject({
      method: 'POST',
      url: `/object/list-v2/${LIST_V2_BUCKET}`,
      headers: {
        authorization: `Bearer ${serviceKey}`,
      },
      payload: {
        with_delimiter: false,
        limit: 1,
        cursor,
        noncurrentVersions: 'include',
      },
    })

    expect(changedFilter.statusCode).toBe(400)
  })

  test.each([
    'o:sideways',
    'c:metadata',
  ])('rejects an unsupported continuation-token value for %s', async (tokenPart) => {
    const response = await appInstance.inject({
      method: 'POST',
      url: `/object/list-v2/${LIST_V2_BUCKET}`,
      headers: {
        authorization: `Bearer ${serviceKey}`,
      },
      payload: {
        with_delimiter: false,
        limit: 1,
        cursor: Buffer.from(tokenPart).toString('base64'),
      },
    })

    expect(response.statusCode).toBe(400)
  })

  test('rejects a changed prefix during exact-match pagination', async () => {
    const cursor = Buffer.from('l:cursor-key\ne:true').toString('base64')
    const response = await appInstance.inject({
      method: 'POST',
      url: `/object/list-v2/${LIST_V2_BUCKET}`,
      headers: {
        authorization: `Bearer ${serviceKey}`,
      },
      payload: {
        with_delimiter: false,
        prefix: 'different-key',
        exactMatch: true,
        cursor,
      },
    })

    expect(response.statusCode).toBe(400)
  })

  test('encodes only non-default version filters in continuation tokens', async () => {
    const firstPage = await appInstance.inject({
      method: 'POST',
      url: `/object/list-v2/${LIST_V2_BUCKET}`,
      headers: {
        authorization: `Bearer ${serviceKey}`,
      },
      payload: {
        with_delimiter: false,
        limit: 1,
        noncurrentVersions: 'include',
        deleteMarkers: 'exclude',
      },
    })

    expect(firstPage.statusCode).toBe(200)
    const cursor = firstPage.json<ListObjectsV2Result>().nextCursor
    expect(cursor).toBeDefined()
    const decodedCursor = Buffer.from(cursor!, 'base64').toString()
    expect(decodedCursor).toMatch(/(^|\n)n:include($|\n)/)
    expect(decodedCursor).not.toMatch(/(^|\n)d:/)
  })

  test('rejects an invalid exactMatch value in a continuation token', async () => {
    const cursor = Buffer.from('e:invalid').toString('base64')
    const response = await appInstance.inject({
      method: 'POST',
      url: `/object/list-v2/${LIST_V2_BUCKET}`,
      headers: {
        authorization: `Bearer ${serviceKey}`,
      },
      payload: {
        with_delimiter: false,
        cursor,
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({
      message: expect.stringContaining('continuation token'),
    })
  })

  test('uses millisecond precision consistently when paginating by timestamp', async () => {
    const prefix = `same-ms-${randomUUID()}/`
    const firstByName = `${prefix}a.txt`
    const secondByName = `${prefix}z.txt`

    for (const path of [firstByName, secondByName]) {
      const upload = await appInstance.inject({
        method: 'POST',
        url: `/object/${LIST_V2_BUCKET}/${path}`,
        payload: createUpload(path, 'test content'),
        headers: {
          authorization: serviceKey,
        },
      })
      expect(upload.statusCode).toBe(200)
    }

    // Raw timestamp ordering puts z.txt first, while millisecond-truncated
    // ordering treats the timestamps as equal and uses name as the tiebreak.
    // The ORDER BY and cursor comparison must use the same representation.
    await storageTest.database.connection.query(
      `UPDATE storage.objects
       SET created_at = CASE name
         WHEN $2 THEN '2026-01-01 00:00:00.000900+00'::timestamptz
         WHEN $3 THEN '2026-01-01 00:00:00.000100+00'::timestamptz
       END
       WHERE bucket_id = $1 AND name IN ($2, $3)`,
      [LIST_V2_BUCKET, firstByName, secondByName]
    )

    const listed: string[] = []
    let cursor: string | undefined
    do {
      const response = await appInstance.inject({
        method: 'POST',
        url: `/object/list-v2/${LIST_V2_BUCKET}`,
        headers: {
          authorization: `Bearer ${serviceKey}`,
        },
        payload: {
          with_delimiter: false,
          prefix,
          limit: 1,
          cursor,
          sortBy: { column: 'created_at', order: 'asc' },
        },
      })

      expect(response.statusCode).toBe(200)
      const data = response.json<ListObjectsV2Result>()
      listed.push(...data.objects.map((object) => object.name))
      cursor = data.nextCursor
    } while (cursor)

    expect(listed).toEqual([firstByName, secondByName])
  })

  test.each([
    ['flat asc', false, 'asc', ['a.txt', 'b.txt', 'c.txt']],
    ['flat desc', false, 'desc', ['c.txt', 'b.txt', 'a.txt']],
    ['delimiter asc', true, 'asc', ['a.txt', 'b.txt', 'c.txt']],
    ['delimiter desc', true, 'desc', ['c.txt', 'b.txt', 'a.txt']],
  ] as const)('uses the same null timestamp fallback when paginating %s', async (_path, withDelimiter, order, expectedNames) => {
    const bucketId = `null-timestamp-${order}-${randomUUID()}`
    const prefix = `null-timestamp-${order}-${randomUUID()}/`
    const names = expectedNames.map((name) => `${prefix}${name}`)

    const createBucketResponse = await appInstance.inject({
      method: 'POST',
      url: '/bucket',
      headers: {
        authorization: `Bearer ${serviceKey}`,
      },
      payload: { name: bucketId },
    })
    expect(createBucketResponse.statusCode).toBe(200)

    for (const path of names) {
      const upload = await appInstance.inject({
        method: 'POST',
        url: `/object/${bucketId}/${path}`,
        payload: createUpload(path, 'test content'),
        headers: {
          authorization: serviceKey,
        },
      })
      expect(upload.statusCode).toBe(200)
    }

    await storageTest.database.connection.query(
      `UPDATE storage.objects
         SET created_at = CASE
           WHEN name IN ($2, $3) THEN NULL
           ELSE '2026-01-01 00:00:01+00'::timestamptz
         END
         WHERE bucket_id = $1 AND name = ANY($4::text[])`,
      [bucketId, `${prefix}a.txt`, `${prefix}b.txt`, names]
    )

    const listed: string[] = []
    let cursor: string | undefined
    do {
      const response = await appInstance.inject({
        method: 'POST',
        url: `/object/list-v2/${bucketId}`,
        headers: {
          authorization: `Bearer ${serviceKey}`,
        },
        payload: {
          with_delimiter: withDelimiter,
          prefix,
          limit: 1,
          cursor,
          sortBy: { column: 'created_at', order },
        },
      })

      expect(response.statusCode).toBe(200)
      const data = response.json<ListObjectsV2Result>()
      listed.push(...data.objects.map((object) => object.name))
      cursor = data.nextCursor
    } while (cursor)

    expect(listed).toEqual(expectedNames.map((name) => `${prefix}${name}`))

    await appInstance.inject({
      method: 'POST',
      url: `/bucket/${bucketId}/empty`,
      headers: {
        authorization: `Bearer ${serviceKey}`,
      },
    })

    await appInstance.inject({
      method: 'DELETE',
      url: `/bucket/${bucketId}`,
      headers: {
        authorization: `Bearer ${serviceKey}`,
      },
    })
  })
})

const LIST_V2_WILDCARD_BUCKET = `list-v2-wildcard-${randomUUID()}`

describe('objects - list v2 prefix wildcard handling', () => {
  beforeAll(async () => {
    appInstance = app()
    await appInstance.inject({
      method: 'POST',
      url: `/bucket`,
      headers: {
        authorization: `Bearer ${serviceKey}`,
      },
      payload: {
        name: LIST_V2_WILDCARD_BUCKET,
      },
    })
    await appInstance.close()
  })

  afterAll(async () => {
    appInstance = app()
    await appInstance.inject({
      method: 'POST',
      url: `/bucket/${LIST_V2_WILDCARD_BUCKET}/empty`,
      headers: {
        authorization: `Bearer ${serviceKey}`,
      },
    })

    await appInstance.inject({
      method: 'DELETE',
      url: `/bucket/${LIST_V2_WILDCARD_BUCKET}`,
      headers: {
        authorization: `Bearer ${serviceKey}`,
      },
    })

    await appInstance.close()
  })

  test('treats % as a literal character in list-v2 prefix filters', async () => {
    const runId = Date.now().toString(36)
    const firstObject = `percent-${runId}/first.txt`
    const secondObject = `percent-${runId}/second.txt`

    await appInstance.inject({
      method: 'POST',
      url: `/object/${LIST_V2_WILDCARD_BUCKET}/${firstObject}`,
      payload: createUpload('first.txt', 'first'),
      headers: {
        authorization: `Bearer ${serviceKey}`,
      },
    })

    await appInstance.inject({
      method: 'POST',
      url: `/object/${LIST_V2_WILDCARD_BUCKET}/${secondObject}`,
      payload: createUpload('second.txt', 'second'),
      headers: {
        authorization: `Bearer ${serviceKey}`,
      },
    })

    for (const withDelimiter of [false, true]) {
      const response = await appInstance.inject({
        method: 'POST',
        url: `/object/list-v2/${LIST_V2_WILDCARD_BUCKET}`,
        payload: {
          with_delimiter: withDelimiter,
          prefix: '%',
          limit: 100,
          sortBy: { column: 'created_at', order: 'asc' },
        },
        headers: {
          authorization: `Bearer ${serviceKey}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const data = response.json<ListObjectsV2Result>()
      expect(data.folders).toHaveLength(0)
      expect(data.objects).toHaveLength(0)
    }
  })

  test('treats _ as a literal character in list-v2 prefix filters', async () => {
    const runId = randomUUID()
    const literalMatch = `wild_${runId}/hit.txt`
    const wildcardOnlyMatch = `wildX${runId}/miss.txt`

    await appInstance.inject({
      method: 'POST',
      url: `/object/${LIST_V2_WILDCARD_BUCKET}/${literalMatch}`,
      payload: createUpload('hit.txt', 'hit'),
      headers: {
        authorization: `Bearer ${serviceKey}`,
      },
    })

    await appInstance.inject({
      method: 'POST',
      url: `/object/${LIST_V2_WILDCARD_BUCKET}/${wildcardOnlyMatch}`,
      payload: createUpload('miss.txt', 'miss'),
      headers: {
        authorization: `Bearer ${serviceKey}`,
      },
    })

    for (const withDelimiter of [false, true]) {
      const response = await appInstance.inject({
        method: 'POST',
        url: `/object/list-v2/${LIST_V2_WILDCARD_BUCKET}`,
        payload: {
          with_delimiter: withDelimiter,
          prefix: `wild_${runId}/`,
          limit: 100,
          sortBy: { column: 'created_at', order: 'asc' },
        },
        headers: {
          authorization: `Bearer ${serviceKey}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const data = response.json<ListObjectsV2Result>()
      expect(data.folders).toHaveLength(0)
      expect(data.objects.map((obj) => obj.name)).toEqual([literalMatch])
    }
  })
})

describe('storage.get_common_prefix', () => {
  test.each([
    ['a/b//c.txt', 'a/b/', '/', 'a/b//'],
    ['a/b//d/e.txt', 'a/b/', '/', 'a/b//'],
    ['a///b/x.txt', 'a/', '/', 'a//'],
  ])('preserves empty path segments in %s', async (key, prefix, delimiter, expected) => {
    const result = await storageTest.database.connection.query<{ common_prefix: string | null }>(
      'SELECT storage.get_common_prefix($1, $2, $3) AS common_prefix',
      [key, prefix, delimiter]
    )

    expect(result.rows[0]?.common_prefix).toBe(expected)
  })
})

describe('objects - list v2 startAfter and folder cursors', () => {
  async function insertPaths(paths: string[]) {
    await storageTest.database.connection.query(
      `INSERT INTO storage.objects (bucket_id, name)
       SELECT $1, object_name FROM unnest($2::text[]) AS object_name`,
      [LIST_V2_BUCKET, paths]
    )
  }

  test('does not infer a folder from descendants when startAfter is a literal key', async () => {
    await insertPaths(['photos-2026.zip', 'photos/summer.jpg'])

    const result = await storageTest.storage.from(LIST_V2_BUCKET).listObjectsV2({
      delimiter: '/',
      startAfter: 'photos',
      maxKeys: 2,
      sortBy: { column: 'name', order: 'asc' },
    })

    expect(result.objects.map((object) => object.name)).toEqual(['photos-2026.zip'])
    expect(result.folders.map((folder) => folder.name)).toEqual(['photos/'])
  })

  test.each([
    ['asc', 'below', ['m1', 'm2']],
    ['asc', 'above', []],
    ['desc', 'above', ['m2', 'm1']],
    ['desc', 'below', []],
  ] as const)('clamps an out-of-range startAfter to the prefix range in %s order when %s', async (order, position, expectedSuffixes) => {
    const base = `start-after-range-${randomUUID()}/`
    const prefix = `${base}m`
    await insertPaths([`${base}l9`, `${prefix}1`, `${prefix}2`, `${base}n1`])

    const result = await storageTest.storage.from(LIST_V2_BUCKET).listObjectsV2({
      prefix,
      delimiter: '/',
      startAfter: position === 'below' ? `${base}l` : `${base}n`,
      maxKeys: 10,
      sortBy: { column: 'name', order },
    })

    expect(result.objects.map((object) => object.name)).toEqual(
      expectedSuffixes.map((suffix) => `${base}${suffix}`)
    )
    expect(result.folders).toEqual([])
  })

  test.each([
    'asc',
    'desc',
  ] as const)('does not resume an exact-key branch outside the prefix range in %s order', async (order) => {
    const base = `cursor-prefix-bound-${randomUUID()}/`
    const prefix = `${base}a`
    const boundary = order === 'asc' ? `${base}b` : base
    await insertPaths([boundary])

    const result = await storageTest.database.listObjectsV2(LIST_V2_BUCKET, {
      prefix,
      delimiter: ':',
      nextToken: boundary,
      startAfter: boundary,
      maxKeys: 10,
      sortBy: {
        column: 'name',
        order,
        afterArchivedAt: 'infinity',
        afterVersion: '',
      },
      noncurrentVersions: 'include',
    })

    expect(result).toEqual([])
  })

  test('treats a startAfter matching the prefix as a leaf boundary', async () => {
    const prefix = `cursor-prefix-leaf-${randomUUID()}:`
    const children = [`${prefix}a`, `${prefix}b`]
    await insertPaths([prefix, ...children])

    const result = await storageTest.storage.from(LIST_V2_BUCKET).listObjectsV2({
      prefix,
      delimiter: ':',
      startAfter: prefix,
      maxKeys: 10,
      sortBy: { column: 'name', order: 'asc' },
    })

    expect(result.objects.map((object) => object.name)).toEqual(children)
    expect(result.folders).toEqual([])
  })

  test('treats wildcard characters in startAfter as a literal key boundary', async () => {
    const runId = randomUUID()
    const prefix = `start-after-wildcard-${runId}/`
    const boundary = `${prefix}aa_%`
    const adjacentName = `${boundary}!file.txt`
    const wildcardOnlyChild = `${prefix}aaz/child.txt`
    await insertPaths([adjacentName, wildcardOnlyChild])

    const result = await storageTest.storage.from(LIST_V2_BUCKET).listObjectsV2({
      prefix,
      delimiter: '/',
      startAfter: boundary,
      maxKeys: 10,
      sortBy: { column: 'name', order: 'asc' },
    })

    expect(result.objects.map((object) => object.name)).toEqual([adjacentName])
    expect(result.folders.map((folder) => folder.name)).toEqual([`${prefix}aaz/`])
  })

  test('does not infer a delimiter-less startAfter as a folder in ascending order', async () => {
    const runId = randomUUID()
    const prefix = `start-after-folder-${runId}/`
    const earlierName = `${prefix}za.txt`
    const boundary = `${prefix}zz`
    const childName = `${boundary}/child.txt`
    const laterName = `${prefix}zzz.txt`
    await insertPaths([earlierName, childName, laterName])

    const result = await storageTest.storage.from(LIST_V2_BUCKET).listObjectsV2({
      prefix,
      delimiter: '/',
      startAfter: boundary,
      maxKeys: 10,
      sortBy: { column: 'name', order: 'asc' },
    })

    expect(result.objects.map((object) => object.name)).toEqual([laterName])
    expect(result.folders.map((folder) => folder.name)).toEqual([`${boundary}/`])
  })

  test('does not infer a delimiter-less startAfter as a folder in descending order', async () => {
    const runId = randomUUID()
    const prefix = `start-after-folder-desc-${runId}/`
    const boundary = `${prefix}aa`
    const adjacentName = `${boundary}!`
    const childName = `${boundary}/child.txt`
    await insertPaths([adjacentName, childName])

    const result = await storageTest.storage.from(LIST_V2_BUCKET).listObjectsV2({
      prefix,
      delimiter: '/',
      startAfter: boundary,
      maxKeys: 10,
      sortBy: { column: 'name', order: 'desc' },
    })

    expect(result.objects).toEqual([])
    expect(result.folders).toEqual([])
  })

  test.each([
    ['asc', ['aa', 'aa!', 'aa::', 'aa:a', 'ab']],
    ['desc', ['ab', 'aa:a', 'aa::', 'aa!', 'aa']],
  ] as const)('paginates with a multi-character delimiter in %s order', async (order, expected) => {
    const runId = randomUUID()
    const prefix = `multi-delimiter-${runId}/`
    await insertPaths([
      `${prefix}aa`,
      `${prefix}aa!`,
      `${prefix}aa::child.txt`,
      `${prefix}aa:a`,
      `${prefix}ab`,
    ])

    const actual: string[] = []
    let cursor: string | undefined

    do {
      const result = await storageTest.storage.from(LIST_V2_BUCKET).listObjectsV2({
        prefix,
        delimiter: '::',
        cursor,
        maxKeys: 1,
        sortBy: { column: 'name', order },
      })

      actual.push(...result.objects.map((object) => object.name.slice(prefix.length)))
      actual.push(...result.folders.map((folder) => folder.name.slice(prefix.length)))
      cursor = result.hasNext ? result.nextCursor : undefined
      expect(actual.length).toBeLessThan(10)
    } while (cursor)

    expect(actual).toEqual(expected)
  })

  test.each([
    ['asc', ['aa!', 'aa:a', 'ab'], ['aa::']],
    ['desc', [], []],
  ] as const)('does not infer a delimiter-less multi-character startAfter as a folder in %s order', async (order, expectedObjects, expectedFolders) => {
    const runId = randomUUID()
    const prefix = `multi-delimiter-start-after-${runId}/`
    const boundary = `${prefix}aa`
    await insertPaths([`${boundary}!`, `${boundary}::child.txt`, `${boundary}:a`, `${prefix}ab`])

    const result = await storageTest.storage.from(LIST_V2_BUCKET).listObjectsV2({
      prefix,
      delimiter: '::',
      startAfter: boundary,
      maxKeys: 10,
      sortBy: { column: 'name', order },
    })

    expect(result.objects.map((object) => object.name.slice(prefix.length))).toEqual(
      expectedObjects
    )
    expect(result.folders.map((folder) => folder.name.slice(prefix.length))).toEqual(
      expectedFolders
    )
  })

  test.each([
    ['created_at', 'asc', ['aa!', 'aa/', 'ab']],
    ['created_at', 'desc', ['ab', 'aa/', 'aa!']],
    ['updated_at', 'asc', ['aa!', 'aa/', 'ab']],
    ['updated_at', 'desc', ['ab', 'aa/', 'aa!']],
  ] as const)('keeps folder names and timestamps in %s %s pagination cursors', async (column, order, expected) => {
    const runId = randomUUID()
    const prefix = `timestamp-folder-${runId}/`
    const adjacentName = `${prefix}aa!`
    const childName = `${prefix}aa/child.txt`
    const laterName = `${prefix}ab`
    await storageTest.database.connection.query(
      `INSERT INTO storage.objects (bucket_id, name, created_at, updated_at)
         SELECT $1, object_name, $3::timestamptz, $3::timestamptz
         FROM unnest($2::text[]) AS object_name`,
      [LIST_V2_BUCKET, [adjacentName, childName, laterName], '2024-11-01T00:00:00.000Z']
    )

    const actual: string[] = []
    let cursor: string | undefined

    do {
      const response = await appInstance.inject({
        method: 'POST',
        url: `/object/list-v2/${LIST_V2_BUCKET}`,
        headers: { authorization: `Bearer ${serviceKey}` },
        payload: {
          prefix,
          with_delimiter: true,
          limit: 1,
          cursor,
          sortBy: { column, order },
        },
      })
      expect(response.statusCode).toBe(200)

      const body = response.json<ListObjectsV2Result>()
      expect(body.objects.length + body.folders.length).toBeLessThanOrEqual(1)
      actual.push(...body.objects.map((object) => object.name))
      actual.push(...body.folders.map((folder) => folder.name))
      cursor = body.hasNext ? body.nextCursor : undefined
      expect(actual.length).toBeLessThan(10)
    } while (cursor)

    expect(actual).toEqual(expected.map((name) => `${prefix}${name}`))
  })
})

describe('objects - list v2 versioning tests', () => {
  async function listAllVersions(
    payload: Record<string, unknown>
  ): Promise<{ objects: Obj[]; folders: Obj[]; pages: number }> {
    const objects: Obj[] = []
    const folders: Obj[] = []
    let cursor: string | undefined
    let pages = 0

    do {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/object/list-v2/bucket2',
        headers: { authorization: `Bearer ${await serviceKeyAsync}` },
        payload: { ...payload, cursor },
      })
      expect(response.statusCode).toBe(200)
      const body = response.json<{
        objects: Obj[]
        folders: Obj[]
        hasNext: boolean
        nextCursor?: string
      }>()

      objects.push(...body.objects)
      folders.push(...body.folders)
      cursor = body.hasNext ? body.nextCursor : undefined
      pages += 1
      expect(pages).toBeLessThan(20)
    } while (cursor)

    return { objects, folders, pages }
  }

  function buildVersionRows(
    bucketId: string,
    name: string,
    count: number,
    baseTime: number
  ): Array<Partial<Obj> & { bucket_id: string; name: string }> {
    const rows: Array<Partial<Obj> & { bucket_id: string; name: string }> = []
    for (let i = 0; i < count; i++) {
      const isCurrent = i === count - 1
      const createdAt = new Date(baseTime + i * 1000).toISOString()
      rows.push({
        bucket_id: bucketId,
        name,
        owner: 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2',
        version: `v${i}-${randomUUID()}`,
        metadata: { mimetype: 'image/png', size: 1000 + i },
        created_at: createdAt,
        archived_at: isCurrent ? null : createdAt,
        is_versioned: true,
        is_delete_marker: false,
      })
    }
    return rows
  }

  test('every noncurrentVersions x deleteMarkers combination on listObjectsV2 (flat)', async () => {
    const runId = randomUUID()
    const objectName = `authenticated/tristate-matrix-${runId}.png`
    const baseTime = Date.parse('2024-01-01T00:00:00.000Z')

    const rows = [
      { version: 'archived-content-1', archivedAt: baseTime, isDeleteMarker: false },
      { version: 'archived-marker', archivedAt: baseTime + 1000, isDeleteMarker: true },
      { version: 'archived-content-2', archivedAt: baseTime + 2000, isDeleteMarker: false },
      { version: 'current-content', archivedAt: null, isDeleteMarker: false },
    ]

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(
      seedTx,
      rows.map((row) => ({
        bucket_id: 'bucket2',
        name: objectName,
        owner: 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2',
        version: row.version,
        metadata: { mimetype: 'image/png', size: 1000 },
        created_at: new Date(row.archivedAt ?? baseTime + 3000).toISOString(),
        archived_at: row.archivedAt === null ? null : new Date(row.archivedAt).toISOString(),
        is_versioned: true,
        is_delete_marker: row.isDeleteMarker,
      }))
    )
    await seedTx.commit()
    tnx = undefined

    try {
      const matrix: {
        noncurrentVersions?: 'exclude' | 'include' | 'only'
        deleteMarkers?: 'exclude' | 'include' | 'only'
        expected: string[]
      }[] = [
        { expected: ['current-content'] },
        {
          noncurrentVersions: 'exclude',
          deleteMarkers: 'exclude',
          expected: ['current-content'],
        },
        { noncurrentVersions: 'exclude', deleteMarkers: 'only', expected: [] },
        {
          noncurrentVersions: 'exclude',
          deleteMarkers: 'include',
          expected: ['current-content'],
        },
        {
          noncurrentVersions: 'only',
          deleteMarkers: 'exclude',
          expected: ['archived-content-1', 'archived-content-2'],
        },
        { noncurrentVersions: 'only', deleteMarkers: 'only', expected: ['archived-marker'] },
        {
          noncurrentVersions: 'only',
          deleteMarkers: 'include',
          expected: ['archived-content-1', 'archived-marker', 'archived-content-2'],
        },
        {
          noncurrentVersions: 'include',
          deleteMarkers: 'exclude',
          expected: ['archived-content-1', 'archived-content-2', 'current-content'],
        },
        {
          noncurrentVersions: 'include',
          deleteMarkers: 'only',
          expected: ['archived-marker'],
        },
        {
          noncurrentVersions: 'include',
          deleteMarkers: 'include',
          expected: [
            'archived-content-1',
            'archived-marker',
            'archived-content-2',
            'current-content',
          ],
        },
      ]

      for (const { noncurrentVersions, deleteMarkers, expected } of matrix) {
        const response = await appInstance.inject({
          method: 'POST',
          url: '/object/list-v2/bucket2',
          headers: { authorization: `Bearer ${await serviceKeyAsync}` },
          payload: { prefix: objectName, exactMatch: true, noncurrentVersions, deleteMarkers },
        })
        expect(response.statusCode).toBe(200)
        const body = response.json<{ objects: Obj[] }>()
        const versions = body.objects.map((o) => o.version)
        expect(versions.length).toBe(expected.length)
        expect(new Set(versions)).toEqual(new Set(expected))
      }
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, 'bucket2', objectName)
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test('most-recent-first ordering within a key on listObjectsV2 (flat, noncurrentVersions include)', async () => {
    const runId = randomUUID()
    const objectName = `authenticated/versions-order-${runId}.png`
    const baseTime = Date.parse('2024-01-01T00:00:00.000Z')

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, buildVersionRows('bucket2', objectName, 3, baseTime))
    await seedTx.commit()
    tnx = undefined

    try {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/object/list-v2/bucket2',
        headers: { authorization: `Bearer ${await serviceKeyAsync}` },
        payload: { prefix: objectName, exactMatch: true, noncurrentVersions: 'include' },
      })
      expect(response.statusCode).toBe(200)
      const body = response.json<{ objects: Obj[] }>()
      expect(body.objects).toHaveLength(3)
      expect(body.objects[0].archived_at).toBeNull()
      expect(body.objects[0].version?.startsWith('v2-')).toBe(true)
      expect(body.objects[1].version?.startsWith('v1-')).toBe(true)
      expect(body.objects[2].version?.startsWith('v0-')).toBe(true)
      const versions = body.objects.map((o) => o.version)
      expect(new Set(versions).size).toBe(3)
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, 'bucket2', objectName)
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test("pagination does not repeat a key's current row when a page boundary lands right after it (with delimiter)", async () => {
    const runId = randomUUID()
    const objectName = `authenticated/current-row-boundary-${runId}.png`
    const baseTime = Date.parse('2024-01-01T00:00:00.000Z')

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, buildVersionRows('bucket2', objectName, 3, baseTime))
    await seedTx.commit()
    tnx = undefined

    try {
      const seen: string[] = []
      let cursor: string | undefined
      let pages = 0

      do {
        const response = await appInstance.inject({
          method: 'POST',
          url: '/object/list-v2/bucket2',
          headers: { authorization: `Bearer ${await serviceKeyAsync}` },
          payload: {
            prefix: objectName,
            exactMatch: true,
            with_delimiter: true,
            noncurrentVersions: 'include',
            limit: 1,
            cursor,
          },
        })
        expect(response.statusCode).toBe(200)
        const body = response.json<{ objects: Obj[]; hasNext: boolean; nextCursor?: string }>()

        for (const o of body.objects) {
          seen.push(o.version as string)
        }

        cursor = body.hasNext ? body.nextCursor : undefined
        pages += 1
        expect(pages).toBeLessThan(10)
      } while (cursor)

      expect(seen).toHaveLength(3)
      expect(new Set(seen).size).toBe(3)
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, 'bucket2', objectName)
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test('exactMatch pagination stays on the cursor key when the request prefix is omitted', async () => {
    const runId = randomUUID()
    const objectName = `authenticated/exact-match-${runId}.png`
    const decoyName = `${objectName}.decoy`
    const baseTime = Date.parse('2024-01-01T00:00:00.000Z')

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, [
      ...buildVersionRows('bucket2', objectName, 2, baseTime),
      ...buildVersionRows('bucket2', decoyName, 1, baseTime),
    ])
    await seedTx.commit()
    tnx = undefined

    try {
      const response = await appInstance.inject({
        method: 'POST',
        url: '/object/list-v2/bucket2',
        headers: { authorization: `Bearer ${await serviceKeyAsync}` },
        payload: {
          prefix: objectName,
          exactMatch: true,
          noncurrentVersions: 'include',
          limit: 1,
        },
      })
      expect(response.statusCode).toBe(200)
      const body = response.json<{ hasNext: boolean; nextCursor?: string; objects: Obj[] }>()
      expect(body.objects).toHaveLength(1)
      expect(body.hasNext).toBe(true)

      const page2 = await appInstance.inject({
        method: 'POST',
        url: '/object/list-v2/bucket2',
        headers: { authorization: `Bearer ${await serviceKeyAsync}` },
        payload: { cursor: body.nextCursor, limit: 1 },
      })
      expect(page2.statusCode).toBe(200)
      const body2 = page2.json<{ hasNext: boolean; objects: Obj[] }>()
      expect(body2.hasNext).toBe(false)

      const objects = [...body.objects, ...body2.objects]
      expect(objects).toHaveLength(2)
      expect(objects.every((o) => o.name === objectName)).toBe(true)
      expect(new Set(objects.map((o) => o.version)).size).toBe(2)
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, 'bucket2', [objectName, decoyName])
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test('pagination across a multi-version key boundary returns every version exactly once (flat)', async () => {
    const runId = randomUUID()
    const prefix = `authenticated/pagination-boundary-${runId}`
    const keyA = `${prefix}-a.png`
    const keyB = `${prefix}-b-boundary.png`
    const keyC = `${prefix}-c.png`
    const baseTime = Date.parse('2024-01-01T00:00:00.000Z')

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, [
      ...buildVersionRows('bucket2', keyA, 1, baseTime),
      ...buildVersionRows('bucket2', keyB, 5, baseTime + 100_000),
      ...buildVersionRows('bucket2', keyC, 1, baseTime + 200_000),
    ])
    await seedTx.commit()
    tnx = undefined

    try {
      const seen: { name: string; version: string }[] = []
      let cursor: string | undefined
      let pages = 0

      do {
        const response = await appInstance.inject({
          method: 'POST',
          url: '/object/list-v2/bucket2',
          headers: { authorization: `Bearer ${await serviceKeyAsync}` },
          payload: {
            prefix,
            noncurrentVersions: 'include',
            limit: 3,
            cursor,
          },
        })
        expect(response.statusCode).toBe(200)
        const body = response.json<{
          objects: Obj[]
          hasNext: boolean
          nextCursor?: string
        }>()

        for (const o of body.objects) {
          seen.push({ name: o.name, version: o.version as string })
        }

        cursor = body.hasNext ? body.nextCursor : undefined
        pages += 1
        expect(pages).toBeLessThan(10)
      } while (cursor)

      expect(pages).toBeGreaterThan(1)

      const seenKeys = seen.map((o) => `${o.name}::${o.version}`)
      expect(new Set(seenKeys).size).toBe(seenKeys.length)
      expect(seen).toHaveLength(7) // 1 (a) + 5 (b) + 1 (c)

      const bVersions = seen.filter((o) => o.name === keyB)
      expect(bVersions).toHaveLength(5)
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, 'bucket2', [keyA, keyB, keyC])
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test('pagination across a multi-version key boundary returns every version exactly once (with delimiter)', async () => {
    const runId = randomUUID()
    const prefix = `authenticated/pagination-boundary-delim-${runId}`
    const keyA = `${prefix}-a.png`
    const keyB = `${prefix}-b-boundary.png`
    const keyC = `${prefix}-c.png`
    const baseTime = Date.parse('2024-01-01T00:00:00.000Z')

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, [
      ...buildVersionRows('bucket2', keyA, 1, baseTime),
      ...buildVersionRows('bucket2', keyB, 5, baseTime + 100_000),
      ...buildVersionRows('bucket2', keyC, 1, baseTime + 200_000),
    ])
    await seedTx.commit()
    tnx = undefined

    try {
      const seen: { name: string; version: string }[] = []
      let cursor: string | undefined
      let pages = 0

      do {
        const response = await appInstance.inject({
          method: 'POST',
          url: '/object/list-v2/bucket2',
          headers: { authorization: `Bearer ${await serviceKeyAsync}` },
          payload: {
            prefix,
            with_delimiter: true,
            noncurrentVersions: 'include',
            limit: 3,
            cursor,
          },
        })
        expect(response.statusCode).toBe(200)
        const body = response.json<{
          objects: Obj[]
          hasNext: boolean
          nextCursor?: string
        }>()

        for (const o of body.objects) {
          seen.push({ name: o.name, version: o.version as string })
        }

        cursor = body.hasNext ? body.nextCursor : undefined
        pages += 1
        expect(pages).toBeLessThan(10)
      } while (cursor)

      expect(pages).toBeGreaterThan(1)

      const seenKeys = seen.map((o) => `${o.name}::${o.version}`)
      expect(new Set(seenKeys).size).toBe(seenKeys.length)
      expect(seen).toHaveLength(7)

      const bVersions = seen.filter((o) => o.name === keyB)
      expect(bVersions).toHaveLength(5)
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, 'bucket2', [keyA, keyB, keyC])
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test.each([
    ['created_at', 'asc'],
    ['created_at', 'desc'],
    ['updated_at', 'asc'],
    ['updated_at', 'desc'],
  ] as const)('paginates multiple versions exactly once when sorting by %s %s with timestamp ties', async (column, order) => {
    const runId = randomUUID()
    const prefix = `authenticated/timestamp-sort-${runId}`
    const names = [`${prefix}-a.png`, `${prefix}-b.png`, `${prefix}-c.png`]
    const early = '2024-01-01T00:00:00.000Z'
    const late = '2024-01-02T00:00:00.000Z'
    const rows = names.flatMap((name, nameIndex) =>
      ['version-a', 'version-b'].map((version, versionIndex) => ({
        bucket_id: 'bucket2',
        name,
        owner: 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2',
        version,
        metadata: { mimetype: 'image/png', size: 1000 + versionIndex },
        // The first two keys deliberately tie on the selected timestamps so
        // pagination must use both name and version from the cursor.
        created_at: nameIndex < 2 ? early : late,
        updated_at: nameIndex < 2 ? early : late,
        archived_at:
          versionIndex === 0
            ? new Date(Date.parse(early) + nameIndex * 10_000).toISOString()
            : null,
        is_versioned: true,
        is_delete_marker: false,
      }))
    )

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, rows)
    await seedTx.commit()
    tnx = undefined

    try {
      const result = await listAllVersions({
        prefix,
        noncurrentVersions: 'include',
        deleteMarkers: 'include',
        sortBy: { column, order },
        limit: 1,
      })

      expect(result.pages).toBe(6)
      const actual = result.objects.map((object) => `${object.name}::${object.version}`)
      const direction = order === 'asc' ? 1 : -1
      const expected = rows
        .slice()
        .sort((left, right) => {
          const timestampComparison = String(left[column]).localeCompare(String(right[column]))
          if (timestampComparison !== 0) return timestampComparison * direction
          const nameComparison = left.name.localeCompare(right.name)
          if (nameComparison !== 0) return nameComparison * direction
          return String(left.version).localeCompare(String(right.version)) * direction
        })
        .map((object) => `${object.name}::${object.version}`)

      expect(actual).toEqual(expected)
      expect(new Set(actual).size).toBe(rows.length)
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, 'bucket2', names)
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test('paginates default name-desc ordering through every version exactly once', async () => {
    const runId = randomUUID()
    const prefix = `authenticated/name-desc-${runId}`
    const names = [`${prefix}-a.png`, `${prefix}-b.png`, `${prefix}-c.png`]
    const baseTime = Date.parse('2024-02-01T00:00:00.000Z')
    const rows = names.flatMap((name, index) =>
      buildVersionRows('bucket2', name, 3, baseTime + index * 100_000)
    )
    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, rows)
    await seedTx.commit()
    tnx = undefined

    try {
      const result = await listAllVersions({
        prefix,
        noncurrentVersions: 'include',
        sortBy: { column: 'name', order: 'desc' },
        limit: 2,
      })
      const identities = result.objects.map((object) => `${object.name}::${object.version}`)

      expect(result.pages).toBeGreaterThan(1)
      expect(identities).toHaveLength(rows.length)
      expect(new Set(identities).size).toBe(rows.length)
      expect(result.objects.map((object) => object.name)).toEqual(
        result.objects
          .map((object) => object.name)
          .slice()
          .sort()
          .reverse()
      )
      for (const name of names) {
        const versions = result.objects.filter((object) => object.name === name)
        expect(versions[0].archived_at).toBeNull()
        expect(versions.slice(1).map((object) => object.archived_at)).toEqual(
          versions
            .slice(1)
            .map((object) => object.archived_at)
            .slice()
            .sort()
            .reverse()
        )
      }
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, 'bucket2', names)
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test('paginates archived-only versions without skips or duplicates', async () => {
    const runId = randomUUID()
    const prefix = `authenticated/archived-only-${runId}`
    const names = [`${prefix}-a.png`, `${prefix}-b.png`]
    const rows = names.flatMap((name, index) =>
      buildVersionRows('bucket2', name, 4, Date.parse('2024-03-01T00:00:00.000Z') + index * 100_000)
    )
    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, rows)
    await seedTx.commit()
    tnx = undefined

    try {
      const result = await listAllVersions({
        prefix,
        noncurrentVersions: 'only',
        limit: 2,
      })
      const identities = result.objects.map((object) => `${object.name}::${object.version}`)

      expect(result.pages).toBeGreaterThan(1)
      expect(result.objects).toHaveLength(6)
      expect(result.objects.every((object) => object.archived_at !== null)).toBe(true)
      expect(new Set(identities).size).toBe(identities.length)
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, 'bucket2', names)
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test.each([
    'include',
    'only',
  ] as const)('paginates deleteMarkers=%s across current and archived markers', async (deleteMarkers) => {
    const runId = randomUUID()
    const prefix = `authenticated/delete-marker-pages-${runId}`
    const names = [`${prefix}-a.png`, `${prefix}-b.png`]
    const baseTime = Date.parse('2024-04-01T00:00:00.000Z')
    const rows = names.flatMap((name, nameIndex) => [
      {
        bucket_id: 'bucket2',
        name,
        version: `content-${nameIndex}`,
        archived_at: new Date(baseTime + nameIndex * 10_000).toISOString(),
        created_at: new Date(baseTime).toISOString(),
        is_versioned: true,
        is_delete_marker: false,
      },
      {
        bucket_id: 'bucket2',
        name,
        version: `archived-marker-${nameIndex}`,
        archived_at: new Date(baseTime + nameIndex * 10_000 + 1000).toISOString(),
        created_at: new Date(baseTime + 1000).toISOString(),
        is_versioned: true,
        is_delete_marker: true,
      },
      {
        bucket_id: 'bucket2',
        name,
        version: `current-marker-${nameIndex}`,
        archived_at: null,
        created_at: new Date(baseTime + 2000).toISOString(),
        is_versioned: true,
        is_delete_marker: true,
      },
    ])
    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, rows)
    await seedTx.commit()
    tnx = undefined

    try {
      const result = await listAllVersions({
        prefix,
        noncurrentVersions: 'include',
        deleteMarkers,
        limit: 1,
      })
      const identities = result.objects.map((object) => `${object.name}::${object.version}`)
      const expectedCount = deleteMarkers === 'only' ? 4 : 6

      expect(result.objects).toHaveLength(expectedCount)
      expect(new Set(identities).size).toBe(expectedCount)
      if (deleteMarkers === 'only') {
        expect(result.objects.every((object) => object.is_delete_marker)).toBe(true)
      }
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, 'bucket2', names)
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test('collapses versioned descendants into one folder per prefix across pages', async () => {
    const runId = randomUUID()
    const prefix = `authenticated/folder-versions-${runId}/`
    const rootObject = `${prefix}root.png`
    const names = [
      rootObject,
      `${prefix}alpha/one.png`,
      `${prefix}alpha/two.png`,
      `${prefix}beta/one.png`,
    ]
    const baseTime = Date.parse('2024-05-01T00:00:00.000Z')
    const rows = names.flatMap((name, index) =>
      buildVersionRows('bucket2', name, 3, baseTime + index * 100_000)
    )
    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, rows)
    await seedTx.commit()
    tnx = undefined

    try {
      const result = await listAllVersions({
        prefix,
        with_delimiter: true,
        noncurrentVersions: 'include',
        limit: 2,
      })

      expect(result.pages).toBeGreaterThan(1)
      expect(result.folders.map((folder) => folder.name)).toEqual([
        `${prefix}alpha/`,
        `${prefix}beta/`,
      ])
      expect(result.objects).toHaveLength(3)
      expect(result.objects.every((object) => object.name === rootObject)).toBe(true)
      expect(new Set(result.objects.map((object) => object.version)).size).toBe(3)
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, 'bucket2', names)
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test('name pagination matches the V2 reference model across filters, directions, delimiters, and page boundaries', async () => {
    type VersionMode = 'include' | 'only'
    type MarkerMode = 'exclude' | 'include' | 'only'
    type ModelRow = {
      name: string
      version: string
      archived_at: string | null
      is_delete_marker: boolean
    }
    type ModelEntry = {
      kind: 'folder' | 'object'
      name: string
      sortName: string
      version: string | null
      archived_at: string | null
    }

    const runId = randomUUID()
    const prefix = `authenticated/v2-reference-${runId}/`
    const modelRows: ModelRow[] = [
      { name: 'alpha.txt', version: 'alpha-current', archived_at: null, is_delete_marker: false },
      {
        name: 'alpha.txt',
        version: 'alpha-archive-a',
        archived_at: '2024-07-01T00:00:00.123789Z',
        is_delete_marker: false,
      },
      {
        name: 'alpha.txt',
        version: 'alpha-archive-b',
        archived_at: '2024-07-01T00:00:00.123456Z',
        is_delete_marker: false,
      },
      { name: 'bravo.txt', version: 'bravo-current', archived_at: null, is_delete_marker: false },
      {
        name: 'bravo.txt',
        version: 'bravo-marker',
        archived_at: '2024-07-02T00:00:00.000Z',
        is_delete_marker: true,
      },
      {
        name: 'folder-a/',
        version: 'folder-a-placeholder',
        archived_at: null,
        is_delete_marker: false,
      },
      {
        name: 'folder-a/child.txt',
        version: 'folder-a-current',
        archived_at: null,
        is_delete_marker: false,
      },
      {
        name: 'folder-a/child.txt',
        version: 'folder-a-archive',
        archived_at: '2024-07-03T00:00:00.000Z',
        is_delete_marker: false,
      },
      {
        name: 'folder-b/marker.txt',
        version: 'folder-b-marker',
        archived_at: '2024-07-04T00:00:00.000Z',
        is_delete_marker: true,
      },
      {
        name: 'zulu.txt',
        version: 'zulu-archive',
        archived_at: '2024-07-05T00:00:00.000Z',
        is_delete_marker: false,
      },
    ]

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(
      seedTx,
      modelRows.map((row) => ({
        bucket_id: 'bucket2',
        name: `${prefix}${row.name}`,
        owner: 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2',
        version: row.version,
        archived_at: row.archived_at,
        is_versioned: true,
        is_delete_marker: row.is_delete_marker,
      }))
    )
    await seedTx.commit()
    tnx = undefined

    const compareC = (left: string, right: string) => (left === right ? 0 : left < right ? -1 : 1)
    const identity = (entry: {
      kind: 'folder' | 'object'
      name: string
      version?: string | null
    }) => `${entry.kind}:${entry.name}:${entry.version ?? ''}`

    const reference = (
      withDelimiter: boolean,
      order: 'asc' | 'desc',
      noncurrentVersions: VersionMode,
      deleteMarkers: MarkerMode
    ): ModelEntry[] => {
      const filtered = modelRows.filter(
        (row) =>
          (noncurrentVersions !== 'only' || row.archived_at !== null) &&
          (deleteMarkers !== 'exclude' || !row.is_delete_marker) &&
          (deleteMarkers !== 'only' || row.is_delete_marker)
      )
      const objects: ModelEntry[] = filtered
        .filter((row) => !withDelimiter || !row.name.includes('/'))
        .map((row) => ({
          kind: 'object',
          name: `${prefix}${row.name}`,
          sortName: `${prefix}${row.name}`,
          version: row.version,
          archived_at: row.archived_at,
        }))
      const folders: ModelEntry[] = withDelimiter
        ? [
            ...new Set(
              filtered.flatMap((row) => {
                const delimiter = row.name.indexOf('/')
                return delimiter === -1 ? [] : [`${prefix}${row.name.slice(0, delimiter + 1)}`]
              })
            ),
          ].map((name) => ({
            kind: 'folder' as const,
            name,
            sortName: name,
            version: null,
            archived_at: null,
          }))
        : []

      return [...objects, ...folders].sort((left, right) => {
        const nameOrder = compareC(left.sortName, right.sortName)
        if (nameOrder !== 0) return order === 'asc' ? nameOrder : -nameOrder

        const leftTime = left.archived_at === null ? 'infinity' : left.archived_at.slice(0, 23)
        const rightTime = right.archived_at === null ? 'infinity' : right.archived_at.slice(0, 23)
        const timestampOrder = compareC(leftTime, rightTime)
        if (timestampOrder !== 0) return -timestampOrder
        return compareC(left.version ?? '', right.version ?? '')
      })
    }

    try {
      for (const withDelimiter of [false, true]) {
        for (const order of ['asc', 'desc'] as const) {
          for (const noncurrentVersions of ['include', 'only'] as const) {
            for (const deleteMarkers of ['exclude', 'include', 'only'] as const) {
              for (const limit of [1, 2, 3]) {
                const expected = reference(withDelimiter, order, noncurrentVersions, deleteMarkers)
                const actual: string[] = []
                let cursor: string | undefined
                let page = 0

                do {
                  const response = await appInstance.inject({
                    method: 'POST',
                    url: '/object/list-v2/bucket2',
                    headers: { authorization: `Bearer ${await serviceKeyAsync}` },
                    payload: {
                      prefix,
                      with_delimiter: withDelimiter,
                      noncurrentVersions,
                      deleteMarkers,
                      sortBy: { column: 'name', order },
                      limit,
                      cursor,
                    },
                  })
                  const context = JSON.stringify({
                    withDelimiter,
                    order,
                    noncurrentVersions,
                    deleteMarkers,
                    limit,
                    page,
                  })
                  expect(response.statusCode, context).toBe(200)
                  const body = response.json<{
                    objects: Obj[]
                    folders: Obj[]
                    hasNext: boolean
                    nextCursor?: string
                  }>()
                  const expectedPage = expected.slice(page * limit, (page + 1) * limit)
                  const expectedObjects = expectedPage
                    .filter((entry) => entry.kind === 'object')
                    .map(identity)
                  const expectedFolders = expectedPage
                    .filter((entry) => entry.kind === 'folder')
                    .map(identity)
                  const actualObjects = body.objects.map((entry) =>
                    identity({ kind: 'object', name: entry.name, version: entry.version })
                  )
                  const actualFolders = body.folders.map((entry) =>
                    identity({ kind: 'folder', name: entry.name })
                  )

                  expect(actualObjects, context).toEqual(expectedObjects)
                  expect(actualFolders, context).toEqual(expectedFolders)
                  expect(body.hasNext, context).toBe((page + 1) * limit < expected.length)
                  expect(Boolean(body.nextCursor), context).toBe(body.hasNext)
                  actual.push(...actualObjects, ...actualFolders)
                  cursor = body.hasNext ? body.nextCursor : undefined
                  page += 1
                  expect(page, context).toBeLessThan(20)
                } while (cursor)

                const expectedIdentities = expected.map(identity)
                expect(new Set(actual).size).toBe(actual.length)
                expect(new Set(actual)).toEqual(new Set(expectedIdentities))
              }
            }
          }
        }
      }
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(
          db,
          'bucket2',
          modelRows.map((row) => `${prefix}${row.name}`)
        )
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  }, 30_000)

  test.each([
    { order: 'asc' as const, noncurrentVersions: 'exclude' as const },
    { order: 'desc' as const, noncurrentVersions: 'exclude' as const },
    { order: 'asc' as const, noncurrentVersions: 'include' as const },
    { order: 'desc' as const, noncurrentVersions: 'include' as const },
  ])('distinguishes leaf and folder cursor boundaries ($order, $noncurrentVersions)', async ({
    order,
    noncurrentVersions,
  }) => {
    const runId = randomUUID()
    const prefix = `authenticated/cursor-kind-${runId}/`
    const lowerName = `${prefix}aZ`
    const collisionName = `${prefix}aa`
    const siblingName = `${collisionName}!`
    const childName = `${collisionName}/child.txt`
    const upperName = `${prefix}ab`
    const baseTime = Date.parse('2024-09-01T00:00:00.000Z')
    const lowerRows = buildVersionRows('bucket2', lowerName, 1, baseTime)
    const collisionRows = buildVersionRows('bucket2', collisionName, 2, baseTime + 100_000)
    const siblingRows = buildVersionRows('bucket2', siblingName, 1, baseTime + 200_000)
    const childRows = buildVersionRows('bucket2', childName, 1, baseTime + 300_000)
    const upperRows = buildVersionRows('bucket2', upperName, 1, baseTime + 400_000)

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, [
      ...lowerRows,
      ...collisionRows,
      ...siblingRows,
      ...childRows,
      ...upperRows,
    ])
    await seedTx.commit()
    tnx = undefined

    try {
      const actual: string[] = []
      let cursor: string | undefined
      let pages = 0

      do {
        const response = await appInstance.inject({
          method: 'POST',
          url: '/object/list-v2/bucket2',
          headers: { authorization: `Bearer ${await serviceKeyAsync}` },
          payload: {
            prefix,
            with_delimiter: true,
            noncurrentVersions,
            sortBy: { column: 'name', order },
            limit: 1,
            cursor,
          },
        })
        expect(response.statusCode).toBe(200)

        const body = response.json<{
          objects: Obj[]
          folders: Obj[]
          hasNext: boolean
          nextCursor?: string
        }>()
        actual.push(
          ...body.objects.map((object) => `object:${object.name}:${object.version}`),
          ...body.folders.map((folder) => `folder:${folder.name}`)
        )
        cursor = body.hasNext ? body.nextCursor : undefined
        pages += 1
        expect(pages).toBeLessThan(10)
      } while (cursor)

      const collisionEntries = collisionRows
        .filter((row) => noncurrentVersions === 'include' || row.archived_at === null)
        .toSorted((left, right) =>
          left.archived_at === null ? -1 : right.archived_at === null ? 1 : 0
        )
        .map((row) => `object:${collisionName}:${row.version}`)
      const ascending = [
        `object:${lowerName}:${lowerRows[0].version}`,
        ...collisionEntries,
        `object:${siblingName}:${siblingRows[0].version}`,
        `folder:${collisionName}/`,
        `object:${upperName}:${upperRows[0].version}`,
      ]
      const descending = [
        `object:${upperName}:${upperRows[0].version}`,
        `folder:${collisionName}/`,
        `object:${siblingName}:${siblingRows[0].version}`,
        ...collisionEntries,
        `object:${lowerName}:${lowerRows[0].version}`,
      ]

      expect(actual).toEqual(order === 'asc' ? ascending : descending)
      expect(new Set(actual).size).toBe(actual.length)
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, 'bucket2', [
          lowerName,
          collisionName,
          siblingName,
          childName,
          upperName,
        ])
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test.each([
    { order: 'asc' as const, expected: 'upper.txt' },
    { order: 'desc' as const, expected: 'lower.txt' },
  ])('treats a multi-version startAfter boundary as strict ($order)', async ({
    order,
    expected,
  }) => {
    const runId = randomUUID()
    const prefix = `authenticated/start-after-${runId}/`
    const lowerName = `${prefix}lower.txt`
    const boundaryName = `${prefix}middle.txt`
    const upperName = `${prefix}upper.txt`
    const baseTime = Date.parse('2024-10-01T00:00:00.000Z')

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, [
      ...buildVersionRows(LIST_V2_BUCKET, lowerName, 1, baseTime),
      ...buildVersionRows(LIST_V2_BUCKET, boundaryName, 2, baseTime + 100_000),
      ...buildVersionRows(LIST_V2_BUCKET, upperName, 1, baseTime + 200_000),
    ])
    await seedTx.commit()
    tnx = undefined

    try {
      const result = await storageTest.storage.from(LIST_V2_BUCKET).listObjectsV2({
        prefix,
        delimiter: '/',
        startAfter: boundaryName,
        maxKeys: 10,
        noncurrentVersions: 'include',
        sortBy: { column: 'name', order },
      })

      expect(result.folders).toEqual([])
      expect(result.objects.map((object) => object.name)).toEqual([`${prefix}${expected}`])
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, LIST_V2_BUCKET, [lowerName, boundaryName, upperName])
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  test('name pagination matches the model at exact, mid-key, and final-key page boundaries', async () => {
    const runId = randomUUID()
    const prefix = `authenticated/v2-batch-model-${runId}/`
    const baseTime = Date.parse('2024-08-01T00:00:00.000Z')
    const keys = [
      { name: '000-desc-final.bin', versions: 100 },
      { name: 'bbb-exact.bin', versions: 100 },
      { name: 'ccc-single.bin', versions: 1 },
      { name: 'ddd-mid-key.bin', versions: 101 },
      { name: 'zzz-asc-final.bin', versions: 100 },
    ]
    const rows = keys.flatMap((key, keyIndex) =>
      Array.from({ length: key.versions }, (_, versionIndex) => ({
        bucket_id: 'bucket2',
        name: `${prefix}${key.name}`,
        owner: 'd8c7bce9-cfeb-497b-bd61-e66ce2cbdaa2',
        version: `${key.name}-v-${String(versionIndex).padStart(3, '0')}`,
        archived_at:
          versionIndex === key.versions - 1
            ? null
            : new Date(baseTime + keyIndex * 1_000_000 + versionIndex * 1000).toISOString(),
        is_versioned: true,
        is_delete_marker: false,
      }))
    )
    const expectedFor = (order: 'asc' | 'desc') =>
      rows
        .slice()
        .sort((left, right) => {
          const nameOrder = left.name === right.name ? 0 : left.name < right.name ? -1 : 1
          if (nameOrder !== 0) return order === 'asc' ? nameOrder : -nameOrder
          if (left.archived_at === null) return -1
          if (right.archived_at === null) return 1
          if (left.archived_at !== right.archived_at) {
            return left.archived_at > right.archived_at ? -1 : 1
          }
          return left.version < right.version ? -1 : left.version > right.version ? 1 : 0
        })
        .map((row) => `${row.name}::${row.version}`)

    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, rows)
    await seedTx.commit()
    tnx = undefined

    try {
      for (const withDelimiter of [false, true]) {
        for (const order of ['asc', 'desc'] as const) {
          const result = await listAllVersions({
            prefix,
            with_delimiter: withDelimiter,
            noncurrentVersions: 'include',
            deleteMarkers: 'include',
            sortBy: { column: 'name', order },
            // The 100/101-version keys end exactly on or cross a 100-row page boundary.
            limit: 100,
          })
          const actual = result.objects.map((object) => `${object.name}::${object.version}`)

          expect(result.folders).toEqual([])
          expect(actual).toEqual(expectedFor(order))
          expect(new Set(actual).size).toBe(rows.length)
          expect(result.pages).toBe(Math.ceil(rows.length / 100))
        }
      }
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(
          db,
          'bucket2',
          keys.map((key) => `${prefix}${key.name}`)
        )
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  }, 20_000)

  test.each([
    ['flat asc', false, 'asc'],
    ['flat desc', false, 'desc'],
    ['delimiter asc', true, 'asc'],
    ['delimiter desc', true, 'desc'],
  ] as const)('does not skip versions whose archived_at values share a millisecond (%s)', async (_path, withDelimiter, order) => {
    const runId = randomUUID()
    const objectName = `authenticated/microsecond-cursor-${runId}.png`
    const rows: Array<Partial<Obj> & { bucket_id: string; name: string }> = [
      {
        bucket_id: 'bucket2',
        name: objectName,
        version: 'current',
        archived_at: null,
        is_versioned: true,
        is_delete_marker: false,
      },
      // These retain distinct PostgreSQL microseconds when sent as query
      // parameters, but all serialize to the same JavaScript millisecond.
      // Version must therefore be the final cursor/order tiebreaker.
      {
        bucket_id: 'bucket2',
        name: objectName,
        version: 'archived-a',
        archived_at: '2024-06-01T00:00:00.123789Z',
        is_versioned: true,
        is_delete_marker: false,
      },
      {
        bucket_id: 'bucket2',
        name: objectName,
        version: 'archived-b',
        archived_at: '2024-06-01T00:00:00.123456Z',
        is_versioned: true,
        is_delete_marker: false,
      },
      {
        bucket_id: 'bucket2',
        name: objectName,
        version: 'archived-c',
        archived_at: '2024-06-01T00:00:00.123123Z',
        is_versioned: true,
        is_delete_marker: false,
      },
    ]
    const seedTx = await getSuperuserPostgrestClient()
    await insertObjects(seedTx, rows)
    await seedTx.commit()
    tnx = undefined

    try {
      const result = await listAllVersions({
        prefix: objectName,
        with_delimiter: withDelimiter,
        noncurrentVersions: 'include',
        sortBy: { column: 'name', order },
        limit: 1,
      })

      expect(result.pages).toBe(4)
      expect(result.objects.map((object) => object.version)).toEqual([
        'current',
        'archived-a',
        'archived-b',
        'archived-c',
      ])
      expect(new Set(result.objects.map((object) => object.version)).size).toBe(4)
    } finally {
      const cleanupTx = await getSuperuserPostgrestClient()
      await withDeleteEnabled(cleanupTx, async (db) => {
        await deleteObjectsByName(db, 'bucket2', objectName)
      })
      await cleanupTx.commit()
      tnx = undefined
    }
  })

  describe('continuation tokens lock noncurrentVersions/deleteMarkers', () => {
    async function seedFourVersionKey(objectName: string, baseTime: number) {
      const seedTx = await getSuperuserPostgrestClient()
      await insertObjects(seedTx, buildVersionRows('bucket2', objectName, 4, baseTime))
      await seedTx.commit()
      tnx = undefined
    }

    async function seedFourVersionKeyWithMarkers(objectName: string, baseTime: number) {
      const seedTx = await getSuperuserPostgrestClient()
      await insertObjects(seedTx, buildVersionRows('bucket2', objectName, 4, baseTime))
      await seedTx.query(
        `UPDATE storage.objects
         SET is_delete_marker = true
         WHERE bucket_id = $1 AND name = $2
           AND (version LIKE 'v0-%' OR version LIKE 'v1-%')`,
        ['bucket2', objectName]
      )
      await seedTx.commit()
      tnx = undefined
    }

    test('an omitted filter on page 2 inherits the token, still returning every remaining version', async () => {
      const runId = randomUUID()
      const objectName = `authenticated/lock-inherit-${runId}.png`
      await seedFourVersionKey(objectName, Date.parse('2024-03-01T00:00:00.000Z'))

      try {
        const page1 = await appInstance.inject({
          method: 'POST',
          url: '/object/list-v2/bucket2',
          headers: { authorization: `Bearer ${await serviceKeyAsync}` },
          payload: { prefix: objectName, noncurrentVersions: 'include', limit: 1 },
        })
        expect(page1.statusCode).toBe(200)
        const body1 = page1.json<{ hasNext: boolean; nextCursor?: string; objects: Obj[] }>()
        expect(body1.hasNext).toBe(true)

        // Page 2 deliberately omits noncurrentVersions entirely.
        const page2 = await appInstance.inject({
          method: 'POST',
          url: '/object/list-v2/bucket2',
          headers: { authorization: `Bearer ${await serviceKeyAsync}` },
          payload: { prefix: objectName, cursor: body1.nextCursor },
        })
        expect(page2.statusCode).toBe(200)
        const body2 = page2.json<{ objects: Obj[] }>()

        // Still 'include' behavior inherited from the token - not reverted
        // to current-only, and no versions from this key were skipped.
        const versions = [...body1.objects, ...body2.objects].map((o) => o.version)
        expect(new Set(versions).size).toBe(4)
      } finally {
        const cleanupTx = await getSuperuserPostgrestClient()
        await withDeleteEnabled(cleanupTx, async (db) => {
          await deleteObjectsByName(db, 'bucket2', objectName)
        })
        await cleanupTx.commit()
        tnx = undefined
      }
    })

    test('an explicitly resent, matching filter on page 2 is accepted', async () => {
      const runId = randomUUID()
      const objectName = `authenticated/lock-match-${runId}.png`
      await seedFourVersionKey(objectName, Date.parse('2024-03-02T00:00:00.000Z'))

      try {
        const page1 = await appInstance.inject({
          method: 'POST',
          url: '/object/list-v2/bucket2',
          headers: { authorization: `Bearer ${await serviceKeyAsync}` },
          payload: { prefix: objectName, noncurrentVersions: 'include', limit: 1 },
        })
        const body1 = page1.json<{ nextCursor?: string }>()

        const page2 = await appInstance.inject({
          method: 'POST',
          url: '/object/list-v2/bucket2',
          headers: { authorization: `Bearer ${await serviceKeyAsync}` },
          payload: {
            prefix: objectName,
            noncurrentVersions: 'include',
            cursor: body1.nextCursor,
          },
        })
        expect(page2.statusCode).toBe(200)
      } finally {
        const cleanupTx = await getSuperuserPostgrestClient()
        await withDeleteEnabled(cleanupTx, async (db) => {
          await deleteObjectsByName(db, 'bucket2', objectName)
        })
        await cleanupTx.commit()
        tnx = undefined
      }
    })

    test.each([
      {
        name: 'noncurrentVersions',
        page1: { noncurrentVersions: 'include' },
        page2: { noncurrentVersions: 'exclude' },
      },
      {
        name: 'exactMatch',
        page1: { noncurrentVersions: 'include', exactMatch: true },
        page2: { exactMatch: false },
      },
    ])('an explicitly resent, mismatched $name filter on page 2 is rejected', async ({
      name,
      page1: filters1,
      page2: filters2,
    }) => {
      const runId = randomUUID()
      const objectName = `authenticated/lock-mismatch-${runId}.png`
      await seedFourVersionKey(objectName, Date.parse('2024-03-03T00:00:00.000Z'))

      try {
        const page1 = await appInstance.inject({
          method: 'POST',
          url: '/object/list-v2/bucket2',
          headers: { authorization: `Bearer ${await serviceKeyAsync}` },
          payload: { prefix: objectName, limit: 1, ...filters1 },
        })
        const body1 = page1.json<{ nextCursor?: string }>()

        const page2 = await appInstance.inject({
          method: 'POST',
          url: '/object/list-v2/bucket2',
          headers: { authorization: `Bearer ${await serviceKeyAsync}` },
          payload: { prefix: objectName, cursor: body1.nextCursor, ...filters2 },
        })
        expect(page2.statusCode).toBe(400)
        expect(page2.json()).toMatchObject({
          message: expect.stringContaining(`${name} must match`),
        })
      } finally {
        const cleanupTx = await getSuperuserPostgrestClient()
        await withDeleteEnabled(cleanupTx, async (db) => {
          await deleteObjectsByName(db, 'bucket2', objectName)
        })
        await cleanupTx.commit()
        tnx = undefined
      }
    })

    test('an omitted deleteMarkers filter on page 2 inherits the token value', async () => {
      const runId = randomUUID()
      const objectName = `authenticated/lock-markers-inherit-${runId}.png`
      await seedFourVersionKeyWithMarkers(objectName, Date.parse('2024-03-05T00:00:00.000Z'))

      try {
        const page1 = await appInstance.inject({
          method: 'POST',
          url: '/object/list-v2/bucket2',
          headers: { authorization: `Bearer ${await serviceKeyAsync}` },
          payload: {
            prefix: objectName,
            noncurrentVersions: 'include',
            deleteMarkers: 'only',
            limit: 1,
          },
        })
        expect(page1.statusCode).toBe(200)
        const body1 = page1.json<{ hasNext: boolean; nextCursor?: string; objects: Obj[] }>()
        expect(body1.hasNext).toBe(true)

        const page2 = await appInstance.inject({
          method: 'POST',
          url: '/object/list-v2/bucket2',
          headers: { authorization: `Bearer ${await serviceKeyAsync}` },
          payload: {
            prefix: objectName,
            noncurrentVersions: 'include',
            cursor: body1.nextCursor,
          },
        })
        expect(page2.statusCode).toBe(200)
        const body2 = page2.json<{ objects: Obj[] }>()
        expect([...body1.objects, ...body2.objects]).toHaveLength(2)
        expect(
          [...body1.objects, ...body2.objects].every((object) => object.is_delete_marker)
        ).toBe(true)
      } finally {
        const cleanupTx = await getSuperuserPostgrestClient()
        await withDeleteEnabled(cleanupTx, async (db) => {
          await deleteObjectsByName(db, 'bucket2', objectName)
        })
        await cleanupTx.commit()
        tnx = undefined
      }
    })

    test('an explicitly resent, mismatched deleteMarkers filter on page 2 is rejected', async () => {
      const runId = randomUUID()
      const objectName = `authenticated/lock-markers-mismatch-${runId}.png`
      await seedFourVersionKeyWithMarkers(objectName, Date.parse('2024-03-06T00:00:00.000Z'))

      try {
        const page1 = await appInstance.inject({
          method: 'POST',
          url: '/object/list-v2/bucket2',
          headers: { authorization: `Bearer ${await serviceKeyAsync}` },
          payload: {
            prefix: objectName,
            noncurrentVersions: 'include',
            deleteMarkers: 'only',
            limit: 1,
          },
        })
        const body1 = page1.json<{ nextCursor?: string }>()

        const page2 = await appInstance.inject({
          method: 'POST',
          url: '/object/list-v2/bucket2',
          headers: { authorization: `Bearer ${await serviceKeyAsync}` },
          payload: {
            prefix: objectName,
            noncurrentVersions: 'include',
            deleteMarkers: 'exclude',
            cursor: body1.nextCursor,
          },
        })
        expect(page2.statusCode).toBe(400)
        expect(page2.json()).toMatchObject({
          message: expect.stringContaining('deleteMarkers must match'),
        })
      } finally {
        const cleanupTx = await getSuperuserPostgrestClient()
        await withDeleteEnabled(cleanupTx, async (db) => {
          await deleteObjectsByName(db, 'bucket2', objectName)
        })
        await cleanupTx.commit()
        tnx = undefined
      }
    })

    test.each([
      'n',
      'd',
    ])('a cursor with an unrecognized %s value is rejected rather than trusted', async (letter) => {
      const craftedCursor = Buffer.from(`l:whatever\n${letter}:garbage`).toString('base64')

      const response = await appInstance.inject({
        method: 'POST',
        url: '/object/list-v2/bucket2',
        headers: { authorization: `Bearer ${await serviceKeyAsync}` },
        payload: { prefix: 'authenticated/', cursor: craftedCursor },
      })

      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchObject({
        message: expect.stringContaining('continuation token'),
      })
    })
  })
})
