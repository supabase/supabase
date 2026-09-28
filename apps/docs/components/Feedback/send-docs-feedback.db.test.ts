import { createClient } from '@supabase/supabase-js'
import type { Database } from 'common'
import { afterAll, describe, expect, it } from 'vitest'

import { FEEDBACK_IMAGES_BUCKET } from './feedback-schema'
import { sendDocsFeedback } from './send-docs-feedback'

// needs the local supabase stack
describe('sendDocsFeedback (local DB)', () => {
  afterAll(async () => {
    const serviceRole = makeServiceRoleClient()
    await serviceRole.from('feedback_comments').delete().eq('page', PAGE)
    await serviceRole.from('feedback').delete().eq('page', PAGE)
    await serviceRole.storage.from(FEEDBACK_IMAGES_BUCKET).remove([IMAGE_PATH])
  })

  it('uploads the image, then writes one comment row and one dock vote row', async () => {
    const anon = createClient<Database>(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
    })

    await sendDocsFeedback({
      client: anon,
      vote: 'no',
      page: PAGE,
      draft: {
        comment: 'The install step is missing a flag',
        pins: [
          {
            pathname: '/guides/getting-started',
            tag: 'pre',
            role: 'code',
            name: null,
            text: 'npm install @supabase/supabase-js',
            headingId: 'install',
            headingText: 'Install',
          },
        ],
        images: [
          {
            path: IMAGE_PATH,
            file: new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'screenshot.png', {
              type: 'image/png',
            }),
          },
        ],
      },
      query: { language: 'js' },
      userId: null,
      progress: 'idle',
    })

    const serviceRole = makeServiceRoleClient()
    const [comments, votes] = await Promise.all([
      serviceRole.from('feedback_comments').select('vote, comment, pins, images').eq('page', PAGE),
      serviceRole.from('feedback').select('vote, metadata').eq('page', PAGE),
    ])

    expect(comments.error).toBeNull()
    expect(comments.data).toHaveLength(1)
    expect(comments.data?.[0]).toMatchObject({
      vote: 'no',
      comment: 'The install step is missing a flag',
      images: [IMAGE_PATH],
    })
    const stored = await serviceRole.storage.from(FEEDBACK_IMAGES_BUCKET).download(IMAGE_PATH)
    expect(stored.error).toBeNull()
    expect(votes.error).toBeNull()
    expect(votes.data).toEqual([
      { vote: 'no', metadata: { query: { language: 'js' }, source: 'dock' } },
    ])
  })
})

const SUPABASE_URL = 'http://localhost:54321'
// local-only demo key from supabase status
const LOCAL_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const PAGE = `/__send-docs-feedback-db-test__/${crypto.randomUUID()}`
const IMAGE_PATH = `${crypto.randomUUID()}.png`

const makeServiceRoleClient = () =>
  createClient<Database>(SUPABASE_URL, LOCAL_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
