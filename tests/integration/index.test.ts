import * as faker from 'faker'
import { createClient } from '@supabase/supabase-js'

const unauthorized = createClient(process.env.SUPABASE_URL, 'FAKE_KEY')
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY_ANON)
const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY_ADMIN)

test('Unauthorized', async () => {
  const { error } = await unauthorized.from('profiles').select()
  expect(error.message).toBe('Invalid authentication credentials')
})

test('Simple test', async () => {
  const fakeOne = {
    email: faker.internet.email().toLowerCase(),
    password: faker.internet.password(),
    username: faker.internet.userName(),
  }
  const fakeTwo = {
    email: faker.internet.email().toLowerCase(),
    password: faker.internet.password(),
    username: faker.internet.userName(),
  }
  const first = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY_ANON)
  const second = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY_ANON)

  const { user: firstUser } = await first.auth.signUp({
    email: fakeOne.email,
    password: fakeOne.password,
  })
  const { user: secondUser } = await second.auth.signUp({
    email: fakeTwo.email,
    password: fakeTwo.password,
  })
  expect(firstUser.email).toEqual(fakeOne.email)
  expect(secondUser.email).toEqual(fakeTwo.email)

  const { data: firstProfile } = await first
    .from('profiles')
    .insert({
      id: firstUser.id,
      username: fakeOne.username,
    })
    .single()
  expect(firstProfile.username).toMatch(fakeOne.username)

  // Cannot insert the second user on the first client
  const { error: secondProfile } = await first
    .from('profiles')
    .insert({
      id: secondUser.id,
      username: fakeTwo.username,
    })
    .single()
  expect(secondProfile.message).toMatch(/new row violates row-level security policy for table/)

  const { data: firstProfileList } = await first.from('profiles').select()
  const { data: secondProfileList } = await second.from('profiles').select()
  const { data: adminProfileList } = await admin.from('profiles').select()

  expect(firstProfileList.length).toBe(1)
  expect(secondProfileList.length).toBe(0)
  expect(adminProfileList.length).toBeGreaterThanOrEqual(1)
})
