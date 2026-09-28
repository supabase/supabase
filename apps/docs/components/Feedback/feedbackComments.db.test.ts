import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from 'common'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// needs the local supabase stack
describe('feedback tables (local DB)', () => {
  let anon: SupabaseClient<Database>
  let serviceRole: SupabaseClient<Database>

  beforeAll(() => {
    anon = createClient<Database>(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
      global: { headers: { 'User-Agent': USER_AGENT } },
    })
    serviceRole = createClient<Database>(SUPABASE_URL, LOCAL_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })
  })

  afterAll(async () => {
    await serviceRole.from('feedback_comments').delete().like('page', `${PAGE_PREFIX}%`)
    await serviceRole.from('feedback').delete().like('page', `${PAGE_PREFIX}%`)
    if (uploadedPaths.length > 0) {
      await serviceRole.storage.from(IMAGES_BUCKET).remove(uploadedPaths)
    }
  })

  it('accepts an anon comment with pins and images', async () => {
    const { error } = await anon.from('feedback_comments').insert({
      page: testPage(),
      vote: 'no',
      comment: 'The install step is missing a flag',
      pins: makePins(2),
      images: [makeImagePath(), makeImagePath()],
      metadata: { query: { language: 'js' } },
    })
    expect(error).toBeNull()
  })

  it('accepts text-only feedback with null pins and images', async () => {
    const { error } = await anon.from('feedback_comments').insert({
      page: testPage(),
      vote: 'yes',
      comment: 'Clear and short',
      pins: null,
      images: null,
    })
    expect(error).toBeNull()
  })

  it('rejects an empty comment', async () => {
    const { error } = await anon.from('feedback_comments').insert({ page: testPage(), comment: '' })
    expect(error?.code).toBe('23514')
  })

  it('rejects a comment over 2000 characters', async () => {
    const { error } = await anon
      .from('feedback_comments')
      .insert({ page: testPage(), comment: 'a'.repeat(2001) })
    expect(error?.code).toBe('23514')
  })

  it('rejects 11 pins', async () => {
    const { error } = await anon
      .from('feedback_comments')
      .insert({ page: testPage(), comment: 'Too many pins', pins: makePins(11) })
    expect(error?.code).toBe('23514')
  })

  it('rejects 6 images', async () => {
    const { error } = await anon.from('feedback_comments').insert({
      page: testPage(),
      comment: 'Too many images',
      images: Array.from({ length: 6 }, makeImagePath),
    })
    expect(error?.code).toBe('23514')
  })

  it('lets anon upload a uuid-named image but not read or overwrite it', async () => {
    const path = makeImagePath()
    const bucket = anon.storage.from(IMAGES_BUCKET)

    const upload = await bucket.upload(path, PNG, { contentType: 'image/png' })
    expect(upload.error).toBeNull()
    uploadedPaths.push(path)

    const download = await bucket.download(path)
    expect(download.error).not.toBeNull()
    const overwrite = await bucket.upload(path, PNG, { contentType: 'image/png', upsert: true })
    expect(overwrite.error).not.toBeNull()
  })

  it('rejects uploads with a non-uuid name, a folder or a non-image type', async () => {
    const bucket = anon.storage.from(IMAGES_BUCKET)
    const png = { contentType: 'image/png' }

    expect((await bucket.upload('screenshot.png', PNG, png)).error).not.toBeNull()
    expect((await bucket.upload(`folder/${makeImagePath()}`, PNG, png)).error).not.toBeNull()
    const text = await bucket.upload(makeImagePath(), 'hello', { contentType: 'text/plain' })
    expect(text.error).not.toBeNull()
  })

  it('rejects pins given as an object with a check violation, not 22023', async () => {
    const { error } = await anon
      .from('feedback_comments')
      .insert({ page: testPage(), comment: 'Object pins', pins: { tag: 'pre' } })
    expect(error?.code).toBe('23514')
  })

  it('rejects a page over 512 characters on feedback_comments', async () => {
    const { error } = await anon
      .from('feedback_comments')
      .insert({ page: `${PAGE_PREFIX}${'a'.repeat(512)}`, comment: 'Long page' })
    expect(error?.code).toBe('23514')
  })

  it('rejects a page over 512 characters on feedback', async () => {
    const { error } = await anon
      .from('feedback')
      .insert({ page: `${PAGE_PREFIX}${'a'.repeat(512)}`, vote: 'yes' })
    expect(error?.code).toBe('23514')
  })

  it('rejects oversized feedback metadata', async () => {
    const { error } = await anon
      .from('feedback')
      .insert({ page: testPage(), vote: 'no', metadata: { query: 'x'.repeat(3000) } })
    expect(error?.code).toBe('23514')
  })

  it('accepts a dock vote row', async () => {
    const { error } = await anon
      .from('feedback')
      .insert({ page: testPage(), vote: 'no', metadata: { query: {}, source: 'dock' } })
    expect(error).toBeNull()
  })

  it('denies anon setting created_at', async () => {
    const { error } = await anon.from('feedback_comments').insert({
      page: testPage(),
      comment: 'Backdated',
      created_at: '2000-01-01T00:00:00Z',
    })
    expect(error?.code).toBe('42501')
  })

  it('denies anon setting user_agent', async () => {
    const { error } = await anon
      .from('feedback_comments')
      .insert({ page: testPage(), comment: 'Spoofed', user_agent: 'not-a-browser' })
    expect(error?.code).toBe('42501')
  })

  it('accepts title while the legacy comment modal still sends it', async () => {
    const { error } = await anon
      .from('feedback_comments')
      .insert({ page: testPage(), comment: 'Legacy modal', title: 'A title' })
    expect(error).toBeNull()
  })

  it('fills user_agent from the request header', async () => {
    const page = testPage()
    const { error } = await anon.from('feedback_comments').insert({ page, comment: 'UA check' })
    expect(error).toBeNull()

    const { data, error: readError } = await serviceRole
      .from('feedback_comments')
      .select('user_agent')
      .eq('page', page)
      .single()
    expect(readError).toBeNull()
    expect(data?.user_agent).toBe(USER_AGENT)
  })

  it('does not let anon read feedback comments', async () => {
    const { data, error } = await anon.from('feedback_comments').select('id').limit(1)
    // prod rls returns [] while the local acl denies, either way nothing is readable
    if (error) {
      expect(error.code).toBe('42501')
      return
    }
    expect(data).toEqual([])
  })
})

const SUPABASE_URL = 'http://localhost:54321'
// local-only demo key from supabase status
const LOCAL_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const RUN_ID = crypto.randomUUID()
const PAGE_PREFIX = `/__feedback-db-test__/${RUN_ID}/`
const USER_AGENT = `feedback-db-test/${RUN_ID}`

const IMAGES_BUCKET = 'docs-feedback-images'
const PNG = new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], { type: 'image/png' })
const uploadedPaths: string[] = []

const testPage = (): string => `${PAGE_PREFIX}${crypto.randomUUID()}`

const makeImagePath = (): string => `${crypto.randomUUID()}.png`

const makePins = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    tag: 'pre',
    role: 'code',
    name: null,
    text: `npm install @supabase/supabase-js ${i}`,
    heading: { id: 'install', text: 'Install' },
    pathname: '/guides/getting-started',
  }))
