import { randomUUID } from 'crypto'
import { afterAll, expect, test } from 'vitest'

import { getUsersCountSQL } from '../../../src/sql/studio/get-users-count'
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

    // Initialize minimal auth schema needed for user count tests
    await createDatabaseWithAuthSchema(db)

    try {
      await fn(db)
    } finally {
      await db.cleanup()
    }
  })
}

withTestDatabase('returns correct count with no filters', async ({ executeQuery }) => {
  // Insert 5 test users
  const users = Array.from({ length: 5 }, (_, i) => ({
    id: randomUUID(),
    email: `user${i + 1}@supabase.io`,
    instance_id: '00000000-0000-0000-0000-000000000000',
    aud: 'authenticated',
    role: 'authenticated',
  }))

  const values = users
    .map(
      (user) =>
        `('${user.id}', '${user.email}', '${user.instance_id}', '${user.aud}', '${user.role}', NOW())`
    )
    .join(', ')

  await executeQuery(`
    INSERT INTO auth.users (id, email, instance_id, aud, "role", created_at)
    VALUES ${values}
  `)

  const userCountSql = getUsersCountSQL({ forceExactCount: true })
  const result = await executeQuery<Array<{ count: number; is_estimate: boolean }>>(userCountSql)

  expect(result[0].count).toBe(5)
  expect(result[0].is_estimate).toBe(false)
})

withTestDatabase('filters verified users correctly', async ({ executeQuery }) => {
  const now = new Date().toISOString()

  // 2 verified users (email confirmed)
  await executeQuery(`
    INSERT INTO auth.users (id, email, instance_id, email_confirmed_at, created_at)
    VALUES 
      ('${randomUUID()}', 'verified1@supabase.io', '00000000-0000-0000-0000-000000000000', '${now}', NOW()),
      ('${randomUUID()}', 'verified2@supabase.io', '00000000-0000-0000-0000-000000000000', '${now}', NOW())
  `)

  // 1 verified user (phone confirmed)
  await executeQuery(`
    INSERT INTO auth.users (id, phone, instance_id, phone_confirmed_at, created_at)
    VALUES ('${randomUUID()}', '+1234567890', '00000000-0000-0000-0000-000000000000', '${now}', NOW())
  `)

  // 2 unverified users
  await executeQuery(`
    INSERT INTO auth.users (id, email, instance_id, created_at)
    VALUES 
      ('${randomUUID()}', 'unverified1@supabase.io', '00000000-0000-0000-0000-000000000000', NOW()),
      ('${randomUUID()}', 'unverified2@supabase.io', '00000000-0000-0000-0000-000000000000', NOW())
  `)

  // Count verified users
  const verifiedSql = getUsersCountSQL({ filter: 'verified', forceExactCount: true })
  const verifiedResult = await executeQuery<Array<{ count: number }>>(verifiedSql)
  expect(verifiedResult[0].count).toBe(3)

  // Count unverified users
  const unverifiedSql = getUsersCountSQL({ filter: 'unverified', forceExactCount: true })
  const unverifiedResult = await executeQuery<Array<{ count: number }>>(unverifiedSql)
  expect(unverifiedResult[0].count).toBe(2)
})

withTestDatabase('filters anonymous users correctly', async ({ executeQuery }) => {
  // 2 anonymous users
  await executeQuery(`
    INSERT INTO auth.users (id, email, instance_id, is_anonymous, created_at)
    VALUES 
      ('${randomUUID()}', 'anon1@supabase.io', '00000000-0000-0000-0000-000000000000', true, NOW()),
      ('${randomUUID()}', 'anon2@supabase.io', '00000000-0000-0000-0000-000000000000', true, NOW())
  `)

  // 3 regular users
  await executeQuery(`
    INSERT INTO auth.users (id, email, instance_id, is_anonymous, created_at)
    VALUES 
      ('${randomUUID()}', 'regular1@supabase.io', '00000000-0000-0000-0000-000000000000', false, NOW()),
      ('${randomUUID()}', 'regular2@supabase.io', '00000000-0000-0000-0000-000000000000', false, NOW()),
      ('${randomUUID()}', 'regular3@supabase.io', '00000000-0000-0000-0000-000000000000', false, NOW())
  `)

  const anonSql = getUsersCountSQL({ filter: 'anonymous', forceExactCount: true })
  const result = await executeQuery<Array<{ count: number }>>(anonSql)
  expect(result[0].count).toBe(2)
})

withTestDatabase('searches by keywords across multiple fields', async ({ executeQuery }) => {
  const searchUserId = randomUUID()

  await executeQuery(`
    INSERT INTO auth.users (id, email, phone, instance_id, created_at)
    VALUES 
      ('${searchUserId}', 'john.doe@supabase.io', NULL, '00000000-0000-0000-0000-000000000000', NOW()),
      ('${randomUUID()}', 'jane.smith@supabase.io', '+1234567890', '00000000-0000-0000-0000-000000000000', NOW()),
      ('${randomUUID()}', 'bob.jones@supabase.io', '+9876543210', '00000000-0000-0000-0000-000000000000', NOW())
  `)

  // Search by email keyword
  const emailSearchSql = getUsersCountSQL({ keywords: 'john', forceExactCount: true })
  const emailResult = await executeQuery<Array<{ count: number }>>(emailSearchSql)
  expect(emailResult[0].count).toBe(1)

  // Search by phone keyword
  const phoneSearchSql = getUsersCountSQL({ keywords: '1234', forceExactCount: true })
  const phoneResult = await executeQuery<Array<{ count: number }>>(phoneSearchSql)
  expect(phoneResult[0].count).toBe(1)

  // Search by ID (partial UUID)
  const idPrefix = searchUserId.substring(0, 8)
  const idSearchSql = getUsersCountSQL({ keywords: idPrefix, forceExactCount: true })
  const idResult = await executeQuery<Array<{ count: number }>>(idSearchSql)
  expect(idResult[0].count).toBe(1)
})

withTestDatabase('filters by provider correctly', async ({ executeQuery }) => {
  await executeQuery(`
    INSERT INTO auth.users (id, email, instance_id, raw_app_meta_data, created_at)
    VALUES 
      ('${randomUUID()}', 'google1@supabase.io', '00000000-0000-0000-0000-000000000000', '{"providers": ["google"]}', NOW()),
      ('${randomUUID()}', 'google2@supabase.io', '00000000-0000-0000-0000-000000000000', '{"providers": ["google"]}', NOW()),
      ('${randomUUID()}', 'github@supabase.io', '00000000-0000-0000-0000-000000000000', '{"providers": ["github"]}', NOW()),
      ('${randomUUID()}', 'email@supabase.io', '00000000-0000-0000-0000-000000000000', '{"providers": ["email"]}', NOW())
  `)

  // Filter by google provider
  const googleSql = getUsersCountSQL({ providers: ['google'], forceExactCount: true })
  const googleResult = await executeQuery<Array<{ count: number }>>(googleSql)
  expect(googleResult[0].count).toBe(2)

  // Filter by multiple providers
  const multipleSql = getUsersCountSQL({
    providers: ['google', 'github'],
    forceExactCount: true,
  })
  const multipleResult = await executeQuery<Array<{ count: number }>>(multipleSql)
  expect(multipleResult[0].count).toBe(3)
})

withTestDatabase('combines multiple filters correctly', async ({ executeQuery }) => {
  const now = new Date().toISOString()

  await executeQuery(`
    INSERT INTO auth.users (id, email, instance_id, email_confirmed_at, raw_app_meta_data, created_at)
    VALUES 
      ('${randomUUID()}', 'verified.google@supabase.io', '00000000-0000-0000-0000-000000000000', '${now}', '{"providers": ["google"]}', NOW()),
      ('${randomUUID()}', 'verified.github@supabase.io', '00000000-0000-0000-0000-000000000000', '${now}', '{"providers": ["github"]}', NOW()),
      ('${randomUUID()}', 'unverified.google@supabase.io', '00000000-0000-0000-0000-000000000000', NULL, '{"providers": ["google"]}', NOW())
  `)

  // Combine verified filter with provider and keyword
  const combinedSql = getUsersCountSQL({
    filter: 'verified',
    providers: ['google'],
    keywords: 'verified',
    forceExactCount: true,
  })
  const result = await executeQuery<Array<{ count: number }>>(combinedSql)
  expect(result[0].count).toBe(1)
})

withTestDatabase('optimized email search works correctly', async ({ executeQuery }) => {
  await executeQuery(`
    INSERT INTO auth.users (id, email, instance_id, created_at)
    VALUES 
      ('${randomUUID()}', 'alice@supabase.io', '00000000-0000-0000-0000-000000000000', NOW()),
      ('${randomUUID()}', 'bob@supabase.io', '00000000-0000-0000-0000-000000000000', NOW()),
      ('${randomUUID()}', 'alicia@supabase.io', '00000000-0000-0000-0000-000000000000', NOW())
  `)

  // Optimized search by email prefix
  const emailSql = getUsersCountSQL({ column: 'email', keywords: 'ali', forceExactCount: true })
  const result = await executeQuery<Array<{ count: number }>>(emailSql)
  expect(result[0].count).toBe(2) // alice and alicia
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
  const phoneSql = getUsersCountSQL({ column: 'phone', keywords: '+1234', forceExactCount: true })
  const result = await executeQuery<Array<{ count: number }>>(phoneSql)
  expect(result[0].count).toBe(2)
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
  const idSql = getUsersCountSQL({ column: 'id', keywords: 'abc123', forceExactCount: true })
  const result = await executeQuery<Array<{ count: number }>>(idSql)
  expect(result[0].count).toBe(2)

  // Exact UUID match
  const exactSql = getUsersCountSQL({ column: 'id', keywords: userId1, forceExactCount: true })
  const exactResult = await executeQuery<Array<{ count: number }>>(exactSql)
  expect(exactResult[0].count).toBe(1)
})

withTestDatabase('handles SAML provider filtering', async ({ executeQuery }) => {
  await executeQuery(`
    INSERT INTO auth.users (id, email, instance_id, raw_app_meta_data, created_at)
    VALUES 
      ('${randomUUID()}', 'sso1@supabase.io', '00000000-0000-0000-0000-000000000000', '{"providers": ["sso:provider-id-1"]}', NOW()),
      ('${randomUUID()}', 'sso2@supabase.io', '00000000-0000-0000-0000-000000000000', '{"providers": ["sso:provider-id-2"]}', NOW()),
      ('${randomUUID()}', 'google@supabase.io', '00000000-0000-0000-0000-000000000000', '{"providers": ["google"]}', NOW())
  `)

  // Filter by SAML provider (special handling for sso: prefix)
  const samlSql = getUsersCountSQL({ providers: ['saml 2.0'], forceExactCount: true })
  const result = await executeQuery<Array<{ count: number }>>(samlSql)
  expect(result[0].count).toBe(2)
})
