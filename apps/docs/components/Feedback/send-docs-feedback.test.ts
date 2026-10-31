import { createClient } from '@supabase/supabase-js'
import type { Database } from 'common'
import { describe, expect, it } from 'vitest'

import { FeedbackSendError, sendDocsFeedback } from './send-docs-feedback'

const SEND_ARGS = {
  vote: 'no',
  page: '/guides/auth',
  draft: { comment: 'The redirect step is missing' },
  query: { language: 'js' },
  userId: 'user-1',
} as const

const makeFakeClient = ({ failingTables = [] }: { failingTables?: string[] } = {}) => {
  const requests: { table: string; body: unknown }[] = []

  const fakeFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const table = new URL(String(input)).pathname.replace('/rest/v1/', '')
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

const getSendError = async (promise: Promise<void>): Promise<FeedbackSendError> => {
  const error = await promise.then(() => null).catch((thrown: unknown) => thrown)
  if (!(error instanceof FeedbackSendError)) throw new Error('Expected a FeedbackSendError')
  return error
}

describe('sendDocsFeedback', () => {
  it('inserts the comment row, then the dock vote row', async () => {
    const { client, requests } = makeFakeClient()

    await sendDocsFeedback({ ...SEND_ARGS, client, progress: 'idle' })

    expect(requests).toEqual([
      {
        table: 'feedback_comments',
        body: {
          vote: 'no',
          page: '/guides/auth',
          comment: 'The redirect step is missing',
          metadata: { query: { language: 'js' } },
          user_id: 'user-1',
        },
      },
      {
        table: 'feedback',
        body: {
          vote: 'no',
          page: '/guides/auth',
          metadata: { query: { language: 'js' }, source: 'dock' },
        },
      },
    ])
  })

  it('skips the vote row when the comment insert fails', async () => {
    const { client, requests } = makeFakeClient({ failingTables: ['feedback_comments'] })

    const error = await getSendError(sendDocsFeedback({ ...SEND_ARGS, client, progress: 'idle' }))

    expect(error).toMatchObject({ kind: 'insert_failed', progress: 'idle' })
    expect(requests.map((request) => request.table)).toEqual(['feedback_comments'])
  })

  it('reports comment_saved when only the vote insert fails, and a retry resends only the vote', async () => {
    const failing = makeFakeClient({ failingTables: ['feedback'] })
    const error = await getSendError(
      sendDocsFeedback({ ...SEND_ARGS, client: failing.client, progress: 'idle' })
    )
    expect(error).toMatchObject({ kind: 'insert_failed', progress: 'comment_saved' })

    const retry = makeFakeClient()
    await sendDocsFeedback({ ...SEND_ARGS, client: retry.client, progress: 'comment_saved' })
    expect(retry.requests.map((request) => request.table)).toEqual(['feedback'])
  })

  it('rejects an invalid page before any insert, on a first send or a retry', async () => {
    const { client, requests } = makeFakeClient()

    for (const progress of ['idle', 'comment_saved'] as const) {
      const error = await getSendError(
        sendDocsFeedback({ ...SEND_ARGS, client, page: 'guides', progress })
      )
      expect(error.kind).toBe('invalid_payload')
    }
    expect(requests).toEqual([])
  })

  it('rejects a whitespace-only comment before any insert', async () => {
    const { client, requests } = makeFakeClient()

    const error = await getSendError(
      sendDocsFeedback({ ...SEND_ARGS, client, draft: { comment: '   ' }, progress: 'idle' })
    )

    expect(error.kind).toBe('invalid_payload')
    expect(requests).toEqual([])
  })
})
