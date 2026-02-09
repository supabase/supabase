import { randomUUID } from 'crypto'
import { afterAll, expect, test } from 'vitest'

import { getPaginatedUsersSQL } from '../../../src/sql/studio/get-users-paginated'
import { cleanupRoot, createDatabaseWithAuthSchema, createTestDatabase } from '../../db/utils'

afterAll(async () => {
  await cleanupRoot()
})

const withTestDatabase = (
  name: string,
  fn: (db: Awaited<ReturnType<typeof createTestDatabase>>) => Promise<void>
) => {
  test(name, async () => {
    const db = await createTestDatabase()

    // Initialize minimal auth schema needed for user pagination tests
    await createDatabaseWithAuthSchema(db, { includeIdentities: true })

    try {
      await fn(db)
    } finally {
      await db.cleanup()
    }
  })
}

withTestDatabase('returns paginated users with default settings', async ({ executeQuery }) => {
  // Insert 10 users with different created_at times
  for (let i = 0; i < 10; i++) {
    await executeQuery(`
      INSERT INTO auth.users (id, email, instance_id, created_at)
      VALUES (
        '${randomUUID()}',
        'user${i}@supabase.io',
        '00000000-0000-0000-0000-000000000000',
        NOW() + INTERVAL '${i} minutes'
      )
    `)
  }

  // Get first page (default limit 50, page 0)
  const sql = getPaginatedUsersSQL({ sort: 'created_at', order: 'desc' })
  const result = await executeQuery<Array<{ email: string }>>(sql)

  expect(result.length).toBe(10)
  // Should be ordered by created_at desc, so user9 should be first
  expect(result[0].email).toBe('user9@supabase.io')
  expect(result[9].email).toBe('user0@supabase.io')
})

withTestDatabase('respects custom limit and pagination', async ({ executeQuery }) => {
  // Insert 30 users
  for (let i = 0; i < 30; i++) {
    await executeQuery(`
      INSERT INTO auth.users (id, email, instance_id, created_at)
      VALUES (
        '${randomUUID()}',
        'user${String(i).padStart(2, '0')}@supabase.io',
        '00000000-0000-0000-0000-000000000000',
        NOW() + INTERVAL '${i} minutes'
      )
    `)
  }

  // Get page 1 with limit 10 (should skip first 10, get next 10)
  const sql = getPaginatedUsersSQL({ sort: 'created_at', order: 'desc', limit: 10, page: 1 })
  const result = await executeQuery<Array<{ email: string }>>(sql)

  expect(result.length).toBe(10)
  // Page 1 should start at user19 (0-indexed, skipping first 10)
  expect(result[0].email).toBe('user19@supabase.io')
  expect(result[9].email).toBe('user10@supabase.io')
})

withTestDatabase('sorts by email in ascending order', async ({ executeQuery }) => {
  await executeQuery(`
    INSERT INTO auth.users (id, email, instance_id, created_at)
    VALUES 
      ('${randomUUID()}', 'charlie@supabase.io', '00000000-0000-0000-0000-000000000000', NOW()),
      ('${randomUUID()}', 'alice@supabase.io', '00000000-0000-0000-0000-000000000000', NOW()),
      ('${randomUUID()}', 'bob@supabase.io', '00000000-0000-0000-0000-000000000000', NOW())
  `)

  const sql = getPaginatedUsersSQL({ sort: 'email', order: 'asc', limit: 10 })
  const result = await executeQuery<Array<{ email: string }>>(sql)

  expect(result.length).toBe(3)
  expect(result[0].email).toBe('alice@supabase.io')
  expect(result[1].email).toBe('bob@supabase.io')
  expect(result[2].email).toBe('charlie@supabase.io')
})

withTestDatabase('filters by keywords across multiple fields', async ({ executeQuery }) => {
  const searchUserId = randomUUID()

  await executeQuery(`
    INSERT INTO auth.users (id, email, phone, instance_id, raw_user_meta_data, created_at)
    VALUES 
      ('${searchUserId}', 'john.doe@supabase.io', NULL, '00000000-0000-0000-0000-000000000000', '{"full_name": "John Doe"}', NOW()),
      ('${randomUUID()}', 'jane.smith@supabase.io', '+1234567890', '00000000-0000-0000-0000-000000000000', '{"full_name": "Jane Smith"}', NOW()),
      ('${randomUUID()}', 'bob.jones@supabase.io', '+9876543210', '00000000-0000-0000-0000-000000000000', '{"full_name": "Bob Jones"}', NOW())
  `)

  // Search by keyword "john" - should find john.doe by email
  const emailSql = getPaginatedUsersSQL({ sort: 'created_at', order: 'desc', keywords: 'john' })
  const emailResult = await executeQuery<Array<{ email: string }>>(emailSql)
  expect(emailResult.length).toBe(1)
  expect(emailResult[0].email).toBe('john.doe@supabase.io')

  // Search by phone
  const phoneSql = getPaginatedUsersSQL({ sort: 'created_at', order: 'desc', keywords: '1234' })
  const phoneResult = await executeQuery<Array<{ phone: string }>>(phoneSql)
  expect(phoneResult.length).toBe(1)
  expect(phoneResult[0].phone).toBe('+1234567890')

  // Search by ID prefix
  const idPrefix = searchUserId.substring(0, 8)
  const idSql = getPaginatedUsersSQL({ sort: 'created_at', order: 'desc', keywords: idPrefix })
  const idResult = await executeQuery<Array<{ email: string }>>(idSql)
  expect(idResult.length).toBe(1)
  expect(idResult[0].email).toBe('john.doe@supabase.io')
})

withTestDatabase('filters verified and unverified users', async ({ executeQuery }) => {
  const now = new Date().toISOString()

  await executeQuery(`
    INSERT INTO auth.users (id, email, instance_id, email_confirmed_at, created_at)
    VALUES 
      ('${randomUUID()}', 'verified1@supabase.io', '00000000-0000-0000-0000-000000000000', '${now}', NOW()),
      ('${randomUUID()}', 'verified2@supabase.io', '00000000-0000-0000-0000-000000000000', '${now}', NOW()),
      ('${randomUUID()}', 'unverified@supabase.io', '00000000-0000-0000-0000-000000000000', NULL, NOW())
  `)

  // Filter verified users
  const verifiedSql = getPaginatedUsersSQL({
    sort: 'created_at',
    order: 'desc',
    verified: 'verified',
  })
  const verifiedResult = await executeQuery<Array<{ email: string }>>(verifiedSql)
  expect(verifiedResult.length).toBe(2)

  // Filter unverified users
  const unverifiedSql = getPaginatedUsersSQL({
    sort: 'created_at',
    order: 'desc',
    verified: 'unverified',
  })
  const unverifiedResult = await executeQuery<Array<{ email: string }>>(unverifiedSql)
  expect(unverifiedResult.length).toBe(1)
  expect(unverifiedResult[0].email).toBe('unverified@supabase.io')
})

withTestDatabase('filters anonymous users', async ({ executeQuery }) => {
  await executeQuery(`
    INSERT INTO auth.users (id, email, instance_id, is_anonymous, created_at)
    VALUES 
      ('${randomUUID()}', 'anon1@supabase.io', '00000000-0000-0000-0000-000000000000', true, NOW()),
      ('${randomUUID()}', 'anon2@supabase.io', '00000000-0000-0000-0000-000000000000', true, NOW()),
      ('${randomUUID()}', 'regular@supabase.io', '00000000-0000-0000-0000-000000000000', false, NOW())
  `)

  const sql = getPaginatedUsersSQL({ sort: 'created_at', order: 'desc', verified: 'anonymous' })
  const result = await executeQuery<Array<{ email: string }>>(sql)
  expect(result.length).toBe(2)
})

withTestDatabase('filters by providers', async ({ executeQuery }) => {
  const user1 = randomUUID()
  const user2 = randomUUID()
  const user3 = randomUUID()

  await executeQuery(`
    INSERT INTO auth.users (id, email, instance_id, raw_app_meta_data, created_at)
    VALUES 
      ('${user1}', 'google1@supabase.io', '00000000-0000-0000-0000-000000000000', '{"providers": ["google"]}', NOW()),
      ('${user2}', 'google2@supabase.io', '00000000-0000-0000-0000-000000000000', '{"providers": ["google"]}', NOW()),
      ('${user3}', 'github@supabase.io', '00000000-0000-0000-0000-000000000000', '{"providers": ["github"]}', NOW())
  `)

  // Also insert identities for the users
  await executeQuery(`
    INSERT INTO auth.identities (id, user_id, provider, identity_data, created_at)
    VALUES 
      ('google1', '${user1}', 'google', '{}', NOW()),
      ('google2', '${user2}', 'google', '{}', NOW()),
      ('github1', '${user3}', 'github', '{}', NOW())
  `)

  // Filter by google provider
  const googleSql = getPaginatedUsersSQL({
    sort: 'created_at',
    order: 'desc',
    providers: ['google'],
  })
  const googleResult = await executeQuery<Array<{ email: string }>>(googleSql)
  expect(googleResult.length).toBe(2)

  // Filter by multiple providers
  const multipleSql = getPaginatedUsersSQL({
    sort: 'created_at',
    order: 'desc',
    providers: ['google', 'github'],
  })
  const multipleResult = await executeQuery<Array<{ email: string }>>(multipleSql)
  expect(multipleResult.length).toBe(3)
})

withTestDatabase('combines multiple filters', async ({ executeQuery }) => {
  const now = new Date().toISOString()

  await executeQuery(`
    INSERT INTO auth.users (id, email, instance_id, email_confirmed_at, raw_app_meta_data, created_at)
    VALUES 
      ('${randomUUID()}', 'verified.google@supabase.io', '00000000-0000-0000-0000-000000000000', '${now}', '{"providers": ["google"]}', NOW()),
      ('${randomUUID()}', 'verified.github@supabase.io', '00000000-0000-0000-0000-000000000000', '${now}', '{"providers": ["github"]}', NOW()),
      ('${randomUUID()}', 'unverified.google@supabase.io', '00000000-0000-0000-0000-000000000000', NULL, '{"providers": ["google"]}', NOW())
  `)

  // Combine verified filter with provider and keyword
  const sql = getPaginatedUsersSQL({
    sort: 'created_at',
    order: 'desc',
    keywords: 'verified',
    verified: 'verified',
    providers: ['google'],
  })
  const result = await executeQuery<Array<{ email: string }>>(sql)
  expect(result.length).toBe(1)
  expect(result[0].email).toBe('verified.google@supabase.io')
})

withTestDatabase('optimized email search works correctly', async ({ executeQuery }) => {
  await executeQuery(`
    INSERT INTO auth.users (id, email, instance_id, created_at)
    VALUES 
      ('${randomUUID()}', 'alice@supabase.io', '00000000-0000-0000-0000-000000000000', NOW()),
      ('${randomUUID()}', 'alicia@supabase.io', '00000000-0000-0000-0000-000000000000', NOW()),
      ('${randomUUID()}', 'bob@supabase.io', '00000000-0000-0000-0000-000000000000', NOW())
  `)

  // Optimized search by email prefix
  const sql = getPaginatedUsersSQL({
    sort: 'created_at',
    order: 'desc',
    column: 'email',
    keywords: 'ali',
    limit: 10,
  })
  const result = await executeQuery<Array<{ email: string }>>(sql)
  expect(result.length).toBe(2)
  expect(result[0].email).toBe('alice@supabase.io')
  expect(result[1].email).toBe('alicia@supabase.io')
})

withTestDatabase('optimized phone search works correctly', async ({ executeQuery }) => {
  await executeQuery(`
    INSERT INTO auth.users (id, phone, instance_id, created_at)
    VALUES 
      ('${randomUUID()}', '+1234567890', '00000000-0000-0000-0000-000000000000', NOW()),
      ('${randomUUID()}', '+1234999999', '00000000-0000-0000-0000-000000000000', NOW()),
      ('${randomUUID()}', '+9876543210', '00000000-0000-0000-0000-000000000000', NOW())
  `)

  // Optimized search by phone prefix
  const sql = getPaginatedUsersSQL({
    sort: 'created_at',
    order: 'desc',
    column: 'phone',
    keywords: '+1234',
    limit: 10,
  })
  const result = await executeQuery<Array<{ phone: string }>>(sql)
  expect(result.length).toBe(2)
})

withTestDatabase('optimized id search works correctly', async ({ executeQuery }) => {
  const userId1 = 'abc12300-0000-4000-8000-000000000001'
  const userId2 = 'abc12300-0000-4000-8000-000000000002'
  const userId3 = 'def45600-0000-4000-8000-000000000003'

  await executeQuery(`
    INSERT INTO auth.users (id, email, instance_id, created_at)
    VALUES 
      ('${userId1}', 'user1@supabase.io', '00000000-0000-0000-0000-000000000000', NOW()),
      ('${userId2}', 'user2@supabase.io', '00000000-0000-0000-0000-000000000000', NOW()),
      ('${userId3}', 'user3@supabase.io', '00000000-0000-0000-0000-000000000000', NOW())
  `)

  // Optimized search by id prefix
  const sql = getPaginatedUsersSQL({
    sort: 'created_at',
    order: 'desc',
    column: 'id',
    keywords: 'abc123',
    limit: 10,
  })
  const result = await executeQuery<Array<{ id: string }>>(sql)
  expect(result.length).toBe(2)
  expect(result[0].id).toBe(userId1)
  expect(result[1].id).toBe(userId2)

  // Exact UUID match
  const exactSql = getPaginatedUsersSQL({
    sort: 'created_at',
    order: 'desc',
    column: 'id',
    keywords: userId1,
    limit: 10,
  })
  const exactResult = await executeQuery<Array<{ id: string }>>(exactSql)
  expect(exactResult.length).toBe(1)
  expect(exactResult[0].id).toBe(userId1)
})

withTestDatabase('includes provider information from identities', async ({ executeQuery }) => {
  const userId = randomUUID()

  await executeQuery(`
    INSERT INTO auth.users (id, email, instance_id, created_at)
    VALUES ('${userId}', 'user@supabase.io', '00000000-0000-0000-0000-000000000000', NOW())
  `)

  // Insert multiple identities for the user
  await executeQuery(`
    INSERT INTO auth.identities (id, user_id, provider, identity_data, created_at)
    VALUES 
      ('google1', '${userId}', 'google', '{}', NOW()),
      ('github1', '${userId}', 'github', '{}', NOW())
  `)

  const sql = getPaginatedUsersSQL({ sort: 'created_at', order: 'desc', limit: 10 })
  const result = await executeQuery<Array<{ email: string; providers: string[] }>>(sql)

  expect(result.length).toBe(1)
  expect(result[0].email).toBe('user@supabase.io')
  expect(result[0].providers).toHaveLength(2)
  expect(result[0].providers).toContain('google')
  expect(result[0].providers).toContain('github')
})
