import { createClient } from '@supabase/supabase-js'
import type { Database } from 'common'
import { describe, expect, it } from 'vitest'

import type { FeedbackDraft } from './feedback-dock.reducer'
import type { FeedbackImage } from './feedback-images.utils'
import type { FeedbackPin } from './feedback-schema'
import {
  ATTACHMENT_BYTE_LIMITS,
  FeedbackSendError,
  isAttachmentsTooLarge,
  sendDocsFeedback,
} from './send-docs-feedback'

describe('isAttachmentsTooLarge', () => {
  it('accepts empty attachments and pins exactly at the byte cap', () => {
    expect(isAttachmentsTooLarge({ pins: [] })).toBe(false)
    expect(isAttachmentsTooLarge({ pins: [pinOfBytes(ATTACHMENT_BYTE_LIMITS.pins)] })).toBe(false)
  })

  it('rejects pins one byte over the cap', () => {
    expect(isAttachmentsTooLarge({ pins: [pinOfBytes(ATTACHMENT_BYTE_LIMITS.pins + 1)] })).toBe(
      true
    )
  })

  it('counts UTF-8 bytes, not characters', () => {
    // 'é' is 2 bytes, under the cap in characters but over it in bytes
    const pin = { ...PIN, text: 'é'.repeat(ATTACHMENT_BYTE_LIMITS.pins / 2) }
    expect(isAttachmentsTooLarge({ pins: [pin] })).toBe(true)
  })
})

describe('sendDocsFeedback', () => {
  it('inserts the comment row, then the dock vote row', async () => {
    const { client, requests } = makeFakeClient()

    await sendDocsFeedback({ ...SEND_ARGS, client, progress: 'idle' })

    expect(requests.map((request) => request.table)).toEqual(['feedback_comments', 'feedback'])
    expect(requests[0].body).toEqual({
      vote: 'no',
      page: '/guides/auth',
      comment: 'The redirect step is missing',
      pins: [PIN],
      images: [],
      metadata: { query: { language: 'js' } },
      user_id: 'user-1',
    })
    expect(requests[1].body).toEqual({
      vote: 'no',
      page: '/guides/auth',
      metadata: { query: { language: 'js' }, source: 'dock' },
    })
  })

  it('never sends created_at or user_agent', async () => {
    const { client, requests } = makeFakeClient()

    await sendDocsFeedback({ ...SEND_ARGS, client, progress: 'idle' })

    for (const { body } of requests) {
      expect(body).not.toHaveProperty('created_at')
      expect(body).not.toHaveProperty('date_created')
      expect(body).not.toHaveProperty('user_agent')
    }
  })

  it('skips the vote row when the comment insert fails', async () => {
    const { client, requests } = makeFakeClient({ failingTables: ['feedback_comments'] })

    const error = await getSendError(sendDocsFeedback({ ...SEND_ARGS, client, progress: 'idle' }))

    expect(error.kind).toBe('insert_failed')
    expect(error.progress).toBe('idle')
    expect(requests.map((request) => request.table)).toEqual(['feedback_comments'])
  })

  it('reports comment_saved when only the vote insert fails', async () => {
    const { client, requests } = makeFakeClient({ failingTables: ['feedback'] })

    const error = await getSendError(sendDocsFeedback({ ...SEND_ARGS, client, progress: 'idle' }))

    expect(error.kind).toBe('insert_failed')
    expect(error.progress).toBe('comment_saved')
    expect(requests.map((request) => request.table)).toEqual(['feedback_comments', 'feedback'])
  })

  it('resends only the vote row on retry from comment_saved', async () => {
    const { client, requests } = makeFakeClient()

    await sendDocsFeedback({ ...SEND_ARGS, client, progress: 'comment_saved' })

    expect(requests.map((request) => request.table)).toEqual(['feedback'])
  })

  it('rejects oversized attachments before any insert', async () => {
    const { client, requests } = makeFakeClient()
    const bigPin = { ...PIN, text: 'x'.repeat(80), name: 'y'.repeat(120) }
    const draft = { ...DRAFT, pins: Array.from({ length: 60 }, () => bigPin) }

    const error = await getSendError(
      sendDocsFeedback({ ...SEND_ARGS, client, draft, progress: 'idle' })
    )

    expect(error.kind).toBe('attachments_too_large')
    expect(requests).toEqual([])
  })

  it('uploads images before the comment row and stores their paths', async () => {
    const { client, requests } = makeFakeClient()
    const draft = { ...DRAFT, images: [IMAGE] }

    await sendDocsFeedback({ ...SEND_ARGS, client, draft, progress: 'idle' })

    expect(requests.map((request) => request.table)).toEqual([
      `storage:docs-feedback-images/${IMAGE.path}`,
      'feedback_comments',
      'feedback',
    ])
    expect(requests[1].body).toMatchObject({ images: [IMAGE.path] })
  })

  it('skips both rows when an image upload fails', async () => {
    const { client, requests } = makeFakeClient({ uploadResponse: 'error' })
    const draft = { ...DRAFT, images: [IMAGE] }

    const error = await getSendError(
      sendDocsFeedback({ ...SEND_ARGS, client, draft, progress: 'idle' })
    )

    expect(error.kind).toBe('upload_failed')
    expect(error.progress).toBe('idle')
    expect(requests.map((request) => request.table)).toEqual([
      `storage:docs-feedback-images/${IMAGE.path}`,
    ])
  })

  it('treats an image a failed attempt already stored as uploaded', async () => {
    const { client, requests } = makeFakeClient({ uploadResponse: 'duplicate' })
    const draft = { ...DRAFT, images: [IMAGE] }

    await sendDocsFeedback({ ...SEND_ARGS, client, draft, progress: 'idle' })

    expect(requests.map((request) => request.table)).toEqual([
      `storage:docs-feedback-images/${IMAGE.path}`,
      'feedback_comments',
      'feedback',
    ])
  })

  it('rejects a whitespace-only comment before any insert', async () => {
    const { client, requests } = makeFakeClient()
    const draft = { ...DRAFT, comment: '   ' }

    const error = await getSendError(
      sendDocsFeedback({ ...SEND_ARGS, client, draft, progress: 'idle' })
    )

    expect(error.kind).toBe('invalid_payload')
    expect(requests).toEqual([])
  })
})

const PIN: FeedbackPin = {
  pathname: '/guides/auth',
  tag: 'pre',
  role: 'code',
  name: null,
  text: 'npm install @supabase/supabase-js',
  headingId: 'install',
  headingText: 'Install',
}

const DRAFT: FeedbackDraft = { comment: 'The redirect step is missing', pins: [PIN], images: [] }

const IMAGE: FeedbackImage = {
  path: '0f8e1c2a-3b4d-4e5f-8a9b-0c1d2e3f4a5b.png',
  file: new File(['png'], 'screenshot.png', { type: 'image/png' }),
}

const SEND_ARGS = {
  vote: 'no',
  page: '/guides/auth',
  draft: DRAFT,
  query: { language: 'js' },
  userId: 'user-1',
} as const

// the size check skips field validation, so a long text pads the payload
const pinOfBytes = (bytes: number): FeedbackPin => {
  const overhead = JSON.stringify([{ ...PIN, text: '' }]).length
  return { ...PIN, text: 'a'.repeat(bytes - overhead) }
}

const makeFakeClient = ({
  failingTables = [],
  uploadResponse = 'ok',
}: {
  failingTables?: string[]
  uploadResponse?: 'ok' | 'error' | 'duplicate'
} = {}) => {
  const requests: { table: string; body: unknown }[] = []

  const fakeFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const { pathname } = new URL(String(input))
    if (pathname.startsWith(STORAGE_OBJECT_PREFIX)) {
      requests.push({ table: `storage:${pathname.replace(STORAGE_OBJECT_PREFIX, '')}`, body: null })
      return STORAGE_RESPONSES[uploadResponse]()
    }

    const table = pathname.replace('/rest/v1/', '')
    requests.push({ table, body: JSON.parse(String(init?.body)) })

    if (failingTables.includes(table)) {
      return Response.json({ code: '23514', message: 'check violation' }, { status: 400 })
    }
    return new Response(null, { status: 201 })
  }

  const client = createClient<Database>('http://fake.local', 'anon-key', {
    auth: { persistSession: false },
    global: { fetch: fakeFetch },
  })

  return { client, requests }
}

const STORAGE_OBJECT_PREFIX = '/storage/v1/object/'

// storage servers report a duplicate as http 400 with statusCode '409' in the body
const STORAGE_RESPONSES = {
  ok: () => Response.json({ Key: 'key', Id: 'id' }),
  error: () =>
    Response.json({ statusCode: '500', error: 'Internal', message: 'boom' }, { status: 500 }),
  duplicate: () =>
    Response.json(
      { statusCode: '409', error: 'Duplicate', message: 'The resource already exists' },
      { status: 400 }
    ),
}

const getSendError = async (promise: Promise<void>): Promise<FeedbackSendError> => {
  const error = await promise.then(() => null).catch((thrown: unknown) => thrown)
  if (!(error instanceof FeedbackSendError)) throw new Error('Expected a FeedbackSendError')
  return error
}
